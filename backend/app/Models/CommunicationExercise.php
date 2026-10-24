<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunicationExercise extends Model
{
    use HasFactory;

    protected $table = 'communication_exercises';

    protected $fillable = [
        'created_by_user_id',
        'target_flaw',
        'exercise_type',
        'title',
        'exercise_content',
        'difficulty',
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

    public function attempts()
    {
        return $this->hasMany(ExerciseAttempt::class, 'exercise_id');
    }
}
