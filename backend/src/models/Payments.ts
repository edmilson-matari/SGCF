export interface Payment {
  id?: number;
  enrollment_id: number;
  amount: number;
  payment_date?: Date;
  method?: "cash" | "transfer" | "card";
  status?: "paid" | "pending" | "cancelled";
  notes?: string;
  created_at?: Date;
}
