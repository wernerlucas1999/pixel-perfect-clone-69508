import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { PROCESSES, type ProcessType } from "@/lib/clickup-api";
// Versión oscura del logo (artwork navy), la que corresponde sobre fondo claro.
import logo from "@/assets/brand/firmaway-logo.png";

interface SidebarProps {
  // null = "Todos los procesos" (ningún proceso marcado).
  selectedProcess: ProcessType | null;
  onProcessChange: (process: ProcessType) => void;
  // Panel comercial (dashboard aparte). null = no se muestra el ítem.
  panelComercialUrl: string | null;
}

export function Sidebar({ selectedProcess, onProcessChange, panelComercialUrl }: SidebarProps) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3">
          <img src={logo} alt="Firmaway" className="h-5 w-auto" />
          <span className="whitespace-nowrap text-sm font-extrabold tracking-titulo-h2 text-muted-foreground">
            Dashboard KPI
          </span>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <div className="text-xs font-bold leading-6 text-muted-foreground uppercase tracking-etiqueta">
                Procesos
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {PROCESSES.filter((p) => p.id !== "other").map((p) => {
                  const active = selectedProcess === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => onProcessChange(p.id)}
                        className={cn(
                          active
                            ? // Proceso activo: fondo tenue y el punto del proceso. El relleno
                              // coral queda para pestañas y chips (como en el panel comercial).
                              "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                            : "font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          "w-full group flex items-center gap-x-3 rounded-full px-3 py-2 text-sm leading-6 transition-colors text-left",
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
            {/* Fuera de "Procesos": no es un proceso nuestro, abre afuera. */}
            {panelComercialUrl && (
              <li>
                <div className="text-xs font-bold leading-6 text-muted-foreground uppercase tracking-etiqueta">
                  Otros paneles
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  <li>
                    <a
                      href={panelComercialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abre en una pestaña nueva"
                      className="group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    >
                      Panel Comercial
                      <ExternalLink className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="sr-only">(abre en una pestaña nueva)</span>
                    </a>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
