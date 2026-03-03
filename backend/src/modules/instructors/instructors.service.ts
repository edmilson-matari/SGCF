import * as repo from "./instructors.repository.ts";
import type { Instructor } from "../../models/Instructor.ts";

export const getAll = async () => {
  return repo.findAll();
};

export const getById = async (id: number) => {
  const instructor = await repo.findById(id);
  if (!instructor) throw new Error("Instrutor não encontrado");
  return instructor;
};

export const create = async (instructor: Instructor) => {
  const existing = await repo.findByEmail(instructor.email);
  if (existing)
    throw new Error(`Instrutor com email ${instructor.email} já cadastrado`);
  return repo.create(instructor);
};

export const update = async (id: number, fields: Partial<Instructor>) => {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Instrutor não encontrado");
  return repo.update(id, fields);
};

export const remove = async (id: number) => {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Instrutor não encontrado");
  return repo.deactivate(id);
};
