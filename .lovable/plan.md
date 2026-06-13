## Goals
1. Real-time toast notifications for new comments on logbook entries.
2. Gate logbook + tasks for students without an active placement.
3. Show assigned supervisors on the student dashboard.
4. Full admin student management: edit profile, edit placement, delete, password reset.
5. Capture level / semester (Nigerian style) on profile.

## Database migration
- `profiles`: add `level text` (100/200/300/400/500), `semester text` (First/Second). Department stays free text.
- Enable Realtime on `public.log_comments` (`ALTER PUBLICATION supabase_realtime ADD TABLE public.log_comments;`).
- New server function (admin-only) `deleteStudent` using `supabaseAdmin.auth.admin.deleteUser`, gated by `has_role(_, 'admin')`. Also `sendPasswordReset` server fn using admin client.
- RLS: allow admins to UPDATE any `profiles`, `placements` row (add policies using `has_role(auth.uid(),'admin')`).

## Notifications (toast only, no inbox)
- New hook `useCommentNotifications()` mounted in `__root.tsx` (inside auth-aware area). Subscribes to `log_comments` INSERT events via Supabase Realtime.
- For each new comment, fetches the parent `log_entries` row to check if user is the entry owner OR a supervisor on that placement OR an admin; ignore own comments. Shows `toast.info("New comment from {author} on {entry.title}")` with an action button that navigates to `/logbook` or `/approvals`.
- Uses existing `sonner` toaster.

## Placement gating
- New util `usePlacementStatus()` reading current user's placement.
- `src/routes/logbook.tsx` and `src/routes/tasks.tsx`: if role is `student` and no placement (or placement.status === 'pending' with no company/supervisor), render a `PlacementRequiredCard` showing "Awaiting placement assignment. Contact your coordinator." instead of the page contents.
- No effect on supervisor/admin views of those routes.

## Dashboard supervisor display
- `src/routes/dashboard.tsx`: for student role, fetch their placement + join academic/industry supervisor names + company, show a "Your placement" card with company, academic supervisor, industry supervisor, status. If none, show CTA card "No placement assigned yet".

## Admin student management
- `src/routes/students.tsx` (admin/academic view):
  - Add a per-row "Manage" button opening a `Sheet` with tabs **Profile** | **Placement** | **Danger**.
  - Profile tab: editable `full_name`, `email`, `matric`, `department`, `level` (Select 100–500), `semester` (Select First/Second). Save via `supabase.from('profiles').update()`.
  - Placement tab: same controls as `/placements` assign sheet (company, academic, industry, status, progress slider). Upserts `placements`.
  - Danger tab (admin only): "Send password reset" button + "Delete student" with confirm dialog → calls server fn.
- Hide Manage button for non-admin/non-academic roles.

## Server functions (new file `src/lib/admin-students.functions.ts`)
- `deleteStudent({ userId })` — middleware `requireSupabaseAuth`, checks caller has admin role via `has_role`, then admin-deletes user (cascades profile/placements/etc via FK).
- `sendStudentPasswordReset({ email })` — admin-only, uses `supabaseAdmin.auth.admin.generateLink({ type: 'recovery' })` and returns link, or uses `resetPasswordForEmail`.

## Files to add/edit
- Migration: profiles columns, realtime publication, admin RLS policies.
- New: `src/hooks/use-comment-notifications.ts`, `src/hooks/use-placement.ts`, `src/components/placement-required.tsx`, `src/components/student-manage-sheet.tsx`, `src/lib/admin-students.functions.ts`.
- Edit: `src/routes/__root.tsx` (mount notifications hook), `src/routes/logbook.tsx`, `src/routes/tasks.tsx` (gating), `src/routes/dashboard.tsx` (supervisor card), `src/routes/students.tsx` (Manage sheet), `src/routes/profile.tsx` (add level/semester fields), `src/start.ts` if not already wiring attacher.

## Notes
- Toasts only — no notification history table, per your choice.
- A `/reset-password` route already exists or will be added if missing for the password-reset email link target.
