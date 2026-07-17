import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const projectSchema = z.object({
  name: z.string().min(1).max(120),
  key: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Za-z0-9_-]+$/, "Key must be alphanumeric"),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        include: {
          _count: { select: { tickets: true, members: true } },
          statuses: { orderBy: { position: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects: memberships.map((m) => m.project) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can create projects" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, key, description } = parsed.data;

  const existing = await prisma.project.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json(
      { error: "A project with that key already exists" },
      { status: 409 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      key,
      description,
      createdById: session.user.id,
      members: {
        create: { userId: session.user.id, role: "ADMIN" },
      },
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
