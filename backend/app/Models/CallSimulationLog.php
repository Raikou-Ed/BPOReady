<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CallSimulationLog extends Model
{
    use HasFactory;

    protected $table = 'call_simulation_logs';
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'user_audio_path',
        'duration_seconds',
        'empathy_score',
        'resolution_score',
        'clarity_score',
        'ai_feedback',
        'created_at',
    ];

    protected $casts = [
        'empathy_score' => 'float',
        'resolution_score' => 'float',
        'clarity_score' => 'float',
        'created_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(CallSimulationSession::class, 'session_id');
    }
}
