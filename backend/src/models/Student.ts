export interface Student {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  bi: string;
  date_of_birth?: Date;
  address?: string;
  status?: "active" | "inactive" | "graduated";
  created_at?: Date;
  updated_at?: Date;
}
