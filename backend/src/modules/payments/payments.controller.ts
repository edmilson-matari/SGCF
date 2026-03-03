import type { Request, Response } from "express";
import * as service from "./payments.service.ts";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const payments = await service.getAll();
    res.status(200).json(payments);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getByEnrollment = async (req: Request, res: Response) => {
  try {
    const payments = await service.getByEnrollment(
      Number(req.params["enrollmentId"]),
    );
    res.status(200).json(payments);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { enrollment_id, amount, method, notes } = req.body;
    const payment = await service.create({
      enrollment_id,
      amount,
      method,
      notes,
    });
    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const cancel = async (req: Request, res: Response) => {
  try {
    const payment = await service.cancel(Number(req.params["id"]));
    res.status(200).json(payment);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const stats = await service.getDashboard();
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
