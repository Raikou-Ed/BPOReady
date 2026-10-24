<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PreAssessment extends Model
{
    use HasFactory;

    protected $table = 'pre_assessments';
    public $timestamps = false;

    protected $fillable = [
        'applicant_id',
        'paragraph_id',
        'recording_path',
        'diagnostic_score',
        'placed_level',
        'status',
        'taken_at',
        'evaluated_at',
    ];

    protected $casts = [
        'diagnostic_score' => 'float',
        'taken_at' => 'datetime',
        'evaluated_at' => 'datetime',
    ];

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function paragraph()
    {
        return $this->belongsTo(Paragraph::class, 'paragraph_id');
    }
}
