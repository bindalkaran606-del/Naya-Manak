import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Scale, 
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ModelTransparencyModal } from "@/components/ModelTransparencyModal";
import { useQuery } from "@tanstack/react-query";
import { manakApi } from "@/services/manakApi";

export default function Landing() {
  const navigate = useNavigate();
  const [transparencyOpen, setTransparencyOpen] = useState(false);
  const [quickInput, setQuickInput] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: manakApi.getStats,
  });

  const { data: presets } = useQuery({
    queryKey: ["presets"],
    queryFn: manakApi.getPresets,
  });

  const handleQuickAnalyze = () => {
    if (quickInput.trim()) {
      navigate("/new", { state: { initialText: quickInput } });
    } else {
      navigate("/new");
    }
  };

  const handleSelectPreset = (presetText: string, presetTitle: string) => {
    navigate("/new", { state: { initialText: presetText, initialTitle: presetTitle } });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans selection:bg-[#B81D24]/10 selection:text-[#B81D24]">
      <Header onOpenTransparency={() => setTransparencyOpen(true)} />

      {/* Hero Section */}
      <section className="landing-intro relative pt-12 pb-16 sm:pt-20 sm:pb-20 overflow-hidden guilloche-watermark border-b border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            {/* Top Institutional Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5DFD5] shadow-xs text-xs font-mono text-slate-700">
              <span className="w-2 h-2 rounded-full bg-[#B81D24] inline-block" />
              <span>Smart India Hackathon 2026</span>
              <span className="text-slate-400">·</span>
              <span className="text-[#0B132B] font-semibold">Problem SIH 26108</span>
            </div>

            {/* Wordmark */}
            <div className="space-y-3">
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0B132B]"
                data-testid="landing-wordmark"
              >
                MANAK <span className="text-[#B81D24]">AI</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-700 font-medium" data-testid="landing-wordmark-descriptor">
                A research workspace for procurement requirements, Indian Standards and supporting references.
              </p>
            </div>

            {/* Main Headline */}
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#0B132B] leading-[1.2] pt-2"
              data-testid="landing-hero-headline"
            >
              Intelligent discovery of <br className="hidden sm:inline" />
              <span className="text-[#B81D24]">Indian Standards</span>.
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Understand your requirement. Explore the available catalog. Review the evidence before you finalize the specification.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-start gap-4">
              <Button
                onClick={() => navigate("/new")}
                size="lg"
                className="w-full sm:w-auto bg-[#B81D24] hover:bg-[#991319] text-white px-7 py-6 text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all duration-200"
                data-testid="landing-primary-cta-button"
              >
                <span>Analyze a requirement</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => navigate("/history")}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-white hover:bg-[#F3EFEA] text-[#0B132B] border-[#E5DFD5] px-6 py-6 text-sm font-medium"
                data-testid="landing-history-cta-button"
              >
                <span>View previous analyses</span>
              </Button>
            </div>

            {/* GFR & BIS Compliance Footnote */}
            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Curated catalog
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                Catalog references
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-700" />
                Human oversight
              </span>
            </div>
          </div>

          {/* Quick Interactive Requirement Box on Landing */}
          <div className="mt-10 max-w-3xl bg-white rounded-sm border border-[#E5DFD5] shadow-xs p-4 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#B81D24]" />
                <span className="text-xs font-semibold text-[#0B132B] uppercase tracking-wider font-mono">
                  Start with your requirement
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Type text or choose a BIS-referenced scenario
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <textarea
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Describe what you are procuring (e.g., 'Supply of 70W and 120W outdoor LED street lighting luminaires with IP66 optical compartment, CCT 5000K, and 10kV surge protection...')"
                className="w-full h-24 p-3.5 text-xs text-slate-800 bg-[#FAF8F5] border border-[#E5DFD5] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#B81D24] focus:border-[#B81D24] resize-none leading-relaxed"
                data-testid="landing-quick-input-textarea"
              />

              {/* Sample Preset Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-slate-500">BIS scenarios:</span>
                {presets?.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.sample_text, p.title)}
                    className="text-[11px] px-2.5 py-1 rounded-sm bg-[#F3EFEA] hover:bg-[#E5DFD5] text-[#0B132B] font-medium transition-colors border border-[#E5DFD5] flex items-center gap-1"
                    data-testid={`landing-preset-${p.id}`}
                  >
                    <span>{p.title.split(" &")[0]}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Checks the available catalog only
                </span>
                <Button
                  onClick={handleQuickAnalyze}
                  className="bg-[#0B132B] hover:bg-slate-800 text-white text-xs px-4 py-2 flex items-center gap-1.5 shadow-xs"
                  data-testid="landing-quick-analyze-submit"
                >
                  <span>Review requirement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metric Indicators Ticker */}
      <section className="bg-white border-b border-[#E5DFD5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#E5DFD5]">
            <div className="pt-3 sm:pt-0">
              <span className="block font-mono text-2xl sm:text-3xl font-bold text-[#0B132B]" data-testid="stat-standards-count">
                {stats?.total_standards_indexed ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider font-mono mt-1 block">
                Standards in the catalog
              </span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="block font-mono text-2xl sm:text-3xl font-bold text-[#B81D24]" data-testid="stat-qco-standards">
                {stats?.qco_mandatory_standards_count ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider font-mono mt-1 block">
                QCO catalog entries
              </span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="block font-mono text-2xl sm:text-3xl font-bold text-emerald-800" data-testid="stat-analyses-count">
                {stats?.total_analyses_completed ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider font-mono mt-1 block">
                Saved requirements
              </span>
            </div>

            <div className="pt-3 sm:pt-0">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-slate-800" data-testid="stat-bis-source">
                BIS Act, 2016
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider font-mono mt-1 block">
                National Standards Body of India
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works: The 4-Stage Workflow */}
      <section className="py-20 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#B81D24]">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B132B] tracking-tight">
              From a requirement to an informed specification.
            </h2>
            <p className="text-sm text-slate-600">
              Explore the workflow using existing demonstration profiles and a curated catalog. This version does not connect to a live RAG or language model service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card className="bg-white border-[#E5DFD5] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center font-mono font-bold text-sm text-[#0B132B]">
                  01
                </div>
                <h3 className="text-base font-bold text-[#0B132B]">Describe the requirement</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Paste text from your specification, or explore the simulated PDF intake using an editable example.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="bg-white border-[#E5DFD5] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center font-mono font-bold text-sm text-[#0B132B]">
                  02
                </div>
                <h3 className="text-base font-bold text-[#0B132B]">Review the product</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review the demonstration product profile. When a query is too broad, clarify the product and intended use.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="bg-white border-[#E5DFD5] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center font-mono font-bold text-sm text-[#B81D24]">
                  03
                </div>
                <h3 className="text-base font-bold text-[#0B132B]">Inspect the references</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inspect catalog-backed standards and clause summaries. A missing record is never replaced with an invented IS number.
                </p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="bg-white border-[#E5DFD5] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-center font-mono font-bold text-sm text-emerald-800">
                  04
                </div>
                <h3 className="text-base font-bold text-[#0B132B]">Consider the gaps</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review illustrative gaps and export a draft annexure. Confirm applicability and technical requirements with BIS before use.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Domain Coverage Showcase */}
      <section className="py-16 bg-white border-t border-[#E5DFD5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#B81D24]">
                Explore the collection
              </span>
              <h2 className="text-2xl font-bold text-[#0B132B] tracking-tight mt-1">
                Procurement sectors
              </h2>
            </div>
            <Link
              to="/standards"
              className="text-xs font-semibold text-[#B81D24] hover:underline flex items-center gap-1 font-mono"
            >
              Explore all Indian Standards in catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sector 1 */}
            <div className="p-5 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5] space-y-2">
              <span className="text-xs font-mono font-semibold text-[#B81D24]">Electrotechnical (ETD)</span>
              <h4 className="font-bold text-[#0B132B] text-sm">Lighting, Drivers & Energy Equipment</h4>
              <p className="text-xs text-slate-600">
                Luminaires, LED controlgear, distribution transformers, low-voltage switchgear, cables, and energy meters under mandatory CRS and ISI schemes.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-500">
                Browse lighting, cables and transformer records in the catalog
              </div>
            </div>

            {/* Sector 2 */}
            <div className="p-5 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5] space-y-2">
              <span className="text-xs font-mono font-semibold text-[#0B132B]">Civil engineering (CED)</span>
              <h4 className="font-bold text-[#0B132B] text-sm">Steel and construction materials</h4>
              <p className="text-xs text-slate-600">
                Explore stored records for reinforcing bars, structural steel and concrete. Coverage varies by product.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-500">
                Product shortcuts clearly show when no catalog record is available
              </div>
            </div>

            {/* Sector 3 */}
            <div className="p-5 rounded-sm bg-[#FAF8F5] border border-[#E5DFD5] space-y-2">
              <span className="text-xs font-mono font-semibold text-[#0B132B]">Water and utilities</span>
              <h4 className="font-bold text-[#0B132B] text-sm">Pipes & Public Drinking Water Supply</h4>
              <p className="text-xs text-slate-600">
                High-Density Polyethylene (HDPE PE-100) pipes, ductile iron pressure pipes, and jointing standards for Jal Jeevan Mission projects.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-500">
                Browse water and pipe records in the available catalog
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-[#0B132B] text-white guilloche-watermark border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to evaluate your procurement specification?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            Bring standards research, catalog evidence and specification review into one workspace. The final decision remains with your procurement team.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate("/new")}
              size="lg"
              className="bg-[#B81D24] hover:bg-[#991319] text-white px-8 py-6 text-sm font-semibold shadow-lg flex items-center gap-2"
              data-testid="landing-bottom-cta-button"
            >
              <span>Start a requirement review</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setTransparencyOpen(true)}
              variant="outline"
              size="lg"
              className="bg-transparent hover:bg-white/10 text-slate-200 border-slate-700 px-6 py-6 text-sm"
              data-testid="landing-methodology-button"
            >
              <span>Scope and sources</span>
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      {/* Model Transparency Modal */}
      <ModelTransparencyModal
        open={transparencyOpen}
        onOpenChange={setTransparencyOpen}
      />
    </div>
  );
}
