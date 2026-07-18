"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-f434.up.railway.app";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ViewSubmissionPage() {
  const { submissionId } = useParams();
  const router = useRouter();

  const [answers, setAnswers] = useState([]);   // [{question_id, answer}]
  const [questions, setQuestions] = useState({}); // {question_id: {text, max_marks, ans_length}}
  const [meta, setMeta] = useState(null);         // {status, started_at, submitted_at, final_marks}
  const [loading, setLoading] = useState(true);

  const getWordCount = (text) =>
    (text || "").trim().split(/\s+/).filter(Boolean).length;

  const getCharCount = (text) => (text || "").length;

  const fmt = (dateStr) => {
    if (!dateStr) return null;
    // Backend now stores timezone-aware UTC (datetime.now(timezone.utc)),
    // so new Date() parses it correctly. We just specify IST explicitly.
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  useEffect(() => {
    if (submissionId) fetchAll();
  }, [submissionId]);

  const fetchAll = async () => {
    try {
      const email = localStorage.getItem("userEmail");

      // 1. Get answers for this submission
      const answersRes = await fetch(`${API_URL}/submission/view/${submissionId}`);
      const answersData = await answersRes.json();
      setAnswers(Array.isArray(answersData) ? answersData : []);

      // 2. Get submission meta (status, times, marks) from student's submissions list
      const subListRes = await fetch(`${API_URL}/submission/student/${email}`);
      const subList = await subListRes.json();
      const thisSub = subList.find((s) => s._id === submissionId);
      setMeta(thisSub || null);

      // 3. Get assessment questions (text, max_marks, ans_length)
      if (thisSub?.assessment_id) {
        const assessRes = await fetch(`${API_URL}/assessment/questions/${thisSub.assessment_id}`);
        const assessData = await assessRes.json();

        // Build a lookup map by question_id
        const qMap = {};
        if (Array.isArray(assessData)) {
          assessData.forEach((q) => {
            qMap[String(q.question_id)] = {
              text: q.question_text,
              max_marks: q.max_marks,
              ans_length: Number(q.ans_length) || 0,
            };
          });
        }
        setQuestions(qMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-900">Loading Submission...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push("/student/dashboard")}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm transition"
        >
          ← Back to Dashboard
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">View Submission</h1>
          <p className="text-slate-500 text-xs">Read-only — submitted answers</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">

        {/* META CARD */}
        {meta && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex flex-wrap gap-6 text-sm">
              {/* Started — always show, "—" if null (old record before start-tracking) */}
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Started</p>
                <p className="font-semibold text-slate-800">{fmt(meta.started_at) || "—"}</p>
              </div>

              {/* Submitted — always show */}
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Submitted</p>
                <p className="font-semibold text-slate-800">{fmt(meta.submitted_at) || "—"}</p>
              </div>

              {/* Score — only show once faculty has finalized / published results */}
              {meta.status === "Finalized" && meta.final_marks != null && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Score</p>
                  <p className="font-bold text-blue-700">{meta.final_marks}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUESTIONS + ANSWERS */}
        <div className="space-y-8">
          {answers.map((item, index) => {
            const qid = String(item.question_id);
            const q = questions[qid] || {};
            const answerText = item.answer || "";
            const wordCount = getWordCount(answerText);
            const charCount = getCharCount(answerText);
            const expectedLength = q.ans_length || 0;
            const isOverLimit = expectedLength > 0 && wordCount > expectedLength;

            return (
              <div key={qid} className="bg-white rounded-[30px] border border-slate-200 p-8 shadow-sm">

                {/* QUESTION HEADER */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Question {index + 1}</h2>
                  {q.max_marks && (
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold text-sm">
                      {q.max_marks} Marks
                    </div>
                  )}
                </div>

                {/* QUESTION TEXT */}
                {q.text && (
                  <div className="mb-5">
                    <p className="text-slate-800 text-lg leading-7">{q.text}</p>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Your Answer</p>

                  {/* ANSWER BOX — read-only styled like assessment page */}
                  <div className="w-full border-2 border-slate-200 rounded-2xl p-5 text-slate-900 bg-slate-50 min-h-[120px] whitespace-pre-wrap leading-7">
                    {answerText || <span className="text-slate-400 italic">No answer provided</span>}
                  </div>

                  {/* WORD / CHAR COUNT — same layout as assessment page */}
                  <div className="flex justify-between items-center mt-3 px-1">
                    <p className="text-slate-500 text-sm">
                      Expected length:{" "}
                      <span className="font-semibold text-slate-700">
                        {expectedLength > 0 ? `${expectedLength} words` : "Not specified"}
                      </span>
                    </p>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isOverLimit ? "text-red-500" : "text-slate-500"}`}>
                        {wordCount} / {expectedLength > 0 ? expectedLength : "—"} words
                      </p>
                      <p className="text-sm text-slate-500">{charCount} characters</p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}