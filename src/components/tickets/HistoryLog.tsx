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
    return <p className="text-sm text-muted-foreground">No changes yet.</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {entries.map((e) => (
        <li key={e.id} className="flex flex-col gap-0.5">
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {e.user.name ?? e.user.email}
            </span>{" "}
            changed <span className="font-medium">{e.field}</span>
          </div>
          <div className="text-xs text-muted-foreground">
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
