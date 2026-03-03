import api from "./axios";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types";

export const login = async (data: LoginPayload): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
};

export const register = async (
  data: RegisterPayload,
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
};
