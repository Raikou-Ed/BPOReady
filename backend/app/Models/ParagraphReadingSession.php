<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParagraphReadingSession extends Model
{
    use HasFactory;

    protected $table = 'paragraph_reading_sessions';
    public $timestamps = false;

    protected $fillable = [
        'applicant_id',
        'paragraph_id',
        'recording_path',
        'mime_type',
        'duration_seconds',
        'status',
        'started_at',
        'submitted_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function paragraph()
    {
        return $this->belongsTo(Paragraph::class, 'paragraph_id');
    }

    public function feedback()
    {
        return $this->hasOne(ParagraphFeedback::class, 'reading_session_id');
    }
}
