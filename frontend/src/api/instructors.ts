import api from "./axios";
import type { Instructor } from "@/types";

export const getAll = async (): Promise<Instructor[]> => {
  const res = await api.get<Instructor[]>("/instructors");
  return res.data;
};

export const getById = async (id: number): Promise<Instructor> => {
  const res = await api.get<Instructor>(`/instructors/${id}`);
  return res.data;
};

export const create = async (
  data: Omit<Instructor, "id" | "created_at" | "updated_at">,
): Promise<Instructor> => {
  const res = await api.post<Instructor>("/instructors", data);
  return res.data;
};

export const update = async (
  id: number,
  data: Partial<Instructor>,
): Promise<Instructor> => {
  const res = await api.put<Instructor>(`/instructors/${id}`, data);
  return res.data;
};

export const remove = async (id: number): Promise<void> => {
  await api.delete(`/instructors/${id}`);
};
