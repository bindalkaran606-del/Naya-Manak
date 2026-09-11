import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type {
  IndianStandard,
  StandardsQueryResponse,
  ProcurementAnalysis,
  ProcurementAnalysisCreate,
  AnalyticsStats,
  PresetRequirement,
} from "@/types/standards";

export const manakApi = {
  // Standards queries
  getStandards: async (params?: {
    search?: string;
    product?: string;
    category?: string;
    status?: string;
    qco_only?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<StandardsQueryResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.product) query.set("product", params.product);
    if (params?.category && params.category !== "All") query.set("category", params.category);
    if (params?.status && params.status !== "All") query.set("status", params.status);
    if (params?.qco_only) query.set("qco_only", "true");
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.skip) query.set("skip", params.skip.toString());

    const qs = query.toString();
    return apiGet<StandardsQueryResponse>(`/standards${qs ? `?${qs}` : ""}`);
  },

  getStandardByCode: async (code: string): Promise<IndianStandard> => {
    return apiGet<IndianStandard>(`/standards/${encodeURIComponent(code)}`);
  },

  getPresets: async (): Promise<PresetRequirement[]> => {
    return apiGet<PresetRequirement[]>("/standards/presets");
  },

  // Analysis workflow
  analyzeRequirement: async (
    payload: ProcurementAnalysisCreate
  ): Promise<ProcurementAnalysis> => {
    return apiPost<ProcurementAnalysis>("/analyze-requirement", payload);
  },

  getAnalyses: async (limit = 50, skip = 0): Promise<ProcurementAnalysis[]> => {
    return apiGet<ProcurementAnalysis[]>(`/analyses?limit=${limit}&skip=${skip}`);
  },

  getAnalysisById: async (id: string): Promise<ProcurementAnalysis> => {
    return apiGet<ProcurementAnalysis>(`/analyses/${id}`);
  },

  deleteAnalysis: async (id: string): Promise<{ message: string; id: string }> => {
    return apiDelete<{ message: string; id: string }>(`/analyses/${id}`);
  },

  getStats: async (): Promise<AnalyticsStats> => {
    return apiGet<AnalyticsStats>("/stats");
  },

  exportTenderBrief: async (analysisId: string): Promise<any> => {
    return apiPost<any>(`/export-tender-brief?analysis_id=${analysisId}`);
  },
};
