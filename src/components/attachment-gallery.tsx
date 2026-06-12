import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function AttachmentGallery({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<{ path: string; url: string }[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!paths || paths.length === 0) {
      setUrls([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase.storage
        .from("logbook-attachments")
        .createSignedUrls(paths, 60 * 60);
      if (error || cancelled) return;
      setUrls(
        (data ?? [])
          .filter((d) => d.signedUrl)
          .map((d, i) => ({ path: paths[i], url: d.signedUrl! })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [paths.join("|")]);

  if (!paths || paths.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {urls.map((u) => (
          <button
            key={u.path}
            type="button"
            onClick={() => setOpen(u.url)}
            className="aspect-square overflow-hidden rounded-md border bg-muted hover:opacity-90"
          >
            <img src={u.url} alt="attachment" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl p-2">
          {open && <img src={open} alt="attachment" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </>
  );
}