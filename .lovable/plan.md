## Deliverable
One downloadable file: `SmartInternship_Full_Report.docx` in `/mnt/documents/`, formatted per the Faculty Webinar guide (British English, Times New Roman 12pt, 1.5 line spacing, justified, no bullets — itemised lists, no "will", past tense in methodology, present+future in conclusion, APA 7th citations).

## Document Structure

### Preliminary pages
- Title page (placeholders: `[Student Name]`, `[Matric No.]`, `[Department]`, `[Faculty]`, `[Institution]`, `[Supervisor]`, `[Month, Year]`)
- Declaration
- Certification
- Dedication
- Acknowledgements
- Abstract (IMRAD format, ~250 words) — Introduction/gap, Methods (React 19 + TanStack Start + Supabase, RLS, Realtime), Results (working modules + test outcomes), Discussion (implications, limitations, future work)
- Keywords
- Table of Contents (auto)
- List of Figures
- List of Tables
- List of Abbreviations (SIMS, RLS, SIS, SIWES, ITF, UAT, etc.)

### Chapter 1 — Introduction
1.1 Background of the Study — SIWES/industrial-attachment context in Nigerian tertiary institutions
1.2 Statement of the Problem — paper logbooks, weak supervisor oversight, delayed feedback, no realtime visibility
1.3 Aim and Objectives (5 measurable objectives): design, implement, integrate realtime notifications, enforce placement-gated access, evaluate via UAT
1.4 Research Questions
1.5 Significance of the Study
1.6 Scope and Delimitation
1.7 Definition of Terms

### Chapter 2 — Literature Review
2.1 Preamble
2.2 Conceptual Review — SIWES, e-logbook systems, RBAC, realtime web systems
2.3 Theoretical Framework — TAM, Activity Theory
2.4 Empirical Review — 8–10 recent studies (2021–2026) on digital logbooks, internship management, LMS adoption in African universities
2.5 Summary of Reviewed Literature (table: S/N, Author (Year), Title, Work done, Findings, Knowledge gap, Relation to current study)
2.6 Research Gap
2.7 Chapter Summary

### Chapter 3 — Methodology / System Design
3.1 Preamble
3.2 Research Design — design-science / iterative prototyping, justified
3.3 System Architecture (diagram description) — client (React 19/TanStack Start) ↔ edge server functions ↔ Supabase (Postgres, Auth, Storage, Realtime)
3.4 Objective 1 — To design: use-case diagram, ERD (profiles, user_roles, placements, companies, log_entries, log_comments, tasks, evaluations), sequence diagrams for placement gating and comment notifications
3.5 Objective 2 — To implement: tools (React 19, TanStack Start v1, Tailwind v4, shadcn/ui, Supabase JS, Postgres, RLS), authentication flow, role separation (`has_role` SECURITY DEFINER), placement gating, logbook + attachments, realtime notifications, admin management server functions
3.6 Objective 3 — To evaluate: unit / integration / UAT plan; metrics (functional correctness, response time, usability via SUS)
3.7 Ethical Considerations
3.8 Chapter Summary

### Chapter 4 — Results and Discussion
4.1 Preamble
4.2 System Development Outcome (modules delivered)
4.3 System Implementation (screenshot placeholders: Login, Student Dashboard, Logbook, Approvals, Admin Student Manage, Notifications toast) — each with caption and in-text reference
4.4 Testing
  4.4.1 Unit
  4.4.2 Integration
  4.4.3 UAT
4.5 Test Cases (table with 12 rows: registration, placement gating, 5 MB upload, comment realtime toast, admin delete, password reset, role escalation attempt, etc. — Test ID, Description, Input, Expected, Actual, Status)
4.6 Performance Discussion (response times, realtime latency)
4.7 Discussion of Findings (linked back to each objective)
4.8 Chapter Summary

### Chapter 5 — Conclusion and Recommendations
5.1 Preamble
5.2 Summary of the Study
5.3 Conclusion
5.4 Contribution to Knowledge
5.5 Recommendations (institutions, coordinators, industry supervisors)
5.6 Suggestions for Future Work (native mobile app, AI-assisted logbook feedback, SIS integration, offline-first sync)

### References (APA 7th, 15–20 recent 2021–2026 sources)

### Appendices
- Appendix A: Sample Source Code (has_role function, useCommentNotifications hook, deleteStudent server function)
- Appendix B: UAT Questionnaire (SUS-style)
- Appendix C: Sample Screens list
- Appendix D: Database Schema listing

## Technical build approach
- `docx-js` (already in project) generates the file to `/mnt/documents/SmartInternship_Full_Report.docx`.
- Heading styles overridden (Times New Roman, 14pt H1 bold, 12pt H2 bold; body 12pt, 1.5 line spacing, justified).
- Itemised lists via `LevelFormat.DECIMAL` numbering (no bullets, per guide).
- Tables with DXA widths for Summary-of-Reviewed-Literature and Test-Cases.
- Auto TOC placeholder (`TableOfContents`) — user refreshes in Word.
- QA: convert to PDF via LibreOffice, `pdftoppm` to images, inspect every page for overflow / clipping / empty pages, fix, re-render.
- Present final file with `<presentation-artifact>`.

## Out of scope
- No code changes to the app.
- No new DB migrations.
- Author details left as bracketed placeholders (user will fill later).