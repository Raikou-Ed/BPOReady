<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ParagraphController;
use App\Http\Controllers\Api\PreAssessmentController;
use App\Http\Controllers\Api\InterviewQuestionController;
use App\Http\Controllers\Api\ScoringStandardController;
use App\Http\Controllers\Api\CommunicationExerciseController;
use App\Http\Controllers\Api\MockInterviewController;
use App\Http\Controllers\Api\CallSimulationController;
use App\Http\Controllers\Api\UserMonitoringController;
use App\Http\Controllers\Api\PerformanceReportController;
use App\Http\Controllers\Api\ApprovalController;

// Authentication
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/admin-login', [AuthController::class, 'adminLogin']);
Route::put('/auth/profile/{id}', [AuthController::class, 'updateProfile']);
Route::post('/auth/change-password/{id}', [AuthController::class, 'changePassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Paragraph Reading
Route::get('/paragraphs', [ParagraphController::class, 'index']);
Route::post('/paragraphs', [ParagraphController::class, 'store']);
Route::get('/paragraphs/{id}', [ParagraphController::class, 'show']);
Route::put('/paragraphs/{id}', [ParagraphController::class, 'update']);
Route::delete('/paragraphs/{id}', [ParagraphController::class, 'destroy']);
Route::post('/paragraph-reading/submit', [ParagraphController::class, 'submitReading']);

// Pre-Assessment
Route::post('/pre-assessment/analyze', [PreAssessmentController::class, 'analyze']);
Route::post('/pre-assessment/save-result', [PreAssessmentController::class, 'saveResult']);
Route::get('/pre-assessment/user/{applicantId}', [PreAssessmentController::class, 'getUserAssessment']);

// Interview Questions
Route::get('/interview-questions', [InterviewQuestionController::class, 'index']);
Route::post('/interview-questions', [InterviewQuestionController::class, 'store']);
Route::get('/interview-questions/{id}', [InterviewQuestionController::class, 'show']);
Route::put('/interview-questions/{id}', [InterviewQuestionController::class, 'update']);
Route::delete('/interview-questions/{id}', [InterviewQuestionController::class, 'destroy']);

// Scoring Standards
Route::get('/scoring-standards', [ScoringStandardController::class, 'index']);
Route::put('/scoring-standards', [ScoringStandardController::class, 'update']);

// Communication Exercises
Route::get('/exercises', [CommunicationExerciseController::class, 'index']);
Route::post('/exercises', [CommunicationExerciseController::class, 'store']);
Route::get('/exercises/{id}', [CommunicationExerciseController::class, 'show']);
Route::put('/exercises/{id}', [CommunicationExerciseController::class, 'update']);
Route::delete('/exercises/{id}', [CommunicationExerciseController::class, 'destroy']);
Route::post('/exercises/submit', [CommunicationExerciseController::class, 'submitAttempt']);
Route::post('/exercises/evaluate-filler', [CommunicationExerciseController::class, 'evaluateFiller']);

// Mock Interview Simulation
Route::get('/mock-interview/questions', [MockInterviewController::class, 'getQuestions']);
Route::post('/mock-interview/submit', [MockInterviewController::class, 'submitSession']);
Route::get('/mock-interview/feedback/{sessionId}', [MockInterviewController::class, 'getFeedback']);

// Call Simulation
Route::get('/call-simulations/scenarios', [CallSimulationController::class, 'index']);
Route::post('/call-simulations/scenarios', [CallSimulationController::class, 'store']);
Route::post('/call-simulations/submit', [CallSimulationController::class, 'submitSession']);

// Admin Monitoring & Analytics
Route::get('/admin/dashboard-stats', [UserMonitoringController::class, 'getDashboardStats']);
Route::get('/admin/registered-users', [UserMonitoringController::class, 'getRegisteredUsers']);

// Super Admin Approvals Center
Route::get('/admin/approvals', [ApprovalController::class, 'index']);
Route::post('/admin/approvals/{type}/{id}/approve', [ApprovalController::class, 'approve']);
Route::post('/admin/approvals/{type}/{id}/reject', [ApprovalController::class, 'reject']);

// Performance Reports & History
Route::get('/reports/history/{applicantId}', [PerformanceReportController::class, 'getPracticeHistory']);
Route::get('/reports/summary/{applicantId}', [PerformanceReportController::class, 'getPerformanceSummary']);
