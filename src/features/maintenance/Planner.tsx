import { useState, type FormEvent } from "react";
import { CalendarDays, CalendarRange, CheckCircle2, ChevronRight, CircleDashed, Clock3, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cycles, displayDate, machines, matches, monthKey, monthlyReference, months, people, planYear, today, usePlans, weeks, workStatuses, type Cycle, type Plan, type WorkStatus } from "./data";
import { DataTable, MachinePicker, Modal, SearchInput } from "./ui";

const maintenanceStaff = people.filter((person) => person.department === "MN");
const staffNames = new Map(people.map((person) => [person.id, person.name]));
const weeksByNumber = new Map(weeks.map((week) => [week.number, week]));
const sourceWeek = (number: number | null) => number === null ? undefined : weeksByNumber.get(number);
const dateWeek = (date: string) => weeks.find((week) => date >= week.start && date <= week.end);

function planMonth(plan: Plan) {
  if (plan.date) return plan.date.slice(0, 7);
  return monthKey(planYear, sourceWeek(plan.week)?.month ?? 1);
}

const planWeek = (plan: Plan) => plan.date ? dateWeek(plan.date)?.number : plan.week;

type ChecksheetLinks = {
  templates: { id: string; name: string }[];
  byPlan: ReadonlyMap<string, { id: string; count: number; failed: boolean }>;
};

function PlanEditor({ plan, onClose, onSave, machinePath, checksheets, selectedDate }: {
  plan: Plan | null;
  machinePath: string;
  checksheets?: ChecksheetLinks;
  selectedDate: string;
  onClose: () => void;
  onSave: (plan: Plan) => void;
}) {
  const [machineId, setMachineId] = useState(plan?.machineId ?? "");
  const [cycle, setCycle] = useState<Cycle>(plan?.cycle ?? "M");
  const [date, setDate] = useState(plan?.date ?? selectedDate);
  const [owner, setOwner] = useState(plan?.owner ?? "");
  const [status, setStatus] = useState<WorkStatus>(plan?.status ?? "planned");
  const [note, setNote] = useState(plan?.note ?? "");
  const [templateId, setTemplateId] = useState(plan?.templateId ?? "");
  const reference = sourceWeek(plan?.week ?? null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const machine = machines.find((item) => item.id === machineId);
    const equipment = plan?.week ? plan : machine && {
      code: machine.code, name: machine.name, location: machine.location, machineId: machine.id, model: "",
    };
    if (!equipment) return;
    const { code, name, location, machineId: linkedId, model } = equipment;
    onSave({ id: plan?.id ?? crypto.randomUUID(), code, name, location, machineId: linkedId, model,
      cycle, week: plan?.week ?? null, date, owner, status, note: note.trim(), templateId: templateId || undefined });
  }

  return (
    <Modal title={plan ? "รายละเอียดและกำหนดงาน PM" : "เพิ่มแผน PM"}
      description={plan ? [plan.code, plan.name].filter(Boolean).join(" · ") : "เลือกเครื่องจักรและกำหนดวันนัดสำหรับงานบำรุงรักษา"} onClose={onClose}>
      <form className="form" onSubmit={save}>
        {reference ? (
          <div className="reference">
            <strong>ช่วงตาม Master Plan · WW{reference.number}</strong>
            <span>{displayDate(reference.start)} ถึง {displayDate(reference.end)}</span>
            {plan?.model && <span>รุ่นตามแผน {plan.model}</span>}
            {plan?.location && <span>{plan.location}</span>}
            {plan?.machineId && <Link className="text-link" to={`${machinePath}?asset=${encodeURIComponent(plan.machineId)}`} onClick={onClose}>เปิดทะเบียนเครื่องจักร <ChevronRight size={15} /></Link>}
          </div>
        ) : <MachinePicker value={machineId} onChange={setMachineId} />}
        <div className="form-grid">
          <label>รอบบำรุงรักษา<select value={cycle} onChange={(e) => setCycle(e.target.value as Cycle)}>
            {Object.entries(cycles).map(([key, label]) => <option key={key} value={key}>{key} · {label}</option>)}
          </select></label>
          <label>วันนัด PM<input type="date" min="2000-01-01" max="2099-12-31" required={!reference || status !== "planned"} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label>ผู้รับผิดชอบ<select required={status !== "planned"} value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">ยังไม่ระบุ</option>
            {maintenanceStaff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}
          </select></label>
          <label>สถานะ<select value={status} onChange={(e) => setStatus(e.target.value as WorkStatus)}>
            {Object.entries(workStatuses).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select></label>
        </div>
        {checksheets && (
          <label>Template เช็กชีทของงาน<select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">ยังไม่ได้ผูก Template</option>
            {checksheets.templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
        )}
        <label>รายละเอียดงานหรือผลการบำรุงรักษา<textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="button primary">บันทึกแผน PM</button>
        </div>
      </form>
    </Modal>
  );
}

const weekdays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

function MonthCalendar({ month, plans, selectedDate, onSelect }: {
  month: string;
  plans: Plan[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const offset = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const counts = new Map<string, number>();
  const currentDate = today();
  for (const plan of plans) {
    if (plan.date) counts.set(plan.date, (counts.get(plan.date) ?? 0) + 1);
  }
  return (
    <section className="panel p-3 sm:p-4" aria-label="ปฏิทินนัด PM รายวัน">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2>วันนัด · {months[monthNumber - 1]} {year + 543}</h2>
          <p className="muted">เลือกวันที่เพื่อดูงานที่กำหนดวันนัดแล้ว</p>
        </div>
        {selectedDate && <button type="button" className="button secondary" onClick={() => onSelect("")}>แสดงทั้งเดือน</button>}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekdays.map((day) => <span className="py-1 text-center text-xs font-semibold text-muted-foreground" key={day}>{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} aria-hidden />)}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
          const date = `${month}-${String(day).padStart(2, "0")}`;
          const count = counts.get(date) ?? 0;
          return <button type="button" key={date} aria-pressed={date === selectedDate} aria-current={date === currentDate ? "date" : undefined}
            aria-label={`${displayDate(date)} · ${count} งาน`}
            className={`min-h-12 min-w-0 rounded-md border px-0.5 py-1 text-sm hover:bg-muted sm:px-2 ${date === selectedDate ? "border-primary bg-primary/10 text-primary" : "bg-card"}`}
            onClick={() => onSelect(date === selectedDate ? "" : date)}>
            <strong>{day}</strong>
            {count > 0 && <span className="block text-[10px] font-medium text-primary sm:text-xs">{count} งาน</span>}
          </button>;
        })}
      </div>
    </section>
  );
}

function MonthlyReference({ month }: { month: number }) {
  const [query, setQuery] = useState("");
  const rows = monthlyReference.filter((slot) => slot.month === month && matches(query, slot.code, slot.name, slot.location, slot.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  return (
    <details className="panel reference-panel">
      <summary>ตารางนัดอ้างอิงจากชีต{months[month - 1]}</summary>
      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาวันนัดหรือเครื่องจักรในชีตรายเดือน" />
      </div>
      <DataTable key={query} label="ตารางนัดอ้างอิงรายเดือน" rows={rows} rowKey={(slot) => slot.id} columns={[
        { title: "วันและเวลานัด", content: (slot) => <>{displayDate(slot.date)}<span className="subline">{slot.time}</span></> },
        { title: "เครื่องจักร", content: (slot) => <><strong>{slot.name}</strong><span className="subline">{[slot.code, slot.model, slot.location].filter(Boolean).join(" · ")}</span></> },
        { title: "รอบ PM", content: (slot) => <span className="tag cycle">{slot.cycle}</span> },
      ]} />
    </details>
  );
}

export function Planner({ machinePath = "/machines", checksheets, focusPlanId }: {
  machinePath?: string;
  checksheets?: ChecksheetLinks;
  focusPlanId?: string | null;
} = {}) {
  const [plans, savePlan] = usePlans();
  const currentMonth = today().slice(0, 7);
  const defaultMonth = currentMonth.startsWith(String(planYear)) ? currentMonth : monthKey(planYear, 1);
  const focusPlan = focusPlanId ? plans.find((plan) => plan.id === focusPlanId) : undefined;
  const [selectedMonth, setSelectedMonth] = useState(() =>
    focusPlan ? planMonth(focusPlan) : defaultMonth,
  );
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(focusPlan?.date ?? "");
  const [cycle, setCycle] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Plan | null | undefined>();

  const [activeYear, activeMonth] = selectedMonth.split("-").map(Number);
  const years = [...new Set([planYear, activeYear, ...plans.map((plan) => Number(planMonth(plan).slice(0, 4)))])].sort((a, b) => a - b);
  const yearPlans = plans.filter((plan) => planMonth(plan).startsWith(String(activeYear)));
  const monthTotals = Array<number>(12).fill(0);
  for (const plan of yearPlans) monthTotals[Number(planMonth(plan).slice(5, 7)) - 1]++;
  const monthPlans = yearPlans.filter((plan) => planMonth(plan) === selectedMonth);
  const monthWeeks = activeYear === planYear ? weeks.filter((week) => week.month === activeMonth) : [];
  const due = yearPlans.filter((plan) => plan.status !== "done" && plan.date && plan.date < today()).length;
  const totalDone = yearPlans.filter((plan) => plan.status === "done").length;
  const scheduled = yearPlans.filter((plan) => plan.date).length;
  const filtered = monthPlans.filter((plan) =>
    (!selectedWeek || planWeek(plan) === selectedWeek) && (!selectedDate || plan.date === selectedDate) &&
    (!cycle || plan.cycle === cycle) && (!status || plan.status === status) &&
    matches(query, plan.code, plan.name, plan.location, staffNames.get(plan.owner)),
  ).sort((a, b) => (a.date || sourceWeek(a.week)?.start || "").localeCompare(b.date || sourceWeek(b.week)?.start || "") || a.code.localeCompare(b.code));

  function changeMonth(value: string) {
    setSelectedMonth(value);
    setSelectedWeek(null);
    setSelectedDate("");
  }

  function save(plan: Plan) {
    if (!savePlan(plan)) return;
    changeMonth(planMonth(plan));
    setCycle("");
    setStatus("");
    setQuery("");
    setEditor(undefined);
    toast.success("บันทึกแผน PM แล้ว");
  }

  return (
    <>
      <header className="hero">
        <div>
          <div className="eyebrow"><CalendarDays size={17} aria-hidden /> แผนงานประจำปี {activeYear + 543}</div>
          <h1>วางแผนบำรุงรักษา</h1>
          <p>กำหนดวันนัด มอบหมายงาน และติดตามผลซ่อมบำรุงเชิงป้องกัน (PM)</p>
          <button className="button hero-button" onClick={() => setEditor(null)}><Plus size={19} /> เพิ่มแผน PM</button>
        </div>
        <CalendarRange className="hero-art" strokeWidth={0.65} aria-hidden />
      </header>

      <div className="metrics" aria-label={`สรุปแผน PM ปี ${activeYear + 543}`}>
        {[
          { label: "แผน PM ทั้งปี", value: yearPlans.length, icon: CalendarRange, tone: "teal" },
          { label: "มีวันนัดแล้ว", value: scheduled, icon: CircleDashed, tone: "blue" },
          { label: "เลยวันนัด", value: due, icon: Clock3, tone: "amber" },
          { label: "บันทึกเสร็จสิ้น", value: totalDone, icon: CheckCircle2, tone: "green" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div className="metric" key={label}>
            <span className={`metric-icon ${tone}`}><Icon size={19} aria-hidden /></span>
            <div><span>{label}</span><strong>{value.toLocaleString("th-TH")}</strong></div>
          </div>
        ))}
      </div>

      <section className="panel calendar-panel" aria-labelledby="calendar-heading">
        <div className="panel-header">
          <div><h2 id="calendar-heading">ปฏิทินแผน PM</h2><p>จำนวนงานตามเดือนในแผนประจำปี</p></div>
          <select aria-label="ปีแผน PM" value={activeYear} onChange={(e) => changeMonth(monthKey(Number(e.target.value), activeMonth))}>
            {years.map((year) => <option value={year} key={year}>พ.ศ. {year + 543}</option>)}
          </select>
        </div>
        <div className="month-grid">
          {months.map((month, index) => (
            <button className="month" key={month} aria-pressed={activeMonth === index + 1} onClick={() => changeMonth(monthKey(activeYear, index + 1))}>
              <span>{month}</span><strong>{monthTotals[index].toLocaleString("th-TH")}</strong>
            </button>
          ))}
        </div>
      </section>

      <MonthCalendar month={selectedMonth} plans={monthPlans} selectedDate={selectedDate} onSelect={(date) => {
        setSelectedDate(date);
        setSelectedWeek(null);
      }} />
      {activeYear === planYear && (activeMonth === 1 || activeMonth === 2) && <MonthlyReference key={activeMonth} month={activeMonth} />}
      <section className="panel list-panel" aria-labelledby="plans-heading">
        <div className="panel-header">
          <div><h2 id="plans-heading">รายการ PM · {selectedDate ? displayDate(selectedDate) : `${months[activeMonth - 1]} ${activeYear + 543}`}</h2><p>{filtered.length.toLocaleString("th-TH")} รายการ</p></div>
        </div>
        {monthWeeks.length > 0 && (
          <div className="week-tabs" aria-label="สัปดาห์ตามแผน">
            <button aria-pressed={!selectedWeek && !selectedDate} onClick={() => { setSelectedWeek(null); setSelectedDate(""); }}>ทุกสัปดาห์</button>
            {monthWeeks.map((week) => (
              <button key={week.number} aria-pressed={selectedWeek === week.number} onClick={() => { setSelectedWeek(week.number); setSelectedDate(""); }}>WW{week.number} <span>· {week.start.slice(8)}–{week.end.slice(8)}</span></button>
            ))}
          </div>
        )}
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="ค้นหารหัส ชื่อเครื่อง หรือผู้รับผิดชอบ" />
          <select aria-label="กรองรอบบำรุงรักษา" value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="">ทุกรอบ PM</option>
            {Object.entries(cycles).map(([key, label]) => <option key={key} value={key}>{key} · {label}</option>)}
          </select>
          <select aria-label="กรองสถานะ" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">ทุกสถานะ</option>
            {Object.entries(workStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <DataTable key={JSON.stringify([selectedMonth, selectedWeek, selectedDate, cycle, status, query])} rows={filtered} rowKey={(plan) => plan.id} label="รายการแผน PM"
          columns={[
            { title: "เครื่องจักร", content: (plan) => <><strong>{plan.name}</strong><span className="subline">{[plan.code, plan.location].filter(Boolean).join(" · ")}</span></> },
            { title: "รอบ PM", content: (plan) => <span className="tag cycle" title={cycles[plan.cycle]}>{plan.cycle}</span> },
            { title: "กำหนดการ", content: (plan) => {
              const week = sourceWeek(plan.week);
              return <>{plan.date ? displayDate(plan.date) : "ยังไม่ระบุวันนัด"}{week && <span className="subline">WW{week.number} · {week.start.slice(8)}–{week.end.slice(8)}</span>}</>;
            }},
            { title: "ผู้รับผิดชอบ", content: (plan) => staffNames.get(plan.owner) ?? "—" },
            { title: "สถานะ", content: (plan) => <span className={`tag ${plan.status}`}>{workStatuses[plan.status]}</span> },
            ...(checksheets ? [{ title: "เช็กชีท", content: (plan: Plan) => {
              const recorded = checksheets.byPlan.get(plan.id);
              const template = checksheets.templates.find((item) => item.id === plan.templateId);
              return <>
                {template && <Link className="text-link" to={`/pm/checksheets?plan=${encodeURIComponent(plan.id)}`}>กรอกเช็กชีท</Link>}
                {recorded && <Link className={`subline ${recorded.failed ? "font-semibold text-destructive" : ""}`} to={`/pm/checksheets?record=${recorded.id}`}>
                  {recorded.count} ผลตรวจ{recorded.failed ? " · ล่าสุดนอกเกณฑ์" : ""}
                </Link>}
                {!recorded && !template && "—"}
              </>;
            } }] : []),
            { title: "จัดการ", content: (plan) => <button className="text-link" aria-label={`เปิดงาน PM ${plan.code || plan.name}`} onClick={() => setEditor(plan)}>เปิดงาน <ChevronRight size={15} /></button> },
          ]} />
      </section>
      {editor !== undefined && <PlanEditor machinePath={machinePath} checksheets={checksheets} selectedDate={selectedDate} plan={editor} onClose={() => setEditor(undefined)} onSave={save} />}
    </>
  );
}
