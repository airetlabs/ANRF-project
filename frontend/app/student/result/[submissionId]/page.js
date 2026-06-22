"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StudentResultPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notPublished, setNotPublished] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    fetch(`${API_URL}/submission/student-result/${submissionId}`)
      .then((r) => {
        if (r.status === 403) { setNotPublished(true); setLoading(false); return null; }
        if (!r.ok) throw new Error("Failed to fetch result");
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.results_published === false) { setNotPublished(true); return; }
        setResult(data);
      })
      .catch(() => setNotPublished(true))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const totalMax = result?.questions?.reduce((s, q) => s + Number(q.max_marks || 0), 0) || 0;
  const percentage = totalMax > 0 ? ((result?.final_marks / totalMax) * 100).toFixed(1) : "0.0";

  // --- Download Report ---
  const downloadReport = () => {
    if (!result) return;
    const rows = result.questions.map((q, i) => {
      const rubricRows = (q.labels_json || []).map(
        (item) => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0">${item.faculty_rubric_statement || ""}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${item.total_marks || 0}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center;color:${
              item.label?.toLowerCase() === "matched" ? "#16a34a" :
              item.label?.toLowerCase() === "partial" ? "#d97706" : "#dc2626"
            };font-weight:600">${item.label || ""}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:13px">${item.evidence || ""}</td>
          </tr>`
      ).join("");

      return `
        <div style="margin-bottom:32px;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
          <div style="font-weight:700;margin-bottom:6px">Q${i + 1}. ${q.question_text}</div>
          <div style="font-size:13px;color:#64748b;margin-bottom:10px">Max Marks: ${q.max_marks} &nbsp;|&nbsp;
            AI Suggested: ${q.ai_marks} &nbsp;|&nbsp;
            Final Awarded: <strong>${q.marks}</strong>
            ${q.faculty_adjusted ? ' &nbsp;<span style="color:#7c3aed;font-size:12px">(Faculty Adjusted)</span>' : ""}
          </div>
          <div style="background:#f8fafc;padding:10px;border-radius:6px;margin-bottom:12px;font-size:13px">
            <strong>Your Answer:</strong><br>${q.student_answer || "<em>No answer</em>"}
          </div>
          ${rubricRows ? `
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#f1f5f9">
              <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Rubric Point</th>
              <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">Marks</th>
              <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">Label</th>
              <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Evidence</th>
            </tr></thead>
            <tbody>${rubricRows}</tbody>
          </table>` : ""}
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Result - ${result.assessment_title}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;max-width:860px;margin:auto;color:#1e293b}</style>
    </head><body>
      <h1 style="font-size:22px;margin-bottom:4px">${result.assessment_title}</h1>
      <p style="color:#64748b;font-size:14px;margin-bottom:20px">Student: ${result.student_id}</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin-bottom:28px">
        <span style="font-size:28px;font-weight:700;color:#15803d">${result.final_marks}</span>
        <span style="font-size:16px;color:#166534"> / ${totalMax} &nbsp;(${percentage}%)</span>
      </div>
      ${rows}
      <div style="margin-top:32px;text-align:center">
        <button onclick="window.print()" style="padding:10px 28px;background:#1e40af;color:white;border:none;border-radius:6px;cursor:pointer;font-size:15px">
          Print / Save as PDF
        </button>
      </div>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.assessment_title.replace(/\s+/g, "_")}_result.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400 text-lg">Loading result...</div>
    </div>
  );

  if (notPublished) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 max-w-md text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-white text-xl font-bold mb-2">Results Not Yet Published</h2>
        <p className="text-slate-400 mb-6">Your faculty hasn't published the results for this assessment yet. Check back later.</p>
        <button onClick={() => router.push("/student/dashboard")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{result.assessment_title}</h1>
            <p className="text-slate-400 text-sm mt-1">Student ID: {result.student_id}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadReport}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-sm">
              Download Report
            </button>
            <button onClick={() => router.push("/student/dashboard")}
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg text-sm">
              Back
            </button>
          </div>
        </div>

        {/* Score summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex items-center gap-8">
          <div>
            <div className="text-5xl font-bold text-green-400">{result.final_marks}</div>
            <div className="text-slate-400 text-sm mt-1">out of {totalMax}</div>
          </div>
          <div className="h-14 w-px bg-slate-700" />
          <div>
            <div className="text-3xl font-bold text-blue-400">{percentage}%</div>
            <div className="text-slate-400 text-sm mt-1">Percentage</div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-6">
          {result.questions.map((q, idx) => (
            <div key={q.question_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

              {/* Question header */}
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                    Question {idx + 1}
                  </span>
                  <p className="text-white font-medium mt-1">{q.question_text}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* AI Marks badge — always shows real pipeline value */}
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">AI Suggested</div>
                    <div className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-sm font-mono">
                      {q.ai_marks} / {q.max_marks}
                    </div>
                  </div>
                  {/* Final marks badge */}
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">
                      {q.faculty_adjusted ? "Faculty Awarded" : "Final Marks"}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      q.faculty_adjusted
                        ? "bg-purple-900/40 text-purple-300 border border-purple-700"
                        : "bg-green-900/40 text-green-300 border border-green-700"
                    }`}>
                      {q.marks} / {q.max_marks}
                    </div>
                  </div>
                </div>
              </div>

              {/* Faculty adjusted notice — only when actually true */}
              {q.faculty_adjusted && (
                <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg px-4 py-2 mb-4 text-purple-300 text-sm">
                  ✏️ Faculty reviewed and adjusted this mark (AI suggested {q.ai_marks}, faculty awarded {q.marks})
                </div>
              )}

              {/* Student answer */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Your Answer</div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {q.student_answer || <span className="text-slate-500 italic">No answer submitted</span>}
                </p>
              </div>

              {/* Rubric feedback */}
              {q.labels_json && q.labels_json.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">Rubric Feedback</div>
                  <div className="space-y-2">
                    {q.labels_json.map((item, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-3 flex items-start gap-3">
                        <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full mt-0.5 ${
                          item.label?.toLowerCase() === "matched"
                            ? "bg-green-900/60 text-green-300"
                            : item.label?.toLowerCase() === "partial"
                            ? "bg-amber-900/60 text-amber-300"
                            : "bg-red-900/60 text-red-300"
                        }`}>
                          {item.label?.toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-sm">{item.faculty_rubric_statement}</p>
                          {item.evidence && (
                            <p className="text-slate-500 text-xs mt-1 italic">Evidence: {item.evidence}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 font-mono">
                          {item.total_marks} mark{item.total_marks !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}