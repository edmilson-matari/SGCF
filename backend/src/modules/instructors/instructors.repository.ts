import { pool } from "../../config/databases.ts";
import type { Instructor } from "../../models/Instructor.ts";

export const findAll = async () => {
  const result = await pool.query(
    "SELECT * FROM instructors WHERE status = 'active' ORDER BY name ASC",
  );
  return result.rows;
};

export const findById = async (id: number) => {
  const result = await pool.query("SELECT * FROM instructors WHERE id = $1", [
    id,
  ]);
  return result.rows[0];
};

export const findByEmail = async (email: string) => {
  const result = await pool.query(
    "SELECT id FROM instructors WHERE email = $1",
    [email],
  );
  return result.rows[0];
};

export const create = async (instructor: Instructor) => {
  const result = await pool.query(
    `INSERT INTO instructors (name, email, phone, specialty)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      instructor.name,
      instructor.email,
      instructor.phone ?? null,
      instructor.specialty ?? null,
    ],
  );
  return result.rows[0];
};

export const update = async (id: number, fields: Partial<Instructor>) => {
  const { name, email, phone, specialty } = fields;
  const result = await pool.query(
    `UPDATE instructors
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         specialty = COALESCE($4, specialty)
     WHERE id = $5
     RETURNING *`,
    [name ?? null, email ?? null, phone ?? null, specialty ?? null, id],
  );
  return result.rows[0];
};

export const deactivate = async (id: number) => {
  const result = await pool.query(
    "UPDATE instructors SET status = 'inactive' WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};
