"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type TicketCardData = {
  id: string;
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(ticket.id)}
      className="cursor-grab rounded-md border border-border bg-white p-3 text-sm shadow-sm hover:border-ring active:cursor-grabbing"
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className={
            ticket.type === "BUG"
              ? "rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive"
              : "rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
          }
        >
          {ticket.type}
        </span>
      </div>
      <div className="font-medium text-foreground">{ticket.title}</div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{ticket.assigneeName ?? "Unassigned"}</span>
        <span>
          {ticket.commentCount > 0 && `💬 ${ticket.commentCount}`}{" "}
          {ticket.imageCount > 0 && `🖼 ${ticket.imageCount}`}
        </span>
      </div>
    </div>
  );
}
