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

            // Backend should return results_published status
            // Check if results are published
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

    // RESULTS NOT PUBLISHED YET
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

    const maxTotalMarks =
        result?.questions?.reduce(
            (total, q) => total + (q.max_marks || 0),
            0
        ) || 0;

    

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

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 px-8 py-5">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                                Assessment Result
                            </p>
                            <h1 className="text-3xl font-bold text-slate-900">
                                {result.assessment_title}
                            </h1>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center w-[120px] self-start">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                Final Score
                            </p>
                            <div className="text-2xl font-bold text-green-600 mt-1 leading-none">
                                {result.total_marks}/{maxTotalMarks}
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
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-3">
                                Question {index + 1}
                            </h2>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-medium">
                                {q.question}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold text-slate-700 mb-3">Your Answer</h3>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap text-slate-800">
                                {q.student_answer || "No answer submitted"}
                            </div>
                        </div>

                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <span className="text-slate-500">Marks Obtained</span>
                                <div className="text-xl font-bold text-green-600">
                                    {q.marks} / {q.max_marks}
                                </div>
                            </div>

                            {q.labels_json?.length > 0 && (
                                <button
                                    onClick={() => {
                                        
                                        setSelectedFeedback(q.labels_json);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                                >
                                    Feedback
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* FEEDBACK MODAL */}
            {selectedFeedback?.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-5xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center border-b px-6 py-4">
                            <h2 className="text-xl font-bold text-black">Rubric Feedback</h2>
                            <button onClick={() => setSelectedFeedback(null)} className="text-2xl">✕</button>
                        </div>

                        <div className="overflow-y-auto p-6 text-slate-900">
                            <div className="overflow-x-auto">
                                <table className="w-full border border-slate-200">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border p-3 text-left">Rubric Point</th>
                                            <th className="border p-3 text-center">Status</th>
                                            <th className="border p-3 text-center">Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedFeedback.map((item, index) => (
                                            <tr key={index}>

                                                <td className="border p-3 text-slate-800">
                                                    {item.faculty_rubric_statement}
                                                </td>

                                                <td className="border p-3 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${item.label?.toLowerCase() === "matched"
                                                            ? "bg-green-100 text-green-700"
                                                            : item.label?.toLowerCase() === "contradicting"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                            }`}
                                                    >
                                                        {item.label}
                                                    </span>
                                                </td>

                                                <td className="border p-3 text-center text-slate-800">
                                                    {item.total_marks}
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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