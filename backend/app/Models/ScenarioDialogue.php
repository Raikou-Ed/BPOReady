<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScenarioDialogue extends Model
{
    use HasFactory;

    protected $table = 'scenario_dialogues';
    public $timestamps = false;

    protected $fillable = [
        'scenario_id',
        'sequence_order',
        'speaker_role',
        'transcript_text',
        'audio_file_path',
    ];

    public function scenario()
    {
        return $this->belongsTo(CallScenario::class, 'scenario_id');
    }
}
