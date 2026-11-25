import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { departments, machines, matches, people, spareParts } from "./data";
import { DataTable, Modal, SearchInput } from "./ui";

const count = (items: unknown[]) => items.length.toLocaleString("th-TH");

function Details({ fields }: { fields: [string, string][] }) {
  return <dl className="details">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>;
}

export function MachineRegister() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const active = machines.find((machine) => machine.id === params.get("asset"));
  const groups = [...new Set(machines.map((machine) => machine.group).filter(Boolean))].sort();
  const results = machines.filter((machine) => (!group || machine.group === group) && matches(query, machine.code, machine.name, machine.location, machine.description, machine.batch));

  return (
    <>
      <header className="page-heading"><h1>ทะเบียนเครื่องจักร</h1><p>เครื่องจักรและอุปกรณ์ {count(machines)} รายการ</p></header>
      <section className="panel list-panel">
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="ค้นหารหัส ชื่อ หรือสถานที่" />
          <select aria-label="กลุ่มเครื่องจักร" value={group} onChange={(event) => setGroup(event.target.value)}>
            <option value="">ทุกกลุ่มเครื่องจักร</option>
            {groups.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <DataTable key={JSON.stringify([query, group])} label="ทะเบียนเครื่องจักร" rows={results} rowKey={(machine) => machine.id}
          columns={[
            { title: "รหัสเครื่อง", content: (machine) => machine.code || "—" },
            { title: "เครื่องจักร", content: (machine) => <><strong>{machine.name}</strong><span className="subline">{machine.group}</span></> },
            { title: "สถานที่", content: (machine) => machine.location || "—" },
            { title: "รายละเอียด", content: (machine) => <button className="text-link" onClick={() => setParams({ asset: machine.id })}>เปิดข้อมูล <ChevronRight size={15} /></button> },
          ]} />
      </section>
      {active && <Modal title={active.code || "รายละเอียดเครื่องจักร"} description={active.name} onClose={() => setParams({})}>
        <Details fields={[
          ["รหัสรายการ", active.itemCode], ["Batch", active.batch], ["กลุ่ม", active.group], ["สถานที่", active.location],
          ["รายละเอียด", active.description], ["ผู้ขาย", active.vendor], ["วันที่ซื้อ", active.purchaseDate], ["วันที่รับประกัน", active.guaranteeDate],
          ["kW", active.kw], ["A", active.amps], ["HP", active.hp], ["RPM", active.rpm], ["BTU", active.btu], ["CC", active.cc],
        ]} />
      </Modal>}
    </>
  );
}

function belowMinimum(part: typeof spareParts[number]) {
  return part.stock !== "" && part.min !== "" && Number(part.stock) < Number(part.min);
}

export function PartsRegister() {
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [active, setActive] = useState<typeof spareParts[number] | null>(null);
  const results = spareParts.filter((part) => (!lowOnly || belowMinimum(part)) && matches(query, part.code, part.ref, part.name, part.shelf, part.group));

  return (
    <>
      <header className="page-heading"><h1>คลังอะไหล่</h1><p>ข้อมูลจากรอบตรวจนับสต๊อก {count(spareParts)} รายการ</p></header>
      <section className="panel list-panel">
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="ค้นหารหัส ชื่ออะไหล่ หรือชั้นวาง" />
          <label className="check-label"><input type="checkbox" checked={lowOnly} onChange={(event) => setLowOnly(event.target.checked)} /> เฉพาะคงเหลือต่ำกว่า Min</label>
        </div>
        <DataTable key={JSON.stringify([query, lowOnly])} label="รายการอะไหล่" rows={results} rowKey={(part) => part.id}
          columns={[
            { title: "รหัสอะไหล่", content: (part) => <><strong>{part.code}</strong><span className="subline">{part.ref}</span></> },
            { title: "อะไหล่", content: (part) => <><strong>{part.name}</strong><span className="subline">{part.group}</span></> },
            { title: "คงเหลือ", content: (part) => <span className={belowMinimum(part) ? "tag warning" : ""}>{[part.stock, part.unit].filter(Boolean).join(" ") || "—"}</span> },
            { title: "Min / Max", content: (part) => `${part.min || "—"} / ${part.max || "—"}` },
            { title: "ชั้นวาง", content: (part) => part.shelf || "—" },
            { title: "รายละเอียด", content: (part) => <button className="text-link" onClick={() => setActive(part)}>เปิดข้อมูล <ChevronRight size={15} /></button> },
          ]} />
      </section>
      {active && <Modal title={`อะไหล่ ${active.code}`} description={active.name} onClose={() => setActive(null)}>
        <Details fields={[
          ["รหัสอ้างอิง", active.ref], ["กลุ่ม", active.group], ["รหัสกลุ่ม", active.groupCode], ["หน่วย", active.unit],
          ["คงเหลือ", active.stock], ["Min", active.min], ["Max", active.max], ["Allow zero (ตามไฟล์)", active.allowZero],
          ["Required (ตามไฟล์)", active.required], ["ชั้นวาง", active.shelf], ["คลัง", active.location],
        ]} />
      </Modal>}
    </>
  );
}

export function StaffDirectory() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const names = new Map(departments.map((item) => [item.code, item.name]));
  const results = people.filter((person) => (!department || person.department === department) && matches(query, person.name, person.department, names.get(person.department)));
  return (
    <>
      <header className="page-heading"><h1>บุคลากร</h1><p>{count(people)} คน จาก {departments.length} แผนก</p></header>
      <section className="panel list-panel">
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาชื่อหรือแผนก" />
          <select aria-label="แผนก" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="">ทุกแผนก</option>
            {departments.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}
          </select>
        </div>
        <DataTable key={JSON.stringify([query, department])} label="รายชื่อบุคลากร" rows={results} rowKey={(person) => person.id}
          columns={[
            { title: "ชื่อ–นามสกุล", content: (person) => <strong>{person.name}</strong> },
            { title: "แผนก", content: (person) => names.get(person.department) ?? person.department },
            { title: "รหัสแผนก", content: (person) => <span className="tag cycle">{person.department}</span> },
          ]} />
      </section>
    </>
  );
}
