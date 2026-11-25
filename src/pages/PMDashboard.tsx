import { useState } from "react";
import { ArrowLeft, Bell, CalendarDays, ClipboardCheck, ClipboardList, Factory, LogOut, Menu, UsersRound, Wrench } from "lucide-react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useInspections } from "@/features/maintenance/inspectionData";
import "@/features/maintenance/workspace.css";

const links = [
  { to: "/pm/dashboard", label: "แผนบำรุงรักษา", icon: CalendarDays },
  { to: "/pm/checksheets", label: "เช็กชีท PM", icon: ClipboardCheck },
  { to: "/pm/alerts", label: "แจ้งเตือน PM", icon: Bell },
  { to: "/pm/air-jet", label: "บันทึก AIR JET FILTER", icon: ClipboardList },
  { to: "/pm/machines", label: "ทะเบียนเครื่องจักร", icon: Factory },
  { to: "/pm/staff", label: "บุคลากร", icon: UsersRound },
];

const menuItemClass = "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

function PMNavigation({ adminPath, onNavigate, onSignOut }: {
  adminPath?: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const { records } = useInspections();
  const unread = records.filter((record) => !record.read && record.cells.some((cell) => cell.failed)).length;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="เมนูวางแผน PM" className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => cn(
            menuItemClass,
            isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
          )}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden /> {label}
            {to === "/pm/alerts" && unread > 0 && <span aria-label={`ยังไม่อ่าน ${unread} รายการ`} className="ml-auto rounded-full bg-destructive px-2 text-xs leading-5 text-destructive-foreground">{unread}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border p-3">
        {adminPath && <NavLink to={adminPath} onClick={onNavigate} className={menuItemClass}><ArrowLeft className="h-4 w-4 shrink-0" aria-hidden /> กลับหน้าผู้ดูแล</NavLink>}
        <button type="button" onClick={onSignOut} className={cn(menuItemClass, "w-full text-left")}><LogOut className="h-4 w-4 shrink-0" aria-hidden /> ออกจากระบบ</button>
      </div>
    </div>
  );
}

function readRole(): string | undefined {
  try {
    return JSON.parse(sessionStorage.getItem("fixflow_user") ?? "null")?.role;
  } catch {
    return undefined;
  }
}

export default function PMDashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = readRole();
  if (role !== "pm" && role !== "admin" && role !== "superadmin") {
    return <Navigate to="/" replace />;
  }

  const adminPath = role === "pm" ? undefined : `/${role}/dashboard`;

  function signOut() {
    sessionStorage.removeItem("fixflow_user");
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-gradient-primary text-primary-foreground shadow-md">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="เปิดเมนูวางแผน PM" className="shrink-0 hover:bg-white/10 hover:text-primary-foreground lg:hidden">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined} className="flex w-72 max-w-[90vw] flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="border-b border-sidebar-border py-4 pl-4 pr-12 text-base text-sidebar-foreground">เมนูวางแผน PM</SheetTitle>
              <div className="min-h-0 flex-1">
                <PMNavigation adminPath={adminPath} onNavigate={() => setMenuOpen(false)} onSignOut={signOut} />
              </div>
            </SheetContent>
          </Sheet>
          <Wrench className="h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="text-xs text-primary-foreground/70">FixFlow</p>
            <p className="font-bold">ผู้วางแผน PM</p>
          </div>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] self-start border-r border-sidebar-border bg-sidebar lg:block">
          <PMNavigation adminPath={adminPath} onSignOut={signOut} />
        </aside>
        <main className="maintenance-workspace mx-auto w-full min-w-0 max-w-screen-2xl px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
