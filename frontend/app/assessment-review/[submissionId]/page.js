"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AssessmentReviewPage() {

    const router = useRouter();
    const params = useParams();
    const submissionId = params.submissionId;

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [facultyMarks, setFacultyMarks] = useState({});
    const [editingMarks, setEditingMarks] = useState({});
    const [submissionInfo, setSubmissionInfo] = useState(null);

    useEffect(() => {
        fetchReview();
    }, []);

    const fetchReview = async () => {
        try {
            const response = await fetch(`${API_URL}/submission/review/${submissionId}`);
            const data = await response.json();
            setQuestions(Array.isArray(data) ? data : data.questions || []);
            if (data.meta) setSubmissionInfo(data.meta);
            else if (data.studentsWrote !== undefined) setSubmissionInfo(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getWordCount = (text) => (text || "").split(/\s+/).filter(Boolean).length;

    const finalizeEvaluation = async () => {
        try {
            for (const q of questions) {
                const facultyMark = facultyMarks[q.question_id] ?? q.ai_marks;
                await fetch(`${API_URL}/submission/save-correction`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        submission_id: submissionId,
                        question_id: q.question_id,
                        ai_marks: q.ai_marks,
                        faculty_marks: Number(facultyMark)
                    })
                });
            }
            alert("Evaluation Finalized Successfully");
            localStorage.setItem("openSubmissions", "true");
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Error Saving Evaluation");
        }
    };

    const finalTotal = questions.reduce(
        (sum, q) => sum + Number(facultyMarks[q.question_id] ?? q.ai_marks ?? 0),
        0
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <h2 className="text-xl font-semibold text-slate-900">Loading Review...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7fb] p-8">

            <button
                onClick={() => {
                    localStorage.setItem("openSubmissions", "true");
                    router.push("/faculty/dashboard");
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
                <span className="text-xl">←</span>
                <span className="font-semibold">Back to Submissions</span>
            </button>

            <h1 className="text-3xl font-bold text-slate-900 mb-6">Assessment Review</h1>

            {/* SUBMISSION STATS */}
            {submissionInfo && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex flex-wrap gap-6 items-center">
                    {submissionInfo.assessmentTitle && (
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Assessment</p>
                            <p className="font-bold text-slate-900 text-lg">{submissionInfo.assessmentTitle}</p>
                        </div>
                    )}
                    {submissionInfo.studentName && (
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Student</p>
                            <p className="font-bold text-slate-900 text-lg">{submissionInfo.studentName}</p>
                        </div>
                    )}
                    <div className="flex gap-4 ml-auto">
                        <div className="text-center bg-blue-50 border border-blue-200 rounded-xl px-6 py-3">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Students Wrote</p>
                            <p className="text-3xl font-bold text-blue-700">{submissionInfo.studentsWrote ?? "—"}</p>
                        </div>
                        <div className="text-center bg-slate-50 border border-slate-200 rounded-xl px-6 py-3">
                            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide mb-1">Expected</p>
                            <p className="text-3xl font-bold text-slate-700">{submissionInfo.expectedStudents ?? "—"}</p>
                        </div>
                    </div>
                </div>
            )}

            {questions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-slate-500 text-center">
                    No evaluation data found. Please evaluate this submission first.
                </div>
            ) : (
                <>
                    {questions.map((q, index) => {
                        const studentWordCount = getWordCount(q.student_answer);
                        const expectedWordLimit = Number(q.ans_length) || 0;
                        const isOverLimit = expectedWordLimit > 0 && studentWordCount > expectedWordLimit;

                        return (
                            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

                                {/* QUESTION HEADER */}
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                                    <h2 className="text-xl font-bold text-slate-900">Question {q.question_id}</h2>
                                    <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                                        Max Marks: {q.max_marks}
                                    </div>
                                </div>

                                {/* QUESTION TEXT */}
                                <div className="mb-5">
                                    <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Question</h3>
                                    <p className="text-slate-800 leading-7">{q.question}</p>
                                </div>

                                {/* STUDENT ANSWER */}
                                <div className="mb-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Student Answer</h3>
                                    <p className="text-slate-800 leading-8 whitespace-pre-wrap">{q.student_answer || "No answer provided"}</p>
                                </div>

                                {/* WORD COUNT BADGE */}
                                {expectedWordLimit > 0 && (
                                    <div className={`flex items-center gap-3 mb-5 px-4 py-3 rounded-xl border text-sm font-semibold
                                        ${isOverLimit
                                            ? "bg-red-50 border-red-200 text-red-700"
                                            : "bg-green-50 border-green-200 text-green-700"
                                        }`}
                                    >
                                        <span>{isOverLimit ? "⚠️ Word Limit Exceeded" : "✓ Within Word Limit"}</span>
                                        <span className="ml-auto flex gap-4">
                                            <span>
                                                Student wrote:{" "}
                                                <span className={`font-bold ${isOverLimit ? "text-red-700" : "text-green-700"}`}>
                                                    {studentWordCount} words
                                                </span>
                                            </span>
                                            <span className="text-slate-400">|</span>
                                            <span>
                                                Expected limit:{" "}
                                                <span className="font-bold text-slate-700">{expectedWordLimit} words</span>
                                            </span>
                                            {isOverLimit && (
                                                <>
                                                    <span className="text-slate-400">|</span>
                                                    <span>
                                                        Exceeded by:{" "}
                                                        <span className="font-bold text-red-700">{studentWordCount - expectedWordLimit} words</span>
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                )}

                                {/* MARKS SECTION */}
                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-700 text-sm">AI Marks</span>
                                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold">{q.ai_marks ?? 0}</span>
                                            <span className="text-slate-400 text-sm">/ {q.max_marks}</span>
                                        </div>

                                        {facultyMarks[q.question_id] !== undefined && (
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className="font-semibold text-slate-700 text-sm">Final Marks</span>
                                                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold">{facultyMarks[q.question_id]}</span>
                                                <span className="text-slate-400 text-sm">/ {q.max_marks}</span>
                                            </div>
                                        )}

                                        {!editingMarks[q.question_id] ? (
                                            <button
                                                onClick={() => setEditingMarks({ ...editingMarks, [q.question_id]: true })}
                                                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition ml-2"
                                            >
                                                Edit Marks
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3 ml-2">
                                                <span className="font-semibold text-slate-700 text-sm">Faculty Marks</span>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    max={q.max_marks}
                                                    value={facultyMarks[q.question_id] ?? q.ai_marks}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (e.target.value === "") { setFacultyMarks({ ...facultyMarks, [q.question_id]: "" }); return; }
                                                        if (isNaN(val) || val < 0) { alert("Marks cannot be negative"); return; }
                                                        if (val > q.max_marks) { alert(`Marks cannot exceed maximum marks (${q.max_marks})`); return; }
                                                        setFacultyMarks({ ...facultyMarks, [q.question_id]: val });
                                                    }}
                                                    className="border-2 border-slate-300 rounded-lg px-3 py-2 w-24 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                                                />
                                                <button
                                                    onClick={() => setEditingMarks({ ...editingMarks, [q.question_id]: false })}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        );
                    })}

                    {/* TOTAL + FINALIZE */}
                    <div className="bg-slate-900 text-white rounded-2xl shadow p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-slate-400 text-sm">Final Assessment Marks</p>
                                <p className="text-3xl font-bold mt-1">{Math.round(finalTotal)}</p>
                            </div>
                            <button
                                onClick={finalizeEvaluation}
                                className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                            >
                                Finalize Evaluation
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}