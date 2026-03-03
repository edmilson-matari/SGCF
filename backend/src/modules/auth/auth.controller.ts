import type { Request, Response } from "express";
import * as service from "./auth.service.ts";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, role, password } = req.body;
    const user = await service.register(name, email, phone, password, role);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await service.login(email, password);
    res.status(200).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
