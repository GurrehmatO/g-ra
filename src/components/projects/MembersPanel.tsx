"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui/fields";

export default function MembersPanel({
  projectId,
  members,
}: {
  projectId: string;
  members: { id: string; name: string | null; email: string; role: string }[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

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
        <div>
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
