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
        $status = $request->query('status', 'pending');

        $paragraphsQuery = DB::table('paragraphs')
            ->leftJoin('users', 'paragraphs.created_by_user_id', '=', 'users.id')
            ->select(
                'paragraphs.id',
                'paragraphs.title',
                'paragraphs.content',
                'paragraphs.difficulty',
                'paragraphs.approval_status',
                'paragraphs.reviewer_notes',
                'paragraphs.created_at',
                DB::raw("'paragraph' as content_type"),
                DB::raw("CONCAT(users.first_name, ' ', users.last_name) as submitted_by"),
                'users.role as submitter_role'
            );

        $questionsQuery = DB::table('interview_questions')
            ->leftJoin('users', 'interview_questions.created_by_user_id', '=', 'users.id')
            ->select(
                'interview_questions.id',
                DB::raw("CONCAT(interview_questions.interview_type::text, ' Interview Question') as title"),
                'interview_questions.question_text as content',
                DB::raw("'medium' as difficulty"),
                'interview_questions.approval_status',
                'interview_questions.reviewer_notes',
                'interview_questions.created_at',
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
                'communication_exercises.reviewer_notes',
                'communication_exercises.created_at',
                DB::raw("'exercise' as content_type"),
                DB::raw("CONCAT(users.first_name, ' ', users.last_name) as submitted_by"),
                'users.role as submitter_role'
            );

        if ($status !== 'all') {
            $paragraphsQuery->where('paragraphs.approval_status', $status);
            $questionsQuery->where('interview_questions.approval_status', $status);
            $exercisesQuery->where('communication_exercises.approval_status', $status);
        }

        $items = $paragraphsQuery->get()
            ->concat($questionsQuery->get())
            ->concat($exercisesQuery->get())
            ->sortByDesc('created_at')
            ->values();

        // Calculate count metrics
        $pendingCount = DB::table('paragraphs')->where('approval_status', 'pending')->count()
            + DB::table('interview_questions')->where('approval_status', 'pending')->count()
            + DB::table('communication_exercises')->where('approval_status', 'pending')->count();

        $approvedCount = DB::table('paragraphs')->where('approval_status', 'approved')->count()
            + DB::table('interview_questions')->where('approval_status', 'approved')->count()
            + DB::table('communication_exercises')->where('approval_status', 'approved')->count();

        $rejectedCount = DB::table('paragraphs')->where('approval_status', 'rejected')->count()
            + DB::table('interview_questions')->where('approval_status', 'rejected')->count()
            + DB::table('communication_exercises')->where('approval_status', 'rejected')->count();

        return response()->json([
            'items' => $items,
            'counts' => [
                'pending' => $pendingCount,
                'approved' => $approvedCount,
                'rejected' => $rejectedCount,
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

        return response()->json(['message' => 'Content successfully approved and marked active for applicants.']);
    }

    public function reject(Request $request, $type, $id)
    {
        $table = $this->resolveTable($type);
        if (!$table) {
            return response()->json(['message' => 'Invalid content type.'], 400);
        }

        $notes = $request->input('notes', 'Content requires revisions to meet platform standards.');

        DB::table($table)->where('id', $id)->update([
            'approval_status' => 'rejected',
            'is_active' => false,
            'reviewer_notes' => $notes,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Content rejected with feedback note.']);
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
