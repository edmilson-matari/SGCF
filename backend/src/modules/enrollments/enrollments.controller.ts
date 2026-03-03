import type { Request, Response } from "express";
import * as service from "./enrollments.service.ts";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const enrollments = await service.getAll();
    res.status(200).json(enrollments);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const enrollment = await service.getById(Number(req.params["id"]));
    res.status(200).json(enrollment);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const getByStudent = async (req: Request, res: Response) => {
  try {
    const enrollments = await service.getByStudent(
      Number(req.params["studentId"]),
    );
    res.status(200).json(enrollments);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { student_id, course_id } = req.body;
    const enrollment = await service.create(
      Number(student_id),
      Number(course_id),
    );
    res.status(201).json(enrollment);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const enrollment = await service.updateStatus(
      Number(req.params["id"]),
      status,
    );
    res.status(200).json(enrollment);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
