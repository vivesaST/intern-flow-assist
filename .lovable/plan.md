## Goal

Replace the current 46-page `SmartInternship_Proposal.docx` with a concise proposal of **12–14 pages** that follows the exact 15-section structure the supervisor specified. Trim verbose academic prose; keep only what each section needs.

## What changes

- Discard the current "Session 1–5" / "Conceptual Framework" / "Operational Definitions" / multi-paragraph essays.
- Rebuild from scratch using the supervisor's 15 headings, in order, with brief, focused content under each.
- Keep the project topic identical: **Smart Internship Management System (SI)**.
- Keep the existing Graphviz diagrams (architecture, use case, ERD, DFD, lifecycle flowchart, deployment) — they fit Section 8 (System Design).
- No changes to the `.pptx` or to the app code in this turn.

## New document structure (target ≤ 15 pages)

```text
Cover page (title, author, supervisor, department, date)        [~0.5 pg]
1.  Title of the Project                                         [~0.25 pg]
2.  Introduction / Background                                    [~1 pg]
3.  Problem Statement                                            [~0.5 pg]
4.  Aim and Objectives (Aim + 4–6 objectives)                    [~0.5 pg]
5.  Research Questions                                           [~0.25 pg]
6.  Literature Review (brief — themes + gap)                     [~1.5 pg]
7.  Methodology (approach, tools, data, models)                  [~1.5 pg]
8.  System Design (architecture + use case + ERD + flowchart)    [~3 pg, mostly diagrams]
9.  Expected Results / Contributions                             [~0.5 pg]
10. Project Plan / Timeline (Gantt-style table)                  [~1 pg]
11. Tools and Resources Required                                 [~0.5 pg]
12. Evaluation Method                                            [~0.5 pg]
13. Scope and Limitations                                        [~0.5 pg]
14. References (APA, ~10–15 sources, not 37)                     [~1 pg]
15. Appendices (only if needed — sample logbook entry)           [~0.5 pg]
```

Total: ~13 pages.

## Content rules

- Each section opens with a 1–2 sentence lead, then short paragraphs or bullets — no multi-paragraph essays.
- **Objectives**: action-verb list (Design, Develop, Implement, Evaluate) — 5 items max.
- **Research Questions**: 3–4 numbered questions only.
- **Literature Review**: 4 short thematic paragraphs (workflow automation, e-portfolios/logbooks, RBAC, gap) — not a chapter.
- **Methodology**: design-science approach; stack (TanStack Start, React 19, PostgreSQL, Tailwind); data sources (stakeholder interviews, document review); algorithms (rule-based supervisor-load balancing).
- **System Design**: reuse the 6 PNGs already on disk (architecture, use case, ERD, DFD, lifecycle flowchart, deployment). Each diagram gets a caption + 2-line description. Drop the sequence diagram.
- **Project Plan**: 12-week table (Week, Activity, Deliverable). No Gantt image needed — table is enough.
- **Evaluation Method**: usability (SUS), functional acceptance tests, performance (page-load, API latency), supervisor feedback survey.
- **References**: trim to ~12 highly relevant APA entries.

## Build steps (when approved)

1. Generate `SmartInternship_Proposal_v2.docx` using `docx-js` (the same skill used previously) with:
   - US Letter, 1" margins, Arial 11pt body, Arial bold headings.
   - Page numbers in footer, project title in header.
   - Embed the existing diagram PNGs from the prior run (already in `/tmp` or regenerate quickly via Graphviz if missing).
   - Numbered figure captions.
2. QA: convert to PDF via LibreOffice → `pdftoppm` → confirm page count is 12–14, every section is present and in the correct order, diagrams render, no orphan headings.
3. Save as a new versioned file (`SmartInternship_Proposal_v2.docx`) so the original 46-page version is preserved for comparison.
4. Emit the new file as a `presentation-artifact`.

## Out of scope this turn

- No changes to the slide deck (`SmartInternship_Presentation.pptx`).
- No changes to the React app / UI.
- No new diagrams — reuse the 6 already produced.
