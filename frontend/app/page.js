"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef(null);

  useEffect(() => {
    const els = document.querySelectorAll(".fade-up");
    els.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      setTimeout(() => {
        el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, i * 150);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4">

      {/* Floating icon */}
      <div
        className="fade-up text-6xl mb-6"
        style={{ animation: "float 3s ease-in-out infinite" }}
      >
        🎓
      </div>

      {/* Badge */}
      <div className="fade-up mb-4">
        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100">
          ✦ AI-Powered Academic Evaluation
        </span>
      </div>

      {/* Title */}
      <div className="fade-up text-center mb-3">
        <h1 className="text-6xl font-bold text-slate-900 tracking-tight">AcadAIsist</h1>
        <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto mt-3"></div>
      </div>

      {/* Subtitle */}
      <p className="fade-up text-slate-500 text-center max-w-lg text-base leading-relaxed mb-10">
        A Small Language Model Based Lightweight and Accessible Evaluation Tool
        for Reducing Faculty Workload Without Compromising Academic Rigour
      </p>

      {/* Feature cards */}
      <div className="fade-up grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full mb-10">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:-translate-y-1 transition-transform duration-200">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-lg mb-3">⚡</div>
          <p className="font-semibold text-slate-800 text-sm mb-1">AI Evaluation</p>
          <p className="text-slate-400 text-xs leading-relaxed">Automated answer grading using SLM with rubric-based scoring</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:-translate-y-1 transition-transform duration-200">
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600 text-lg mb-3">📋</div>
          <p className="font-semibold text-slate-800 text-sm mb-1">Rubric-Based</p>
          <p className="text-slate-400 text-xs leading-relaxed">Fair, consistent scoring aligned to faculty-defined criteria</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:-translate-y-1 transition-transform duration-200">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-lg mb-3">🎓</div>
          <p className="font-semibold text-slate-800 text-sm mb-1">Dual Dashboards</p>
          <p className="text-slate-400 text-xs leading-relaxed">Separate views for faculty and students, tailored to each role</p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="fade-up flex gap-3 mb-8">
        <button
          onClick={() => router.push("/login")}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-150 text-base shadow-md hover:shadow-lg"
        >
          Get Started →
        </button>
        <button
          onClick={() => router.push("/register")}
          className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold px-8 py-4 rounded-2xl border border-slate-200 transition-all duration-150 text-base"
        >
          Create Account
        </button>
      </div>

      {/* Pills */}
      <div className="fade-up flex gap-3 flex-wrap justify-center">
        {["⚡ Fast grading", "🛡 Academic integrity", "📊 Analytics built-in"].map((item) => (
          <span key={item} className="bg-white border border-slate-100 text-slate-500 text-xs px-4 py-2 rounded-full shadow-sm">
            {item}
          </span>
        ))}
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}