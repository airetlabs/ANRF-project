"use client";

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

    useEffect(() => {
        fetchReview();
    }, []);

    const fetchReview = async () => {
        try {
            const response = await fetch(
                `https://anrf-project-production.up.railway.app/submission/review/${submissionId}`
            );
            const data = await response.json();
            setQuestions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const finalizeEvaluation = async () => {
        try {
            for (const q of questions) {
                const facultyMark =
                    facultyMarks[q.question_id] ?? q.ai_marks;

                await fetch(
                    "https://anrf-project-production.up.railway.app/submission/save-correction",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            submission_id: submissionId,
                            question_id: q.question_id,
                            ai_marks: q.ai_marks,
                            faculty_marks: Number(facultyMark)
                        })
                    }
                );
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
        (sum, q) =>
            sum +
            Number(
                facultyMarks[q.question_id] ??
                q.ai_marks ??
                0
            ),
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
                    localStorage.setItem(
                        "openSubmissions",
                        "true"
                    );
                    router.push("/");
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
                <span className="text-xl">←</span>
                <span className="font-semibold">
                    Back to Submissions
                </span>
            </button>

            <h1 className="text-3xl font-bold text-slate-900 mb-8">
                Assessment Review
            </h1>

            {questions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-slate-500 text-center">
                    No evaluation data found. Please evaluate this submission first.
                </div>
            ) : (
                <>
                    {questions.map((q, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6"
                        >
                            {/* QUESTION HEADER */}
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                                <h2 className="text-xl font-bold text-slate-900">
                                    Question {q.question_id}
                                </h2>
                                <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                                    Max Marks: {q.max_marks}
                                </div>
                            </div>

                            {/* QUESTION TEXT */}
                            <div className="mb-5">
                                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                                    Question
                                </h3>
                                <p className="text-slate-800 leading-7">
                                    {q.question}
                                </p>
                            </div>

                            {/* STUDENT ANSWER */}
                            <div className="mb-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">
                                    Student Answer
                                </h3>
                                <p className="text-slate-800 leading-8 whitespace-pre-wrap">
                                    {q.student_answer || "No answer provided"}
                                </p>
                            </div>

                            {/* MARKS SECTION */}
                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-4 flex-wrap">

                                    {/* AI MARKS */}
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-700 text-sm">AI Marks</span>
                                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold">
                                            {q.ai_marks ?? 0}
                                        </span>
                                        <span className="text-slate-400 text-sm">/ {q.max_marks}</span>
                                    </div>

                                    {/* FACULTY MARKS (if edited) */}
                                    {facultyMarks[q.question_id] !== undefined && (
                                        <div className="flex items-center gap-2 ml-4">
                                            <span className="font-semibold text-slate-700 text-sm">Final Marks</span>
                                            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold">
                                                {facultyMarks[q.question_id]}
                                            </span>
                                            <span className="text-slate-400 text-sm">/ {q.max_marks}</span>
                                        </div>
                                    )}

                                    {/* EDIT / SAVE MARKS */}
                                    {!editingMarks[q.question_id] ? (
                                        <button
                                            onClick={() =>
                                                setEditingMarks({
                                                    ...editingMarks,
                                                    [q.question_id]: true
                                                })
                                            }
                                            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition ml-2"
                                        >
                                            Edit Marks
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3 ml-2">
                                            <span className="font-semibold text-slate-700 text-sm">
                                                Faculty Marks
                                            </span>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                max={q.max_marks}
                                                value={facultyMarks[q.question_id] ?? q.ai_marks}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (e.target.value === "") {
                                                        setFacultyMarks({ ...facultyMarks, [q.question_id]: "" });
                                                        return;
                                                    }
                                                    if (isNaN(val) || val < 0) {
                                                        alert("Marks cannot be negative");
                                                        return;
                                                    }
                                                    if (val > q.max_marks) {
                                                        alert(`Marks cannot exceed maximum marks (${q.max_marks})`);
                                                        return;
                                                    }
                                                    setFacultyMarks({ ...facultyMarks, [q.question_id]: val });
                                                }}
                                                className="border-2 border-slate-300 rounded-lg px-3 py-2 w-24 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                                            />
                                            <button
                                                onClick={() =>
                                                    setEditingMarks({
                                                        ...editingMarks,
                                                        [q.question_id]: false
                                                    })
                                                }
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </div>

                        </div>
                    ))}

                    {/* TOTAL + FINALIZE */}
                    <div className="bg-slate-900 text-white rounded-2xl shadow p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-slate-400 text-sm">Final Assessment Marks</p>
                                <p className="text-3xl font-bold mt-1">
                                    {Math.round(finalTotal)}
                                </p>
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
