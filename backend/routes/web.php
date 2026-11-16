<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    if ($request->wantsJson()) {
        return response()->json([
            'status' => 'online',
            'app' => 'BPOReady API',
            'environment' => config('app.env'),
            'frontend' => 'https://bpoready.pages.dev',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    return response('<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BPOReady API &bull; Operational</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: "Poppins", sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 48px 40px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
        .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 12px #10b981; }
        h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
        h1 span { color: #3b82f6; }
        p.subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 32px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px; text-align: left; }
        .item { background: #0f172a; border: 1px solid #334155; border-radius: 14px; padding: 14px 16px; }
        .item .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
        .item .val { font-size: 13px; font-weight: 600; color: #e2e8f0; margin-top: 4px; }
        .btn { display: inline-block; width: 100%; background: #2563eb; color: white; padding: 14px 24px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 14px; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }
        .btn:hover { background: #1d4ed8; }
        .footer { margin-top: 24px; font-size: 11px; color: #64748b; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge"><span class="dot"></span> Backend API Operational</div>
        <h1>BPO<span>Ready</span></h1>
        <p class="subtitle">Cloud Speech Coaching &amp; Interview Simulation Engine</p>
        
        <div class="grid">
            <div class="item">
                <div class="label">API Gateway</div>
                <div class="val" style="color: #34d399;">v1.0 &bull; Healthy</div>
            </div>
            <div class="item">
                <div class="label">Database</div>
                <div class="val" style="color: #38bdf8;">PostgreSQL 3NF</div>
            </div>
            <div class="item">
                <div class="label">Speech AI</div>
                <div class="val" style="color: #a78bfa;">Gemini + Web Audio</div>
            </div>
            <div class="item">
                <div class="label">Direct Reset</div>
                <div class="val" style="color: #34d399;">HTTPS Encrypted</div>
            </div>
        </div>

        <a href="https://bpoready.pages.dev" class="btn">Launch BPOReady Web App &rarr;</a>
        
        <div class="footer">
            Designed for Filipino BPO Job Seekers &bull; QuadSync
        </div>
    </div>
</body>
</html>', 200, ['Content-Type' => 'text/html; charset=utf-8']);
});
