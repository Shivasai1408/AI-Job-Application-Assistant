from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


user_saved_jobs = Table(
    "user_saved_jobs",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("job_id", Integer, ForeignKey("jobs.id"), primary_key=True),
)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    salary_range = Column(String, nullable=True)
    job_type = Column(String, nullable=True)  # full-time, part-time, contract
    experience_level = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    source = Column(String, nullable=True)  # linkedin, indeed, manual
    source_url = Column(String, nullable=True)
    posted_date = Column(DateTime, nullable=True)
    skills_required = Column(Text, nullable=True)  # Comma-separated extracted skills
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    saved_by_users = relationship(
        "User",
        secondary=user_saved_jobs,
        back_populates="saved_jobs",
    )
    applications = relationship("Application", back_populates="job")
