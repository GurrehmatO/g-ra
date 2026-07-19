"use client";

import { useEffect, useState } from "react";
import { Button, Select } from "@/components/ui/fields";
import ImageViewer from "@/components/ui/ImageViewer";
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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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
    return <p className="spec animate-pulse">Loading…</p>;
  }

  const cvMap = new Map(ticket.customValues.map((cv) => [cv.customField.id, cv]));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
            {ticket.code}
          </div>
          <h3 className="mt-1.5 font-display text-2xl font-bold leading-tight text-ink">
            {ticket.title}
          </h3>
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
            <div className="mb-4 flex items-center gap-1 border-b border-line">
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-sm file:border file:border-line file:bg-card file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-semibold file:uppercase file:tracking-wider file:text-ink-soft hover:file:border-accent hover:file:text-accent-ink"
                  />
                  {uploading && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-fg">Uploading…</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ticket.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.url}
                      alt="ticket attachment"
                      className="h-32 w-full cursor-pointer rounded-sm border border-line object-cover transition-opacity hover:opacity-80"
                      onClick={() => setViewerIndex(i)}
                    />
                  ))}
                  {ticket.images.length === 0 && (
                    <p className="spec">No images yet.</p>
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

      {viewerIndex !== null && ticket && (
        <ImageViewer
          images={ticket.images}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="spec mb-1 font-semibold text-ink-soft">{label}</div>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

function tabCls(active: boolean) {
  return `relative -mb-px border-b-2 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
    active
      ? "border-accent text-accent-ink"
      : "border-transparent text-muted-fg hover:text-ink-soft"
  }`;
}
