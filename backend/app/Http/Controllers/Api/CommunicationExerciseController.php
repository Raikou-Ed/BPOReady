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

        // Never return inactive / deleted drills unless explicitly requested
        if (!$request->query('include_inactive')) {
            $query->where(function ($q) {
                $q->where('is_active', true)->orWhereNull('is_active');
            });
        }

        if (!$isAdmin) {
            $query->where(function ($q) {
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
        try {
            $ex->delete();
        } catch (\Throwable $e) {
            $ex->update(['is_active' => false]);
        }
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
        $feedback = $score == 0
            ? "No speech detected during the recording. Please ensure your microphone is enabled and speak clearly."
            : ($score >= 85
                ? "Excellent control! Your speech delivery was clear with minimal disfluencies."
                : "Good effort. Try pausing slightly instead of rushing to improve fluency.");

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
            'client_fillers' => 'nullable|array',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $audio = $request->file('audio');
        $transcript = (string) $request->input('transcript', '');
        $expectedPrompt = (string) $request->input('prompt_text');
        $durationSeconds = (int) $request->input('duration_seconds', 0);
        $clientFillers = is_array($request->input('client_fillers')) ? $request->input('client_fillers') : [];
        $apiKey = env('GEMINI_API_KEY') ?: 'AIzaSyBhF7o3W2c4_5oEXWEaFqFt3a39x01rhDw';
        $model = env('GEMINI_MODEL', 'gemini-3.5-flash-lite');

        $transcriptWords = array_filter(preg_split('/\s+/', trim($transcript)));
        if (!$audio && count($transcriptWords) < 2) {
            return response()->json([
                'success' => true,
                'aiEvaluated' => false,
                'transcript' => $transcript ?: '[No audible speech detected / Silence]',
                'fillerWords' => [],
                'fillerCount' => 0,
                'score' => 0,
                'feedback' => 'No speech detected during the recording. Please speak the prompt clearly into your microphone to evaluate your filler word usage.',
            ]);
        }

        $aiEvaluated = false;
        $evalResult = null;

        if ($apiKey && ($audio || !empty($transcript))) {
            try {
                $evalResult = $this->callGeminiFillerEvaluation($audio, $transcript, $expectedPrompt, $apiKey, $model, $clientFillers);
                if ($evalResult) {
                    $aiEvaluated = true;
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini filler evaluation error: ' . $e->getMessage());
            }
        }

        $fillerPattern = '/\b(um+|uh+|uhm+|ah+|ahh+|er+|erm+|hmm+|mhm|like|you\s+know|actually|basically|literally|honestly|i\s+mean|sort\s+of|kind\s+of)\b/i';

        if ($aiEvaluated && $evalResult) {
            $fillerWords = is_array($evalResult['fillerWords'] ?? null) ? $evalResult['fillerWords'] : [];
            $cleanTranscript = trim((string) ($evalResult['transcript'] ?? $transcript));
            $wordsInResult = array_filter(preg_split('/\s+/', $cleanTranscript), fn($w) => $w !== '' && !str_starts_with($w, '['));

            if (count($wordsInResult) < 2) {
                return response()->json([
                    'success' => true,
                    'aiEvaluated' => true,
                    'transcript' => $cleanTranscript ?: '[No audible speech detected / Silence]',
                    'fillerWords' => [],
                    'fillerCount' => 0,
                    'score' => 0,
                    'feedback' => 'No speech detected during the recording. Please speak the prompt clearly into your microphone to evaluate your filler word usage.',
                ]);
            }

            // Also scan transcript text with regex to catch any filler words transcribed by Gemini
            preg_match_all($fillerPattern, $cleanTranscript, $tMatches);
            $foundInTranscript = array_map('strtolower', $tMatches[0] ?? []);

            $allFillers = array_values(array_unique(array_filter(array_merge(
                array_map('strtolower', $fillerWords),
                $foundInTranscript,
                array_map('strtolower', $clientFillers)
            ))));

            $fillerCount = max(
                (int) ($evalResult['fillerCount'] ?? 0),
                count($foundInTranscript),
                count($allFillers)
            );

            // Calculate realistic disfluency score
            $score = (float) ($evalResult['score'] ?? max(30, 100 - ($fillerCount * 15)));
            if ($fillerCount > 0 && $score > (100 - ($fillerCount * 10))) {
                $score = max(30, 100 - ($fillerCount * 15));
            }

            $feedback = $evalResult['feedback'] ?? ($fillerCount === 0 
                ? 'Exceptional filler control! Your delivery was smooth and articulate.' 
                : "Detected {$fillerCount} filler sound(s). Try replacing vocal hesitations with a 1-second silent pause.");

            return response()->json([
                'success' => true,
                'aiEvaluated' => true,
                'transcript' => $cleanTranscript,
                'fillerWords' => $allFillers,
                'fillerCount' => $fillerCount,
                'score' => round($score),
                'feedback' => $feedback,
            ]);
        }

        // Heuristics fallback: detect um, uh, ah, like, and client-captured interim tokens
        $wordsInFallback = array_filter(preg_split('/\s+/', trim($transcript)), fn($w) => $w !== '' && !str_starts_with($w, '['));
        if (count($wordsInFallback) < 2) {
            return response()->json([
                'success' => true,
                'aiEvaluated' => false,
                'transcript' => $transcript ?: '[No audible speech detected / Silence]',
                'fillerWords' => [],
                'fillerCount' => 0,
                'score' => 0,
                'feedback' => 'No speech detected during the recording. Please speak the prompt clearly into your microphone to evaluate your filler word usage.',
            ]);
        }

        preg_match_all($fillerPattern, $transcript, $matches);
        $detected = array_map('strtolower', $matches[0] ?? []);
        $allDetected = array_values(array_unique(array_filter(array_merge($detected, array_map('strtolower', $clientFillers)))));
        $fillerCount = max(count($matches[0] ?? []), count($allDetected));
        $score = max(35, min(100, 100 - ($fillerCount * 15)));

        return response()->json([
            'success' => true,
            'aiEvaluated' => false,
            'transcript' => $transcript,
            'fillerWords' => $allDetected,
            'fillerCount' => $fillerCount,
            'score' => $score,
            'feedback' => $fillerCount === 0
                ? 'Exceptional filler control! Your delivery was smooth and articulate.'
                : "Detected {$fillerCount} filler sound(s). Try a 1-second silent breath pause instead of filler sounds.",
        ]);
    }

    private function callGeminiFillerEvaluation($audio, string $transcript, string $expectedPrompt, string $apiKey, string $model, array $clientFillers = []): ?array
    {
        $parts = [];
        $transcriptHint = trim($transcript) !== '' ? $transcript : 'No browser transcript available.';
        $clientFillersHint = !empty($clientFillers) ? 'Client interim detected cues: ' . implode(', ', $clientFillers) : '';

        $systemPrompt = "You are an expert BPO Speech Coach and Acoustic Disfluency Evaluator.\n"
            . "The applicant responded spontaneously to this customer service scenario:\n"
            . "\"{$expectedPrompt}\"\n\n"
            . "CRITICAL INSTRUCTION - FILLER WORDS & HESITATIONS:\n"
            . "The speaker may say vocal hesitation sounds like 'uhm', 'umm', 'um', 'ahh', 'ah', 'uh', 'er', 'erm', 'hmm', 'mhm', 'like', 'you know', 'actually'.\n"
            . "1. Listen carefully to every syllable in the audio. Transcribe the audio 100% VERBATIM.\n"
            . "2. YOU MUST TRANSCRIBE EVERY VOCAL HESITATION SOUND ('uhm', 'ahh', 'um', 'ah', 'uh', 'er', 'erm', 'hmm', etc.) into the transcript string exactly at the position it was uttered! NEVER clean up, omit, or sanitize hesitation noises.\n"
            . "3. List every single detected filler word in the 'fillerWords' array (lowercase, e.g. [\"uhm\", \"ahh\", \"um\", \"like\"]).\n"
            . "4. Set 'fillerCount' to the exact total number of filler instances heard.\n"
            . "5. Fluency Score (0-100):\n"
            . "   - 0 fillers: 95-100\n"
            . "   - 1 filler: 80-85\n"
            . "   - 2 fillers: 65-75\n"
            . "   - 3-4 fillers: 45-60\n"
            . "   - 5+ fillers: 25-40\n"
            . "   - Silent or inaudible: 0\n"
            . "6. Feedback: 1-2 constructive, encouraging coaching sentences addressing their filler reduction.\n\n"
            . "Browser speech hint: {$transcriptHint}\n"
            . ($clientFillersHint ? "{$clientFillersHint}\n\n" : "\n")
            . "Return strictly valid JSON (no markdown formatting, no code fences):\n"
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
            
            $clientMime = strtolower($audio->getClientMimeType() ?: '');
            $detectedMime = strtolower($audio->getMimeType() ?: '');
            $ext = strtolower($audio->getClientOriginalExtension() ?: '');

            if (str_contains($clientMime, 'wav') || str_contains($detectedMime, 'wav') || $ext === 'wav') {
                $safeMimeType = 'audio/wav';
            } elseif (str_contains($clientMime, 'webm') || str_contains($detectedMime, 'webm') || $ext === 'webm') {
                $safeMimeType = 'audio/webm';
            } elseif (str_contains($clientMime, 'ogg') || str_contains($detectedMime, 'ogg') || $ext === 'ogg') {
                $safeMimeType = 'audio/ogg';
            } elseif (str_contains($clientMime, 'mp3') || str_contains($detectedMime, 'mp3') || $ext === 'mp3') {
                $safeMimeType = 'audio/mp3';
            } elseif (str_contains($clientMime, 'mp4') || str_contains($detectedMime, 'mp4') || $ext === 'm4a') {
                $safeMimeType = 'audio/mp4';
            } else {
                $safeMimeType = 'audio/wav';
            }

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

        // Use fast, audio-capable models: gemini-3.5-flash-lite (1.7s) -> gemini-3.6-flash (4s) -> gemini-3.5-flash
        $models = array_values(array_unique(['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash']));

        foreach ($models as $m) {
            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->withOptions(['verify' => false, 'timeout' => 15])
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
                } else {
                    Log::warning("Gemini model {$m} returned status {$response->status()}: " . substr($response->body(), 0, 150));
                }
            } catch (\Throwable $ex) {
                Log::warning("Gemini model {$m} failed for filler eval: " . $ex->getMessage());
            }
        }

        return null;
    }
}
