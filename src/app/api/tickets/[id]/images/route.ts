import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const USE_LOCAL = process.env.USE_LOCAL_STORAGE === "1";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: { projectId: true },
  });
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

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  let url: string;

  if (USE_LOCAL) {
    const dir = path.join(process.cwd(), "public", "uploads", ticket.projectId, params.id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), bytes);
    url = `/uploads/${ticket.projectId}/${params.id}/${fileName}`;
  } else {
    const supabase = getSupabaseAdmin();
    const supabasePath = `${ticket.projectId}/${params.id}/${fileName}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(supabasePath, bytes, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(supabasePath);
    url = publicUrl;
  }

  const image = await prisma.ticketImage.create({
    data: { ticketId: params.id, url },
  });

  return NextResponse.json({ image }, { status: 201 });
}
