import { useState } from "react";
import { toast } from "sonner";
import seed from "./president-data.json";

export const { machines, departments, people, weeks, airJetForm, spareParts, monthlyReference } = seed;
export const planYear = 2026;

export const cycles = {
  M: "รายเดือน",
  "3M": "ทุก 3 เดือน",
  "6M": "ทุก 6 เดือน",
  Y: "รายปี",
};
export type Cycle = keyof typeof cycles;
export type WorkStatus = "planned" | "working" | "done";
export const workStatuses: Record<WorkStatus, string> = {
  planned: "รอดำเนินการ",
  working: "กำลังดำเนินการ",
  done: "เสร็จสิ้น",
};

export type Plan = {
  id: string;
  code: string;
  name: string;
  location: string;
  model: string;
  machineId: string | null;
  cycle: Cycle;
  week: number | null;
  date: string;
  owner: string;
  status: WorkStatus;
  note: string;
  templateId?: string;
};

export const sourcePlans: Plan[] = seed.plans.map(({ cycle, ...plan }) => ({
  ...plan,
  cycle: cycle as Cycle,
  date: "",
  owner: "",
  status: "planned",
  note: "",
}));

export function usePlans() {
  const [saved, save] = useDemoStorage<Record<string, Plan>>("plans", {});
  const plans = [
    ...sourcePlans.map((plan) => saved[plan.id] ?? plan),
    ...Object.values(saved).filter((plan) => plan.week === null),
  ];
  return [plans, (plan: Plan) => save({ ...saved, [plan.id]: plan })] as const;
}

export function useDemoStorage<T>(name: string, initial: T) {
  const key = `president-demo:v1:${name}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : initial;
    } catch {
      return initial;
    }
  });

  const save = (next: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setValue(next);
      return true;
    } catch {
      toast.error("บันทึกข้อมูลในเบราว์เซอร์ไม่สำเร็จ");
      return false;
    }
  };

  return [value, save] as const;
}

export const months = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("th-TH", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, index, 1))),
);
export const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;
export const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok" }).format(new Date());

export function displayDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

export function matches(query: string, ...values: (string | number | null | undefined)[]) {
  return values.join(" ").toLowerCase().includes(query.trim().toLowerCase());
}
