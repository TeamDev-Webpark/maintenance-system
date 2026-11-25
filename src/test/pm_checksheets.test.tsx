import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import App from "@/App";
import { requestStore } from "@/lib/requestStore";
import { addInspectionRecord, inspectionRequestId, readInspections, type InspectionRecord } from "@/features/maintenance/inspectionData";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  requestStore.syncPMChecksheets();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

it("creates a template, links it to a calendar task, and opens and emails one repair for a failed round", async () => {
  const send = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ status: "accepted" }), { status: 200 }));
  vi.stubGlobal("fetch", send);
  sessionStorage.setItem("fixflow_user", JSON.stringify({ role: "pm", name: "ผู้ตรวจทดสอบ", emp_id: "PM001" }));
  window.history.replaceState({}, "", "/pm/checksheets");
  const app = render(<App />);
  const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
  const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
  const sidebar = within(screen.getByRole("complementary"));
  click("สร้าง Template");
  change("ชื่อ Template", "ตรวจแรงดันทดสอบ");
  change("รอบตรวจ", "hourly");
  change("หัวข้อ 1", "แรงดันต้นทาง");
  change("หมวดหัวข้อ 1", "ต้นทาง");
  click("เพิ่มหัวข้อ");
  change("หัวข้อ 2", "แรงดันปลายทาง");
  change("หมวดหัวข้อ 2", "ปลายทาง");
  change("ชนิดข้อมูลคอลัมน์ 1", "number");
  change("ชื่อคอลัมน์ 1", "ค่าแรงดัน");
  change("ค่าต่ำสุด", "0");
  change("ค่าสูงสุด", "20");
  change("หน่วย", "mbar");
  click("เพิ่มคอลัมน์");
  change("ชื่อคอลัมน์ 2", "หมายเหตุประกอบ");
  click("บันทึก Template");
  click("แก้ไข Template");
  change("ชื่อคอลัมน์ 2", "ข้อสังเกต");
  click("บันทึก Template");

  fireEvent.click(sidebar.getByRole("link", { name: "แผนบำรุงรักษา" }));
  fireEvent.click(screen.getByRole("button", { name: /^มกราคม/ }));
  change("ค้นหารหัส ชื่อเครื่อง หรือผู้รับผิดชอบ", "A-1001");
  fireEvent.click(screen.getAllByRole("button", { name: "เปิดงาน PM A-1001" })[0]);
  change("วันนัด PM", "2026-01-14");
  change("Template เช็กชีทของงาน", readInspections().templates[0].template_id);
  click("บันทึกแผน PM");
  fireEvent.click(within(screen.getByRole("region", { name: "ปฏิทินนัด PM รายวัน" })).getByRole("button", { name: /14 .*1 งาน/ }));
  const beginEntry = () => fireEvent.click(within(screen.getByRole("table", { name: "รายการแผน PM" })).getByRole("link", { name: "กรอกเช็กชีท" }));
  beginEntry();
  expect(screen.getByLabelText("วันที่ตรวจ")).toHaveValue("2026-01-14");
  change("ชั่วโมงตรวจ", "10:00");
  change("แรงดันต้นทาง / ค่าแรงดัน", "21");
  change("แรงดันต้นทาง / ข้อสังเกต", "พบแรงดันสูง");
  expect(screen.getByLabelText("แรงดันต้นทาง / ค่าแรงดัน")).toHaveAttribute("aria-invalid", "true");
  expect(screen.queryByLabelText("แรงดันปลายทาง / ค่าแรงดัน")).not.toBeInTheDocument();
  click("ส่วนถัดไป");
  change("แรงดันปลายทาง / ค่าแรงดัน", "20");
  expect(screen.getByLabelText("แรงดันปลายทาง / ค่าแรงดัน")).not.toHaveAttribute("aria-invalid");
  click("ส่วนก่อนหน้า");
  expect(screen.getByLabelText("แรงดันต้นทาง / ค่าแรงดัน")).toHaveValue(21);
  click("บันทึกผลตรวจ");

  const [record] = readInspections().records;
  expect(record.period).toBe("10:00");
  expect(record.planId).toBeTruthy();
  expect(record.cells.map((cell) => cell.group)).toEqual(["ต้นทาง", "ต้นทาง", "ปลายทาง", "ปลายทาง"]);
  const repairId = inspectionRequestId(record.id);
  expect(requestStore.getAll().filter((item) => item.request_id === repairId)).toHaveLength(1);
  expect(screen.getByText(`ใบแจ้งซ่อม ${repairId}`)).toBeInTheDocument();
  await waitFor(() => expect(readInspections().records[0].email).toBe("accepted"));
  expect(send).toHaveBeenCalledWith("/api/pm-alert-email", expect.objectContaining({ method: "POST" }));
  const payload = JSON.parse(String(send.mock.calls[0][1]?.body));
  expect(payload.failures).toHaveLength(1);
  expect(payload.priority).toBe("high");

  app.unmount();
  window.history.replaceState({}, "", "/pm/alerts");
  render(<App />);
  expect(screen.getByText("ระบบส่งอีเมลรับรายการแล้ว")).toBeInTheDocument();
  expect(screen.getByText("ใหม่")).toBeInTheDocument();
  click("ทำเครื่องหมายว่าอ่านแล้ว");
  expect(screen.queryByText("ใหม่")).not.toBeInTheDocument();
});

it("copies a reference example as a blank editable template", () => {
  sessionStorage.setItem("fixflow_user", JSON.stringify({ role: "pm", name: "ผู้ตรวจทดสอบ" }));
  window.history.replaceState({}, "", "/pm/checksheets");
  render(<App />);
  const example = screen.getByText(/รับและลำเลียง · A-1001/).closest("details")!;
  fireEvent.click(within(example).getByText(/รับและลำเลียง · A-1001/));
  expect(within(example).getByText("ไม่ผ่าน")).toBeInTheDocument();
  fireEvent.click(within(example).getByRole("button", { name: "ใช้ตัวอย่างนี้" }));
  expect(screen.getByLabelText("ชื่อ Template")).toHaveValue("เช็กชีทสายพานโซ่");
  expect(screen.getByLabelText("หมวดหัวข้อ 1")).toHaveValue("สภาพก่อนเดินเครื่อง");
  expect(readInspections().records).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "บันทึก Template" }));
  expect(readInspections().templates[0].columns[1].max).toBeUndefined();
  fireEvent.click(screen.getByRole("button", { name: "กรอกเช็กชีท" }));
  expect(screen.getByLabelText("สภาพฝาครอบและจุดยึด / ผลตรวจ")).toHaveValue("");
});

it("deduplicates a daily round and permits different shifts and hours", () => {
  const base: InspectionRecord = {
    id: "r1", templateId: "t1", templateName: "Template", machineKey: "m1", machineName: "Machine",
    location: "", date: "2026-11-25", period: "", frequency: "daily", inspector: "PM",
    submittedAt: "2026-11-25T03:00:00Z", priority: "medium", cells: [], note: "",
  };
  expect(addInspectionRecord(base)).toBe("saved");
  expect(addInspectionRecord({ ...base, id: "r2" })).toBe("duplicate");
  expect(addInspectionRecord({ ...base, id: "r3", frequency: "per_shift", period: "A" })).toBe("saved");
  expect(addInspectionRecord({ ...base, id: "r4", frequency: "per_shift", period: "B" })).toBe("saved");
  expect(addInspectionRecord({ ...base, id: "r5", frequency: "hourly", period: "10:00" })).toBe("saved");
  expect(addInspectionRecord({ ...base, id: "r6", frequency: "hourly", period: "11:00" })).toBe("saved");
});
