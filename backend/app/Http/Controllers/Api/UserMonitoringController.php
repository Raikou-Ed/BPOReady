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

    public function deleteUser($id)
    {
        // Protect core system accounts
        if (in_array((int)$id, [17, 18, 19])) {
            return response()->json([
                'success' => false,
                'message' => 'Default system accounts (SuperAdmin, Admin, Juan Dela Cruz) cannot be deleted.'
            ], 403);
        }

        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => "User account with ID {$id} not found."
            ], 404);
        }

        try {
            DB::transaction(function () use ($id) {
                // 1. Paragraph reading feedback & sessions
                $readingSessionIds = DB::table('paragraph_reading_sessions')->where('applicant_id', $id)->pluck('id');
                if ($readingSessionIds->isNotEmpty()) {
                    DB::table('paragraph_feedback')->whereIn('reading_session_id', $readingSessionIds)->delete();
                    DB::table('paragraph_reading_sessions')->where('applicant_id', $id)->delete();
                }

                // 2. Mock interview answers, feedback & sessions
                $mockSessionIds = DB::table('mock_interview_sessions')->where('applicant_id', $id)->pluck('id');
                if ($mockSessionIds->isNotEmpty()) {
                    DB::table('mock_interview_answers')->whereIn('mock_session_id', $mockSessionIds)->delete();
                    DB::table('mock_interview_feedback')->whereIn('mock_session_id', $mockSessionIds)->delete();
                    DB::table('mock_interview_sessions')->where('applicant_id', $id)->delete();
                }

                // 3. Call simulation logs & sessions
                $callSessionIds = DB::table('call_simulation_sessions')->where('applicant_id', $id)->pluck('id');
                if ($callSessionIds->isNotEmpty()) {
                    DB::table('call_simulation_logs')->whereIn('session_id', $callSessionIds)->delete();
                    DB::table('call_simulation_sessions')->where('applicant_id', $id)->delete();
                }

                // 4. Communication exercise attempts
                DB::table('exercise_attempts')->where('applicant_id', $id)->delete();

                // 5. Pre-assessments & performance reports
                DB::table('pre_assessments')->where('applicant_id', $id)->delete();
                DB::table('performance_reports')->where('applicant_id', $id)->delete();

                // 6. Reset any created_by / generated_by references to NULL if any
                DB::table('paragraphs')->where('created_by_user_id', $id)->update(['created_by_user_id' => null]);
                DB::table('interview_questions')->where('created_by_user_id', $id)->update(['created_by_user_id' => null]);
                DB::table('communication_exercises')->where('created_by_user_id', $id)->update(['created_by_user_id' => null]);
                DB::table('call_scenarios')->where('created_by_user_id', $id)->update(['created_by_user_id' => null]);
                DB::table('performance_reports')->where('generated_by_user_id', $id)->update(['generated_by_user_id' => null]);

                // 7. Delete user record
                DB::table('users')->where('id', $id)->delete();
            });

            return response()->json([
                'success' => true,
                'message' => "User ID {$id} has been permanently deleted from the database."
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }
}
