import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import HomePage from "../pages/HomePage";
import Dashboard from "../pages/Dashboard";
import ParagraphReading from "../pages/ParagraphReading";
import Register from "../pages/Register";
import EasyLevelParagraphReading from "../pages/EasyLevelParagraphReading";
import MediumLevelParagraphReading from "../pages/MediumLevelParagraphReading";
import HardLevelParagraphReading from "../pages/HardLevelParagraphReading";
import EasyLevelResult from "../pages/EasyLevelResult";
import MediumLevelResult from "../pages/MediumLevelResult";
import HardLevelResult from "../pages/HardLevelResult";
import MockInterview from "../pages/MockInterview";
import InitialInterview from "../pages/InitialInterview";
import InitialInterviewRecording from "../pages/InitialInterviewRecording";
import FinalInterview from "../pages/FinalInterview";
import FinalInterviewRecording from "../pages/FinalInterviewRecording";
import MockInterviewFeedback from "../pages/MockInterviewFeedback";
import CommunicationExercises from "../pages/CommunicationExercises";
import FillerWordExercise from "../pages/FillerWordExercise";
import GrammarExercise from "../pages/GrammarExercise";
import SpeechPacingExercise from "../pages/SpeechPacingExercise";
import CallSimulation from "../pages/CallSimulation";
import CallSimulationSession from "../pages/CallSimulationSession";
import PracticeHistory from "../pages/PracticeHistory";
import Profile from "../pages/Profile";
import PerformanceSummary from "../pages/PerformanceSummary";
import AdminLogin from "../pages/AdminLogin";
import AdminDashboard from "../pages/AdminDashboard";
import AdminScoringStandards from "../pages/AdminScoringStandards";
import ManageInterviewQuestions from "../pages/ManageInterviewQuestions";
import ManageParagraphs from "../pages/ManageParagraphs";
import ManageExercises from "../pages/ManageExercises";
import MonitorUsers from "../pages/MonitorUsers";
import AdminProfile from "../pages/AdminProfile";
import AdminApprovals from "../pages/AdminApprovals";
import PreAssessment from "../pages/PreAssessment";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public & Landing */}
      <Route path="/" element={<HomePage />} />
      <Route path="/homepage" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Applicant Dashboard & Core Assessment */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/pre-assessment" element={<PreAssessment />} />
      <Route path="/PreAssessment" element={<PreAssessment />} />

      {/* Paragraph Reading Module */}
      <Route path="/ParagraphReading" element={<ParagraphReading />} />
      <Route path="/paragraph-reading" element={<ParagraphReading />} />
      <Route path="/easy-level-paragraph-reading" element={<EasyLevelParagraphReading />} />
      <Route path="/medium-level-paragraph-reading" element={<MediumLevelParagraphReading />} />
      <Route path="/hard-level-paragraph-reading" element={<HardLevelParagraphReading />} />
      <Route path="/EasyLevelResult" element={<EasyLevelResult />} />
      <Route path="/medium-level-result" element={<MediumLevelResult />} />
      <Route path="/hard-level-result" element={<HardLevelResult />} />

      {/* Mock Interview Module */}
      <Route path="/MockInterview" element={<MockInterview />} />
      <Route path="/mock-interview" element={<MockInterview />} />
      <Route path="/InitialInterview" element={<InitialInterview />} />
      <Route path="/initial-interview" element={<InitialInterview />} />
      <Route path="/InitialInterviewRecording" element={<InitialInterviewRecording />} />
      <Route path="/initial-interview-recording" element={<InitialInterviewRecording />} />
      <Route path="/FinalInterview" element={<FinalInterview />} />
      <Route path="/final-interview" element={<FinalInterview />} />
      <Route path="/FinalInterviewRecording" element={<FinalInterviewRecording />} />
      <Route path="/final-interview-recording" element={<FinalInterviewRecording />} />
      <Route path="/MockInterviewFeedback" element={<MockInterviewFeedback />} />
      <Route path="/mock-interview-feedback" element={<MockInterviewFeedback />} />

      {/* Communication Exercises */}
      <Route path="/communication-exercises" element={<CommunicationExercises />} />
      <Route path="/CommunicationExercises" element={<CommunicationExercises />} />
      <Route path="/filler-word-exercise" element={<FillerWordExercise />} />
      <Route path="/FillerWordExercise" element={<FillerWordExercise />} />
      <Route path="/grammar-exercise" element={<GrammarExercise />} />
      <Route path="/GrammarExercise" element={<GrammarExercise />} />
      <Route path="/speech-pacing-exercise" element={<SpeechPacingExercise />} />
      <Route path="/SpeechPacingExercise" element={<SpeechPacingExercise />} />

      {/* Call Simulation Studio */}
      <Route path="/call-simulation" element={<CallSimulation />} />
      <Route path="/CallSimulation" element={<CallSimulation />} />
      <Route path="/call-simulation/:id" element={<CallSimulationSession />} />

      {/* History, Performance & Profile */}
      <Route path="/PracticeHistory" element={<PracticeHistory />} />
      <Route path="/practice-history" element={<PracticeHistory />} />
      <Route path="/PerformanceSummary" element={<PerformanceSummary />} />
      <Route path="/performance-summary" element={<PerformanceSummary />} />
      <Route path="/Profile" element={<Profile />} />
      <Route path="/profile" element={<Profile />} />

      {/* Admin & Super Admin Portal */}
      <Route path="/AdminLogin" element={<Navigate to="/login" replace />} />
      <Route path="/admin-login" element={<Navigate to="/login" replace />} />
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/AdminScoringStandards" element={<AdminScoringStandards />} />
      <Route path="/admin-scoring-standards" element={<AdminScoringStandards />} />
      <Route path="/ManageInterviewQuestions" element={<ManageInterviewQuestions />} />
      <Route path="/manage-interview-questions" element={<ManageInterviewQuestions />} />
      <Route path="/ManageParagraphs" element={<ManageParagraphs />} />
      <Route path="/manage-paragraphs" element={<ManageParagraphs />} />
      <Route path="/ManageExercises" element={<ManageExercises />} />
      <Route path="/manage-exercises" element={<ManageExercises />} />
      <Route path="/MonitorUsers" element={<MonitorUsers />} />
      <Route path="/monitor-users" element={<MonitorUsers />} />
      <Route path="/AdminProfile" element={<AdminProfile />} />
      <Route path="/admin-profile" element={<AdminProfile />} />
      <Route path="/AdminApprovals" element={<AdminApprovals />} />
      <Route path="/admin-approvals" element={<AdminApprovals />} />
    </Routes>
  );
}
