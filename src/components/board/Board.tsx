"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import Column from "./Column";
import { TicketCardData, TicketCardView } from "./TicketCard";
import FilterBar, { FilterState } from "./FilterBar";
import TicketForm, { CustomFieldDef, MemberOption, TicketDraft } from "@/components/tickets/TicketForm";
import TicketDetail from "@/components/tickets/TicketDetail";
import { Button } from "@/components/ui/fields";

export type BoardTicket = {
  id: string;
  code: string;
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
  const [activeTicket, setActiveTicket] = useState<TicketCardData | null>(null);

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

  function onDragStart(event: DragStartEvent) {
    const ticketId = String(event.active.id);
    const t = tickets.find((tk) => tk.id === ticketId);
    if (t) {
      setActiveTicket({
        id: t.id,
        code: t.code,
        title: t.title,
        type: t.type,
        assigneeName: t.assignee?.name ?? t.assignee?.email ?? null,
        commentCount: t._count.comments,
        imageCount: t._count.images,
      });
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = String(active.id);
    const overId = String(over.id);
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const overTicket = tickets.find((t) => t.id === overId);
    const overStatusId = overTicket ? overTicket.statusId : overId;
    const isSameColumn = ticket.statusId === overStatusId;

    if (isSameColumn) {
      if (overTicket && ticketId === overId) return;

      const columnTickets = tickets.filter(
        (t) => t.statusId === ticket.statusId && t.id !== ticketId
      );
      let targetIdx = overTicket
        ? columnTickets.findIndex((t) => t.id === overId)
        : columnTickets.length;
      if (overTicket) {
        const origIdx = tickets.findIndex((t) => t.id === ticketId);
        const overOrigIdx = tickets.findIndex((t) => t.id === overId);
        if (origIdx < overOrigIdx) targetIdx += 1;
      }
      columnTickets.splice(targetIdx, 0, ticket);

      const prev = tickets;
      const reordered = tickets
        .filter((t) => t.statusId !== ticket.statusId)
        .concat(columnTickets);
      setTickets(reordered);

      const items = columnTickets.map((t, i) => ({ id: t.id, position: i }));
      const res = await fetch("/api/tickets/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, items }),
      });
      if (!res.ok) setTickets(prev);
    } else {
      const newColumnTickets = tickets
        .filter((t) => t.statusId === overStatusId && t.id !== ticketId);
      const targetIdx = overTicket
        ? newColumnTickets.findIndex((t) => t.id === overId)
        : newColumnTickets.length;
      newColumnTickets.splice(targetIdx, 0, { ...ticket, statusId: overStatusId });

      const prev = tickets;
      const reordered = tickets
        .filter((t) => t.statusId !== overStatusId && t.id !== ticketId)
        .concat(newColumnTickets);
      setTickets(reordered);

      const items = newColumnTickets.map((t, i) => ({ id: t.id, position: i }));
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: overStatusId }),
      });
      if (res.ok) {
        await fetch("/api/tickets/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, items }),
        });
      } else {
        setTickets(prev);
      }
    }
  }

  function ticketsFor(statusId: string) {
    return tickets
      .filter((t) => t.statusId === statusId)
      .map((t) => ({
        id: t.id,
        code: t.code,
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
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 bg-accent" aria-hidden />
          <h2 className="font-display text-base font-bold text-ink">Board</h2>
          <span className="spec">{tickets.length} tickets</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar members={members} value={filters} onChange={setFilters} />
          <Button onClick={() => setShowForm(true)}>+ New ticket</Button>
        </div>
      </div>

      {loading ? (
        <p className="spec animate-pulse">Loading board…</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {statuses.map((s, i) => (
                <div
                  key={s.id}
                  className="animate-card-in shrink-0"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                <Column
                  statusId={s.id}
                  name={s.name}
                  color={s.color}
                  tickets={ticketsFor(s.id)}
                  onOpen={setOpenTicketId}
                />
                </div>
              ))}
            </div>
          <DragOverlay>
            {activeTicket ? (
              <TicketCardView
                ticket={activeTicket}
                className="cursor-grabbing rotate-2 shadow-drag ring-2 ring-accent"
              />
            ) : null}
          </DragOverlay>
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl animate-pop-in rounded-md border border-line bg-card p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 bg-accent" aria-hidden />
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-line font-mono text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
          >
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
