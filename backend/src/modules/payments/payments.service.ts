import * as repo from "./payments.repository.ts";
import { pool } from "../../config/databases.ts";
import type { Payment } from "../../models/Payments.ts";

export const getAll = async () => {
  return repo.findAll();
};

export const getByEnrollment = async (enrollment_id: number) => {
  return repo.findByEnrollment(enrollment_id);
};

export const create = async (payment: Payment) => {
  // Validate enrollment exists and the student is actively enrolled
  const enrollmentResult = await pool.query(
    `SELECT e.id, e.total_amount, e.status, e.student_id, e.course_id,
            s.name AS student_name, c.name AS course_name
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     JOIN courses  c ON e.course_id  = c.id
     WHERE e.id = $1`,
    [payment.enrollment_id],
  );
  const enrollment = enrollmentResult.rows[0];
  if (!enrollment) throw new Error("Matrícula não encontrada");

  if (enrollment.status === "cancelled")
    throw new Error(
      `O estudante "${enrollment.student_name}" não está matriculado activamente no curso "${enrollment.course_name}" (matrícula cancelada).`,
    );
  if (enrollment.status === "completed")
    throw new Error(
      `O estudante "${enrollment.student_name}" já concluiu o curso "${enrollment.course_name}" e o valor total já foi liquidado.`,
    );
  if (enrollment.status !== "active")
    throw new Error(
      `O estudante "${enrollment.student_name}" não possui matrícula activa no curso "${enrollment.course_name}".`,
    );

  // Check if payment would exceed total_amount
  const totalPaid = await repo.getTotalPaid(payment.enrollment_id);
  const remaining = Number(enrollment.total_amount) - totalPaid;
  if (payment.amount > remaining) {
    throw new Error(
      `Valor excede o saldo restante. Restante: ${remaining.toFixed(2)}`,
    );
  }

  const newPayment = await repo.create(payment);

  // If fully paid, mark enrollment as completed
  if (totalPaid + payment.amount >= Number(enrollment.total_amount)) {
    await pool.query(
      "UPDATE enrollments SET status = 'completed' WHERE id = $1",
      [payment.enrollment_id],
    );
  }

  return newPayment;
};

export const cancel = async (id: number) => {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Pagamento não encontrado");
  if (existing.status === "cancelled")
    throw new Error("Pagamento já cancelado");
  return repo.cancel(id);
};

export const getDashboard = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM students WHERE status = 'active') AS total_students,
      (SELECT COUNT(*) FROM instructors WHERE status = 'active') AS total_instructors,
      (SELECT COUNT(*) FROM courses WHERE status = 'active') AS total_courses,
      (SELECT COUNT(*) FROM enrollments WHERE status = 'active') AS active_enrollments,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') AS total_revenue
  `);
  return result.rows[0];
};
