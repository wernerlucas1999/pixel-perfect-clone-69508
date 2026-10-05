import { createServerFn } from "@tanstack/react-start";
import { requireSession } from "./auth-middleware";
import type { DashboardProcess } from "./processes";

export interface Me {
  email: string;
  // Procesos en los que puede ver datos por persona.
  peopleProcesses: DashboardProcess[];
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
    };
  });
