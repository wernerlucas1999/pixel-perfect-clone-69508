import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient, safeRedirectPath } from "@/lib/auth-client";

interface LoginSearch {
  redirect?: string;
  error?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  head: () => ({ meta: [{ title: "Ingresar · KPI Firmaway" }] }),
  component: LoginPage,
});

function errorMessage(code: string): string {
  // getUserInfo devuelve null cuando la cuenta no es de Firmaway o el email no
  // está verificado; better-auth lo reporta con este código.
  if (code === "unable_to_get_user_info") {
    return "Solo pueden ingresar cuentas de Google de firmaway.us con email verificado.";
  }
  if (code === "access_denied") return "Cancelaste el ingreso con Google.";
  return "No se pudo completar el ingreso. Probá de nuevo.";
}

function LoginPage() {
  const { redirect, error } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setClientError(null);
    const { error: err } = await authClient.signIn.social({
      provider: "google",
      callbackURL: safeRedirectPath(redirect),
      errorCallbackURL: "/login",
    });
    if (err) {
      setClientError("No se pudo iniciar el ingreso con Google.");
      setLoading(false);
    }
  };

  const message = clientError ?? (error ? errorMessage(error) : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">Dashboard KPI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresá con tu cuenta de Google de Firmaway.
        </p>
        {message && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {message}
          </p>
        )}
        <Button className="mt-6 w-full" onClick={signIn} disabled={loading}>
          {loading ? "Redirigiendo…" : "Ingresar con Google"}
        </Button>
      </div>
    </div>
  );
}
