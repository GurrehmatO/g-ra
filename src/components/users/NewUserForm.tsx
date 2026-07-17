"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select } from "@/components/ui/fields";

export default function NewUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create user");
      return;
    }
    setEmail("");
    setName("");
    setPassword("");
    setRole("USER");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-lg font-medium">New user</h2>
      <div>
        <Label htmlFor="u-email">Email</Label>
        <Input
          id="u-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="u-name">Name</Label>
        <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="u-pass">Temporary password</Label>
        <Input
          id="u-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div>
        <Label htmlFor="u-role">Role</Label>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create user"}
      </Button>
    </form>
  );
}
