import { createMiddleware } from "@tanstack/react-start";

// Segunda capa de autenticación para las server functions (la primera es el
// bloqueo de src/server.ts). Los imports son dinámicos dentro de .server()
// para que nada de auth.server.ts llegue al bundle del cliente.
export const requireSession = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const [{ getRequest }, { assertValidSession }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("./auth.server"),
  ]);
  await assertValidSession(getRequest());
  return next();
});
