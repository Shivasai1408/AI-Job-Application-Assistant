from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class LinkedInOptimization(Base):
    __tablename__ = "linkedin_optimizations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    section_name = Column(String, nullable=False)  # headline, about, skills, experience
    original_content = Column(Text, nullable=True)
    optimized_content = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="linkedin_optimizations")


class LinkedInKeyword(Base):
    __tablename__ = "linkedin_keywords"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_title = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    keywords = Column(Text, nullable=False)  # JSON array of keywords
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="linkedin_keywords")
