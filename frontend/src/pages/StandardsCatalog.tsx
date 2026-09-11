import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, ShieldCheck, BookOpen, X, ArrowUpRight, Package } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/StatusBadge";
import { ModelTransparencyModal } from "@/components/ModelTransparencyModal";
import { useQuery } from "@tanstack/react-query";
import { manakApi } from "@/services/manakApi";

const STATUS_FILTERS = [
  { value: "All", label: "All statuses" },
  { value: "current", label: "Current" },
  { value: "under_revision", label: "Under revision" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default function StandardsCatalog() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [qcoOnly, setQcoOnly] = useState(false);
  const [transparencyOpen, setTransparencyOpen] = useState(false);

  // Debounce keystrokes so the catalogue feels instant without a request per character
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["standards", debouncedSearch, selectedProduct, selectedCategory, selectedStatus, qcoOnly],
    queryFn: () =>
      manakApi.getStandards({
        search: debouncedSearch || undefined,
        product: selectedProduct || undefined,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        status: selectedStatus === "All" ? undefined : selectedStatus,
        qco_only: qcoOnly || undefined,
        limit: 100,
      }),
    placeholderData: (prev) => prev,
  });

  const categories = useMemo(
    () => ["All", ...(data?.categories ?? [])],
    [data?.categories]
  );

  const filtersActive =
    !!searchInput || !!selectedProduct || selectedCategory !== "All" || selectedStatus !== "All" || qcoOnly;
  const updating = isFetching || searchInput.trim() !== debouncedSearch;

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategory("All");
    setSelectedStatus("All");
    setQcoOnly(false);
    setSelectedProduct("");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Header onOpenTransparency={() => setTransparencyOpen(true)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Page Title */}
        <div className="space-y-2 border-b border-[#E5DFD5] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B132B]" data-testid="catalog-heading">
              Indian Standards catalog
            </h1>
            <span className="text-xs font-mono text-slate-500" data-testid="catalog-total-count">
              Curated collection · {data?.categories?.length ?? "—"} divisions
            </span>
          </div>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed" data-testid="catalog-description">
            Find a starting point for your specification. Browse by product, or look up a standard by its number,
            title, ICS code or technical committee.
          </p>
        </div>

        <section className="catalog-products border border-[#E5DFD5] bg-white p-5 sm:p-6 space-y-4" aria-labelledby="product-heading" data-testid="catalog-products-panel">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 id="product-heading" className="text-base font-semibold flex items-center gap-2" data-testid="catalog-products-heading"><Package className="size-4 text-[#B81D24]" />Browse by product</h2>
              <p className="text-sm text-slate-500" data-testid="catalog-products-description">Product shortcuts search the available catalog. They do not imply certification or full coverage.</p>
            </div>
            {selectedProduct && <button onClick={() => setSelectedProduct("")} className="text-sm text-[#B81D24] whitespace-nowrap" data-testid="catalog-clear-product">Clear product</button>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(data?.products ?? []).map((product) => <button
              key={product.id}
              aria-pressed={selectedProduct === product.id}
              onClick={() => { clearFilters(); setSelectedProduct(product.id); }}
              className={`product-shortcut flex items-center justify-between gap-2 border px-3 py-3 text-left text-sm ${selectedProduct === product.id ? "border-[#B81D24] bg-[#FDF2F2] text-[#B81D24]" : "border-[#E5DFD5] bg-white text-slate-700 hover:border-slate-400 hover:bg-[#FAF8F5]"}`}
              data-testid={`product-template-${product.id}`}
            ><span data-testid={`product-label-${product.id}`}>{product.label}</span><ArrowUpRight className="size-3.5 shrink-0 opacity-60" /></button>)}
          </div>
        </section>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-[#E5DFD5] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="IS number, title, ICS code or committee — e.g. 'IS 10322', '29.140.40', 'ETD 20', 'HDPE'"
                aria-label="Search the IS catalog"
                className="w-full pl-10 pr-9 py-2.5 text-sm border border-[#E5DFD5] bg-white focus:ring-1 focus:ring-[#B81D24] focus:outline-none text-slate-800"
                data-testid="standards-catalog-search-input"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-[#B81D24] transition-colors"
                  aria-label="Clear search"
                  data-testid="standards-catalog-clear-search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              aria-label="Standard status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs px-3 py-2 border border-[#E5DFD5] bg-[#FAF8F5] text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-[#B81D24]"
              data-testid="filter-status-select"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* QCO Mandatory Toggle */}
            <button
              type="button"
              onClick={() => setQcoOnly(!qcoOnly)}
              className={`text-xs px-3.5 py-2 font-mono flex items-center justify-center gap-1.5 transition-colors border ${
                qcoOnly
                  ? "bg-[#0B132B] text-white border-[#0B132B]"
                  : "bg-[#FAF8F5] text-slate-700 border-[#E5DFD5] hover:bg-[#F3EFEA]"
              }`}
              data-testid="filter-qco-toggle"
              aria-pressed={qcoOnly}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${qcoOnly ? "text-amber-300" : "text-slate-500"}`} />
              <span>QCO only</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E5DFD5]">
            <span className="text-[11px] font-mono text-slate-500 mr-1">Divisions:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 font-medium border transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#B81D24] text-white border-[#B81D24]"
                    : "bg-[#FAF8F5] text-slate-600 hover:bg-[#F3EFEA] border-[#E5DFD5]"
                }`}
                data-testid={`category-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                aria-pressed={selectedCategory === cat}
              >
                {cat}
              </button>
            ))}

            {filtersActive && (
              <button
                onClick={clearFilters}
                className="ml-auto text-[11px] font-mono text-[#B81D24] hover:underline"
                data-testid="clear-all-filters-button"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Result summary */}
        <div className="flex items-center justify-between text-sm text-slate-500" aria-live="polite">
          <span data-testid="catalog-result-summary">
            {isLoading || updating
              ? "Searching…"
              : isError ? "Catalog temporarily unavailable" : `${data?.standards.length ?? 0} standard${(data?.standards.length ?? 0) === 1 ? "" : "s"} shown${
                  debouncedSearch ? ` for “${debouncedSearch}”` : ""
                }${selectedProduct ? ` · ${data?.products.find(p => p.id === selectedProduct)?.label ?? "Selected product"}` : ""}`}
          </span>
          {!isError && !updating && <span className="text-xs hidden sm:inline" data-testid="catalog-results-source">Source: existing IS catalog</span>}
        </div>

        {/* Standards List */}
        <div className="divide-y divide-[#E5DFD5] border-y border-[#E5DFD5] bg-white">
          {isError ? (
            <div className="p-8 space-y-3" role="alert" data-testid="catalog-error-state">
              <h2 className="text-base" data-testid="catalog-error-heading">We couldn’t load the catalog</h2>
              <p className="text-sm text-slate-600" data-testid="catalog-error-description">The catalog service is unavailable. This is not a no-match result; please try again.</p>
              <button onClick={() => refetch()} className="text-sm text-[#B81D24] font-semibold" data-testid="catalog-retry-button">Try again</button>
            </div>
          ) : isLoading || updating ? (
            <div className="p-12 text-center text-sm text-slate-500" role="status" data-testid="catalog-loading-state">
              Searching Indian Standards…
            </div>
          ) : data && data.standards.length > 0 ? (
            data.standards.map((std, i) => (
              <div
                key={std.code}
                onClick={() => navigate(`/standards/${encodeURIComponent(std.code)}`)}
                onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); navigate(`/standards/${encodeURIComponent(std.code)}`); } }}
                tabIndex={0}
                role="link"
                aria-label={`View ${std.code}`}
                className="p-5 hover:bg-[#FAF8F5] transition-colors duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                data-testid={`catalog-standard-row-${i}`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm sm:text-base text-[#B81D24] group-hover:underline">
                      {std.code}
                    </span>
                    <StatusBadge
                      status={std.status}
                      reaffirmationYear={std.reaffirmation_year}
                      qcoMandatory={std.qco_mandatory}
                    />
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAF8F5] text-slate-600 border border-[#E5DFD5]">
                      {std.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0B132B] group-hover:text-[#B81D24] transition-colors leading-snug">
                    {std.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{std.scope}</p>

                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500">
                    <span>Committee: {std.technical_committee}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>ICS: {std.ics_code}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>{std.key_clauses.length} clauses indexed</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/compare?a=${encodeURIComponent(std.code)}`);
                    }}
                    className="text-[11px] font-mono px-2.5 py-1 border border-[#E5DFD5] text-slate-600 hover:bg-[#F3EFEA] hover:text-[#0B132B] transition-colors"
                    data-testid={`catalog-compare-button-${i}`}
                  >
                    Compare
                  </button>
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-[#0B132B] flex items-center gap-1 font-mono">
                    <span>View clauses</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 sm:p-12 space-y-3" role="status" data-testid="catalog-empty-state">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="text-lg font-semibold text-[#0B132B]" data-testid="catalog-empty-heading">{data?.outcome === "needs_clarification" ? "Which product do you mean?" : "No relevant standard found"}</h2>
              <p className="text-sm text-slate-600" data-testid="catalog-empty-message">{data?.message || "No relevant Indian Standard was found in the available IS Catalog for this query."}</p>
              <p className="text-sm text-slate-500" data-testid="catalog-empty-guidance">
                {data?.outcome === "needs_clarification" ? "Choose a product above, or add the product name and intended use. We won’t assume a related standard applies." : "This describes the available collection, not all BIS publications. No substitute standard has been suggested. Check the product name or clear any active filters."}
              </p>
              {filtersActive && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-[#B81D24] hover:underline font-mono"
                  data-testid="empty-state-reset-button"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ModelTransparencyModal open={transparencyOpen} onOpenChange={setTransparencyOpen} />
    </div>
  );
}
