export interface Enrollment {
  id?: number;
  student_id: number;
  course_id: number;
  enrollment_date?: Date;
  total_amount: number;
  status?: "active" | "completed" | "cancelled";
  created_at?: Date;
  updated_at?: Date;
}
