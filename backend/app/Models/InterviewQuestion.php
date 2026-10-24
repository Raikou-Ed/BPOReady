<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InterviewQuestion extends Model
{
    use HasFactory;

    protected $table = 'interview_questions';

    protected $fillable = [
        'created_by_user_id',
        'question_text',
        'interview_type',
        'is_active',
        'approval_status',
        'reviewer_notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
