## Smart Internship Management System — Full Project Deliverables

A complete final-year project package: a UI-only web app, a formal proposal document, and a presentation deck — all themed around a Smart Internship Management System (SIMS) that automates internship workflows for students, supervisors (academic + industry), and administrators.

**Visual identity (used across UI, document, and slides):** Deep navy primary (#0B2447), supporting blue (#19376D / #576CBC), amber accent (#F59E0B), light surface (#F8FAFC). Times New Roman in the document; Calibri/Arial in slides for readability.

---

### Deliverable 1 — UI-only Web Application

A polished, role-based dashboard built with TanStack Start + Tailwind + shadcn. No backend yet — all data is mocked locally so screens render fully for demos and screenshots.

**Architecture**
- Sidebar layout with collapsible navigation (shadcn sidebar)
- Role switcher in the header (Student / Academic Supervisor / Industry Supervisor / Admin) — switches mock dataset and visible nav items
- Routes under `src/routes/`: `index.tsx` (landing), `login.tsx`, `dashboard.tsx`, `logbook.tsx`, `tasks.tsx`, `evaluations.tsx`, `placements.tsx`, `supervisors.tsx`, `students.tsx`, `reports.tsx`, `profile.tsx`, `settings.tsx`

**Landing page (`/`)**
- Navy hero with amber CTA, system overview, feature grid, "for institutions / for industry" split, footer

**Login page** — role selector mock (no real auth), routes to dashboard

**Student dashboard**
- Internship progress card (weeks completed, hours logged)
- Today's task list, recent supervisor feedback, quick "Add logbook entry" button
- Mini calendar of submissions

**Logbook module**
- Weekly entries table with status badges (Draft / Submitted / Approved / Revision)
- "New entry" dialog: date, hours, activities, skills practised, attachments
- Detail view with academic + industry supervisor comments thread

**Tasks & evaluations**
- Kanban or table of assigned tasks (To do / In progress / Submitted / Graded)
- Evaluation form: rubric with sliders/ratings, mid-term and final assessments
- Industry supervisor view to grade; academic supervisor view to moderate

**Placements & supervisor assignment (Admin)**
- Students table with filters (department, status, GPA range)
- Companies table with available slots
- "Match" drawer: assign student → company + academic supervisor; conflict warnings
- Bulk-assign action

**Supervisor dashboards**
- Academic: list of supervisees, pending logbook approvals, evaluation progress bars
- Industry: assigned interns, task pipeline, evaluation queue

**Reports & analytics**
- Charts (Recharts): logbook submission rates, average evaluation scores, placement distribution by sector, on-time completion %, supervisor workload
- Exportable report cards (UI only — print-styled page)

**Profile & settings** — basic user info, notification preferences, theme toggle

**Design system updates**
- Update `src/styles.css` with the navy + amber palette (oklch values)
- Sidebar, status badges, KPI cards, data tables, empty states, skeleton loaders

---

### Deliverable 2 — Proposal Document (.docx)

A single Word file generated with `docx` (npm), Times New Roman throughout, headings 14pt bold, body 12pt, 1.15–1.5 spacing, page numbers, header with project title.

**Structure (each session 10–13 pages):**

- **Session One — Introduction** (10–13 pp): Background, Problem Statement, Aim & Objectives, Significance, Scope, Limitations, Definition of Terms
- **Session Two — Literature Review** (10–13 pp): Historical perspectives of internship management systems, Theoretical framework (Agile, MVC, microservices, workflow automation theory), Review of 50 related works (table-driven), Gaps in existing research, Summary
- **Session Three — System Design & Methodology** (10–13 pp): Proposed system review, Functional + non-functional requirements, Agile/Scrum methodology, System architecture (client-server + modular), Logical design (use case, ERD, flowcharts described), Languages & tools, Database design + ERD description, Modules, Security
- **Session Four — Implementation & Testing** (10–13 pp): Development overview, Implementation walkthrough with UI screenshot placeholders, Unit/Integration/UAT strategies, Test cases table, Performance evaluation, Application manual, Changeover procedures
- **Session Five — Summary, Conclusion & Recommendations** (10–13 pp): Findings, Conclusion, Contributions to knowledge, Recommendations, Future work
- **References** (placed last): exactly 37 APA-format entries dated 2022–2026
- **Appendices**: code snippet listings (A, B, C), additional tables, sample outputs

The script writes to `/mnt/documents/SIMS_Proposal.docx` and is QA'd by converting to PDF + images to verify font, headings, and page counts.

---

### Deliverable 3 — Presentation Slides (.pptx)

Generated with `pptxgenjs`, navy + amber theme, Calibri body / Georgia headers, 16:9.

**Slide list (in order):**
1. Title slide — project name, student, supervisor, institution, date
2. Overview / agenda
3. Introduction & background
4. Problem statement
5. Aim and objectives
6. Significance of the study
7. Scope of the study
8. Limitations of the study
9. Literature review — summary table
10. Research gap
11. Methodology (Agile/Scrum)
12. System architecture (diagram)
13. Design overview
14. Logical design diagram (use case / DFD)
15. Class diagram
16. Technology used (logos grid)
17. Expected outcome
18. Project timeline (Gantt-style)
19. Conclusion
20. Thank you / Q&A

Saved to `/mnt/documents/SIMS_Presentation.pptx`. Each slide is rendered to an image and visually QA'd.

---

### Order of work

1. Update design tokens, build sidebar + role switcher + landing page
2. Build student-facing screens (dashboard, logbook, tasks)
3. Build supervisor + admin screens (placements, supervisors, students, evaluations, reports)
4. Generate the .pptx deck and QA it
5. Generate the .docx proposal and QA it
6. Deliver both files via artifact tags alongside the running UI

### Out of scope (this round)

- Real authentication, database, or backend logic
- Email/SMS notifications
- File upload storage
- Mobile native app

After approval, switch to default mode and execute the plan above.