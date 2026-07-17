import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

async function memberGuard(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return member;
}

const statusSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(60),
  color: z.string().max(20).default("#64748b"),
});

const customFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(60),
  type: z.enum(["TEXT", "NUMBER", "SELECT", "DATE"]),
  options: z.string().optional(),
});

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  statuses: z.array(statusSchema).optional(),
  customFields: z.array(customFieldSchema).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await memberGuard(params.id, session.user.id);
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      statuses: { orderBy: { position: "asc" } },
      customFields: { orderBy: { position: "asc" } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await memberGuard(params.id, session.user.id);
  if (!member || member.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only project admins can update settings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, statuses, customFields } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    if (name !== undefined || description !== undefined) {
      await tx.project.update({
        where: { id: params.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      });
    }

    if (statuses) {
      const existing = await tx.status.findMany({
        where: { projectId: params.id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((s) => s.id));
      const incomingIds = new Set(
        statuses.filter((s) => s.id).map((s) => s.id as string)
      );

      for (const s of existing) {
        if (!incomingIds.has(s.id)) {
          await tx.status.delete({ where: { id: s.id } });
        }
      }

      for (let i = 0; i < statuses.length; i++) {
        const s = statuses[i];
        if (s.id && existingIds.has(s.id)) {
          await tx.status.update({
            where: { id: s.id },
            data: { name: s.name, color: s.color, position: i },
          });
        } else {
          await tx.status.create({
            data: {
              projectId: params.id,
              name: s.name,
              color: s.color,
              position: i,
            },
          });
        }
      }
    }

    if (customFields) {
      const existing = await tx.customField.findMany({
        where: { projectId: params.id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((f) => f.id));
      const incomingIds = new Set(
        customFields.filter((f) => f.id).map((f) => f.id as string)
      );

      for (const f of existing) {
        if (!incomingIds.has(f.id)) {
          await tx.customField.delete({ where: { id: f.id } });
        }
      }

      for (let i = 0; i < customFields.length; i++) {
        const f = customFields[i];
        if (f.id && existingIds.has(f.id)) {
          await tx.customField.update({
            where: { id: f.id },
            data: { name: f.name, type: f.type, options: f.options, position: i },
          });
        } else {
          await tx.customField.create({
            data: {
              projectId: params.id,
              name: f.name,
              type: f.type,
              options: f.options,
              position: i,
            },
          });
        }
      }
    }

    return tx.project.findUnique({
      where: { id: params.id },
      include: {
        statuses: { orderBy: { position: "asc" } },
        customFields: { orderBy: { position: "asc" } },
      },
    });
  });

  return NextResponse.json({ project: result });
}
