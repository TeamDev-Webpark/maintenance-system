import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestStore } from "@/lib/requestStore";
import { machines, today, type Plan } from "./data";
import { MachinePicker } from "./ui";
import { addInspectionRecord, assessCell, frequencies, inspectionSections, sendInspectionEmail, shifts, type InspectionColumn, type InspectionRecord, type InspectionTemplate } from "./inspectionData";

const hours = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, "0")}:00`);

function CellInput({ column, value, label, invalid, change }: {
  column: InspectionColumn;
  value: string;
  label: string;
  invalid: boolean;
  change: (value: string) => void;
}) {
  const props = { "aria-label": label, "aria-invalid": invalid || undefined, required: column.required };
  if (column.type === "checkbox") {
    return <input {...props} className="h-5 w-5 accent-primary" type="checkbox" checked={value === "yes"} onChange={(event) => change(event.target.checked ? "yes" : "no")} />;
  }
  if (column.type === "pass_fail" || column.type === "dropdown") {
    const options = column.type === "pass_fail" ? [["pass", "ผ่าน"], ["fail", "ไม่ผ่าน"]] : (column.options ?? []).map((item) => [item, item]);
    return <select {...props} className="w-full min-w-0" value={value} onChange={(event) => change(event.target.value)}>
      <option value="">เลือกผล</option>
      {options.map(([key, text]) => <option value={key} key={key}>{text}</option>)}
    </select>;
  }
  return <input {...props} className="w-full min-w-0" type={column.type === "number" ? "number" : "text"} step={column.type === "number" ? "any" : undefined}
    inputMode={column.type === "number" ? "decimal" : undefined} maxLength={300} value={value} onChange={(event) => change(event.target.value)} />;
}

export function InspectionEntry({ template, plan, inspector, inspectorId, onSave, onClose }: {
  template: InspectionTemplate;
  plan?: Plan;
  inspector: string;
  inspectorId?: string;
  onSave: (id: string) => void;
  onClose: () => void;
}) {
  const [machineId, setMachineId] = useState("");
  const [date, setDate] = useState(plan?.date || today());
  const [hour, setHour] = useState(() => `${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", hourCycle: "h23" }).format(new Date())}:00`);
  const [shift, setShift] = useState<(typeof shifts)[number]>("A");
  const [inspectorName, setInspectorName] = useState(inspector);
  const [note, setNote] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const sections = inspectionSections(template.items);
  const section = sections[sectionIndex];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const machine = machines.find((item) => item.id === machineId);
    if (!plan && !machine) return;
    const cells = sections.flatMap(({ items }, page) => items.flatMap((item) => template.columns.map((column) => {
      const value = values[`${item.item_id}:${column.col_id}`] ?? (column.type === "checkbox" ? "no" : "");
      return {
        page, missing: column.required && (column.type === "checkbox" ? value !== "yes" : !value.trim()),
        cell: { ...assessCell(column, item.topic, value), group: item.group },
      };
    })));
    const firstMissing = cells.find(({ missing }) => missing);
    if (!inspectorName.trim() || firstMissing) {
      if (firstMissing) setSectionIndex(firstMissing.page);
      toast.error("กรุณากรอกช่องที่จำเป็นให้ครบ");
      return;
    }
    const hasFailure = cells.some(({ cell }) => cell.failed);
    const record: InspectionRecord = {
      id: crypto.randomUUID(), templateId: template.template_id, templateName: template.name,
      machineKey: plan ? plan.machineId || plan.code || plan.id : machineId,
      machineName: plan ? [plan.code, plan.name].filter(Boolean).join(" · ") : (machine?.name || machine?.code || machineId),
      location: (plan?.location || machine?.location) ?? "", planId: plan?.id, date,
      period: template.frequency === "hourly" ? hour : template.frequency === "per_shift" ? shift : "",
      frequency: template.frequency, priority: template.priority, inspector: inspectorName.trim(), inspectorId,
      submittedAt: new Date().toISOString(), cells: cells.map(({ cell }) => cell), note: note.trim(),
      email: hasFailure && template.priority !== "medium" ? "pending" : undefined,
    };
    const result = addInspectionRecord(record);
    if (result !== "saved") {
      toast.error(result === "duplicate" ? "มีผลตรวจสำหรับเครื่องและรอบนี้แล้ว" : "บันทึกผลตรวจลงเบราว์เซอร์ไม่สำเร็จ");
      return;
    }
    if (hasFailure) {
      requestStore.syncPMChecksheets();
      toast.warning("พบผลนอกเกณฑ์ ระบบเปิดใบแจ้งซ่อมแล้ว");
      void sendInspectionEmail(record);
    } else {
      toast.success("บันทึกผลตรวจแล้ว");
    }
    onSave(record.id);
  }

  return (
    <form className="form" onSubmit={submit}>
      <header className="page-heading"><h1>{template.name}</h1><p>{frequencies[template.frequency]}</p></header>
      <div className="panel space-y-3 p-4">
        {plan ? <p><strong>งาน PM</strong> {[plan.code, plan.name].filter(Boolean).join(" · ")}</p> : <MachinePicker value={machineId} onChange={setMachineId} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <label>ชื่อผู้ตรวจ<input required maxLength={120} value={inspectorName} onChange={(event) => setInspectorName(event.target.value)} /></label>
          <label>วันที่ตรวจ<input required type="date" min="2000-01-01" max="2099-12-31" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          {template.frequency === "hourly" && <label>ชั่วโมงตรวจ<select value={hour} onChange={(event) => setHour(event.target.value)}>
            {hours.map((item) => <option value={item} key={item}>{item}</option>)}
          </select></label>}
          {template.frequency === "per_shift" && <label>กะตรวจ<select value={shift} onChange={(event) => setShift(event.target.value as typeof shift)}>
            {shifts.map((item) => <option value={item} key={item}>กะ {item}</option>)}
          </select></label>}
        </div>
      </div>
      {sections.length > 1 && (
        <nav className="inspection-sheet-tabs" aria-label="ส่วนของตารางเช็กชีท">
          {sections.map((part, index) => <button className="inspection-sheet-tab" type="button" key={index}
            aria-pressed={index === sectionIndex} onClick={() => setSectionIndex(index)}>{part.name}</button>)}
        </nav>
      )}
      <div className="inspection-sheet-frame" tabIndex={0} aria-label="พื้นที่เลื่อนตารางเช็กชีท">
        <table aria-label="ตารางบันทึกผลตรวจ" className="inspection-sheet">
          <thead><tr><th scope="col">หัวข้อตรวจ</th>
            {template.columns.map((column) => <th scope="col" key={column.col_id}>{column.label}{column.required ? " *" : ""}</th>)}
          </tr></thead>
          <tbody>
            {section?.items.map((item) => (
              <tr key={item.item_id}>
                <th scope="row"><span className="inspection-row-number">{item.order}</span>{item.topic}</th>
                {template.columns.map((column) => {
                  const key = `${item.item_id}:${column.col_id}`;
                  const cell = assessCell(column, item.topic, values[key] ?? "");
                  return <td key={column.col_id} className="align-top">
                    <CellInput column={column} label={`${item.topic} / ${column.label}`} value={values[key] ?? ""} invalid={cell.failed}
                      change={(value) => setValues((previous) => ({ ...previous, [key]: value }))} />
                    {cell.criterion && <span className={cell.failed ? "mt-1 block text-xs font-semibold text-destructive" : "muted mt-1 block"}>
                      {cell.failed ? "นอกเกณฑ์ · " : ""}เกณฑ์ {cell.criterion}
                    </span>}
                    {!cell.criterion && column.type === "number" && column.unit && <span className="muted mt-1 block">{column.unit}</span>}
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sections.length > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" disabled={sectionIndex === 0} onClick={() => setSectionIndex(sectionIndex - 1)}>ส่วนก่อนหน้า</Button>
          <span className="muted">{sectionIndex + 1} / {sections.length}</span>
          <Button type="button" variant="outline" disabled={sectionIndex === sections.length - 1} onClick={() => setSectionIndex(sectionIndex + 1)}>ส่วนถัดไป</Button>
        </div>
      )}
      <label>หมายเหตุ<textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button type="submit">บันทึกผลตรวจ</Button>
      </div>
    </form>
  );
}
