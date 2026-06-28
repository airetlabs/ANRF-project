"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ViewSubmissionPage() {
  const { submissionId } = useParams();
  const router = useRouter();

  const [answers, setAnswers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "student") { router.push("/login"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Get student's raw answers from /submission/view/{id}
      const ansRes = await fetch(`${API_URL}/submission/view/${submissionId}`);
      if (!ansRes.ok) { setError("Submission not found."); setLoading(false); return; }
      const ansData = await ansRes.json(); // [{question_id, answer}]
      setAnswers(ansData);

      // 2. Get submission meta from student submissions list
      const email = localStorage.getItem("userEmail");
      if (!email) { setError("Session expired. Please log in again."); setLoading(false); return; }

      const subRes = await fetch(`${API_URL}/submission/student/${encodeURIComponent(email)}`);
      if (!subRes.ok) { setError("Could not load submission details."); setLoading(false); return; }
      const subs = await subRes.json();
      const found = subs.find((s) => s._id === submissionId);
      if (!found) { setError("Submission not found in your records."); setLoading(false); return; }
      setMeta(found);

      // 3. Get questions for the assessment
      const qRes = await fetch(`${API_URL}/assessment/${found.assessment_id}`);
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData.questions || []);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load submission.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (dt) =>
    dt
      ? new Date(dt).toLocaleString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
          hour: "numeric", minute: "2-digit", hour12: true,
        })
      : "—";

  // Build lookup: question_id (string) → answer text
  const answerMap = {};
  answers.forEach((a) => {
    answerMap[String(a.question_id)] = a.answer;
  });

  const statusColor = (s) => {
    if (s === "Finalized") return "bg-purple-100 text-purple-700";
    if (s === "Evaluated") return "bg-green-100 text-green-700";
    if (s === "Revaluation Requested") return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading your submission...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-sm w-full">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={() => router.back()}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-5 sm:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-800 transition text-sm flex items-center gap-1.5">
            ← Back
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {meta?.assessment_title || "Submission"}
            </h1>
            <p className="text-xs text-slate-500">View Submission</p>
          </div>
        </div>
        {meta?.status && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(meta.status)}`}>
            {meta.status}
          </span>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* META CARD */}
        {meta && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Student</p>
                <p className="font-semibold text-slate-800 text-xs truncate">{meta.student_email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Register No.</p>
                <p className="font-semibold text-slate-800 text-xs">{meta.student_id || "—"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Started</p>
                <p className="font-semibold text-slate-800 text-xs">{fmt(meta.started_at)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Submitted</p>
                <p className="font-semibold text-slate-800 text-xs">{fmt(meta.submitted_at)}</p>
              </div>
            </div>

            {meta.status === "Finalized" && meta.final_marks != null && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                  <span className="text-blue-800 font-bold text-sm">Final Score: {meta.final_marks}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUESTIONS + ANSWERS */}
        {questions.length > 0 ? (
          questions.map((q, idx) => {
            // Backend stores question_id as int or string — try both
            const qId = String(q.question_id ?? idx);
            const studentAnswer =
              answerMap[qId] ??
              answerMap[String(idx)] ??
              answerMap[String(idx + 1)] ??
              "";

            return (
              <div key={qId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Question {idx + 1}
                  </span>
                  <span className="text-xs text-slate-400">
                    {q.max_marks} mark{q.max_marks !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <p className="text-slate-800 font-semibold text-sm leading-relaxed">{q.question_text}</p>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Your Answer</p>
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                      studentAnswer.trim()
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : "bg-red-50 border-red-100 text-red-400 italic"
                    }`}>
                      {studentAnswer.trim() || "No answer submitted"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : answers.length > 0 ? (
          // Fallback: no question text available, show raw answers
          answers.map((a, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Question {idx + 1}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Your Answer</p>
                <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                  a.answer?.trim()
                    ? "bg-slate-50 border-slate-200 text-slate-700"
                    : "bg-red-50 border-red-100 text-red-400 italic"
                }`}>
                  {a.answer?.trim() || "No answer submitted"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            No answers found for this submission.
          </div>
        )}

        <div className="pb-6">
          <button onClick={() => router.back()}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-semibold transition">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}