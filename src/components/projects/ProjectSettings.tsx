"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Textarea } from "@/components/ui/fields";

type Status = { id?: string; name: string; color: string };
type Field = {
  id?: string;
  name: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "DATE";
  options?: string;
};

export default function ProjectSettings({
  projectId,
  initialName,
  initialDescription,
  initialStatuses,
  initialFields,
}: {
  projectId: string;
  initialName: string;
  initialDescription: string | null;
  initialStatuses: Status[];
  initialFields: Field[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addStatus() {
    setStatuses((s) => [...s, { name: "", color: "#64748b" }]);
  }
  function updateStatus(i: number, patch: Partial<Status>) {
    setStatuses((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeStatus(i: number) {
    setStatuses((s) => s.filter((_, idx) => idx !== i));
  }

  function addField() {
    setFields((f) => [...f, { name: "", type: "TEXT" }]);
  }
  function updateField(i: number, patch: Partial<Field>) {
    setFields((f) => f.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i));
  }

  async function save() {
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        statuses: statuses.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        })),
        customFields: fields.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          options: f.options,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">General</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-name">Name</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="s-desc">Description</Label>
            <Textarea
              id="s-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Statuses (board columns)</h2>
          <Button variant="secondary" type="button" onClick={addStatus}>
            Add status
          </Button>
        </div>
        <div className="space-y-2">
          {statuses.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={s.color}
                onChange={(e) => updateStatus(i, { color: e.target.value })}
                className="h-10 w-10 rounded-sm border border-line bg-card"
              />
              <Input
                value={s.name}
                placeholder="Status name"
                onChange={(e) => updateStatus(i, { name: e.target.value })}
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => removeStatus(i)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Custom fields</h2>
          <Button variant="secondary" type="button" onClick={addField}>
            Add field
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input
                value={f.name}
                placeholder="Field name"
                onChange={(e) => updateField(i, { name: e.target.value })}
                className="flex-1 min-w-[150px]"
              />
              <Select
                value={f.type}
                onChange={(e) =>
                  updateField(i, { type: e.target.value as Field["type"] })
                }
              >
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="SELECT">Select</option>
                <option value="DATE">Date</option>
              </Select>
              {f.type === "SELECT" && (
                <Input
                  value={f.options ?? ""}
                  placeholder="Options (comma separated)"
                  onChange={(e) => updateField(i, { options: e.target.value })}
                  className="flex-1 min-w-[150px]"
                />
              )}
              <Button variant="ghost" type="button" onClick={() => removeField(i)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save settings"}
      </Button>
    </div>
  );
}
