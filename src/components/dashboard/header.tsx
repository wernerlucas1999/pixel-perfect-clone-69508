import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PROCESSES,
  STATES,
  PACKAGES,
  BANKS,
  type ProcessType,
  type StateType,
  type PackageType,
  type BankType,
} from "@/lib/clickup-api";
import { CalendarIcon, Menu } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface HeaderProps {
  selectedProcess: ProcessType | "all";
  onProcessChange: (process: ProcessType | "all") => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  selectedState: StateType | "all";
  onStateChange: (state: StateType | "all") => void;
  selectedPackage: PackageType | "all";
  onPackageChange: (pkg: PackageType | "all") => void;
  selectedBank: BankType | "all";
  onBankChange: (bank: BankType | "all") => void;
}

export function Header({
  selectedProcess,
  onProcessChange,
  dateRange,
  onDateRangeChange,
  selectedState,
  onStateChange,
  selectedPackage,
  onPackageChange,
  selectedBank,
  onBankChange,
}: HeaderProps) {
  const isBankApplication = selectedProcess === "bank_application";
  const isTicketera = selectedProcess === "ticketera_cx";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      {/* Top Row - Title and Process Selector */}
      <div className="flex h-14 items-center gap-x-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="lg:hidden text-foreground">
          <Menu className="h-6 w-6" />
        </Button>

        <div className="h-6 w-px bg-border lg:hidden" />

        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-x-4">
            <h1 className="text-xl font-semibold text-foreground">Cycle Time</h1>
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

            {/* Process Selector */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-muted-foreground">Proceso:</span>
              <Select
                value={selectedProcess}
                onValueChange={(value) => onProcessChange(value as ProcessType | "all")}
              >
                <SelectTrigger className="w-[180px] bg-input border-border text-foreground">
                  <SelectValue placeholder="Seleccionar proceso" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value="all"
                    className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                      Todos los Procesos
                    </div>
                  </SelectItem>
                  {PROCESSES.map((process) => (
                    <SelectItem
                      key={process.id}
                      value={process.id}
                      className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: process.color }}
                        />
                        {process.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] sm:w-[240px] justify-start text-left font-normal border-border",
                  !dateRange.from && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy", { locale: es })
                  )
                ) : (
                  <span>Rango de fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from || new Date()}
                selected={{
                  from: dateRange.from || undefined,
                  to: dateRange.to || undefined,
                }}
                onSelect={(range) =>
                  onDateRangeChange({
                    from: range?.from || null,
                    to: range?.to || null,
                  })
                }
                numberOfMonths={2}
                locale={es}
              />
              {(dateRange.from || dateRange.to) && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onDateRangeChange({ from: null, to: null })}
                  >
                    Limpiar filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Bottom Row - State, Package, and Bank Filters */}
      <div className="flex h-12 items-center gap-x-3 px-4 sm:px-6 lg:px-8 border-t border-border/50 bg-muted/30">
        {/* State Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">State:</span>
          <Select
            value={selectedState}
            onValueChange={(value) => onStateChange(value as StateType | "all")}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs bg-input border-border text-foreground">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {STATES.map((state) => (
                <SelectItem
                  key={state.id}
                  value={state.id}
                  className="text-xs text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Package Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Paquete:</span>
          <Select
            value={selectedPackage}
            onValueChange={(value) => onPackageChange(value as PackageType | "all")}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs bg-input border-border text-foreground">
              <SelectValue placeholder="Paquete" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {PACKAGES.map((pkg) => (
                <SelectItem
                  key={pkg.id}
                  value={pkg.id}
                  className="text-xs text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  {pkg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bank Filter - Only show for Bank Application */}
        {isBankApplication && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Banco:</span>
              <Select
                value={selectedBank}
                onValueChange={(value) => onBankChange(value as BankType | "all")}
              >
                <SelectTrigger className="w-[100px] h-8 text-xs bg-input border-border text-foreground">
                  <SelectValue placeholder="Banco" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {BANKS.map((bank) => (
                    <SelectItem
                      key={bank.id}
                      value={bank.id}
                      className="text-xs text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
