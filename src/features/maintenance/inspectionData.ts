import { useSyncExternalStore } from "react";
import type { ChecksheetColumn, ChecksheetTemplate, WorkRequest } from "../../lib/mockData";

export const frequencies = { hourly: "รายชั่วโมง", daily: "รายวัน", per_shift: "รายกะ" } as const;
export const shifts = ["A", "B", "C"] as const;
export const columnTypes = { pass_fail: "ผ่าน / ไม่ผ่าน", number: "ตัวเลข", text: "ข้อความ", checkbox: "ช่องติ๊ก", dropdown: "ตัวเลือก" } as const;
export const alertPriorities = { medium: "ปานกลาง", high: "ด่วน", critical: "วิกฤต" } as const;

export type InspectionColumn = Omit<ChecksheetColumn, "type"> & {
  type: keyof typeof columnTypes;
  min?: number;
  max?: number;
  unit?: string;
};

export type InspectionTemplate = Omit<ChecksheetTemplate, "frequency" | "columns"> & {
  frequency: keyof typeof frequencies;
  columns: InspectionColumn[];
  priority: keyof typeof alertPriorities;
};

export function inspectionSections(items: InspectionTemplate["items"]) {
  const groups = new Map<string, InspectionTemplate["items"]>();
  for (const item of items) {
    const name = item.group?.trim() || "รายการตรวจ";
    const group = groups.get(name) ?? [];
    group.push(item);
    groups.set(name, group);
  }
  const pageSize = 10;
  return [...groups].flatMap(([name, group]) => {
    const pages = Math.ceil(group.length / pageSize);
    return Array.from({ length: pages }, (_, index) => ({
      name: pages > 1 ? `${name} · ${index + 1}/${pages}` : name,
      items: group.slice(index * pageSize, (index + 1) * pageSize),
    }));
  });
}

export type InspectionCell = {
  topic: string;
  column: string;
  value: string;
  criterion: string;
  failed: boolean;
  group?: string;
};

export type InspectionRecord = {
  id: string;
  templateId: string;
  templateName: string;
  machineKey: string;
  machineName: string;
  location: string;
  planId?: string;
  date: string;
  period: string;
  frequency: keyof typeof frequencies;
  inspector: string;
  inspectorId?: string;
  submittedAt: string;
  priority: InspectionTemplate["priority"];
  cells: InspectionCell[];
  note: string;
  read?: boolean;
  email?: "pending" | "accepted" | "unconfigured" | "failed";
};

type InspectionState = { templates: InspectionTemplate[]; records: InspectionRecord[] };
export const INSPECTION_KEY = "fixflow:pm-inspections";
const empty: InspectionState = { templates: [], records: [] };
const changeEvent = "fixflow:pm-inspections-changed";
let cachedRaw: string | null = null;
let cached = empty;

export function readInspections(): InspectionState {
  try {
    const raw = localStorage.getItem(INSPECTION_KEY);
    if (raw !== cachedRaw) {
      cached = raw ? JSON.parse(raw) as InspectionState : empty;
      cachedRaw = raw;
    }
  } catch {
    return empty;
  }
  return cached;
}

function subscribe(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === INSPECTION_KEY || event.key === null) listener();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, listener);
  };
}

export function useInspections() {
  return useSyncExternalStore(subscribe, readInspections, () => empty);
}

function writeInspections(state: InspectionState) {
  try {
    localStorage.setItem(INSPECTION_KEY, JSON.stringify(state));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(changeEvent));
  return true;
}

export function saveInspectionTemplate(template: InspectionTemplate) {
  const state = readInspections();
  const exists = state.templates.some((item) => item.template_id === template.template_id);
  const templates = exists
    ? state.templates.map((item) => item.template_id === template.template_id ? template : item)
    : [template, ...state.templates];
  return writeInspections({ ...state, templates });
}

export function addInspectionRecord(record: InspectionRecord) {
  const state = readInspections();
  const exists = state.records.some((item) =>
    item.templateId === record.templateId && item.machineKey === record.machineKey &&
    item.planId === record.planId && item.frequency === record.frequency &&
    item.date === record.date && item.period === record.period,
  );
  if (exists) return "duplicate" as const;
  return writeInspections({ ...state, records: [record, ...state.records] }) ? "saved" as const : "error" as const;
}

export function updateInspectionRecord(id: string, patch: Pick<InspectionRecord, "read" | "email">) {
  const state = readInspections();
  return writeInspections({ ...state, records: state.records.map((item) => item.id === id ? { ...item, ...patch } : item) });
}

export function assessCell(column: InspectionColumn, topic: string, raw: string): InspectionCell {
  const value = raw.trim();
  const min = column.type === "number" ? column.min : undefined;
  const max = column.type === "number" ? column.max : undefined;
  const numeric = Number(value);
  const failed = value !== "" && (column.type === "pass_fail" ? value === "fail" :
    (min !== undefined && numeric < min) || (max !== undefined && numeric > max));
  const criterion = [
    column.type === "pass_fail" ? "ผ่าน" : "",
    min === undefined ? "" : `≥ ${min}`,
    max === undefined ? "" : `≤ ${max}`,
    min !== undefined || max !== undefined ? column.unit : "",
  ].filter(Boolean).join(" ");
  const labels: Record<string, string> = { pass: "ผ่าน", fail: "ไม่ผ่าน", yes: "ตรวจแล้ว", no: "ยังไม่ได้ตรวจ" };
  let displayed = value;
  if (column.type === "pass_fail" || column.type === "checkbox") displayed = labels[value] ?? value;
  if (column.type === "number" && value && column.unit) displayed = `${value} ${column.unit}`;
  return { topic, column: column.label, value: displayed, criterion, failed };
}

export function inspectionRequestId(id: string) {
  return `REQ-PM-${id.toUpperCase()}`;
}

export function inspectionWorkRequest(record: InspectionRecord): WorkRequest | undefined {
  const failures = record.cells.filter((cell) => cell.failed);
  if (!failures.length) return undefined;
  const requestId = inspectionRequestId(record.id);
  const summary = failures.map((cell) => `${cell.topic} · ${cell.column} = ${cell.value} (เกณฑ์ ${cell.criterion})`);
  return {
    request_id: requestId,
    asset_name: record.machineName,
    asset_location: record.location,
    issue_summary: `เช็กชีท ${record.templateName}: ${summary.join("; ")}`,
    priority: record.priority,
    status: "open",
    sub_status: "reported",
    category: "other",
    reported_time: record.submittedAt,
    reported_by: record.inspector,
    reported_by_id: record.inspectorId,
    attachments: [],
    status_timeline: [{
      event_id: `evt-${requestId}`, status: "open", updated_by: "ระบบเช็กชีท PM",
      updated_by_role: "system", updated_at: record.submittedAt, note: "เปิดใบแจ้งซ่อมจากผลตรวจนอกเกณฑ์",
    }],
    requester_notifications: [],
  };
}

const sending = new Set<string>();

export async function sendInspectionEmail(record: InspectionRecord) {
  if (record.priority === "medium" || !record.email || record.email === "accepted" || sending.has(record.id)) return;
  sending.add(record.id);
  let email: InspectionRecord["email"] = "failed";
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch("/api/pm-alert-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: record.id, priority: record.priority, template: record.templateName,
        machine: record.machineName, date: record.date, period: record.period,
        failures: record.cells.filter((cell) => cell.failed).slice(0, 20)
          .map(({ topic, column, value, criterion }) => ({ topic, column, value: value.slice(0, 120), criterion })),
      }),
      signal: controller.signal,
    });
    const result = await response.json();
    if (response.ok && result.status === "accepted") email = "accepted";
    if (result.status === "unconfigured") email = "unconfigured";
  } catch {
    // The inspection and work request are already committed. The inbox can retry delivery.
  } finally {
    window.clearTimeout(timeout);
    updateInspectionRecord(record.id, { email });
    sending.delete(record.id);
  }
}
