import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/estudantes": "Gestão de Estudantes",
  "/instrutores": "Gestão de Instrutores",
  "/cursos": "Gestão de Cursos",
  "/matriculas": "Matrículas",
  "/pagamentos": "Pagamentos",
};

export default function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "SGCF";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar — desktop static + mobile drawer */}
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main area — full width on mobile, constrained on desktop */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Fixed top navbar */}
        <Header
          title={title}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
