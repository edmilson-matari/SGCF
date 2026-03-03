import api from "./axios";
import type { Enrollment } from "@/types";

export const getAll = async (): Promise<Enrollment[]> => {
  const res = await api.get<Enrollment[]>("/enrollments");
  return res.data;
};

export const getById = async (id: number): Promise<Enrollment> => {
  const res = await api.get<Enrollment>(`/enrollments/${id}`);
  return res.data;
};

export const getByStudent = async (
  studentId: number,
): Promise<Enrollment[]> => {
  const res = await api.get<Enrollment[]>(`/enrollments/student/${studentId}`);
  return res.data;
};

export const create = async (
  data: Omit<Enrollment, "id" | "created_at" | "updated_at">,
): Promise<Enrollment> => {
  const res = await api.post<Enrollment>("/enrollments", data);
  return res.data;
};

export const updateStatus = async (
  id: number,
  status: string,
): Promise<Enrollment> => {
  const res = await api.patch<Enrollment>(`/enrollments/${id}/status`, {
    status,
  });
  return res.data;
};
