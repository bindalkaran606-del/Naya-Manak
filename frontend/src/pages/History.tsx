import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Trash2, 
  Clock, 
  ChevronRight, 
  Search, 
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ModelTransparencyModal } from "@/components/ModelTransparencyModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { manakApi } from "@/services/manakApi";
import { toast } from "sonner";

export default function History() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [transparencyOpen, setTransparencyOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { data: analyses, isLoading, isError, refetch } = useQuery({
    queryKey: ["analyses", "history"],
    queryFn: () => manakApi.getAnalyses(50),
  });

  const deleteMutation = useMutation({
    mutationFn: manakApi.deleteAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setPendingDelete(null);
      toast.success("Procurement analysis removed from history");
    },
    onError: () => toast.error("We couldn’t delete this record. Please try again."),
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPendingDelete(id);
  };

  const filteredAnalyses = analyses?.filter((item) => {
    const matchesSearch =
      !searchTerm.trim() ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector =
      selectedSector === "All" || item.sector.includes(selectedSector);

    return matchesSearch && matchesSector;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Header onOpenTransparency={() => setTransparencyOpen(true)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-[#E5DFD5] pb-6 gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B132B]">
              Analysis history
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Audit log of previously evaluated procurement specifications, matched standards, and gap analyses.
            </p>
          </div>

          <Button
            onClick={() => navigate("/new")}
            className="bg-[#B81D24] hover:bg-[#991319] text-white text-xs flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            data-testid="history-new-analysis-cta"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New analysis</span>
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-sm border border-[#E5DFD5] p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by requirement title, BIS department, or sector..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-sm border border-[#E5DFD5] bg-[#FAF8F5] focus:ring-1 focus:ring-[#B81D24] focus:outline-none text-slate-800"
              data-testid="history-search-input"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full sm:w-auto text-xs py-2 px-3 rounded-sm border border-[#E5DFD5] bg-[#FAF8F5] focus:ring-1 focus:ring-[#B81D24] focus:outline-none text-slate-700 font-mono"
            >
              <option value="All">All Sectors</option>
              <option value="Electrotechnical">Electrotechnical</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Occupational Safety">Safety & Mining</option>
              <option value="Water">Water & Utilities</option>
            </select>
          </div>
        </div>

        {/* History Table / List */}
        <div className="space-y-3">
          {isError ? <div className="border border-[#E5DFD5] p-6 bg-white space-y-3" role="alert" data-testid="history-error-state"><p data-testid="history-error-message">We couldn’t load your history. Your records have not been removed.</p><button onClick={() => refetch()} className="text-[#B81D24] text-sm font-semibold" data-testid="history-retry-button">Try again</button></div> : isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              Loading procurement history records...
            </div>
          ) : filteredAnalyses && filteredAnalyses.length > 0 ? (
            filteredAnalyses.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/analysis/${item.id}`)}
                className="p-5 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD5] hover:border-slate-400 rounded-sm transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-xs"
                data-testid={`history-row-${item.id}`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-[#0B132B] group-hover:text-[#B81D24] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAF8F5] text-slate-700 rounded border border-[#E5DFD5]">
                      {item.sector.split("&")[0]}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
                    <span className="text-slate-700">{item.department}</span>
                    <span>·</span>
                    <span className="text-[#B81D24] font-semibold">
                      {item.recommendations?.length || 0} standards recommended
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <span className="text-slate-600 font-semibold" data-testid={`history-outcome-${item.id}`}>
                      {item.outcome === "no_results" ? "No catalog match" : item.outcome === "needs_clarification" ? "Clarification needed" : item.outcome === "catalog_only" ? "Catalog review needed" : `Demo readiness: ${item.gap_analysis?.readiness_score ?? 0}/100`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete record"
                    data-testid={`delete-history-${item.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>

                  <span className="text-xs font-mono font-semibold text-[#0B132B] group-hover:text-[#B81D24] flex items-center gap-1">
                    <span>Open report</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-white rounded-sm border border-[#E5DFD5] space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-semibold text-[#0B132B]">No procurement analyses found</h4>
              <p className="text-xs text-slate-500">
                Start a new requirement analysis to populate your history log.
              </p>
              <Button
                onClick={() => navigate("/new")}
                className="bg-[#B81D24] text-white text-xs mt-2"
              >
                Analyze Requirement
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <Dialog open={!!pendingDelete} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setPendingDelete(null); }}>
        <DialogContent className="sm:max-w-md p-6" data-testid="history-delete-dialog">
          <DialogTitle data-testid="history-delete-title">Delete this analysis?</DialogTitle>
          <DialogDescription data-testid="history-delete-description">This removes the saved report from history. Catalog records and other analyses are not affected. This cannot be undone.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" disabled={deleteMutation.isPending} onClick={() => setPendingDelete(null)} data-testid="history-delete-cancel">Keep analysis</Button>
            <Button disabled={deleteMutation.isPending} onClick={() => { if (pendingDelete) deleteMutation.mutate(pendingDelete); }} data-testid="history-delete-confirm">{deleteMutation.isPending ? "Deleting…" : "Delete analysis"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModelTransparencyModal
        open={transparencyOpen}
        onOpenChange={setTransparencyOpen}
      />
    </div>
  );
}
