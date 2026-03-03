import api from "./axios";
import type { Student } from "@/types";

export const getAll = async (): Promise<Student[]> => {
  const res = await api.get<Student[]>("/students");
  return res.data;
};

export const getById = async (id: number): Promise<Student> => {
  const res = await api.get<Student>(`/students/${id}`);
  return res.data;
};

export const create = async (
  data: Omit<Student, "id" | "created_at" | "updated_at">,
): Promise<Student> => {
  const res = await api.post<Student>("/students/create", data);
  return res.data;
};

export const update = async (
  id: number,
  data: Partial<Student>,
): Promise<Student> => {
  const res = await api.put<Student>(`/students/${id}`, data);
  return res.data;
};

export const remove = async (id: number): Promise<void> => {
  await api.delete(`/students/${id}`);
};
