<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CallSimulationSession extends Model
{
    use HasFactory;

    protected $table = 'call_simulation_sessions';
    public $timestamps = false;

    protected $fillable = [
        'applicant_id',
        'scenario_id',
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

    public function scenario()
    {
        return $this->belongsTo(CallScenario::class, 'scenario_id');
    }

    public function logs()
    {
        return $this->hasMany(CallSimulationLog::class, 'session_id');
    }
}
