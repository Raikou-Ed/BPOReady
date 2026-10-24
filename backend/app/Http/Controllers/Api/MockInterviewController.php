<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InterviewQuestion;
use App\Models\MockInterviewAnswer;
use App\Models\MockInterviewFeedback;
use App\Models\MockInterviewSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MockInterviewController extends Controller
{
    public function getQuestions(Request $request)
    {
        $type = $request->query('type', 'initial');
        $questions = InterviewQuestion::where('is_active', true)
            ->where('interview_type', $type)
            ->where(function ($q) {
                $q->where('approval_status', 'approved')->orWhereNull('approval_status');
            })
            ->orderBy('id')
            ->limit(5)
            ->get();

        return response()->json($questions);
    }

    public function submitSession(Request $request)
    {
        $v = Validator::make($request->all(), [
            'applicant_id' => 'required|integer',
            'interview_type' => 'required|in:initial,final',
            'answers' => 'required|array|min:1',
            'answers.*.question_id' => 'required|integer',
            'answers.*.question_order' => 'required|integer',
            'answers.*.answer_text' => 'nullable|string',
            'answers.*.duration_seconds' => 'nullable|integer',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $session = MockInterviewSession::create([
            'applicant_id' => $request->input('applicant_id'),
            'interview_type' => $request->input('interview_type'),
            'status' => 'submitted',
            'started_at' => now()->subMinutes(5),
            'submitted_at' => now(),
        ]);

        $totalWords = 0;
        $totalDuration = 0;
        $fillerCount = 0;
        $fillerMap = [];
        $qaList = [];

        foreach ($request->input('answers') as $ans) {
            $rawText = trim($ans['answer_text'] ?? '');
            MockInterviewAnswer::create([
                'mock_session_id' => $session->id,
                'question_id' => $ans['question_id'],
                'question_order' => $ans['question_order'],
                'answer_text' => $rawText,
                'duration_seconds' => $ans['duration_seconds'] ?? 0,
            ]);

            $qText = $ans['question_text'] ?? null;
            if (!$qText) {
                $qModel = InterviewQuestion::find($ans['question_id']);
                $qText = $qModel ? $qModel->question_text : "Interview Question {$ans['question_order']}";
            }

            $qaList[] = [
                'order' => $ans['question_order'],
                'question' => $qText,
                'answer' => $rawText,
                'duration' => (int) ($ans['duration_seconds'] ?? 0),
            ];

            $words = preg_split('/\s+/', strtolower($rawText));
            $words = array_filter($words, fn($w) => $w !== '');
            $totalWords += count($words);
            $totalDuration += (int)($ans['duration_seconds'] ?? 0);

            // Baseline filler detection
            preg_match_all('/\b(um|uh|uhm|ah|like|you know|actually|basically)\b/i', $rawText, $matches);
            if (!empty($matches[0])) {
                foreach ($matches[0] as $f) {
                    $fLower = strtolower($f);
                    $fillerCount++;
                    $fillerMap[$fLower] = ($fillerMap[$fLower] ?? 0) + 1;
                }
            }
        }

        $interviewType = $request->input('interview_type');
        $apiKey = env('GEMINI_API_KEY');
        $aiEvaluated = false;
        $geminiData = null;

        if ($apiKey) {
            $geminiData = $this->evaluateWithGemini($qaList, $interviewType, $apiKey);
            if ($geminiData) {
                $aiEvaluated = true;
            }
        }

        if ($aiEvaluated && $geminiData) {
            $clarityScore = max(0, min(100, (float) ($geminiData['clarity_score'] ?? 85)));
            $confidenceScore = max(0, min(100, (float) ($geminiData['confidence_score'] ?? 82)));
            $pacingScore = max(0, min(100, (float) ($geminiData['pacing_score'] ?? 86)));
            $grammarScore = max(0, min(100, (float) ($geminiData['grammar_score'] ?? 85)));
            $answerQuality = max(0, min(100, (float) ($geminiData['answer_quality_score'] ?? 84)));
            $overallScore = max(0, min(100, (float) ($geminiData['overall_score'] ?? round(
                ($clarityScore * 0.25) +
                ($confidenceScore * 0.20) +
                ($pacingScore * 0.20) +
                ($grammarScore * 0.15) +
                ($answerQuality * 0.20)
            ))));

            $feedbackText = $geminiData['feedback_text'] ?? "Well-structured {$interviewType} interview responses.";
            $suggestions = is_array($geminiData['suggestions'] ?? null)
                ? implode("\n", array_map(fn($s) => '• ' . ltrim($s, '•-* '), $geminiData['suggestions']))
                : ($geminiData['suggestions'] ?? "• Practice pausing before speaking.\n• Use the STAR method for behavioral answers.\n• Keep a steady pacing.");

            if (!empty($geminiData['filler_words']) && is_array($geminiData['filler_words'])) {
                $fillerMap = $geminiData['filler_words'];
                $fillerCount = array_sum($fillerMap);
            }
            // Heuristic fallback
            $avgWordsPerAnswer = count($qaList) > 0 ? ($totalWords / count($qaList)) : 0;
            $wpm = $totalDuration > 0 ? round(($totalWords / $totalDuration) * 60) : 130;

            // Pace score: ideal is 120-150 WPM
            $pacingScore = max(20, min(100, round(100 - abs($wpm - 135) * 1.5)));

            // Filler cleanliness
            $fillerScore = max(10, min(100, round(100 - ($fillerCount * 8))));

            // Answer depth based on word count per answer (good BPO answer is at least 25-45 words)
            $depthScore = min(100, max(15, round(($avgWordsPerAnswer / 35) * 85)));

            $clarityScore = max(15, min(95, round(($pacingScore * 0.4) + ($fillerScore * 0.3) + ($depthScore * 0.3))));
            $confidenceScore = max(10, min(95, round(($depthScore * 0.5) + ($fillerScore * 0.3) + ($pacingScore * 0.2))));
            $grammarScore = max(20, min(95, round(85 - ($fillerCount * 3))));
            $answerQuality = max(10, min(95, round(($depthScore * 0.6) + ($clarityScore * 0.4))));

            $overallScore = round(
                ($clarityScore * 0.25) +
                ($confidenceScore * 0.20) +
                ($pacingScore * 0.20) +
                ($fillerScore * 0.15) +
                ($answerQuality * 0.20)
            );

            if ($overallScore < 50) {
                $feedbackText = "The responses provided in this {$interviewType} interview were very brief, hesitant, or lacked sufficient substance for a professional BPO evaluation. Multiple filler words or incomplete answers reduced clarity. To succeed in actual hiring interviews, practice giving structured, detailed answers of at least 3 to 4 sentences per question.";
                $suggestions = "• Provide complete, detailed explanations instead of single-phrase or dismissive answers.\n" .
                    "• Structure your answers using the STAR method (Situation, Task, Action, Result).\n" .
                    "• Pause silently for 2 seconds to formulate your thoughts instead of using filler sounds like 'um' or 'like'.";
            } elseif ($overallScore < 75) {
                $feedbackText = "Foundational attempt at the {$interviewType} mock interview. You answered the questions, but your responses need greater depth, more professional customer-centric terminology, and reduced hesitation words.";
                $suggestions = "• Expand on concrete examples from your past experience or customer service scenarios.\n" .
                    "• Practice replacing filler words with short silent pauses.\n" .
                    "• Project greater vocal confidence and enthusiasm for the BPO role.";
            } else {
                $feedbackText = "Thank you for completing the {$interviewType} mock interview session. Overall, you articulated your thoughts with clarity and addressed the questions directly. " .
                    ($fillerCount > 3 ? "Be mindful of hesitation words like " . implode(', ', array_keys($fillerMap)) . " during your responses. " : "Your disfluency control was commendable. ") .
                    "Continuing to maintain a steady pacing will further project interview confidence.";
                $suggestions = "• Practice replacing filler words with short silent pauses to gather your thoughts.\n" .
                    "• Structure your answers using the STAR method (Situation, Task, Action, Result) for behavioral scenarios.\n" .
                    "• Maintain a calm, friendly tone suited for professional BPO communication.";
            }
        }

        // Save feedback
        $feedback = MockInterviewFeedback::create([
            'mock_session_id' => $session->id,
            'filler_word_count' => $fillerCount,
            'filler_words' => $fillerMap,
            'clarity_score' => $clarityScore,
            'confidence_score' => $confidenceScore,
            'pacing_score' => $pacingScore,
            'volume_score' => 88.0,
            'grammar_score' => $grammarScore,
            'answer_quality_score' => $answerQuality,
            'feedback_text' => $feedbackText,
            'suggestions' => $suggestions,
            'created_at' => now(),
        ]);

        $session->update([
            'overall_score' => $overallScore,
            'status' => 'evaluated',
        ]);

        $wpm = $totalDuration > 0 ? round(($totalWords / $totalDuration) * 60) : 130;

        return response()->json([
            'success' => true,
            'aiEvaluated' => $aiEvaluated,
            'session_id' => $session->id,
            'overall_score' => $overallScore,
            'feedback' => $feedback,
            'stats' => [
                'wpm' => $wpm,
                'total_words' => $totalWords,
                'total_duration' => $totalDuration,
                'filler_count' => $fillerCount,
                'filler_map' => $fillerMap,
            ],
            'tokenUsage' => isset($evalResult['usageMetadata']) ? [
                'promptTokens' => $evalResult['usageMetadata']['promptTokenCount'] ?? 0,
                'candidatesTokens' => $evalResult['usageMetadata']['candidatesTokenCount'] ?? 0,
                'totalTokens' => $evalResult['usageMetadata']['totalTokenCount'] ?? 0,
            ] : null,
        ], 201);
    }

    private function evaluateWithGemini(array $qaList, string $interviewType, string $apiKey): ?array
    {
        $qaFormatted = "";
        foreach ($qaList as $item) {
            $qaFormatted .= "Question {$item['order']}: {$item['question']}\nCandidate Answer: \"{$item['answer']}\"\nSpeaking Duration: {$item['duration']}s\n\n";
        }

        $prompt = "You are an expert BPO Hiring Manager and Speech Assessor evaluating an {$interviewType} BPO mock interview.\n\n"
            . "Candidate's Questions and Spoken Answers:\n{$qaFormatted}\n"
            . "Evaluation Guidelines:\n"
            . "1. If the candidate gave empty, silent, generic placeholder, or off-topic responses, all scores MUST be low (0-30), and feedback_text must state that valid spoken answers were not detected.\n"
            . "2. For real answers, assess according to rigorous BPO standards:\n"
            . "   - clarity_score (0-100): Clear articulation, vocabulary choice, professional enunciation.\n"
            . "   - confidence_score (0-100): Assertiveness, lack of hesitation, positive customer service tone.\n"
            . "   - pacing_score (0-100): Target 120-150 words per minute.\n"
            . "   - grammar_score (0-100): Correct sentence structure, tenses, subject-verb agreement.\n"
            . "   - answer_quality_score (0-100): Directness, relevance to BPO scenarios (STAR method, empathy, de-escalation for final; motivation and flexibility for initial).\n"
            . "   - overall_score (0-100): Weighted overall readiness score.\n"
            . "   - filler_words: JSON object of detected hesitation words and frequencies (e.g. {\"um\": 1, \"like\": 2}).\n"
            . "   - feedback_text: 3 to 4 sentences of constructive, personalized coaching feedback directly citing specific points from the candidate's answers.\n"
            . "   - suggestions: an array of 3 to 4 actionable improvement tips tailored directly to this candidate.\n\n"
            . "Return strict JSON with this exact structure:\n"
            . "{\n"
            . "  \"clarity_score\": number,\n"
            . "  \"confidence_score\": number,\n"
            . "  \"pacing_score\": number,\n"
            . "  \"grammar_score\": number,\n"
            . "  \"answer_quality_score\": number,\n"
            . "  \"overall_score\": number,\n"
            . "  \"filler_words\": { \"word\": number },\n"
            . "  \"feedback_text\": \"string\",\n"
            . "  \"suggestions\": [\"string\"]\n"
            . "}";

        $payload = [
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature' => 0.2,
            ],
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ]
        ];

        // Multi-model fallback cascade for guaranteed high-availability
        $models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.6-flash'];

        foreach ($models as $model) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->withOptions([
                    'verify' => false,
                    'timeout' => 20,
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", $payload);

                if ($response->successful()) {
                    $data = $response->json();
                    $usage = $data['usageMetadata'] ?? null;
                    if ($usage) {
                        Log::info("Gemini API Token Usage [MockInterview - {$model}]: Prompt: " . ($usage['promptTokenCount'] ?? 0) . ", Output: " . ($usage['candidatesTokenCount'] ?? 0) . ", Total: " . ($usage['totalTokenCount'] ?? 0));
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
                    Log::warning("Gemini mock interview call to {$model} returned status: " . $response->getStatusCode());
                }
            } catch (\Throwable $e) {
                Log::warning("Gemini mock interview call to {$model} failed: " . $e->getMessage());
            }
        }

        return null;
    }

    public function getFeedback($sessionId)
    {
        $session = MockInterviewSession::with(['feedback', 'answers.question'])->find($sessionId);
        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }
        return response()->json($session);
    }
}

