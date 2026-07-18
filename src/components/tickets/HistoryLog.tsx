"use client";

import { useEffect, useState } from "react";

export type HistoryEntry = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

export default function HistoryLog({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="spec">No changes yet.</p>;
  }
  return (
    <ul className="space-y-2.5 text-sm">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex flex-col gap-0.5 border-l-2 border-line pl-3"
        >
          <div className="text-ink-soft">
            <span className="font-medium text-ink">
              {e.user.name ?? e.user.email}
            </span>{" "}
            changed <span className="font-medium text-accent-ink">{e.field}</span>
          </div>
          <div className="font-mono text-[11px] text-muted-fg">
            {e.oldValue ?? "—"} → {e.newValue ?? "—"}
            <span className="ml-2">
              {new Date(e.createdAt).toLocaleString()}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
