<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paragraph extends Model
{
    use HasFactory;

    protected $table = 'paragraphs';

    protected $fillable = [
        'created_by_user_id',
        'title',
        'content',
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
}
