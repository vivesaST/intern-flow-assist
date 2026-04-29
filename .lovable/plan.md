## 1. Why the files aren't showing

The previous session generated `SIMS_Proposal.docx` and `SIMS_Presentation.pptx`, but `/mnt/documents/` is currently empty — the artifacts were not persisted to storage, so the download tags resolve to nothing. I will **regenerate both files from scratch** using the same content/spec (5 sessions × 10–13 pages, Times New Roman 14pt headings / 12pt body, 37 APA references from 2022–2026, 20-slide deck) and re-emit the artifact tags. After generation I'll QA the PDF preview of the .docx page-by-page.

## 2. Landing page (`src/routes/index.tsx`) changes

**Rebrand**
- Logo letter block: change "S" → "SI"
- Brand name "SIMS" → "Smart Internship"
- Tagline "Smart Internship Management" → "SI · Internship Platform"
- Update `<title>` and meta to "Smart Internship (SI) — …"
- Footer copy: "© 2026 Smart Internship (SI) · Final Year Project"

**Hero**
- Remove the right-hand "This week · Logbook" mock card entirely
- Convert the hero into a single centered column: badge, headline, subhead, CTAs, and the 3-stat row all centered (`text-center`, `mx-auto`, `justify-center`)
- Drop the `md:grid-cols-2` layout

**CTA copy**
- "Explore the demo" → "Launch dashboard"
- "Open demo" (top-right nav) → "Enter platform"
- "Sign in as another role" → keep label but fix styling (see below)

**Fix invisible "Sign in as another role" button**
- Current classes: `variant="outline" border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10` — the shadcn `outline` variant forces a white background that hides the white text on the navy hero.
- Replace with `variant="ghost"` + explicit transparent background and visible border:
  `className="border border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"`

## 3. Sidebar / header brand consistency

`src/components/app-sidebar.tsx` and any other surface that says "SIMS" will be updated to "Smart Internship (SI)" so the in-app brand matches the landing page.

## 4. Deliverables for this turn

1. Regenerate `SIMS_Proposal.docx` (renamed → `SmartInternship_Proposal.docx`)
2. Regenerate `SIMS_Presentation.pptx` (renamed → `SmartInternship_Presentation.pptx`)
3. QA the docx by converting to PDF and inspecting every page
4. Apply all UI changes above
5. Re-emit `<lov-artifact>` tags so the files are downloadable