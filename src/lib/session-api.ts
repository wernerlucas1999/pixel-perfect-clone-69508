import { createServerFn } from "@tanstack/react-start";
import { requireSession } from "./auth-middleware";
import type { DashboardProcess } from "./processes";

export interface Me {
  email: string;
  // Procesos en los que puede ver datos por persona.
  peopleProcesses: DashboardProcess[];
  // Link al panel comercial (PANEL_COMERCIAL_URL en Vercel). null = sin
  // cargar o inválido: el menú no muestra el ítem.
  panelComercialUrl: string | null;
}

// Solo http(s): un valor mal cargado no puede volverse un link roto o un
// "javascript:" en el menú.
export function parsePanelComercialUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

// Comodidad visual: la interfaz la usa para ocultar lo que no corresponde. La
// seguridad está en el servidor: las listas nunca devuelven datos de personas
// (redactPeople) y getPeopleBreakdown verifica el permiso en cada pedido.
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSession])
  .handler(async (): Promise<Me> => {
    const [{ getRequest }, { assertValidSession }, { allowedPeopleProcesses, normalizeEmail }] =
      await Promise.all([
        import("@tanstack/react-start/server"),
        import("./auth.server"),
        import("./permissions.server"),
      ]);
    const session = await assertValidSession(getRequest());
    return {
      email: normalizeEmail(session.user.email),
      peopleProcesses: allowedPeopleProcesses(session.user.email),
      // Se lee en el servidor (sin prefijo VITE_): el link no queda en el
      // bundle público y solo lo recibe quien ya inició sesión.
      panelComercialUrl: parsePanelComercialUrl(process.env.PANEL_COMERCIAL_URL),
    };
  });
