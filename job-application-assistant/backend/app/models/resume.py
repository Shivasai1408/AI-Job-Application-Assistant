from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)  # e.g., "Original", "Tailored for Google"
    original_filename = Column(String, nullable=True)
    parsed_content = Column(Text, nullable=True)  # Full parsed text content
    ats_score = Column(Integer, nullable=True)  # Overall ATS score
    is_base = Column(Boolean, default=False)  # Is this the base/original resume?
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    tailored_versions = relationship("TailoredResume", back_populates="base_resume")


class TailoredResume(Base):
    __tablename__ = "tailored_resumes"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    tailored_content = Column(Text, nullable=False)
    changes_summary = Column(Text, nullable=True)  # What was changed and why
    ats_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    base_resume = relationship("Resume", back_populates="tailored_versions")
