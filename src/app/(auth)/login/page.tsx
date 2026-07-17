import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/fields";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">G-ra</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in to your board.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </Card>
    </main>
  );
}
