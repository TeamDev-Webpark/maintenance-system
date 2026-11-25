import { useId, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { machines, matches } from "./data";

export function SearchInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <Search size={17} aria-hidden />
      <input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function DataTable<T>({ rows, columns, rowKey, label }: {
  rows: T[];
  columns: { title: string; content: (row: T) => ReactNode }[];
  rowKey: (row: T) => string;
  label: string;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const lastPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  const current = Math.min(page, lastPage);
  const start = current * pageSize;

  return (
    <>
      <div className="table-scroll">
        <table aria-label={label}>
          <thead><tr>{columns.map(({ title }) => <th key={title} scope="col">{title}</th>)}</tr></thead>
          <tbody>
            {rows.slice(start, start + pageSize).map((row) => (
              <tr key={rowKey(row)}>{columns.map(({ title, content }) => <td key={title}>{content(row)}</td>)}</tr>
            ))}
            {!rows.length && <tr><td className="empty" colSpan={columns.length}>ไม่พบรายการ</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>{rows.length ? `${start + 1}–${Math.min(start + pageSize, rows.length)} จาก ${rows.length.toLocaleString("th-TH")} รายการ` : "0 รายการ"}</span>
        {lastPage > 0 && (
          <div className="pagination">
            <button className="icon-button" aria-label="หน้าก่อนหน้า" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft size={17} /></button>
            <span>{current + 1} / {lastPage + 1}</span>
            <button className="icon-button" aria-label="หน้าถัดไป" disabled={current === lastPage} onClick={() => setPage(current + 1)}><ChevronRight size={17} /></button>
          </div>
        )}
      </div>
    </>
  );
}

export function Modal({ title, description, onClose, children }: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <div className="maintenance-workspace">
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal">
            <div className="modal-header">
              <div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
              <Dialog.Close className="icon-button" aria-label="ปิด"><X size={19} /></Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MachinePicker({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const id = useId();
  const results = machines.filter((machine) => machine.id === value || matches(query, machine.code, machine.name, machine.location));

  return (
    <div className="machine-picker">
      <SearchInput value={query} onChange={setQuery} placeholder="ค้นหารหัสหรือชื่อเครื่องจักร" />
      <label htmlFor={id}>เครื่องจักร</label>
      <select id={id} required value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">เลือกเครื่องจักร ({results.length} รายการ)</option>
        {results.map((machine) => <option value={machine.id} key={machine.id}>{[machine.code, machine.name, machine.location].filter(Boolean).join(" · ")}</option>)}
      </select>
    </div>
  );
}
