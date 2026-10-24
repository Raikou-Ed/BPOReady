<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PreAssessmentController extends Controller
{
    public function analyze(Request $request)
    {
        $audio = $request->file('audio');
        $expectedText = (string) $request->input('expectedText', '');
        $durationSeconds = (int) $request->input('durationSeconds', 0);
        $transcript = (string) $request->input('transcript', '');

        if (!$audio) {
            return response()->json([
                'message' => 'No audio file was provided.',
            ], 422);
        }

        $apiKey = env('GEMINI_API_KEY');
        $model = env('GEMINI_MODEL', 'gemini-3.6-flash');
        if ($model === 'gemini-3.0-flash' || $model === 'gemini-2.0-flash') {
            $model = 'gemini-3.6-flash';
        }

        if (!$apiKey) {
            return response()->json([
                'speechAiAvailable' => false,
                'fallback' => true,
                'message' => 'Gemini API key is not configured on the backend yet.',
                'framework' => 'Standard Speech Evaluation',
                'criteria' => [
                    'pronunciation' => ['score' => null, 'weight' => 30, 'name' => 'Pronunciation', 'detail' => 'Vowel & consonant articulation'],
                    'fluency' => ['score' => null, 'weight' => 25, 'name' => 'Fluency', 'detail' => 'Rhythm, pacing & pause control'],
                    'sentenceMastery' => ['score' => null, 'weight' => 25, 'name' => 'Sentence Mastery', 'detail' => 'Grammar & structural accuracy'],
                    'vocabulary' => ['score' => null, 'weight' => 20, 'name' => 'Vocabulary', 'detail' => 'Word choice & passage coverage'],
                ],
            ]);
        }

        try {
            $audioPath = $audio->getRealPath();
            $base64Audio = base64_encode(file_get_contents($audioPath));
            $mimeType = $audio->getMimeType() ?: $audio->getClientMimeType() ?: 'audio/wav';
            $safeMimeType = in_array($mimeType, ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/webm', 'audio/mpeg', 'audio/mp3'], true)
                ? $mimeType
                : 'audio/wav';

            $browserTranscriptHint = trim($transcript) !== '' ? $transcript : 'No browser transcript available.';
            $payload = [
                'systemInstruction' => [
                    'parts' => [[
                        'text' => 'You are an automated speech-language evaluation engine calibrated to standardized BPO recruitment requirements. Judge the spoken reading against the provided passage across the 4 core criteria: 1) Pronunciation (30% weight: vowel/consonant articulation, phonetic clarity, syllable stress), 2) Fluency (25% weight: rhythm, flow, target pacing 115-145 WPM, penalizing unnatural pauses/dead air), 3) Sentence Mastery (25% weight: grammatical accuracy, clause completeness, filler-word control), and 4) Vocabulary (20% weight: contextual word precision and complete passage coverage). Be realistic and strict: benchmark a solid passing reading in the 76-85 range. Keep all scores between 0 and 100. Return strict JSON only, no markdown fences, no commentary.'
                    ]],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.1,
                ],
                'contents' => [[
                    'parts' => [
                        [
                            'text' => "Evaluate this spoken reading using the 4 core speech evaluation criteria: Pronunciation, Fluency, Sentence Mastery, and Vocabulary. Return strict JSON with this exact structure:\n{\n  \"transcript\": \"string\",\n  \"pronunciation\": number,\n  \"fluency\": number,\n  \"sentenceMastery\": number,\n  \"vocabulary\": number,\n  \"speakingPace\": number\n}\nExpected passage: {$expectedText}\nBrowser transcript hint: {$browserTranscriptHint}"
                        ],
                        [
                            'inline_data' => [
                                'mime_type' => $safeMimeType,
                                'data' => $base64Audio,
                            ],
                        ],
                    ],
                ]],
            ];

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->withOptions([
                'verify' => false,
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", $payload);

            if ($response->failed()) {
                throw new \Exception('Gemini request failed: ' . $response->body());
            }

            $result = $response->json();
            $usage = $result['usageMetadata'] ?? null;
            if ($usage) {
                Log::info("Gemini API Token Usage [PreAssessment - {$model}]: Prompt: " . ($usage['promptTokenCount'] ?? 0) . ", Output: " . ($usage['candidatesTokenCount'] ?? 0) . ", Total: " . ($usage['totalTokenCount'] ?? 0));
            }

            $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;
            $parsed = $this->extractJson($text, $transcript, $durationSeconds, $expectedText);
            if ($usage) {
                $parsed['usageMetadata'] = $usage;
            }

            if (isset($parsed['transcript']) && is_string($parsed['transcript']) && trim($parsed['transcript']) === '') {
                $parsed['transcript'] = trim($transcript) !== '' ? $transcript : 'No clear speech detected';
            }

            $coverageScore = $this->calculatePassageCoverage($parsed['transcript'] ?? $transcript, $expectedText);
            $parsed['vocabulary'] = isset($parsed['vocabulary']) && $parsed['vocabulary'] !== null
                ? (int) $parsed['vocabulary']
                : $coverageScore;

            $criteria = [
                'pronunciation' => [
                    'score' => (int) ($parsed['pronunciation'] ?? 0),
                    'weight' => 30,
                    'name' => 'Pronunciation',
                    'detail' => 'Articulation & vowel/consonant clarity',
                ],
                'fluency' => [
                    'score' => (int) ($parsed['fluency'] ?? $parsed['speakingPace'] ?? 0),
                    'weight' => 25,
                    'name' => 'Fluency',
                    'detail' => 'Rhythm, speech rate & pause control',
                ],
                'sentenceMastery' => [
                    'score' => (int) ($parsed['sentenceMastery'] ?? $parsed['clarityConfidence'] ?? 0),
                    'weight' => 25,
                    'name' => 'Sentence Mastery',
                    'detail' => 'Grammatical flow & filler control',
                ],
                'vocabulary' => [
                    'score' => (int) ($parsed['vocabulary'] ?? $coverageScore),
                    'weight' => 20,
                    'name' => 'Vocabulary',
                    'detail' => 'Lexical accuracy & passage coverage',
                ],
            ];

            $score = 0;
            foreach ($criteria as $item) {
                $score += $item['score'] * ($item['weight'] / 100);
            }
            $score = max(0, min(100, round($score)));
            $placedLevel = $this->levelFromScore($score);

            $applicantId = $request->input('applicant_id') ?: $request->input('userId');
            if ($applicantId && \Illuminate\Support\Facades\DB::table('users')->where('id', $applicantId)->exists()) {
                \Illuminate\Support\Facades\DB::table('pre_assessments')->insert([
                    'applicant_id' => $applicantId,
                    'paragraph_id' => 1,
                    'diagnostic_score' => $score,
                    'placed_level' => $placedLevel,
                    'status' => 'evaluated',
                    'taken_at' => now(),
                    'evaluated_at' => now(),
                ]);

                \Illuminate\Support\Facades\DB::table('users')
                    ->where('id', $applicantId)
                    ->update(['assigned_level' => $placedLevel, 'updated_at' => now()]);
            }

            return response()->json([
                'speechAiAvailable' => true,
                'fallback' => false,
                'framework' => 'Standard Speech Evaluation',
                'score' => $score,
                'placedLevel' => $placedLevel,
                'cefr' => $this->cefrFromScore($score),
                'transcript' => $parsed['transcript'] ?? $transcript,
                'criteria' => $criteria,
                'tokenUsage' => isset($parsed['usageMetadata']) ? [
                    'promptTokens' => $parsed['usageMetadata']['promptTokenCount'] ?? 0,
                    'candidatesTokens' => $parsed['usageMetadata']['candidatesTokenCount'] ?? 0,
                    'totalTokens' => $parsed['usageMetadata']['totalTokenCount'] ?? 0,
                ] : null,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'speechAiAvailable' => false,
                'fallback' => true,
                'message' => 'Gemini request failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function extractJson($text, $transcript, $durationSeconds, $expectedText): array
    {
        if (!$text) {
            $expectedWords = preg_split('/\s+/', strtolower(trim($expectedText)));
            $expectedWords = array_filter($expectedWords, fn ($word) => $word !== '');
            $spokenWords = preg_split('/\s+/', strtolower(trim($transcript)));
            $spokenWords = array_filter($spokenWords, fn ($word) => $word !== '');
            $matchedWords = 0;
            foreach ($expectedWords as $word) {
                if (in_array($word, $spokenWords, true)) {
                    $matchedWords++;
                }
            }
            $coverage = $expectedWords ? round(($matchedWords / count($expectedWords)) * 100) : 0;
            $fillerWords = preg_match_all('/\b(?:um|uh|erm|like|actually)\b/i', $transcript, $matches);
            $fillerScore = max(0, 100 - (($fillerWords ?? 0) * 12));
            $pace = $durationSeconds > 0 ? round((count($spokenWords) / $durationSeconds) * 60) : 0;
            $paceScore = max(0, min(100, 100 - abs($pace - 125) * 1.25));
            $completion = $durationSeconds >= 20 ? 100 : max(40, $durationSeconds * 5);

            $fluency = round($paceScore);
            $vocabulary = $coverage;
            $sentenceMastery = max(0, min(100, round(($fillerScore * 0.6) + ($coverage * 0.4))));
            $pronunciation = max(0, min(100, round(($coverage * 0.4) + ($paceScore * 0.3) + ($fillerScore * 0.3))));

            return [
                'transcript' => $transcript,
                'pronunciation' => $pronunciation,
                'fluency' => $fluency,
                'sentenceMastery' => $sentenceMastery,
                'vocabulary' => $vocabulary,
                'speakingPace' => round($paceScore),
                'passageCoverage' => $coverage,
                'fillerControl' => round($fillerScore),
                'completion' => round($completion),
            ];
        }

        $clean = trim($text);
        if (str_starts_with($clean, '```')) {
            $clean = preg_replace('/^```(?:json)?\s*/i', '', $clean);
            $clean = preg_replace('/\s*```$/', '', $clean);
        }

        $json = json_decode($clean, true);
        if (is_array($json)) {
            return $json;
        }

        preg_match('/\{.*\}/s', $clean, $matches);
        if (isset($matches[0])) {
            $json = json_decode($matches[0], true);
            if (is_array($json)) {
                return $json;
            }
        }

        return [
            'transcript' => $transcript,
            'pronunciation' => 0,
            'fluency' => 0,
            'sentenceMastery' => 0,
            'vocabulary' => 0,
            'speakingPace' => 0,
            'passageCoverage' => 0,
            'fillerControl' => 0,
            'completion' => 0,
        ];
    }

    private function calculatePassageCoverage(string $transcript, string $expectedText): int
    {
        $transcriptWords = preg_split('/\s+/', strtolower(trim($transcript ?? '')));
        $transcriptWords = is_array($transcriptWords) ? array_values(array_filter($transcriptWords, fn ($word) => $word !== '')) : [];

        $expectedWords = preg_split('/\s+/', strtolower(trim($expectedText ?? '')));
        $expectedWords = is_array($expectedWords) ? array_values(array_filter($expectedWords, fn ($word) => $word !== '')) : [];

        if (!$transcriptWords || !$expectedWords) {
            return 0;
        }

        $matched = 0;
        $lastIndex = 0;
        foreach ($expectedWords as $word) {
            $matchIndex = array_search($word, array_slice($transcriptWords, $lastIndex), true);
            if ($matchIndex !== false) {
                $matched++;
                $lastIndex += $matchIndex + 1;
            }
        }

        return (int) round(($matched / count($expectedWords)) * 100);
    }

    private function levelFromScore(int $score): string
    {
        if ($score <= 75) return 'easy';
        if ($score <= 89) return 'medium';
        return 'hard';
    }

    private function cefrFromScore(int $score): string
    {
        if ($score <= 75) return 'CEFR A2/B1 (Foundational Track)';
        if ($score <= 89) return 'CEFR B2 (BPO Benchmark - Qualified)';
        return 'CEFR C1/C2 (Advanced Voice Track)';
    }

    public function getUserAssessment($applicantId)
    {
        $assessment = \Illuminate\Support\Facades\DB::table('pre_assessments')
            ->where('applicant_id', $applicantId)
            ->orderByDesc('taken_at')
            ->first();

        if ($assessment) {
            return response()->json([
                'hasAssessment' => true,
                'id' => $assessment->id,
                'score' => (float) $assessment->diagnostic_score,
                'placedLevel' => strtolower((string) $assessment->placed_level),
                'status' => $assessment->status,
                'taken_at' => $assessment->taken_at,
            ]);
        }

        return response()->json([
            'hasAssessment' => false,
        ]);
    }

    public function saveResult(Request $request)
    {
        $request->merge([
            'placed_level' => strtolower((string) $request->input('placed_level', 'easy')),
        ]);

        $data = $request->validate([
            'applicant_id' => ['required', 'integer'],
            'score' => ['required', 'numeric', 'min:0', 'max:100'],
            'placed_level' => ['required', 'string', 'in:easy,medium,hard'],
            'paragraph_id' => ['nullable', 'integer'],
        ]);

        $applicantId = (int) $data['applicant_id'];
        $score = round((float) $data['score'], 2);
        $placedLevel = $data['placed_level'];

        $userExists = \Illuminate\Support\Facades\DB::table('users')->where('id', $applicantId)->exists();
        if (!$userExists) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Diagnostic Pre-Assessment is one-time: if one exists, keep the baseline intact or update status
        $existing = \Illuminate\Support\Facades\DB::table('pre_assessments')
            ->where('applicant_id', $applicantId)
            ->first();

        if ($existing) {
            \Illuminate\Support\Facades\DB::table('pre_assessments')
                ->where('id', $existing->id)
                ->update([
                    'diagnostic_score' => $score,
                    'placed_level' => $placedLevel,
                    'status' => 'evaluated',
                    'evaluated_at' => now(),
                ]);
        } else {
            \Illuminate\Support\Facades\DB::table('pre_assessments')->insert([
                'applicant_id' => $applicantId,
                'paragraph_id' => $data['paragraph_id'] ?? 1,
                'diagnostic_score' => $score,
                'placed_level' => $placedLevel,
                'status' => 'evaluated',
                'taken_at' => now(),
                'evaluated_at' => now(),
            ]);
        }

        // Only set assigned_level if user does not already have an unlocked higher tier
        $user = \Illuminate\Support\Facades\DB::table('users')->where('id', $applicantId)->first();
        $rankMap = ['easy' => 1, 'medium' => 2, 'hard' => 3];
        $currentRank = $rankMap[strtolower((string) ($user->assigned_level ?? 'easy'))] ?? 1;
        $newRank = $rankMap[$placedLevel] ?? 1;

        if ($newRank >= $currentRank) {
            \Illuminate\Support\Facades\DB::table('users')
                ->where('id', $applicantId)
                ->update([
                    'assigned_level' => $placedLevel,
                    'updated_at' => now(),
                ]);
        }

        return response()->json([
            'message' => 'Pre-assessment saved successfully.',
            'placed_level' => $placedLevel,
            'score' => $score,
        ]);
    }
}
