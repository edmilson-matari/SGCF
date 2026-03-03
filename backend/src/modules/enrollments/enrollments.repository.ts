import { pool } from "../../config/databases.ts";
import type { Enrollment } from "../../models/Enrollments.ts";

export const findAll = async () => {
  const result = await pool.query(
    `SELECT e.*, s.name AS student_name, c.name AS course_name
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     JOIN courses c ON e.course_id = c.id
     ORDER BY e.enrollment_date DESC`,
  );
  return result.rows;
};

export const findById = async (id: number) => {
  const result = await pool.query(
    `SELECT e.*, s.name AS student_name, c.name AS course_name
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     JOIN courses c ON e.course_id = c.id
     WHERE e.id = $1`,
    [id],
  );
  return result.rows[0];
};

export const findByStudent = async (student_id: number) => {
  const result = await pool.query(
    `SELECT e.*, c.name AS course_name, c.price AS course_price
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.student_id = $1
     ORDER BY e.enrollment_date DESC`,
    [student_id],
  );
  return result.rows;
};

export const findDuplicate = async (student_id: number, course_id: number) => {
  const result = await pool.query(
    "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND status != 'cancelled'",
    [student_id, course_id],
  );
  return result.rows[0];
};

export const create = async (enrollment: Enrollment) => {
  const result = await pool.query(
    `INSERT INTO enrollments (student_id, course_id, total_amount)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [enrollment.student_id, enrollment.course_id, enrollment.total_amount],
  );
  return result.rows[0];
};

export const updateStatus = async (id: number, status: string) => {
  const result = await pool.query(
    "UPDATE enrollments SET status = $1 WHERE id = $2 RETURNING *",
    [status, id],
  );
  return result.rows[0];
};
