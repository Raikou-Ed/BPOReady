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
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $scenario = CallScenario::find($request->input('scenario_id'));
        $scenarioTitle = $scenario ? $scenario->title : "Customer Interaction";
        $conversationHistory = $request->input('conversation_history', []);
        $aggregatedText = trim($request->input('response_text', ''));
        $duration = (int) $request->input('duration_seconds', 30);

        $apiKey = env('GEMINI_API_KEY');
        $model = env('GEMINI_MODEL', 'gemini-3.8-flash');
        $evalResult = null;

        if ($apiKey) {
            $evalResult = $this->evaluateWithGemini($conversationHistory, $aggregatedText, $scenarioTitle, $apiKey, $model);
        }

        if ($evalResult) {
            $empathyScore = (int) ($evalResult['empathy_score'] ?? 85);
            $resolutionScore = (int) ($evalResult['resolution_score'] ?? 85);
            $clarityScore = (int) ($evalResult['clarity_score'] ?? 85);
            $overallScore = (int) ($evalResult['overall_score'] ?? round(($empathyScore * 0.4) + ($resolutionScore * 0.4) + ($clarityScore * 0.2)));
            $feedbackText = $evalResult['feedback_text'] ?? "Well-managed call interaction with solid customer rapport and clear problem-solving delivery.";
            $suggestions = is_array($evalResult['suggestions'] ?? null)
                ? $evalResult['suggestions']
                : ["Acknowledge customer frustration earlier", "Keep technical instructions simple", "Reiterate closing courtesy"];
        } else {
            // Heuristic fallback
            $text = strtolower($aggregatedText);
            $empathyKeywords = ['understand', 'apologize', 'sorry', 'assist', 'help', 'certainly', 'appreciate', 'glad', 'reassure', 'care'];
            $empathyHits = 0;
            foreach ($empathyKeywords as $kw) {
                if (str_contains($text, $kw)) $empathyHits++;
            }
            $empathyScore = min(98, max(65, 70 + ($empathyHits * 6)));

            $resolutionKeywords = ['resolve', 'check', 'account', 'fix', 'refund', 'confirm', 'schedule', 'credit', 'verify', 'update', 'test', 'cable'];
            $resolutionHits = 0;
            foreach ($resolutionKeywords as $kw) {
                if (str_contains($text, $kw)) $resolutionHits++;
            }
            $resolutionScore = min(98, max(65, 72 + ($resolutionHits * 5)));

            $wordCount = count(array_filter(preg_split('/\s+/', $text)));
            $clarityScore = $wordCount > 15 ? min(95, 78 + (int)($wordCount / 5)) : 72;
            $overallScore = round(($empathyScore * 0.4) + ($resolutionScore * 0.4) + ($clarityScore * 0.2));

            $feedbackText = "Good overall call handling. You maintained a professional customer service tone throughout the simulation and addressed the core concerns.";
            $suggestions = [
                "Practice mirroring customer pace to establish deeper conversational rapport",
                "State specific turnaround times clearly when proposing resolution actions",
                "Reiterate customer account verification smoothly without hesitation"
            ];
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
            'empathy_score' => $empathyScore,
            'resolution_score' => $resolutionScore,
            'clarity_score' => $clarityScore,
            'ai_feedback' => $feedbackText,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'session_id' => $session->id,
            'overall_score' => $overallScore,
            'empathy_score' => $empathyScore,
            'resolution_score' => $resolutionScore,
            'clarity_score' => $clarityScore,
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
            . "Evaluation Guidelines:\n"
            . "1. empathy_score (0-100): Validating customer feelings, professional composure, de-escalation, politeness.\n"
            . "2. resolution_score (0-100): Accurate troubleshooting/pitch, proper verification, effective problem resolution.\n"
            . "3. clarity_score (0-100): Clear English articulation, absence of awkward phrasing, concise explanations.\n"
            . "4. overall_score (0-100): Weighted overall call readiness.\n"
            . "5. feedback_text: 2 to 3 sentences summarizing the agent's strengths and customer service performance.\n"
            . "6. suggestions: Array of 3 to 4 actionable improvement tips for this agent.\n\n"
            . "Return strict JSON with this exact structure:\n"
            . "{\n"
            . "  \"overall_score\": number,\n"
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

        $models = array_unique([$model, 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash']);

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
