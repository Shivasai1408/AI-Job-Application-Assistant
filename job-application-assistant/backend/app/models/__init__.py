from app.models.user import User
from app.models.resume import Resume, TailoredResume
from app.models.job import Job
from app.models.application import Application, CoverLetter
from app.models.interview import Interview, InterviewFeedback
from app.models.alert import JobAlert, Notification
from app.models.interview_prep import InterviewQuestion, InterviewSession
from app.models.career_advice import CareerAdvice, SalaryPrediction
from app.models.email_template import EmailTemplate, EmailHistory
from app.models.portfolio import Portfolio
from app.models.linkedin_optimizer import LinkedInOptimization, LinkedInKeyword
from app.models.analytics import AnalyticsSnapshot
from app.models.otp import OTP

__all__ = [
    "User", "Resume", "TailoredResume", "Job", "Application", "CoverLetter",
    "Interview", "InterviewFeedback", "JobAlert", "Notification",
    "InterviewQuestion", "InterviewSession", "CareerAdvice", "SalaryPrediction",
    "EmailTemplate", "EmailHistory", "Portfolio", "LinkedInOptimization",
    "LinkedInKeyword", "AnalyticsSnapshot", "OTP",
]
