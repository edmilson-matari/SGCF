export interface Instructor {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  status?: "active" | "inactive";
  created_at?: Date;
  updated_at?: Date;
}
