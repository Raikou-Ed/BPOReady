<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParagraphFeedback extends Model
{
    use HasFactory;

    protected $table = 'paragraph_feedback';
    public $timestamps = false;

    protected $fillable = [
        'reading_session_id',
        'filler_word_count',
        'filler_words',
        'clarity_score',
        'confidence_score',
        'pacing_score',
        'volume_score',
        'grammar_score',
        'feedback_text',
        'suggestions',
        'created_at',
    ];

    protected $casts = [
        'filler_words' => 'array',
        'clarity_score' => 'float',
        'confidence_score' => 'float',
        'pacing_score' => 'float',
        'volume_score' => 'float',
        'grammar_score' => 'float',
        'created_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(ParagraphReadingSession::class, 'reading_session_id');
    }
}
