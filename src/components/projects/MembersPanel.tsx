"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui/fields";

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function MembersPanel({
  projectId,
  members,
  availableUsers,
}: {
  projectId: string;
  members: { id: string; name: string | null; email: string; role: string }[];
  availableUsers: User[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = availableUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(email.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(email.toLowerCase())
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add member");
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function remove(userId: string) {
    const res = await fetch(
      `/api/projects/${projectId}/members?userId=${userId}`,
      { method: "DELETE" }
    );
    if (res.ok) router.refresh();
  }

  function selectUser(user: User) {
    setEmail(user.email);
    setIsOpen(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-lg font-medium">Members</h2>
        <ul className="divide-y divide-line rounded-sm border border-line">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium">{m.name ?? m.email}</div>
                <div className="font-mono text-xs text-muted-fg">{m.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="tag border-line bg-paper text-muted-fg">
                  {m.role}
                </span>
                <Button variant="ghost" onClick={() => remove(m.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={add} className="space-y-3">
        <h2 className="text-lg font-medium">Add member</h2>
        <div ref={containerRef} className="relative">
          <Input
            type="text"
            placeholder="Search users…"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setIsOpen(true);
              setHighlightIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((i) => (i < filtered.length - 1 ? i + 1 : i));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
              } else if (e.key === "Enter" && highlightIndex >= 0 && filtered[highlightIndex]) {
                e.preventDefault();
                selectUser(filtered[highlightIndex]);
              } else if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
          />
          {isOpen && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-sm border border-line bg-card shadow-lg">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-fg">No users found</div>
              ) : (
                filtered.map((u, i) => (
                  <div
                    key={u.id}
                    className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                      i === highlightIndex
                        ? "bg-accent text-white"
                        : "hover:bg-paper"
                    }`}
                    onMouseDown={() => selectUser(u)}
                    onMouseEnter={() => setHighlightIndex(i)}
                  >
                    <span className="font-medium">{u.name ?? u.email}</span>
                    {u.name && <span className="text-xs text-muted-fg">{u.email}</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-sm border border-line bg-card px-3 text-sm text-ink outline-none hover:border-line-strong focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add member"}
        </Button>
      </form>
    </div>
  );
}
