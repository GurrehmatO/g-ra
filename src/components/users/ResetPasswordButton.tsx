"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function onConfirm() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/users/${userId}/reset-password`, {
      method: "POST",
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to reset password");
      return;
    }
    setDone(true);
    router.refresh();
  }

  function onClose() {
    setOpen(false);
    setError(null);
    setDone(false);
  }

  return (
    <>
      <Button
        variant="secondary"
        className="px-2 py-1 text-[10px]"
        onClick={() => setOpen(true)}
      >
        Reset PW
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm">
          <div
            ref={dialogRef}
            className="w-full max-w-sm animate-pop-in rounded-md border border-line bg-card shadow-drag"
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="h-4 w-1 bg-bug" aria-hidden />
              <h3 className="font-display text-sm font-bold text-ink">
                Reset password
              </h3>
            </div>

            <div className="px-4 py-4">
              {done ? (
                <p className="text-sm text-blueprint">
                  Password for <strong>{userName}</strong> has been reset to{" "}
                  <code className="rounded-sm bg-surface px-1 py-0.5 font-mono text-xs">
                    password
                  </code>
                  .
                </p>
              ) : (
                <>
                  <p className="text-sm text-ink-soft">
                    Reset password for{" "}
                    <strong className="text-ink">{userName}</strong> to the
                    default password?
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-fg">
                    Default password:{" "}
                    <code className="rounded-sm bg-surface px-1 py-0.5 text-ink">
                      password
                    </code>
                  </p>
                </>
              )}
              {error && (
                <p className="mt-2 text-sm text-bug">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
              {done ? (
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset password"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
