import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  angolanBI,
  angolanPhone,
  BI_MESSAGE,
  PHONE_MESSAGE,
} from "@/utils/validators";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  BookOpen,
  CreditCard,
} from "lucide-react";
import * as studentsApi from "@/api/students";
import * as enrollmentsApi from "@/api/enrollments";
import * as paymentsApi from "@/api/payments";
import type { Student } from "@/types";
import Modal from "@/components/ui/Modal";
import Badge, {
  studentStatusVariant,
  enrollmentStatusVariant,
  paymentStatusVariant,
  statusLabel,
} from "@/components/ui/Badge";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  bi: z.string().min(1, "BI obrigatório").regex(angolanBI, BI_MESSAGE),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(angolanPhone, PHONE_MESSAGE)
    .optional()
    .or(z.literal("")),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive", "graduated"]).optional(),
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

export default function Students() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "detail" | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.getAll,
  });

  // Load all enrollments and payments once for the detail modal
  const { data: allEnrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    queryFn: enrollmentsApi.getAll,
  });
  const { data: allPayments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: paymentsApi.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Student> }) =>
      studentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });

  const openCreate = () => {
    reset({});
    setSelected(null);
    setModal("create");
  };

  const openEdit = (s: Student) => {
    setSelected(s);
    reset({
      name: s.name,
      bi: s.bi,
      email: s.email ?? "",
      phone: s.phone ?? "",
      date_of_birth: s.date_of_birth
        ? String(s.date_of_birth).slice(0, 10)
        : "",
      address: s.address ?? "",
      status: s.status,
    });
    setModal("edit");
  };

  const openDetail = (s: Student) => {
    setSelected(s);
    setModal("detail");
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  const onSubmit = (data: FormData) => {
    if (modal === "edit" && selected?.id) {
      updateMutation.mutate({ id: selected.id, data });
    } else {
      createMutation.mutate(data as Student);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.bi.toLowerCase().includes(search.toLowerCase()),
  );

  // Detail: enrollments for selected student
  const studentEnrollments = allEnrollments.filter(
    (e) => e.student_id === selected?.id,
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar estudante..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 w-64"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded-lg text-sm font-medium hover:bg-teal-900 transition-colors"
        >
          <Plus size={15} />
          Novo Estudante
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
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">BI</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Telefone</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-center">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Nenhum estudante encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => openDetail(s)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.bi}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={statusLabel(s.status)}
                          variant={studentStatusVariant(s.status)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openDetail(s)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Ver detalhes"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-teal-50 hover:text-teal-700"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => s.id && deleteMutation.mutate(s.id)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
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
            {filtered.length} de {students.length} estudante(s)
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {modal === "detail" && selected && (
        <Modal
          title={`Detalhes — ${selected.name}`}
          onClose={closeModal}
          size="lg"
        >
          {/* Basic info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">BI</p>
              <p className="font-medium text-slate-800">{selected.bi}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Email</p>
              <p className="font-medium text-slate-800">
                {selected.email ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Telefone</p>
              <p className="font-medium text-slate-800">
                {selected.phone ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Nascimento</p>
              <p className="font-medium text-slate-800">
                {fmtDate(selected.date_of_birth)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Morada</p>
              <p className="font-medium text-slate-800">
                {selected.address ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Estado</p>
              <Badge
                label={statusLabel(selected.status)}
                variant={studentStatusVariant(selected.status)}
              />
            </div>
          </div>

          {/* Enrollments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-teal-700" />
              <h4 className="text-sm font-semibold text-slate-700">
                Matrículas
              </h4>
            </div>
            {studentEnrollments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">
                Nenhuma matrícula registada.
              </p>
            ) : (
              <div className="space-y-3">
                {studentEnrollments.map((e) => {
                  const payments = allPayments.filter(
                    (p) => p.enrollment_id === e.id,
                  );
                  const totalPaid = payments
                    .filter((p) => p.status === "paid")
                    .reduce((sum, p) => sum + p.amount, 0);
                  const totalPending = (e.total_amount ?? 0) - totalPaid;

                  return (
                    <div
                      key={e.id}
                      className="border border-slate-100 rounded-lg overflow-hidden"
                    >
                      {/* Enrollment header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">
                            {e.course_name ?? `Curso #${e.course_id}`}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Inscrito em {fmtDate(e.enrollment_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            label={statusLabel(e.status)}
                            variant={enrollmentStatusVariant(e.status)}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Total: {fmtAOA(e.total_amount)}
                          </p>
                        </div>
                      </div>

                      {/* Payment summary */}
                      <div className="px-4 py-2 flex items-center gap-4 text-xs border-t border-slate-100">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CreditCard size={11} />
                          <span>Pago: {fmtAOA(totalPaid)}</span>
                        </div>
                        {totalPending > 0 && (
                          <div className="text-amber-600">
                            Em falta: {fmtAOA(totalPending)}
                          </div>
                        )}
                      </div>

                      {/* Individual payments */}
                      {payments.length > 0 && (
                        <div className="divide-y divide-slate-50">
                          {payments.map((p) => (
                            <div
                              key={p.id}
                              className="px-4 py-2 flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-500">
                                {fmtDate(p.payment_date)}
                                {p.method
                                  ? ` · ${p.method === "cash" ? "Numerário" : p.method === "transfer" ? "Transferência" : "Cartão"}`
                                  : ""}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">
                                  {fmtAOA(p.amount)}
                                </span>
                                <Badge
                                  label={statusLabel(p.status)}
                                  variant={paymentStatusVariant(p.status)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "create" ? "Novo Estudante" : "Editar Estudante"}
          onClose={closeModal}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome *
                </label>
                <input
                  {...register("name")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  BI *
                </label>
                <input
                  {...register("bi")}
                  placeholder="004567890LA011"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.bi && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bi.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefone
                </label>
                <input
                  {...register("phone")}
                  placeholder="923456789"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  {...register("date_of_birth")}
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="graduated">Formado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Morada
                </label>
                <input
                  {...register("address")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <p className="text-red-500 text-sm">
                Erro ao guardar. Tente novamente.
              </p>
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
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 text-sm bg-teal-800 text-white rounded-lg hover:bg-teal-900 disabled:opacity-60"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "A guardar..."
                  : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
