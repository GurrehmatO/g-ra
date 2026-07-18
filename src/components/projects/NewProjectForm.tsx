"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui/fields";

export default function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, key, description }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create project");
      return;
    }
    const { project } = await res.json();
    router.push(`/projects/${project.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
        <h2 className="mb-1 font-display text-lg font-bold text-ink">New project</h2>
      <div>
        <Label htmlFor="p-name">Name</Label>
        <Input
          id="p-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="p-key">Key (short code, e.g. DEMO)</Label>
        <Input
          id="p-key"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          required
          pattern="[A-Za-z0-9_-]+"
        />
      </div>
      <div>
        <Label htmlFor="p-desc">Description</Label>
        <Textarea
          id="p-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
