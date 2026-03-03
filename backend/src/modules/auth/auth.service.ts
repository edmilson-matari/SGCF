import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as repo from "./auth.repository.ts";
import { JWT_SECRET } from "../../config/jwt.ts";

export const register = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  role: string,
) => {
  const existing = await repo.findUserByEmail(email);
  if (existing) {
    throw new Error("User already registered");
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await repo.createUser(name, email, phone, hashed, role);
  return user;
};

export const login = async (email: string, password: string) => {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });
  const { id, name, phone } = user;
  return { id, name, phone, email, token };
};
