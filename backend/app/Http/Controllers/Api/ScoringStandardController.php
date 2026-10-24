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
        return response()->json($standards);
    }

    public function update(Request $request)
    {
        $v = Validator::make($request->all(), [
            'standards' => 'required|array',
            'standards.*.level' => 'required|in:easy,medium,hard',
            'standards.*.min_score' => 'required|numeric|min:0|max:100',
            'standards.*.max_score' => 'required|numeric|min:0|max:100',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        foreach ($request->input('standards') as $item) {
            DB::table('scoring_standards')
                ->where('level', $item['level'])
                ->update([
                    'min_score' => $item['min_score'],
                    'max_score' => $item['max_score'],
                    'updated_at' => now(),
                ]);
        }

        $updated = ScoringStandard::where('is_active', true)->orderBy('min_score')->get();
        return response()->json([
            'success' => true,
            'message' => 'Scoring standards updated successfully.',
            'standards' => $updated,
        ]);
    }
}
