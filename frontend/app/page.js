"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

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
    { icon: "⚡", title: "AI Evaluation", desc: "Instant, objective grading via SLM pipeline", accent: "border-t-blue-600", bg: "bg-blue-50", iconColor: "text-blue-600" },
    { icon: "📋", title: "Rubric Scoring", desc: "Faculty-defined rubrics applied consistently", accent: "border-t-green-600", bg: "bg-green-50", iconColor: "text-green-600" },
    { icon: "📊", title: "Analytics", desc: "Score trends and class performance insight", accent: "border-t-purple-600", bg: "bg-purple-50", iconColor: "text-purple-600" },
    { icon: "🔒", title: "Dual Roles", desc: "Separate dashboards for faculty & students", accent: "border-t-amber-500", bg: "bg-amber-50", iconColor: "text-amber-600" },
  ];

  const stats = [
    { val: "AI", label: "Grading", color: "text-blue-800" },
    { val: "SLM", label: "Powered", color: "text-green-800" },
    { val: "2×", label: "Faster", color: "text-purple-800" },
    { val: "Fair", label: "Scoring", color: "text-amber-800" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6"
      style={{ overflow: "hidden" }}
    >
      <div className="w-full max-w-3xl">

        {/* Header row */}
        <div className="anim flex items-center justify-between mb-7 pb-7 border-b border-slate-200">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200 mb-3">
              AI-Powered Academic Evaluation
            </span>
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight leading-none">
              AcadAIsist
            </h1>
            <div
              className="h-[3px] rounded-full bg-blue-600 mt-2"
              style={{ animation: "glowLine 2s ease-in-out infinite", width: "40px" }}
            />
            <p className="text-slate-500 text-sm leading-relaxed mt-3 max-w-xs">
              Reducing faculty workload without compromising academic rigour — powered by Small Language Models.
            </p>
          </div>
          <div style={{ animation: "float 3.5s ease-in-out infinite" }} className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-blue-800 flex items-center justify-center text-4xl border-2 border-blue-900 shadow-lg">
              🎓
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="anim grid grid-cols-4 gap-2.5 mb-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
              <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="anim grid grid-cols-4 gap-2.5 mb-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:-translate-y-1 transition-transform duration-200 relative overflow-hidden border-t-2 ${f.accent}`}
            >
              <div className={`w-8 h-8 ${f.bg} border border-slate-100 rounded-lg flex items-center justify-center text-base mb-2.5`}>
                <span className={`text-sm ${f.iconColor}`}>{f.icon}</span>
              </div>
              <p className="font-semibold text-slate-800 text-xs mb-1">{f.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Role cards */}
        <div className="anim flex gap-2.5 mb-6">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Students</p>
              <p className="text-xs text-slate-400">Submit answers and view AI marks</p>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="anim flex items-center justify-between flex-wrap gap-3 pt-5 border-t border-slate-200">
          <div className="flex gap-2 flex-wrap">
            {[
              {
                label: "Instant Grading", icon: (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )
              },
              {
                label: "Academic Integrity", icon: (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                )
              },
              {
                label: "Transparent Scoring", icon: (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )
              },
            ].map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-500 text-xs px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-slate-400">{t.icon}</span>
                {t.label}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/login")}
              className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-medium px-6 py-3 rounded-xl border border-slate-300 transition-all duration-150 text-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/student/register")}
              className="bg-blue-800 hover:bg-blue-900 active:scale-95 text-white font-semibold px-7 py-3 rounded-xl transition-all duration-150 text-sm shadow-md"
            >
              Get Started →
            </button>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glowLine {
          0%, 100% { width: 40px; }
          50% { width: 72px; }
        }
      `}</style>
    </div>
  );
}