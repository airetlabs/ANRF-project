"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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

  const adminBenefits = [
    "Manage faculty and student accounts",
    "Configure departments and academic years",
    "Oversee all assessments across the platform",
    "Monitor system-wide usage and activity",
    "Manage roles and access permissions",
  ];

  const facultyBenefits = [
    "Build assessments with custom rubrics",
    "AI evaluates submissions instantly",
    "Review and override any AI mark",
    "Re-evaluate and re-finalize revaluation requests",
    "Publish results when ready",
    "Export marksheets as CSV or HTML",
  ];

  const studentBenefits = [
    "See all your assessments in one place",
    "Submit answers in a clean interface",
    "View rubric-based AI feedback",
    "Understand exactly where marks were lost",
    "Request a one-time revaluation if needed",
    "Track start time, submission time and final score",
  ];

  const comparisons = [
    { aspect: "Grading speed", old: "Days to weeks per batch", neu: "Seconds per submission" },
    { aspect: "Consistency", old: "Varies by grader, mood, fatigue", neu: "Same rubric applied every time" },
    { aspect: "Feedback detail", old: "A number, maybe a comment", neu: "Point-by-point rubric breakdown" },
    { aspect: "Dispute process", old: "Informal, hard to track", neu: "Structured one-time revaluation flow" },
    { aspect: "Faculty workload", old: "Manual reading of every answer", neu: "Review & adjust AI suggestions" },
  ];

  const faqs = [
    {
      q: "Is AI grading actually fair?",
      a: "Every answer is scored against the exact rubric your faculty wrote — not a generic standard. The AI shows which rubric points were matched, partially matched, absent, or contradicted, so the reasoning behind every mark is visible.",
    },
    {
      q: "Can a faculty member change an AI-given mark?",
      a: "Yes. Faculty review every AI suggestion before it's finalized and can adjust any question's marks. The student's result clearly shows both the AI-suggested mark and the faculty-awarded mark.",
    },
    {
      q: "What if I disagree with my final marks?",
      a: "After results are published, you can submit one revaluation request per assessment with a reason. Your faculty reviews it, can re-run the AI evaluation and adjust marks, then finalizes again — your score updates automatically.",
    },
    {
      q: "How many times can I request revaluation?",
      a: "Once per assessment submission. This keeps the process fair and ensures faculty time is spent on genuine concerns rather than repeated re-grading.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. AcadAIsist runs entirely in your browser — faculty create and grade assessments, students answer and view results, all without any installation.",
    },
    {
      q: "What happens to my answers and timing data?",
      a: "Your start time, submission time, answers, and marks are all recorded against your submission so both you and your faculty have a clear, auditable record.",
    },
    {
      q: "What does an admin do on AcadAIsist?",
      a: "Admins manage faculty and student accounts, set up departments and academic years, and oversee assessments and activity across the whole platform — they don't grade individual answers themselves.",
    },
    {
      q: "How do I get started as a student?",
      a: "Register with your college email and registration number, wait for your faculty to publish an assessment for your department and year, then open it from your dashboard within the available time window.",
    },
    {
      q: "Can faculty write their own rubrics?",
      a: "Yes. When creating an assessment, faculty define the question, an answer key, a custom rubric, and the marks for each question — the AI evaluates strictly against that rubric, not a generic standard.",
    },
    {
      q: "When can students see their results?",
      a: "Only after faculty evaluates every submission and explicitly clicks Publish Results. Before that, the result page shows a 'not yet published' message instead of any marks.",
    },
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

        {/* FOR ADMIN / FOR FACULTY / FOR STUDENTS */}
        <div className="anim grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-red-100 border-t-2 border-t-red-500 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <p className="font-bold text-slate-800 text-sm">For Admin</p>
            </div>
            <ul className="space-y-2 mb-5">
              {adminBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-red-500 mt-0.5 shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
            <button onClick={() => router.push("/login")}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-xl text-xs transition">
              Admin Sign In →
            </button>
          </div>

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

        {/* WHY ACADAISIST — COMPARISON */}
        <div className="anim mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Why AcadAIsist</h2>
          <p className="text-slate-500 text-xs mb-4">Traditional grading vs. AI-assisted evaluation</p>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aspect</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Traditional</th>
                  <th className="px-4 py-3 text-xs font-semibold text-blue-700 uppercase tracking-wide">AcadAIsist</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c, i) => (
                  <tr key={c.aspect} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 border-t border-slate-100">{c.aspect}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100">{c.old}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-medium border-t border-slate-100">
                      {c.neu}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* REVALUATION & TRANSPARENCY HIGHLIGHT */}
        <div className="anim bg-white border border-amber-100 border-t-2 border-t-amber-500 rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm mb-1.5">Built-in revaluation, not an afterthought</p>
              <p className="text-slate-500 text-xs leading-relaxed mb-3">
                Every result shows exactly which rubric points were matched, partial, absent, or contradicted —
                plus the AI-suggested mark next to any faculty adjustment. If a student still disagrees, they can
                submit one revaluation request with a reason. Faculty can re-run AI evaluation, adjust marks, and
                re-finalize — the student's score and result page update automatically the moment it's done.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Rubric-level feedback", "AI vs faculty marks shown", "One-time revaluation", "Auto-updating results"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="anim mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Frequently asked questions</h2>
          <p className="text-slate-500 text-xs mb-4">Everything you might be wondering before you sign up</p>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
            {faqs.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition"
                  >
                    <span className="text-sm font-semibold text-slate-800">{item.q}</span>
                    <span className={`text-slate-400 text-sm flex-shrink-0 transition-transform ${isOpen ? "rotate-45" : ""}`}>＋</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 -mt-1">
                      <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ROLE CARDS (who uses what) */}
        <div className="anim flex flex-col sm:flex-row gap-2.5 mb-8">
          <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform duration-200 shadow-sm">
            <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Admin</p>
              <p className="text-xs text-slate-400">Manage users, departments and settings</p>
            </div>
          </div>
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