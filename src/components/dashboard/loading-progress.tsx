import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

// Mientras carga una pantalla: cuánto lleva la carga, para que se vea que
// avanza y nadie recargue a los 15 s (recargar duplica los pedidos a
// ClickUp). Es el tiempo transcurrido, no el avance real de la carga.
export function LoadingProgress({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));

  const message =
    seconds < 8
      ? "Cargando tareas desde ClickUp…"
      : seconds < 20
        ? `Cargando tareas desde ClickUp… ${seconds} s`
        : `ClickUp está respondiendo lento. Sigue cargando (${seconds} s; puede tardar hasta 45 s).`;

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Spinner className="mx-auto mb-4 h-8 w-8" />
        <p className="text-muted-foreground">{message}</p>
        {seconds >= 8 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No hace falta recargar la página: la carga sigue en curso.
          </p>
        )}
      </div>
    </div>
  );
}
