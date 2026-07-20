from sqlalchemy import Column, Integer, String, JSON, DateTime, Float
from app.db.base import Base
import datetime

class Herb(Base):
    __tablename__ = "herbs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sanskrit_name = Column(String, nullable=True)
    latin_name = Column(String, nullable=True)
    benefits = Column(JSON)  # list of strings
    side_effects = Column(JSON)
    doshas = Column(JSON)  # e.g. ["vata","kapha"]
    contraindications = Column(JSON, nullable=True)
    long_term_benefits = Column(JSON, nullable=True)
    evidence_level = Column(String, default="Traditional")
    educational_notes = Column(String, nullable=True)
    category = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class PriceHistory(Base):
    __tablename__ = "price_history"
    id = Column(Integer, primary_key=True, index=True)
    herb_id = Column(Integer, index=True)
    price = Column(Float)
    unit = Column(String)
    vendor = Column(String)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

class QueryLog(Base):
    __tablename__ = "query_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    query_type = Column(String)
    input_hash = Column(String)
    response_summary = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
