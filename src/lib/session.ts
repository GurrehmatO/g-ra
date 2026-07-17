import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

export async function isProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return Boolean(member);
}

export async function requireProjectMember(projectId: string) {
  const user = await requireUser();
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!member) redirect(`/projects`);
  return { user, membership: member };
}

export async function isProjectAdmin(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return member?.role === "ADMIN";
}

export type SessionUser = {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
};
