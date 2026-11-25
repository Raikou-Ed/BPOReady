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
        $criteria = cache()->get('spoken_reading_criteria', [
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

        return response()->json([
            'standards' => $standards,
            'criteria' => $criteria,
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

        $updated = ScoringStandard::where('is_active', true)->orderBy('min_score')->get();
        $criteria = cache()->get('spoken_reading_criteria', []);

        return response()->json([
            'success' => true,
            'message' => 'Scoring standards & evaluation criteria updated successfully.',
            'standards' => $updated,
            'criteria' => $criteria,
        ]);
    }
}
