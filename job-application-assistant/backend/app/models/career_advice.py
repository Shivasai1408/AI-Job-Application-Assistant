from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class CareerAdvice(Base):
    __tablename__ = "career_advice"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    advice_type = Column(String, nullable=False)  # career_path, salary_prediction, trending_skills, certifications
    input_data = Column(Text, nullable=True)  # JSON string of input parameters
    result_data = Column(Text, nullable=False)  # JSON string of result
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="career_advice")


class SalaryPrediction(Base):
    __tablename__ = "salary_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_title = Column(String, nullable=False)
    location = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    predicted_min_salary = Column(Float, nullable=True)
    predicted_max_salary = Column(Float, nullable=True)
    predicted_avg_salary = Column(Float, nullable=True)
    currency = Column(String, default="USD")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="salary_predictions")
