import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Loader2, XCircle, User } from "lucide-react";
import axios from "axios";
import * as paymentsApi from "@/api/payments";
import * as enrollmentsApi from "@/api/enrollments";
import * as studentsApi from "@/api/students";
import * as coursesApi from "@/api/courses";
import type { Payment } from "@/types";
import Modal from "@/components/ui/Modal";
import Badge, {
  paymentStatusVariant,
  statusLabel,
} from "@/components/ui/Badge";

const schema = z.object({
  enrollment_id: z.coerce.number().min(1, "Seleccione uma matrícula/curso"),
  method: z.enum(["cash", "transfer", "card"]),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function fmtAOA(v: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-PT");
}

/** Extract a descriptive error message from an axios error */
function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; error?: string }
      | undefined;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    const status = err.response?.status;
    if (status === 400)
      return "Dados inválidos. Verifique todos os campos e tente novamente.";
    if (status === 404)
      return "Registo não encontrado. Atualize a página e tente novamente.";
    if (status === 409)
      return "Este registo já existe ou há um conflito de dados.";
    if (status === 500)
      return "Erro interno do servidor. Contacte o administrador.";
    if (!err.response) return "Sem ligação ao servidor. Verifique a sua rede.";
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Numerário",
  transfer: "Transferência",
  card: "Cartão",
};

export default function Payments() {
  const qc = useQueryClient();

  // Main list filter
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMethod, setFilterMethod] = useState("");

  // Create modal state
  const [createModal, setCreateModal] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: paymentsApi.getAll,
  });
  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    queryFn: enrollmentsApi.getAll,
  });
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.getAll,
  });
  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: "cash" },
  });

  const watchedEnrollmentId = watch("enrollment_id");

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const enrollment = enrollments.find(
        (e) => e.id === Number(data.enrollment_id),
      );
      const course = courses.find((c) => c.id === enrollment?.course_id);
      return paymentsApi.create({
        enrollment_id: data.enrollment_id,
        amount: course?.price ?? enrollment?.total_amount ?? 0,
        method: data.method,
        notes: data.notes,
      } as Payment);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      closeModal();
    },
    onError: (err) => setServerError(apiError(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: paymentsApi.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });

  const openCreate = () => {
    reset({ method: "cash" });
    setStudentSearch("");
    setSelectedStudentId(null);
    setServerError(null);
    setCreateModal(true);
  };

  const closeModal = () => {
    setCreateModal(false);
    setStudentSearch("");
    setSelectedStudentId(null);
    setServerError(null);
    reset({});
  };

  const onSubmit = (data: FormData) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  // Students matching the search box inside the modal
  const filteredStudentsInModal = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 8);
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.bi.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q),
    );
  }, [students, studentSearch]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Enrollments for selected student, enriched with course name/price
  const studentEnrollments = useMemo(
    () => enrollments.filter((e) => e.student_id === selectedStudentId),
    [enrollments, selectedStudentId],
  );

  // Auto-fill price: look at selected enrollment's course
  const previewEnrollment = enrollments.find(
    (e) => e.id === Number(watchedEnrollmentId),
  );
  const previewCourse = courses.find(
    (c) => c.id === previewEnrollment?.course_id,
  );
  const previewAmount =
    previewCourse?.price ?? previewEnrollment?.total_amount ?? null;

  // ── Main table filter ───────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return payments.filter((p) => {
      if (
        term &&
        !(p.student_name ?? "").toLowerCase().includes(term) &&
        !(p.course_name ?? "").toLowerCase().includes(term) &&
        !String(p.enrollment_id).includes(term) &&
        !fmtAOA(p.amount).toLowerCase().includes(term)
      )
        return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterMethod && p.method !== filterMethod) return false;
      return true;
    });
  }, [payments, search, filterStatus, filterMethod]);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
          Kz
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">
            {fmtAOA(totalPaid)}
          </p>
          <p className="text-sm text-slate-500">
            Total recebido (pagamentos confirmados)
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Text search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por estudante, curso..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600"
          >
            <option value="">Todos os estados</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {/* Method filter */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600"
          >
            <option value="">Todos os métodos</option>
            <option value="cash">Numerário</option>
            <option value="transfer">Transferência</option>
            <option value="card">Cartão</option>
          </select>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          <Plus size={15} />
          Registar Pagamento
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Estudante</th>
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3 text-left">Valor</th>
                  <th className="px-4 py-3 text-left">Método</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-center">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      {payments.length === 0
                        ? "Nenhum pagamento registado."
                        : "Nenhum pagamento corresponde aos filtros aplicados."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {p.student_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.course_name ?? `Matrícula #${p.enrollment_id}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {fmtAOA(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.method ? (METHOD_LABELS[p.method] ?? p.method) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {fmtDate(p.payment_date)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={statusLabel(p.status)}
                          variant={paymentStatusVariant(p.status)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          {p.status !== "cancelled" && (
                            <button
                              onClick={() =>
                                p.id && cancelMutation.mutate(p.id)
                              }
                              title="Cancelar pagamento"
                              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            {filtered.length} de {payments.length} pagamento(s)
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      {createModal && (
        <Modal title="Registar Pagamento" onClose={closeModal} size="md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Student search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pesquisar estudante
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudentId(null);
                    reset({ method: "cash" });
                  }}
                  placeholder="Nome, BI ou email..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Student results list */}
              {!selectedStudentId && filteredStudentsInModal.length > 0 && (
                <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {filteredStudentsInModal.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(s.id ?? null);
                        setStudentSearch(s.name);
                        reset({ method: "cash" });
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left border-b border-slate-50 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User size={13} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-400">BI: {s.bi}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected student chip */}
              {selectedStudent && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <User size={14} className="text-blue-600 shrink-0" />
                  <span className="font-medium text-blue-800">
                    {selectedStudent.name}
                  </span>
                  <span className="text-blue-500 text-xs">
                    · BI: {selectedStudent.bi}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(null);
                      setStudentSearch("");
                      reset({ method: "cash" });
                    }}
                    className="ml-auto text-blue-400 hover:text-blue-700"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Course / Enrollment dropdown (only after student selected) */}
            {selectedStudentId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Curso (matrícula) *
                </label>
                <select
                  {...register("enrollment_id")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Seleccionar curso —</option>
                  {studentEnrollments.length === 0 ? (
                    <option disabled>
                      Este estudante não tem matrículas activas
                    </option>
                  ) : (
                    studentEnrollments.map((e) => {
                      const courseName =
                        e.course_name ??
                        courses.find((c) => c.id === e.course_id)?.name ??
                        `Curso #${e.course_id}`;
                      return (
                        <option key={e.id} value={e.id}>
                          {courseName}
                        </option>
                      );
                    })
                  )}
                </select>
                {errors.enrollment_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.enrollment_id.message}
                  </p>
                )}
              </div>
            )}

            {/* Auto-filled amount */}
            {previewAmount !== null && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor a pagar
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-base">
                    {fmtAOA(previewAmount)}
                  </span>
                  <span className="text-xs text-slate-400">
                    (preço do curso)
                  </span>
                </div>
              </div>
            )}

            {/* Method */}
            {selectedStudentId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Método de Pagamento *
                  </label>
                  <select
                    {...register("method")}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="cash">Numerário</option>
                    <option value="transfer">Transferência bancária</option>
                    <option value="card">Cartão de débito/crédito</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Observações
                  </label>
                  <input
                    {...register("notes")}
                    placeholder="Referência, recibo, notas..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <strong>Erro:</strong> {serverError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !selectedStudentId ||
                  studentEnrollments.length === 0
                }
                className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60"
              >
                {createMutation.isPending ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
