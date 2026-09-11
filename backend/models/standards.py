from pydantic import BaseModel, Field
from typing import List, Optional
import uuid


class KeyClause(BaseModel):
    clause_no: str
    clause_title: str
    requirement_summary: str
    test_method: Optional[str] = None
    tolerance_limit: Optional[str] = None


class TestMethod(BaseModel):
    name: str
    method_standard: str
    frequency: str
    mandatory: bool = True


class Amendment(BaseModel):
    amendment_no: str
    date: str
    summary: str
    status: str = "Active"


class RelatedStandard(BaseModel):
    code: str
    title: str
    relation_type: str  # "Complementary", "Test Method", "Part of Series", "Supersedes"


class IndianStandard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # e.g. "IS 10322 (Part 5/Sec 3): 2012"
    title: str
    category: str  # "Electrotechnical", "Civil Engineering", "Mechanical", "Safety & Fire", "Chemical", "Water & Utilities"
    technical_committee: str  # e.g. "ETD 24 Illumination Engineering"
    ics_code: str
    status: str = "current"  # "current" | "under_revision" | "withdrawn"
    reaffirmation_year: Optional[int] = None
    gazetted_date: Optional[str] = None
    qco_mandatory: bool = False  # Mandatory under BIS Quality Control Order
    scope: str
    why_recommended_template: Optional[str] = None
    key_clauses: List[KeyClause] = Field(default_factory=list)
    test_methods: List[TestMethod] = Field(default_factory=list)
    amendments: List[Amendment] = Field(default_factory=list)
    related_standards: List[RelatedStandard] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class ProductTemplate(BaseModel):
    id: str
    label: str


class StandardsQueryResponse(BaseModel):
    standards: List[IndianStandard]
    total_count: int
    categories: List[str] = Field(default_factory=list)
    products: List[ProductTemplate] = Field(default_factory=list)
    outcome: str = "matched"
    message: str = ""
