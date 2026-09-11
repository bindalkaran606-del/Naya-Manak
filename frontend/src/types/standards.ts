export interface KeyClause {
  clause_no: string;
  clause_title: string;
  requirement_summary: string;
  test_method?: string | null;
  tolerance_limit?: string | null;
}

export interface TestMethod {
  name: string;
  method_standard: string;
  frequency: string;
  mandatory: boolean;
}

export interface Amendment {
  amendment_no: string;
  date: string;
  summary: string;
  status: string;
}

export interface RelatedStandard {
  code: string;
  title: string;
  relation_type: string;
}

export interface IndianStandard {
  id: string;
  code: string;
  title: string;
  category: string;
  technical_committee: string;
  ics_code: string;
  status: "current" | "under_revision" | "withdrawn" | string;
  reaffirmation_year?: number | null;
  gazetted_date?: string | null;
  qco_mandatory: boolean;
  scope: string;
  why_recommended_template?: string | null;
  key_clauses: KeyClause[];
  test_methods: TestMethod[];
  amendments: Amendment[];
  related_standards: RelatedStandard[];
  keywords: string[];
}

export interface ProductTemplate {
  id: string;
  label: string;
}

export interface StandardsQueryResponse {
  standards: IndianStandard[];
  total_count: number;
  categories: string[];
  products: ProductTemplate[];
  outcome: string;
  message: string;
}

export interface TechnicalParameter {
  parameter: string;
  value: string;
  specified_in_spec: boolean;
  benchmark_is_norm?: string | null;
  status: "specified" | "inferred" | "missing_recommended" | string;
}

export interface ExtractedIntelligence {
  product_identified: string;
  purpose: string;
  target_operating_environment: string;
  keywords: string[];
  technical_parameters: TechnicalParameter[];
}

export interface EvidenceClause {
  clause_no: string;
  clause_name: string;
  matched_requirement: string;
  evidence_text: string;
}

export interface RecommendedStandard {
  standard_code: string;
  standard_title: string;
  relevance_score: number;
  status: "current" | "under_revision" | "withdrawn" | string;
  category: string;
  technical_committee?: string | null;
  qco_mandatory: boolean;
  why_recommended: string;
  evidence_clauses: EvidenceClause[];
  related_standards_summary: string[];
}

export interface MissingParameter {
  parameter: string;
  severity: "Critical" | "High" | "Medium" | "Informational" | string;
  impact: string;
  recommended_clause: string;
  suggested_text: string;
}

export interface AmbiguityFlag {
  term: string;
  issue: string;
  fix_suggestion: string;
}

export interface QCOComplianceAlert {
  order_name: string;
  requirement: string;
  legal_mandate: string;
}

export interface GapAnalysis {
  readiness_score: number;
  compliance_rating: string;
  missing_parameters: MissingParameter[];
  ambiguity_flags: AmbiguityFlag[];
  qco_compliance_alerts: QCOComplianceAlert[];
  recommended_spec_amendment: string;
}

export interface ProcurementAnalysisCreate {
  title?: string;
  sector?: string;
  department?: string;
  conformity_scheme?: string;
  source_type: "text" | "pdf_upload";
  raw_text: string;
  document_name?: string;
}

export interface CatalogReference {
  code: string;
  title: string;
}

export interface ProcurementAnalysis {
  id: string;
  title: string;
  sector: string;
  department: string;
  conformity_scheme?: string | null;
  source_type: string;
  raw_text: string;
  document_name?: string | null;
  created_at: string;
  status: string;
  extracted_intelligence: ExtractedIntelligence;
  recommendations: RecommendedStandard[];
  gap_analysis: GapAnalysis;
  outcome: string;
  outcome_message: string;
  catalog_matches: CatalogReference[];
  engine_mode: string;
}

export interface AnalyticsStats {
  total_standards_indexed: number;
  total_analyses_completed: number;
  high_confidence_rate: number;
  critical_gaps_prevented: number;
  qco_mandatory_standards_count: number;
}

export interface PresetRequirement {
  id: string;
  title: string;
  sector: string;
  department: string;
  conformity_scheme: string;
  document_name: string;
  sample_text: string;
}
