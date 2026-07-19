"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui/fields";

type Tab = "profile" | "password";

export default function TopNavProfileMenu({
  userName,
  initials,
}: {
  userName: string;
  initials: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState(userName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function resetPasswordFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function onProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update profile");
      return;
    }
    setSuccess("Name updated");
    router.refresh();
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to change password");
      return;
    }
    setSuccess("Password changed");
    resetPasswordFields();
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
          setSuccess(null);
        }}
        className="flex items-center gap-2 rounded-sm px-1.5 py-1 -ml-1.5 transition-colors hover:bg-surface"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink bg-ink font-mono text-[10px] font-bold text-paper">
          {initials || "G"}
        </span>
        <span className="hidden text-sm font-medium text-ink-soft sm:block">
          {userName}
        </span>
        <svg
          className="h-3.5 w-3.5 text-muted-fg"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 animate-pop-in rounded-md border border-line bg-card shadow-drag"
        >
          {/* Tabs */}
          <div className="flex border-b border-line">
            <button
              onClick={() => {
                setTab("profile");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                tab === "profile"
                  ? "border-b-2 border-accent text-accent-ink"
                  : "text-muted-fg hover:text-ink-soft"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => {
                setTab("password");
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                tab === "password"
                  ? "border-b-2 border-accent text-accent-ink"
                  : "text-muted-fg hover:text-ink-soft"
              }`}
            >
              Password
            </button>
          </div>

          <div className="p-4">
            {tab === "profile" && (
              <form onSubmit={onProfileSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="pf-name">Name</Label>
                  <Input
                    id="pf-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                {error && <p className="text-sm text-bug">{error}</p>}
                {success && (
                  <p className="text-sm text-blueprint">{success}</p>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save name"}
                </Button>
              </form>
            )}

            {tab === "password" && (
              <form onSubmit={onPasswordSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="pw-current">Current password</Label>
                  <Input
                    id="pw-current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <Label htmlFor="pw-new">New password</Label>
                  <Input
                    id="pw-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="pw-confirm">Confirm new password</Label>
                  <Input
                    id="pw-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {error && <p className="text-sm text-bug">{error}</p>}
                {success && (
                  <p className="text-sm text-blueprint">{success}</p>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? "Changing..." : "Change password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
