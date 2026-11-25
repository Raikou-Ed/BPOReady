<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScoringStandard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ScoringStandardController extends Controller
{
    public function index()
    {
        $standards = ScoringStandard::where('is_active', true)->orderBy('min_score')->get();
        $readingCriteria = cache()->get('spoken_reading_criteria', [
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

        $mockInterviewCriteria = cache()->get('mock_interview_criteria', [
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

        $callSimulationCriteria = cache()->get('call_simulation_criteria', [
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

        $certificationPrerequisites = cache()->get('certification_prerequisites', [
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
            cache()->forever('spoken_reading_criteria', $request->input('criteria'));
        }

        if ($request->has('readingCriteria') && is_array($request->input('readingCriteria'))) {
            cache()->forever('spoken_reading_criteria', $request->input('readingCriteria'));
        }

        if ($request->has('mockInterviewCriteria') && is_array($request->input('mockInterviewCriteria'))) {
            cache()->forever('mock_interview_criteria', $request->input('mockInterviewCriteria'));
        }

        if ($request->has('callSimulationCriteria') && is_array($request->input('callSimulationCriteria'))) {
            cache()->forever('call_simulation_criteria', $request->input('callSimulationCriteria'));
        }

        if ($request->has('certificationPrerequisites') && is_array($request->input('certificationPrerequisites'))) {
            cache()->forever('certification_prerequisites', $request->input('certificationPrerequisites'));
        }

        $updated = ScoringStandard::where('is_active', true)->orderBy('min_score')->get();
        $readingCriteria = cache()->get('spoken_reading_criteria', []);
        $mockInterviewCriteria = cache()->get('mock_interview_criteria', []);
        $callSimulationCriteria = cache()->get('call_simulation_criteria', []);
        $certificationPrerequisites = cache()->get('certification_prerequisites', [
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
