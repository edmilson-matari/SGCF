import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Loader2,
  Users,
  BookOpen,
  Clock,
  ChevronRight,
  XCircle,
} from "lucide-react";
import axios from "axios";
import * as enrollmentsApi from "@/api/enrollments";
import * as studentsApi from "@/api/students";
import * as coursesApi from "@/api/courses";
import type { Enrollment, Course } from "@/types";
import Modal from "@/components/ui/Modal";
import Badge, {
  enrollmentStatusVariant,
  statusLabel,
} from "@/components/ui/Badge";

const schema = z.object({
  student_id: z.coerce.number().min(1, "Seleccione um estudante"),
  course_id: z.coerce.number().min(1, "Seleccione um curso"),
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

function formatDays(days?: string) {
  if (!days) return null;
  return days
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .join(", ");
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
      return "Dados inválidos. Verifique se o estudante não está já matriculado neste curso.";
    if (status === 404)
      return "Estudante ou curso não encontrado. Atualize a página e tente novamente.";
    if (status === 409)
      return "Este estudante já está matriculado neste curso.";
    if (status === 500)
      return "Erro interno do servidor. Contacte o administrador.";
    if (!err.response) return "Sem ligação ao servidor. Verifique a sua rede.";
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export default function Enrollments() {
  const qc = useQueryClient();

  const [courseSearch, setCourseSearch] = useState("");
  const [modal, setModal] = useState<
    "create" | "status" | "courseDetail" | null
  >(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: enrollmentsApi.getAll,
  });
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.getAll,
  });
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesApi.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedCourseId = useWatch({ control, name: "course_id" });
  const previewCourse = courses.find((c) => c.id === Number(watchedCourseId));

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      enrollmentsApi.create({
        student_id: data.student_id,
        course_id: data.course_id,
        total_amount:
          courses.find((c) => c.id === Number(data.course_id))?.price ?? 0,
      } as Enrollment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      closeModal();
    },
    onError: (err) => setServerError(apiError(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      enrollmentsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      closeModal();
    },
    onError: (err) => setServerError(apiError(err)),
  });

  const openCreate = () => {
    reset({});
    setStudentSearch("");
    setSelectedStudentId(null);
    setServerError(null);
    setModal("create");
  };

  const openCourseDetail = (course: Course) => {
    setSelectedCourse(course);
    setModal("courseDetail");
  };

  const openStatus = (e: Enrollment, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setSelectedEnrollment(e);
    setServerError(null);
    setModal("status");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedEnrollment(null);
    setSelectedCourse(null);
    setServerError(null);
    setStudentSearch("");
    setSelectedStudentId(null);
    reset({});
  };

  const onSubmit = (data: FormData) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  // Build a map: course_id → enrollments[]
  const enrollmentsByCourse = useMemo(() => {
    const map = new Map<number, Enrollment[]>();
    for (const e of enrollments) {
      const list = map.get(e.course_id) ?? [];
      list.push(e);
      map.set(e.course_id, list);
    }
    return map;
  }, [enrollments]);

  // Courses to display (all courses, filtered by search)
  const filteredCourses = useMemo(() => {
    const q = courseSearch.toLowerCase().trim();
    return courses.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q),
    );
  }, [courses, courseSearch]);

  // Enrollments for selected course (in detail modal)
  const courseEnrollments = useMemo(
    () =>
      selectedCourse ? (enrollmentsByCourse.get(selectedCourse.id!) ?? []) : [],
    [enrollmentsByCourse, selectedCourse],
  );

  const isLoading = enrollmentsLoading || coursesLoading;

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
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            placeholder="Pesquisar curso..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          <Plus size={15} />
          Nova Matrícula
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-400 mb-0.5">Total de cursos</p>
          <p className="text-2xl font-bold text-slate-800">{courses.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-400 mb-0.5">Total de matrículas</p>
          <p className="text-2xl font-bold text-slate-800">
            {enrollments.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-400 mb-0.5">Matrículas activas</p>
          <p className="text-2xl font-bold text-emerald-600">
            {enrollments.filter((e) => e.status === "active").length}
          </p>
        </div>
      </div>

      {/* Course cards grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
          {courses.length === 0
            ? "Nenhum curso cadastrado. Crie um curso primeiro."
            : "Nenhum curso corresponde à pesquisa."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const courseEnrolList = enrollmentsByCourse.get(course.id!) ?? [];
            const active = courseEnrolList.filter(
              (e) => e.status === "active",
            ).length;
            const days = formatDays(course.schedule_days);

            return (
              <button
                key={course.id}
                type="button"
                onClick={() => openCourseDetail(course)}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BookOpen size={18} className="text-blue-600" />
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-blue-500 transition-colors mt-1"
                  />
                </div>

                {/* Course name */}
                <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1">
                  {course.name}
                </h3>
                {course.description && (
                  <p className="text-xs text-slate-400 truncate mb-3">
                    {course.description}
                  </p>
                )}

                {/* Schedule */}
                {(days || course.schedule_time) && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <Clock size={11} />
                    <span>
                      {days}
                      {course.schedule_time ? ` · ${course.schedule_time}` : ""}
                    </span>
                  </div>
                )}

                {/* Footer row */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users size={13} />
                    <span>
                      <span className="font-semibold text-slate-700">
                        {courseEnrolList.length}
                      </span>{" "}
                      matriculado{courseEnrolList.length !== 1 ? "s" : ""}
                      {active > 0 && (
                        <span className="text-emerald-600 ml-1">
                          ({active} activo{active !== 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-700">
                    {fmtAOA(course.price)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Course detail modal — students enrolled */}
      {modal === "courseDetail" && selectedCourse && (
        <Modal title={selectedCourse.name} onClose={closeModal} size="lg">
          {/* Course info strip */}
          <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-slate-100 text-sm text-slate-600">
            <span>
              <span className="text-slate-400 text-xs">Preço</span>{" "}
              <span className="font-semibold text-slate-800">
                {fmtAOA(selectedCourse.price)}
              </span>
            </span>
            <span>
              <span className="text-slate-400 text-xs">Duração</span>{" "}
              <span className="font-semibold text-slate-800">
                {selectedCourse.duration_hours}h
              </span>
            </span>
            {(selectedCourse.schedule_days || selectedCourse.schedule_time) && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDays(selectedCourse.schedule_days)}
                {selectedCourse.schedule_time
                  ? ` · ${selectedCourse.schedule_time}`
                  : ""}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users size={14} className="text-blue-600" />
              Estudantes matriculados ({courseEnrollments.length})
            </h4>
          </div>

          {courseEnrollments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8 bg-slate-50 rounded-lg">
              Nenhum estudante matriculado neste curso.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left">Estudante</th>
                    <th className="px-4 py-2.5 text-left">Data de Inscrição</th>
                    <th className="px-4 py-2.5 text-left">Propina</th>
                    <th className="px-4 py-2.5 text-left">Estado</th>
                    <th className="px-4 py-2.5 text-center">Acção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {courseEnrollments.map((e) => {
                    const studentName =
                      e.student_name ??
                      students.find((s) => s.id === e.student_id)?.name ??
                      `Estudante #${e.student_id}`;
                    return (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {studentName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {fmtDate(e.enrollment_date)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {fmtAOA(e.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            label={statusLabel(e.status)}
                            variant={enrollmentStatusVariant(e.status)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <button
                              onClick={(ev) => openStatus(e, ev)}
                              className="px-2 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                            >
                              Alterar Estado
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* New enrollment modal */}
      {modal === "create" && (
        <Modal title="Nova Matrícula" onClose={closeModal}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estudante *
              </label>
              {selectedStudentId ? (
                <div className="flex items-center justify-between px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-sm">
                  <span className="font-medium text-slate-800">
                    {students.find((s) => s.id === selectedStudentId)?.name ??
                      `Estudante #${selectedStudentId}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(null);
                      setStudentSearch("");
                      setValue("student_id", 0 as never);
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
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Pesquisar por nome ou BI..."
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  {studentSearch.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {students
                        .filter((s) => {
                          const q = studentSearch.toLowerCase();
                          return (
                            s.name.toLowerCase().includes(q) ||
                            s.bi.toLowerCase().includes(q) ||
                            (s.email ?? "").toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 8)
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(s.id!);
                              setValue("student_id", s.id as never);
                              setStudentSearch("");
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {s.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                BI: {s.bi}
                              </p>
                            </div>
                          </button>
                        ))}
                      {students.filter((s) => {
                        const q = studentSearch.toLowerCase();
                        return (
                          s.name.toLowerCase().includes(q) ||
                          s.bi.toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                        <p className="px-3 py-3 text-xs text-slate-400 text-center">
                          Nenhum estudante encontrado.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.student_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.student_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Curso *
              </label>
              <select
                {...register("course_id")}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Seleccionar —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {fmtAOA(c.price)}
                  </option>
                ))}
              </select>
              {errors.course_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.course_id.message}
                </p>
              )}
            </div>

            {/* Auto-fill price */}
            {previewCourse && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor da propina
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-base">
                    {fmtAOA(previewCourse.price)}
                  </span>
                  <span className="text-xs text-slate-400">
                    (preço do curso — automático)
                  </span>
                </div>
              </div>
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
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60"
              >
                {createMutation.isPending ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status change modal */}
      {modal === "status" && selectedEnrollment && (
        <Modal
          title="Alterar Estado da Matrícula"
          onClose={closeModal}
          size="sm"
        >
          <p className="text-sm text-slate-600 mb-4">
            Estudante:{" "}
            <strong>
              {selectedEnrollment.student_name ??
                students.find((s) => s.id === selectedEnrollment.student_id)
                  ?.name ??
                `#${selectedEnrollment.student_id}`}
            </strong>
          </p>
          <div className="space-y-2">
            {(["active", "completed", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() =>
                  selectedEnrollment.id &&
                  statusMutation.mutate({
                    id: selectedEnrollment.id,
                    status: s,
                  })
                }
                disabled={
                  selectedEnrollment.status === s || statusMutation.isPending
                }
                className="w-full py-2 px-3 text-sm text-left border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {statusLabel(s)}
                {selectedEnrollment.status === s && " (actual)"}
              </button>
            ))}
          </div>
          {serverError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              <strong>Erro:</strong> {serverError}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
