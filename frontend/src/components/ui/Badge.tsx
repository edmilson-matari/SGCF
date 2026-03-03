import { clsx } from "clsx";

type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral";

const styles: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  error: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        styles[variant],
      )}
    >
      {label}
    </span>
  );
}

// Helpers to map domain status → badge variant
export function studentStatusVariant(status?: string): BadgeVariant {
  if (status === "active") return "success";
  if (status === "graduated") return "info";
  return "neutral";
}

export function enrollmentStatusVariant(status?: string): BadgeVariant {
  if (status === "active") return "success";
  if (status === "completed") return "info";
  if (status === "cancelled") return "error";
  return "neutral";
}

export function paymentStatusVariant(status?: string): BadgeVariant {
  if (status === "paid") return "success";
  if (status === "pending") return "warning";
  if (status === "cancelled") return "error";
  return "neutral";
}

export function genericStatusVariant(status?: string): BadgeVariant {
  return status === "active" ? "success" : "neutral";
}

export function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    graduated: "Formado",
    completed: "Concluído",
    cancelled: "Cancelado",
    paid: "Pago",
    pending: "Pendente",
    cash: "Numerário",
    transfer: "Transferência",
    card: "Cartão",
  };
  return map[status ?? ""] ?? status ?? "—";
}
