<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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