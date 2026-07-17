import { requireAdmin, getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import NewUserForm from "@/components/users/NewUserForm";
import { Card } from "@/components/ui/fields";

export default async function UsersPage() {
  await requireAdmin();
  const current = await getCurrentUser();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl space-y-8 p-4">
        <h1 className="text-2xl font-semibold">User management</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <NewUserForm />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-medium">Existing users</h2>
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{u.name ?? u.email}</div>
                    <div className="text-muted-foreground">{u.email}</div>
                  </div>
                  <span
                    className={
                      u.role === "ADMIN"
                        ? "rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground"
                        : "rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    }
                  >
                    {u.role}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
