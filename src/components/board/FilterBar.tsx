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
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Assignee
        </label>
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
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          From
        </label>
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="flex h-10 rounded-md border border-border bg-white px-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          To
        </label>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="flex h-10 rounded-md border border-border bg-white px-3 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={() => onChange({ assigneeId: "", from: "", to: "" })}
        className="h-10 rounded-md border border-border px-3 text-sm hover:bg-muted"
      >
        Clear
      </button>
    </div>
  );
}
