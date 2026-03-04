import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(4, "Palavra-passe obrigatória"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      storeLogin(data.token, data.user);
      navigate("/dashboard");
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 md:p-4">
      <div className="w-full md:max-w-4xl bg-white md:rounded-3xl shadow-2xl overflow-hidden flex min-h-screen md:min-h-[540px]">
        {/* ── Left panel ── */}
        <div
          className="hidden md:flex md:w-[48%] flex-col justify-between p-8 relative"
          style={{
            background:
              "linear-gradient(160deg, #0f2a2e 0%, #0d3b38 35%, #0a4a42 60%, #0d3030 100%)",
          }}
        >
          {/* subtle texture overlay */}
          <div
            className="absolute inset-0 opacity-20 rounded-l-3xl"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />

          {/* Logo */}
          <div className="relative flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-widest uppercase">
              SGCF
            </span>
          </div>

          {/* Bottom text */}
          <div className="relative">
            <h2 className="text-white font-black text-4xl leading-tight tracking-tight mb-4">
              A SUA FORMAÇÃO
              <br />
              COMEÇA
              <br />
              AQUI!
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-1">
              Aceda à plataforma para gerir cursos, formandos e inscrições num
              só lugar.
            </p>
            <p className="text-white/50 text-xs">A sua carreira começa hoje.</p>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-10 md:py-12">
          <div className="max-w-sm w-full mx-auto">
            {/* Mobile-only logo */}
            <div className="flex items-center gap-3 mb-8 md:hidden">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #0d3b38 0%, #0f766e 100%)",
                }}
              >
                <GraduationCap size={20} className="text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900">
                  my<span className="text-teal-800">SGCF</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Centro de Formação FF
                </p>
              </div>
            </div>

            <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">
              BEM-VINDO DE VOLTA!
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              Bem-vindo de volta! Por favor insira os seus dados.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Insira o seu email"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Palavra-passe
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-600">Lembrar-me</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-slate-800 hover:text-teal-700 transition"
                >
                  Esqueci a palavra-passe
                </button>
              </div>

              {/* Error banner */}
              {mutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm">
                    Email ou palavra-passe incorrectos.
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{
                  background: mutation.isPending
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #0d3b38 0%, #0f766e 100%)",
                }}
              >
                {mutation.isPending ? "A entrar..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
