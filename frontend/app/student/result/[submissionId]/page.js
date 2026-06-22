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

                {/* BACK */}
                <button
                    onClick={() => router.push("/student/dashboard")}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium"
                >
                    <span>&#8592;</span> Back to Dashboard
                </button>

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