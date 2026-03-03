import { pool } from "../../config/databases.ts";
import type { Student } from "../../models/Student.ts";

export const findUserByBi = async (bi: string) => {
  const result = await pool.query("SELECT bi FROM students WHERE bi = $1", [
    bi,
  ]);
  return result.rows[0];
};

export const createStudent = async (student: Student) => {
  const user = await pool.query(
    "INSERT INTO students(name, email, phone, bi, date_of_birth, address) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
    [
      student.name,
      student.email,
      student.phone,
      student.bi,
      student.date_of_birth,
      student.address,
    ],
  );
  return user.rows[0];
};

export const getAllStudents = async () => {
  const allStudents = await pool.query(
    "SELECT id, name, email, phone, bi, date_of_birth, address, status FROM students ORDER BY name ASC",
  );
  return allStudents.rows;
};

export const findById = async (id: number) => {
  const result = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
  return result.rows[0];
};

export const updateStudent = async (id: number, fields: Partial<Student>) => {
  const { name, email, phone, address, date_of_birth, status } = fields;
  const result = await pool.query(
    `UPDATE students
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         address = COALESCE($4, address),
         date_of_birth = COALESCE($5, date_of_birth),
         status = COALESCE($6, status)
     WHERE id = $7
     RETURNING *`,
    [
      name ?? null,
      email ?? null,
      phone ?? null,
      address ?? null,
      date_of_birth ?? null,
      status ?? null,
      id,
    ],
  );
  return result.rows[0];
};

export const deactivateStudent = async (id: number) => {
  const result = await pool.query(
    "UPDATE students SET status = 'inactive' WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};
