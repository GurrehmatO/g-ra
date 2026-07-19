import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { isProjectAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import MembersPanel from "@/components/projects/MembersPanel";

export default async function ProjectMembersPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const admin = await isProjectAdmin(params.id, user.id);
  if (!admin) redirect(`/projects/${params.id}`);

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!project) notFound();

  const memberIds = project.members.map((m) => m.user.id);

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { email: "asc" },
  });

  const availableUsers = allUsers.filter((u) => !memberIds.includes(u.id));

  const members = project.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
  }));

  return (
    <div className="min-h-screen md:pl-16">
      <TopNav user={user} />
      <main className="mx-auto max-w-3xl p-4">
        <header className="mb-6 flex items-center gap-3 border-b-2 border-ink pb-3">
          <span className="h-8 w-1.5 bg-accent" aria-hidden />
          <div>
            <span className="spec">{project.key}</span>
            <h1 className="font-display text-2xl font-bold leading-none text-ink">
              Members · {project.name}
            </h1>
          </div>
        </header>
        <MembersPanel projectId={project.id} members={members} availableUsers={availableUsers} />
      </main>
    </div>
  );
}
