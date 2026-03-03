import type { Request, Response } from "express";
import * as service from "./instructors.service.ts";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const instructors = await service.getAll();
    res.status(200).json(instructors);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const instructor = await service.getById(Number(req.params["id"]));
    res.status(200).json(instructor);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, specialty } = req.body;
    const instructor = await service.create({ name, email, phone, specialty });
    res.status(201).json(instructor);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, specialty } = req.body;
    const instructor = await service.update(Number(req.params["id"]), {
      name,
      email,
      phone,
      specialty,
    });
    res.status(200).json(instructor);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await service.remove(Number(req.params["id"]));
    res.status(200).json({ message: "Instrutor desativado com sucesso" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
