<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceReport extends Model
{
    use HasFactory;

    protected $table = 'performance_reports';
    public $timestamps = false;

    protected $fillable = [
        'applicant_id',
        'generated_by_user_id',
        'report_type',
        'overall_score',
        'remarks',
        'generation_type',
        'generated_at',
    ];

    protected $casts = [
        'overall_score' => 'float',
        'generated_at' => 'datetime',
    ];

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by_user_id');
    }
}
