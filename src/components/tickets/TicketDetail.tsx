"use client";

import { useEffect, useState } from "react";
import { Button, Select } from "@/components/ui/fields";
import CommentList, { CommentData } from "./CommentList";
import HistoryLog, { HistoryEntry } from "./HistoryLog";
import TicketForm, { CustomFieldDef, MemberOption } from "./TicketForm";

type TicketDetail = {
  id: string;
  code: string;
  type: "STORY" | "BUG";
  title: string;
  description: string | null;
  creator: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
  status: { id: string; name: string; color: string };
  images: { id: string; url: string; createdAt: string }[];
  customValues: {
    value: string | null;
    customField: { id: string; name: string; type: string };
  }[];
  comments: CommentData[];
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export default function TicketDetail({
  ticketId,
  members,
  customFields,
  statuses,
  onChanged,
}: {
  ticketId: string;
  members: MemberOption[];
  customFields: CustomFieldDef[];
  statuses: { id: string; name: string }[];
  onChanged: () => void;
}) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "history">(
    "details"
  );

  async function load() {
    const res = await fetch(`/api/tickets/${ticketId}`);
    const data = await res.json();
    setTicket(data.ticket);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function changeStatus(statusId: string) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId }),
    });
    if (res.ok) {
      load();
      onChanged();
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/tickets/${ticketId}/images`, {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (res.ok) {
      load();
    }
  }

  if (loading || !ticket) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const cvMap = new Map(ticket.customValues.map((cv) => [cv.customField.id, cv]));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{ticket.code}</div>
          <h3 className="mt-1 text-lg font-semibold">{ticket.title}</h3>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>

      {editing ? (
        <TicketForm
          projectId=""
          statuses={[]}
          members={members}
          customFields={customFields}
          draft={{
            id: ticket.id,
            type: ticket.type,
            title: ticket.title,
            description: ticket.description ?? "",
            assigneeId: ticket.assignee?.id ?? "",
            statusId: ticket.status.id,
            customValues: Object.fromEntries(
              ticket.customValues.map((cv) => [cv.customField.id, cv.value ?? ""])
            ),
          }}
          onSaved={() => {
            setEditing(false);
            load();
            onChanged();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status">
              <Select
                value={ticket.status.id}
                onChange={(e) => changeStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assignee">
              {ticket.assignee?.name ?? ticket.assignee?.email ?? "Unassigned"}
            </Field>
            <Field label="Creator">
              {ticket.creator.name ?? ticket.creator.email}
            </Field>
            <Field label="Created">{new Date(ticket.createdAt).toLocaleString()}</Field>
          </div>

          <Field label="Description">
            <p className="whitespace-pre-wrap text-sm">
              {ticket.description || "—"}
            </p>
          </Field>

          {customFields.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {customFields.map((cf) => (
                <Field key={cf.id} label={cf.name}>
                  {cvMap.get(cf.id)?.value ?? "—"}
                </Field>
              ))}
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center gap-3">
              <button
                className={tabCls(activeTab === "details")}
                onClick={() => setActiveTab("details")}
              >
                Images
              </button>
              <button
                className={tabCls(activeTab === "comments")}
                onClick={() => setActiveTab("comments")}
              >
                Comments ({ticket.comments.length})
              </button>
              <button
                className={tabCls(activeTab === "history")}
                onClick={() => setActiveTab("history")}
              >
                History
              </button>
            </div>

            {activeTab === "details" && (
              <div className="space-y-3">
                <label className="inline-block">
                  <span className="mb-1 block text-sm font-medium">Add image</span>
                  <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} />
                  {uploading && (
                    <span className="ml-2 text-xs text-muted-foreground">Uploading…</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ticket.images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.url}
                      alt="ticket attachment"
                      className="h-32 w-full rounded-md border border-border object-cover"
                    />
                  ))}
                  {ticket.images.length === 0 && (
                    <p className="text-sm text-muted-foreground">No images yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "comments" && (
              <CommentList
                ticketId={ticket.id}
                comments={ticket.comments}
                onAdded={load}
              />
            )}

            {activeTab === "history" && <HistoryLog entries={ticket.history} />}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function tabCls(active: boolean) {
  return `rounded-md px-3 py-1.5 text-sm ${
    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
  }`;
}
