import { machines, spareParts as importedSpareParts } from "@/features/maintenance/data";

export type Priority = "critical" | "high" | "medium" | "low";
export type Status = "open" | "assess" | "waiting" | "doing" | "done" | "complete";
export type WorkCategory =
  | "electrical-control"
  | "mechanical"
  | "pneumatic-hydraulic"
  | "lubrication-fluid"
  | "other"
  | "electrical"
  | "facility"
  | "plumbing"
  | "it";
export type SubStatus =
  | "reported"
  | "assessing"
  | "accepted"
  | "forwarded"
  | "in-progress"
  | "waiting-parts"
  | "closed"

  | "finished";
export type ActorRole = "technician" | "requester" | "system";

export interface RequestAttachment {
  attachment_id: string;
  name: string;
  url: string;
  mime_type?: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface RequestDetails {
  asset_id: string;
  asset_type: string;
  machine_number: string;
  machine_zone: string;
  location_building: string;
  location_floor: string;
  location_line: string;
  access_required: boolean;
  access_time_window: string;
  issue_message: string;
  issue_symptom: "not-working" | "noise" | "vibration" | "error" | "other";
  issue_frequency: "first-time" | "repeated" | "always";
  machine_operability: "running" | "degraded" | "stopped";
  reporter_name: string;
  reporter_emp_id?: string;
  reporter_department: string;
  job_type: WorkCategory;
  reported_date_from_qr?: string;
  reported_time_from_qr?: string;
  additional_note?: string;
}

export interface AssessmentReport {
  visit_date: string;
  priority_level: Priority;
  work_status: Status;
  repair_date_range: { start: string; end: string };
  impact_while_waiting: "low" | "medium" | "high";
  machine_status_while_waiting: "running" | "degraded" | "stopped";
  result_text: string;
  temp_measure: string;
  communication_log: string;
  internal_note: string;
  assessment_attachments: RequestAttachment[];
}

export interface RequestNotification {
  notification_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface StatusTimelineEvent {
  event_id: string;
  status: Status;
  updated_by: string;
  updated_by_role: ActorRole;
  updated_at: string;
  note?: string;
}

export interface SparePart {
  part_id: string;
  name: string;
  stock: number;
  unit: string;
}

export interface WorkRequest {
  request_id: string;
  asset_name: string;
  asset_location: string;
  issue_summary: string;
  priority: Priority;
  status: Status;
  sub_status: SubStatus;
  reported_time: string;
  reported_by: string;
  reported_by_id?: string;
  reported_by_department?: string;
  category: WorkCategory;
  assigned_to?: string | null;
  attachments: RequestAttachment[];
  request_details?: RequestDetails;
  assessment_report?: AssessmentReport;
  status_timeline: StatusTimelineEvent[];
  requester_notifications: RequestNotification[];
}

export const MOCK_REQUESTS: WorkRequest[] = [
  {
    request_id: "REQ-20260422-002",
    asset_name: "ELC-DB-5510",
    asset_location: "ตู้ควบคุมไฟ อาคาร B ชั้น 2",
    issue_summary: "เบรกเกอร์ทริปบ่อย มีกลิ่นไหม้",
    priority: "critical",
    status: "open",
    sub_status: "reported",
    reported_time: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    reported_by: "นภดล (ฝ่ายผลิต)",
    reported_by_id: "REQ042",
    reported_by_department: "ฝ่ายผลิต",
    category: "electrical",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260422-001",
    asset_name: "MCH-PR-2041",
    asset_location: "Hydraulic Press Line 3",
    issue_summary: "กระบอกสูบไฮดรอลิกมีน้ำมันรั่วซึม",
    priority: "high",
    status: "open",
    sub_status: "reported",
    reported_time: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    reported_by: "ประยุทธ์ (Line Leader)",
    reported_by_id: "REQ021",
    reported_by_department: "Line Production",
    assigned_to: "TECH002",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
    category: "other"
  },
  {
    request_id: "REQ-20260422-003",
    asset_name: "AC-OFF-019",
    asset_location: "แอร์ห้องประชุมใหญ่",
    issue_summary: "แอร์ไม่เย็น มีน้ำหยดจากเครื่อง",
    priority: "medium",
    status: "doing",
    sub_status: "in-progress",
    reported_time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reported_by: "วราภรณ์ (HR)",
    reported_by_id: "REQ099",
    reported_by_department: "HR",
    category: "facility",
    assigned_to: "TECH004",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260421-014",
    asset_name: "CNV-ASSY-08",
    asset_location: "สายพานลำเลียง Assembly 8",
    issue_summary: "เสียงดังผิดปกติบริเวณมอเตอร์",
    priority: "high",
    status: "doing",
    sub_status: "in-progress",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    reported_by: "สมชาย (Foreman)",
    reported_by_id: "REQ058",
    reported_by_department: "Production",
    category: "mechanical",
    assigned_to: "TECH001",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260421-009",
    asset_name: "PLB-WC-302",
    asset_location: "ห้องน้ำชาย ชั้น 3",
    issue_summary: "ก๊อกน้ำหยดตลอดเวลา",
    priority: "low",
    status: "complete",
    sub_status: "resolved",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    reported_by: "แม่บ้าน",
    reported_by_id: "REQ077",
    reported_by_department: "Housekeeping",
    category: "plumbing",
    assigned_to: "TECH003",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260421-022",
    asset_name: "MCH-CNC-12",
    asset_location: "CNC Machine #12",
    issue_summary: "รอชิ้นส่วนใบมีดทดแทน คาดว่าได้พรุ่งนี้",
    priority: "high",
    status: "waiting",
    sub_status: "waiting-parts",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    reported_by: "อนันต์",
    reported_by_id: "REQ080",
    reported_by_department: "Warehouse",
    category: "mechanical",
    assigned_to: "TECH005",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260420-031",
    asset_name: "IT-SRV-RACK2",
    asset_location: "Server Room",
    issue_summary: "พัดลม UPS เสียงดัง",
    priority: "medium",
    status: "complete",
    sub_status: "resolved",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    reported_by: "ทีม IT",
    reported_by_id: "REQ090",
    reported_by_department: "IT",
    category: "it",
    assigned_to: "TECH006",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260420-019",
    asset_name: "PMP-WTR-01",
    asset_location: "ห้องปั๊มน้ำ ชั้นใต้ดิน",
    issue_summary: "เปลี่ยนซีลปั๊มน้ำหล่อเย็นเสร็จสิ้น",
    priority: "medium",
    status: "complete",
    sub_status: "resolved",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    reported_by: "สุรศักดิ์ (Facility)",
    reported_by_id: "REQ045",
    reported_by_department: "Facility",
    category: "mechanical",
    assigned_to: "TECH002",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260419-008",
    asset_name: "HVAC-CHL-02",
    asset_location: "ดาดฟ้า อาคาร A",
    issue_summary: "ล้างฟิลเตอร์และตรวจเช็กระบบทำความเย็น",
    priority: "low",
    status: "complete",
    sub_status: "resolved",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reported_by: "สมพร (HR)",
    reported_by_id: "REQ033",
    reported_by_department: "HR",
    category: "facility",
    assigned_to: "TECH004",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
  {
    request_id: "REQ-20260419-012",
    asset_name: "STR-PLT-03",
    asset_location: "คลังสินค้า โซน C",
    issue_summary: "ซ่อมจุดเชื่อมโครงสร้างแท่นวางสินค้า",
    priority: "medium",
    status: "doing",
    sub_status: "in-progress",
    reported_time: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    reported_by: "วิชัย (Warehouse)",
    reported_by_id: "REQ088",
    reported_by_department: "Warehouse",
    category: "facility",
    assigned_to: "TECH006",
    attachments: [],
    status_timeline: [],
    requester_notifications: [],
  },
];

const genEventId = () => `evt-${Math.random().toString(36).slice(2, 10)}`;

export const MOCK_REQUESTS_WITH_TIMELINE: WorkRequest[] = MOCK_REQUESTS.map((request) => {
  const timeline: StatusTimelineEvent[] = [
    {
      event_id: genEventId(),
      status: "open",
      updated_by: request.reported_by,
      updated_by_role: "requester",
      updated_at: request.reported_time,
      note: "เปิดงาน",
    },
  ];

  if (request.status !== "open") {
    timeline.push({
      event_id: genEventId(),
      status: request.status,
      updated_by: request.assigned_to ?? "TECH001",
      updated_by_role: "technician",
      updated_at: new Date(new Date(request.reported_time).getTime() + 1000 * 60 * 30).toISOString(),
      note:
        request.status === "waiting"
          ? "รออะไหล่"
          : request.status === "assess"
          ? "ประเมินงาน"
          : request.status === "complete"
          ? "เสร็จสิ้น"
          : "ช่างเริ่มงาน",
    });
  }

  return {
    ...request,
    status_timeline: timeline,
  };
});

// ─── Spare Parts Extended ─────────────────────────────────────────────────────

export type SparePartCategory =
  | "hydraulic"
  | "electrical"
  | "bearing"
  | "belt"
  | "filter"
  | "pneumatic"
  | "lubricant"
  | "fastener"
  | "sensor"
  | "other";

export const SPARE_PART_CATEGORY_LABEL: Record<SparePartCategory, string> = {
  hydraulic: "ไฮดรอลิก",
  electrical: "ไฟฟ้า",
  bearing: "ตลับลูกปืน",
  belt: "สายพาน",
  filter: "ไส้กรอง",
  pneumatic: "ระบบลม",
  lubricant: "น้ำมัน/สารหล่อลื่น",
  fastener: "น็อต/สกรู",
  sensor: "เซ็นเซอร์",
  other: "อื่น ๆ",
};

export interface SparePartExtended {
  part_id: string;
  reference?: string;
  group?: string;
  name: string;
  category: SparePartCategory;
  stock: number;
  min_stock: number | null;
  max_stock: number | null;
  unit: string;
  location: string;
  unit_price: number | null;
  supplier: string;
  last_updated: string;
  compatible_assets: string[];
}

export interface SparePartTransaction {
  tx_id: string;
  part_id: string;
  part_name: string;
  type: "issue" | "receive" | "adjust";
  quantity: number;
  related_request_id?: string;
  performed_by: string;
  note: string;
  timestamp: string;
}

const _now = Date.now();
const _d = (hoursBack: number) => new Date(_now - hoursBack * 3_600_000).toISOString();

const stockCategories: Partial<Record<string, SparePartCategory>> = {
  "SP-MC-01": "belt",
  "SP-MC-02": "bearing",
  "SP-MC-05": "pneumatic",
  "SP-MC-07": "electrical",
  "SP-MC-09": "fastener",
};

function stockLimit(value: string): number | null {
  return value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;
}

export const MOCK_SPARE_PARTS_EXTENDED: SparePartExtended[] = importedSpareParts.map((part) => ({
  part_id: part.code,
  reference: part.ref,
  group: part.group,
  name: part.name,
  category: stockCategories[part.groupCode] ?? "other",
  stock: Number(part.stock),
  min_stock: stockLimit(part.min),
  max_stock: stockLimit(part.max),
  unit: part.unit,
  location: [part.location, part.shelf].filter(Boolean).join(" · "),
  unit_price: null,
  supplier: "",
  last_updated: "",
  compatible_assets: [],
}));

export function isBelowMinimum(part: SparePartExtended): boolean {
  return part.min_stock !== null && part.stock < part.min_stock;
}

export function stockPercentage(part: SparePartExtended): number | null {
  return part.max_stock !== null && part.max_stock > 0
    ? Math.min(Math.round((part.stock / part.max_stock) * 100), 100)
    : null;
}

export function stockValue(parts: SparePartExtended[]): number | null {
  const priced = parts.filter((part) => part.unit_price !== null);
  return priced.length ? priced.reduce((total, part) => total + part.stock * (part.unit_price ?? 0), 0) : null;
}

export function formatStockPrice(value: number | null): string {
  return value === null ? "—" : `฿${value.toLocaleString("th-TH")}`;
}

export const MOCK_SPARE_PARTS: SparePart[] = MOCK_SPARE_PARTS_EXTENDED;

export const MOCK_SPARE_PART_TRANSACTIONS: SparePartTransaction[] = [];

// ─── Checksheet System ─────────────────────────────────────────────────────────

export type ChecksheetColumnType =
  | "checkbox"
  | "pass_fail"
  | "number"
  | "text"
  | "dropdown"
  | "rating";

export interface ChecksheetColumn {
  col_id: string;
  label: string;
  type: ChecksheetColumnType;
  options?: string[]; // for dropdown
  required: boolean;
  width?: "sm" | "md" | "lg";
}

export interface ChecksheetItem {
  item_id: string;
  order: number;
  topic: string;
  description?: string;
  group?: string;
}

export interface ChecksheetTemplate {
  template_id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "per_shift";
  machine_type?: string;
  items: ChecksheetItem[];
  columns: ChecksheetColumn[];
  created_by: string;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface ChecksheetCellValue {
  item_id: string;
  col_id: string;
  value: string | boolean | number;
}

export interface ChecksheetRecord {
  record_id: string;
  template_id: string;
  template_name: string;
  completed_by: string;
  department: string;
  shift?: "A" | "B" | "C";
  machine_id?: string;
  values: ChecksheetCellValue[];
  note?: string;
  submitted_at: string;
  status: "complete" | "partial" | "flagged";
}

export const MOCK_CHECKSHEET_TEMPLATES: ChecksheetTemplate[] = [
  {
    template_id: "CS-TPL-001",
    name: "ตรวจสอบเครื่องจักรประจำวัน (เช้า)",
    description: "เช็คชีทตรวจสอบสภาพเครื่องจักรก่อนเริ่มกะผลิต",
    frequency: "daily",
    machine_type: "เครื่องจักรทั่วไป",
    created_by: "สมศักดิ์ ช่างไฟ",
    created_at: new Date(_now - 30 * 24 * 3600_000).toISOString(),
    updated_at: _d(48),
    active: true,
    columns: [
      { col_id: "c1", label: "ผล", type: "pass_fail", required: true, width: "sm" },
      { col_id: "c2", label: "ค่าที่วัดได้", type: "text", required: false, width: "md" },
      { col_id: "c3", label: "หมายเหตุ", type: "text", required: false, width: "lg" },
    ],
    items: [
      { item_id: "i1", order: 1, topic: "ระดับน้ำมันไฮดรอลิก", group: "ระบบไฮดรอลิก" },
      { item_id: "i2", order: 2, topic: "ตรวจรอยรั่วท่อไฮดรอลิก", group: "ระบบไฮดรอลิก" },
      { item_id: "i3", order: 3, topic: "แรงดันลม (ปกติ 6-7 bar)", group: "ระบบลม" },
      { item_id: "i4", order: 4, topic: "วาล์วลม — ไม่มีรอยรั่ว", group: "ระบบลม" },
      { item_id: "i5", order: 5, topic: "อุณหภูมิมอเตอร์ (<60°C)", group: "ระบบไฟฟ้า" },
      { item_id: "i6", order: 6, topic: "สัญญาณไฟ Alarm — ปกติ", group: "ระบบไฟฟ้า" },
      { item_id: "i7", order: 7, topic: "สายพาน — ไม่หย่อน/ไม่แตก", group: "กลไก" },
      { item_id: "i8", order: 8, topic: "เสียงผิดปกติ — ไม่พบ", group: "กลไก" },
      { item_id: "i9", order: 9, topic: "ทำความสะอาดรอบเครื่อง", group: "สุขลักษณะ" },
      { item_id: "i10", order: 10, topic: "ตรวจอุปกรณ์ Safety Guard", group: "ความปลอดภัย" },
    ],
  },
  {
    template_id: "CS-TPL-002",
    name: "PM รายสัปดาห์ — Hydraulic Press",
    description: "บำรุงรักษาเชิงป้องกันรายสัปดาห์สำหรับ Hydraulic Press",
    frequency: "weekly",
    machine_type: "Hydraulic Press",
    created_by: "วิษณุ ช่างกล",
    created_at: new Date(_now - 60 * 24 * 3600_000).toISOString(),
    updated_at: _d(72),
    active: true,
    columns: [
      { col_id: "c1", label: "สถานะ", type: "pass_fail", required: true, width: "sm" },
      { col_id: "c2", label: "ค่าที่วัด", type: "number", required: false, width: "sm" },
      { col_id: "c3", label: "หน่วย", type: "dropdown", options: ["bar", "°C", "mm", "A", "-"], required: false, width: "sm" },
      { col_id: "c4", label: "หมายเหตุ/Action", type: "text", required: false, width: "lg" },
    ],
    items: [
      { item_id: "i1", order: 1, topic: "ตรวจสอบแรงดันระบบ (ปกติ 180-200 bar)", group: "ระบบไฮดรอลิก" },
      { item_id: "i2", order: 2, topic: "เติมน้ำมันไฮดรอลิก (ถ้าต่ำกว่า Min)", group: "ระบบไฮดรอลิก" },
      { item_id: "i3", order: 3, topic: "ตรวจสอบซีลกระบอกสูบ", group: "ระบบไฮดรอลิก" },
      { item_id: "i4", order: 4, topic: "ทำความสะอาด Oil Filter", group: "ระบบไฮดรอลิก" },
      { item_id: "i5", order: 5, topic: "ตรวจ Proximity Sensor ตำแหน่ง", group: "ระบบไฟฟ้า" },
      { item_id: "i6", order: 6, topic: "วัดกระแสมอเตอร์ปั๊มไฮดรอลิก", group: "ระบบไฟฟ้า" },
      { item_id: "i7", order: 7, topic: "อัดจาระบีแกนลูกสูบ", group: "การหล่อลื่น" },
      { item_id: "i8", order: 8, topic: "ทดสอบการทำงานครบ 5 cycle", group: "ทดสอบการทำงาน" },
    ],
  },
  {
    template_id: "CS-TPL-003",
    name: "ตรวจสอบความปลอดภัยประจำเดือน",
    description: "เช็คชีทความปลอดภัยสำหรับผู้จัดการหรือหัวหน้างาน",
    frequency: "monthly",
    created_by: "ผู้จัดการฝ่ายซ่อมบำรุง",
    created_at: new Date(_now - 90 * 24 * 3600_000).toISOString(),
    updated_at: _d(168),
    active: true,
    columns: [
      { col_id: "c1", label: "ผ่าน/ไม่ผ่าน", type: "pass_fail", required: true, width: "sm" },
      { col_id: "c2", label: "คะแนน (1-5)", type: "rating", required: false, width: "sm" },
      { col_id: "c3", label: "ข้อสังเกต", type: "text", required: false, width: "lg" },
      { col_id: "c4", label: "ผู้รับผิดชอบ", type: "text", required: false, width: "md" },
    ],
    items: [
      { item_id: "i1", order: 1, topic: "ป้ายความปลอดภัยครบถ้วน", group: "อุปกรณ์ความปลอดภัย" },
      { item_id: "i2", order: 2, topic: "ถังดับเพลิงอยู่ในตำแหน่งและอยู่ในอายุการใช้งาน", group: "อุปกรณ์ความปลอดภัย" },
      { item_id: "i3", order: 3, topic: "Safety Guard ครบทุกเครื่อง", group: "อุปกรณ์ความปลอดภัย" },
      { item_id: "i4", order: 4, topic: "Emergency Stop ทำงานได้ปกติ", group: "ระบบ Emergency" },
      { item_id: "i5", order: 5, topic: "Lock-out / Tag-out อุปกรณ์ครบ", group: "ระบบ Emergency" },
      { item_id: "i6", order: 6, topic: "ทางหนีไฟไม่มีสิ่งกีดขวาง", group: "อาคาร/สถานที่" },
      { item_id: "i7", order: 7, topic: "แสงสว่างในพื้นที่เพียงพอ", group: "อาคาร/สถานที่" },
      { item_id: "i8", order: 8, topic: "พื้นไม่ลื่น / ไม่มีน้ำมันหก", group: "อาคาร/สถานที่" },
      { item_id: "i9", order: 9, topic: "พนักงานสวม PPE ครบ", group: "บุคลากร" },
      { item_id: "i10", order: 10, topic: "บันทึกการฝึกอบรมความปลอดภัยล่าสุด", group: "บุคลากร" },
    ],
  },
];

export const MOCK_CHECKSHEET_RECORDS: ChecksheetRecord[] = [
  {
    record_id: "REC-20260922-001",
    template_id: "CS-TPL-001",
    template_name: "ตรวจสอบเครื่องจักรประจำวัน (เช้า)",
    completed_by: "สมศักดิ์ ช่างไฟ",
    department: "ฝ่ายซ่อมบำรุง",
    shift: "A",
    submitted_at: _d(4),
    status: "flagged",
    values: [
      { item_id: "i1", col_id: "c1", value: true },
      { item_id: "i2", col_id: "c1", value: false },
      { item_id: "i3", col_id: "c1", value: true },
      { item_id: "i3", col_id: "c2", value: "6.5" },
      { item_id: "i4", col_id: "c1", value: true },
      { item_id: "i5", col_id: "c1", value: false },
      { item_id: "i5", col_id: "c2", value: "72" },
      { item_id: "i5", col_id: "c3", value: "อุณหภูมิสูงกว่าปกติ ต้องติดตาม" },
      { item_id: "i6", col_id: "c1", value: true },
      { item_id: "i7", col_id: "c1", value: true },
      { item_id: "i8", col_id: "c1", value: true },
      { item_id: "i9", col_id: "c1", value: true },
      { item_id: "i10", col_id: "c1", value: true },
    ],
    note: "พบอุณหภูมิมอเตอร์สูง และรอยรั่วไฮดรอลิกเล็กน้อย แจ้งซ่อมแล้ว",
  },
  {
    record_id: "REC-20260921-002",
    template_id: "CS-TPL-001",
    template_name: "ตรวจสอบเครื่องจักรประจำวัน (เช้า)",
    completed_by: "วิษณุ ช่างกล",
    department: "ฝ่ายซ่อมบำรุง",
    shift: "A",
    submitted_at: _d(28),
    status: "complete",
    values: [],
    note: "",
  },
  {
    record_id: "REC-20260920-003",
    template_id: "CS-TPL-002",
    template_name: "PM รายสัปดาห์ — Hydraulic Press",
    completed_by: "วิษณุ ช่างกล",
    department: "ฝ่ายซ่อมบำรุง",
    machine_id: "MCH-PR-2041",
    submitted_at: _d(48),
    status: "complete",
    values: [],
  },
  {
    record_id: "REC-20260915-004",
    template_id: "CS-TPL-003",
    template_name: "ตรวจสอบความปลอดภัยประจำเดือน",
    completed_by: "ผู้จัดการฝ่ายซ่อมบำรุง",
    department: "Management",
    submitted_at: _d(168),
    status: "complete",
    values: [],
  },
];

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "วิกฤติ",
  high: "สูง",
  medium: "ปานกลาง",
  low: "ต่ำ",
};

export const STATUS_LABEL: Record<Status, string> = {
  open: "เปิดงาน",
  assess: "ประเมินงาน",
  waiting: "รออะไหล่",
  doing: "กำลังซ่อม",
  done: "ปิดงาน",
  complete: "เสร็จสิ้น",
};

export const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  reported: "แจ้งงานแล้ว",
  assessing: "กำลังประเมินงาน",
  accepted: "ช่างรับงานแล้ว",
  forwarded: "ส่งต่อ",
  "in-progress": "กำลังดำเนินการ",
  "waiting-parts": "รออะไหล่",
  closed: "ปิดงาน",
  finished: "เสร็จสิ้น",
};

export const CATEGORY_LABEL: Record<WorkCategory, string> = {
  "electrical-control": "ไฟฟ้า / ระบบควบคุม",
  electrical: "ไฟฟ้า",
  mechanical: "เครื่องกล",
  "pneumatic-hydraulic": "ระบบลม / ไฮดรอลิก",
  "lubrication-fluid": "ระบบหล่อลื่น / ของไหล",
  other: "อื่น ๆ",
  facility: "อาคาร/สิ่งอำนวย",
  plumbing: "ประปา",
  it: "ไอที",
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

export const PRIORITY_RANK: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export interface Technician {
  technician_id: string;
  name: string;
  department: string;
}

export const TECHNICIAN_MAP: Record<string, Technician> = {
  TECH001: {
    technician_id: "TECH001",
    name: "สมศักดิ์ ช่างไฟ",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH002: {
    technician_id: "TECH002",
    name: "วิษณุ ช่างกล",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH003: {
    technician_id: "TECH003",
    name: "สุรพล ช่างประปา",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH004: {
    technician_id: "TECH004",
    name: "อานนท์ ช่างแอร์ (HVAC)",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH005: {
    technician_id: "TECH005",
    name: "นครินทร์ ช่างอิเล็กทรอนิกส์ & PLC",
    department: "ฝ่ายซ่อมบำรุง",
  },
  TECH006: {
    technician_id: "TECH006",
    name: "เกรียงไกร ช่างเชื่อม & โครงสร้าง",
    department: "งานโครงสร้างและโลหะ",
  },
  TECH007: { technician_id: "TECH007", name: "ไพศาล ช่างทั่วไป", department: "งานบริการอาคาร" },
  TECH008: { technician_id: "TECH008", name: "ธนวัฒน์ ช่างเครื่องจักร", department: "งานซ่อมบำรุงเครื่องจักร" },
  TECH009: { technician_id: "TECH009", name: "ชัยวัฒน์ ช่างก่อสร้าง", department: "งานโยธาและก่อสร้าง" },
  TECH010: { technician_id: "TECH010", name: "วินัย ช่างสี", department: "งานสีและเคลือบผิว" },
  TECH011: { technician_id: "TECH011", name: "กิตติศักดิ์ ช่างยนต์", department: "งานยานพาหนะและโฟล์กลิฟต์" },
  TECH012: { technician_id: "TECH012", name: "ประเสริฐ ช่างไฮดรอลิก", department: "งานระบบไฮดรอลิก" },
  TECH013: { technician_id: "TECH013", name: "ธีรพงษ์ ช่างนิวแมติกส์", department: "งานระบบนิวแมติกส์" },
  TECH014: { technician_id: "TECH014", name: "ชาญชัย ช่างแอร์", department: "งานระบบปรับอากาศ" },
  TECH015: { technician_id: "TECH015", name: "อนุรักษ์ ช่างเครื่องเสียง", department: "งานระบบสื่อสาร" },
  TECH016: { technician_id: "TECH016", name: "วีระ ช่างไฟฟ้ากำลัง", department: "งานระบบไฟฟ้า" },
  TECH017: { technician_id: "TECH017", name: "ภานุวัฒน์ ช่างกลโรงงาน", department: "งานระบบเครื่องกล" },
  TECH018: { technician_id: "TECH018", name: "อุดม ช่างบำรุงรักษา", department: "งานบำรุงรักษาเชิงป้องกัน" },
  TECH019: { technician_id: "TECH019", name: "ศักดิ์ดา ช่างโลหะ", department: "งานโครงสร้างและโลหะ" },
  TECH020: { technician_id: "TECH020", name: "นเรศ ช่างเครน & ลิฟต์", department: "งานระบบลำเลียง" },
  TECH021: { technician_id: "TECH021", name: "สมคิด ช่างเน็ตเวิร์ก", department: "งานระบบเทคโนโลยี" },
  TECH022: { technician_id: "TECH022", name: "ทรงพล ช่าง PLC", department: "งานระบบอัตโนมัติ" },
  TECH023: { technician_id: "TECH023", name: "ยุทธนา ช่างระบบบำบัด", department: "งานระบบสุขาภิบาล" },
  TECH024: { technician_id: "TECH024", name: "พิพัฒน์ ช่างความปลอดภัย", department: "งานความปลอดภัย" },
};

export * from "./teamMockData.ts";

export function addTechnician(tech: Technician) {
  TECHNICIAN_MAP[tech.technician_id] = tech;
}

export function getTechnicianName(technicianId: string | null | undefined): string {
  if (!technicianId) return "-";
  return TECHNICIAN_MAP[technicianId]?.name || technicianId;
}

export function getTechnicianDepartment(technicianId: string | null | undefined): string {
  if (!technicianId) return "-";
  return TECHNICIAN_MAP[technicianId]?.department || "-";
}

// ─── Spare Part Request (ช่างขออะไหล่) ───────────────────────────────────────

export type SparePartRequestStatus = "pending" | "approved" | "rejected" | "ordered" | "received";

export interface SparePartRequest {
  sr_id: string;
  request_id: string;        // เชื่อมกับ WorkRequest
  asset_name: string;
  part_id: string;
  part_name: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  requested_by: string;      // technician_id
  requested_by_name: string;
  requested_at: string;
  status: SparePartRequestStatus;
  urgency: "normal" | "urgent" | "critical";
  reason: string;
  approved_by?: string;
  approved_at?: string;
  po_number?: string;
  reject_reason?: string;
}

export const MOCK_SPARE_PART_REQUESTS: SparePartRequest[] = [
  {
    sr_id: "SR-2026-001",
    request_id: "REQ-20260421-022",
    asset_name: "MCH-CNC-12",
    part_id: "SP-ELC-220",
    part_name: "คอนแทคเตอร์ 3P 40A",
    quantity: 2,
    unit: "ตัว",
    unit_price: 890,
    requested_by: "TECH001",
    requested_by_name: "สมศักดิ์ ช่างไฟ",
    requested_at: _d(10),
    status: "pending",
    urgency: "urgent",
    reason: "คอนแทคเตอร์ไหม้ ต้องเปลี่ยนเพื่อให้เครื่องกลับมาทำงานได้",
  },
  {
    sr_id: "SR-2026-002",
    request_id: "REQ-20260422-001",
    asset_name: "MCH-PR-2041",
    part_id: "SP-HYD-022",
    part_name: "ท่อไฮดรอลิก HP 3/8\" (1m)",
    quantity: 3,
    unit: "เมตร",
    unit_price: 950,
    requested_by: "TECH002",
    requested_by_name: "วิษณุ ช่างกล",
    requested_at: _d(8),
    status: "approved",
    urgency: "urgent",
    reason: "ท่อรั่วซึม กระทบการผลิต Line 3",
    approved_by: "ADMIN001",
    approved_at: _d(6),
    po_number: "PO-2026-0512",
  },
  {
    sr_id: "SR-2026-003",
    request_id: "REQ-20260421-014",
    asset_name: "CNV-ASSY-08",
    part_id: "SP-BLT-045",
    part_name: "สายพาน V-Belt A-42",
    quantity: 5,
    unit: "เส้น",
    unit_price: 780,
    requested_by: "TECH002",
    requested_by_name: "วิษณุ ช่างกล",
    requested_at: _d(30),
    status: "received",
    urgency: "normal",
    reason: "สายพานเก่าเริ่มหย่อน ควรเปลี่ยนก่อนขาด",
    approved_by: "ADMIN001",
    approved_at: _d(28),
    po_number: "PO-2026-0489",
  },
  {
    sr_id: "SR-2026-004",
    request_id: "REQ-20260422-002",
    asset_name: "ELC-DB-5510",
    part_id: "SP-ELC-112",
    part_name: "เบรกเกอร์ 3P 100A",
    quantity: 2,
    unit: "ตัว",
    unit_price: 1250,
    requested_by: "TECH001",
    requested_by_name: "สมศักดิ์ ช่างไฟ",
    requested_at: _d(2),
    status: "pending",
    urgency: "critical",
    reason: "เบรกเกอร์ทริปบ่อย มีกลิ่นไหม้ ต้องเปลี่ยนทันที",
  },
  {
    sr_id: "SR-2026-005",
    request_id: "REQ-20260421-014",
    asset_name: "CNV-ASSY-08",
    part_id: "SP-SNS-099",
    part_name: "เซ็นเซอร์ Proximity Inductive 12mm",
    quantity: 1,
    unit: "ตัว",
    unit_price: 1650,
    requested_by: "TECH001",
    requested_by_name: "สมศักดิ์ ช่างไฟ",
    requested_at: _d(5),
    status: "ordered",
    urgency: "normal",
    reason: "เซ็นเซอร์ตรวจจับตำแหน่งเสีย ส่งผลให้สายพานหยุดทำงาน",
    approved_by: "ADMIN001",
    approved_at: _d(4),
    po_number: "PO-2026-0510",
  },
];

// ─── Purchase Order ────────────────────────────────────────────────────────────

export type POStatus = "pending" | "approved" | "rejected" | "ordered";

export interface PurchaseOrder {
  po_id: string;
  sr_ids: string[];
  items: { part_name: string; quantity: number; unit: string; unit_price: number }[];
  total_amount: number;
  requested_by: string;
  requested_by_name: string;
  requested_at: string;
  status: POStatus;
  approved_by?: string;
  approved_at?: string;
  reject_reason?: string;
  supplier?: string;
  note?: string;
}

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    po_id: "PO-2026-0515",
    sr_ids: ["SR-2026-001", "SR-2026-004"],
    items: [
      { part_name: "คอนแทคเตอร์ 3P 40A", quantity: 2, unit: "ตัว", unit_price: 890 },
      { part_name: "เบรกเกอร์ 3P 100A", quantity: 2, unit: "ตัว", unit_price: 1250 },
    ],
    total_amount: 4280,
    requested_by: "ADMIN001",
    requested_by_name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    requested_at: _d(1),
    status: "pending",
    supplier: "Schneider Electric TH",
    note: "งานวิกฤติ ต้องการเร่งด่วน",
  },
  {
    po_id: "PO-2026-0512",
    sr_ids: ["SR-2026-002"],
    items: [
      { part_name: "ท่อไฮดรอลิก HP 3/8\" (1m)", quantity: 3, unit: "เมตร", unit_price: 950 },
    ],
    total_amount: 2850,
    requested_by: "ADMIN001",
    requested_by_name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    requested_at: _d(6),
    status: "approved",
    approved_by: "EXEC001",
    approved_at: _d(5),
    supplier: "Parker Hannifin TH",
  },
  {
    po_id: "PO-2026-0489",
    sr_ids: ["SR-2026-003"],
    items: [
      { part_name: "สายพาน V-Belt A-42", quantity: 5, unit: "เส้น", unit_price: 780 },
    ],
    total_amount: 3900,
    requested_by: "ADMIN001",
    requested_by_name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    requested_at: _d(29),
    status: "ordered",
    approved_by: "EXEC001",
    approved_at: _d(28),
    supplier: "Gates Corporation TH",
  },
];

export type UserRole = "technician" | "pm" | "admin" | "executive" | "requester" | "superadmin";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface UserApprovalRequest {
  approval_id: string;
  name: string;
  emp_id: string;
  department: string;
  position: string;
  role_requested: UserRole;
  requested_at: string;
  status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  reject_reason?: string;
  note?: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  technician: "ช่างซ่อมบำรุง",
  pm: "ผู้วางแผน PM",
  admin: "ผู้ดูแลระบบ",
  executive: "ผู้บริหาร",
  requester: "ผู้แจ้งซ่อม",
  superadmin: "Superadmin",
};

export const MOCK_USER_APPROVAL_REQUESTS: UserApprovalRequest[] = [
  {
    approval_id: "APV-2026-001",
    name: "ชาญณรงค์ มั่นคง",
    emp_id: "EMP-1045",
    department: "ฝ่ายซ่อมบำรุง",
    position: "ช่างไฟฟ้า",
    role_requested: "technician",
    requested_at: _d(2),
    status: "pending",
    note: "โอนย้ายมาจากสาขาอยุธยา",
  },
  {
    approval_id: "APV-2026-003",
    name: "ธนกฤต วิทยากร",
    emp_id: "EMP-0892",
    department: "ฝ่ายซ่อมบำรุง",
    position: "หัวหน้าช่าง",
    role_requested: "admin",
    requested_at: _d(7),
    status: "pending",
    note: "ขอสิทธิ์ Admin เพิ่มเพื่อจัดการตาราง PM",
  },
  {
    approval_id: "APV-2026-004",
    name: "วรรณิศา ทองดี",
    emp_id: "EMP-1100",
    department: "ฝ่ายผลิต",
    position: "พนักงานผลิต",
    role_requested: "requester",
    requested_at: _d(1),
    status: "approved",
    approved_by: "ผู้บริหาร",
    approved_at: _d(0.5),
  },
  {
    approval_id: "APV-2026-005",
    name: "อภิวัฒน์ สมหวัง",
    emp_id: "EMP-0750",
    department: "ฝ่ายซ่อมบำรุง",
    position: "ช่างกล",
    role_requested: "technician",
    requested_at: _d(14),
    status: "rejected",
    reject_reason: "ยังไม่ผ่านการอบรมภายใน",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
export type UserStatus = "active" | "inactive" | "suspended";

export interface SystemUser {
  user_id: string;
  emp_id: string;
  name: string;
  username: string;
  department: string;
  position: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  phone: string;
  created_at: string;
  last_login: string;
  skills?: string[];
}

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  active: "ใช้งาน",
  inactive: "ไม่ได้ใช้งาน",
  suspended: "ระงับ",
};

export const MOCK_SYSTEM_USERS: SystemUser[] = [
  {
    user_id: "USR-001",
    emp_id: "SA001",
    name: "ระบบ Superadmin",
    username: "superadmin",
    department: "IT",
    position: "System Administrator",
    role: "superadmin",
    status: "active",
    email: "superadmin@fixflow.co.th",
    phone: "081-000-0000",
    created_at: "2026-01-01T00:00:00.000Z",
    last_login: _d(0.1),
  },
  {
    user_id: "USR-002",
    emp_id: "TECH001",
    name: "สมศักดิ์ ช่างไฟ",
    username: "somsak.t",
    department: "Maintenance",
    position: "ช่างไฟฟ้า",
    role: "technician",
    status: "active",
    email: "somsak.t@fixflow.co.th",
    phone: "081-111-1111",
    created_at: "2026-02-15T08:00:00.000Z",
    last_login: _d(0.2),
    skills: ["electrical", "facility"],
  },
  {
    user_id: "USR-003",
    emp_id: "TECH002",
    name: "ชาญชัย เครื่องกล",
    username: "chanchai.k",
    department: "Maintenance",
    position: "ช่างกล",
    role: "technician",
    status: "active",
    email: "chanchai.k@fixflow.co.th",
    phone: "081-222-2222",
    created_at: "2026-02-20T08:00:00.000Z",
    last_login: _d(0.5),
    skills: ["mechanical", "pneumatic-hydraulic"],
  },
  {
    user_id: "USR-004",
    emp_id: "TECH003",
    name: "วิชัย หล่อลื่น",
    username: "wichai.l",
    department: "Maintenance",
    position: "ช่างหล่อลื่น",
    role: "technician",
    status: "active",
    email: "wichai.l@fixflow.co.th",
    phone: "081-333-3333",
    created_at: "2026-03-01T08:00:00.000Z",
    last_login: _d(1),
    skills: ["lubrication-fluid", "mechanical"],
  },
  {
    user_id: "USR-005",
    emp_id: "REQ042",
    name: "นภดล ฝ่ายผลิต",
    username: "nophon.r",
    department: "ฝ่ายผลิต",
    position: "พนักงานผลิต",
    role: "requester",
    status: "active",
    email: "nophon.r@fixflow.co.th",
    phone: "081-444-4444",
    created_at: "2026-03-10T08:00:00.000Z",
    last_login: _d(0.3),
  },
  {
    user_id: "USR-006",
    emp_id: "ADMIN001",
    name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    username: "admin",
    department: "Management",
    position: "ผู้จัดการฝ่าย",
    role: "admin",
    status: "active",
    email: "admin@fixflow.co.th",
    phone: "081-555-5555",
    created_at: "2026-01-15T08:00:00.000Z",
    last_login: _d(0.1),
  },
  {
    user_id: "USR-007",
    emp_id: "PM001",
    name: "ผู้วางแผน PM",
    username: "pm",
    department: "ฝ่ายซ่อมบำรุง",
    position: "ผู้วางแผนบำรุงรักษา",
    role: "pm",
    status: "active",
    email: "",
    phone: "081-666-6666",
    created_at: "2026-01-20T08:00:00.000Z",
    last_login: _d(0.4),
  },
  {
    user_id: "USR-008",
    emp_id: "EXEC001",
    name: "ผู้บริหาร",
    username: "executive",
    department: "Executive",
    position: "ผู้อำนวยการโรงงาน",
    role: "executive",
    status: "active",
    email: "exec@fixflow.co.th",
    phone: "081-777-7777",
    created_at: "2026-01-10T08:00:00.000Z",
    last_login: _d(0.2),
  },
  {
    user_id: "USR-009",
    emp_id: "EMP-0750",
    name: "อภิวัฒน์ สมหวัง",
    username: "aphiwat.s",
    department: "ฝ่ายซ่อมบำรุง",
    position: "ช่างกล",
    role: "technician",
    status: "suspended",
    email: "aphiwat.s@fixflow.co.th",
    phone: "081-888-8888",
    created_at: "2025-11-01T08:00:00.000Z",
    last_login: _d(14),
    skills: ["mechanical"],
  },
  {
    user_id: "USR-010",
    emp_id: "EMP-1200",
    name: "สมพร พักผ่อน",
    username: "somporn.p",
    department: "ฝ่ายผลิต",
    position: "พนักงานผลิต",
    role: "requester",
    status: "inactive",
    email: "somporn.p@fixflow.co.th",
    phone: "081-999-9999",
    created_at: "2025-08-01T08:00:00.000Z",
    last_login: _d(60),
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ─── Superadmin Audit Logs & Master Data ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "OVERRIDE" | "APPROVE" | "REJECT" | "LOGIN" | "STOCK_ADJUST";
export type AuditEntity = "WORK_REQUEST" | "USER" | "SPARE_PART" | "PO" | "USER_APPROVAL" | "SYSTEM_SETTING";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: UserRole;
  action: AuditAction;
  entity: AuditEntity;
  entity_id: string;
  details: string;
  ip_address: string;
}

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "LOG-1029",
    timestamp: _d(0.05),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "LOGIN",
    entity: "USER",
    entity_id: "USR-001",
    details: "เข้าสู่ระบบผ่าน Web Console (IP: 192.168.1.184)",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1028",
    timestamp: _d(0.3),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "OVERRIDE",
    entity: "WORK_REQUEST",
    entity_id: "WR-2026-004",
    details: "Force Assign งานให้ช่าง: เกรียงไกร ช่างเชื่อม (TECH002) และปรับสถานะเป็น doing",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1027",
    timestamp: _d(0.8),
    user_name: "ผู้บริหาร",
    user_role: "executive",
    action: "APPROVE",
    entity: "PO",
    entity_id: "PO-2026-088",
    details: "อนุมัติใบสั่งซื้อลูกปืน SKF 6205-2RSH จำนวน 10 ชิ้น ยอดเงิน 18,500 บาท",
    ip_address: "192.168.1.45",
  },
  {
    id: "LOG-1026",
    timestamp: _d(1.2),
    user_name: "ผู้จัดการฝ่ายซ่อมบำรุง",
    user_role: "admin",
    action: "UPDATE",
    entity: "SPARE_PART",
    entity_id: "SP-002",
    details: "เบิกจ่ายอะไหล่ ซีลกันน้ำมัน Viton 35x50x8 จำนวน 2 ชิ้น งาน WR-2026-001",
    ip_address: "192.168.1.102",
  },
  {
    id: "LOG-1025",
    timestamp: _d(1.9),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "STOCK_ADJUST",
    entity: "SPARE_PART",
    entity_id: "SP-001",
    details: "ปรับยอดตรวจนับคงคลังประจำสัปดาห์ จาก 8 เป็น 14 ชิ้น (เหตุผล: ตรวจนับสต็อกจริง)",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1024",
    timestamp: _d(2.4),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "CREATE",
    entity: "USER",
    entity_id: "USR-011",
    details: "สร้างผู้ใช้งานใหม่: ชัชวาลย์ เทคโน (TECH004) สิทธิ์ technician",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1023",
    timestamp: _d(3.1),
    user_name: "ผู้บริหาร",
    user_role: "executive",
    action: "APPROVE",
    entity: "USER_APPROVAL",
    entity_id: "UA-002",
    details: "อนุมัติสิทธิ์การเข้าใช้งานระบบสำหรับ: ธวัชชัย มั่นคง แผนกซ่อมบำรุง",
    ip_address: "192.168.1.45",
  },
  {
    id: "LOG-1022",
    timestamp: _d(4.5),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "UPDATE",
    entity: "SYSTEM_SETTING",
    entity_id: "CFG-SLA",
    details: "ปรับปรุงค่า SLA งานวิกฤติ (Critical) จาก 3.0 ชม. เป็น 2.0 ชม.",
    ip_address: "192.168.1.184",
  },
  {
    id: "LOG-1021",
    timestamp: _d(5.2),
    user_name: "นภดล ฝ่ายผลิต",
    user_role: "requester",
    action: "CREATE",
    entity: "WORK_REQUEST",
    entity_id: "WR-2026-006",
    details: "เปิดใบแจ้งซ่อมใหม่: สายพานลำเลียง C3 หยุดทำงานกะทันหัน",
    ip_address: "192.168.2.14",
  },
  {
    id: "LOG-1020",
    timestamp: _d(6.0),
    user_name: "ระบบ Superadmin",
    user_role: "superadmin",
    action: "DELETE",
    entity: "WORK_REQUEST",
    entity_id: "WR-2026-003",
    details: "ยกเลิกงานซ่อมซ้ำซ้อนตามคำขอของหัวหน้าฝ่ายผลิต",
    ip_address: "192.168.1.184",
  },
];

export interface SystemMachineMaster {
  id: string;
  code: string;
  name: string;
  zone: string;
  building: string;
  line: string;
  status: "unknown" | "operational" | "warning" | "down" | "maintenance";
  critical_level: "unknown" | "high" | "medium" | "low";
  installed_date: string;
}

export const MOCK_MACHINES_MASTER: SystemMachineMaster[] = machines.map((machine) => ({
  id: machine.id,
  code: machine.code,
  name: machine.name,
  zone: machine.location,
  building: "",
  line: "",
  status: "unknown",
  critical_level: "unknown",
  installed_date: "",
}));

export interface SystemSettingsConfig {
  company_name: string;
  maintenance_email: string;
  monthly_budget: number;
  po_manager_limit: number;
  po_exec_limit: number;
  sla_critical_hours: number;
  sla_high_hours: number;
  sla_normal_hours: number;
  sla_low_hours: number;
  auto_escalation: boolean;
  line_notify_enabled: boolean;
  email_notify_enabled: boolean;
}

export const MOCK_SYSTEM_CONFIG: SystemSettingsConfig = {
  company_name: "FixFlow Precision Engineering Co., Ltd.",
  maintenance_email: "maintenance-alert@fixflow.co.th",
  monthly_budget: 80000,
  po_manager_limit: 10000,
  po_exec_limit: 50000,
  sla_critical_hours: 2,
  sla_high_hours: 8,
  sla_normal_hours: 24,
  sla_low_hours: 72,
  auto_escalation: true,
  line_notify_enabled: true,
  email_notify_enabled: true,
};

