import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import NewUserForm from "@/components/users/NewUserForm";
import ResetPasswordButton from "@/components/users/ResetPasswordButton";
import { Card } from "@/components/ui/fields";

export default async function UsersPage() {
  const user = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return (
    <div className="min-h-screen md:pl-16">
      <TopNav user={user} />
      <main className="mx-auto max-w-5xl space-y-8 p-4">
        <header className="flex items-center gap-3 border-b-2 border-ink pb-3">
          <span className="h-8 w-1.5 bg-accent" aria-hidden />
          <div>
            <span className="spec">Admin</span>
            <h1 className="font-display text-3xl font-bold leading-none text-ink">
              User management
            </h1>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <NewUserForm />
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-line pb-2">
              <span className="h-4 w-1 bg-blueprint" aria-hidden />
              <h2 className="font-display text-lg font-bold text-ink">
                Existing users
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <div className="font-medium text-ink">{u.name ?? u.email}</div>
                    <div className="font-mono text-xs text-muted-fg">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        u.role === "ADMIN"
                          ? "tag border-accent/40 bg-accent/10 text-accent-ink"
                          : "tag border-line bg-paper text-muted-fg"
                      }
                    >
                      {u.role}
                    </span>
                    <ResetPasswordButton
                      userId={u.id}
                      userName={u.name ?? u.email}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
