<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CallScenario extends Model
{
    use HasFactory;

    protected $table = 'call_scenarios';

    protected $fillable = [
        'created_by_user_id',
        'call_type',
        'title',
        'scenario_brief',
        'difficulty',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function dialogues()
    {
        return $this->hasMany(ScenarioDialogue::class, 'scenario_id')->orderBy('sequence_order');
    }
}
