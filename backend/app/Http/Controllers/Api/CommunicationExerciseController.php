<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunicationExercise;
use App\Models\ExerciseAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CommunicationExerciseController extends Controller
{
    public function index(Request $request)
    {
        $flaw = $request->query('target_flaw');
        $isAdmin = $request->query('admin') || $request->query('all');
        $query = CommunicationExercise::query();

        if (!$isAdmin) {
            $query->where('is_active', true)
                  ->where(function ($q) {
                      $q->where('approval_status', 'approved')->orWhereNull('approval_status');
                  });
        }

        if ($flaw) {
            $query->where('target_flaw', $flaw);
        }
        return response()->json($query->orderBy('id')->get());
    }

    public function show($id)
    {
        $ex = CommunicationExercise::find($id);
        if (!$ex) {
            return response()->json(['message' => 'Exercise not found'], 404);
        }
        return response()->json($ex);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'title' => 'required|string',
            'target_flaw' => 'required|string',
            'exercise_type' => 'nullable|string',
            'exercise_content' => 'nullable|string',
            'prompt_text' => 'nullable|string',
            'difficulty' => 'nullable|in:easy,medium,hard',
            'created_by_user_id' => 'nullable|integer',
            'approval_status' => 'nullable|in:pending,approved,rejected',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $status = $request->input('approval_status', 'approved');
        $content = $request->input('exercise_content') ?: $request->input('prompt_text', '');

        $ex = CommunicationExercise::create([
            'title' => $request->input('title'),
            'target_flaw' => $request->input('target_flaw'),
            'exercise_type' => $request->input('exercise_type', 'speech_drill'),
            'exercise_content' => $content,
            'difficulty' => $request->input('difficulty', 'easy'),
            'created_by_user_id' => $request->input('created_by_user_id'),
            'approval_status' => $status,
            'is_active' => $status === 'approved',
        ]);

        return response()->json($ex, 201);
    }

    public function update(Request $request, $id)
    {
        $ex = CommunicationExercise::find($id);
        if (!$ex) {
            return response()->json(['message' => 'Exercise not found'], 404);
        }
        $data = $request->only(['title', 'target_flaw', 'exercise_type', 'exercise_content', 'difficulty', 'is_active', 'approval_status', 'reviewer_notes']);
        if ($request->has('prompt_text') && empty($data['exercise_content'])) {
            $data['exercise_content'] = $request->input('prompt_text');
        }
        $ex->update($data);
        return response()->json($ex);
    }

    public function destroy($id)
    {
        $ex = CommunicationExercise::find($id);
        if (!$ex) {
            return response()->json(['message' => 'Exercise not found'], 404);
        }
        $ex->update(['is_active' => false]);
        return response()->json(['success' => true]);
    }

    public function submitAttempt(Request $request)
    {
        $v = Validator::make($request->all(), [
            'applicant_id' => 'required|integer',
            'exercise_id' => 'required|integer',
            'response_text' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
            'filler_count' => 'nullable|integer',
            'calculated_score' => 'nullable|numeric',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $score = $request->input('calculated_score', 85);
        $fillerCount = $request->input('filler_count', 0);
        $feedback = $score >= 85
            ? "Excellent control! Your speech delivery was clear with minimal disfluencies."
            : "Good effort. Try pausing slightly instead of rushing to improve fluency.";

        $attempt = ExerciseAttempt::create([
            'applicant_id' => $request->input('applicant_id'),
            'exercise_id' => $request->input('exercise_id'),
            'response_text' => $request->input('response_text', ''),
            'score' => $score,
            'status' => 'evaluated',
            'feedback' => $feedback,
            'taken_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'attempt' => $attempt,
            'score' => $score,
            'feedback' => $feedback,
        ], 201);
    }

    public function evaluateFiller(Request $request)
    {
        $v = Validator::make($request->all(), [
            'applicant_id' => 'nullable|integer',
            'prompt_text' => 'required|string',
            'transcript' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $audio = $request->file('audio');
        $transcript = (string) $request->input('transcript', '');
        $expectedPrompt = (string) $request->input('prompt_text');
        $durationSeconds = (int) $request->input('duration_seconds', 0);
        $apiKey = env('GEMINI_API_KEY');
        $model = env('GEMINI_MODEL', 'gemini-3.6-flash');

        $aiEvaluated = false;
        $evalResult = null;

        if ($apiKey && ($audio || !empty($transcript))) {
            try {
                $evalResult = $this->callGeminiFillerEvaluation($audio, $transcript, $expectedPrompt, $apiKey, $model);
                if ($evalResult) {
                    $aiEvaluated = true;
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini filler evaluation error: ' . $e->getMessage());
            }
        }

        if ($aiEvaluated && $evalResult) {
            $fillerWords = is_array($evalResult['fillerWords'] ?? null) ? $evalResult['fillerWords'] : [];
            $fillerCount = (int) ($evalResult['fillerCount'] ?? count($fillerWords));
            $score = (float) ($evalResult['score'] ?? max(30, 100 - ($fillerCount * 15)));
            $cleanTranscript = (string) ($evalResult['transcript'] ?? $transcript);
            $feedback = $evalResult['feedback'] ?? ($fillerCount === 0 
                ? 'Exceptional filler control! Your delivery was smooth and articulate.' 
                : "Detected {$fillerCount} filler word(s). Try taking a 1-second silent pause when gathering your thoughts.");

            return response()->json([
                'success' => true,
                'aiEvaluated' => true,
                'transcript' => $cleanTranscript,
                'fillerWords' => $fillerWords,
                'fillerCount' => $fillerCount,
                'score' => round($score),
                'feedback' => $feedback,
            ]);
        }

        // Heuristics fallback: detect um, uh, ah, like, and common speech-to-text filler representations
        $fillerPattern = '/\b(um+|uh+|uhm+|ah+|ahh+|er+|erm+|hmm+|mhm|like|you\s+know|actually|basically|i\s+mean|sort\s+of|kind\s+of)\b/i';
        preg_match_all($fillerPattern, $transcript, $matches);
        $detected = $matches[0] ?? [];
        $fillerCount = count($detected);
        $score = max(40, min(100, 100 - ($fillerCount * 15)));

        return response()->json([
            'success' => true,
            'aiEvaluated' => false,
            'transcript' => $transcript,
            'fillerWords' => $detected,
            'fillerCount' => $fillerCount,
            'score' => $score,
            'feedback' => $fillerCount === 0
                ? 'Exceptional filler control! Your delivery was smooth and articulate.'
                : "Detected {$fillerCount} filler word(s). Try a 1-second silent breath pause instead of filler sounds.",
        ]);
    }

    private function callGeminiFillerEvaluation($audio, string $transcript, string $expectedPrompt, string $apiKey, string $model): ?array
    {
        $parts = [];
        $transcriptHint = trim($transcript) !== '' ? $transcript : 'No browser transcript available.';

        $systemPrompt = "You are an automated BPO Speech Coaching AI specializing in Filler Word & Disfluency Detection.\n"
            . "A candidate is practicing reading the following script out loud:\n"
            . "\"{$expectedPrompt}\"\n\n"
            . "CRITICAL INSTRUCTIONS:\n"
            . "1. Listen to the audio and transcribe EVERY single word and vocal sound spoken verbatim.\n"
            . "2. DO NOT clean up, normalize, or omit hesitation sounds or fillers! If the speaker says 'um', 'ah', 'uh', 'er', 'like', 'actually', or repeated words, you MUST include them in the transcript string exactly where they occurred.\n"
            . "3. Specifically identify and list all filler sounds and crutch words used (e.g. ['um', 'ah', 'like']).\n"
            . "4. Count the total number of filler instances in fillerCount.\n"
            . "5. Calculate score (0-100): 0 fillers = 95-100. 1 filler = 80-85. 2 fillers = 65-75. 3+ fillers = 40-60. If no audio/silence, score = 0.\n"
            . "6. Provide 1-2 sentences of encouraging, actionable BPO coaching feedback.\n\n"
            . "Browser STT hint: {$transcriptHint}\n\n"
            . "Return strict JSON only (no markdown, no backticks):\n"
            . "{\n"
            . "  \"transcript\": \"string\",\n"
            . "  \"fillerWords\": [\"string\"],\n"
            . "  \"fillerCount\": number,\n"
            . "  \"score\": number,\n"
            . "  \"feedback\": \"string\"\n"
            . "}";

        $parts[] = ['text' => $systemPrompt];

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
                ['parts' => $parts],
            ],
        ];

        $models = array_unique([$model, 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash']);

        foreach ($models as $m) {
            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->withOptions(['verify' => false, 'timeout' => 25])
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/{$m}:generateContent?key={$apiKey}", $payload);

                if ($response->successful()) {
                    $data = $response->json();
                    $rawText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($rawText) {
                        $clean = trim($rawText);
                        if (str_starts_with($clean, '```')) {
                            $clean = preg_replace('/^```(?:json)?\s*/i', '', $clean);
                            $clean = preg_replace('/\s*```$/', '', $clean);
                        }
                        $decoded = json_decode($clean, true);
                        if (is_array($decoded)) {
                            return $decoded;
                        }
                        preg_match('/\{.*\}/s', $clean, $matches);
                        if (isset($matches[0])) {
                            $decoded = json_decode($matches[0], true);
                            if (is_array($decoded)) return $decoded;
                        }
                    }
                }
            } catch (\Throwable $ex) {
                Log::warning("Gemini model {$m} failed for filler eval: " . $ex->getMessage());
            }
        }

        return null;
    }
}
