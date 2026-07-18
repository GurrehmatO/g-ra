"use client";

import { forwardRef } from "react";
import { useDraggable, type DraggableAttributes } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type TicketCardData = {
  id: string;
  code: string;
  title: string;
  type: "STORY" | "BUG";
  assigneeName: string | null;
  commentCount: number;
  imageCount: number;
};

export default function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: TicketCardData;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: ticket.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <TicketCardView
      ref={setNodeRef}
      ticket={ticket}
      style={style}
      className="cursor-grab hover:border-ink-soft hover:-translate-y-0.5 active:cursor-grabbing"
      attributes={attributes}
      listeners={listeners}
      onClick={() => onOpen(ticket.id)}
    />
  );
}

export const TicketCardView = forwardRef<
  HTMLDivElement,
  {
    ticket: TicketCardData;
    style?: React.CSSProperties;
    className?: string;
    attributes?: DraggableAttributes;
    listeners?: Record<string, unknown>;
    onClick?: () => void;
  }
>(function TicketCardView(
  { ticket, style, className = "", attributes, listeners, onClick },
  ref
) {
  const isBug = ticket.type === "BUG";
  return (
    <div
      ref={ref}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-sm border border-line bg-card p-3 pl-4 text-sm shadow-sm transition-all ${className}`}
    >
      {/* marker spine */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${
          isBug ? "bg-bug" : "bg-blueprint"
        }`}
        aria-hidden
      />
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={`tag ${
            isBug
              ? "border-bug/40 bg-bug/10 text-bug"
              : "border-blueprint/40 bg-blueprint/10 text-blueprint-deep"
          }`}
        >
          {ticket.type}
        </span>
        <span className="font-mono text-[10px] tracking-wide text-muted-fg">
          {ticket.code}
        </span>
      </div>
      <div className="font-medium leading-snug text-ink">{ticket.title}</div>
      <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-muted-fg">
        <span className="truncate">{ticket.assigneeName ?? "Unassigned"}</span>
        <span className="flex shrink-0 gap-2">
          {ticket.commentCount > 0 && <span>✱ {ticket.commentCount}</span>}
          {ticket.imageCount > 0 && <span>▣ {ticket.imageCount}</span>}
        </span>
      </div>
    </div>
  );
});
