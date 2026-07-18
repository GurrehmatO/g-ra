import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { signOut } from "@/lib/auth";

export async function TopNav() {
  const user = await getCurrentUser();
  const initials = (user?.name ?? user?.email ?? "G")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <>
      {/* Spine rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center justify-between border-r border-line bg-paper-2 py-4 md:flex">
        <Link
          href="/projects"
          aria-label="G-ra home"
          className="flex h-11 w-11 rotate-[-8deg] items-center justify-center rounded-md border-2 border-ink bg-accent font-display text-lg font-bold text-paper shadow-[2px_2px_0_hsl(222_38%_14%)] transition-transform hover:rotate-0"
        >
          G
        </Link>

        <div className="ruler flex-1 w-px mx-auto" aria-hidden />

        <nav className="flex flex-col items-center gap-3">
          {user?.role === "ADMIN" && (
            <Link
              href="/users"
              title="Users"
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-line bg-card font-mono text-[10px] font-bold uppercase text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
            >
              US
            </Link>
          )}
          <Link
            href="/projects"
            title="Projects"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line bg-card font-mono text-[10px] font-bold uppercase text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
          >
            PR
          </Link>
        </nav>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-sm md:pl-16">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/projects" className="flex items-baseline gap-2 md:hidden">
            <span className="font-display text-lg font-bold text-ink">G-ra</span>
          </Link>
          <div className="hidden md:block">
            <span className="spec">Engineering board</span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink bg-ink font-mono text-[10px] font-bold text-paper">
                  {initials || "G"}
                </span>
                <span className="hidden text-sm font-medium text-ink-soft sm:block">
                  {user.name ?? user.email}
                </span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button className="rounded-sm border border-line px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:border-accent hover:text-accent-ink">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
