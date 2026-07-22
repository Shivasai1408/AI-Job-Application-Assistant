from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from app.database import Base
from datetime import datetime


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    theme = Column(String, default="modern")  # modern, classic, minimalist, creative
    custom_css = Column(Text, nullable=True)
    sections = Column(Text, nullable=True)  # JSON string of section order and visibility
    section_order = Column(Text, nullable=True)  # JSON array of section names in order
    generated_html = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
