import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { signOut } from "@/lib/auth";

export async function TopNav() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-lg font-semibold">
            G-ra
          </Link>
        </div>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {user.name ?? user.email}
            </span>
            {user.role === "ADMIN" && (
              <Link
                href="/users"
                className="rounded-md border border-border px-2 py-1 hover:bg-muted"
              >
                Users
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-md border border-border px-2 py-1 hover:bg-muted">
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
