import * as repo from "./students.repository.ts";
import type { Student } from "../../models/Student.ts";

export const create = async (student: Student) => {
  const exist = await repo.findUserByBi(student.bi);
  if (exist) {
    throw new Error(`Estudante com B.I ${student.bi} já cadastrado`);
  }
  const newStudent = await repo.createStudent(student);
  return newStudent;
};

export const getAllStudents = async () => {
  const allStudents = await repo.getAllStudents();
  if (!allStudents.length) {
    throw new Error("Nenhum estudante cadastrado ainda");
  }
  return allStudents;
};

export const getById = async (id: number) => {
  const student = await repo.findById(id);
  if (!student) throw new Error("Estudante não encontrado");
  return student;
};

export const update = async (id: number, fields: Partial<Student>) => {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Estudante não encontrado");
  return repo.updateStudent(id, fields);
};

export const remove = async (id: number) => {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Estudante não encontrado");
  return repo.deactivateStudent(id);
};
