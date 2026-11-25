<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BpoReadySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users (Super Admin, Admin, Applicant)
        $superAdminId = DB::table('users')->where('email', 'superadmin@bpoready.com')->value('id');
        if (!$superAdminId) {
            $superAdminId = DB::table('users')->insertGetId([
                'first_name' => 'System',
                'last_name' => 'SuperAdmin',
                'middle_name' => 'M',
                'email' => 'superadmin@bpoready.com',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'super_admin',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $adminId = DB::table('users')->where('email', 'admin@bpoready.com')->value('id');
        if (!$adminId) {
            $adminId = DB::table('users')->insertGetId([
                'first_name' => 'Company',
                'last_name' => 'Admin',
                'middle_name' => 'C',
                'email' => 'admin@bpoready.com',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'admin',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $applicantId = DB::table('users')->where('email', 'applicant@bpoready.com')->value('id');
        if (!$applicantId) {
            $applicantId = DB::table('users')->insertGetId([
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'middle_name' => 'Santos',
                'email' => 'applicant@bpoready.com',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'applicant',
                'status' => 'active',
                'assigned_level' => 'easy',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $chiazamId = DB::table('users')->where('email', 'chiazam@gmail.com')->value('id');
        if (!$chiazamId) {
            $chiazamId = DB::table('users')->insertGetId([
                'first_name' => 'Chiazam',
                'last_name' => 'Candidate',
                'middle_name' => null,
                'email' => 'chiazam@gmail.com',
                'password_hash' => Hash::make('Password123!'),
                'role' => 'applicant',
                'status' => 'active',
                'assigned_level' => 'hard',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Seed Scoring Standards
        if (DB::table('scoring_standards')->count() === 0) {
            DB::table('scoring_standards')->insert([
                [
                    'managed_by_user_id' => $adminId,
                    'level' => 'easy',
                    'min_score' => 0.00,
                    'max_score' => 75.00,
                    'is_active' => true,
                    'updated_at' => now(),
                ],
                [
                    'managed_by_user_id' => $adminId,
                    'level' => 'medium',
                    'min_score' => 76.00,
                    'max_score' => 89.00,
                    'is_active' => true,
                    'updated_at' => now(),
                ],
                [
                    'managed_by_user_id' => $adminId,
                    'level' => 'hard',
                    'min_score' => 90.00,
                    'max_score' => 100.00,
                    'is_active' => true,
                    'updated_at' => now(),
                ],
            ]);
        }

        // 3. Seed Paragraphs
        if (DB::table('paragraphs')->count() === 0) {
            DB::table('paragraphs')->insert([
                [
                    'created_by_user_id' => $superAdminId,
                    'title' => 'The Value of Daily Speaking Practice',
                    'content' => 'Speaking English clearly takes time, patience, and regular practice. When you read aloud every day, you improve your voice, rhythm, and confidence. Using simple words helps everyone understand your message right away. Staying calm and breathing properly allows you to speak smoothly and share your thoughts with ease.',
                    'difficulty' => 'easy',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'title' => 'Effective Communication in the Workplace',
                    'content' => 'Effective communication is an essential skill in every modern workplace. When people share their ideas clearly and listen with respect, teams solve problems faster and achieve better results. Practicing structured speech techniques helps individuals build vocal confidence, control their speaking pace, and adapt comfortably to different professional conversations. Over time, consistent practice transforms everyday spoken interactions into meaningful professional relationships.',
                    'difficulty' => 'medium',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'title' => 'Mastering Advanced Verbal Precision',
                    'content' => 'Mastering advanced verbal communication requires cognitive adaptability, precise phonetic articulation, and disciplined breath management. Professionals who articulate intricate concepts clearly can navigate high-pressure discussions with authority and composure. Developing these capabilities demands sustained linguistic awareness, critical self-evaluation, and continuous refinement across demanding professional environments. Ultimately, achieving vocal excellence empowers individuals to deliver persuasive arguments, project executive presence, and influence organizational outcomes.',
                    'difficulty' => 'hard',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 4. Seed Base Interview Questions (Initial & Final)
        if (DB::table('interview_questions')->count() === 0) {
            DB::table('interview_questions')->insert([
                // Initial Questions
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'Tell me about yourself and why you chose to pursue an entry-level career in the BPO industry.',
                    'interview_type' => 'initial',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'What are your top strengths, and how will they help you provide outstanding customer service?',
                    'interview_type' => 'initial',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'How do you handle shifting schedules, rotating days off, and working during night shifts or holidays?',
                    'interview_type' => 'initial',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'Can you share an experience where you received constructive feedback, and how did you use it to improve?',
                    'interview_type' => 'initial',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'Why should our company hire you, and what makes you a dependable team player?',
                    'interview_type' => 'initial',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],

                // Final Questions
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'Describe a scenario where a customer is shouting and angry. How would you de-escalate the call while staying professional?',
                    'interview_type' => 'final',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'How would you handle a customer whose issue cannot be immediately resolved due to company policy?',
                    'interview_type' => 'final',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'Tell me about a time you had a disagreement with a team member. How did you handle the situation constructively?',
                    'interview_type' => 'final',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'If a customer uses personal insults toward you during a difficult conversation, how do you protect your composure and maintain control of the interaction?',
                    'interview_type' => 'final',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'question_text' => 'What are your professional career aspirations over the next two to three years within our BPO organization?',
                    'interview_type' => 'final',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 5. Seed Communication Exercises
        if (DB::table('communication_exercises')->count() === 0) {
            DB::table('communication_exercises')->insert([
                [
                    'created_by_user_id' => $superAdminId,
                    'target_flaw' => 'filler_words',
                    'exercise_type' => 'drill',
                    'title' => 'Filler Word Elimination Drill',
                    'exercise_content' => 'Read this explanation to a customer without using fillers like "um", "uh", "you know", or "basically". Use natural 1-second silent pauses to collect your thoughts: "I have confirmed your billing account. The adjustment credit of twenty-five dollars has been applied successfully, and you will see it reflected on your upcoming invoice within twenty-four hours."',
                    'difficulty' => 'easy',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'target_flaw' => 'grammar',
                    'exercise_type' => 'correction',
                    'title' => 'Customer Service Grammar Accuracy',
                    'exercise_content' => 'Correct and speak the following sentence with proper verb tense and polite phrasing: "We is already sending the technician yesterday and he don\'t find any broken cables in your home." (Correct version: "We sent the technician yesterday, and he did not find any broken cables in your home.")',
                    'difficulty' => 'medium',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'created_by_user_id' => $superAdminId,
                    'target_flaw' => 'speech_pacing',
                    'exercise_type' => 'pacing_meter',
                    'title' => 'Optimal Speech Pacing Practice (130-145 WPM)',
                    'exercise_content' => 'Speak this passage at an even, controlled tempo. Aim for approximately 25 seconds of clear, composed delivery: "Good day, and welcome to Premium Cardholder Concierge. My name is Alex. Today I will be assisting you with booking your travel reservation, verifying your reward points, and confirming your hotel itinerary. Please allow me a moment while I pull up your travel profile."',
                    'difficulty' => 'easy',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 6. Seed Call Scenarios & Dialogues
        if (DB::table('call_scenarios')->count() === 0) {
            $scenario1Id = DB::table('call_scenarios')->insertGetId([
                'created_by_user_id' => $superAdminId,
                'call_type' => 'inbound',
                'title' => 'Inbound Customer Billing Dispute',
                'scenario_brief' => 'An irate customer calls regarding an unexpected $35 roaming fee on their mobile statement. Acknowledge frustration, show empathy, explain the charge politely, and offer a resolution.',
                'difficulty' => 'medium',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('scenario_dialogues')->insert([
                [
                    'scenario_id' => $scenario1Id,
                    'sequence_order' => 1,
                    'speaker_role' => 'customer',
                    'transcript_text' => 'Hello! I am looking at my statement right now and there is a thirty-five dollar international charge! I specifically told your agent last month that I turned roaming off! I demand this taken off right now!',
                    'audio_file_path' => null,
                ],
                [
                    'scenario_id' => $scenario1Id,
                    'sequence_order' => 2,
                    'speaker_role' => 'customer',
                    'transcript_text' => 'Alright, thank you for clarifying that. If you waive the charge this time, how will I be sure it won\'t happen again next billing cycle?',
                    'audio_file_path' => null,
                ],
            ]);

            $scenario2Id = DB::table('call_scenarios')->insertGetId([
                'created_by_user_id' => $superAdminId,
                'call_type' => 'outbound',
                'title' => 'Outbound Delivery Rescheduling Call',
                'scenario_brief' => 'Call the customer to inform them that their scheduled hardware delivery had to be delayed due to courier weather advisories, and reschedule for their preferred time.',
                'difficulty' => 'easy',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('scenario_dialogues')->insert([
                [
                    'scenario_id' => $scenario2Id,
                    'sequence_order' => 1,
                    'speaker_role' => 'customer',
                    'transcript_text' => 'Hello? Who is this and why are you calling my phone in the middle of a business meeting?',
                    'audio_file_path' => null,
                ],
                [
                    'scenario_id' => $scenario2Id,
                    'sequence_order' => 2,
                    'speaker_role' => 'customer',
                    'transcript_text' => 'I understand weather delays happen. Can you deliver it tomorrow morning between 9 AM and 11 AM instead?',
                    'audio_file_path' => null,
                ],
            ]);
        }
    }
}
