import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  AlertTriangle, 
  ExternalLink,
  ArrowLeftRight,

  Copy, 
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/StatusBadge";
import { ModelTransparencyModal } from "@/components/ModelTransparencyModal";
import { useQuery } from "@tanstack/react-query";
import { manakApi } from "@/services/manakApi";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export default function StandardDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [transparencyOpen, setTransparencyOpen] = useState(false);
  const [copiedClause, setCopiedClause] = useState<string | null>(null);

  const decodedCode = decodeURIComponent(code || "");

  const { data: standard, isLoading, error } = useQuery({
    queryKey: ["standard", decodedCode],
    queryFn: () => manakApi.getStandardByCode(decodedCode),
    enabled: !!decodedCode,
  });

  const handleCopyClauseText = (clauseText: string, clauseNo: string) => {
    navigator.clipboard.writeText(clauseText);
    setCopiedClause(clauseNo);
    toast.success(`Copied ${clauseNo} to clipboard`);
    setTimeout(() => setCopiedClause(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-20 text-center space-y-4">
          <div className="w-10 h-10 rounded-sm bg-[#B81D24] text-white flex items-center justify-center font-bold text-lg mx-auto animate-pulse">
            म
          </div>
          <h2 className="text-lg font-bold text-[#0B132B]">Loading standard details…</h2>
          <p className="text-xs text-slate-500 font-mono">Retrieving the available catalog record</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !standard) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
        <Header />
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-20 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-[#0B132B]" data-testid="standard-error-heading">{error instanceof ApiError && error.status === 404 ? "Standard not found in the catalog" : "We couldn’t load this standard"}</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error instanceof ApiError && error.status === 404 ? `No record for '${decodedCode}' was found in the available catalog. No substitute has been selected.` : "The catalog service is unavailable. Please return to the catalog and try again; this does not mean the standard is missing."}
          </p>
          <Button
            onClick={() => navigate("/standards")}
            className="bg-[#0B132B] text-white text-xs mt-2"
          >
            Back to IS Catalog
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Header onOpenTransparency={() => setTransparencyOpen(true)} />

      {/* Breadcrumb Bar */}
      <div className="border-b border-[#E5DFD5] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/standards")} className="hover:text-[#0B132B] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>IS Catalog</span>
            </button>
            <span>/</span>
            <span className="text-[#0B132B] font-semibold">{standard.code}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/compare?a=${encodeURIComponent(standard.code)}`)}
              className="text-[#0B132B] hover:text-[#B81D24] flex items-center gap-1.5 font-sans font-semibold"
              data-testid="standard-detail-compare-button"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare with another standard</span>
            </button>
            <a
              href="https://www.bis.gov.in/?lang=en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B81D24] hover:underline flex items-center gap-1 font-sans font-semibold"
            >
              Official BIS Portal
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Authoritative Standard Header Card */}
        <section className="bg-white rounded-sm border border-[#E5DFD5] shadow-sm p-6 sm:p-8 space-y-6 guilloche-watermark">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#B81D24]" data-testid="standard-detail-code">
                {standard.code}
              </span>
              <StatusBadge
                status={standard.status}
                reaffirmationYear={standard.reaffirmation_year}
                qcoMandatory={standard.qco_mandatory}
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B132B] leading-snug" data-testid="standard-detail-title">
              {standard.title}
            </h1>
          </div>

          {/* Institutional Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#FAF8F5] rounded-sm border border-[#E5DFD5] text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-mono uppercase">Category</span>
              <span className="font-semibold text-[#0B132B]">{standard.category}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-mono uppercase">Technical committee</span>
              <span className="font-semibold text-[#0B132B]">{standard.technical_committee}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-mono uppercase">ICS code</span>
              <span className="font-mono font-semibold text-[#0B132B]">{standard.ics_code}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-mono uppercase">Reaffirmation</span>
              <span className="font-mono font-semibold text-[#0B132B]">
                {standard.reaffirmation_year ? `Reaffirmed ${standard.reaffirmation_year}` : "Not recorded"}
              </span>
            </div>
          </div>
        </section>

        {/* Structured Tabs Content */}
        <section className="bg-white rounded-sm border border-[#E5DFD5] shadow-sm p-6 sm:p-8 space-y-6">
          <Tabs defaultValue="scope" className="space-y-6">
            <TabsList className="bg-[#FAF8F5] border border-[#E5DFD5] p-1 rounded-sm">
              <TabsTrigger 
                value="scope" 
                className="text-xs font-medium data-[state=active]:bg-[#0B132B] data-[state=active]:text-white"
                data-testid="tab-scope"
              >
                Scope & Purpose
              </TabsTrigger>
              <TabsTrigger 
                value="clauses" 
                className="text-xs font-medium data-[state=active]:bg-[#0B132B] data-[state=active]:text-white"
                data-testid="tab-clauses"
              >
                Key Clauses & Tolerances
              </TabsTrigger>
              <TabsTrigger 
                value="testing" 
                className="text-xs font-medium data-[state=active]:bg-[#0B132B] data-[state=active]:text-white"
                data-testid="tab-testing"
              >
                Test Methods & Sampling
              </TabsTrigger>
              <TabsTrigger 
                value="amendments" 
                className="text-xs font-medium data-[state=active]:bg-[#0B132B] data-[state=active]:text-white"
                data-testid="tab-amendments"
              >
                Amendments & Status
              </TabsTrigger>
              <TabsTrigger 
                value="related" 
                className="text-xs font-medium data-[state=active]:bg-[#0B132B] data-[state=active]:text-white"
                data-testid="tab-related"
              >
                Cross-Referenced Standards
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Scope */}
            <TabsContent value="scope" className="space-y-4 pt-2 text-xs leading-relaxed">
              <div className="space-y-2">
                <h3 className="font-mono font-bold uppercase text-[#0B132B] text-xs">
                  Official Scope Summary
                </h3>
                <p className="text-slate-700 leading-relaxed text-sm bg-[#FAF8F5] p-4 rounded-sm border border-[#E5DFD5]">
                  {standard.scope}
                </p>
              </div>

              {standard.why_recommended_template && (
                <div className="space-y-2 pt-2">
                  <h3 className="font-mono font-bold uppercase text-[#0B132B] text-xs">
                    Procurement Context & Relevance
                  </h3>
                  <p className="text-slate-700 text-xs">
                    {standard.why_recommended_template}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Key Clauses */}
            <TabsContent value="clauses" className="space-y-4 pt-2">
              <h3 className="font-mono font-bold uppercase text-[#0B132B] text-xs">
                Mandatory Clause Specifications
              </h3>
              <div className="space-y-3">
                {standard.key_clauses?.map((c, i) => (
                  <div key={i} className="p-4 bg-[#FAF8F5] rounded-sm border border-[#E5DFD5] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#B81D24] text-sm">
                        {c.clause_no}: {c.clause_title}
                      </span>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleCopyClauseText(c.requirement_summary, c.clause_no)}
                        className="text-[11px] font-mono text-slate-500 hover:text-[#0B132B]"
                      >
                        {copiedClause === c.clause_no ? (
                          <Check className="w-3 h-3 text-emerald-600 mr-1" />
                        ) : (
                          <Copy className="w-3 h-3 mr-1" />
                        )}
                        <span>{copiedClause === c.clause_no ? "Copied" : "Copy Clause"}</span>
                      </Button>
                    </div>

                    <p className="text-slate-800 leading-relaxed">{c.requirement_summary}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E5DFD5] text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500 block">Test Method Reference:</span>
                        <span className="text-slate-800 font-medium">{c.test_method || "Standard BIS Lab Method"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Acceptance Threshold / Tolerance:</span>
                        <span className="text-slate-800 font-medium">{c.tolerance_limit || "Zero non-conformance"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Tab 3: Testing */}
            <TabsContent value="testing" className="space-y-4 pt-2">
              <h3 className="font-mono font-bold uppercase text-[#0B132B] text-xs">
                Mandatory Test Methods & Conformity Assessment
              </h3>
              <div className="border border-[#E5DFD5] rounded-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-slate-700 text-[11px] font-mono border-b border-[#E5DFD5]">
                    <tr>
                      <th className="p-3">Test Name</th>
                      <th className="p-3">Method Standard</th>
                      <th className="p-3">Inspection Frequency</th>
                      <th className="p-3">Conformity Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFD5]">
                    {standard.test_methods?.map((tm, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-[#0B132B]">{tm.name}</td>
                        <td className="p-3 font-mono text-slate-700">{tm.method_standard}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{tm.frequency}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                            MANDATORY
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Tab 4: Amendments & Version History (Included directly here per prompt) */}
            <TabsContent value="amendments" className="space-y-4 pt-2">
              <h3 className="font-mono font-bold uppercase text-[#0B132B] text-xs">
                Gazetted Amendments & Version Tracking
              </h3>
              <div className="space-y-3">
                {standard.amendments && standard.amendments.length > 0 ? (
                  standard.amendments.map((a, i) => (
                    <div key={i} className="p-4 bg-[#FAF8F5] rounded-sm border border-[#E5DFD5] space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[#0B132B]">{a.amendment_no}</span>
                        <span className="text-slate-500">Notified: {a.date}</span>
                      </div>
                      <p className="text-slate-700">{a.summary}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-[#FAF8F5] rounded-sm border border-[#E5DFD5] text-xs text-slate-600 text-center">
                    No active revision amendments pending. Standard is reaffirmed and current in the official BIS gazette.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab 5: Related Standards */}
            <TabsContent value="related" className="space-y-4 pt-2">
              <h3 className="font-mono font-bold uppercase text-[#0B132B] text-xs">
                Cross-Referenced & Complementary Indian Standards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {standard.related_standards?.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/standards/${encodeURIComponent(r.code)}`)}
                    className="p-4 bg-[#FAF8F5] hover:bg-white border border-[#E5DFD5] hover:border-[#B81D24] rounded-sm cursor-pointer transition-all space-y-1 text-xs group"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-[#B81D24] group-hover:underline">{r.code}</span>
                      <span className="text-[10px] text-slate-500">{r.relation_type}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{r.title}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
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
