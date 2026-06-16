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
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    const submissionId = params?.submissionId;

    useEffect(() => {
        if (submissionId) {
            fetchResult();
        }
    }, [submissionId]);

    const fetchResult = async () => {
        try {
            const res = await fetch(
                `${API_URL}/submission/student-result/${params.submissionId}`
            );

            const data = await res.json();

            setResult(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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

    

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <h2 className="text-xl font-semibold">
                    Result not found
                </h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">

            {/* HEADER */}
            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={() => router.push("/student/dashboard")}
                    className="mb-4 px-4 py-2 bg-slate-800 text-white rounded-lg"
                >
                    Back
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">

                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                {result?.assessment_title || "Assessment Result"}
                            </h1>

                            <p className="text-slate-500 mt-2">
                                Assessment Result
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="text-sm text-slate-500 mb-1">
                                Final Marks
                            </div>

                            <div className="text-4xl font-bold text-green-600">
                                {result?.total_marks ?? 0} Marks
                            </div>

                            <div className="mt-2">
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                    {result.status}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* QUESTIONS */}
            <div className="max-w-6xl mx-auto space-y-6">

                {result?.questions?.map((q, index) => (

                    <div
                        key={index}
                        className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8"
                    >

                        {/* QUESTION */}
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-3">
                                Question {q.question_id}
                            </h2>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                {q.question}
                            </div>
                        </div>

                        {/* ANSWER */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-slate-700 mb-3">
                                Your Answer
                            </h3>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap">
                                {q.student_answer || "No answer submitted"}
                            </div>
                        </div>

                        {/* MARKS */}
                        <div className="flex justify-between items-center flex-wrap gap-4">

                            <div>
                                <span className="text-slate-500">
                                    Marks Obtained
                                </span>

                                <div className="text-2xl font-bold text-green-600">
                                    {q.marks} / {q.max_marks}
                                </div>
                            </div>

                            {q.feedback?.length > 0 && (
                                <button
                                    onClick={() => setSelectedFeedback(q.feedback)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                                >
                                    Feedback ({q.feedback.length})
                                </button>
                            )}

                        </div>

                    </div>
                ))}

            </div>

            {/* FEEDBACK MODAL */}
            {selectedFeedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

                    <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-3xl max-h-[80vh] flex flex-col">

                        <div className="flex justify-between items-center border-b px-6 py-4">
                            <h2 className="text-xl font-bold">
                                Rubric Feedback
                            </h2>

                            <button
                                onClick={() => setSelectedFeedback(null)}
                                className="text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6">
                            <ul className="space-y-3">
                                {selectedFeedback.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className={
                                            item.startsWith("✓")
                                                ? "text-green-700"
                                                : "text-red-600"
                                        }
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="border-t p-4 flex justify-end">
                            <button
                                onClick={() => setSelectedFeedback(null)}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg"
                            >
                                Close
                            </button>
                        </div>

                    </div>

                </div>
            )}
        </div>
    );
}