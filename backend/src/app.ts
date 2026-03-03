import express from "express";
import authRoutes from "./modules/auth/auth.routes.ts";
import studentRoutes from "./modules/students/students.routes.ts";
import instructorRoutes from "./modules/instructors/instructors.routes.ts";
import courseRoutes from "./modules/courses/courses.routes.ts";
import enrollmentRoutes from "./modules/enrollments/enrollments.routes.ts";
import paymentRoutes from "./modules/payments/payments.routes.ts";
import { getDashboard } from "./modules/payments/payments.controller.ts";
import authMiddleware from "./middleware/authMiddleware.ts";
//import cors from "cors";

const app = express();

//app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payments", paymentRoutes);
app.get("/api/dashboard", authMiddleware, getDashboard);

export default app;
