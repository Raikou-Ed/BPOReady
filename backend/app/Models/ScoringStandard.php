<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScoringStandard extends Model
{
    use HasFactory;

    protected $table = 'scoring_standards';
    public $timestamps = false;

    protected $fillable = [
        'managed_by_user_id',
        'level',
        'min_score',
        'max_score',
        'is_active',
        'updated_at',
    ];

    protected $casts = [
        'min_score' => 'float',
        'max_score' => 'float',
        'is_active' => 'boolean',
        'updated_at' => 'datetime',
    ];

    public function manager()
    {
        return $this->belongsTo(User::class, 'managed_by_user_id');
    }
}
