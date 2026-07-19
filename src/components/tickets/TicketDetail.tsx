"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Input, Select, Textarea } from "@/components/ui/fields";
import ImageViewer from "@/components/ui/ImageViewer";
import CommentList, { CommentData } from "./CommentList";
import HistoryLog, { HistoryEntry } from "./HistoryLog";
import { CustomFieldDef, MemberOption } from "./TicketForm";

export type TicketListData = {
  id: string;
  code: string;
  type: "STORY" | "BUG";
  title: string;
  description: string | null;
  creator: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
  status: { id: string; name: string; color: string };
  createdAt: string;
  customValues: {
    value: string | null;
    customField: { id: string; name: string; type: string };
  }[];
  _count?: { comments: number; images: number };
};

type TicketDetailData = TicketListData & {
  images: { id: string; url: string; createdAt: string }[];
  comments: CommentData[];
  history: HistoryEntry[];
  updatedAt: string;
};

type FormState = {
  type: "STORY" | "BUG";
  title: string;
  description: string;
  assigneeId: string;
  statusId: string;
  customValues: Record<string, string>;
};

function buildInitial(ticket: TicketListData): FormState {
  return {
    type: ticket.type,
    title: ticket.title,
    description: ticket.description ?? "",
    assigneeId: ticket.assignee?.id ?? "",
    statusId: ticket.status.id,
    customValues: Object.fromEntries(
      ticket.customValues.map((cv) => [cv.customField.id, cv.value ?? ""])
    ),
  };
}

function hasChanges(initial: FormState, current: FormState): boolean {
  return (
    initial.type !== current.type ||
    initial.title !== current.title ||
    initial.description !== current.description ||
    initial.assigneeId !== current.assigneeId ||
    initial.statusId !== current.statusId ||
    JSON.stringify(initial.customValues) !== JSON.stringify(current.customValues)
  );
}

export interface TicketDetailHandle {
  handleClose: () => Promise<boolean>;
}

const TicketDetail = forwardRef<TicketDetailHandle, {
  ticketId: string;
  initialData: TicketListData | null;
  members: MemberOption[];
  customFields: CustomFieldDef[];
  statuses: { id: string; name: string }[];
  onChanged: () => void;
  onClose?: () => void;
}>(function TicketDetail(
  { ticketId, initialData, members, customFields, statuses, onChanged, onClose },
  ref
) {
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "history">(
    "details"
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [initial, setInitial] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState>({
    type: "STORY",
    title: "",
    description: "",
    assigneeId: "",
    statusId: "",
    customValues: {},
  });

  const ticketRef = useRef<TicketDetailData | null>(null);
  const initialRef = useRef<FormState | null>(null);
  const formRef = useRef<FormState>(form);

  // Populate instantly from list data, then fetch full detail in background
  useEffect(() => {
    if (initialData) {
      // Merge list data into a partial TicketDetailData so the form is instant
      const partial: TicketDetailData = {
        ...initialData,
        images: [],
        comments: [],
        history: [],
        updatedAt: "",
      };
      ticketRef.current = partial;
      setTicket(partial);
      const initState = buildInitial(initialData);
      initialRef.current = initState;
      setInitial(initState);
      formRef.current = initState;
      setForm(initState);
    }

    // Fetch full detail in background for images, comments, history
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (cancelled) return;
      const data = await res.json();
      const full: TicketDetailData = data.ticket;
      ticketRef.current = full;
      setTicket(full);
      setDetailLoading(false);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const save = useCallback(async (): Promise<boolean> => {
    const curInitial = initialRef.current;
    const curForm = formRef.current;
    const curTicket = ticketRef.current;
    if (!curInitial || !curTicket) return true;
    if (!hasChanges(curInitial, curForm)) return true;

    setSaving(true);
    try {
      const payload = {
        type: curForm.type,
        title: curForm.title,
        description: curForm.description,
        assigneeId: curForm.assigneeId || undefined,
        statusId: curForm.statusId || undefined,
        customValues: Object.entries(curForm.customValues)
          .filter(([, v]) => v)
          .map(([customFieldId, value]) => ({ customFieldId, value })),
      };

      const res = await fetch(`/api/tickets/${curTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Reload full detail after save
        const detailRes = await fetch(`/api/tickets/${curTicket.id}`);
        const detailData = await detailRes.json();
        const updated: TicketDetailData = detailData.ticket;
        ticketRef.current = updated;
        setTicket(updated);
        const initState = buildInitial(updated);
        initialRef.current = initState;
        setInitial(initState);
        formRef.current = initState;
        setForm(initState);
        onChanged();
        return true;
      }
      return false;
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(async (): Promise<boolean> => {
    if (saving) return false;
    const ok = await save();
    if (ok && onClose) onClose();
    return ok;
  }, [save, onClose, saving]);

  useImperativeHandle(ref, () => ({ handleClose }), [handleClose]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !ticket) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/tickets/${ticket.id}/images`, {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (res.ok) {
      // Reload detail after upload
      const detailRes = await fetch(`/api/tickets/${ticket.id}`);
      const detailData = await detailRes.json();
      const updated: TicketDetailData = detailData.ticket;
      ticketRef.current = updated;
      setTicket(updated);
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      formRef.current = next;
      return next;
    });
  }

  if (!ticket) {
    return <p className="spec animate-pulse">Loading…</p>;
  }

  const isDirty = initial ? hasChanges(initial, form) : false;
  const commentCount = ticket.comments.length || (ticket._count?.comments ?? 0);
  const imageCount = ticket.images.length || (ticket._count?.images ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
        <div className="flex-1">
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
            {ticket.code}
          </div>
          <h3 className="mt-1.5">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="font-display text-2xl font-bold leading-tight border-0 border-b border-transparent focus:border-accent rounded-none px-0"
            />
          </h3>
        </div>
        {isDirty && (
          <span className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-fg">
            Updated
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type">
          <Select
            value={form.type}
            onChange={(e) => set("type", e.target.value as "STORY" | "BUG")}
          >
            <option value="STORY">Story</option>
            <option value="BUG">Bug</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={form.statusId}
            onChange={(e) => set("statusId", e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assignee">
          <Select
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
        </Field>
        <Field label="Creator">
          {ticket.creator.name ?? ticket.creator.email}
        </Field>
        <Field label="Created">{new Date(ticket.createdAt).toLocaleString()}</Field>
      </div>

      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="border-0 border-line rounded-none px-0 focus:ring-0"
        />
      </Field>

      {customFields.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {customFields.map((cf) => {
            const value = form.customValues[cf.id] ?? "";
            return (
              <Field key={cf.id} label={cf.name}>
                {cf.type === "SELECT" ? (
                  <Select
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
                    type={
                      cf.type === "NUMBER"
                        ? "number"
                        : cf.type === "DATE"
                          ? "date"
                          : "text"
                    }
                    value={value}
                    onChange={(e) =>
                      set("customValues", {
                        ...form.customValues,
                        [cf.id]: e.target.value,
                      })
                    }
                  />
                )}
              </Field>
            );
          })}
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
            Comments ({commentCount})
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
              {detailLoading && ticket.images.length === 0 ? (
                <p className="spec animate-pulse">Loading images…</p>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          detailLoading ? (
            <p className="spec animate-pulse">Loading comments…</p>
          ) : (
            <CommentList
              ticketId={ticket.id}
              comments={ticket.comments}
              onAdded={async () => {
                const res = await fetch(`/api/tickets/${ticket.id}`);
                const data = await res.json();
                const updated: TicketDetailData = data.ticket;
                ticketRef.current = updated;
                setTicket(updated);
              }}
            />
          )
        )}

        {activeTab === "history" && (
          detailLoading ? (
            <p className="spec animate-pulse">Loading history…</p>
          ) : (
            <HistoryLog entries={ticket.history} />
          )
        )}
      </div>

      {viewerIndex !== null && ticket && (
        <ImageViewer
          images={ticket.images}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
});

export default TicketDetail;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="spec mb-1 font-semibold text-ink-soft">{label}</div>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

function tabCls(active: boolean) {
  return `relative -mb-px border-b-2 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${active
      ? "border-accent text-accent-ink"
      : "border-transparent text-muted-fg hover:text-ink-soft"
    }`;
}
