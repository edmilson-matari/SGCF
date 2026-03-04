import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { angolanPhone, PHONE_MESSAGE } from "@/utils/validators";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  Clock,
  BookOpen,
} from "lucide-react";
import * as instructorsApi from "@/api/instructors";
import * as coursesApi from "@/api/courses";
import type { Instructor, Course } from "@/types";
import Modal from "@/components/ui/Modal";
import Badge, {
  genericStatusVariant,
  statusLabel,
} from "@/components/ui/Badge";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .regex(angolanPhone, PHONE_MESSAGE)
    .optional()
    .or(z.literal("")),
  course_name: z.string().optional(), // stored as specialty
  status: z.enum(["active", "inactive"]).optional(),
});

type FormData = z.infer<typeof schema>;

function formatDays(days?: string) {
  if (!days) return "—";
  return days
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .join(", ");
}

function fmtAOA(v: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function Instructors() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "detail" | null>(null);
  const [selected, setSelected] = useState<Instructor | null>(null);

  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ["instructors"],
    queryFn: instructorsApi.getAll,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.getAll,
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
    mutationFn: (data: FormData) =>
      instructorsApi.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        specialty: data.course_name,
        status: data.status,
      } as Instructor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructors"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      instructorsApi.update(id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        specialty: data.course_name,
        status: data.status,
      } as Partial<Instructor>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructors"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: instructorsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instructors"] }),
  });

  const openCreate = () => {
    reset({});
    setSelected(null);
    setModal("create");
  };

  const openEdit = (i: Instructor) => {
    setSelected(i);
    reset({
      name: i.name,
      email: i.email,
      phone: i.phone ?? "",
      course_name: i.specialty ?? "",
      status: i.status,
    });
    setModal("edit");
  };

  const openDetail = (i: Instructor) => {
    setSelected(i);
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
      createMutation.mutate(data);
    }
  };

  const filtered = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()),
  );

  // Courses taught by this instructor (for detail modal)
  const instructorCourses = (id?: number): Course[] =>
    courses.filter((c) => c.instructor_id === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar instrutor..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          <Plus size={15} />
          Novo Instrutor
        </button>
      </div>

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
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Telefone</th>
                  <th className="px-4 py-3 text-left">Curso</th>
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
                      Nenhum instrutor encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((i) => (
                    <tr
                      key={i.id}
                      onClick={() => openDetail(i)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {i.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{i.email}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {i.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {i.specialty ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={statusLabel(i.status)}
                          variant={genericStatusVariant(i.status)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openDetail(i)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Ver detalhes"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(i)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => i.id && deleteMutation.mutate(i.id)}
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
            {filtered.length} de {instructors.length} instrutor(es)
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "create" ? "Novo Instrutor" : "Editar Instrutor"}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome *
                </label>
                <input
                  {...register("name")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Curso
                </label>
                <select
                  {...register("course_name")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Seleccionar curso —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
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
                className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "A guardar..."
                  : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {modal === "detail" && selected && (
        <Modal
          title={`Detalhes — ${selected.name}`}
          onClose={closeModal}
          size="lg"
        >
          {/* Info row */}
          <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Email</p>
              <p className="font-medium text-slate-800">{selected.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Telefone</p>
              <p className="font-medium text-slate-800">
                {selected.phone ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">
                Curso (especialidade)
              </p>
              <p className="font-medium text-slate-800">
                {selected.specialty ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Estado</p>
              <Badge
                label={statusLabel(selected.status)}
                variant={genericStatusVariant(selected.status)}
              />
            </div>
          </div>

          {/* Courses section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-blue-600" />
              <h4 className="text-sm font-semibold text-slate-700">
                Cursos que lecciona
              </h4>
            </div>
            {instructorCourses(selected.id).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">
                Nenhum curso atribuído a este instrutor.
              </p>
            ) : (
              <div className="space-y-2">
                {instructorCourses(selected.id).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">
                        {c.name}
                      </p>
                      {c.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {c.description}
                        </p>
                      )}
                      {(c.schedule_days || c.schedule_time) && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                          <Clock size={11} />
                          <span>
                            {formatDays(c.schedule_days)}
                            {c.schedule_time ? ` · ${c.schedule_time}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {fmtAOA(c.price)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.duration_hours}h
                      </p>
                      <div className="mt-1">
                        <Badge
                          label={statusLabel(c.status)}
                          variant={genericStatusVariant(c.status)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
