"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    const els = document.querySelectorAll(".anim");
    els.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      setTimeout(() => {
        el.style.transition = "opacity 0.55s ease, transform 0.55s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, i * 120);
    });
  }, []);

  const features = [
    {
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
      title: "AI Evaluation", desc: "Instant, objective grading via SLM pipeline", accent: "border-t-blue-600", bg: "bg-blue-50", iconColor: "text-blue-600"
    },
    {
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
      title: "Rubric Scoring", desc: "Faculty-defined rubrics applied consistently", accent: "border-t-green-600", bg: "bg-green-50", iconColor: "text-green-600"
    },
    {
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      title: "Analytics", desc: "Score trends and class performance insight", accent: "border-t-purple-600", bg: "bg-purple-50", iconColor: "text-purple-600"
    },
    {
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      title: "Dual Roles", desc: "Separate dashboards for faculty & students", accent: "border-t-amber-500", bg: "bg-amber-50", iconColor: "text-amber-600"
    },
  ];

  const stats = [
    { val: "AI", label: "Grading", color: "text-blue-800" },
    { val: "SLM", label: "Powered", color: "text-green-800" },
    { val: "2x", label: "Faster", color: "text-purple-800" },
    { val: "Fair", label: "Scoring", color: "text-amber-800" },
  ];

  const steps = [
    { num: "01", title: "Faculty creates", desc: "Build assessments with questions, rubrics and marks.", color: "text-blue-600" },
    { num: "02", title: "Students answer", desc: "Open the assessment portal and type answers in the window.", color: "text-green-600" },
    { num: "03", title: "AI evaluates", desc: "SLM pipeline scores each answer against the rubric instantly.", color: "text-purple-600" },
    { num: "04", title: "Faculty reviews", desc: "Verify marks, override if needed, then publish results.", color: "text-amber-600" },
  ];

  const facultyBenefits = [
    "Build assessments with custom rubrics",
    "AI evaluates submissions instantly",
    "Review and override any AI mark",
    "Publish results when ready",
    "Export marksheets as CSV or HTML",
  ];

  const studentBenefits = [
    "See all your assessments in one place",
    "Submit answers in a clean interface",
    "View rubric-based AI feedback",
    "Understand exactly where marks were lost",
    "Request revaluation if needed",
  ];

  const roles = [
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      title: "Admin", desc: "Manage users, departments and system settings",
      color: "border-red-200 hover:border-red-400 hover:bg-red-50", iconBg: "bg-red-50 text-red-500", route: "/login",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      title: "Faculty", desc: "Create assessments, evaluate and review submissions",
      color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50", iconBg: "bg-blue-50 text-blue-500", route: "/login",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
      title: "Student", desc: "Register, submit answers and view AI marks",
      color: "border-green-200 hover:border-green-400 hover:bg-green-50", iconBg: "bg-green-50 text-green-500", route: "/student/register",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      {/* STICKY NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-lg">AcadAIsist</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/login")}
            className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-xl border border-slate-300 transition text-sm">
            Sign In
          </button>
          <button onClick={() => setShowRoleModal(true)}
            className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-4 py-2 rounded-xl transition text-sm shadow-md">
            Get Started
          </button>
        </div>
      </nav>

      <div className="px-5 sm:px-10 max-w-4xl mx-auto">

        {/* HERO */}
        <div className="anim pt-14 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200 mb-5">
            AI-Powered Academic Evaluation
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
            AcadAIsist
          </h1>
          <div className="h-[3px] rounded-full bg-blue-600 mx-auto mb-5" style={{ width: "40px" }} />
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">
            Reducing faculty workload without compromising academic rigour — powered by Small Language Models.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => setShowRoleModal(true)}
              className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 active:scale-95 text-white font-semibold px-8 py-3 rounded-xl transition text-sm shadow-md">
              Get Started
            </button>
            <button onClick={() => router.push("/login")}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-medium px-8 py-3 rounded-xl border border-slate-300 transition text-sm">
              Sign In
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="anim grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
              <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <div className="anim grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
          {features.map((f) => (
            <div key={f.title} className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:-translate-y-1 transition-transform duration-200 border-t-2 ${f.accent}`}>
              <div className={`w-8 h-8 ${f.bg} border border-slate-100 rounded-lg flex items-center justify-center mb-2.5 ${f.iconColor}`}>
                {f.icon}
              </div>
              <p className="font-semibold text-slate-800 text-xs mb-1">{f.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div className="anim mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {steps.map((s) => (
              <div key={s.num} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="text-4xl font-black text-slate-100 absolute top-2 right-3 leading-none select-none">{s.num}</div>
                <p className={`text-xs font-bold mb-1 ${s.color}`}>{s.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FOR FACULTY / FOR STUDENTS */}
        <div className="anim grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-blue-100 border-t-2 border-t-blue-600 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <p className="font-bold text-slate-800 text-sm">For Faculty</p>
            </div>
            <ul className="space-y-2 mb-5">
              {facultyBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-blue-500 mt-0.5 shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
            <button onClick={() => router.push("/login")}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 rounded-xl text-xs transition">
              Faculty Sign In →
            </button>
          </div>

          <div className="bg-white border border-green-100 border-t-2 border-t-green-600 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
              </div>
              <p className="font-bold text-slate-800 text-sm">For Students</p>
            </div>
            <ul className="space-y-2 mb-5">
              {studentBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
            <button onClick={() => router.push("/student/register")}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-xl text-xs transition">
              Student Register →
            </button>
          </div>
        </div>

        {/* ROLE CARDS (who uses what) */}
        <div className="anim flex flex-col sm:flex-row gap-2.5 mb-8">
          <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform duration-200 shadow-sm">
            <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Faculty</p>
              <p className="text-xs text-slate-400">Create, publish, evaluate and review</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform duration-200 shadow-sm">
            <div className="w-9 h-9 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Students</p>
              <p className="text-xs text-slate-400">Submit answers and view AI marks</p>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="anim flex items-center justify-between flex-wrap gap-3 pt-5 pb-10 border-t border-slate-200">
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Instant Grading", icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
              { label: "Academic Integrity", icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
              { label: "Transparent Scoring", icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
            ].map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-500 text-xs px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-slate-400">{t.icon}</span>
                {t.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} AcadAIsist</p>
        </div>

      </div>

      {/* ROLE SELECTION MODAL */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setShowRoleModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Who are you?</h2>
              <p className="text-slate-500 text-sm mt-1">Select your role to continue</p>
            </div>
            <div className="flex flex-col gap-3">
              {roles.map((role) => (
                <button key={role.title} onClick={() => router.push(role.route)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 text-left ${role.color}`}>
                  <div className={`w-12 h-12 ${role.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {role.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{role.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowRoleModal(false)}
              className="w-full mt-4 text-slate-400 text-sm hover:text-slate-600 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}