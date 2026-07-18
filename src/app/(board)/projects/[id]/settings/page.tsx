import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { isProjectAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import ProjectSettings from "@/components/projects/ProjectSettings";

export default async function ProjectSettingsPage({
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
      statuses: { orderBy: { position: "asc" } },
      customFields: { orderBy: { position: "asc" } },
    },
  });
  if (!project) notFound();

  return (
    <div className="min-h-screen md:pl-16">
      <TopNav />
      <main className="mx-auto max-w-3xl p-4">
        <header className="mb-6 flex items-center gap-3 border-b-2 border-ink pb-3">
          <span className="h-8 w-1.5 bg-accent" aria-hidden />
          <div>
            <span className="spec">{project.key}</span>
            <h1 className="font-display text-2xl font-bold leading-none text-ink">
              Settings · {project.name}
            </h1>
          </div>
        </header>
        <ProjectSettings
          projectId={project.id}
          initialName={project.name}
          initialDescription={project.description}
          initialStatuses={project.statuses.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
          }))}
          initialFields={project.customFields.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            options: f.options ?? undefined,
          }))}
        />
      </main>
    </div>
  );
}
