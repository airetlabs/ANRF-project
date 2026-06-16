"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    <div className="min-h-screen flex bg-white">

      {/* LEFT — visual/quote panel */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-12 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[250px] h-[250px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/[0.03]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white font-bold text-base">A</div>
          <span className="text-white/90 font-semibold text-lg">AcadAIsist</span>
        </div>

        {/* Center quote */}
        <div className="relative z-10">
          <div className="text-6xl mb-6">🎓</div>
          <blockquote className="text-white text-2xl font-bold leading-snug mb-4">
            "Education is the most powerful weapon which you can use to change the world."
          </blockquote>
          <p className="text-blue-300 font-semibold text-sm">— Nelson Mandela</p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
              <p className="text-3xl font-bold text-white">2×</p>
              <p className="text-blue-200 text-sm mt-1">Faster grading than manual evaluation</p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-blue-200 text-sm mt-1">Consistent rubric-based scoring</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="relative z-10 text-white/30 text-xs">© 2026 AcadAIsist</p>
      </div>

      {/* RIGHT — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-slate-900 text-lg">AcadAIsist</span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10">

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-slate-500 text-sm">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={loginUser} className="space-y-5">

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* SIGN IN */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60 mt-2"
              >
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
              <span
                onClick={() => router.push("/student/register")}
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
              >
                Create Account here
              </span>
            </p>

          </div>

          <p className="text-center mt-5">
            <span
              onClick={() => router.push("/")}
              className="text-slate-400 text-xs cursor-pointer hover:text-slate-600 transition"
            >
              ← Back to home
            </span>
          </p>

        </div>
      </div>

    </div>
  );
}