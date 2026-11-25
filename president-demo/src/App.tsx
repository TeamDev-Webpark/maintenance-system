import { CalendarDays, ClipboardList, Factory, HardHat, Package, UsersRound, Wrench } from "lucide-react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Planner } from "../../src/features/maintenance/Planner";
import { AirJet } from "../../src/features/maintenance/AirJet";
import { MachineRegister, PartsRegister, StaffDirectory } from "../../src/features/maintenance/Registers";
import { Repairs } from "./Repairs";

const links = [
  { path: "/", label: "แผนบำรุงรักษา", icon: CalendarDays },
  { path: "/air-jet", label: "บันทึก AIR JET FILTER", icon: ClipboardList },
  { path: "/repairs", label: "แจ้งซ่อม", icon: Wrench },
  { path: "/machines", label: "ทะเบียนเครื่องจักร", icon: Factory },
  { path: "/spares", label: "คลังอะไหล่", icon: Package },
  { path: "/staff", label: "บุคลากร", icon: UsersRound },
];

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-icon"><HardHat size={25} aria-hidden /></span>
          <span><strong>เพรซิเดนท์ฟลาวมิลล์</strong><small>ระบบซ่อมบำรุง</small></span>
        </NavLink>
        <nav aria-label="เมนูหลัก">
          {links.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Icon size={19} aria-hidden /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer"><span /> สภาพแวดล้อมเดโม</div>
      </aside>
      <main className="main-content maintenance-workspace">
        <Routes>
          <Route path="/" element={<Planner />} />
          <Route path="/air-jet" element={<AirJet />} />
          <Route path="/repairs" element={<Repairs />} />
          <Route path="/machines" element={<MachineRegister />} />
          <Route path="/spares" element={<PartsRegister />} />
          <Route path="/staff" element={<StaffDirectory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
