from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models import Dataset
from apps.api.schemas.common import DatasetOut
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
