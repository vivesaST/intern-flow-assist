## Problem

Session 3 (System Design) of `SmartInternship_Proposal.docx` and the corresponding slides in `SmartInternship_Presentation.pptx` are text-only. A System Design chapter must be **diagram-driven**. I'll regenerate both artifacts with embedded visual diagrams.

## Diagrams to add (Session 3)

I'll render each diagram as a **PNG** (using Mermaid CLI → PNG, or Python `matplotlib`/`graphviz` for ERD/flowcharts) and embed them inline in the docx + pptx with captions ("Figure 3.x — …").

| # | Diagram | Type | Tool |
|---|---|---|---|
| 3.1 | System Architecture (3-tier: Client → TanStack Start Server → Postgres + Storage + Auth) | Block diagram | Mermaid `graph` |
| 3.2 | Use Case Diagram (Student, Academic Sup., Industry Sup., Admin actors + use cases) | UML use case | Graphviz / Mermaid |
| 3.3 | Entity Relationship Diagram (users, roles, placements, companies, supervisors, logbook_entries, tasks, evaluations, comments) | ERD | Mermaid `erDiagram` |
| 3.4 | Data Flow Diagram — Level 0 (context) and Level 1 (logbook submission + supervisor approval) | DFD | Graphviz |
| 3.5 | Sequence Diagram — Logbook submission & approval workflow | UML sequence | Mermaid `sequenceDiagram` |
| 3.6 | Sequence Diagram — Supervisor assignment & placement matching | UML sequence | Mermaid `sequenceDiagram` |
| 3.7 | Activity Flowchart — Internship lifecycle (application → placement → weekly logbook → mid/final evaluation → completion) | Flowchart | Mermaid `flowchart` |
| 3.8 | Database Schema (table boxes with columns, PK/FK arrows) | Schema diagram | Graphviz `record` nodes |
| 3.9 | Component / Module Diagram (frontend modules ↔ server functions ↔ DB) | Component | Mermaid |
| 3.10 | Deployment Diagram (Cloudflare Worker edge + Postgres + Object Storage + Auth Gateway) | Deployment | Mermaid |

Each figure gets a numbered caption (Times New Roman, 12pt, italic, centered) and a 1–2 paragraph explanation referring to it ("As shown in Figure 3.3, the `logbook_entries` table relates to `placements` via …").

## Document changes (`SmartInternship_Proposal.docx`)

- Rebuild Session 3 around the 10 figures above; expand subsections:
  - 3.1 System Architecture Overview → embed Fig 3.1, Fig 3.10
  - 3.2 Use Case Modelling → embed Fig 3.2 + actor/use-case table
  - 3.3 Process & Flow Design → embed Fig 3.4 (DFD L0/L1), Fig 3.7 (lifecycle flowchart)
  - 3.4 Interaction Design → embed Fig 3.5, Fig 3.6 (sequence diagrams)
  - 3.5 Database Design → embed Fig 3.3 (ERD), Fig 3.8 (schema), plus a data-dictionary table for each main entity
  - 3.6 Component / Module Design → embed Fig 3.9
  - 3.7 UI / UX Design → keep existing copy, add 2–3 wireframe-style figures (rendered from the live app screens: dashboard, logbook, placements) captured via headless screenshot
- Keep all other sessions intact, keep 37 APA references at the end.
- Maintain Times New Roman, headings 14pt bold, body 12pt.

## Presentation changes (`SmartInternship_Presentation.pptx`)

Insert/replace System Design slides (around slides 8–14) so each key diagram gets its own slide:
- Slide: System Architecture (Fig 3.1)
- Slide: Use Case Diagram (Fig 3.2)
- Slide: ERD (Fig 3.3)
- Slide: DFD Level 0 + Level 1 (Fig 3.4)
- Slide: Logbook Sequence (Fig 3.5)
- Slide: Internship Lifecycle Flowchart (Fig 3.7)
- Slide: Database Schema (Fig 3.8)
- Slide: Deployment Diagram (Fig 3.10)

Each slide: title (28pt bold), centered diagram image, 2–3 bullet caption on the side or below. Same Deep Navy / Amber palette.

## QA

1. Render each diagram PNG individually and visually inspect (no clipped labels, readable text at slide size).
2. Convert final `.docx` → PDF, inspect every page of Session 3 to confirm figures aren't cut off, captions are present, page count for Session 3 lands in the 10–13 range.
3. Convert final `.pptx` → images, inspect each new design slide for layout, contrast, and overflow.
4. Re-emit both artifact tags.

## Tooling

- `@mermaid-js/mermaid-cli` (`mmdc`) via `bunx` for Mermaid → PNG.
- `graphviz` (`dot`) via `nix run nixpkgs#graphviz` for DFD / schema diagrams.
- `docx` npm package for the Word file (existing pipeline), `pptxgenjs` for slides — both already in use.
- `libreoffice` for docx→pdf QA, `pdftoppm` for slide image QA.

## Out of scope

- No UI code changes this turn.
- No new sessions, no reference list changes — only Session 3 content + matching slides are rebuilt.
