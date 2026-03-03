import * as repo from "./courses.repository.ts";
import type { Course } from "../../models/Course.ts";

export const getAll = async () => {
  return repo.findAll();
};

export const getById = async (id: number) => {
  const course = await repo.findById(id);
  if (!course) throw new Error("Curso não encontrado");
  return course;
};

export const create = async (course: Course) => {
  const existing = await repo.findByName(course.name);
  if (existing) throw new Error(`Curso "${course.name}" já cadastrado`);
  return repo.create(course);
};

export const update = async (id: number, fields: Partial<Course>) => {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Curso não encontrado");
  return repo.update(id, fields);
};

export const remove = async (id: number) => {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Curso não encontrado");
  return repo.deactivate(id);
};

export const deleteCourse = async (id: number) => {
  const existing = await repo.findById(id);
  if (!existing) {
    throw new Error("Curso não encontrado");
  }
  return repo.deleteCourse(id);
};
