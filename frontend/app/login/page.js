"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const roleExpect = [
  {
    emoji: "🛡️",
    role: "Admin",
    dot: "bg-red-400",
    items: ["Add faculty & student accounts", "Set up departments and years", "Monitor platform activity"],
  },
  {
    emoji: "👨‍🏫",
    role: "Faculty",
    dot: "bg-blue-400",
    items: ["Your assessments and submission queue", "AI-evaluated answers ready to review", "One-click publish when marks are final"],
  },
  {
    emoji: "🎓",
    role: "Student",
    dot: "bg-green-400",
    items: ["Open assessments assigned to your batch", "Rubric-level feedback on your answers", "Result and revaluation status in one place"],
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = (data.detail || "").toLowerCase();
        if (msg.includes("email")) toast.error("Invalid email address");
        else if (msg.includes("password")) toast.error("Invalid password");
        else toast.error("Invalid email or password");
        return;
      }
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userEmail", email);
      if (data.department) localStorage.setItem("department", data.department);
      if (data.year) localStorage.setItem("year", data.year);
      if (data.register_number) localStorage.setItem("registerNumber", data.register_number);
      toast.success("Login successful");
      if (data.role === "student") router.push("/student/dashboard");
      else if (data.role === "faculty") router.push("/faculty");
      else if (data.role === "admin") router.push("/admin/dashboard");
      else router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">

      {/* ── LEFT PANEL ── */}
      <div className="lg:w-[45%] lg:min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900
                      relative overflow-hidden flex flex-col
                      px-6 pt-6 pb-6 lg:px-12 lg:pt-12 lg:pb-12">

        {/* Decorative blobs */}
        <div className="absolute top-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[180px] h-[180px] rounded-full bg-white/5 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white font-bold text-base">A</div>
          <span className="text-white/90 font-semibold text-lg">AcadAIsist</span>
        </div>

        {/* Mobile: compact tagline only */}
        <div className="lg:hidden relative z-10 mt-5 mb-2">
          <p className="text-white text-base font-bold leading-snug">Less time grading. More time teaching.</p>
          <p className="text-blue-200/70 text-xs mt-1 leading-relaxed">
            AI evaluates answers against your faculty's own rubrics — every mark explainable, every result editable.
          </p>
          {/* Mobile role pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {roleExpect.map((r) => (
              <span key={r.role} className="text-xs bg-white/10 border border-white/10 text-blue-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span>{r.emoji}</span>{r.role}
              </span>
            ))}
          </div>
        </div>

        {/* Desktop: full content */}
        <div className="hidden lg:flex flex-col flex-1 justify-center gap-8 mt-10">
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">Our mission</p>
            <blockquote className="text-white text-2xl font-bold leading-snug">
              "Less time grading.<br />More time teaching."
            </blockquote>
            <p className="text-blue-200/70 text-sm mt-3 leading-relaxed max-w-sm">
              AcadAIsist evaluates descriptive answers against your faculty's own rubrics — every mark is explainable, every result is editable, and nothing is final until a human says so.
            </p>
          </div>

          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-4">What's waiting after you sign in</p>
            <div className="flex flex-col gap-3">
              {roleExpect.map((r) => (
                <div key={r.role} className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 flex items-start gap-3">
                  <span className="text-xl mt-0.5 flex-shrink-0">{r.emoji}</span>
                  <div>
                    <p className="text-white text-sm font-semibold mb-1">{r.role}</p>
                    <ul className="space-y-0.5">
                      {r.items.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 text-blue-200/80 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${r.dot} mt-1.5 flex-shrink-0`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="relative z-10 text-white/25 text-xs hidden lg:block mt-10">© 2026 AcadAIsist</p>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-slate-500 text-sm">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={loginUser} className="space-y-5">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input type="email" inputMode="email" autoComplete="email"
                    placeholder="Enter your email"
                    className="w-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition text-base"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input type={showPassword ? "text" : "password"} autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition text-base"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60 mt-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : "Sign In"}
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              New student?{" "}
              <span onClick={() => router.push("/student/register")}
                className="text-blue-600 font-semibold cursor-pointer hover:underline">
                Create Account here
              </span>
            </p>
          </div>

          <p className="text-center mt-5">
            <span onClick={() => router.push("/")}
              className="text-slate-400 text-xs cursor-pointer hover:text-slate-600 transition">
              ← Back to home
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}