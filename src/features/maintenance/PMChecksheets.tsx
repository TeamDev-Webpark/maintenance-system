import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, ClipboardCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useRequest } from "@/lib/requestStore";
import { displayDate, usePlans } from "./data";
import { DataTable } from "./ui";
import { InspectionEntry } from "./InspectionEntry";
import { InspectionTemplateEditor } from "./InspectionTemplateEditor";
import { Planner } from "./Planner";
import inspectionExamples from "./inspection-examples.json";
import { alertPriorities, frequencies, inspectionRequestId, sendInspectionEmail, updateInspectionRecord, useInspections, type InspectionRecord, type InspectionTemplate } from "./inspectionData";

const roundLabel = (record: InspectionRecord) =>
  [displayDate(record.date), record.frequency === "per_shift" ? `กะ ${record.period}` : record.period].filter(Boolean).join(" · ");

const emailLabels = {
  pending: "รอส่งอีเมล",
  accepted: "ระบบส่งอีเมลรับรายการแล้ว",
  unconfigured: "รอตั้งค่าอีเมล",
  failed: "ส่งอีเมลไม่สำเร็จ",
};

function exampleTemplate(example: typeof inspectionExamples[number], author: string): InspectionTemplate {
  const now = new Date().toISOString();
  return {
    template_id: crypto.randomUUID(), name: example.name,
    description: `ตัวอย่างจาก Master Plan ปี 2569 · ${example.code} ${example.model} · ${example.location} · กระแสอ้างอิง ${example.current} A · ${example.rounds}`,
    frequency: "daily", priority: "medium", active: true, created_by: author, created_at: now, updated_at: now,
    items: example.items.map(({ topic, group }, index) => ({ item_id: crypto.randomUUID(), order: index + 1, topic, group })),
    columns: [
      { col_id: crypto.randomUUID(), label: "ผลตรวจ", type: "pass_fail", required: true },
      { col_id: crypto.randomUUID(), label: "ค่าที่วัด", type: "number", unit: "A", required: false },
      { col_id: crypto.randomUUID(), label: "หมายเหตุ", type: "text", required: false },
    ],
  };
}

export function PMPlanner() {
  const [params] = useSearchParams();
  const { templates, records } = useInspections();
  const byPlan = new Map<string, { id: string; count: number; failed: boolean }>();
  for (const record of records) {
    if (!record.planId) continue;
    const current = byPlan.get(record.planId);
    if (current) current.count++;
    else byPlan.set(record.planId, { id: record.id, count: 1, failed: record.cells.some((cell) => cell.failed) });
  }
  return <Planner machinePath="/pm/machines" focusPlanId={params.get("plan")}
    checksheets={{ byPlan, templates: templates.map((item) => ({ id: item.template_id, name: item.name })) }} />;
}

function RecordDetails({ record, onBack }: { record: InspectionRecord; onBack: () => void }) {
  const repair = useRequest(inspectionRequestId(record.id));
  return (
    <>
      <header className="page-heading heading-actions">
        <div><h1>{record.templateName}</h1><p>{record.machineName} · {roundLabel(record)}</p></div>
        <Button variant="outline" onClick={onBack}>กลับไปเช็กชีท</Button>
      </header>
      <section className="panel space-y-2 p-4">
        <p><strong>ผู้ตรวจ</strong> {record.inspector}</p>
        {record.planId && <Link className="text-link" to={`/pm/dashboard?plan=${encodeURIComponent(record.planId)}`}>เปิดงานในปฏิทิน PM</Link>}
        <p><strong>ผลตรวจ</strong> {record.cells.some((cell) => cell.failed) ? "พบค่านอกเกณฑ์" : "อยู่ในเกณฑ์"}</p>
        {repair && (
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2"><strong>ใบแจ้งซ่อม {repair.request_id}</strong><StatusBadge status={repair.status} /></div>
            <p>{repair.issue_summary}</p>
          </div>
        )}
        {record.note && <p><strong>หมายเหตุ</strong> {record.note}</p>}
      </section>
      <section className="panel">
        <DataTable rows={record.cells} rowKey={(cell) => String(record.cells.indexOf(cell))} label="ค่าที่บันทึกไว้" columns={[
          ...(record.cells.some((cell) => cell.group) ? [{ title: "หมวด", content: (cell: InspectionRecord["cells"][number]) => cell.group || "—" }] : []),
          { title: "หัวข้อ", content: (cell) => cell.topic },
          { title: "คอลัมน์", content: (cell) => cell.column },
          { title: "ค่าที่บันทึก", content: (cell) => <span className={cell.failed ? "font-semibold text-destructive" : ""}>{cell.value || "—"}</span> },
          { title: "เกณฑ์ขณะตรวจ", content: (cell) => cell.criterion || "—" },
        ]} />
      </section>
    </>
  );
}

export function PMChecksheets() {
  const [params, setParams] = useSearchParams();
  const { templates, records } = useInspections();
  const [plans] = usePlans();
  const [edit, setEdit] = useState<InspectionTemplate | null | undefined>();
  const user = JSON.parse(sessionStorage.getItem("fixflow_user") ?? "{}") ?? {};
  const inspector = String(user.name || "ผู้วางแผน PM");
  const planId = params.get("plan");
  const recordId = params.get("record");
  const templateId = params.get("template");
  const plan = planId ? plans.find((item) => item.id === planId) : undefined;
  const template = templates.find((item) => item.template_id === (planId ? plan?.templateId : templateId));
  const record = records.find((item) => item.id === recordId);
  const close = () => setParams({});

  if (edit !== undefined) return <InspectionTemplateEditor template={edit} author={inspector} onClose={() => setEdit(undefined)} />;
  if (record) return <RecordDetails record={record} onBack={close} />;
  if (template && (!planId || plan)) return <InspectionEntry key={`${template.template_id}:${planId ?? ""}`} template={template} plan={plan}
    inspector={inspector} inspectorId={user.emp_id} onSave={(id) => setParams({ record: id }, { replace: true })} onClose={close} />;

  return (
    <>
      <header className="page-heading heading-actions">
        <div><h1>เช็กชีท PM</h1><p>สร้างแบบฟอร์ม เลือกรอบตรวจ และบันทึกผลตามเกณฑ์</p></div>
        <Button type="button" className="gap-2" onClick={() => setEdit(null)}><Plus className="h-4 w-4" /> สร้าง Template</Button>
      </header>
      {(planId || templateId || recordId) && <p role="alert" className="mb-3 font-medium text-destructive">ค้นหารายการไม่พบ หรือยังไม่ได้ผูก Template กับงาน PM นี้</p>}
      <section className="panel p-4">
        <h2 className="mb-3">Template เช็กชีท</h2>
        {!templates.length && <p className="text-sm text-muted-foreground">ยังไม่มี Template เช็กชีท</p>}
        <div className="grid gap-3 xl:grid-cols-2">
          {templates.map((item) => (
            <article className="space-y-2 rounded-lg border p-3" key={item.template_id}>
              <h3 className="break-words text-base font-semibold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{frequencies[item.frequency]} · {item.items.length} หัวข้อ · {item.columns.length} คอลัมน์</p>
              {item.description && <p className="break-words text-sm">{item.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setEdit(item)}>แก้ไข Template</Button>
                <Button type="button" onClick={() => setParams({ template: item.template_id })} className="gap-2"><ClipboardCheck className="h-4 w-4" /> กรอกเช็กชีท</Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="panel space-y-3 p-4">
        <h2>ตัวอย่างจาก Master Plan ปี 2569</h2>
        <p className="muted">ข้อมูลเครื่องและรอบ PM มาจากแผน ส่วนหัวข้อตรวจและผลด้านล่างเป็นตัวอย่างสำหรับปรับใช้</p>
        {inspectionExamples.map((example) => (
          <details className="rounded-lg border p-3" key={example.code}>
            <summary className="cursor-pointer font-semibold">{example.tab} · {example.code} · {example.name}</summary>
            <p className="mt-2 text-sm">{example.asset} · {example.model} · {example.location}</p>
            <p className="muted mb-3">กระแสอ้างอิงในแผน {example.current} A · {example.rounds}</p>
            <div className="inspection-sheet-frame">
              <table className="inspection-sheet" aria-label={`ตัวอย่าง ${example.name}`}>
                <thead><tr><th scope="col">หัวข้อตรวจ</th><th scope="col">หมวด</th><th scope="col">ตัวอย่างผล</th></tr></thead>
                <tbody>
                  {example.items.map((item) => <tr key={item.topic}>
                    <th scope="row">{item.topic}</th><td>{item.group}</td><td>{item.example}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <Button className="mt-3" type="button" variant="outline" onClick={() => setEdit(exampleTemplate(example, inspector))}>ใช้ตัวอย่างนี้</Button>
          </details>
        ))}
      </section>
      <section className="panel">
        <div className="panel-header"><h2>ประวัติผลตรวจ</h2></div>
        <DataTable rows={records} rowKey={(item) => item.id} label="ประวัติผลตรวจ PM" columns={[
          { title: "รอบตรวจ", content: roundLabel },
          { title: "เช็กชีทและเครื่องจักร", content: (item) => <><strong>{item.templateName}</strong><span className="subline">{item.machineName}</span></> },
          { title: "ผู้ตรวจ", content: (item) => item.inspector },
          { title: "ผล", content: (item) => item.cells.some((cell) => cell.failed) ? "นอกเกณฑ์" : "อยู่ในเกณฑ์" },
          { title: "รายละเอียด", content: (item) => <button className="text-link" onClick={() => setParams({ record: item.id })}>ดูผลตรวจ</button> },
        ]} />
      </section>
    </>
  );
}

export function PMAlerts() {
  const { records } = useInspections();
  const [sendingId, setSendingId] = useState<string>();
  const alerts = records.filter((record) => record.cells.some((cell) => cell.failed));

  async function retry(record: InspectionRecord) {
    setSendingId(record.id);
    await sendInspectionEmail(record);
    setSendingId(undefined);
  }

  return (
    <>
      <header className="page-heading"><h1>แจ้งเตือน PM</h1><p>ผลตรวจนอกเกณฑ์และสถานะการส่งอีเมล</p></header>
      {!alerts.length && <section className="panel flex items-center gap-2 p-4"><Bell className="h-4 w-4" /> ยังไม่มีผลตรวจนอกเกณฑ์</section>}
      {alerts.map((record) => (
        <article className="panel space-y-2 p-4" key={record.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag warning">{alertPriorities[record.priority]}</span>
            {!record.read && <span className="tag cycle">ใหม่</span>}
            <h2>{record.templateName}</h2>
          </div>
          <p>{record.machineName} · {roundLabel(record)}</p>
          <p className="break-all text-sm">ใบแจ้งซ่อม {inspectionRequestId(record.id)}</p>
          {record.email && <p className="text-sm text-muted-foreground">{emailLabels[record.email]}</p>}
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link to={`/pm/checksheets?record=${record.id}`} onClick={() => updateInspectionRecord(record.id, { read: true })}>ดูผลตรวจและใบแจ้งซ่อม</Link></Button>
            {!record.read && <Button type="button" variant="outline" onClick={() => updateInspectionRecord(record.id, { read: true })}>ทำเครื่องหมายว่าอ่านแล้ว</Button>}
            {record.email && record.email !== "accepted" && <Button type="button" disabled={Boolean(sendingId)} onClick={() => void retry(record)}>{sendingId === record.id ? "กำลังส่ง" : "ส่งอีเมลอีกครั้ง"}</Button>}
          </div>
        </article>
      ))}
    </>
  );
}
