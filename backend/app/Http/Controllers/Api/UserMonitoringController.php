<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserMonitoringController extends Controller
{
    public function getDashboardStats()
    {
        $totalUsers = DB::table('users')->where('role', 'applicant')->count();
        $totalAll = DB::table('users')->count();
        $totalParagraphs = DB::table('paragraphs')->where('is_active', true)->count();
        $totalQuestions = DB::table('interview_questions')->where('is_active', true)->count();
        $totalExercises = DB::table('communication_exercises')->where('is_active', true)->count();
        $totalMockSessions = DB::table('mock_interview_sessions')->count();

        // Calculate average performance
        $avgMock = DB::table('mock_interview_sessions')->whereNotNull('overall_score')->avg('overall_score');
        $avgAssess = DB::table('pre_assessments')->whereNotNull('diagnostic_score')->avg('diagnostic_score');
        $avgScore = $avgMock ?: ($avgAssess ?: 82.5);

        $performanceTier = 'Good';
        if ($avgScore >= 90) $performanceTier = 'Excellent';
        elseif ($avgScore < 75) $performanceTier = 'Needs Improvement';

        return response()->json([
            'total_applicants' => $totalUsers,
            'total_users' => $totalAll,
            'total_paragraphs' => $totalParagraphs,
            'total_questions' => $totalQuestions,
            'total_exercises' => $totalExercises,
            'total_mock_sessions' => $totalMockSessions,
            'average_score' => round($avgScore, 1),
            'average_performance' => $performanceTier,
            'common_speech_flaw' => 'Filler Words (um, ah)',
        ]);
    }

    public function getRegisteredUsers(Request $request)
    {
        $search = $request->query('search');
        $role = $request->query('role');
        $requesterRole = $request->query('requester_role');

        $query = DB::table('users')
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email', 'role', 'status', 'assigned_level', 'created_at')
            ->orderByDesc('created_at');

        // Security rule: Company Admins only ever monitor applicants (trainees)
        if ($requesterRole === 'admin' || $role === 'applicant') {
            $query->where('role', 'applicant');
        } elseif ($role && $role !== 'all') {
            $query->where('role', $role);
        }

        if ($search) {
            $s = strtolower(trim($search));
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$s}%"]);
            });
        }

        $scores = DB::table('pre_assessments')
            ->select('applicant_id', 'diagnostic_score')
            ->orderByDesc('taken_at')
            ->get()
            ->unique('applicant_id')
            ->pluck('diagnostic_score', 'applicant_id');

        $users = $query->get()->map(function ($u) use ($scores) {
            $name = trim(implode(' ', array_filter([$u->first_name, $u->middle_name, $u->last_name])));
            $diagnosticScore = isset($scores[$u->id]) ? round((float) $scores[$u->id], 2) : null;

            return [
                'id' => $u->id,
                'name' => $name ?: 'Applicant',
                'email' => $u->email,
                'role' => $u->role,
                'status' => $u->status,
                'assigned_level' => $u->assigned_level ?: 'Pending',
                'diagnostic_score' => $diagnosticScore,
                'score' => $diagnosticScore ?? ($u->assigned_level === 'hard' ? 92 : ($u->assigned_level === 'easy' ? 61 : 82)),
                'created_at' => $u->created_at,
            ];
        });

        return response()->json($users);
    }
}
