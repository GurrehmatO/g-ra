import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import Board from "@/components/board/Board";
import ProjectSettings from "@/components/projects/ProjectSettings";
import MembersPanel from "@/components/projects/MembersPanel";
import { Button } from "@/components/ui/fields";

export default async function ProjectBoardPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: user.id } },
  });
  if (!membership) redirect("/projects");

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
  if (!project) notFound();

  const members = project.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  const customFields = project.customFields.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    options: f.options,
  }));

  const statuses = project.statuses.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.key}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${project.id}/settings`}>
              <Button variant="secondary">Settings</Button>
            </Link>
            <Link href={`/projects/${project.id}/members`}>
              <Button variant="secondary">Members</Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl p-4">
        <Board
          projectId={project.id}
          statuses={statuses}
          members={members}
          customFields={customFields}
        />
      </main>
    </div>
  );
}
