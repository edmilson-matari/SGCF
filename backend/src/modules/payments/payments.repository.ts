import { pool } from "../../config/databases.ts";
import type { Payment } from "../../models/Payments.ts";

export const findAll = async () => {
  const result = await pool.query(
    `SELECT p.*, s.name AS student_name, c.name AS course_name
     FROM payments p
     JOIN enrollments e ON p.enrollment_id = e.id
     JOIN students s ON e.student_id = s.id
     JOIN courses c ON e.course_id = c.id
     ORDER BY p.payment_date DESC`,
  );
  return result.rows;
};

export const findByEnrollment = async (enrollment_id: number) => {
  const result = await pool.query(
    `SELECT p.*,
            SUM(p.amount) OVER (PARTITION BY p.enrollment_id) AS total_paid,
            e.total_amount
     FROM payments p
     JOIN enrollments e ON p.enrollment_id = e.id
     WHERE p.enrollment_id = $1
     ORDER BY p.payment_date DESC`,
    [enrollment_id],
  );
  return result.rows;
};

export const findById = async (id: number) => {
  const result = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
  return result.rows[0];
};

export const getTotalPaid = async (enrollment_id: number) => {
  const result = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE enrollment_id = $1 AND status = 'paid'",
    [enrollment_id],
  );
  return Number(result.rows[0]?.total ?? 0);
};

export const create = async (payment: Payment) => {
  const result = await pool.query(
    `INSERT INTO payments (enrollment_id, amount, method, status, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      payment.enrollment_id,
      payment.amount,
      payment.method ?? "cash",
      payment.status ?? "paid",
      payment.notes ?? null,
    ],
  );
  return result.rows[0];
};

export const cancel = async (id: number) => {
  const result = await pool.query(
    "UPDATE payments SET status = 'cancelled' WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};
