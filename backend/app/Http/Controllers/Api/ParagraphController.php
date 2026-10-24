<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paragraph;
use App\Models\ParagraphFeedback;
use App\Models\ParagraphReadingSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ParagraphController extends Controller
{
    public function index(Request $request)
    {
        $level = $request->query('level');
        $isAdmin = $request->query('admin') || $request->query('all');
        $query = Paragraph::query();
        if (!$isAdmin) {
            $query->where('is_active', true)
                  ->where(function ($q) {
                      $q->where('approval_status', 'approved')->orWhereNull('approval_status');
                  });
        }
        if ($level) {
            $query->where('difficulty', strtolower($level));
        }
        $items = $query->orderBy('id')->get();
        return response()->json($items);
    }

    public function show($id)
    {
        $p = Paragraph::find($id);
        if (!$p) return response()->json(['message' => 'Paragraph not found'], 404);
        return response()->json($p);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'title' => 'nullable|string',
            'content' => 'required|string',
            'difficulty' => 'required|in:easy,medium,hard',
            'created_by_user_id' => 'nullable|integer',
            'approval_status' => 'nullable|in:pending,approved,rejected',
        ]);
        if ($v->fails()) return response()->json(['errors' => $v->errors()], 422);

        $status = $request->input('approval_status', 'approved');
        $p = Paragraph::create([
            'title' => $request->input('title', 'Practice Passage'),
            'content' => $request->input('content'),
            'difficulty' => strtolower($request->input('difficulty')),
            'created_by_user_id' => $request->input('created_by_user_id'),
            'approval_status' => $status,
            'is_active' => $status === 'approved',
        ]);
        return response()->json($p, 201);
    }

    public function update(Request $request, $id)
    {
        $p = Paragraph::find($id);
        if (!$p) return response()->json(['message' => 'Paragraph not found'], 404);

        $data = $request->only(['title', 'content', 'difficulty', 'is_active', 'approval_status', 'reviewer_notes']);
        if (isset($data['difficulty'])) {
            $data['difficulty'] = strtolower($data['difficulty']);
        }
        $p->update($data);
        return response()->json($p);
    }

    public function destroy($id)
    {
        $p = Paragraph::find($id);
        if (!$p) return response()->json(['message' => 'Paragraph not found'], 404);
        $p->update(['is_active' => false]);
        return response()->json(['success' => true]);
    }

    public function submitReading(Request $request)
    {
        $paragraphId = $request->input('paragraphId') ?: $request->input('paragraph_id');
        $applicantId = $request->input('applicant_id') ?: $request->input('userId');
        if (!$applicantId || !\Illuminate\Support\Facades\DB::table('users')->where('id', $applicantId)->exists()) {
            $fallbackUser = \Illuminate\Support\Facades\DB::table('users')->first();
            $applicantId = $fallbackUser ? $fallbackUser->id : null;
        }

        $durationSeconds = (int) $request->input('durationSeconds', 0);
        $transcript = (string) $request->input('transcript', '');
        $expectedText = (string) $request->input('expectedText', '');
        $currentLevel = strtolower((string) $request->input('currentLevel', 'easy'));
        $clientScore = (float) $request->input('score', 0);
        $audio = $request->file('audio');

        if ($paragraphId) {
            $paragraph = Paragraph::find($paragraphId);
            if ($paragraph && empty($expectedText)) {
                $expectedText = $paragraph->content;
            }
        }

        $apiKey = env('GEMINI_API_KEY');
        $model = env('GEMINI_MODEL', 'gemini-3.6-flash');
        if ($model === 'gemini-3.0-flash' || $model === 'gemini-2.0-flash') {
            $model = 'gemini-3.6-flash';
        }

        $aiEvaluated = false;
        $evalResult = null;

        if ($apiKey && ($audio || !empty($transcript))) {
            try {
                $evalResult = $this->evaluateWithGemini($audio, $transcript, $expectedText, $durationSeconds, $apiKey, $model);
                if ($evalResult) {
                    $aiEvaluated = true;
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini Paragraph Reading evaluation error: ' . $e->getMessage());
            }
        }

        if ($aiEvaluated && $evalResult) {
            $pronunciationScore = min(100.0, max(0.0, (float) ($evalResult['pronunciation'] ?? 0)));
            $fluencyScore = min(100.0, max(0.0, (float) ($evalResult['fluency'] ?? $evalResult['speakingPace'] ?? 0)));
            $sentenceMasteryScore = min(100.0, max(0.0, (float) ($evalResult['sentenceMastery'] ?? $evalResult['clarityConfidence'] ?? 0)));
            $vocabularyScore = min(100.0, max(0.0, (float) ($evalResult['vocabulary'] ?? $evalResult['passageCoverage'] ?? 0)));
            $coverageScore = min(100.0, max(0.0, (float) ($evalResult['passageCoverage'] ?? $vocabularyScore)));

            if ($fluencyScore > 100) {
                $fluencyScore = ($fluencyScore >= 115 && $fluencyScore <= 145) ? 95.0 : 80.0;
            }

            // Safety rule: if candidate did not read the passage (< 15% coverage), score is strictly 0
            if ($coverageScore < 15 && $vocabularyScore < 15) {
                $score = 0;
                $pronunciationScore = 0;
                $fluencyScore = 0;
                $sentenceMasteryScore = 0;
                $vocabularyScore = 0;
                $feedbackText = 'The recorded audio did not match the required passage. Please read the passage text clearly from start to finish.';
                $suggestions = "Speak closer to the microphone.\nFollow the provided passage closely.\nAvoid background noise or unrelated speech.";
            } else {
                $score = ($pronunciationScore * 0.30) +
                         ($fluencyScore * 0.25) +
                         ($sentenceMasteryScore * 0.25) +
                         ($vocabularyScore * 0.20);
                $score = max(0, min(100, round($score, 2)));

                $feedbackText = $evalResult['feedbackText'] ?? 'Good reading pace and clear pronunciation throughout the passage.';
                $suggestions = is_array($evalResult['suggestions'] ?? null)
                    ? implode("\n", $evalResult['suggestions'])
                    : ($evalResult['suggestions'] ?? "Maintain clear enunciation on final consonants.\nPractice steady pacing without hesitations.");
            }

            $fillerWords = is_array($evalResult['fillerWords'] ?? null) ? $evalResult['fillerWords'] : [];
            $transcript = $evalResult['transcript'] ?? $transcript;
        } else {
            // Fallback heuristics using client score
            $score = $clientScore > 0 ? min(100, max(0, $clientScore)) : 0;
            $pronunciationScore = $score > 0 ? min(100.0, max(10.0, $score + 1)) : 0;
            $fluencyScore = $score > 0 ? min(100.0, max(10.0, $score - 1)) : 0;
            $sentenceMasteryScore = $score > 0 ? max(10.0, $score) : 0;
            $vocabularyScore = $score > 0 ? min(100.0, max(10.0, $score)) : 0;
            if ($score >= 76) {
                $feedbackText = 'Good reading pace and steady pronunciation throughout the passage. Your speech delivery was clear and confident.';
                $suggestions = "Maintain clear enunciation on final consonants.\nPractice continuous breathing to avoid abrupt pauses.\nTarget steady pacing between 115 and 145 words per minute.";
            } elseif ($score >= 50) {
                $feedbackText = 'Adequate reading attempt. Work on clearer articulation, smoother cadence, and eliminating pauses to reach the BPO hiring standard.';
                $suggestions = "Focus on steady pacing without pausing between phrases.\nEmphasize consonant clarity at the end of words.\nRe-read the passage aloud to build rhythmic fluency.";
            } elseif ($score > 0) {
                $feedbackText = 'Reading performance is significantly below passing benchmark. Frequent hesitations, missed words, or substantial pacing disfluencies were detected. Targeted practice is required before retrying.';
                $suggestions = "Read the passage silently two to three times before speaking aloud.\nFocus on pronouncing every word clearly rather than rushing.\nPractice reading short sentences smoothly without filler sounds.";
            } else {
                $feedbackText = 'No clear speech or passage match detected. Please re-read the passage aloud.';
                $suggestions = "Speak closer to the microphone.\nFollow the provided passage closely.\nAvoid background noise or unrelated speech.";
            }
            $fillerWords = [];
        }

        // Record session
        $session = ParagraphReadingSession::create([
            'applicant_id' => $applicantId,
            'paragraph_id' => $paragraphId,
            'duration_seconds' => $durationSeconds,
            'status' => 'submitted',
            'started_at' => now()->subSeconds(max(1, $durationSeconds)),
            'submitted_at' => now(),
        ]);

        // Record feedback
        $feedback = ParagraphFeedback::create([
            'reading_session_id' => $session->id,
            'filler_word_count' => count($fillerWords),
            'filler_words' => $fillerWords,
            'clarity_score' => min(100.0, max(0.0, (float) $pronunciationScore)),
            'confidence_score' => min(100.0, max(0.0, (float) $sentenceMasteryScore)),
            'pacing_score' => min(100.0, max(0.0, (float) $fluencyScore)),
            'volume_score' => 90.0,
            'grammar_score' => min(100.0, max(0.0, (float) $sentenceMasteryScore)),
            'feedback_text' => $feedbackText,
            'suggestions' => $suggestions,
            'created_at' => now(),
        ]);

        // Level progression and anti-demotion rule:
        // Easy (1): >= 76 unlocks Medium. Cannot skip directly to Hard.
        // Medium (2): >= 90 unlocks Hard.
        // Demotion is NEVER allowed.
        $rankMap = ['easy' => 1, 'medium' => 2, 'hard' => 3];
        $currentRank = $rankMap[$currentLevel] ?? 1;

        $user = $applicantId ? \Illuminate\Support\Facades\DB::table('users')->where('id', $applicantId)->first() : null;
        if ($user) {
            $dbRank = $rankMap[$user->assigned_level ?? 'easy'] ?? 1;
            $currentRank = max($currentRank, $dbRank);
        }

        $newLevel = null;
        if ($currentRank === 1 && $score >= 76) {
            $newLevel = 'medium';
        } elseif ($currentRank === 2 && $score >= 90) {
            $newLevel = 'hard';
        } elseif ($currentRank === 3) {
            $newLevel = 'hard';
        } else {
            $newLevel = array_search($currentRank, $rankMap, true) ?: 'easy';
        }

        if ($user && $newLevel && (($rankMap[$newLevel] ?? 1) > ($rankMap[$user->assigned_level ?? 'easy'] ?? 1))) {
            \Illuminate\Support\Facades\DB::table('users')
                ->where('id', $applicantId)
                ->update(['assigned_level' => $newLevel, 'updated_at' => now()]);
        }

        $criteria = [
            [
                'name' => 'Pronunciation',
                'value' => round($pronunciationScore),
                'weight' => 30,
                'contribution' => round($pronunciationScore * 0.30, 2),
                'detail' => $score === 0 ? 'Passage not read' : 'Articulation & sound clarity',
            ],
            [
                'name' => 'Fluency',
                'value' => round($fluencyScore),
                'weight' => 25,
                'contribution' => round($fluencyScore * 0.25, 2),
                'detail' => $score === 0 ? 'Passage not read' : 'Rhythm & pause control',
            ],
            [
                'name' => 'Sentence Mastery',
                'value' => round($sentenceMasteryScore),
                'weight' => 25,
                'contribution' => round($sentenceMasteryScore * 0.25, 2),
                'detail' => $score === 0 ? 'Passage not read' : 'Grammar & phrase structure',
            ],
            [
                'name' => 'Vocabulary',
                'value' => round($vocabularyScore),
                'weight' => 20,
                'contribution' => round($vocabularyScore * 0.20, 2),
                'detail' => $score === 0 ? '0% matched' : 'Passage lexical coverage',
            ],
        ];

        return response()->json([
            'success' => true,
            'aiEvaluated' => $aiEvaluated,
            'session_id' => $session->id,
            'score' => round($score, 2),
            'placedLevel' => $newLevel,
            'assigned_level' => $newLevel,
            'transcript' => $transcript,
            'feedbackText' => $feedbackText,
            'suggestions' => is_array($evalResult['suggestions'] ?? null)
                ? $evalResult['suggestions']
                : array_values(array_filter(array_map('trim', explode("\n", $suggestions)))),
            'criteria' => $criteria,
            'feedback' => $feedback,
            'tokenUsage' => isset($evalResult['usageMetadata']) ? [
                'promptTokens' => $evalResult['usageMetadata']['promptTokenCount'] ?? 0,
                'candidatesTokens' => $evalResult['usageMetadata']['candidatesTokenCount'] ?? 0,
                'totalTokens' => $evalResult['usageMetadata']['totalTokenCount'] ?? 0,
            ] : null,
        ], 201);
    }

    private function evaluateWithGemini($audio, string $transcript, string $expectedText, int $durationSeconds, string $apiKey, string $model): ?array
    {
        $parts = [];
        $browserTranscriptHint = trim($transcript) !== '' ? $transcript : 'No browser transcript available.';

        $parts[] = [
            'text' => "You are an expert speech-language and BPO communication assessor. Assess the spoken audio against the provided reading passage.\n\n"
                . "Evaluation Rubric (all numeric scores 0-100):\n"
                . "1. pronunciation: Clear enunciation of vowels and consonants, sound clarity, and syllable stress intelligibility (Weight: 30%).\n"
                . "2. fluency: Rhythm, natural flow, speaking pace (target 115-145 WPM), and pause/dead-air control (Weight: 25%).\n"
                . "3. sentenceMastery: Grammatical accuracy, phrase structure, coherence, and filler-word suppression (Weight: 25%).\n"
                . "4. vocabulary: Contextual word precision, appropriate lexical usage, and passage coverage (Weight: 20%).\n"
                . "5. passageCoverage: Percentage of expected words accurately spoken (0-100). CRITICAL: If audio is silent or unrelated words, passageCoverage MUST BE 0.\n"
                . "6. fillerWords: array of detected filler words (e.g. ['um', 'uh', 'like']).\n"
                . "7. feedbackText: 2 to 3 sentences of constructive, encouraging BPO coaching feedback evaluating the candidate's speech.\n"
                . "8. suggestions: an array of 2 to 3 actionable improvement tips for this candidate.\n\n"
                . "Return strict JSON with this exact structure:\n"
                . "{\n"
                . "  \"transcript\": \"string\",\n"
                . "  \"pronunciation\": number,\n"
                . "  \"fluency\": number,\n"
                . "  \"sentenceMastery\": number,\n"
                . "  \"vocabulary\": number,\n"
                . "  \"passageCoverage\": number,\n"
                . "  \"fillerWords\": [\"string\"],\n"
                . "  \"feedbackText\": \"string\",\n"
                . "  \"suggestions\": [\"string\"]\n"
                . "}\n\n"
                . "Expected passage: {$expectedText}\n"
                . "Browser transcript hint: {$browserTranscriptHint}"
        ];

        if ($audio && $audio->isValid()) {
            $audioPath = $audio->getRealPath();
            $base64Audio = base64_encode(file_get_contents($audioPath));
            $mimeType = $audio->getMimeType() ?: $audio->getClientMimeType() ?: 'audio/wav';
            $safeMimeType = in_array($mimeType, ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/ogg'], true)
                ? $mimeType
                : 'audio/wav';

            $parts[] = [
                'inline_data' => [
                    'mime_type' => $safeMimeType,
                    'data' => $base64Audio,
                ],
            ];
        }

        $payload = [
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature' => 0.1,
            ],
            'contents' => [
                [
                    'parts' => $parts,
                ],
            ],
        ];

        $models = array_unique([$model, 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash']);

        foreach ($models as $m) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->withOptions([
                    'verify' => false,
                    'timeout' => 25,
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$m}:generateContent?key={$apiKey}", $payload);

                if ($response->successful()) {
                    $data = $response->json();
                    $usage = $data['usageMetadata'] ?? null;
                    if ($usage) {
                        Log::info("Gemini API Token Usage [ParagraphReading - {$m}]: Prompt: " . ($usage['promptTokenCount'] ?? 0) . ", Output: " . ($usage['candidatesTokenCount'] ?? 0) . ", Total: " . ($usage['totalTokenCount'] ?? 0));
                    }

                    $rawText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($rawText) {
                        $clean = trim($rawText);
                        if (str_starts_with($clean, '```')) {
                            $clean = preg_replace('/^```(?:json)?\s*/i', '', $clean);
                            $clean = preg_replace('/\s*```$/', '', $clean);
                        }

                        $decoded = json_decode($clean, true);
                        if (is_array($decoded)) {
                            if ($usage) {
                                $decoded['usageMetadata'] = $usage;
                            }
                            return $decoded;
                        }

                        preg_match('/\{.*\}/s', $clean, $matches);
                        if (isset($matches[0])) {
                            $decoded = json_decode($matches[0], true);
                            if (is_array($decoded)) {
                                if ($usage) {
                                    $decoded['usageMetadata'] = $usage;
                                }
                                return $decoded;
                            }
                        }
                    }
                } else {
                    Log::warning("Gemini Paragraph Reading call to {$m} returned status: " . $response->getStatusCode());
                }
            } catch (\Throwable $e) {
                Log::warning("Gemini Paragraph Reading call to {$m} failed: " . $e->getMessage());
            }
        }

        return null;
    }
}
