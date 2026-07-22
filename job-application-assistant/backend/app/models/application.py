from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    tailored_resume_id = Column(Integer, ForeignKey("tailored_resumes.id"), nullable=True)
    cover_letter_id = Column(Integer, ForeignKey("cover_letters.id"), nullable=True)
    status = Column(String, default="draft")  # draft, submitted, reviewing, interview, offer, rejected, withdrawn
    notes = Column(Text, nullable=True)
    applied_date = Column(DateTime, nullable=True)
    interview_date = Column(DateTime, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    tailored_resume = relationship("TailoredResume", foreign_keys=[tailored_resume_id])
    cover_letter = relationship("CoverLetter", foreign_keys=[cover_letter_id])


class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    content = Column(Text, nullable=False)
    tone = Column(String, default="professional")  # professional, enthusiastic, formal
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    job = relationship("Job")
