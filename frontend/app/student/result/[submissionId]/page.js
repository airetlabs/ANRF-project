"use client";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://anrf-project-production-a47a.up.railway.app";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StudentResultPage() {
    const params = useParams();
    const router = useRouter();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notPublished, setNotPublished] = useState(false);
    const [expandedFeedback, setExpandedFeedback] = useState({});
    const [downloading, setDownloading] = useState(false);

    const submissionId = params?.submissionId;

    useEffect(() => {
        if (submissionId) fetchResult();
    }, [submissionId]);

    const fetchResult = async () => {
        try {
            const res = await fetch(`${API_URL}/submission/student-result/${submissionId}`);
            const data = await res.json();
            if (data.results_published === false) {
                setNotPublished(true);
                return;
            }
            setResult(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFeedback = (index) => {
        setExpandedFeedback((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const getLabelStyle = (label) => {
        const l = label?.toLowerCase();
        if (l === "matched") return { badge: "bg-green-100 text-green-700 border border-green-200", icon: "✓" };
        if (l === "contradicting" || l === "contradicted") return { badge: "bg-red-100 text-red-700 border border-red-200", icon: "✗" };
        if (l === "partial" || l === "partially matched") return { badge: "bg-blue-100 text-blue-700 border border-blue-200", icon: "~" };
        if (l === "absent") return { badge: "bg-slate-100 text-slate-500 border border-slate-200", icon: "○" };
        return { badge: "bg-yellow-100 text-yellow-700 border border-yellow-200", icon: "?" };
    };

    const getScoreColor = (marks, maxMarks) => {
        const pct = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
        if (pct >= 75) return "text-green-600";
        if (pct >= 50) return "text-yellow-600";
        return "text-red-500";
    };

    // Sum of AI marks from rubric rows (what AI computed per-point)
    const getAITotalFromLabels = (labels_json) => {
        if (!labels_json?.length) return null;
        return labels_json.reduce((sum, item) => sum + Number(item.total_marks || 0), 0);
    };

    // Check if faculty overrode the AI marks
    const isFacultyOverridden = (q) => {
        const aiTotal = getAITotalFromLabels(q.labels_json);
        if (aiTotal === null) return false;
        return Number(q.marks) !== aiTotal;
    };

    // ───────────────────────── MODULE 8: DOWNLOAD REPORT ─────────────────────────
    const downloadReport = () => {
        if (!result) return;
        try {
            setDownloading(true);

            const escapeHtml = (str) =>
                String(str ?? "").replace(/[&<>"']/g, (c) => ({
                    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
                }[c]));

            const maxTotal = result.questions?.reduce((t, q) => t + (q.max_marks || 0), 0) || 0;
            const pct = maxTotal > 0 ? Math.round((result.total_marks / maxTotal) * 100) : 0;
            const pctColor = pct >= 75 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";

            const questionBlocks = (result.questions || []).map((q, idx) => {
                const scoreColor =
                    q.max_marks > 0 && (q.marks / q.max_marks) * 100 >= 75 ? "#16a34a" :
                    q.max_marks > 0 && (q.marks / q.max_marks) * 100 >= 50 ? "#ca8a04" : "#dc2626";

                const rubricRows = (q.labels_json || []).map((item) => {
                    const l = item.label?.toLowerCase();
                    const style =
                        l === "matched" ? "background:#dcfce7;color:#15803d" :
                        (l === "contradicting" || l === "contradicted") ? "background:#fee2e2;color:#b91c1c" :
                        (l === "partial" || l === "partially matched") ? "background:#dbeafe;color:#1d4ed8" :
                        "background:#f1f5f9;color:#64748b";
                    return `
                    <tr>
                      <td style="border:1px solid #e2e8f0;padding:10px 14px;color:#334155">${escapeHtml(item.faculty_rubric_statement)}</td>
                      <td style="border:1px solid #e2e8f0;padding:10px 14px;text-align:center">
                        <span style="padding:3px 10px;border-radius:14px;font-size:11px;font-weight:600;${style}">${escapeHtml(item.label)}</span>
                      </td>
                      <td style="border:1px solid #e2e8f0;padding:10px 14px;text-align:center;font-weight:600;color:#475569">${escapeHtml(item.total_marks)}</td>
                    </tr>`;
                }).join("");

                return `
                <div style="border:1px solid #e2e8f0;border-radius:16px;margin-bottom:20px;overflow:hidden">
                  <div style="background:#f8fafc;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0">
                    <span style="font-weight:700;color:#0f172a;font-size:15px">Question ${idx + 1}</span>
                    <span style="font-weight:700;font-size:15px;color:${scoreColor}">${escapeHtml(q.marks)} / ${escapeHtml(q.max_marks)} marks</span>
                  </div>
                  <div style="padding:20px 24px">
                    <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Question</p>
                    <p style="color:#1e293b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:16px;line-height:1.6">${escapeHtml(q.question)}</p>

                    <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Your Answer</p>
                    <p style="color:#334155;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:${rubricRows ? "16px" : "0"};white-space:pre-wrap;line-height:1.6">${q.student_answer ? escapeHtml(q.student_answer) : '<span style="color:#94a3b8;font-style:italic">No answer submitted</span>'}</p>

                    ${rubricRows ? `
                    <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Rubric Feedback</p>
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                      <thead>
                        <tr style="background:#f1f5f9">
                          <th style="border:1px solid #e2e8f0;padding:10px 14px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase">Rubric Point</th>
                          <th style="border:1px solid #e2e8f0;padding:10px 14px;text-align:center;color:#64748b;font-size:11px;text-transform:uppercase;width:120px">Status</th>
                          <th style="border:1px solid #e2e8f0;padding:10px 14px;text-align:center;color:#64748b;font-size:11px;text-transform:uppercase;width:90px">Marks</th>
                        </tr>
                      </thead>
                      <tbody>${rubricRows}</tbody>
                    </table>` : ""}
                  </div>
                </div>`;
            }).join("");

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Result Report - ${escapeHtml(result.assessment_title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; }
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
  }
</style>
</head>
<body>
  <div class="no-print" style="background:#1e293b;color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-weight:600">AcadAIsist — Student Result Report</span>
    <button onclick="window.print()" style="background:#3b82f6;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:600;cursor:pointer">Print / Save as PDF</button>
  </div>

  <div class="page" style="max-width:880px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <div style="background:#0f172a;padding:36px 40px">
      <p style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Assessment Result Report</p>
      <h1 style="color:#fff;font-size:24px;font-weight:800;margin-bottom:20px">${escapeHtml(result.assessment_title)}</h1>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:14px 24px;text-align:center">
          <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Final Score</p>
          <p style="color:#fff;font-size:26px;font-weight:800">${escapeHtml(result.total_marks)}<span style="font-size:15px;color:#94a3b8;font-weight:400"> / ${maxTotal}</span></p>
        </div>
        <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:14px 24px;text-align:center">
          <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Percentage</p>
          <p style="font-size:26px;font-weight:800;color:${pctColor}">${pct}%</p>
        </div>
      </div>
    </div>

    <div style="padding:32px 40px">
      ${questionBlocks}
    </div>

    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;display:flex;justify-content:space-between;align-items:center">
      <p style="font-size:12px;color:#94a3b8">Generated by AcadAIsist • AI-Assisted Academic Evaluation</p>
      <p style="font-size:12px;color:#94a3b8">Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
    </div>
  </div>
</body>
</html>`;

            const blob = new Blob([html], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const safeTitle = (result.assessment_title || "result").replace(/[^a-zA-Z0-9-_]/g, "_");
            a.download = `${safeTitle}_report.html`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading Result...</p>
                </div>
            </div>
        );
    }

    if (notPublished) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center bg-white rounded-3xl p-12 shadow-sm border border-slate-200 max-w-md">
                    <div className="text-5xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Results Not Yet Published</h2>
                    <p className="text-slate-500 mb-6">
                        Your faculty hasn't published the results yet. Please check back later.
                    </p>
                    <button
                        onClick={() => router.push("/student/dashboard")}
                        className="bg-slate-800 text-white px-6 py-3 rounded-xl font-medium"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <h2 className="text-xl font-semibold">Result not found</h2>
            </div>
        );
    }

    const maxTotalMarks = result?.questions?.reduce((t, q) => t + (q.max_marks || 0), 0) || 0;
    const percentage = maxTotalMarks > 0 ? Math.round((result.total_marks / maxTotalMarks) * 100) : 0;

    const totalMatched = result?.questions?.reduce((sum, q) =>
        sum + (q.labels_json?.filter(l => l.label?.toLowerCase() === "matched").length || 0), 0);
    const totalPoints = result?.questions?.reduce((sum, q) =>
        sum + (q.labels_json?.length || 0), 0);

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="max-w-4xl mx-auto">

                {/* BACK + DOWNLOAD */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <button
                        onClick={() => router.push("/student/dashboard")}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
                    >
                        <span>&#8592;</span> Back to Dashboard
                    </button>

                    {/* DOWNLOAD REPORT — Module 8 */}
                    <button
                        onClick={downloadReport}
                        disabled={downloading}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-2xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {downloading ? "Preparing..." : "Download Report"}
                    </button>
                </div>

                {/* HEADER CARD */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        Assessment Result
                    </p>
                    <h1 className="text-3xl font-bold text-slate-900 mb-6">
                        {result.assessment_title}
                    </h1>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Final Score</p>
                            <p className={`text-4xl font-bold ${getScoreColor(result.total_marks, maxTotalMarks)}`}>
                                {result.total_marks}
                                <span className="text-xl text-slate-400 font-normal">/{maxTotalMarks}</span>
                            </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Percentage</p>
                            <p className={`text-4xl font-bold ${getScoreColor(percentage, 100)}`}>
                                {percentage}%
                            </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Rubric Points</p>
                            <p className="text-4xl font-bold text-slate-800">
                                {totalMatched}
                                <span className="text-xl text-slate-400 font-normal">/{totalPoints}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-1">matched</p>
                        </div>
                    </div>
                </div>

                {/* LEGEND */}
                <div className="flex flex-wrap gap-3 mb-6 px-1">
                    {[
                        { label: "Matched", style: "bg-green-100 text-green-700 border border-green-200", icon: "✓" },
                        { label: "Partial", style: "bg-blue-100 text-blue-700 border border-blue-200", icon: "~" },
                        { label: "Absent", style: "bg-slate-100 text-slate-500 border border-slate-200", icon: "○" },
                        { label: "Contradicting", style: "bg-red-100 text-red-700 border border-red-200", icon: "✗" },
                    ].map((item) => (
                        <span key={item.label} className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${item.style}`}>
                            <span>{item.icon}</span> {item.label}
                        </span>
                    ))}
                    <span className="text-xs text-slate-400 self-center ml-1">— rubric evaluation status</span>
                </div>

                {/* QUESTION CARDS */}
                <div className="space-y-6">
                    {result?.questions?.map((q, index) => {

                        const hasLabels = q.labels_json?.length > 0;
                        const isExpanded = expandedFeedback[index];
                        const facultyOverridden = isFacultyOverridden(q);
                        const aiTotalFromLabels = getAITotalFromLabels(q.labels_json);

                        const matchedCount = q.labels_json?.filter(l => l.label?.toLowerCase() === "matched").length || 0;
                        const contradictedCount = q.labels_json?.filter(l => ["contradicting", "contradicted"].includes(l.label?.toLowerCase())).length || 0;
                        const absentCount = q.labels_json?.filter(l => l.label?.toLowerCase() === "absent").length || 0;
                        const partialCount = q.labels_json?.filter(l => ["partial", "partially matched"].includes(l.label?.toLowerCase())).length || 0;

                        return (
                            <div key={index} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

                                {/* QUESTION HEADER */}
                                <div className="flex justify-between items-center px-8 pt-8 pb-4">
                                    <h2 className="text-lg font-bold text-slate-900">Question {index + 1}</h2>
                                    <div className="text-right">
                                        {/* FINAL MARKS — always show what student actually got */}
                                        <div className={`text-lg font-bold ${getScoreColor(q.marks, q.max_marks)}`}>
                                            {q.marks}
                                            <span className="text-sm text-slate-400 font-normal"> / {q.max_marks} marks</span>
                                        </div>
                                        {/* Show if faculty adjusted AI marks */}
                                        {facultyOverridden && (
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                AI suggested: {aiTotalFromLabels} &rarr; Faculty awarded: {q.marks}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="px-8 pb-8 space-y-5">

                                    {/* QUESTION TEXT */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 font-medium">
                                        {q.question}
                                    </div>

                                    {/* STUDENT ANSWER */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Your Answer</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 whitespace-pre-wrap leading-7">
                                            {q.student_answer || <span className="text-slate-400 italic">No answer submitted</span>}
                                        </div>
                                        {q.student_answer && (
                                            <p className="text-xs text-slate-400 mt-2 ml-1">
                                                {q.student_answer.trim().split(/\s+/).filter(Boolean).length} words
                                            </p>
                                        )}
                                    </div>

                                    {/* MARKS ROW */}
                                    <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Marks Obtained</p>
                                            <p className={`text-xl font-bold ${getScoreColor(q.marks, q.max_marks)}`}>
                                                {q.marks} / {q.max_marks}
                                            </p>
                                        </div>

                                        {/* RUBRIC SUMMARY PILLS */}
                                        {hasLabels && (
                                            <div className="flex flex-wrap gap-2">
                                                {matchedCount > 0 && (
                                                    <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-semibold">
                                                        ✓ {matchedCount} matched
                                                    </span>
                                                )}
                                                {partialCount > 0 && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-semibold">
                                                        ~ {partialCount} partial
                                                    </span>
                                                )}
                                                {absentCount > 0 && (
                                                    <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-full font-semibold">
                                                        ○ {absentCount} absent
                                                    </span>
                                                )}
                                                {contradictedCount > 0 && (
                                                    <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full font-semibold">
                                                        ✗ {contradictedCount} contradicting
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* RUBRIC FEEDBACK — expandable */}
                                    {hasLabels && (
                                        <div>
                                            <button
                                                onClick={() => toggleFeedback(index)}
                                                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                                            >
                                                <span>{isExpanded ? "▲" : "▼"}</span>
                                                {isExpanded ? "Hide" : "View"} Rubric Feedback
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden">

                                                    {/* Faculty override notice */}
                                                    {facultyOverridden && (
                                                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs text-amber-700 font-medium">
                                                            &#9432; Your faculty reviewed and adjusted the marks for this question.
                                                            AI suggested <strong>{aiTotalFromLabels}</strong> based on rubric matching,
                                                            but your final awarded mark is <strong>{q.marks}</strong>.
                                                        </div>
                                                    )}

                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rubric Point</th>
                                                                <th className="text-center p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Status</th>
                                                                <th className="text-center p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">AI Marks</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {q.labels_json.map((item, i) => {
                                                                const { badge, icon } = getLabelStyle(item.label);
                                                                return (
                                                                    <tr key={i} className="border-b border-slate-100 last:border-0">
                                                                        <td className="p-4 text-slate-700 leading-6">
                                                                            {item.faculty_rubric_statement}
                                                                        </td>
                                                                        <td className="p-4 text-center">
                                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                                                                                {icon} {item.label}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-4 text-center font-semibold text-slate-600">
                                                                            {item.total_marks}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="bg-slate-50 border-t border-slate-200">
                                                                <td className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide" colSpan={2}>
                                                                    {facultyOverridden
                                                                        ? "Final Marks (Faculty Adjusted)"
                                                                        : "Total Awarded"}
                                                                </td>
                                                                <td className={`p-4 text-center font-bold text-base ${getScoreColor(q.marks, q.max_marks)}`}>
                                                                    {/* Always show final marks (faculty-corrected), not sum of AI rubric rows */}
                                                                    {q.marks}
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FOOTER SUMMARY */}
                <div className="mt-8 bg-slate-900 text-white rounded-3xl p-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Final Score</p>
                            <p className="text-4xl font-bold">
                                {result.total_marks}
                                <span className="text-xl text-slate-400 font-normal"> / {maxTotalMarks}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-sm mb-1">Percentage</p>
                            <p className={`text-4xl font-bold ${percentage >= 75 ? "text-green-400" : percentage >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                                {percentage}%
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}