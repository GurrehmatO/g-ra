"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TicketCard, { TicketCardData } from "./TicketCard";

export default function Column({
  statusId,
  name,
  color,
  tickets,
  onOpen,
  loading,
}: {
  statusId: string;
  name: string;
  color: string;
  tickets: TicketCardData[];
  onOpen: (id: string) => void;
  loading?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statusId });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-md border border-line bg-paper-2/70">
      <div className="flex items-center justify-between border-b border-line bg-card px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rotate-45 border border-line-strong"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {name}
          </span>
        </div>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-sm border border-line bg-paper px-1.5 font-mono text-[10px] font-bold text-muted-fg">
          {tickets.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2.5 overflow-y-auto p-2.5 transition-colors ${
          isOver ? "bg-accent/10 ring-1 ring-inset ring-accent/40" : ""
        }`}
        style={{ minHeight: 120 }}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} onOpen={onOpen} />
          ))}
        </SortableContext>
        {loading && tickets.length === 0 && (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-md border border-line bg-card p-3"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-2 h-3 w-16 rounded bg-line" />
                <div className="mb-2 h-4 w-3/4 rounded bg-line" />
                <div className="flex gap-2">
                  <div className="h-3 w-12 rounded bg-line" />
                  <div className="h-3 w-8 rounded bg-line" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && tickets.length === 0 && (
          <p className="px-1 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-fg">
            No tickets
          </p>
        )}
      </div>
    </div>
  );
}
