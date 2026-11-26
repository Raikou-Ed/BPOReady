<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CallScenario;
use App\Models\CallSimulationLog;
use App\Models\CallSimulationSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CallSimulationController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('call_type'); // 'inbound', 'outbound'
        $query = CallScenario::with(['dialogues' => function ($q) {
            $q->orderBy('sequence_order', 'asc');
        }])->where('is_active', true);

        if ($type) {
            $query->where('call_type', $type);
        }

        return response()->json($query->orderBy('id')->get());
    }

    public function show($id)
    {
        $scenario = CallScenario::with(['dialogues' => function ($q) {
            $q->orderBy('sequence_order', 'asc');
        }])->find($id);

        if (!$scenario) {
            return response()->json(['message' => 'Scenario not found'], 404);
        }

        return response()->json($scenario);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'call_type' => 'required|in:inbound,outbound',
            'title' => 'required|string',
            'scenario_brief' => 'required|string',
            'difficulty' => 'nullable|in:easy,medium,hard',
            'created_by_user_id' => 'nullable|integer',
            'dialogues' => 'nullable|array',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $scenario = CallScenario::create([
            'call_type' => $request->input('call_type'),
            'title' => $request->input('title'),
            'scenario_brief' => $request->input('scenario_brief'),
            'difficulty' => $request->input('difficulty', 'medium'),
            'created_by_user_id' => $request->input('created_by_user_id'),
            'is_active' => true,
        ]);

        if ($request->has('dialogues')) {
            foreach ($request->input('dialogues') as $index => $diag) {
                $scenario->dialogues()->create([
                    'sequence_order' => $index + 1,
                    'speaker_role' => $diag['speaker_role'] ?? 'customer',
                    'transcript_text' => $diag['transcript_text'],
                    'audio_file_path' => $diag['audio_file_path'] ?? null,
                ]);
            }
        }

        return response()->json($scenario->load('dialogues'), 201);
    }

    public function submitSession(Request $request)
    {
        $v = Validator::make($request->all(), [
            'applicant_id' => 'required|integer',
            'scenario_id' => 'required|integer',
            'response_text' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
            'conversation_history' => 'nullable|array',
            'quiz_score' => 'nullable|numeric',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $scenario = CallScenario::find($request->input('scenario_id'));
        $scenarioTitle = $scenario ? $scenario->title : "Customer Interaction";
        $conversationHistory = $request->input('conversation_history', []);
        $aggregatedText = trim($request->input('response_text', ''));
        $duration = (int) $request->input('duration_seconds', 30);
        $quizScore = $request->has('quiz_score') && $request->input('quiz_score') !== null
            ? (float) $request->input('quiz_score')
            : null;

        // 1. Detect Silence / Dead Air / Empty Response across all turns
        $agentWordCount = 0;
        if (!empty($conversationHistory) && is_array($conversationHistory)) {
            foreach ($conversationHistory as $turn) {
                $reply = trim($turn['agentReply'] ?? $turn['agent_text'] ?? '');
                if (!empty($reply) && !str_starts_with($reply, '[') && !str_contains($reply, 'Silence')) {
                    $words = array_filter(preg_split('/\s+/', strtolower($reply)));
                    $agentWordCount += count($words);
                }
            }
        }
        $aggWords = array_filter(preg_split('/\s+/', strtolower($aggregatedText)), fn($w) => $w !== '' && !str_starts_with($w, '['));
        $totalWords = max($agentWordCount, count($aggWords));

        if ($totalWords < 3) {
            $interactionScore = $quizScore !== null ? (int) round($quizScore * 0.4) : 0;
            $fluencyScore = 0;
            $accuracyScore = 0;
            $overallScore = $interactionScore > 0 ? (int) round($interactionScore * 0.4) : 0;
            $feedbackText = "No audible speech or verbal response was detected during this call simulation (Dead Air / Silence). In professional BPO operations, failing to acknowledge a customer or remaining silent results in an immediate call failure. Please ensure your microphone is enabled, grant audio permissions, and speak clearly to assist the customer.";
            $suggestions = [
                "Acknowledge the customer immediately upon connection to eliminate dead air penalties",
                "Verify your microphone input and speak in an active, audible voice",
                "Verbalize standard call openings (e.g., 'Thank you for calling, my name is Alex, how may I assist you today?')"
            ];
        } else {
            $apiKey = env('GEMINI_API_KEY');
            $model = env('GEMINI_MODEL', 'gemini-1.5-flash');
            if ($model === 'gemini-3.8-flash' || $model === 'gemini-3.0-flash' || $model === 'gemini-2.0-flash') {
                $model = 'gemini-1.5-flash';
            }
            $evalResult = null;

            if ($apiKey) {
                $evalResult = $this->evaluateWithGemini($conversationHistory, $aggregatedText, $scenarioTitle, $apiKey, $model);
            }

            // Clean tokens & repetitive word detection
            $text = strtolower($aggregatedText);
            $cleanWords = array_values(array_filter(preg_split('/\s+/', $text), fn($w) => $w !== '' && !str_starts_with($w, '[')));
            $wordCount = count($cleanWords);
            $uniqueWords = count(array_unique($cleanWords));
            $isRepetitiveSpeech = ($wordCount >= 4 && $uniqueWords <= 2) || ($wordCount < 5);

            // 3. Scenario Resolution Milestones Check
            $scenarioId = (int) $request->input('scenario_id');
            $milestoneCount = 0;
            if ($scenarioId === 2 || str_contains(strtolower($scenarioTitle), 'bank') || str_contains(strtolower($scenarioTitle), 'wire')) {
                // Milestone 1: Customer identity verification (account number, PIN, SSN)
                $m1 = ['account', 'number', 'name', 'verify', 'verification', 'security', 'ssn', 'social', '1234', 'claudin'];
                // Milestone 2: Balance inquiry resolution
                $m2 = ['balance', 'thousand', 'cents', 'remaining', 'money', '84', 'dollar', 'checking'];
                // Milestone 3: Wire transfer turnaround timeline
                $m3 = ['wire', 'transfer', 'lloyds', 'london', 'business days', 'days', 'international', 'timeline'];
                if (count(array_filter($m1, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
                if (count(array_filter($m2, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
                if (count(array_filter($m3, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
            } elseif ($scenarioId === 1 || str_contains(strtolower($scenarioTitle), 'dsl') || str_contains(strtolower($scenarioTitle), 'internet')) {
                $m1 = ['dsl', 'light', 'modem', 'red', 'flashing', 'blinking', 'signal'];
                $m2 = ['cord', 'cable', 'phone cord', 'gray', 'loose', 'plug', 'back'];
                $m3 = ['green', 'internet', 'online', 'website', 'email', 'working'];
                if (count(array_filter($m1, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
                if (count(array_filter($m2, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
                if (count(array_filter($m3, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
            } elseif ($scenarioId === 3 || str_contains(strtolower($scenarioTitle), 'speed') || str_contains(strtolower($scenarioTitle), 'fiber')) {
                $m1 = ['buffering', 'speed', 'streaming', '4k', 'lag', 'slow'];
                $m2 = ['speed test', 'test', 'mbps', 'megabits', 'download', 'connection'];
                $m3 = ['100 mbps', '100', '25', 'fiber', 'plan', 'upgrade', 'installation'];
                if (count(array_filter($m1, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
                if (count(array_filter($m2, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
                if (count(array_filter($m3, fn($k) => str_contains($text, $k))) > 0) $milestoneCount++;
            } else {
                $resKw = ['resolve', 'check', 'account', 'fix', 'refund', 'confirm', 'schedule', 'credit', 'verify', 'update', 'test', 'help', 'assist'];
                $hits = count(array_filter($resKw, fn($k) => str_contains($text, $k)));
                if ($hits >= 1) $milestoneCount++;
                if ($hits >= 3) $milestoneCount++;
                if ($hits >= 5) $milestoneCount++;
            }

            if ($evalResult && isset($evalResult['overall_score']) && $evalResult['overall_score'] > 0 && !$isRepetitiveSpeech && $milestoneCount > 0) {
                $speechInteraction = (int) ($evalResult['interaction_score'] ?? $evalResult['empathy_score'] ?? 80);
                $fluencyScore = (int) ($evalResult['fluency_score'] ?? $evalResult['clarity_score'] ?? 80);
                $accuracyScore = (int) ($evalResult['accuracy_score'] ?? $evalResult['resolution_score'] ?? 80);

                // Blend post-call active listening quiz into Interaction pillar if provided
                if ($quizScore !== null) {
                    $interactionScore = (int) round(($speechInteraction * 0.50) + ($quizScore * 0.50));
                } else {
                    $interactionScore = $speechInteraction;
                }

                $callCriteria = cache()->get('call_simulation_criteria');
                $wInt = 0.40;
                $wFlu = 0.30;
                $wAcc = 0.30;
                if (is_array($callCriteria)) {
                    foreach ($callCriteria as $c) {
                        $n = strtolower($c['name'] ?? '');
                        $w = ((float) ($c['weight'] ?? 30)) / 100;
                        if (str_contains($n, 'interact')) $wInt = $w;
                        elseif (str_contains($n, 'fluenc')) $wFlu = $w;
                        elseif (str_contains($n, 'accura')) $wAcc = $w;
                    }
                }

                $overallScore = (int) round(($interactionScore * $wInt) + ($fluencyScore * $wFlu) + ($accuracyScore * $wAcc));
                $feedbackText = $evalResult['feedback_text'] ?? "Well-managed call interaction with solid customer rapport and clear problem-solving delivery.";
                $suggestions = is_array($evalResult['suggestions'] ?? null)
                    ? $evalResult['suggestions']
                    : ["Acknowledge customer frustration earlier", "Keep technical instructions simple", "Reiterate closing courtesy"];
            } else {
                // 1. Remove High Baseline Score Floors: If customer inquiries are unaddressed, scores drop to 0%–25%
                if ($milestoneCount === 0 || $isRepetitiveSpeech) {
                    $accuracyScore = min(20, max(5, $uniqueWords * 3));
                    $speechInteraction = min(25, max(10, $uniqueWords * 4));
                    $fluencyScore = min(25, max(10, $uniqueWords * 4));
                    $feedbackText = "Critical Quality Failure: The customer's inquiry was not addressed. The agent provided generic or repetitive responses without resolving the customer's request or verifying account details. In a live BPO call, an agent must actively assist the customer through the required resolution steps.";
                    $suggestions = [
                        "Directly answer the customer's inquiry instead of repeating generic greetings or filler",
                        "Perform required account verification and state specific account figures clearly",
                        "Follow through on resolution milestones (e.g., checking balance and explaining transaction timelines)"
                    ];
                } elseif ($milestoneCount === 1) {
                    $accuracyScore = min(50, max(25, 25 + ($uniqueWords * 2)));
                    $speechInteraction = min(55, max(30, 30 + ($uniqueWords * 2)));
                    $fluencyScore = min(60, max(35, 35 + min(20, (int)($totalWords * 1.2))));
                    $feedbackText = "Partial call handling. You acknowledged the customer and began addressing their issue, but missed key resolution details required for full BPO quality compliance.";
                    $suggestions = [
                        "Ensure all customer questions are fully answered before closing the call",
                        "Reiterate customer account verification smoothly without hesitation",
                        "State specific turnaround times clearly when proposing resolution actions"
                    ];
                } else {
                    $accuracyScore = min(95, max(60, 55 + ($milestoneCount * 12) + $uniqueWords));
                    $speechInteraction = min(95, max(60, 55 + ($milestoneCount * 10) + $uniqueWords));
                    $fluencyScore = min(95, max(65, 60 + min(30, (int)($totalWords * 1.1))));
                    $feedbackText = "Good overall call handling. You maintained a professional customer service tone throughout the simulation and addressed the core concerns.";
                    $suggestions = [
                        "Practice mirroring customer pace to establish deeper conversational rapport",
                        "State specific turnaround times clearly when proposing resolution actions",
                        "Reiterate closing courtesies to reinforce brand loyalty"
                    ];
                }

                if ($quizScore !== null) {
                    $interactionScore = (int) round(($speechInteraction * 0.50) + ($quizScore * 0.50));
                } else {
                    $interactionScore = $speechInteraction;
                }

                $callCriteria = cache()->get('call_simulation_criteria');
                $wInt = 0.40;
                $wFlu = 0.30;
                $wAcc = 0.30;
                if (is_array($callCriteria)) {
                    foreach ($callCriteria as $c) {
                        $n = strtolower($c['name'] ?? '');
                        $w = ((float) ($c['weight'] ?? 30)) / 100;
                        if (str_contains($n, 'interact')) $wInt = $w;
                        elseif (str_contains($n, 'fluenc')) $wFlu = $w;
                        elseif (str_contains($n, 'accura')) $wAcc = $w;
                    }
                }

                $overallScore = (int) round(($interactionScore * $wInt) + ($fluencyScore * $wFlu) + ($accuracyScore * $wAcc));
            }

            // 2. Comprehension Quiz Critical Impact: If quiz is 0%, cap overall QA score at maximum 35% (Auto-Fail)
            if ($quizScore !== null && $quizScore <= 0) {
                $overallScore = min(35, $overallScore);
                $interactionScore = min(35, $interactionScore);
                if ($milestoneCount > 0) {
                    $feedbackText = "Critical Quality Failure: Post-call comprehension quiz scored 0%. In a professional BPO environment, active listening and capturing verified customer details are mandatory; failing comprehension results in an automatic quality failure.";
                }
            }
        }

        $session = CallSimulationSession::create([
            'applicant_id' => $request->input('applicant_id'),
            'scenario_id' => $request->input('scenario_id'),
            'overall_score' => $overallScore,
            'status' => 'submitted',
            'started_at' => now()->subSeconds(max(1, $duration)),
            'submitted_at' => now(),
        ]);

        $log = CallSimulationLog::create([
            'session_id' => $session->id,
            'duration_seconds' => $duration,
            'empathy_score' => $interactionScore,
            'resolution_score' => $accuracyScore,
            'clarity_score' => $fluencyScore,
            'ai_feedback' => $feedbackText,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'session_id' => $session->id,
            'overall_score' => $overallScore,
            'interaction_score' => $interactionScore,
            'fluency_score' => $fluencyScore,
            'accuracy_score' => $accuracyScore,
            'quiz_score' => $quizScore,
            // Backward compatibility
            'empathy_score' => $interactionScore,
            'resolution_score' => $accuracyScore,
            'clarity_score' => $fluencyScore,
            'feedback_text' => $feedbackText,
            'feedback' => $feedbackText,
            'suggestions' => $suggestions,
            'tokenUsage' => isset($evalResult['usageMetadata']) ? [
                'promptTokens' => $evalResult['usageMetadata']['promptTokenCount'] ?? 0,
                'candidatesTokens' => $evalResult['usageMetadata']['candidatesTokenCount'] ?? 0,
                'totalTokens' => $evalResult['usageMetadata']['totalTokenCount'] ?? 0,
            ] : null,
        ], 201);
    }

    private function evaluateWithGemini(array $conversation, string $aggregatedText, string $scenarioTitle, string $apiKey, string $model): ?array
    {
        $dialogueTranscript = "";
        if (!empty($conversation)) {
            foreach ($conversation as $t) {
                $turnNum = $t['turn'] ?? 1;
                $cust = $t['customerPrompt'] ?? $t['customer_text'] ?? '(Customer spoke)';
                $agent = $t['agentReply'] ?? $t['agent_text'] ?? '(Agent spoke)';
                $dialogueTranscript .= "Turn {$turnNum}:\nCustomer: \"{$cust}\"\nAgent: \"{$agent}\"\n\n";
            }
        } else {
            $dialogueTranscript = "Agent's aggregate response:\n\"{$aggregatedText}\"\n";
        }

        $prompt = "You are an expert BPO Quality Assurance Manager evaluating an agent's performance in a customer call simulation.\n\n"
            . "Scenario: {$scenarioTitle}\n\n"
            . "Call Dialogue:\n{$dialogueTranscript}\n"
            . "Evaluation Guidelines (3-Pillar CEFR Spoken Interaction Model: Interaction 40%, Fluency 30%, Accuracy 30%):\n"
            . "CRITICAL RULE 1: If the agent's replies are empty, silent, or contain no actual spoken response, overall_score, interaction_score, fluency_score, and accuracy_score MUST BE 0, and feedback_text MUST indicate that the candidate failed to respond.\n"
            . "CRITICAL RULE 2 (NO HIGH FLOORS / REPETITIVE SPEECH PENALTY): If the agent repeatedly gives generic one-word greetings or filler (e.g. repeating 'hello', 'yes', 'ok' across multiple turns) or fails to address the customer's actual inquiry, overall_score, interaction_score, fluency_score, and accuracy_score MUST BE CAPPED AT 10-25. Do NOT give passing or 50+ scores to unhelpful canned greetings.\n"
            . "CRITICAL RULE 3 (RESOLUTION MILESTONES): Check whether key scenario resolution milestones were met (e.g., verifying customer identity, solving the specific inquiry). If the customer's issue was completely ignored or unaddressed, accuracy_score MUST NOT exceed 20.\n"
            . "1. interaction_score (0-100): Customer empathy, validating concerns, professional composure, de-escalation, turn-taking, and politeness.\n"
            . "2. fluency_score (0-100): Conversational pacing (115-145 WPM), smooth delivery flow, minimal hesitations, and absence of dead-air.\n"
            . "3. accuracy_score (0-100): Phonetic clarity, correct customer account verification, grammar control, and professional phrasing.\n"
            . "4. overall_score (0-100): Weighted overall score: (interaction_score * 0.40) + (fluency_score * 0.30) + (accuracy_score * 0.30).\n"
            . "5. feedback_text: 2 to 3 sentences summarizing the agent's strengths and customer service performance.\n"
            . "6. suggestions: Array of 3 to 4 actionable improvement tips for this agent.\n\n"
            . "Return strict JSON with this exact structure:\n"
            . "{\n"
            . "  \"overall_score\": number,\n"
            . "  \"interaction_score\": number,\n"
            . "  \"fluency_score\": number,\n"
            . "  \"accuracy_score\": number,\n"
            . "  \"empathy_score\": number,\n"
            . "  \"resolution_score\": number,\n"
            . "  \"clarity_score\": number,\n"
            . "  \"feedback_text\": \"string\",\n"
            . "  \"suggestions\": [\"string\"]\n"
            . "}";

        $payload = [
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature' => 0.1,
            ],
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ],
                ],
            ],
        ];

        $models = array_unique([$model, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash']);

        foreach ($models as $m) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->withOptions([
                    'verify' => false,
                    'timeout' => 20,
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$m}:generateContent?key={$apiKey}", $payload);

                if ($response->successful()) {
                    $data = $response->json();
                    $usage = $data['usageMetadata'] ?? null;
                    if ($usage) {
                        Log::info("Gemini API Token Usage [CallSimulation - {$m}]: Prompt: " . ($usage['promptTokenCount'] ?? 0) . ", Output: " . ($usage['candidatesTokenCount'] ?? 0) . ", Total: " . ($usage['totalTokenCount'] ?? 0));
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
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Gemini Call Simulation call to {$m} failed: " . $e->getMessage());
            }
        }

        return null;
    }
}
