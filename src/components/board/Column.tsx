"use client";

import { useDroppable } from "@dnd-kit/core";
import TicketCard, { TicketCardData } from "./TicketCard";

export default function Column({
  statusId,
  name,
  color,
  tickets,
  onOpen,
}: {
  statusId: string;
  name: string;
  color: string;
  tickets: TicketCardData[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statusId });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium">{name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{tickets.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-2 ${
          isOver ? "bg-primary/5" : ""
        }`}
        style={{ minHeight: 120 }}
      >
        {tickets.map((t) => (
          <TicketCard key={t.id} ticket={t} onOpen={onOpen} />
        ))}
        {tickets.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            No tickets
          </p>
        )}
      </div>
    </div>
  );
}
