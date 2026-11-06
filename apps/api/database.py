from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from apps.api.config import settings
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Resolve SQLite database path reliably to project root
if settings.DATABASE_URL.startswith("sqlite"):
    rel_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if rel_path.startswith("./") or rel_path.startswith(".\\"):
        rel_path = rel_path[2:]
    abs_db_path = PROJECT_ROOT / rel_path
    abs_db_path.parent.mkdir(parents=True, exist_ok=True)
    db_url = f"sqlite:///{abs_db_path.as_posix()}"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
