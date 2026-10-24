<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InterviewQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InterviewQuestionController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type'); // 'initial', 'final'
        $isAdmin = $request->query('admin') || $request->query('all');
        $query = InterviewQuestion::query();

        if (!$isAdmin) {
            $query->where('is_active', true)
                  ->where(function ($q) {
                      $q->where('approval_status', 'approved')->orWhereNull('approval_status');
                  });
        }

        if ($type) {
            $query->where('interview_type', $type);
        }

        $questions = $query->orderBy('id')->get();
        return response()->json($questions);
    }

    public function show($id)
    {
        $question = InterviewQuestion::find($id);
        if (!$question) {
            return response()->json(['message' => 'Question not found'], 404);
        }
        return response()->json($question);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'question_text' => 'required|string',
            'interview_type' => 'required|in:initial,final',
            'created_by_user_id' => 'nullable|integer',
            'approval_status' => 'nullable|in:pending,approved,rejected',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $status = $request->input('approval_status', 'approved');

        $question = InterviewQuestion::create([
            'question_text' => $request->input('question_text'),
            'interview_type' => $request->input('interview_type'),
            'created_by_user_id' => $request->input('created_by_user_id'),
            'approval_status' => $status,
            'is_active' => $status === 'approved',
        ]);

        return response()->json($question, 201);
    }

    public function update(Request $request, $id)
    {
        $question = InterviewQuestion::find($id);
        if (!$question) {
            return response()->json(['message' => 'Question not found'], 404);
        }

        $question->update($request->only(['question_text', 'interview_type', 'is_active', 'approval_status', 'reviewer_notes']));
        return response()->json($question);
    }

    public function destroy($id)
    {
        $question = InterviewQuestion::find($id);
        if (!$question) {
            return response()->json(['message' => 'Question not found'], 404);
        }

        // Soft delete / deactivate to preserve historical session references
        $question->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Question removed successfully']);
    }
}
