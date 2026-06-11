"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, Hash, BookOpen } from "lucide-react";

const DEPARTMENTS = ["CSE", "IT", "AIDS", "ECE", "EEE", "MECH", "CIVIL"];
const YEARS = ["1", "2", "3", "4"];

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const registerUser = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (!registerNumber || !department || !year) {
      toast.error("Please fill all student fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email,
        password,
        role: "student",
        register_number: registerNumber.trim(),
        department,
        year,
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.detail || "Registration failed");
        return;
      }

      toast.success("Registration successful! Please login.");
      router.push("/login");
    } catch (error) {
      console.error(error);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">

        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🎓</div>
          <h1 className="text-4xl font-bold text-slate-900">Student Register</h1>
          <p className="text-slate-500 mt-2">Create your student account for AcadAIsist</p>
        </div>

        {/* FORM */}
        <form onSubmit={registerUser} className="space-y-4">

          {/* REGISTER NUMBER */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Register Number</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="e.g. 24CS0234"
                className="w-full border border-slate-300 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-slate-500"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
              />
            </div>
          </div>

          {/* DEPARTMENT */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select
                className="w-full border border-slate-300 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black appearance-none bg-white"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* YEAR */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Year</label>
            <select
              className="w-full border border-slate-300 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black appearance-none bg-white"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Select Year</option>
              {YEARS.map((y) => (
  <option key={y} value={y}>{y}</option>
))}
            </select>
          </div>

          {/* EMAIL */}
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

          {/* PASSWORD */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
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

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="w-full border border-slate-300 py-3 pl-11 pr-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-slate-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl text-lg font-semibold shadow-lg hover:opacity-90 transition-all mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* LOGIN LINK */}
          <p className="text-center text-slate-600 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              className="text-blue-600 font-semibold cursor-pointer hover:underline"
            >
              Sign In
            </span>
          </p>

        </form>
      </div>
    </div>
  );
}
