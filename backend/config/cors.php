<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Configured for BPOReady Production & Development Deployment.
    | Allows Cloudflare Pages (*.pages.dev), Cloudflare Tunnels (*.trycloudflare.com),
    | and local development environments.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\\.pages\\.dev$#',
        '#^https://.*\\.trycloudflare\\.com$#',
        '#^https?://localhost(:[0-9]+)?$#',
        '#^https?://127\\.0\\.0\\.1(:[0-9]+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];

