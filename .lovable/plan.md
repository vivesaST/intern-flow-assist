## Goal

Enable two new logbook capabilities:
1. Students can attach images/screenshots (diagrams, photos) to a logbook entry.
2. Supervisors can review submitted entries — approve, request revision, and leave comments.

## Database changes (one migration)

- Create Supabase Storage bucket `logbook-attachments` (private), with RLS so students upload to their own folder and supervisors/admins can read attachments for entries they oversee.
- Add columns to `public.log_entries`:
  - `attachments text[] default '{}'` — storage paths to uploaded images.
  - `reviewed_by uuid` — supervisor profile/user id who actioned it.
  - `reviewed_at timestamptz`.
  - `feedback text` — supervisor's overall note on the entry.
- New table `public.log_comments` (threaded comments per entry):
  - `entry_id`, `author_id`, `body`, `created_at`.
  - GRANTs + RLS: student who owns the entry and supervisors/admins linked to that student's placement can read & insert.
- Update existing `log_entries` RLS so:
  - Supervisors (industry or academic) on the student's active placement can SELECT entries and UPDATE only `status`, `feedback`, `reviewed_by`, `reviewed_at`.
  - Admins can do the same.
- Helper SECURITY DEFINER function `public.is_supervisor_of(_entry_id uuid)` to keep policies non-recursive.

## Frontend changes

### Student side (`src/routes/logbook.tsx`)
- In the "New entry" dialog, add a file picker (multiple, image/*). On save, upload each file to `logbook-attachments/{user_id}/{entry_id}/...` and store the paths in `attachments`.
- In the entry detail dialog, render a thumbnail gallery (click to open full size) and show supervisor feedback + comment thread (read-only for the student, plus a reply box).

### Supervisor side
- New route `src/routes/approvals.tsx` (visible to `supervisor` and `admin` roles, added to sidebar): list of submitted entries from students they supervise, filterable by status.
- Clicking an entry opens a review drawer/dialog showing: student, week, activities, skills, attachments, comment thread.
- Actions: **Approve**, **Request revision**, and a textbox to add a comment or feedback. Each action writes to `log_entries` (status/feedback/reviewed_*) and optionally inserts a `log_comments` row.

### Shared
- Small `<AttachmentGallery />` component for thumbnails with signed-URL fetching from the private bucket.
- `<CommentThread />` component used in both student and supervisor views.

## Out of scope (ask if you want them)

- Notifications/emails when an entry is approved or commented on.
- Per-comment edit/delete.
- PDF/document attachments (only images for now).

## Open questions

1. Should **both** supervisors (industry + academic) be required to approve, or is one approval enough to mark the entry `approved`?
2. Any file-size/count limit per entry (e.g. max 5 images, 5 MB each)?
