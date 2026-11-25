import { useState, type FormEvent } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { displayDate, machines, matches, people, today, useDemoStorage, workStatuses, type WorkStatus } from "../../src/features/maintenance/data";
import { DataTable, MachinePicker, Modal, SearchInput } from "../../src/features/maintenance/ui";

type Repair = {
  id: string;
  asset: string;
  issue: string;
  reporter: string;
  date: string;
  status: WorkStatus;
  note: string;
};

const assetNames = new Map(machines.map((machine) => [machine.id, [machine.code, machine.name].filter(Boolean).join(" · ")]));
const staffNames = new Map(people.map((person) => [person.id, person.name]));
const repairStatuses = { ...workStatuses, planned: "รับแจ้ง" };

function RepairEditor({ repair, onSave, onClose }: {
  repair: Repair | null;
  onSave: (repair: Repair) => void;
  onClose: () => void;
}) {
  const [asset, setAsset] = useState(repair?.asset ?? "");
  const [issue, setIssue] = useState(repair?.issue ?? "");
  const [reporter, setReporter] = useState(repair?.reporter ?? "");
  const [status, setStatus] = useState<WorkStatus>(repair?.status ?? "planned");
  const [note, setNote] = useState(repair?.note ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!issue.trim()) {
      toast.error("กรุณาระบุอาการที่พบ");
      return;
    }
    if (status === "done" && !note.trim()) {
      toast.error("กรุณาระบุผลการซ่อมก่อนปิดงาน");
      return;
    }
    onSave({ id: repair?.id ?? crypto.randomUUID(), date: repair?.date ?? today(), asset, issue: issue.trim(), reporter, status, note: note.trim() });
  }

  return (
    <Modal title={repair ? "รายละเอียดใบแจ้งซ่อม" : "สร้างใบแจ้งซ่อม"} description={repair ? displayDate(repair.date) : "ระบุอาการและเครื่องจักรที่ต้องซ่อม"} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <MachinePicker value={asset} onChange={setAsset} />
        <label>ผู้แจ้ง<select required value={reporter} onChange={(event) => setReporter(event.target.value)}>
          <option value="">เลือกผู้แจ้ง</option>
          {people.map((person) => <option value={person.id} key={person.id}>{person.name} · {person.department}</option>)}
        </select></label>
        <label>อาการที่พบ<textarea required rows={3} value={issue} onChange={(event) => setIssue(event.target.value)} /></label>
        {repair && <>
          <label>สถานะ<select value={status} onChange={(event) => setStatus(event.target.value as WorkStatus)}>
            {Object.entries(repairStatuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select></label>
          <label>ผลการซ่อม<textarea required={status === "done"} rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        </>}
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={onClose}>ยกเลิก</button>
          <button className="button primary" type="submit">บันทึกใบแจ้งซ่อม</button>
        </div>
      </form>
    </Modal>
  );
}

export function Repairs() {
  const [repairs, saveRepairs] = useDemoStorage<Repair[]>("repairs", []);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Repair | null | undefined>();
  const results = repairs.filter((repair) => matches(query, repair.issue, assetNames.get(repair.asset), staffNames.get(repair.reporter)));

  return (
    <>
      <header className="page-heading heading-actions">
        <div><h1>ใบแจ้งซ่อม</h1><p>แจ้งปัญหาเครื่องจักรและติดตามผลการซ่อม</p></div>
        <button className="button primary" onClick={() => setEditor(null)}><Plus size={18} /> สร้างใบแจ้งซ่อม</button>
      </header>
      <section className="panel list-panel">
        <div className="toolbar"><SearchInput value={query} onChange={setQuery} placeholder="ค้นหาเครื่องจักร อาการ หรือผู้แจ้ง" /></div>
        <DataTable key={query} label="ใบแจ้งซ่อม" rows={results} rowKey={(repair) => repair.id} columns={[
          { title: "วันที่แจ้ง", content: (repair) => displayDate(repair.date) },
          { title: "อาการที่พบ", content: (repair) => <><strong>{repair.issue}</strong><span className="subline">{assetNames.get(repair.asset)}</span></> },
          { title: "ผู้แจ้ง", content: (repair) => staffNames.get(repair.reporter) ?? "—" },
          { title: "สถานะ", content: (repair) => <span className={`tag ${repair.status}`}>{repairStatuses[repair.status]}</span> },
          { title: "จัดการ", content: (repair) => <button className="text-link" onClick={() => setEditor(repair)}>เปิดใบแจ้ง <ChevronRight size={15} /></button> },
        ]} />
      </section>
      {editor !== undefined && <RepairEditor repair={editor} onClose={() => setEditor(undefined)} onSave={(repair) => {
        const next = editor ? repairs.map((item) => item.id === repair.id ? repair : item) : [repair, ...repairs];
        if (!saveRepairs(next)) return;
        setQuery("");
        setEditor(undefined);
        toast.success("บันทึกใบแจ้งซ่อมแล้ว");
      }} />}
    </>
  );
}
