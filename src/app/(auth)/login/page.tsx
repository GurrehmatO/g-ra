import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen md:pl-16">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r-2 border-ink bg-paper-2 p-10 lg:flex">
        <div className="ruler pointer-events-none absolute inset-y-0 right-0 w-px" aria-hidden />
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 rotate-[-8deg] items-center justify-center rounded-md border-2 border-ink bg-accent font-display text-2xl font-bold text-paper shadow-[3px_3px_0_hsl(222_38%_14%)]">
            G
          </span>
          <span className="font-display text-xl font-bold text-ink">G-ra</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink">
            The board for
            <br />
            people who
            <br />
            <span className="text-accent-ink">ship work.</span>
          </h1>
          <p className="mt-4 max-w-sm font-mono text-xs uppercase tracking-[0.18em] text-muted-fg">
            Self-hostable · No seats · No lock-in
          </p>
        </div>
        <span className="spec">v0.1 — engineering release</span>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-accent font-display font-bold text-paper">
              G
            </span>
            <span className="font-display text-lg font-bold">G-ra</span>
          </div>
          <div className="mb-5 flex items-center gap-2">
            <span className="h-5 w-1 bg-accent" aria-hidden />
            <h2 className="font-display text-xl font-bold text-ink">Sign in</h2>
          </div>
          <div className="panel p-5">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
