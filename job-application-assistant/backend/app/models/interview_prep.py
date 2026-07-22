from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_title = Column(String, nullable=True)
    company = Column(String, nullable=True)
    category = Column(String, nullable=False)  # technical, behavioral, situational
    question = Column(Text, nullable=False)
    sample_answer = Column(Text, nullable=True)
    difficulty = Column(String, default="medium")  # easy, medium, hard
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="interview_questions")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_title = Column(String, nullable=True)
    company = Column(String, nullable=True)
    question = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    user_answer = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)  # 1-100
    feedback = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    confidence_assessment = Column(String, nullable=True)  # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="interview_sessions")
