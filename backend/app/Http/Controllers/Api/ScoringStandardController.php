<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScoringStandard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScoringStandardController extends Controller
{
    private static bool $tableChecked = false;

    private static function ensureSettingsTable(): void
    {
        if (self::$tableChecked) {
            return;
        }
        try {
            DB::statement('CREATE TABLE IF NOT EXISTS institutional_settings (setting_key VARCHAR(120) PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TIMESTAMP NULL)');
            self::$tableChecked = true;
        } catch (\Throwable $e) {
            // Fall back silently to cache if DDL not permitted
        }
    }

    public static function getSetting(string $key, $default = null)
    {
        self::ensureSettingsTable();
        try {
            $row = DB::table('institutional_settings')->where('setting_key', $key)->first();
            if ($row && isset($row->setting_value)) {
                $decoded = json_decode($row->setting_value, true);
                if (json_last_error() === JSON_ERROR_NONE && $decoded !== null) {
                    return $decoded;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to cache below
        }
        return cache()->get($key, $default);
    }

    public static function setSetting(string $key, $value): void
    {
        cache()->forever($key, $value);
        self::ensureSettingsTable();
        try {
            DB::table('institutional_settings')->updateOrInsert(
                ['setting_key' => $key],
                [
                    'setting_value' => json_encode($value),
                    'updated_at' => now(),
                ]
            );
        } catch (\Throwable $e) {
            // Cache still updated
        }
    }

    public function index()
    {
        $standards = ScoringStandard::where('is_active', true)->orderBy('min_score')->get();

        $readingCriteria = self::getSetting('spoken_reading_criteria', [
            [
                'id' => 1,
                'name' => 'Accuracy',
                'weight' => 50,
                'detail' => 'Vowel/consonant enunciation, acoustic clarity, syllable stress intelligibility, and phonetic precision.',
            ],
            [
                'id' => 2,
                'name' => 'Fluency',
                'weight' => 50,
                'detail' => 'Speech rhythm, optimal cadence (115–145 WPM), natural flow, and continuous delivery without unnatural pauses.',
            ],
        ]);

        $mockInterviewCriteria = self::getSetting('mock_interview_criteria', [
            [
                'id' => 1,
                'name' => 'Accuracy',
                'weight' => 20,
                'detail' => 'Grammar control, clear pronunciation, and phonetic crispness.',
            ],
            [
                'id' => 2,
                'name' => 'Fluency',
                'weight' => 20,
                'detail' => 'Natural speaking tempo (120–150 WPM) without long pauses or hesitations.',
            ],
            [
                'id' => 3,
                'name' => 'Range',
                'weight' => 20,
                'detail' => 'Professional BPO vocabulary repertoire without crutch words or fillers.',
            ],
            [
                'id' => 4,
                'name' => 'Interaction',
                'weight' => 20,
                'detail' => 'Professional composure, question relevance, and confident customer service tone.',
            ],
            [
                'id' => 5,
                'name' => 'Coherence',
                'weight' => 20,
                'detail' => 'Logical answer structure following the STAR method (Situation, Task, Action, Result).',
            ],
        ]);

        $callSimulationCriteria = self::getSetting('call_simulation_criteria', [
            [
                'id' => 1,
                'name' => 'Interaction',
                'weight' => 40,
                'detail' => 'Active listening, customer empathy, conversational turn-taking, and post-call comprehension quiz accuracy.',
            ],
            [
                'id' => 2,
                'name' => 'Fluency',
                'weight' => 30,
                'detail' => 'Conversational speech cadence, natural tempo (115–145 WPM), and dead-air management.',
            ],
            [
                'id' => 3,
                'name' => 'Accuracy',
                'weight' => 30,
                'detail' => 'Phonetic articulation, grammatical correctness, verification precision, and professional phrasing.',
            ],
        ]);

        $certificationPrerequisites = self::getSetting('certification_prerequisites', [
            'required_readings' => 10,
            'required_mock_interviews' => 10,
            'required_call_simulations' => 10,
            'min_performance_avg' => 75,
            'min_exam_composite' => 85,
            'min_stage_score' => 70,
        ]);

        return response()->json([
            'standards' => $standards,
            'criteria' => $readingCriteria,
            'readingCriteria' => $readingCriteria,
            'mockInterviewCriteria' => $mockInterviewCriteria,
            'callSimulationCriteria' => $callSimulationCriteria,
            'certificationPrerequisites' => $certificationPrerequisites,
        ]);
    }

    public function update(Request $request)
    {
        if ($request->has('standards') && is_array($request->input('standards'))) {
            foreach ($request->input('standards') as $item) {
                if (isset($item['level'])) {
                    DB::table('scoring_standards')
                        ->where('level', $item['level'])
                        ->update([
                            'min_score' => $item['min_score'] ?? 0,
                            'max_score' => $item['max_score'] ?? 100,
                            'updated_at' => now(),
                        ]);
                }
            }
        }

        if ($request->has('criteria') && is_array($request->input('criteria'))) {
            self::setSetting('spoken_reading_criteria', $request->input('criteria'));
        }

        if ($request->has('readingCriteria') && is_array($request->input('readingCriteria'))) {
            self::setSetting('spoken_reading_criteria', $request->input('readingCriteria'));
        }

        if ($request->has('mockInterviewCriteria') && is_array($request->input('mockInterviewCriteria'))) {
            self::setSetting('mock_interview_criteria', $request->input('mockInterviewCriteria'));
        }

        if ($request->has('callSimulationCriteria') && is_array($request->input('callSimulationCriteria'))) {
            self::setSetting('call_simulation_criteria', $request->input('callSimulationCriteria'));
        }

        if ($request->has('certificationPrerequisites') && is_array($request->input('certificationPrerequisites'))) {
            self::setSetting('certification_prerequisites', $request->input('certificationPrerequisites'));
        }

        $updated = ScoringStandard::where('is_active', true)->orderBy('min_score')->get();
        $readingCriteria = self::getSetting('spoken_reading_criteria', []);
        $mockInterviewCriteria = self::getSetting('mock_interview_criteria', []);
        $callSimulationCriteria = self::getSetting('call_simulation_criteria', []);
        $certificationPrerequisites = self::getSetting('certification_prerequisites', [
            'required_readings' => 10,
            'required_mock_interviews' => 10,
            'required_call_simulations' => 10,
            'min_performance_avg' => 75,
            'min_exam_composite' => 85,
            'min_stage_score' => 70,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Scoring standards & evaluation criteria updated successfully.',
            'standards' => $updated,
            'criteria' => $readingCriteria,
            'readingCriteria' => $readingCriteria,
            'mockInterviewCriteria' => $mockInterviewCriteria,
            'callSimulationCriteria' => $callSimulationCriteria,
            'certificationPrerequisites' => $certificationPrerequisites,
        ]);
    }
}
