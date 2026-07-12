import { useEffect, useState } from "react";
import type { ProcessType } from "@/lib/clickup-api";

const CLICKUP_TOKEN = "pk_49618794_OA2IWD79GWYGL70C3W2UEENSRE77JSKV";
const BASE_URL = "https://api.clickup.com/api/v2";

// Endpoints por pestaña (espejo de src/lib/clickup-api.ts, solo lectura para diagnóstico)
const ENDPOINTS: Record<string, string | null> = {
  llc_formation: `${BASE_URL}/list/900200216635/task?page=0&subtasks=false&include_closed=true`,
  bank_application: `${BASE_URL}/view/8c901jk-6274/task?page=0`,
  tax_return: `${BASE_URL}/view/901407106445/task?page=0`,
  annual_reports: null,
  agentes_registrados: null,
  ticketera_cx: null,
};

interface Props {
  selectedProcess: ProcessType;
}

export function DiagnosticPanel({ selectedProcess }: Props) {
  const [state, setState] = useState<{
    loading: boolean;
    url: string | null;
    status: number | null;
    totalRaw: number | null;
    totalFiltered: number | null;
    firstCustomFields: any[] | null;
    firstTask: any | null;
    error: string | null;
  }>({
    loading: true,
    url: null,
    status: null,
    totalRaw: null,
    totalFiltered: null,
    firstCustomFields: null,
    firstTask: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const url = ENDPOINTS[selectedProcess] ?? null;

    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      if (!url) {
        if (!cancelled)
          setState({
            loading: false,
            url: null,
            status: null,
            totalRaw: null,
            totalFiltered: null,
            firstCustomFields: null,
            firstTask: null,
            error: `No hay endpoint conocido para el proceso "${selectedProcess}"`,
          });
        return;
      }
      try {
        const res = await fetch(url, { headers: { Authorization: CLICKUP_TOKEN } });
        const status = res.status;
        const data = await res.json().catch(() => ({}));
        const rawTasks: any[] = Array.isArray(data?.tasks) ? data.tasks : [];
        const filtered = rawTasks.filter((t: any) => !t.parent);
        const first = rawTasks[0] ?? null;
        console.log("[DIAG]", {
          process: selectedProcess,
          url,
          status,
          totalRaw: rawTasks.length,
          totalFiltered: filtered.length,
          firstTask: first,
        });
        if (!cancelled)
          setState({
            loading: false,
            url,
            status,
            totalRaw: rawTasks.length,
            totalFiltered: filtered.length,
            firstCustomFields: first?.custom_fields ?? null,
            firstTask: first,
            error: null,
          });
      } catch (err: any) {
        console.log("[DIAG] ERROR", { url, err });
        if (!cancelled)
          setState({
            loading: false,
            url,
            status: null,
            totalRaw: null,
            totalFiltered: null,
            firstCustomFields: null,
            firstTask: null,
            error: String(err?.message ?? err),
          });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProcess]);

  const cfSummary =
    state.firstCustomFields?.map((f: any) => ({
      id: f?.id,
      name: f?.name,
      type: f?.type,
      value: f?.value,
    })) ?? null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#FEF08A",
        color: "#111",
        padding: 12,
        fontFamily: "monospace",
        fontSize: 12,
        maxHeight: "40vh",
        overflow: "auto",
        borderBottom: "2px solid #111",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        [DIAG] Proceso: {selectedProcess} — {state.loading ? "CARGANDO..." : "LISTO"}
      </div>
      <div>URL: {state.url ?? "(sin endpoint)"}</div>
      <div>HTTP status: {state.status ?? "—"}</div>
      <div>Tareas RAW desde API: {state.totalRaw ?? "—"}</div>
      <div>Tareas tras filtro (parent==null): {state.totalFiltered ?? "—"}</div>
      {state.error && (
        <div style={{ color: "#7f1d1d", marginTop: 6 }}>
          <b>ERROR:</b> {state.error}
        </div>
      )}
      <details style={{ marginTop: 6 }} open>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          custom_fields de la 1ra tarea (id / name / type / value)
        </summary>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {cfSummary ? JSON.stringify(cfSummary, null, 2) : "(sin datos)"}
        </pre>
      </details>
    </div>
  );
}
