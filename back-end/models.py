from sqlalchemy import Column, DateTime, Integer, JSON, String, Text
from sqlalchemy.sql import func

from db import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(String(128), index=True, nullable=True)
    message = Column(Text, nullable=True)
    url = Column(Text, nullable=True)
    tone = Column(String(32), nullable=False)
    persona = Column(String(32), nullable=False)
    score = Column(Integer, nullable=False)
    clarity = Column(Integer, nullable=False)
    emotion = Column(Integer, nullable=False)
    credibility = Column(Integer, nullable=False)
    market_effectiveness = Column(Integer, nullable=False)
    suggestion = Column(Text, nullable=False)
    insights = Column(JSON, nullable=False)
    analysis_meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class RateLimitEvent(Base):
    __tablename__ = "rate_limit_events"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), index=True, nullable=False)
    ts_epoch = Column(Integer, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
