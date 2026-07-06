import { cn } from "@/lib/utils";
import { Timer, Settings, Bell, GitBranch } from "lucide-react";
import { PROCESSES, type ProcessType } from "@/lib/clickup-api";

interface SidebarProps {
  selectedProcess: ProcessType;
  onProcessChange: (process: ProcessType) => void;
}

const secondaryNavigation = [
  { name: "Notificaciones", icon: Bell },
  { name: "Configuracion", icon: Settings },
];

export function Sidebar({ selectedProcess, onProcessChange }: SidebarProps) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <Timer className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">CycleMetrics</span>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <div className="text-xs font-semibold leading-6 text-muted-foreground uppercase tracking-wider">
                Procesos
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                <li>
                  <button
                    onClick={() => onProcessChange("all")}
                    className={cn(
                      selectedProcess === "all"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
                      "w-full group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors text-left",
                    )}
                  >
                    <GitBranch className="h-5 w-5 shrink-0" />
                    Todos los procesos
                  </button>
                </li>
                {PROCESSES.map((p) => {
                  const active = selectedProcess === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => onProcessChange(p.id)}
                        className={cn(
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          "w-full group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors text-left",
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

            <li>
              <div className="text-xs font-semibold leading-6 text-muted-foreground uppercase tracking-wider">
                Sistema
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {secondaryNavigation.map((item) => (
                  <li key={item.name}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors"
                    >
                      <item.icon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            <li className="mt-auto">
              <div className="flex items-center gap-x-3 rounded-md p-2 text-sm font-medium hover:bg-sidebar-accent transition-colors cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-sm font-medium text-accent-foreground">MG</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sidebar-foreground">Maria Garcia</span>
                  <span className="text-xs text-muted-foreground">Admin</span>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
