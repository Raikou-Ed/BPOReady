<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'app' => 'BPOReady Backend API',
        'database' => 'Connected (Supabase PostgreSQL)',
        'timestamp' => now()->toIso8601String(),
    ]);
});

