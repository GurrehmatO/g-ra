"use client";

import { forwardRef, useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import type { DraggableAttributes } from "@dnd-kit/core";
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

const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isTouch;
};

export default function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: TicketCardData;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id });
  const isTouch = useIsTouchDevice();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isBug = ticket.type === "BUG";

  const cardProps = isTouch
    ? {}
    : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...cardProps}
      onClick={() => onOpen(ticket.id)}
      className={`group relative overflow-hidden rounded-sm border border-line bg-card py-2.5 text-sm shadow-sm transition-all ${
        isTouch ? "cursor-pointer pl-8 pr-4" : "cursor-grab active:cursor-grabbing pl-4 pr-4"
      } ${isDragging ? "" : "hover:border-ink-soft hover:-translate-y-0.5"}`}
    >
      {isTouch && (
        <div className="absolute inset-y-0 left-0 flex w-6 items-center justify-center touch-none">
          <span
            {...attributes}
            {...listeners}
            className="flex h-full w-full items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <span className="text-muted-fg text-xs leading-none">⠿</span>
          </span>
        </div>
      )}
      {!isTouch && (
        <span
          className={`absolute inset-y-0 left-0 w-1 ${
            isBug ? "bg-bug" : "bg-blueprint"
          }`}
          aria-hidden
        />
      )}
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
  { ticket, style, className = "", onClick },
  ref
) {
  const isBug = ticket.type === "BUG";
  return (
    <div
      ref={ref}
      style={style}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-sm border border-line bg-card p-3 pl-4 text-sm shadow-sm transition-all ${className}`}
    >
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
