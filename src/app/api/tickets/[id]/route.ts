import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordHistory } from "@/lib/history";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: z.enum(["STORY", "BUG"]).optional(),
  assigneeId: z.string().nullable().optional(),
  statusId: z.string().optional(),
  customValues: z
    .array(z.object({ customFieldId: z.string(), value: z.string().optional() }))
    .optional(),
});

async function loadTicket(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { customValues: true },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await loadTicket(params.id);
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: ticket.projectId, userId: session.user.id },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const full = await prisma.ticket.findUnique({
    where: { id: ticket.id },
    include: {
      status: true,
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      images: { orderBy: { createdAt: "asc" } },
      customValues: { include: { customField: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      history: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ ticket: full });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await loadTicket(params.id);
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: ticket.projectId, userId: session.user.id },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, type, assigneeId, statusId, customValues } =
    parsed.data;

  const changes: {
    field: string;
    oldValue?: string | null;
    newValue?: string | null;
  }[] = [];

  if (title !== undefined && title !== ticket.title) {
    changes.push({ field: "title", oldValue: ticket.title, newValue: title });
  }
  if (description !== undefined && description !== ticket.description) {
    changes.push({
      field: "description",
      oldValue: ticket.description ?? "",
      newValue: description ?? "",
    });
  }
  if (type !== undefined && type !== ticket.type) {
    changes.push({ field: "type", oldValue: ticket.type, newValue: type });
  }
  if (assigneeId !== undefined) {
    if (assigneeId && assigneeId !== ticket.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { name: true, email: true },
      });
      const oldAssignee = ticket.assigneeId
        ? await prisma.user.findUnique({
            where: { id: ticket.assigneeId },
            select: { name: true, email: true },
          })
        : null;
      changes.push({
        field: "assignee",
        oldValue: oldAssignee?.name ?? oldAssignee?.email ?? null,
        newValue: assignee?.name ?? assignee?.email ?? null,
      });
    } else if (assigneeId === null && ticket.assigneeId) {
      changes.push({ field: "assignee", oldValue: ticket.assigneeId, newValue: null });
    }
  }
  if (statusId !== undefined && statusId !== ticket.statusId) {
    const newStatus = await prisma.status.findUnique({
      where: { id: statusId },
      select: { name: true },
    });
    const oldStatus = await prisma.status.findUnique({
      where: { id: ticket.statusId },
      select: { name: true },
    });
    if (newStatus) {
      changes.push({
        field: "status",
        oldValue: oldStatus?.name ?? null,
        newValue: newStatus.name,
      });
    }
  }

  if (customValues) {
    const current = new Map(
      ticket.customValues.map((v) => [v.customFieldId, v])
    );
    for (const cv of customValues) {
      const existing = current.get(cv.customFieldId);
      const oldVal = existing?.value ?? null;
      if (String(oldVal ?? "") !== String(cv.value ?? "")) {
        const field = await prisma.customField.findUnique({
          where: { id: cv.customFieldId },
          select: { name: true },
        });
        changes.push({
          field: `field:${field?.name ?? cv.customFieldId}`,
          oldValue: oldVal,
          newValue: cv.value ?? null,
        });
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(statusId !== undefined ? { statusId } : {}),
      },
    });

    if (customValues) {
      for (const cv of customValues) {
        const existing = ticket.customValues.find(
          (v) => v.customFieldId === cv.customFieldId
        );
        if (existing) {
          if (cv.value) {
            await tx.ticketValue.update({
              where: { id: existing.id },
              data: { value: cv.value },
            });
          } else {
            await tx.ticketValue.delete({ where: { id: existing.id } });
          }
        } else if (cv.value) {
          await tx.ticketValue.create({
            data: {
              ticketId: ticket.id,
              customFieldId: cv.customFieldId,
              value: cv.value,
            },
          });
        }
      }
    }

    await recordHistory(ticket.id, session.user.id, changes);

    return tx.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        status: true,
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        customValues: { include: { customField: true } },
        _count: { select: { comments: true, images: true } },
      },
    });
  });

  return NextResponse.json({ ticket: updated });
}
