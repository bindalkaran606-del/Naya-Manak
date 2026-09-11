import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowRight, 
  Upload, 
  FileText, 
  Clock, 
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ModelTransparencyModal } from "@/components/ModelTransparencyModal";
import { useQuery } from "@tanstack/react-query";
import { manakApi } from "@/services/manakApi";
import type { PresetRequirement } from "@/types/standards";

export default function Dashboard() {
  const navigate = useNavigate();
  const [transparencyOpen, setTransparencyOpen] = useState(false);
  const [requirementText, setRequirementText] = useState("");

  const { data: analyses } = useQuery({
    queryKey: ["analyses", "dashboard"],
    queryFn: () => manakApi.getAnalyses(10),
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: manakApi.getStats,
  });

  const { data: presets } = useQuery({
    queryKey: ["presets"],
    queryFn: manakApi.getPresets,
  });

  const handleAnalyze = () => {
    if (requirementText.trim()) {
      navigate("/new", { state: { initialText: requirementText } });
    } else {
      navigate("/new");
    }
  };

  const handleSelectPreset = (preset: PresetRequirement) => {
    navigate("/new", { 
      state: { 
        initialText: preset.sample_text, 
        initialTitle: preset.title,
        initialSector: preset.sector,
        initialDept: preset.department,
        initialScheme: preset.conformity_scheme,
        initialDocName: preset.document_name
      } 
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Header onOpenTransparency={() => setTransparencyOpen(true)} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Top Greeting & Intake Section */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-semibold">
              Procurement workspace
            </span>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B132B]">
                Your standards workspace
              </h1>
              <span className="text-xs text-slate-500 font-mono">
                Demo session · Curated catalog
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 tracking-tight">
              What are you procuring?
            </h2>
          </div>

          {/* Large Elegant Intake Box */}
          <div className="bg-white rounded-sm border border-[#E5DFD5] shadow-sm p-5 sm:p-7 space-y-4 relative guilloche-watermark transition-all duration-200 hover:border-slate-400">
            <textarea
              value={requirementText}
              onChange={(e) => setRequirementText(e.target.value)}
              placeholder="Describe your procurement requirement (e.g. 'Supply of outdoor LED Street Lighting luminaires with IP66 optical compartment and 10kV surge protection...')"
              className="w-full h-32 p-4 text-sm text-slate-800 bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#B81D24] focus:border-[#B81D24] resize-none leading-relaxed"
              data-testid="dashboard-requirement-textarea"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/new", { state: { openUploadTab: true } })}
                  className="bg-[#FAF8F5] hover:bg-[#F3EFEA] text-slate-700 border-[#E5DFD5] text-xs flex items-center gap-1.5"
                  data-testid="dashboard-upload-pdf-button"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>PDF demonstration</span>
                </Button>
                <span className="text-[11px] text-slate-500 hidden md:inline">
                  Or paste text from your document
                </span>
              </div>

              <Button
                onClick={handleAnalyze}
                className="bg-[#B81D24] hover:bg-[#991319] text-white text-xs px-6 py-2.5 font-semibold shadow-sm flex items-center justify-center gap-2"
                data-testid="dashboard-analyze-submit-button"
              >
                <span>Analyze requirement</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Curated BIS procurement scenarios */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
              Example procurement requirements
            </h3>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Editable demonstration profiles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {presets?.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className="text-left p-4 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD5] hover:border-[#B81D24] rounded-sm transition-all duration-200 group flex flex-col justify-between shadow-xs"
                data-testid={`preset-card-${preset.id}`}
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#B81D24] block">
                    {preset.sector.split("&")[0]}
                  </span>
                  <h4 className="text-xs font-bold text-[#0B132B] group-hover:text-[#B81D24] transition-colors leading-snug">
                    {preset.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {preset.sample_text.split("Technical Requirements")[0]}
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#E5DFD5] flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{preset.conformity_scheme}</span>
                  <span className="text-[#B81D24] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Evaluate <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Analyses Section */}
        <section className="space-y-4 pt-4 border-t border-[#E5DFD5]">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                Recent analyses
              </h3>
              <p className="text-xs text-slate-600">
                Your recent requirements and catalog findings
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-[#B81D24] hover:underline flex items-center gap-1 font-mono"
              data-testid="dashboard-view-all-history-link"
            >
              View all history →
            </Link>
          </div>

          <div className="space-y-2.5">
            {analyses && analyses.length > 0 ? (
              analyses.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/analysis/${item.id}`)}
                  className="p-4 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD5] hover:border-slate-400 rounded-sm transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  data-testid={`recent-analysis-row-${item.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0B132B]">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F3EFEA] text-slate-700 rounded border border-[#E5DFD5]">
                        {item.sector.split("&")[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span className="text-[#B81D24] font-semibold">
                        {item.recommendations?.length || 0} standards recommended
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <span>·</span>
                      <span className="text-slate-600" data-testid={`dashboard-outcome-${item.id}`}>
                        {item.outcome === "no_results" ? "No catalog match" : item.outcome === "needs_clarification" ? "Clarification needed" : item.outcome === "catalog_only" ? "Catalog review needed" : `Demo readiness: ${item.gap_analysis?.readiness_score ?? 0}/100`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-medium text-slate-500 group-hover:text-[#0B132B] flex items-center gap-1">
                      <span>View report</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white rounded-sm border border-[#E5DFD5] space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-semibold text-[#0B132B]">No analyses yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your evaluated procurement requirements will appear here. Start by analyzing a requirement above.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Bottom Metrics Bar */}
        <section className="p-5 bg-white rounded-sm border border-[#E5DFD5] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Saved requirements</span>
            <span className="font-mono text-lg font-bold text-[#0B132B]" data-testid="dashboard-stat-analyses">
              {stats?.total_analyses_completed ?? 0}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Standards in catalog</span>
            <span className="font-mono text-lg font-bold text-[#0B132B]" data-testid="dashboard-stat-standards">
              {stats?.total_standards_indexed ?? 0}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">QCO catalog entries</span>
            <span className="font-mono text-lg font-bold text-[#B81D24]" data-testid="dashboard-stat-qco">
              {stats?.qco_mandatory_standards_count ?? 0}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Procurement reference</span>
            <span className="font-mono text-lg font-bold text-emerald-800">
              GFR 2017 R144
            </span>
          </div>
        </section>
      </main>

      <Footer />

      <ModelTransparencyModal
        open={transparencyOpen}
        onOpenChange={setTransparencyOpen}
      />
    </div>
  );
}
