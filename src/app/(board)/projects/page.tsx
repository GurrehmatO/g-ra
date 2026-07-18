import Link from "next/link";
import { requireUser, getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import NewProjectForm from "@/components/projects/NewProjectForm";
import { Card } from "@/components/ui/fields";

export default async function ProjectsPage() {
  const user = await requireUser();
  const me = await getCurrentUser();

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
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

  return (
    <div className="min-h-screen md:pl-16">
      <TopNav />
      <main className="mx-auto max-w-6xl space-y-8 p-4">
        <header className="flex items-center gap-3 border-b-2 border-ink pb-3">
          <span className="h-8 w-1.5 bg-accent" aria-hidden />
          <div>
            <span className="spec">Workspace</span>
            <h1 className="font-display text-3xl font-bold leading-none text-ink">
              Projects
            </h1>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {me?.role === "ADMIN" && (
            <Card>
              <NewProjectForm />
            </Card>
          )}

          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-line pb-2">
              <span className="h-4 w-1 bg-blueprint" aria-hidden />
              <h2 className="font-display text-lg font-bold text-ink">
                Your projects
              </h2>
            </div>
            {memberships.length === 0 ? (
              <p className="text-sm text-muted-fg">
                You are not a member of any project yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {memberships.map((m) => (
                  <li key={m.project.id} className="py-3">
                    <Link
                      href={`/projects/${m.project.id}`}
                      className="group flex items-center justify-between transition-colors hover:text-accent-ink"
                    >
                      <div>
                        <div className="font-medium text-ink group-hover:underline">
                          {m.project.name}
                        </div>
                        <div className="font-mono text-xs text-muted-fg">
                          {m.project.key} · {m.project._count.tickets} tickets ·{" "}
                          {m.project._count.members} members
                        </div>
                      </div>
                      <span className="tag border-line bg-paper text-muted-fg">
                        {m.role}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
