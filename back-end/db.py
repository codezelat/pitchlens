import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pitchlens.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_owner_column()
    _ensure_analysis_meta_column()


def _ensure_owner_column() -> None:
    inspector = inspect(engine)
    if "analyses" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("analyses")}
    if "owner_id" in columns:
        _ensure_owner_index(inspector)
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE analyses ADD COLUMN owner_id VARCHAR(128)"))
    _ensure_owner_index(inspector)


def _ensure_owner_index(inspector) -> None:
    indexes = {idx.get("name") for idx in inspector.get_indexes("analyses")}
    if "ix_analyses_owner_id" in indexes:
        return
    with engine.begin() as conn:
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_analyses_owner_id ON analyses (owner_id)"))


def _ensure_analysis_meta_column() -> None:
    inspector = inspect(engine)
    if "analyses" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("analyses")}
    if "analysis_meta" in columns:
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE analyses ADD COLUMN analysis_meta JSON"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
