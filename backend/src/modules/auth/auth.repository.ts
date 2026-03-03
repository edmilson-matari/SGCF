import { pool } from "../../config/databases.ts";

export const findUserByEmail = async (email: string) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

export const createUser = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  role: string,
) => {
  const newUser = await pool.query(
    "INSERT INTO users(name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [name, email, phone, password, role],
  );
  return newUser.rows[0];
};
