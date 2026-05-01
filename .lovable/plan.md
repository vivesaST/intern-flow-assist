## Goal

Rewrite `/mnt/documents/SmartInternship_Presentation.pptx` so the content is supervisor-friendly: simpler language, more substance per slide (no scanty layouts), cleaner outlines, fixed slide order, and clean diagrams (no "Lovable" watermark on the deployment diagram).

## Specific user requests addressed

1. **Simplify wording** — replace academic/jargon phrasing with clear, descriptive bullets a supervisor can read at a glance.
2. **Fill out the slides** — every slide gets a short intro line, 4–6 well-spaced bullets with sub-points where useful, and a takeaway/footer line. No more half-empty slides.
3. **Outline the slides** — consistent structure: title bar (navy), thin amber underline accent, intro lead, bullets, footer. Same grid every slide.
4. **Remove "Lovable" text from the Deployment Topology diagram** — re-render the Graphviz diagram without that label, keep the other node labels (Cloudflare Edge, Worker, Postgres, Object Storage, Auth, Email).
5. **Fix slide order** — current deck has slides 1–20 (intro→Thank You) and then 21–27 (the design diagrams) appended after Thank You. Move all diagram slides BEFORE the Thank You slide so Thank You is the final slide. New order: 1 Title → 2 Agenda → 3–10 (background through NFRs) → 11–13 (architecture/data/use-cases text) → 14–18 (workflows + UI + security) → 19 (schedule) → 20–26 (the 7 design diagrams, with **Sequence – Logbook Approval removed**) → final Thank You.
6. **Remove the "Sequence — Logbook Approval" slide** entirely.

## Final slide list (target)

```text
 1. Title — Smart Internship (SI)
 2. Agenda
 3. Background
 4. Problem Statement
 5. Aim & Objectives
 6. Research Questions
 7. Literature Review — Themes
 8. Methodology
 9. Functional Requirements
10. Non-Functional Requirements
11. System Architecture (text + bounded contexts)
12. Data Model — Principal Entities
13. Use Case Model (text)
14. Logbook Submission Workflow
15. Supervisor Assignment — Workload Balancing
16. Evaluation Module
17. User-Interface Design
18. Security Design
19. Project Schedule
20. Diagram — System Architecture
21. Diagram — Use Case
22. Diagram — Entity Relationship
23. Diagram — Data Flow (Level 1)
24. Diagram — Internship Lifecycle Flowchart
25. Diagram — Deployment Topology  (re-rendered, no "Lovable" label)
26. Thank You
```

(Sequence – Logbook Approval slide deleted; previous trailing position of Thank You corrected.)

## Content rewrite principles

For each text slide:
- **Title** (28pt navy bold) + thin amber rule.
- **One-line lead** in plain English ("What this means for supervisors: …").
- **4–6 bullets**, each ≤ 14 words, action-oriented, no acronyms without expansion on first use.
- **Sub-bullets** only where a concrete example helps (e.g. "Weekly logbook → submitted Monday, approved by Friday").
- **Footer**: "Smart Internship (SI) · FYP 2026" + slide number.

Examples of simplification:
- "FR-04..06: Weekly logbook entries, multi-stage approval, threaded feedback." → "Students submit a short weekly logbook. Industry supervisor approves first, then academic supervisor. Comments stay attached to each entry."
- "Defence in depth: app bug cannot bypass DB-tier policies." → "Even if the website has a bug, the database itself blocks unauthorised access."

## Diagram slides

- Use the existing PNGs already generated in the previous run, except **Deployment Topology**, which will be re-rendered from a fresh Graphviz `.dot` source with the "Lovable" node/label removed (keep: Browser → Cloudflare Edge → TanStack Worker → Managed Postgres / Object Storage / Auth / Email).
- Each diagram slide: title, image (sized to fit with 0.5" margins), 4 plain-English bullets to the side or below explaining what the supervisor is looking at.
- Skip "Sequence — Logbook Approval" entirely (covered by the Logbook Submission Workflow text slide).

## Visual design (consistent across all slides)

- Palette: Deep Navy `#0B2545`, Amber accent `#F4B324`, Slate text `#1F2937`, light surface `#F8FAFC`.
- Title bar: navy text on white, 28pt bold, with a 4pt amber rule underneath.
- Bullets: 16pt slate, 1.25 line spacing, generous left margin.
- Footer band: thin navy strip with white footer text + page number.
- Same master applied to every slide → "outlined well" appearance.

## Build steps (when approved)

1. Re-render Deployment Topology PNG with `dot` (Graphviz) from a cleaned `.dot` source — confirm visually that no "Lovable" label remains.
2. Generate the deck with `pptxgenjs` using a single shared layout helper so every slide shares title bar, amber rule, and footer.
3. Run QA: convert pptx → PDF (LibreOffice) → JPEGs (`pdftoppm`), inspect every slide, confirm:
   - Thank You is the last slide.
   - No "Sequence — Logbook Approval" slide.
   - Deployment diagram has no "Lovable" text.
   - No empty/scanty slides; bullets render fully without overflow.
4. Re-emit the artifact.

## Out of scope

- No changes to the Word proposal this turn.
- No UI/code changes.
- No new diagrams beyond re-rendering Deployment Topology.
