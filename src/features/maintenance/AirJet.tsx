import { useState, type FormEvent } from "react";
import { ChevronRight, ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { airJetForm, displayDate, matches, today, useDemoStorage } from "./data";
import { DataTable, Modal, SearchInput } from "./ui";

const results = {
  normal: "ปกติ",
  abnormal: "ผิดปกติ",
  repair: "ต้องซ่อม",
  inactive: "ไม่เปิดใช้งาน",
  holiday: "วันหยุด",
};

type Reading = { pressure: string; result: "" | keyof typeof results; note: string };
type AirJetRecord = {
  id: string;
  asset: string;
  location: string;
  date: string;
  readings: Record<string, Reading>;
  inspector: string;
  verifier: string;
  note: string;
};

const emptyReading: Reading = { pressure: "", result: "", note: "" };
const overLimit = (reading: Reading) => reading.pressure !== "" && Number(reading.pressure) > airJetForm.maxPressure;
const hasInput = (reading: Reading) => Boolean(reading.result || reading.pressure !== "" || reading.note.trim());

function AirJetEditor({ record, onSave, onClose }: {
  record: AirJetRecord | null;
  onSave: (record: AirJetRecord) => void;
  onClose: () => void;
}) {
  const [asset, setAsset] = useState(record?.asset ?? "");
  const [location, setLocation] = useState(record?.location ?? "");
  const [date, setDate] = useState(record?.date ?? today());
  const [inspector, setInspector] = useState(record?.inspector ?? "");
  const [verifier, setVerifier] = useState(record?.verifier ?? "");
  const [note, setNote] = useState(record?.note ?? "");
  const [readings, setReadings] = useState(record?.readings ?? {});

  function update(hour: string, patch: Partial<Reading>) {
    setReadings((previous) => ({ ...previous, [hour]: { ...(previous[hour] ?? emptyReading), ...patch } }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!asset.trim() || !inspector.trim()) {
      toast.error("กรุณาระบุหมายเลขเครื่องและชื่อผู้ตรวจสอบ");
      return;
    }
    const entries = Object.entries(readings).filter(([, reading]) => hasInput(reading));
    if (!entries.length || entries.some(([, reading]) => !reading.result)) {
      toast.error("กรุณาเลือกผลของทุกรอบที่กรอกข้อมูล อย่างน้อย 1 รอบ");
      return;
    }
    if (entries.some(([, reading]) => overLimit(reading) && reading.result !== "abnormal" && reading.result !== "repair")) {
      toast.error("รอบที่แรงดันเกินเกณฑ์ต้องบันทึกเป็นผิดปกติหรือต้องซ่อม");
      return;
    }
    onSave({ id: record?.id ?? crypto.randomUUID(), asset: asset.trim(), location: location.trim(), date,
      inspector: inspector.trim(), verifier: verifier.trim(), note: note.trim(), readings: Object.fromEntries(entries) });
  }

  return (
    <Modal title="บันทึก AIR JET FILTER" description={`${airJetForm.number} · Rev.${airJetForm.revision}`} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <label>วันที่เริ่มรอบตรวจ<input type="date" min="2000-01-01" max="2099-12-31" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>หมายเลขเครื่อง<input required value={asset} onChange={(event) => setAsset(event.target.value)} /></label>
          <label>สถานที่ตั้ง<input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          <label>ผู้ตรวจสอบ (Millhand)<input required value={inspector} onChange={(event) => setInspector(event.target.value)} /></label>
          <label>ผู้ทวนสอบ (Miller)<input value={verifier} onChange={(event) => setVerifier(event.target.value)} /></label>
        </div>
        <fieldset>
          <legend>ผลตรวจรายรอบ</legend>
          <p className="muted">ค่าแรงดันอ้างอิงไม่เกิน {airJetForm.maxPressure} mbar · รอบ 00:00–06:00 เป็นของวันถัดจากวันเริ่มรอบ</p>
          <div className="readings">
            {airJetForm.hours.map((hour) => {
              const reading = readings[hour] ?? emptyReading;
              return (
                <div className="reading-row" key={hour}>
                  <strong>{hour}</strong>
                  <input type="number" min="0" step="any" inputMode="decimal" aria-label={`แรงดันรอบ ${hour} (mbar)`} placeholder="mbar" value={reading.pressure}
                    aria-invalid={overLimit(reading)} onChange={(event) => update(hour, { pressure: event.target.value })} />
                  <select aria-label={`ผลตรวจรอบ ${hour}`} value={reading.result} onChange={(event) => update(hour, { result: event.target.value as Reading["result"] })}>
                    <option value="">เลือกผลตรวจ</option>
                    {Object.entries(results).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                  <input aria-label={`หมายเหตุรอบ ${hour}`} placeholder="หมายเหตุ" value={reading.note} onChange={(event) => update(hour, { note: event.target.value })} />
                  {overLimit(reading) && <span className="reading-warning">เกิน {airJetForm.maxPressure} mbar · แจ้งหัวหน้างานตามแบบฟอร์ม</span>}
                </div>
              );
            })}
          </div>
        </fieldset>
        <label>หมายเหตุรวม<textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="button primary">บันทึกผล</button>
        </div>
      </form>
    </Modal>
  );
}

export function AirJet() {
  const [records, saveRecords] = useDemoStorage<AirJetRecord[]>("air-jet", []);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<AirJetRecord | null | undefined>();
  const filtered = records.filter((record) => matches(query, record.asset, record.location, record.date, record.inspector))
    .sort((a, b) => b.date.localeCompare(a.date));

  function save(record: AirJetRecord) {
    if (records.some((item) => item.id !== record.id && item.date === record.date && item.asset.toUpperCase() === record.asset.toUpperCase())) {
      toast.error("มีบันทึกของเครื่องนี้ในวันดังกล่าวแล้ว กรุณาเปิดบันทึกเดิม");
      return;
    }
    const next = editor ? records.map((item) => item.id === record.id ? record : item) : [record, ...records];
    if (!saveRecords(next)) return;
    setQuery("");
    setEditor(undefined);
    toast.success("บันทึกผล AIR JET FILTER แล้ว");
  }

  return (
    <>
      <header className="page-heading heading-actions">
        <div><h1>บันทึก AIR JET FILTER</h1><p>{airJetForm.number} · Rev.{airJetForm.revision}</p></div>
        <button className="button primary" onClick={() => setEditor(null)}><Plus size={18} /> เพิ่มบันทึก</button>
      </header>
      <section className="panel procedure">
        <ClipboardList size={23} aria-hidden />
        <div>
          <h2>เกณฑ์จากแบบฟอร์ม</h2>
          <ul>{airJetForm.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul>
        </div>
      </section>
      <section className="panel list-panel">
        <div className="panel-header"><h2>ประวัติการบันทึก</h2></div>
        <div className="toolbar"><SearchInput value={query} onChange={setQuery} placeholder="ค้นหาเครื่อง วันที่ หรือผู้ตรวจสอบ" /></div>
        <DataTable key={query} label="ประวัติ AIR JET FILTER" rows={filtered} rowKey={(record) => record.id} columns={[
          { title: "วันที่เริ่มรอบ", content: (record) => displayDate(record.date) },
          { title: "หมายเลขเครื่อง", content: (record) => <><strong>{record.asset}</strong><span className="subline">{record.location}</span></> },
          { title: "ผู้ตรวจสอบ", content: (record) => record.inspector },
          { title: "รอบที่บันทึก", content: (record) => `${Object.keys(record.readings).length} / ${airJetForm.hours.length}` },
          { title: "ผลผิดปกติ", content: (record) => {
            const incidents = Object.values(record.readings).filter((reading) => overLimit(reading) || reading.result === "abnormal" || reading.result === "repair").length;
            return incidents ? <span className="tag warning">{incidents} รอบ</span> : "—";
          }},
          { title: "จัดการ", content: (record) => <button className="text-link" onClick={() => setEditor(record)}>เปิดบันทึก <ChevronRight size={15} /></button> },
        ]} />
      </section>
      {editor !== undefined && <AirJetEditor record={editor} onClose={() => setEditor(undefined)} onSave={save} />}
    </>
  );
}
