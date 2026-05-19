import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Timer,
  BarChart3,
  Settings,
  TrendingUp,
  GitBranch,
  FileText,
  Bell,
} from "lucide-react";

const navigation = [
  { name: "Cycle Time", icon: Timer, current: true },
  { name: "Embudo", icon: GitBranch, current: false },
  { name: "Metricas", icon: TrendingUp, current: false },
  { name: "Reportes", icon: BarChart3, current: false },
  { name: "Documentos", icon: FileText, current: false },
];

const secondaryNavigation = [
  { name: "Notificaciones", icon: Bell },
  { name: "Configuracion", icon: Settings },
];

export function Sidebar() {
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

        {/* Main Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <div className="text-xs font-semibold leading-6 text-muted-foreground uppercase tracking-wider">
                Analisis
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <a
                      href="#"
                      className={cn(
                        item.current
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors",
                      )}
                    >
                      <item.icon
                        className={cn(
                          item.current
                            ? "text-sidebar-primary"
                            : "text-muted-foreground group-hover:text-sidebar-foreground",
                          "h-5 w-5 shrink-0 transition-colors",
                        )}
                      />
                      {item.name}
                    </a>
                  </li>
                ))}
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

            {/* User */}
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
