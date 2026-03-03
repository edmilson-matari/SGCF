import * as repo from "./enrollments.repository.ts";
import { pool } from "../../config/databases.ts";

export const getAll = async () => {
  return repo.findAll();
};

export const getById = async (id: number) => {
  const enrollment = await repo.findById(id);
  if (!enrollment) throw new Error("Matrícula não encontrada");
  return enrollment;
};

export const getByStudent = async (student_id: number) => {
  return repo.findByStudent(student_id);
};

export const create = async (student_id: number, course_id: number) => {
  // Check for duplicate active enrollment
  const duplicate = await repo.findDuplicate(student_id, course_id);
  if (duplicate) throw new Error("Estudante já está matriculado neste curso");

  // Fetch course price to set total_amount
  const courseResult = await pool.query(
    "SELECT price FROM courses WHERE id = $1 AND status = 'active'",
    [course_id],
  );
  const course = courseResult.rows[0];
  if (!course) throw new Error("Curso não encontrado ou inativo");

  return repo.create({ student_id, course_id, total_amount: course.price });
};

export const updateStatus = async (id: number, status: string) => {
  const allowed = ["active", "completed", "cancelled"];
  if (!allowed.includes(status)) throw new Error("Status inválido");
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Matrícula não encontrada");
  return repo.updateStatus(id, status);
};
