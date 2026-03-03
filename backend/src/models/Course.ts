export interface Course {
  id?: number;
  name: string;
  description?: string;
  price: number;
  duration_hours: number;
  instructor_id?: number;
  status?: "active" | "inactive";
  schedule_days: string[]; // ["segunda", "quarta", "sexta"]
  schedule_time: string;
  created_at?: Date;
  updated_at?: Date;
}
