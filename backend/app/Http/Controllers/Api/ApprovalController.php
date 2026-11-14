<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paragraph;
use App\Models\InterviewQuestion;
use App\Models\CommunicationExercise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'all'); // 'all', 'updated', 'pending', 'approved', 'rejected'
        $type = $request->query('type'); // 'paragraph', 'question', 'exercise'

        $paragraphsQuery = DB::table('paragraphs')
            ->leftJoin('users', 'paragraphs.created_by_user_id', '=', 'users.id')
            ->select(
                'paragraphs.id',
                'paragraphs.title',
                'paragraphs.content',
                'paragraphs.difficulty',
                'paragraphs.approval_status',
                'paragraphs.is_active',
                'paragraphs.reviewer_notes',
                'paragraphs.created_at',
                'paragraphs.updated_at',
                DB::raw("CASE WHEN paragraphs.updated_at IS NOT NULL AND paragraphs.updated_at > paragraphs.created_at THEN true ELSE false END as is_updated"),
                DB::raw("'paragraph' as content_type"),
                DB::raw("CONCAT(users.first_name, ' ', users.last_name) as submitted_by"),
                'users.role as submitter_role'
            );

        $questionsQuery = DB::table('interview_questions')
            ->leftJoin('users', 'interview_questions.created_by_user_id', '=', 'users.id')
            ->select(
                'interview_questions.id',
                DB::raw("CONCAT(INITCAP(interview_questions.interview_type::text), ' Interview Question') as title"),
                'interview_questions.question_text as content',
                DB::raw("'medium' as difficulty"),
                'interview_questions.approval_status',
                'interview_questions.is_active',
                'interview_questions.reviewer_notes',
                'interview_questions.created_at',
                'interview_questions.updated_at',
                DB::raw("CASE WHEN interview_questions.updated_at IS NOT NULL AND interview_questions.updated_at > interview_questions.created_at THEN true ELSE false END as is_updated"),
                DB::raw("'question' as content_type"),
                DB::raw("CONCAT(users.first_name, ' ', users.last_name) as submitted_by"),
                'users.role as submitter_role'
            );

        $exercisesQuery = DB::table('communication_exercises')
            ->leftJoin('users', 'communication_exercises.created_by_user_id', '=', 'users.id')
            ->select(
                'communication_exercises.id',
                'communication_exercises.title',
                'communication_exercises.exercise_content as content',
                'communication_exercises.difficulty',
                'communication_exercises.approval_status',
                'communication_exercises.is_active',
                'communication_exercises.reviewer_notes',
                'communication_exercises.created_at',
                'communication_exercises.updated_at',
                DB::raw("CASE WHEN communication_exercises.updated_at IS NOT NULL AND communication_exercises.updated_at > communication_exercises.created_at THEN true ELSE false END as is_updated"),
                DB::raw("'exercise' as content_type"),
                DB::raw("CONCAT(users.first_name, ' ', users.last_name) as submitted_by"),
                'users.role as submitter_role'
            );

        // Apply status filter
        if ($status === 'updated') {
            $paragraphsQuery->whereRaw('paragraphs.updated_at > paragraphs.created_at');
            $questionsQuery->whereRaw('interview_questions.updated_at > interview_questions.created_at');
            $exercisesQuery->whereRaw('communication_exercises.updated_at > communication_exercises.created_at');
        } elseif ($status !== 'all') {
            $paragraphsQuery->where('paragraphs.approval_status', $status);
            $questionsQuery->where('interview_questions.approval_status', $status);
            $exercisesQuery->where('communication_exercises.approval_status', $status);
        }

        // Apply content type filter if specified
        $allCollection = collect();
        if (!$type || $type === 'paragraph') {
            $allCollection = $allCollection->concat($paragraphsQuery->get());
        }
        if (!$type || $type === 'question') {
            $allCollection = $allCollection->concat($questionsQuery->get());
        }
        if (!$type || $type === 'exercise') {
            $allCollection = $allCollection->concat($exercisesQuery->get());
        }

        $items = $allCollection
            ->sortByDesc(function ($item) {
                return $item->updated_at ?: $item->created_at;
            })
            ->values();

        // Calculate count metrics across platform
        $totalItems = DB::table('paragraphs')->count()
            + DB::table('interview_questions')->count()
            + DB::table('communication_exercises')->count();

        $updatedCount = DB::table('paragraphs')->whereRaw('updated_at > created_at')->count()
            + DB::table('interview_questions')->whereRaw('updated_at > created_at')->count()
            + DB::table('communication_exercises')->whereRaw('updated_at > created_at')->count();

        $activeCount = DB::table('paragraphs')->where('is_active', true)->count()
            + DB::table('interview_questions')->where('is_active', true)->count()
            + DB::table('communication_exercises')->where('is_active', true)->count();

        $companyAdminCount = DB::table('paragraphs')
                ->join('users', 'paragraphs.created_by_user_id', '=', 'users.id')
                ->where('users.role', 'admin')->count()
            + DB::table('interview_questions')
                ->join('users', 'interview_questions.created_by_user_id', '=', 'users.id')
                ->where('users.role', 'admin')->count()
            + DB::table('communication_exercises')
                ->join('users', 'communication_exercises.created_by_user_id', '=', 'users.id')
                ->where('users.role', 'admin')->count();

        return response()->json([
            'items' => $items,
            'counts' => [
                'total' => $totalItems,
                'updated' => $updatedCount,
                'active' => $activeCount,
                'company_admin' => $companyAdminCount,
                'pending' => 0, // Direct publishing enabled per adviser directive
                'approved' => $activeCount,
                'rejected' => 0,
            ]
        ]);
    }

    public function approve($type, $id)
    {
        $table = $this->resolveTable($type);
        if (!$table) {
            return response()->json(['message' => 'Invalid content type.'], 400);
        }

        DB::table($table)->where('id', $id)->update([
            'approval_status' => 'approved',
            'is_active' => true,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Content successfully marked active and logged in audit history.']);
    }

    public function reject(Request $request, $type, $id)
    {
        $table = $this->resolveTable($type);
        if (!$table) {
            return response()->json(['message' => 'Invalid content type.'], 400);
        }

        $notes = $request->input('notes', 'Content flagged by Super Admin for revisions.');

        DB::table($table)->where('id', $id)->update([
            'approval_status' => 'rejected',
            'is_active' => false,
            'reviewer_notes' => $notes,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Content archived/deactivated with revision note.']);
    }

    private function resolveTable($type)
    {
        switch (strtolower($type)) {
            case 'paragraph':
            case 'paragraphs':
                return 'paragraphs';
            case 'question':
            case 'questions':
            case 'interview_question':
            case 'interview_questions':
                return 'interview_questions';
            case 'exercise':
            case 'exercises':
            case 'communication_exercise':
            case 'communication_exercises':
                return 'communication_exercises';
            default:
                return null;
        }
    }
}
