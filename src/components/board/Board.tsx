"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import Column from "./Column";
import FilterBar, { FilterState } from "./FilterBar";
import TicketForm, { CustomFieldDef, MemberOption, TicketDraft } from "@/components/tickets/TicketForm";
import TicketDetail from "@/components/tickets/TicketDetail";
import { Button } from "@/components/ui/fields";

export type BoardTicket = {
  id: string;
  title: string;
  type: "STORY" | "BUG";
  statusId: string;
  assignee: { id: string; name: string | null; email: string } | null;
  _count: { comments: number; images: number };
};

export type StatusDef = { id: string; name: string; color: string };

export default function Board({
  projectId,
  statuses,
  members,
  customFields,
}: {
  projectId: string;
  statuses: StatusDef[];
  members: MemberOption[];
  customFields: CustomFieldDef[];
}) {
  const [tickets, setTickets] = useState<BoardTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    assigneeId: "",
    from: "",
    to: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ projectId });
    if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const res = await fetch(`/api/tickets?${params.toString()}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setLoading(false);
  }, [projectId, filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const ticketId = String(active.id);
    const newStatusId = String(over.id);
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.statusId === newStatusId) return;

    const prev = tickets;
    setTickets((ts) =>
      ts.map((t) => (t.id === ticketId ? { ...t, statusId: newStatusId } : t))
    );

    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId: newStatusId }),
    });
    if (!res.ok) {
      setTickets(prev);
    }
  }

  function ticketsFor(statusId: string) {
    return tickets
      .filter((t) => t.statusId === statusId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        assigneeName: t.assignee?.name ?? t.assignee?.email ?? null,
        commentCount: t._count.comments,
        imageCount: t._count.images,
      }));
  }

  const draft: TicketDraft = {
    type: "STORY",
    title: "",
    description: "",
    assigneeId: "",
    statusId: statuses[0]?.id ?? "",
    customValues: {},
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar members={members} value={filters} onChange={setFilters} />
        <Button onClick={() => setShowForm(true)}>New ticket</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading board…</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((s) => (
              <Column
                key={s.id}
                statusId={s.id}
                name={s.name}
                color={s.color}
                tickets={ticketsFor(s.id)}
                onOpen={setOpenTicketId}
              />
            ))}
          </div>
        </DndContext>
      )}

      {showForm && (
        <Dialog onClose={() => setShowForm(false)} title="New ticket">
          <TicketForm
            projectId={projectId}
            statuses={statuses}
            members={members}
            customFields={customFields}
            draft={draft}
            onSaved={() => {
              setShowForm(false);
              load();
            }}
            onCancel={() => setShowForm(false)}
          />
        </Dialog>
      )}

      {openTicketId && (
        <TicketDetailDialog
          ticketId={openTicketId}
          members={members}
          customFields={customFields}
          statuses={statuses}
          onClose={() => setOpenTicketId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-lg border border-border bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TicketDetailDialog({
  ticketId,
  members,
  customFields,
  statuses,
  onClose,
  onChanged,
}: {
  ticketId: string;
  members: MemberOption[];
  customFields: CustomFieldDef[];
  statuses: StatusDef[];
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <Dialog title="Ticket" onClose={onClose}>
      <TicketDetail
        ticketId={ticketId}
        members={members}
        customFields={customFields}
        statuses={statuses}
        onChanged={onChanged}
      />
    </Dialog>
  );
}
