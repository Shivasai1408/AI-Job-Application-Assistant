import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/Resumes';
import ResumeBuilder from './pages/ResumeBuilder';
import ResumeTemplates from './pages/ResumeTemplates';
import JobSearch from './pages/JobSearch';
import JobDetails from './pages/JobDetails';
import Applications from './pages/Applications';
import CoverLetters from './pages/CoverLetters';
import ATSScore from './pages/ATSScore';
import InterviewScheduler from './pages/InterviewScheduler';
import JobAlerts from './pages/JobAlerts';
import SkillGapAnalyzer from './pages/SkillGapAnalyzer';
import AutoApply from './pages/AutoApply';
import CareerAdvisor from './pages/CareerAdvisor';
import InterviewPrep from './pages/InterviewPrep';
import EmailGenerator from './pages/EmailGenerator';
import PortfolioBuilder from './pages/PortfolioBuilder';
import LinkedInOptimizer from './pages/LinkedInOptimizer';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import JobAnalyzer from './pages/JobAnalyzer';
import Downloads from './pages/Downloads';
import Profile from './pages/Profile';
import Layout from './components/Layout';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="resumes" element={<Resumes />} />
        <Route path="resumes/new" element={<ResumeBuilder />} />
        <Route path="resumes/templates" element={<ResumeTemplates />} />
        <Route path="resumes/:id" element={<ResumeBuilder />} />
        <Route path="jobs" element={<JobSearch />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="applications" element={<Applications />} />
        <Route path="cover-letters" element={<CoverLetters />} />
        <Route path="ats-score" element={<ATSScore />} />
        <Route path="interviews" element={<InterviewScheduler />} />
        <Route path="alerts" element={<JobAlerts />} />
        <Route path="skill-gap" element={<SkillGapAnalyzer />} />
        <Route path="auto-apply" element={<AutoApply />} />
        <Route path="career-advisor" element={<CareerAdvisor />} />
        <Route path="interview-prep" element={<InterviewPrep />} />
        <Route path="email-generator" element={<EmailGenerator />} />
        <Route path="portfolio" element={<PortfolioBuilder />} />
        <Route path="linkedin-optimizer" element={<LinkedInOptimizer />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="job-analyzer" element={<JobAnalyzer />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
