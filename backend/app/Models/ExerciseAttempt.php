<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExerciseAttempt extends Model
{
    use HasFactory;

    protected $table = 'exercise_attempts';
    public $timestamps = false;

    protected $fillable = [
        'applicant_id',
        'exercise_id',
        'response_text',
        'recording_path',
        'score',
        'status',
        'feedback',
        'taken_at',
    ];

    protected $casts = [
        'score' => 'float',
        'taken_at' => 'datetime',
    ];

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function exercise()
    {
        return $this->belongsTo(CommunicationExercise::class, 'exercise_id');
    }
}
