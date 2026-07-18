"use client";

import { useState } from "react";
import { Button, Input, Label, Select, Textarea } from "@/components/ui/fields";

export type CustomFieldDef = {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "DATE";
  options?: string | null;
};

export type MemberOption = { id: string; name: string | null; email: string };

export type TicketDraft = {
  id?: string;
  type: "STORY" | "BUG";
  title: string;
  description: string;
  assigneeId: string;
  statusId: string;
  customValues: Record<string, string>;
};

export default function TicketForm({
  projectId,
  statuses,
  members,
  customFields,
  draft,
  onSaved,
  onCancel,
}: {
  projectId: string;
  statuses: { id: string; name: string }[];
  members: MemberOption[];
  customFields: CustomFieldDef[];
  draft?: TicketDraft;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TicketDraft>(
    draft ?? {
      type: "STORY",
      title: "",
      description: "",
      assigneeId: "",
      statusId: statuses[0]?.id ?? "",
      customValues: {},
    }
  );
  const isEdit = Boolean(form.id);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadImages(ticketId: string) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        await fetch(`/api/tickets/${ticketId}/images`, {
          method: "POST",
          body: fd,
        });
      }
    } finally {
      setUploading(false);
    }
  }

  function set<K extends keyof TicketDraft>(key: K, value: TicketDraft[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      projectId,
      type: form.type,
      title: form.title,
      description: form.description,
      assigneeId: form.assigneeId || undefined,
      statusId: form.statusId || undefined,
      customValues: Object.entries(form.customValues)
        .filter(([, v]) => v)
        .map(([customFieldId, value]) => ({ customFieldId, value })),
    };

    const url = isEdit ? `/api/tickets/${form.id}` : "/api/tickets";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save ticket");
      return;
    }
    if (!isEdit) {
      const data = await res.json().catch(() => ({}));
      const createdId = data.ticket?.id;
      if (createdId) await uploadImages(createdId);
    }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="t-type">Type</Label>
        <Select
          id="t-type"
          value={form.type}
          onChange={(e) => set("type", e.target.value as "STORY" | "BUG")}
        >
          <option value="STORY">Story</option>
          <option value="BUG">Bug</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="t-title">Title</Label>
        <Input
          id="t-title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="t-desc">Description</Label>
        <Textarea
          id="t-desc"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {customFields.map((cf) => {
        const value = form.customValues[cf.id] ?? "";
        return (
          <div key={cf.id}>
            <Label htmlFor={`cf-${cf.id}`}>{cf.name}</Label>
            {cf.type === "SELECT" ? (
              <Select
                id={`cf-${cf.id}`}
                value={value}
                onChange={(e) =>
                  set("customValues", {
                    ...form.customValues,
                    [cf.id]: e.target.value,
                  })
                }
              >
                <option value="">—</option>
                {(cf.options ? JSON.parse(cf.options) : []).map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={`cf-${cf.id}`}
                type={cf.type === "NUMBER" ? "number" : cf.type === "DATE" ? "date" : "text"}
                value={value}
                onChange={(e) =>
                  set("customValues", {
                    ...form.customValues,
                    [cf.id]: e.target.value,
                  })
                }
              />
            )}
          </div>
        );
      })}

      <div>
        <Label htmlFor="t-assignee">Assignee</Label>
        <Select
          id="t-assignee"
          value={form.assigneeId}
          onChange={(e) => set("assigneeId", e.target.value)}
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name ?? m.email}
            </option>
          ))}
        </Select>
      </div>

      {!draft && (
        <div>
          <Label htmlFor="t-status">Status</Label>
          <Select
            id="t-status"
            value={form.statusId}
            onChange={(e) => set("statusId", e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="t-images">Images</Label>
        <input
          id="t-images"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          disabled={uploading}
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-sm file:border file:border-line file:bg-card file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-semibold file:uppercase file:tracking-wider file:text-ink-soft hover:file:border-accent hover:file:text-accent-ink"
        />
        {uploading && (
          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-fg">Uploading…</span>
        )}
        {files && files.length > 0 && !uploading && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-fg">
            {files.length} image(s) will be attached.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create ticket"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
