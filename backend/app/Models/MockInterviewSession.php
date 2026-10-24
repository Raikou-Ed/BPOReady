<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MockInterviewSession extends Model
{
    use HasFactory;

    protected $table = 'mock_interview_sessions';
    public $timestamps = false;

    protected $fillable = [
        'applicant_id',
        'interview_type',
        'overall_score',
        'status',
        'started_at',
        'submitted_at',
    ];

    protected $casts = [
        'overall_score' => 'float',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function answers()
    {
        return $this->hasMany(MockInterviewAnswer::class, 'mock_session_id');
    }

    public function feedback()
    {
        return $this->hasOne(MockInterviewFeedback::class, 'mock_session_id');
    }
}
