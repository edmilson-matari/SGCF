import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAll as getStudents } from "@/api/students";
import { getAll as getInstructors } from "@/api/instructors";
import { getAll as getCourses } from "@/api/courses";
import { getAll as getEnrollments } from "@/api/enrollments";
import { getAll as getPayments } from "@/api/payments";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Loader2,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Badge, {
  enrollmentStatusVariant,
  statusLabel,
} from "@/components/ui/Badge";
import { useNavigate } from "react-router-dom";

function fmt(value: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

const PAGE_SIZE = 8;

// Portuguese short month names
const PT_MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: students = [], isLoading: lStudents } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });
  const { data: instructors = [], isLoading: lInstructors } = useQuery({
    queryKey: ["instructors"],
    queryFn: getInstructors,
  });
  const { data: courses = [], isLoading: lCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });
  const { data: enrollments = [], isLoading: lEnrollments } = useQuery({
    queryKey: ["enrollments"],
    queryFn: getEnrollments,
  });
  const { data: payments = [], isLoading: lPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  const isLoading =
    lStudents || lInstructors || lCourses || lEnrollments || lPayments;

  // ── KPI calculations ──────────────────────────────────────────────
  const totalRevenue = useMemo(
    () =>
      payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + Number(p.amount), 0),
    [payments],
  );

  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === "active").length,
    [enrollments],
  );

  // ── Monthly revenue chart (last 6 complete months + current) ─────
  const chartData = useMemo(() => {
    const now = new Date();
    const months: {
      year: number;
      month: number;
      mes: string;
      receita: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        mes: PT_MONTHS[d.getMonth()],
        receita: 0,
      });
    }
    for (const p of payments) {
      if (p.status !== "paid" || !p.payment_date) continue;
      const d = new Date(p.payment_date);
      const entry = months.find(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth(),
      );
      if (entry) entry.receita += Number(p.amount);
    }
    return months;
  }, [payments]);

  const currentMonthRevenue = chartData.at(-1)?.receita ?? 0;
  const prevMonthRevenue = chartData.at(-2)?.receita ?? 0;
  const growth =
    prevMonthRevenue > 0
      ? (
          ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) *
          100
        ).toFixed(1)
      : null;

  // ── Pagination ────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(enrollments.length / PAGE_SIZE));
  const paged = enrollments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pageNumbers.push(i);
    if (page < totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  const kpis = [
    {
      icon: GraduationCap,
      label: "Estudantes",
      value: students.length,
      sub: "registados",
      color: "#2563eb",
    },
    {
      icon: Users,
      label: "Instrutores",
      value: instructors.length,
      sub: "registados",
      color: "#7c3aed",
    },
    {
      icon: BookOpen,
      label: "Cursos",
      value: courses.length,
      sub: "disponíveis",
      color: "#059669",
    },
    {
      icon: ClipboardList,
      label: "Matrículas",
      value: activeEnrollments,
      sub: "activas",
      color: "#d97706",
    },
    {
      icon: TrendingUp,
      label: "Receita",
      value: fmt(totalRevenue),
      sub: "acumulada",
      color: "#dc2626",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map(({ icon: Icon, label, value, sub, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 leading-none mb-0.5">
                {value}
              </p>
              <p className="text-xs text-slate-400">
                {label} <span className="text-slate-300">·</span> {sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Hero banner */}
      <div
        className="relative rounded-xl overflow-hidden p-8 text-white"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a5f 45%, #134e4a 100%)",
          minHeight: 160,
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #38bdf8, transparent)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #4ade80, transparent)",
            transform: "translateY(40%)",
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #fbbf24, transparent)",
          }}
        />
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest text-slate-300 mb-2 font-medium">
            Centro de Formação Profissional
          </p>
          <h2 className="text-2xl font-bold mb-2 leading-tight">
            Bem-vindo de volta
          </h2>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            Gira estudantes, cursos, matrículas e pagamentos num só lugar.
            Acompanhe o progresso e tome decisões informadas.
          </p>
          <button
            onClick={() => navigate("/matriculas")}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/30 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <Plus size={14} />
            Nova Matrícula
          </button>
        </div>
      </div>

      {/* Matrículas + Receita */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Enrollment table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">
              Matrículas Recentes
            </h3>
            <button
              onClick={() => navigate("/matriculas")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-[#1e293b] text-white text-xs">
                  <th className="px-5 py-3 text-left font-medium tracking-wide uppercase">
                    Estudante
                  </th>
                  <th className="px-5 py-3 text-left font-medium tracking-wide uppercase">
                    Curso
                  </th>
                  <th className="px-5 py-3 text-left font-medium tracking-wide uppercase">
                    Valor
                  </th>
                  <th className="px-5 py-3 text-left font-medium tracking-wide uppercase">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-center font-medium tracking-wide uppercase">
                    Acção
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-slate-400 text-sm"
                    >
                      Sem matrículas registadas.
                    </td>
                  </tr>
                ) : (
                  paged.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {e.student_name ?? `Estudante #${e.student_id}`}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {e.course_name ?? `Curso #${e.course_id}`}
                      </td>
                      <td className="px-5 py-3 text-slate-700 font-medium">
                        {fmt(e.total_amount)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          label={statusLabel(e.status)}
                          variant={enrollmentStatusVariant(e.status)}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => navigate("/matriculas")}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                            title="Ver detalhes"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {enrollments.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, enrollments.length)} de{" "}
                {enrollments.length} matrículas
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft size={13} />
                </button>
                {pageNumbers.map((n, i) =>
                  n === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="w-7 h-7 flex items-center justify-center text-xs text-slate-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
                        page === n
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Revenue chart — real data */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Receita Mensal
            </h3>
            <span className="text-xs text-slate-400">
              AOA · últimos 6 meses
            </span>
          </div>
          {chartData.every((d) => d.receita === 0) ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center py-8">
              Sem pagamentos confirmados nos últimos 6 meses.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${v / 1000}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(v: number | undefined) => [
                    fmt(v ?? 0),
                    "Receita",
                  ]}
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#grad)"
                  dot={{ fill: "#2563eb", r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400">Este mês</p>
              <p className="text-base font-bold text-slate-800">
                {fmt(currentMonthRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Vs mês anterior</p>
              {growth !== null ? (
                <p
                  className={`text-base font-bold ${
                    Number(growth) >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {Number(growth) >= 0 ? "+" : ""}
                  {growth}%
                </p>
              ) : (
                <p className="text-base font-bold text-slate-400">—</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
