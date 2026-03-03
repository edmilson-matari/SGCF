import api from "./axios";
import type { Payment } from "@/types";

export const getAll = async (): Promise<Payment[]> => {
  const res = await api.get<Payment[]>("/payments");
  return res.data;
};

export const getByEnrollment = async (
  enrollmentId: number,
): Promise<Payment[]> => {
  const res = await api.get<Payment[]>(`/payments/enrollment/${enrollmentId}`);
  return res.data;
};

export const create = async (
  data: Omit<Payment, "id" | "created_at">,
): Promise<Payment> => {
  const res = await api.post<Payment>("/payments", data);
  return res.data;
};

export const cancel = async (id: number): Promise<Payment> => {
  const res = await api.patch<Payment>(`/payments/${id}/cancel`);
  return res.data;
};
