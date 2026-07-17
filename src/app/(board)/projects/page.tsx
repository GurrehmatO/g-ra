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
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-6xl space-y-8 p-4">
        <h1 className="text-2xl font-semibold">Projects</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {me?.role === "ADMIN" && (
            <Card>
              <NewProjectForm />
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-lg font-medium">Your projects</h2>
            {memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You are not a member of any project yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {memberships.map((m) => (
                  <li key={m.project.id} className="py-3">
                    <Link
                      href={`/projects/${m.project.id}`}
                      className="flex items-center justify-between hover:text-primary"
                    >
                      <div>
                        <div className="font-medium">{m.project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {m.project.key} · {m.project._count.tickets} tickets ·{" "}
                          {m.project._count.members} members
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
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
