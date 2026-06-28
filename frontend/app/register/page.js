"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, Hash, BookOpen, GraduationCap, Calendar } from "lucide-react";

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
    if (!email || !password || !confirmPassword) { toast.error("Please fill all fields"); return; }
    if (!registerNumber || !department || !year) { toast.error("Please fill all student fields"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "student", register_number: registerNumber.trim(), department, year }),
      });
      const data = await response.json();
      if (!response.ok) { toast.error(data.detail || "Registration failed"); return; }
      toast.success("Registration successful! Please login.");
      router.push("/login");
    } catch (error) {
      console.error(error);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-slate-200 bg-slate-50 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition text-base";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">

      {/* ── LEFT PANEL ── */}
      <div className="lg:w-[42%] bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 relative overflow-hidden
                      flex flex-col justify-between
                      px-7 pt-8 pb-8 lg:px-12 lg:pt-12 lg:pb-12 lg:min-h-screen">

        <div className="absolute top-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[180px] h-[180px] rounded-full bg-white/5 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 mb-8 lg:mb-0">
          <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white font-bold text-base">A</div>
          <span className="text-white/90 font-semibold text-lg">AcadAIsist</span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-7 py-6 lg:py-0">

          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">Student Registration</p>
            <h2 className="text-white text-2xl lg:text-3xl font-bold leading-snug mb-3">
              Your academic journey starts here.
            </h2>
            <p className="text-blue-200/70 text-sm leading-relaxed max-w-sm">
              Create your account once, and access every assessment your faculty publishes for your department and year — all in one place.
            </p>
          </div>

          {/* Steps */}
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-4">After you register</p>
            <div className="flex flex-col gap-3">
              {[
                { num: "01", title: "Log in to your dashboard", desc: "See all assessments open for your batch" },
                { num: "02", title: "Attempt assessments", desc: "Answer questions in a clean timed interface" },
                { num: "03", title: "Get AI feedback", desc: "Rubric-level breakdown of every mark" },
                { num: "04", title: "Request revaluation", desc: "One-time revaluation if you disagree with a result" },
              ].map((s) => (
                <div key={s.num} className="flex items-start gap-3 bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                  <span className="text-blue-300 font-black text-xs mt-0.5 flex-shrink-0">{s.num}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{s.title}</p>
                    <p className="text-blue-200/70 text-xs mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap gap-2">
            {["No installation needed", "Browser-based", "Secure login"].map((t) => (
              <span key={t} className="text-xs bg-white/10 border border-white/10 text-blue-200 px-3 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/25 text-xs hidden lg:block">© 2026 AcadAIsist</p>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7 sm:p-9">

            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Create your account</h1>
              <p className="text-slate-500 text-sm">Register as a student to get started</p>
            </div>

            <form onSubmit={registerUser} className="space-y-4">

              {/* REGISTER NUMBER */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Register Number</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input type="text" placeholder="e.g. 24CS0234"
                    className={`${inputCls} pl-11 pr-4`}
                    value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} />
                </div>
              </div>

              {/* DEPARTMENT + YEAR — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select className={`${inputCls} pl-9 pr-3 appearance-none`}
                      value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="">Select</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select className={`${inputCls} pl-9 pr-3 appearance-none`}
                      value={year} onChange={(e) => setYear(e.target.value)}>
                      <option value="">Select</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input type="email" inputMode="email" autoComplete="email" placeholder="Enter your email"
                    className={`${inputCls} pl-11 pr-4`}
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input type={showPassword ? "text" : "password"} placeholder="Create a password"
                    autoComplete="new-password"
                    className={`${inputCls} pl-11 pr-12`}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input type={showConfirmPassword ? "text" : "password"} placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={`${inputCls} pl-11 pr-12`}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1">
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60 mt-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : "Create Account"}
              </button>

              <p className="text-center text-slate-500 text-sm">
                Already have an account?{" "}
                <span onClick={() => router.push("/login")}
                  className="text-blue-600 font-semibold cursor-pointer hover:underline">
                  Sign In
                </span>
              </p>
            </form>
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