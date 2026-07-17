import { prisma } from "@/lib/prisma";

export type HistoryChange = {
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
};

/**
 * Record one or more field changes for a ticket. Used inside the same
 * transaction as the ticket update so history is always consistent.
 */
export async function recordHistory(
  ticketId: string,
  userId: string,
  changes: HistoryChange[]
) {
  const filtered = changes.filter(
    (c) => String(c.oldValue ?? "") !== String(c.newValue ?? "")
  );
  if (filtered.length === 0) return;

  await prisma.ticketHistory.createMany({
    data: filtered.map((c) => ({
      ticketId,
      userId,
      field: c.field,
      oldValue: c.oldValue ?? null,
      newValue: c.newValue ?? null,
    })),
  });
}
