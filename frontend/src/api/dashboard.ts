import api from "./axios";
import type { DashboardStats } from "@/types";

export const getStats = async (): Promise<DashboardStats> => {
  const res = await api.get<DashboardStats>("/dashboard");
  return res.data;
};
