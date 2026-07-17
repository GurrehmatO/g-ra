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

  const members = project.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
  }));

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="mb-6 text-2xl font-semibold">Members · {project.name}</h1>
        <MembersPanel projectId={project.id} members={members} />
      </main>
    </div>
  );
}
