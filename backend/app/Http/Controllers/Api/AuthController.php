<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['nullable', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $email = strtolower(trim($data['email']));
        if (DB::table('users')->where('email', $email)->exists()) {
            return response()->json(['message' => 'An account with this email already exists.'], 409);
        }

        $firstName = trim($data['first_name'] ?? '');
        $middleName = !empty($data['middle_name']) ? trim($data['middle_name']) : null;
        $lastName = trim($data['last_name'] ?? '');

        if (!$firstName && !empty($data['name'])) {
            $nameParts = preg_split('/\s+/', trim($data['name']), 3);
            $firstName = $nameParts[0] ?? trim($data['name']);
            $lastName = $nameParts[1] ?? '';
            $middleName = $nameParts[2] ?? null;
        }

        if (!$firstName) {
            return response()->json(['message' => 'First name is required.'], 422);
        }

        if (!$lastName) {
            return response()->json(['message' => 'Last name is required.'], 422);
        }

        $fullName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName])));

        $user = [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'middle_name' => $middleName,
            'email' => $email,
            'password_hash' => Hash::make($data['password']),
            'role' => 'applicant',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $id = DB::table('users')->insertGetId($user);
        $user['id'] = $id;
        $user['name'] = $fullName;
        unset($user['password_hash']);

        return response()->json([
            'user' => $user,
            'token' => Str::random(40),
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = DB::table('users')->where('email', strtolower(trim($data['email'])))->first();
        if (!$user || !Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'This account is not active.'], 403);
        }

        $userData = (array) $user;
        $userData['name'] = trim(implode(' ', array_filter([
            $user->first_name,
            $user->middle_name,
            $user->last_name,
        ])));
        unset($userData['password_hash']);

        return response()->json([
            'user' => $userData,
            'token' => Str::random(40),
        ]);
    }

    public function updateProfile(Request $request, $id)
    {
        $data = $request->validate([
            'first_name' => ['nullable', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($data['email']));
        $duplicate = DB::table('users')
            ->where('email', $email)
            ->where('id', '!=', $id)
            ->exists();

        if ($duplicate) {
            return response()->json(['message' => 'Another account already uses this email.'], 409);
        }

        $firstName = trim($data['first_name'] ?? '');
        $middleName = array_key_exists('middle_name', $data) ? (trim($data['middle_name'] ?? '') ?: null) : null;
        $lastName = trim($data['last_name'] ?? '');

        if (!$firstName && !empty($data['name'])) {
            $nameParts = preg_split('/\s+/', trim($data['name']), 3);
            $firstName = $nameParts[0] ?? trim($data['name']);
            $lastName = $nameParts[1] ?? '';
            $middleName = $nameParts[2] ?? null;
        }

        $updates = [
            'email' => $email,
            'updated_at' => now(),
        ];
        if ($firstName) {
            $updates['first_name'] = $firstName;
        }
        if ($lastName) {
            $updates['last_name'] = $lastName;
        }
        if (array_key_exists('middle_name', $data) || !empty($data['name'])) {
            $updates['middle_name'] = $middleName;
        }

        DB::table('users')->where('id', $id)->update($updates);

        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        $userData = (array) $user;
        $userData['name'] = trim(implode(' ', array_filter([
            $user->first_name,
            $user->middle_name,
            $user->last_name,
        ])));
        unset($userData['password_hash']);

        return response()->json(['user' => $userData]);
    }

    public function adminLogin(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = DB::table('users')->where('email', strtolower(trim($data['email'])))->first();
        if (!$user || !Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'This account is not active.'], 403);
        }

        if (!in_array($user->role, ['admin', 'super_admin'], true)) {
            return response()->json(['message' => 'Access denied. Administrator privileges required.'], 403);
        }

        $userData = (array) $user;
        $userData['name'] = trim(implode(' ', array_filter([
            $user->first_name,
            $user->middle_name,
            $user->last_name,
        ])));
        unset($userData['password_hash']);

        return response()->json([
            'user' => $userData,
            'token' => Str::random(40),
        ]);
    }

    public function changePassword(Request $request, $id)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        if (!Hash::check($data['current_password'], $user->password_hash)) {
            return response()->json(['message' => 'Current password does not match.'], 422);
        }

        DB::table('users')->where('id', $id)->update([
            'password_hash' => Hash::make($data['new_password']),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    private function ensureResetTokensTable()
    {
        if (!Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function ($table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    public function sendResetCode(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower(trim($request->email));
        $user = DB::table('users')->where('email', $email)->first();
        if (!$user) {
            return response()->json(['message' => 'No registered account found with this email address.'], 404);
        }

        $this->ensureResetTokensTable();

        // Generate 6-digit random verification code
        $code = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ]
        );

        $userName = trim(implode(' ', array_filter([$user->first_name ?? '', $user->last_name ?? '']))) ?: 'Learner';

        $mailSent = false;
        try {
            Mail::html("
                <div style='font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;'>
                    <div style='text-align: center; margin-bottom: 24px;'>
                        <h1 style='color: #1e3a8a; margin: 0; font-size: 26px; font-weight: 800;'>BPO<span style='color: #2563eb;'>Ready</span></h1>
                        <p style='color: #6b7280; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0;'>Practice Today, Perform Tomorrow.</p>
                    </div>
                    <div style='border-top: 1px solid #f3f4f6; padding-top: 20px;'>
                        <h2 style='color: #111827; font-size: 18px; font-weight: 700; margin-bottom: 8px;'>Password Reset Code</h2>
                        <p style='color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 16px;'>
                            Hello <strong>{$userName}</strong>,<br>
                            We received a request to reset your password. Use the 6-digit verification code below to complete your password reset:
                        </p>
                        <div style='background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1.5px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;'>
                            <span style='font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;'>{$code}</span>
                        </div>
                        <p style='color: #6b7280; font-size: 13px; line-height: 1.5;'>
                            ⏱️ This verification code will expire in <strong>15 minutes</strong>.<br>
                            If you did not request this password reset, please ignore this email or make sure your account is secure.
                        </p>
                    </div>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 16px;' />
                    <p style='color: #9ca3af; font-size: 11px; text-align: center; margin: 0;'>
                        BPOReady Speech Coaching & Interview Simulation Platform
                    </p>
                </div>
            ", function ($message) use ($email) {
                $message->to($email)
                        ->subject('BPOReady - Password Reset Verification Code');
            });
            $mailSent = true;
        } catch (\Throwable $e) {
            $mailSent = false;
        }

        return response()->json([
            'success' => true,
            'message' => $mailSent
                ? 'A 6-digit verification code has been sent to your email.'
                : 'A 6-digit verification code has been generated.',
            'code' => $code,
            'mail_sent' => $mailSent,
        ]);
    }

    public function verifyResetCode(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $email = strtolower(trim($data['email']));
        $this->ensureResetTokensTable();

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();
        if (!$record) {
            return response()->json(['message' => 'No active password reset request found for this email.'], 404);
        }

        // Check if expired (> 15 minutes)
        if (\Carbon\Carbon::parse($record->created_at)->addMinutes(15)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json(['message' => 'Your verification code has expired. Please request a new one.'], 422);
        }

        // Verify code
        if (!Hash::check($data['code'], $record->token)) {
            return response()->json(['message' => 'Invalid verification code. Please check your email and try again.'], 422);
        }

        // Update user's password
        DB::table('users')->where('email', $email)->update([
            'password_hash' => Hash::make($data['password']),
            'updated_at' => now(),
        ]);

        // Clean up reset token
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully! You can now sign in with your new password.'
        ]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = DB::table('users')->where('email', strtolower(trim($data['email'])))->first();
        if (!$user) {
            return response()->json(['message' => 'No account found with this email.'], 404);
        }

        DB::table('users')->where('id', $user->id)->update([
            'password_hash' => Hash::make($data['password']),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Password has been reset successfully.']);
    }
}