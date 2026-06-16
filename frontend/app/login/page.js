"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, GraduationCap } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";

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
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">AcadAIsist</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            AI-Powered<br />Academic<br />Evaluation
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Reducing faculty workload without compromising academic rigour — powered by Small Language Models.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "AI Grading", icon: "⚡", desc: "Instant objective scoring" },
            { label: "SLM Powered", icon: "🧠", desc: "Small language models" },
            { label: "2× Faster", icon: "🚀", desc: "Than manual evaluation" },
            { label: "Fair Scoring", icon: "⚖️", desc: "Consistent rubric-based" },
          ].map((f) => (
            <div key={f.label} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-white font-semibold text-sm">{f.label}</p>
              <p className="text-slate-400 text-xs mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 px-8">
        <div className="w-full max-w-md">

          {/* MOBILE LOGO */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-slate-900 font-bold text-xl">AcadAIsist</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={loginUser} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border border-slate-200 bg-white py-3.5 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full border border-slate-200 bg-white py-3.5 pl-11 pr-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-3.5 rounded-xl text-base font-semibold shadow-md transition-all duration-150 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing In...
                </span>
              ) : "Sign In"}
            </button>

            <p className="text-center text-slate-500 text-sm pt-2">
              New student?{" "}
              <span
                onClick={() => router.push("/student/register")}
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
              >
                Create Account here
              </span>
            </p>

          </form>

          <div className="mt-10 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              A Small Language Model Based Lightweight and Accessible Evaluation Tool for Reducing Faculty Workload Without Compromising Academic Rigour
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}