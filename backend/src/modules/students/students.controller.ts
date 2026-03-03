import * as service from "./students.service.ts";
import type { Student } from "../../models/Student.ts";
import type { Request, Response } from "express";

export const create = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, bi, date_of_birth, address } = req.body;
    const student: Student = { name, email, phone, bi, date_of_birth, address };
    const newStudent = await service.create(student);
    res.status(201).json(newStudent);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const allStudent = await service.getAllStudents();
    res.status(200).json(allStudent);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const student = await service.getById(Number(req.params["id"]));
    res.status(200).json(student);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, date_of_birth, status } = req.body;
    const student = await service.update(Number(req.params["id"]), {
      name,
      email,
      phone,
      address,
      date_of_birth,
      status,
    });
    res.status(200).json(student);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await service.remove(Number(req.params["id"]));
    res.status(200).json({ message: "Estudante desativado com sucesso" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
