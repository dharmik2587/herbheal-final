from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class HerbResponse(BaseModel):
    id: int
    name: str
    sanskrit_name: Optional[str] = None
    latin_name: Optional[str] = None
    benefits: List[str]
    side_effects: List[str]
    doshas: List[str]
    contraindications: Optional[List[str]] = None
    long_term_benefits: Optional[List[str]] = None
    evidence_level: str
    educational_notes: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class PriceResponse(BaseModel):
    id: int
    herb_id: int
    price: float
    unit: str
    vendor: str
    last_updated: datetime

    class Config:
        from_attributes = True
