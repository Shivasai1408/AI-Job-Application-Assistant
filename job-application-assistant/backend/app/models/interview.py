from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    interview_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    interview_type = Column(String, default="video")  # phone, video, in-person
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled, rescheduled
    location = Column(String, nullable=True)  # video link or physical address
    notes = Column(Text, nullable=True)
    prep_notes = Column(Text, nullable=True)
    follow_up_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    application = relationship("Application", backref="interviews")
    user = relationship("User", backref="interviews")


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=True)  # 1-5
    feedback_notes = Column(Text, nullable=True)
    questions_asked = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", backref="feedback")
