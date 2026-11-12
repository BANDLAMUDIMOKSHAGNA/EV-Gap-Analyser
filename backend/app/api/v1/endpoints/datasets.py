from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.models.schema import Dataset
from backend.app.schemas.common import DatasetOut
from typing import List

router = APIRouter(prefix="/datasets", tags=["Datasets Provenance"])

@router.get("", response_model=List[DatasetOut])
def get_datasets(db: Session = Depends(get_db)):
    """
    Returns all registered open datasets, their sources, licensing, and demo flags.
    Adheres strictly to the Data Honesty rules.
    """
    datasets = db.query(Dataset).all()
    return datasets
