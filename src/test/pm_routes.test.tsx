import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "@/App";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("PM workflow in FixFlow", () => {
  it("signs in as PM, reschedules an imported task, and restores it after reload", () => {
    const app = render(<App />);
    expect(screen.queryByText("QC Officer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("PM Planner"));
    fireEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));
    expect(window.location.pathname).toBe("/pm/dashboard");

    const pickTask = () => {
      fireEvent.click(screen.getByRole("button", { name: /^มกราคม/ }));
      fireEvent.change(screen.getByRole("searchbox", { name: "ค้นหารหัส ชื่อเครื่อง หรือผู้รับผิดชอบ" }), {
        target: { value: "A-1001" },
      });
      fireEvent.click(screen.getAllByRole("button", { name: "เปิดงาน PM A-1001" })[0]);
    };

    pickTask();
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("วันนัด PM"), { target: { value: "2026-01-14" } });
    const assignee = dialog.getByLabelText<HTMLSelectElement>("ผู้รับผิดชอบ");
    const assigned = assignee.options[1];
    fireEvent.change(assignee, { target: { value: assigned.value } });
    fireEvent.click(dialog.getByRole("button", { name: "บันทึกแผน PM" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    app.unmount();
    render(<App />);
    pickTask();
    expect(screen.getByLabelText("วันนัด PM")).toHaveValue("2026-01-14");
    expect(screen.getByLabelText("ผู้รับผิดชอบ")).toHaveValue(assigned.value);
  });

  it("opens the imported AIR JET FILTER form from the existing Admin route", () => {
    window.history.replaceState({}, "", "/admin/checksheet");
    render(<App />);
    expect(screen.getByRole("heading", { name: "บันทึก AIR JET FILTER" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "เพิ่มบันทึก" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getAllByRole("combobox", { name: /^ผลตรวจรอบ/ })).toHaveLength(12);
    expect(dialog.getByText(/20 mbar/)).toBeInTheDocument();
  });

  it("opens the PM menu drawer and closes it when a destination is selected", () => {
    sessionStorage.setItem("fixflow_user", JSON.stringify({ role: "pm" }));
    window.history.replaceState({}, "", "/pm/dashboard");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "เปิดเมนูวางแผน PM" }));
    const menu = within(screen.getByRole("dialog", { name: "เมนูวางแผน PM" }));
    expect(menu.getByRole("link", { name: "แผนบำรุงรักษา" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(menu.getByRole("link", { name: "ทะเบียนเครื่องจักร" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ทะเบียนเครื่องจักร" })).toBeInTheDocument();
    const sidebar = within(screen.getByRole("complementary"));
    expect(sidebar.getByRole("link", { name: "ทะเบียนเครื่องจักร" })).toHaveAttribute("aria-current", "page");
  });
});
