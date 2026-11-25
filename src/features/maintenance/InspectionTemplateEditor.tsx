import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { alertPriorities, columnTypes, frequencies, saveInspectionTemplate, type InspectionColumn, type InspectionTemplate } from "./inspectionData";

type ColumnDraft = Omit<InspectionColumn, "min" | "max" | "options"> & { min: string; max: string; choices: string };

export function InspectionTemplateEditor({ template, author, onClose }: {
  template: InspectionTemplate | null;
  author: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [frequency, setFrequency] = useState<InspectionTemplate["frequency"]>(template?.frequency ?? "daily");
  const [priority, setPriority] = useState<InspectionTemplate["priority"]>(template?.priority ?? "high");
  const [items, setItems] = useState(() => template?.items ?? [{ item_id: crypto.randomUUID(), topic: "", order: 1 }]);
  const [columns, setColumns] = useState<ColumnDraft[]>(() => template?.columns.map((column) => ({
    ...column, min: column.min?.toString() ?? "", max: column.max?.toString() ?? "", choices: column.options?.join("\n") ?? "",
  })) ?? [{ col_id: crypto.randomUUID(), label: "ผลตรวจ", type: "pass_fail", required: true, min: "", max: "", choices: "" }]);

  function patchColumn(id: string, patch: Partial<ColumnDraft>) {
    setColumns((previous) => previous.map((item) => item.col_id === id ? { ...item, ...patch } : item));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || items.some((item) => !item.topic.trim()) || columns.some((column) => !column.label.trim())) {
      toast.error("กรุณากรอกชื่อแบบฟอร์ม หัวข้อ และชื่อคอลัมน์ให้ครบ");
      return;
    }
    const normalized = columns.map(({ min, max, choices, ...column }): InspectionColumn => ({
      ...column, label: column.label.trim(),
      unit: column.type === "number" ? column.unit?.trim() : undefined,
      min: column.type === "number" && min !== "" ? Number(min) : undefined,
      max: column.type === "number" && max !== "" ? Number(max) : undefined,
      options: column.type === "dropdown" ? [...new Set(choices.split("\n").map((choice) => choice.trim()).filter(Boolean))] : undefined,
    }));
    const invalid = normalized.find((column) =>
      (column.type === "dropdown" && !column.options?.length) ||
      (column.min !== undefined && column.max !== undefined && column.min > column.max),
    );
    if (invalid) {
      toast.error(`ตรวจสอบตัวเลือกหรือช่วงค่ามาตรฐานของคอลัมน์ “${invalid.label}”`);
      return;
    }
    const now = new Date().toISOString();
    const saved = saveInspectionTemplate({
      template_id: template?.template_id ?? crypto.randomUUID(),
      name: name.trim(), description: description.trim(), frequency, priority,
      items: items.map((item, index) => ({ ...item, order: index + 1, topic: item.topic.trim(), group: item.group?.trim() || undefined })),
      columns: normalized, active: true, created_by: template?.created_by ?? author,
      created_at: template?.created_at ?? now, updated_at: now,
    });
    if (!saved) {
      toast.error("บันทึก Template ลงเบราว์เซอร์ไม่สำเร็จ");
      return;
    }
    toast.success("บันทึก Template แล้ว");
    onClose();
  }

  return (
    <form className="form space-y-3" onSubmit={submit}>
      <h1>{template ? "แก้ไข Template เช็กชีท" : "สร้าง Template เช็กชีท"}</h1>
      <div className="panel space-y-3 p-4">
        <label>ชื่อ Template<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>คำอธิบาย<textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>รอบตรวจ<select value={frequency} onChange={(event) => setFrequency(event.target.value as InspectionTemplate["frequency"])}>
            {Object.entries(frequencies).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select></label>
          <label>ระดับใบแจ้งซ่อมเมื่อพบนอกเกณฑ์<select value={priority} onChange={(event) => setPriority(event.target.value as InspectionTemplate["priority"])}>
            {Object.entries(alertPriorities).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select></label>
        </div>
      </div>
      <section className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2>หัวข้อตรวจ</h2>
          <Button type="button" variant="outline" onClick={() => setItems((previous) => [...previous, { item_id: crypto.randomUUID(), topic: "", order: previous.length + 1 }])}><Plus className="mr-1 h-4 w-4" /> เพิ่มหัวข้อ</Button>
        </div>
        {items.map((item, index) => (
          <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]" key={item.item_id}>
            <label className="min-w-0 flex-1">หัวข้อ {index + 1}<input required maxLength={120} value={item.topic} onChange={(event) => setItems((previous) => previous.map((row) => row.item_id === item.item_id ? { ...row, topic: event.target.value } : row))} /></label>
            <label className="min-w-0">หมวดหัวข้อ {index + 1}<input maxLength={70} value={item.group ?? ""} onChange={(event) => setItems((previous) => previous.map((row) => row.item_id === item.item_id ? { ...row, group: event.target.value } : row))} /></label>
            <Button type="button" size="icon" variant="outline" aria-label={`ลบหัวข้อ ${index + 1}`} disabled={items.length === 1} onClick={() => setItems((previous) => previous.filter((row) => row.item_id !== item.item_id))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </section>
      <section className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2>คอลัมน์</h2>
          <Button type="button" variant="outline" onClick={() => setColumns((previous) => [...previous, { col_id: crypto.randomUUID(), label: "", type: "text", required: false, min: "", max: "", choices: "" }])}><Plus className="mr-1 h-4 w-4" /> เพิ่มคอลัมน์</Button>
        </div>
        {columns.map((column, index) => (
          <fieldset className="space-y-3" key={column.col_id}>
            <legend>คอลัมน์ {index + 1}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label>ชื่อคอลัมน์ {index + 1}<input required maxLength={120} value={column.label} onChange={(event) => patchColumn(column.col_id, { label: event.target.value })} /></label>
              <label>ชนิดข้อมูลคอลัมน์ {index + 1}<select value={column.type} onChange={(event) => patchColumn(column.col_id, { type: event.target.value as InspectionColumn["type"] })}>
                {Object.entries(columnTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select></label>
            </div>
            {column.type === "number" && (
              <div className="grid gap-2 sm:grid-cols-3">
                <label>ค่าต่ำสุด<input type="number" step="any" value={column.min} onChange={(event) => patchColumn(column.col_id, { min: event.target.value })} /></label>
                <label>ค่าสูงสุด<input type="number" step="any" value={column.max} onChange={(event) => patchColumn(column.col_id, { max: event.target.value })} /></label>
                <label>หน่วย<input maxLength={30} value={column.unit ?? ""} onChange={(event) => patchColumn(column.col_id, { unit: event.target.value })} /></label>
              </div>
            )}
            {column.type === "dropdown" && <label>ตัวเลือก (หนึ่งรายการต่อบรรทัด)<textarea required rows={3} value={column.choices} onChange={(event) => patchColumn(column.col_id, { choices: event.target.value })} /></label>}
            <div className="flex items-center justify-between gap-2">
              <label className="flex-row items-center"><input type="checkbox" checked={column.required} onChange={(event) => patchColumn(column.col_id, { required: event.target.checked })} /> ต้องกรอก</label>
              <Button type="button" size="icon" variant="outline" aria-label={`ลบคอลัมน์ ${index + 1}`} disabled={columns.length === 1} onClick={() => setColumns((previous) => previous.filter((item) => item.col_id !== column.col_id))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </fieldset>
        ))}
      </section>
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button type="submit">บันทึก Template</Button>
      </div>
    </form>
  );
}
