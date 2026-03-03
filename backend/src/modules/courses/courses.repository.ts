import { pool } from "../../config/databases.ts";
import type { Course } from "../../models/Course.ts";

export const findAll = async () => {
  const result = await pool.query(
    `SELECT c.*, i.name AS instructor_name
     FROM courses c
     LEFT JOIN instructors i ON c.instructor_id = i.id
     WHERE c.status = 'active'
     ORDER BY c.name ASC`,
  );
  return result.rows;
};

export const findById = async (id: number) => {
  const result = await pool.query(
    `SELECT c.*, i.name AS instructor_name
     FROM courses c
     LEFT JOIN instructors i ON c.instructor_id = i.id
     WHERE c.id = $1`,
    [id],
  );
  return result.rows[0];
};

export const findByName = async (name: string) => {
  const result = await pool.query(
    "SELECT id FROM courses WHERE LOWER(name) = LOWER($1)",
    [name],
  );
  return result.rows[0];
};

export const create = async (course: Course) => {
  const result = await pool.query(
    `INSERT INTO courses (name, description, price, duration_hours, instructor_id, schedule_days, schedule_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      course.name,
      course.description ?? null,
      course.price,
      course.duration_hours,
      course.instructor_id ?? null,
      course.schedule_days ?? null,
      course.schedule_time ?? null,
    ],
  );
  return result.rows[0];
};

export const update = async (id: number, fields: Partial<Course>) => {
  const {
    name,
    description,
    price,
    duration_hours,
    instructor_id,
    schedule_days,
    schedule_time,
  } = fields;
  const result = await pool.query(
    `UPDATE courses
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         price = COALESCE($3, price),
         duration_hours = COALESCE($4, duration_hours),
         instructor_id = COALESCE($5, instructor_id),
         schedule_days = COALESCE($6, schedule_days),
         schedule_time = COALESCE($7, schedule_time)
     WHERE id = $8
     RETURNING *`,
    [
      name ?? null,
      description ?? null,
      price ?? null,
      duration_hours ?? null,
      instructor_id ?? null,
      schedule_days,
      schedule_time,
      id,
    ],
  );
  return result.rows[0];
};

export const deactivate = async (id: number) => {
  const result = await pool.query(
    "UPDATE courses SET status = 'inactive' WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};

export const deleteCourse = async (id: number) => {
  const result = await pool.query("DELETE FROM courses WHERE id = $1", [id]);
  return result.rows[0];
};
