import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight, Check, Minus, Printer, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/StatusBadge";
import { ModelTransparencyModal } from "@/components/ModelTransparencyModal";
import { useQueries, useQuery } from "@tanstack/react-query";
import { manakApi } from "@/services/manakApi";
import type { IndianStandard, KeyClause, TestMethod } from "@/types/standards";

const STATUS_LABEL: Record<string, string> = {
  current: "Current",
  under_revision: "Under revision",
  withdrawn: "Withdrawn",
};

const clauseKey = (c: KeyClause) => c.clause_no.trim().toLowerCase();
const methodKey = (m: TestMethod) => m.name.trim().toLowerCase();

export default function CompareStandards() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [transparencyOpen, setTransparencyOpen] = useState(false);

  const codeA = params.get("a") ?? "";
  const codeB = params.get("b") ?? "";

  const setSide = (side: "a" | "b", code: string) => {
    const next = new URLSearchParams(params);
    if (code) next.set(side, code);
    else next.delete(side);
    setParams(next, { replace: true });
  };

  const swap = () => {
    const next = new URLSearchParams(params);
    if (codeA) next.set("b", codeA);
    else next.delete("b");
    if (codeB) next.set("a", codeB);
    else next.delete("a");
    setParams(next, { replace: true });
  };

  const { data: catalog, isError: catalogError, refetch: retryCatalog } = useQuery({
    queryKey: ["standards", "compare-picker"],
    queryFn: () => manakApi.getStandards({ limit: 100 }),
  });

  const results = useQueries({
    queries: [codeA, codeB].map((code) => ({
      queryKey: ["standard", code],
      queryFn: () => manakApi.getStandardByCode(code),
      enabled: !!code,
    })),
  });

  const a = results[0]?.data as IndianStandard | undefined;
  const b = results[1]?.data as IndianStandard | undefined;
  const loading = results.some((r) => r.isLoading);
  const bothSelected = !!codeA && !!codeB;
  const failed = catalogError || results.some(r => r.isError);

  const attributeRows = useMemo(() => {
    if (!a || !b) return [];
    return [
      { label: "Standard title", a: a.title, b: b.title },
      { label: "Division", a: a.category, b: b.category },
      { label: "Sectional committee", a: a.technical_committee, b: b.technical_committee },
      { label: "ICS classification", a: a.ics_code, b: b.ics_code },
      { label: "Status", a: STATUS_LABEL[a.status] ?? a.status, b: STATUS_LABEL[b.status] ?? b.status },
      {
        label: "Last reaffirmed",
        a: a.reaffirmation_year ? String(a.reaffirmation_year) : "Not recorded",
        b: b.reaffirmation_year ? String(b.reaffirmation_year) : "Not recorded",
      },
      {
        label: "Mandatory under QCO",
        a: a.qco_mandatory ? "Yes" : "No",
        b: b.qco_mandatory ? "Yes" : "No",
      },
      { label: "Clauses indexed", a: String(a.key_clauses.length), b: String(b.key_clauses.length) },
      { label: "Test methods listed", a: String(a.test_methods.length), b: String(b.test_methods.length) },
      { label: "Active amendments", a: String(a.amendments.length), b: String(b.amendments.length) },
    ];
  }, [a, b]);

  const clauseComparison = useMemo(() => {
    if (!a || !b) return { shared: [], onlyA: [], onlyB: [] };
    const mapB = new Map(b.key_clauses.map((c) => [clauseKey(c), c]));
    const mapA = new Map(a.key_clauses.map((c) => [clauseKey(c), c]));
    return {
      shared: a.key_clauses
        .filter((c) => mapB.has(clauseKey(c)))
        .map((c) => ({ a: c, b: mapB.get(clauseKey(c))! })),
      onlyA: a.key_clauses.filter((c) => !mapB.has(clauseKey(c))),
      onlyB: b.key_clauses.filter((c) => !mapA.has(clauseKey(c))),
    };
  }, [a, b]);

  const methodComparison = useMemo(() => {
    if (!a || !b) return { shared: [], onlyA: [], onlyB: [] };
    const setB = new Set(b.test_methods.map(methodKey));
    const setA = new Set(a.test_methods.map(methodKey));
    return {
      shared: a.test_methods.filter((m) => setB.has(methodKey(m))),
      onlyA: a.test_methods.filter((m) => !setB.has(methodKey(m))),
      onlyB: b.test_methods.filter((m) => !setA.has(methodKey(m))),
    };
  }, [a, b]);

  const sharedKeywords = useMemo(() => {
    if (!a || !b) return [];
    const setB = new Set(b.keywords.map((k) => k.toLowerCase()));
    return a.keywords.filter((k) => setB.has(k.toLowerCase()));
  }, [a, b]);

  const differingRows = attributeRows.filter((r) => r.a !== r.b).length;

  const picker = (side: "a" | "b", value: string, otherValue: string) => (
    <select
      value={value}
      onChange={(e) => setSide(side, e.target.value)}
      className="w-full text-xs px-3 py-2 border border-[#E5DFD5] bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#B81D24]"
      data-testid={`compare-select-${side}`}
      aria-label={`Standard ${side.toUpperCase()}`}
    >
      <option value="">Select an Indian Standard…</option>
      {(catalog?.standards ?? []).map((std) => (
        <option
          key={std.code}
          value={std.code}
          disabled={std.code === otherValue}
          label={`${std.code} — ${std.title.slice(0, 70)}`}
        />
      ))}
    </select>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Header onOpenTransparency={() => setTransparencyOpen(true)} />

      {/* Breadcrumb */}
      <div className="border-b border-[#E5DFD5] bg-white no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/standards")}
              className="hover:text-[#0B132B] flex items-center gap-1"
              data-testid="compare-back-to-catalog"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>IS Catalog</span>
            </button>
            <span>/</span>
            <span className="text-[#0B132B] font-semibold">Compare Standards</span>
          </div>

          {bothSelected && a && b && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 hover:text-[#0B132B] font-sans font-semibold"
              data-testid="compare-print-button"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print comparison</span>
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="space-y-2 border-b border-[#E5DFD5] pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B132B]">Compare Indian Standards</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Place two Indian Standards side by side to see where their clause requirements, test regimes and
            certification obligations diverge before writing the specification.
          </p>
        </div>

        {/* Selectors */}
        <div className="bg-white border border-[#E5DFD5] p-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 items-end no-print">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Standard A</span>
            {picker("a", codeA, codeB)}
          </div>

          <button
            onClick={swap}
            disabled={!codeA && !codeB}
            className="h-9 px-3 border border-[#E5DFD5] bg-[#FAF8F5] text-slate-600 hover:bg-[#F3EFEA] disabled:opacity-40 flex items-center gap-1.5 text-xs font-mono self-end"
            data-testid="compare-swap-button"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Standard B</span>
            {picker("b", codeB, codeA)}
          </div>
        </div>

        {failed && <div role="alert" className="border border-[#E5DFD5] bg-white p-6 space-y-3" data-testid="compare-error-state"><h2 className="text-base" data-testid="compare-error-heading">We couldn’t load a catalog record</h2><p className="text-sm text-slate-600" data-testid="compare-error-message">Check the selected standards or try again. Missing records are never replaced with another standard.</p><button className="text-sm text-[#B81D24] font-semibold" onClick={() => { retryCatalog(); results.forEach(r => { if (r.isError) r.refetch(); }); }} data-testid="compare-retry-button">Try again</button></div>}
        <p className="text-sm text-slate-500 border-l-2 border-[#E5DFD5] pl-4" data-testid="compare-scope-note">This compares stored catalog summaries, not full publications. A shared clause number does not mean the clauses have the same purpose or are technically equivalent.</p>
        {/* Empty state */}
        {!bothSelected && (
          <div className="border border-dashed border-[#E5DFD5] bg-white p-12 text-center space-y-2" data-testid="compare-empty-state">
            <h2 className="text-sm font-semibold text-[#0B132B]">Select two standards to compare</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Choose a standard on each side. Clause numbers present in both are matched line by line; clauses unique
              to one standard are listed separately.
            </p>
          </div>
        )}

        {bothSelected && loading && (
          <div className="p-12 text-center text-xs font-mono text-slate-500">Loading both standards…</div>
        )}

        {bothSelected && a && b && !failed && (
          <div className="space-y-8" data-testid="compare-result-panel">
            {/* Headline cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[a, b].map((std, idx) => (
                <div
                  key={std.code}
                  className="bg-white border border-[#E5DFD5] p-5 space-y-3"
                  data-testid={`compare-header-card-${idx === 0 ? "a" : "b"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      Standard {idx === 0 ? "A" : "B"}
                    </span>
                    <StatusBadge
                      status={std.status}
                      reaffirmationYear={std.reaffirmation_year}
                      qcoMandatory={std.qco_mandatory}
                    />
                  </div>
                  <button
                    onClick={() => navigate(`/standards/${encodeURIComponent(std.code)}`)}
                    className="font-mono font-bold text-base text-[#B81D24] hover:underline text-left"
                  >
                    {std.code}
                  </button>
                  <h3 className="text-sm font-bold text-[#0B132B] leading-snug">{std.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{std.scope}</p>
                </div>
              ))}
            </div>

            {/* Difference summary */}
            <div className="bg-[#0B132B] text-slate-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Attributes differing</span>
                <span className="text-lg font-bold text-white" data-testid="compare-diff-count">
                  {differingRows} of {attributeRows.length}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Clauses in both</span>
                <span className="text-lg font-bold text-emerald-300">{clauseComparison.shared.length}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Only in {a.code.split(":")[0]}</span>
                <span className="text-lg font-bold text-amber-300">{clauseComparison.onlyA.length}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Only in {b.code.split(":")[0]}</span>
                <span className="text-lg font-bold text-amber-300">{clauseComparison.onlyB.length}</span>
              </div>
            </div>

            {/* Attribute table */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[#0B132B] uppercase tracking-wider font-mono border-b border-[#E5DFD5] pb-1">
                1. Institutional attributes
              </h2>
              <div className="border border-[#E5DFD5] bg-white overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFEA] text-[11px] font-mono text-slate-600">
                    <tr>
                      <th className="p-3 w-48">Attribute</th>
                      <th className="p-3">{a.code}</th>
                      <th className="p-3">{b.code}</th>
                      <th className="p-3 w-24">Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFD5]">
                    {attributeRows.map((row) => {
                      const same = row.a === row.b;
                      return (
                        <tr
                          key={row.label}
                          className={same ? "" : "bg-amber-50/60"}
                          data-testid={`compare-attribute-row-${row.label.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <td className="p-3 font-mono text-[11px] text-slate-500">{row.label}</td>
                          <td className="p-3 text-slate-800">{row.a}</td>
                          <td className="p-3 text-slate-800">{row.b}</td>
                          <td className="p-3">
                            {same ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700">
                                <Check className="w-3.5 h-3.5" /> Same
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700">
                                <Minus className="w-3.5 h-3.5" /> Differs
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Clause comparison */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[#0B132B] uppercase tracking-wider font-mono border-b border-[#E5DFD5] pb-1">
                2. Clause-level comparison
              </h2>

              {clauseComparison.shared.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-slate-500">
                    Matched clause numbers — requirement text compared side by side
                  </span>
                  {clauseComparison.shared.map((pair) => (
                    <div
                      key={pair.a.clause_no}
                      className="border border-[#E5DFD5] bg-white grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5DFD5]"
                      data-testid={`compare-shared-clause-${pair.a.clause_no.replace(/[^\w]+/g, "-").toLowerCase()}`}
                    >
                      {[pair.a, pair.b].map((c, i) => (
                        <div key={i} className="p-4 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#0B132B]">{c.clause_no}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {i === 0 ? a.code : b.code}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800">{c.clause_title}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{c.requirement_summary}</p>
                          {c.tolerance_limit && (
                            <p className="text-[11px] font-mono text-[#B81D24]">Limit: {c.tolerance_limit}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { std: a, clauses: clauseComparison.onlyA, testid: "compare-unique-clauses-a" },
                  { std: b, clauses: clauseComparison.onlyB, testid: "compare-unique-clauses-b" },
                ].map((col) => (
                  <div key={col.testid} className="border border-[#E5DFD5] bg-white" data-testid={col.testid}>
                    <div className="px-4 py-2.5 bg-[#F3EFEA] border-b border-[#E5DFD5] flex items-center gap-2">
                      <X className="w-3.5 h-3.5 text-amber-700" />
                      <span className="text-[11px] font-mono text-slate-700">
                        Clauses only in {col.std.code} ({col.clauses.length})
                      </span>
                    </div>
                    <div className="divide-y divide-[#E5DFD5]">
                      {col.clauses.length === 0 ? (
                        <p className="p-4 text-xs text-slate-500">
                          No clause in this standard is absent from the other.
                        </p>
                      ) : (
                        col.clauses.map((c) => (
                          <div key={c.clause_no} className="p-4 space-y-1">
                            <span className="font-mono text-[11px] font-bold text-[#0B132B]">{c.clause_no}</span>
                            <p className="text-xs font-semibold text-slate-800">{c.clause_title}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{c.requirement_summary}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Test regime */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[#0B132B] uppercase tracking-wider font-mono border-b border-[#E5DFD5] pb-1">
                3. Testing and certification obligations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {[
                  { title: "Required by both", items: methodComparison.shared, tone: "text-emerald-700" },
                  { title: `Only ${a.code}`, items: methodComparison.onlyA, tone: "text-amber-700" },
                  { title: `Only ${b.code}`, items: methodComparison.onlyB, tone: "text-amber-700" },
                ].map((col, i) => (
                  <div
                    key={i}
                    className="border border-[#E5DFD5] bg-white p-4 space-y-2"
                    data-testid={`compare-test-column-${i}`}
                  >
                    <span className={`text-[11px] font-mono ${col.tone}`}>{col.title}</span>
                    {col.items.length === 0 ? (
                      <p className="text-xs text-slate-500">None</p>
                    ) : (
                      <ul className="space-y-2">
                        {col.items.map((m) => (
                          <li key={m.name} className="space-y-0.5">
                            <span className="block font-semibold text-slate-800">{m.name}</span>
                            <span className="block text-[11px] font-mono text-slate-500">
                              {m.method_standard} · {m.frequency}
                              {m.mandatory ? " · mandatory" : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="border border-[#E5DFD5] bg-white p-4 space-y-2">
                <span className="text-[11px] font-mono text-slate-500">
                  Shared subject keywords ({sharedKeywords.length})
                </span>
                {sharedKeywords.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    These standards share no indexed keyword — they are likely to apply to different aspects of the
                    procurement rather than being alternatives.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sharedKeywords.map((k) => (
                      <span
                        key={k}
                        className="text-[11px] font-mono px-2 py-0.5 bg-[#FAF8F5] border border-[#E5DFD5] text-slate-700"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Comparison is derived from the curated clause index in this prototype. Confirm clause applicability
                against the published standard from the Bureau of Indian Standards before citing it in a tender.
              </p>
            </section>
          </div>
        )}
      </main>

      <Footer />

      <ModelTransparencyModal open={transparencyOpen} onOpenChange={setTransparencyOpen} />
    </div>
  );
}
