"use client";

import { Select } from "@/components/ui/fields";

export type FilterState = {
  assigneeId: string;
  from: string;
  to: string;
};

export default function FilterBar({
  members,
  value,
  onChange,
}: {
  members: { id: string; name: string | null; email: string }[];
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="spec mb-1 block font-semibold">Assignee</label>
        <Select
          value={value.assigneeId}
          onChange={(e) => onChange({ ...value, assigneeId: e.target.value })}
        >
          <option value="">All</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name ?? m.email}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="spec mb-1 block font-semibold">From</label>
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="flex h-10 rounded-sm border border-line bg-card px-3 text-sm text-ink outline-none hover:border-line-strong focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label className="spec mb-1 block font-semibold">To</label>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="flex h-10 rounded-sm border border-line bg-card px-3 text-sm text-ink outline-none hover:border-line-strong focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>
      <button
        type="button"
        onClick={() => onChange({ assigneeId: "", from: "", to: "" })}
        className="h-10 rounded-sm border border-line px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
      >
        Clear
      </button>
    </div>
  );
}
