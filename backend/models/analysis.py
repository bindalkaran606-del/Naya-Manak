from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


class TechnicalParameter(BaseModel):
    parameter: str
    value: str
    specified_in_spec: bool = True
    benchmark_is_norm: Optional[str] = None
    status: str = "specified"  # "specified", "inferred", "missing_recommended"


class ExtractedIntelligence(BaseModel):
    product_identified: str
    purpose: str
    target_operating_environment: str
    keywords: List[str] = Field(default_factory=list)
    technical_parameters: List[TechnicalParameter] = Field(default_factory=list)


class EvidenceClause(BaseModel):
    clause_no: str
    clause_name: str
    matched_requirement: str
    evidence_text: str


class RecommendedStandard(BaseModel):
    standard_code: str
    standard_title: str
    relevance_score: int  # 0 - 100
    status: str = "current"  # "current", "under_revision", "withdrawn"
    category: str
    technical_committee: Optional[str] = None
    qco_mandatory: bool = False
    why_recommended: str
    evidence_clauses: List[EvidenceClause] = Field(default_factory=list)
    related_standards_summary: List[str] = Field(default_factory=list)


class MissingParameter(BaseModel):
    parameter: str
    severity: str = "High"  # "Critical", "High", "Medium", "Informational"
    impact: str
    recommended_clause: str
    suggested_text: str


class AmbiguityFlag(BaseModel):
    term: str
    issue: str
    fix_suggestion: str


class QCOComplianceAlert(BaseModel):
    order_name: str
    requirement: str
    legal_mandate: str


class GapAnalysis(BaseModel):
    readiness_score: int  # e.g. 78 out of 100
    compliance_rating: str  # "High Readiness", "Moderate Gaps", "Critical Omissions"
    missing_parameters: List[MissingParameter] = Field(default_factory=list)
    ambiguity_flags: List[AmbiguityFlag] = Field(default_factory=list)
    qco_compliance_alerts: List[QCOComplianceAlert] = Field(default_factory=list)
    recommended_spec_amendment: str


class ProcurementAnalysisCreate(BaseModel):
    title: Optional[str] = None
    sector: Optional[str] = "General"
    department: Optional[str] = "Procurement Division"
    conformity_scheme: Optional[str] = None
    source_type: str = "text"  # "text" | "pdf_upload"
    raw_text: str
    document_name: Optional[str] = None


class CatalogReference(BaseModel):
    code: str
    title: str


class ProcurementAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    sector: str
    department: str
    conformity_scheme: Optional[str] = None
    source_type: str = "text"
    raw_text: str
    document_name: Optional[str] = None
    created_at: str
    status: str = "completed"
    extracted_intelligence: ExtractedIntelligence
    recommendations: List[RecommendedStandard] = Field(default_factory=list)
    gap_analysis: GapAnalysis
    outcome: str = "legacy_demo"
    outcome_message: str = ""
    catalog_matches: List[CatalogReference] = Field(default_factory=list)
    engine_mode: str = "mock_heuristic"


class AnalyticsStats(BaseModel):
    total_standards_indexed: int
    total_analyses_completed: int
    high_confidence_rate: int
    critical_gaps_prevented: int
    qco_mandatory_standards_count: int
