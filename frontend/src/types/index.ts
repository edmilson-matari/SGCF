// ==================== AUTH ====================
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  password: string;
}

// ==================== STUDENT ====================
export interface Student {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  bi: string;
  date_of_birth?: string;
  address?: string;
  status?: "active" | "inactive" | "graduated";
  created_at?: string;
  updated_at?: string;
}

// ==================== INSTRUCTOR ====================
export interface Instructor {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

// ==================== COURSE ====================
export interface Course {
  id?: number;
  name: string;
  description?: string;
  price: number;
  duration_hours: number;
  instructor_id?: number;
  instructor_name?: string;
  /** Comma-separated weekdays: "seg,ter,qua,qui,sex" */
  schedule_days?: string;
  /** Time string e.g. "08:00" */
  schedule_time?: string;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

// ==================== ENROLLMENT ====================
export interface Enrollment {
  id?: number;
  student_id: number;
  course_id: number;
  student_name?: string;
  course_name?: string;
  enrollment_date?: string;
  total_amount: number;
  status?: "active" | "completed" | "cancelled";
  created_at?: string;
  updated_at?: string;
}

// ==================== PAYMENT ====================
export interface Payment {
  id?: number;
  enrollment_id: number;
  student_name?: string;
  course_name?: string;
  amount: number;
  payment_date?: string;
  method?: "cash" | "transfer" | "card";
  status?: "paid" | "pending" | "cancelled";
  notes?: string;
  created_at?: string;
}

// ==================== DASHBOARD ====================
export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalInstructors: number;
  totalEnrollments: number;
  totalRevenue: number;
  activeEnrollments: number;
  recentPayments?: Payment[];
}

// ==================== GENERIC ====================
export interface ApiError {
  message: string;
  status?: number;
}
