import type { Request, Response } from "express";
import * as service from "./courses.service.ts";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const courses = await service.getAll();
    res.status(200).json(courses);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const course = await service.getById(Number(req.params["id"]));
    res.status(200).json(course);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      duration_hours,
      instructor_id,
      schedule_days,
      schedule_time,
    } = req.body;
    const course = await service.create({
      name,
      description,
      price,
      duration_hours,
      instructor_id,
      schedule_days,
      schedule_time,
    });
    res.status(201).json(course);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      duration_hours,
      instructor_id,
      schedule_days,
      schedule_time,
    } = req.body;
    const course = await service.update(Number(req.params["id"]), {
      name,
      description,
      price,
      duration_hours,
      instructor_id,
      schedule_days,
      schedule_time,
    });
    res.status(200).json(course);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await service.remove(Number(req.params["id"]));
    res.status(200).json({ message: "Curso desativado com sucesso" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
