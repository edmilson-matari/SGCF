import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/estudantes", icon: GraduationCap, label: "Estudantes" },
  { to: "/instrutores", icon: Users, label: "Instrutores" },
  { to: "/cursos", icon: BookOpen, label: "Cursos" },
  { to: "/matriculas", icon: ClipboardList, label: "Matrículas" },
  { to: "/pagamentos", icon: CreditCard, label: "Pagamentos" },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const sidebarContent = (isMobile: boolean) => (
    <aside
      className={clsx(
        "flex flex-col bg-white border-r border-slate-200 h-full relative transition-all duration-300",
        isMobile ? "w-64" : collapsed ? "w-[60px]" : "w-56",
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          "flex items-center border-b border-slate-100 h-16 flex-shrink-0",
          !isMobile && collapsed ? "justify-center px-0" : "px-5 gap-3",
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-700 text-white flex-shrink-0">
          <span className="text-xs font-bold">CF</span>
        </div>
        {(isMobile || !collapsed) && (
          <div className="leading-tight flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">
              my<span className="text-blue-700">SGCF</span>
            </p>
            <p className="text-[10px] text-slate-400">Centro de Formação FF</p>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1 text-slate-400 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={!isMobile && collapsed ? label : undefined}
            className={({ isActive }) =>
              clsx(
                "relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors group",
                !isMobile && collapsed && "justify-center px-0",
                isActive
                  ? "text-blue-700 bg-blue-50 font-medium"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-normal",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-blue-700" />
                )}
                <Icon
                  size={17}
                  className={clsx(
                    "flex-shrink-0",
                    isActive
                      ? "text-blue-700"
                      : "text-slate-400 group-hover:text-slate-500",
                  )}
                />
                {(isMobile || !collapsed) && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Desktop collapse toggle */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-16 mt-4 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm z-10"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop — static, always visible */}
      <div className="hidden lg:flex h-screen flex-shrink-0">
        {sidebarContent(false)}
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent(true)}
      </div>
    </>
  );
}
