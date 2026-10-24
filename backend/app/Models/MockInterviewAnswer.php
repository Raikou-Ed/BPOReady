<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MockInterviewAnswer extends Model
{
    use HasFactory;

    protected $table = 'mock_interview_answers';
    public $timestamps = false;

    protected $fillable = [
        'mock_session_id',
        'question_id',
        'question_order',
        'answer_text',
        'recording_path',
        'duration_seconds',
    ];

    public function session()
    {
        return $this->belongsTo(MockInterviewSession::class, 'mock_session_id');
    }

    public function question()
    {
        return $this->belongsTo(InterviewQuestion::class, 'question_id');
    }
}
