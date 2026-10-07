// Errores de carga que el servidor le manda a la pantalla. El servidor tira
// `new Error(CODE)` y la pantalla traduce el código a un mensaje. Si la carga
// falla, la pantalla muestra el error en vez de los datos: nunca números
// viejos o parciales sin aviso.

// ClickUp respondió 429 y la espera que pide no entra en el tope de la carga.
export const CLICKUP_SATURADO = "CLICKUP_SATURADO";
// ClickUp no respondió a tiempo o falló la conexión.
export const CLICKUP_NO_RESPONDE = "CLICKUP_NO_RESPONDE";

export function loadErrorMessage(error: unknown, what: string): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes(CLICKUP_SATURADO)) {
    return "ClickUp está saturado en este momento y no respondió a tiempo. Reintentá en un minuto.";
  }
  if (message.includes(CLICKUP_NO_RESPONDE)) {
    return "ClickUp no responde. Reintentá en un minuto.";
  }
  return `No se pudieron cargar los datos de ${what}. Reintentá en un momento.`;
}
