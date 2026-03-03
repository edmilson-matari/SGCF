import api from "./axios";
import type { Course } from "@/types";

export const getAll = async (): Promise<Course[]> => {
  const res = await api.get<Course[]>("/courses");
  return res.data;
};

export const getById = async (id: number): Promise<Course> => {
  const res = await api.get<Course>(`/courses/${id}`);
  return res.data;
};

export const create = async (
  data: Omit<Course, "id" | "created_at" | "updated_at">,
): Promise<Course> => {
  const res = await api.post<Course>("/courses", data);
  return res.data;
};

export const update = async (
  id: number,
  data: Partial<Course>,
): Promise<Course> => {
  const res = await api.put<Course>(`/courses/${id}`, data);
  return res.data;
};

export const remove = async (id: number): Promise<void> => {
  await api.delete(`/courses/${id}`);
};
