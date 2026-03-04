import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  XCircle,
} from "lucide-react";
import * as coursesApi from "@/api/courses";
import * as instructorsApi from "@/api/instructors";
import type { Course } from "@/types";
import Modal from "@/components/ui/Modal";
import Badge, {
  genericStatusVariant,
  statusLabel,
} from "@/components/ui/Badge";

const WEEKDAYS = [
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
];

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Preço inválido"),
  duration_hours: z.coerce.number().min(1, "Duração inválida"),
  instructor_id: z.coerce.number().optional(),
  schedule_time: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

type FormData = z.infer<typeof schema>;

function fmtAOA(v: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatDays(days?: string) {
  if (!days) return "—";
  return days
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .join(", ");
}

export default function Courses() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Course | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [instructorSearch, setInstructorSearch] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    number | null
  >(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.getAll,
  });
  const { data: instructors = [] } = useQuery({
    queryKey: ["instructors"],
    queryFn: instructorsApi.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Course> }) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: coursesApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });

  const openCreate = () => {
    reset({ status: "active" });
    setSelectedDays([]);
    setSelected(null);
    setInstructorSearch("");
    setSelectedInstructorId(null);
    setModal("create");
  };

  const openEdit = (c: Course) => {
    setSelected(c);
    reset({
      name: c.name,
      description: c.description ?? "",
      price: c.price,
      duration_hours: c.duration_hours,
      instructor_id: c.instructor_id,
      schedule_time: c.schedule_time ?? "",
      status: c.status,
    });
    setSelectedDays(
      c.schedule_days
        ? c.schedule_days
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [],
    );
    setInstructorSearch("");
    setSelectedInstructorId(c.instructor_id ?? null);
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setSelectedDays([]);
    setInstructorSearch("");
    setSelectedInstructorId(null);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const onSubmit = (data: FormData) => {
    const orderedKeys = WEEKDAYS.map((d) => d.key);
    const sortedDays = orderedKeys.filter((d) => selectedDays.includes(d));
    const payload: Partial<Course> = {
      ...data,
      schedule_days: sortedDays.length ? sortedDays.join(",") : undefined,
    };
    if (modal === "edit" && selected?.id)
      updateMutation.mutate({ id: selected.id, data: payload });
    else createMutation.mutate(payload as Course);
  };

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

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
            placeholder="Pesquisar curso..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 w-64"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded-lg text-sm font-medium hover:bg-teal-900 transition-colors"
        >
          <Plus size={15} />
          Novo Curso
        </button>
      </div>

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
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3 text-left">Instrutor</th>
                  <th className="px-4 py-3 text-left">Preço</th>
                  <th className="px-4 py-3 text-left">Duração</th>
                  <th className="px-4 py-3 text-left">Horário</th>
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
                      Nenhum curso encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{c.name}</p>
                        {c.description && (
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">
                            {c.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.instructor_name ??
                          instructors.find((i) => i.id === c.instructor_id)
                            ?.name ??
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {fmtAOA(c.price)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.duration_hours}h
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {c.schedule_days || c.schedule_time ? (
                          <div className="flex items-center gap-1">
                            <Clock
                              size={11}
                              className="text-slate-400 shrink-0"
                            />
                            <span>
                              {formatDays(c.schedule_days)}
                              {c.schedule_time ? ` · ${c.schedule_time}` : ""}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={statusLabel(c.status)}
                          variant={genericStatusVariant(c.status)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => c.id && deleteMutation.mutate(c.id)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"
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
            {filtered.length} de {courses.length} curso(s)
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === "create" ? "Novo Curso" : "Editar Curso"}
          onClose={closeModal}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descrição
                </label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Preço (AOA) *
                </label>
                <input
                  {...register("price")}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Duração (horas) *
                </label>
                <input
                  {...register("duration_hours")}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                {errors.duration_hours && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.duration_hours.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Instrutor
                </label>
                {selectedInstructorId ? (
                  <div className="flex items-center justify-between px-3 py-2 border border-teal-300 bg-teal-50 rounded-lg text-sm">
                    <span className="font-medium text-slate-800">
                      {instructors.find((i) => i.id === selectedInstructorId)
                        ?.name ?? `Instrutor #${selectedInstructorId}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInstructorId(null);
                        setInstructorSearch("");
                        setValue("instructor_id", undefined);
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={instructorSearch}
                      onChange={(e) => setInstructorSearch(e.target.value)}
                      placeholder="Pesquisar instrutor..."
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    {instructorSearch.trim() && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {instructors
                          .filter(
                            (i) =>
                              i.name
                                .toLowerCase()
                                .includes(instructorSearch.toLowerCase()) ||
                              (i.specialty ?? "")
                                .toLowerCase()
                                .includes(instructorSearch.toLowerCase()),
                          )
                          .slice(0, 8)
                          .map((i) => (
                            <button
                              key={i.id}
                              type="button"
                              onClick={() => {
                                setSelectedInstructorId(i.id!);
                                setValue("instructor_id", i.id as never);
                                setInstructorSearch("");
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-teal-50 text-left transition-colors"
                            >
                              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                                {i.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {i.name}
                                </p>
                                {i.specialty && (
                                  <p className="text-xs text-slate-400 truncate">
                                    {i.specialty}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        {instructors.filter((i) =>
                          i.name
                            .toLowerCase()
                            .includes(instructorSearch.toLowerCase()),
                        ).length === 0 && (
                          <p className="px-3 py-3 text-xs text-slate-400 text-center">
                            Nenhum instrutor encontrado.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                </select>
              </div>

              {/* Schedule days */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dias de aula (Seg–Sex)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {WEEKDAYS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        selectedDays.includes(key)
                          ? "bg-teal-800 text-white border-teal-800"
                          : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hora de início
                </label>
                <input
                  {...register("schedule_time")}
                  type="time"
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
