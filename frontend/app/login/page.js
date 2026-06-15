"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

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
        if (msg.includes("email")) {
          toast.error("Invalid email address");
        } else if (msg.includes("password")) {
          toast.error("Invalid password");
        } else {
          toast.error("Invalid email or password");
        }
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userEmail", email);
      if (data.department) localStorage.setItem("department", data.department);
      if (data.year) localStorage.setItem("year", data.year);
      if (data.register_number) localStorage.setItem("registerNumber", data.register_number);

      toast.success("Login successful");

      if (data.role === "student") {
        router.push("/student/dashboard");
      } else if (data.role === "faculty") {
        router.push("/faculty");
      } else if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">

        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-1">AcadAIsist</h1>
          <p className="text-xs text-slate-400 mb-4">A Small Language Model Based Lightweight and Accessible Evaluation Tool for Reducing Faculty Workload Without Compromising Academic Rigour</p>
          <div className="flex justify-center mb-3"><svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg></div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={loginUser} className="space-y-4">

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-slate-300 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full border border-slate-300 py-3 pl-11 pr-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-slate-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl text-lg font-semibold shadow-lg hover:opacity-90 transition-all mt-6"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className="text-center text-slate-600 text-sm mt-2">
            New student?{" "}
            <span
              onClick={() => router.push("/student/register")}
              className="text-blue-600 font-semibold cursor-pointer hover:underline"
            >
              Create Account here
            </span>
          </p>

        </form>
      </div>
    </div>
  );
}

