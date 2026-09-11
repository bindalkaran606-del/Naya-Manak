# MANAK AI — Product Specification (SIH 26108)

## 1. Executive Summary
**MANAK AI** is an AI-powered recommendation and compliance decision-support engine for identifying applicable Indian Standards (IS standards) for public procurement specifications. Developed for **Smart India Hackathon 2026** (Problem Statement **SIH 26108**), it bridges the gap between raw procurement requirements and the Bureau of Indian Standards (BIS) regulatory knowledge base.

## 2. Core Architecture & Philosophy
- **Aesthetic**: Apple design discipline + Bureau of Indian Standards (BIS) institutional authority + modern subtle Indian identity.
- **Human Decision-Maker Mandate**: The AI assists procurement committees by providing mathematical relevance scores, clause evidence, and gap analysis. Final specification formulation remains with the human officer.
- **GFR 2017 Rule 144 & QCO Compliance**: Aligns procurement specifications with mandatory Quality Control Orders and General Financial Rules.

## 3. Key Workflows & User Flow
1. **Landing Page (`/`)**: High-impact institutional entry, metrics ticker (22,480+ indexed standards, 96% precision), 4-stage workflow walkthrough, and quick interactive test bench.
2. **Dashboard (`/dashboard`)**: Daily intake screen, quick requirement input, 1-click verified demonstration presets (LED street lighting, TMT steel rebars, Safety PPE, Distribution transformers, HDPE water supply pipes), and recent analyses list.
3. **New Procurement Requirement (`/new`)**:
   - Option 1: Plain text entry with rich sector, department, and budget parameters.
   - Option 2: Tender PDF upload simulation with pre-loaded real tender documents.
   - Refined 4-stage AI processing visualizer: Understanding requirement -> Finding relevant standards -> Ranking recommendations -> Preparing MANAK Insight.
4. **Requirement Analysis & Recommendations (`/analysis/:id`)**:
   - **Requirement Extraction Breakdown**: Product Identified, Purpose, Operating Environment, Keywords, Key Technical Parameters Matrix.
   - **Recommended Standards**: Ranked cards with relevance %, status (🟢 Current / 🟡 Under Revision / 🔴 Withdrawn), Why Recommended explanation, and expandable Clause Evidence drawer.
   - **Standard Detail Modal / View**: Scope, mandatory clauses, test methods, version amendments, and related standards.
   - **MANAK Insight & Gap Analysis**: Compliance readiness score (0-100), missing parameters checklist with severity ratings, ambiguous phrasing flags with direct fixes, mandatory QCO alerts, and ready-to-copy NIT tender specification clause block.
   - **Tender Specification Appendix Generator**: Printable and copyable official document format (`ExportBriefModal`).
5. **Standards Knowledge Base (`/standards`, `/standards/:code`)**: Searchable, filterable directory of Indian Standards across electrotechnical, civil, safety, utilities, and mechanical sectors.
6. **Procurement Audit History (`/history`)**: Complete audit history with search, sector filtering, and 1-click re-open.
7. **Model Transparency & Scope (`ModelTransparencyModal`)**: Dataset coverage disclosures, vector search methodology, and regulatory disclaimers.

## 4. Color System
- **Primary**: BIS Manak Red (`#B81D24`, hover `#991319`, light `#FDF2F2`, border `#F5C2C4`)
- **Secondary**: Deep Navy (`#0B132B`, `#1C2541`, `#334155`)
- **Accent**: Saffron (`#E67E22`, used sparingly for critical warnings and gap tags)
- **Base**: Warm Off-White (`#FAF8F5`, card `#FFFFFF`, surface `#F3EFEA`, border `#E5DFD5`)
- **Status Badges**: Current (`#15803D`), Under Revision (`#B45309`), Withdrawn (`#B91C1C`)
- **Guilloche Watermark**: Security guilloche background pattern integrated with low opacity.

## 5. API Endpoints
- `GET /api/standards` — Search and filter curated Indian Standards
- `GET /api/standards/{code}` — Detailed standard specifications with clauses and amendments
- `GET /api/standards/presets` — 5 curated SIH 26108 demonstration scenarios
- `POST /api/analyze-requirement` — Intelligent extraction, IS ranking, and gap analysis pipeline
- `GET /api/analyses` — List all past procurement analyses
- `GET /api/analyses/{id}` — Get single analysis report
- `DELETE /api/analyses/{id}` — Delete analysis report
- `GET /api/stats` — Analytics metrics (standards indexed, audits, precision, gaps prevented)
- `POST /api/export-tender-brief` — Export formatted tender appendix

## Update (this session)
- Brand: Hindi "मानक" emblem removed; wordmark is text-only "MANAK AI" (header, footer, landing hero). Landing hero now leads with the MANAK AI wordmark + one-line description of what it does.
- Background: user-supplied guilloche security-paper image served from `frontend/public/manak-bg.webp`; applied as a fixed, masked `body::before` layer (opacity 0.32) plus a hero watermark (`.guilloche-watermark`, 0.4).
- De-fabricated data: invented tender departments, budget figures, officer persona ("CPWD / GeM Desk") and inflated metrics removed.
  - `budget_range` renamed to `conformity_scheme` (backend model, routers, seed, TS types, UI) and now carries real BIS conformity assessment schemes (Scheme-I ISI Mark, Scheme-II CRS, QCO references).
  - `department` now holds real BIS technical departments (ETD, CED, PGD, PCD).
  - `/api/stats` returns live DB counts only (no floor values, no invented precision/"gaps prevented" figures).
  - Footer carries an explicit BIS (bis.gov.in) sourcing + curated-subset disclaimer.
- Typography: switched from Plus Jakarta Sans / JetBrains Mono to **Lato** (the typeface used on bis.gov.in) for all UI text and headings, with **IBM Plex Mono** for institutional metadata labels. Loaded via @fontsource/lato + @fontsource/ibm-plex-mono in index.css; heading tracking relaxed to -0.005em.

## Update — catalogue search, A4 print, corpus, UI restyle
- Search: `/api/standards?search=` now matches code (whitespace-tolerant), title, keywords, sectional committee, **ICS code** and scope; response carries a `categories` facet list. Catalogue page has 220 ms debounced search, dynamic division chips, status dropdown, QCO-only toggle, result summary and reset.
- Corpus: 21 Indian Standards (was 11). New BIS-sourced entries in `backend/seed_extra.py` — Water & Utilities (IS 10500, IS 7634 Pt 2, IS 8329), Electrotechnical (IS 694, IS 732, IS 3043, IS 2026 Pt 1), Safety & Fire (IS 15683, IS 15298 Pt 2, IS 3521 Pt 2).
- Print: `@page A4` + `body.printing-annexure` scoping prints only `#print-root` (the tender annexure) with page-break rules and a three-column signature block (Prepared / Checked / Approved) plus office-seal box. Triggered from Export Tender Appendix → Print / Save as PDF.
- UI: headings now **Source Serif 4** (Lato retained for body, IBM Plex Mono for metadata); global corner radius reduced to ~3 px (all rounded-* utilities collapsed to rounded-sm); dialogs restyled as document sheets (square edges, no blur overlay, full-width 64rem / 52rem).

## Update — Standard comparison
- New route `/compare?a=<code>&b=<code>` (`frontend/src/pages/CompareStandards.tsx`), frontend-only: fetches both standards via `getStandardByCode` (useQueries) and diffs them client-side. No new backend endpoint or model.
- Shows: two header cards, a difference summary strip (attributes differing / clauses in both / clauses unique to each), a 10-row institutional attribute table with Same/Differs flags and amber highlighting, matched-clause side-by-side blocks with tolerance limits, unique-clause columns, test-method shared/unique columns, shared keyword chips, and a print action.
- Entry points: header nav "Compare", per-row "Compare" button in the IS Catalog, and "Compare with another standard" on the standard detail page. Codes live in the URL, so a comparison is shareable; Swap flips the two sides.

## Update — Incremental polish and catalog safety
- Preserved the existing FastAPI/MongoDB project, collections, seeds, routes, service abstraction and five demo analysis profiles. No data migration, dependency install, credentials, environment or deployment changes.
- Important correction to earlier descriptions: this checkout has **mock heuristic analysis**, not live RAG, semantic embeddings or an LLM API. PDF intake is simulated. The scope modal and analysis pages now disclose this; no integration has been replaced or invented.
- UI: Lato headings and body, sentence-case primary labels, quieter watermark, restrained panel shadows, consistent dialogs, keyboard focus, compact horizontally scrollable navigation, route scroll reset and reduced-motion support. Existing A4 print rules retained.
- `/api/standards` adds optional `product` filter and additive `products`, `outcome`, `message` fields. Twelve product templates contain only search descriptions, never IS codes. Product results query existing standard titles. Existing number/ICS/committee/category/status/QCO filters retained. Solar panels and cement currently have no title matches. Empty results explicitly describe the available collection only; broad queries such as `safety` request clarification. Network failures are distinct from no-result states.
- New analyses pass a conservative product guard before the original demo engine. Unknown queries no longer fall through to transformer recommendations. Outcomes: `matched`, `no_results`, `needs_clarification`, `catalog_only`; legacy reports default to `legacy_demo`. Added `outcome_message`, `catalog_matches` and `engine_mode` (mock_heuristic) with TS/Pydantic counterparts. Catalog-only references are not recommendations; no relevance or readiness scores shown for them. All outcomes remain in existing history.
- New recommendation identities/status/clause summaries are loaded from MongoDB records; absent codes and related references are excluded. Existing mock insight templates remain clearly disclosed, with absent IS-number references screened. No-result reports have no generated gaps, annexures or scores. Legacy records are preserved with an unvalidated-demo notice.
- Standard detail lookup no longer guesses the first matching prefix or treats arbitrary input as regex. Compare highlights that same clause numbers do not establish technical equivalence and has retryable error handling.
- No login is required; demonstration session and existing login placeholder remain unchanged.
- History and dashboard distinguish no match / clarification / catalog-only outcomes instead of falling back to fabricated 88/100 readiness. History deletion now uses a consistent confirmation dialog with retryable errors. Landing removes live-RAG, complete-coverage and guaranteed-compliance claims while preserving entry and example flows.

## Screenshot-focused visual refinement
- UI-only pass: new requirement examples become numbered text rows, intake becomes a compact document-style form, department/title fields have more room, and text/PDF tabs use an underline treatment. Landing intake uses concise copy and linked examples.
- Catalog records use proportional sans-serif identifiers and quiet inline status/QCO metadata instead of competing badges. Recent analyses form one continuous register rather than repeated cards; metadata and footer use Lato rather than monospaced body text.
- Top utility bar uses Lato, plain project attribution and a clear official BIS link; removed the amber project badge. Desktop active navigation uses a red underline. Related dialogs retain focus/escape behavior with a compact red-rule document treatment and scroll-contained content.
- Footer heading is an active `Official BIS resources` link to the existing official `https://www.bis.gov.in/?lang=en` destination, opens in a new tab with `noopener noreferrer`.
- No backend, API, analysis engine, database, catalog records, dependencies, environment variables or deployment configuration changed. Existing mock analysis/PDF limitations are unchanged. Print styling remains scoped and intact.
