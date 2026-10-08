import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dataAgeLabel } from "@/lib/data-age";

// De cuándo son los datos de la pantalla. Siempre visible, no solo cuando son
// viejos: el servidor guarda los datos de ClickUp hasta 20 minutos, y eso
// tiene que estar declarado, con un botón para pedirlos de nuevo.
export function DataFreshness({
  fetchedAt,
  onRefresh,
  refreshing,
}: {
  fetchedAt: number;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [fetchedAt]);
  const time = new Date(fetchedAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
      <span>
        Datos de ClickUp de {dataAgeLabel(fetchedAt, now)} ({time})
      </span>
      <Button size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {refreshing ? "Actualizando…" : "Actualizar"}
      </Button>
    </div>
  );
}
