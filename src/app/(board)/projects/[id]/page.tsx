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
    <div className="min-h-screen md:pl-16">
      <TopNav user={user} />
      <div className="border-b-2 border-ink bg-paper-2">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-3 px-4 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-ink">
                {project.key}
              </span>
              <span className="h-3 w-px bg-line-strong" />
              <span className="spec">Project</span>
            </div>
            <h1 className="font-display text-2xl font-bold leading-none text-ink">
              {project.name}
            </h1>
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
