"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AssessmentReviewPage() {

  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyMarks, setFacultyMarks] = useState({});
  const [editingMarks, setEditingMarks] = useState({});
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  // Revaluation mode: set by dashboard before navigating here
  const [isRevaluationMode, setIsRevaluationMode] = useState(false);

  useEffect(() => {
    const revalMode = localStorage.getItem("revaluationMode") === "true";
    setIsRevaluationMode(revalMode);
    if (revalMode) localStorage.removeItem("revaluationMode");
    fetchReview();
  }, []);

  const fetchReview = async () => {
    try {
      const response = await fetch(`${API_URL}/submission/review/${submissionId}`);
      const data = await response.json();
      setQuestions(data);
      const preFilledMarks = {};
      data.forEach((q) => {
        if (q.faculty_marks !== null && q.faculty_marks !== undefined) {
          preFilledMarks[q.question_id] = q.faculty_marks;
        }
      });
      setFacultyMarks(preFilledMarks);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const finalizeEvaluation = async () => {
    setFinalizing(true);
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
      toast.success(isRevaluationMode ? "Revaluation finalized successfully" : "Evaluation finalized successfully");
      localStorage.setItem("openSubmissions", "true");
      router.push("/faculty/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Error saving evaluation");
    } finally {
      setFinalizing(false);
    }
  };

  const isEvaluated = (q) => q.ai_marks !== null && q.ai_marks !== undefined;
  const allEvaluated = questions.length > 0 && questions.every(isEvaluated);

  const hasFacultyEdit = (q) => {
    const saved = facultyMarks[q.question_id];
    return saved !== undefined && saved !== null && Number(saved) !== Number(q.ai_marks);
  };

  const finalTotal = questions.reduce(
    (sum, q) => sum + Number(facultyMarks[q.question_id] ?? q.ai_marks ?? 0), 0
  );

  const getFeedbackTotal = (feedbackList) => {
    if (!feedbackList?.length) return 0;
    return feedbackList.reduce((sum, item) => sum + Number(item.total_marks || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-900">Loading Review...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-8">

      {/* BACK BUTTON */}
      <button onClick={() => { localStorage.setItem("openSubmissions", "true"); router.push("/faculty/dashboard"); }}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 font-semibold transition">
        ← Back to Submissions
      </button>

      {/* REVALUATION MODE BANNER */}
      {isRevaluationMode && (
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-2xl px-6 py-4 flex items-start gap-3">
          <span className="text-2xl">🔄</span>
          <div>
            <p className="font-bold text-amber-800 text-sm">Revaluation Mode</p>
            <p className="text-amber-700 text-sm mt-0.5">
              A student has requested revaluation. Review the AI marks and rubric feedback carefully.
              You can edit marks for any question, then click <strong>Finalize Revaluation</strong> to update the student's score.
              The student's revaluation flag will be cleared and they can only request once per submission.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        {isRevaluationMode ? "Revaluation Review" : "Assessment Review"}
      </h1>

      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-slate-500 text-center border border-slate-200">
          No evaluation data found. Please evaluate this submission first.
        </div>
      ) : (
        <>
          {questions.map((q, index) => {
            const evaluated = isEvaluated(q);
            const editing = editingMarks[q.question_id];
            const hasFeedback = q.labels_json?.length > 0;

            return (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

                {/* QUESTION HEADER */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                  <h2 className="text-xl font-bold text-slate-900">
                    Question {String(q.question_id).includes("_") ? String(q.question_id).split("_").pop() : q.question_id}
                  </h2>
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
                <div className="mb-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Student Answer</h3>
                  <p className="text-slate-800 leading-8 whitespace-pre-wrap">
                    {q.student_answer || "No answer provided"}
                  </p>
                  {(() => {
                    const wordCount = q.student_answer ? q.student_answer.trim().split(/\s+/).filter(Boolean).length : 0;
                    const expectedLimit = Number(q.ans_length) || 0;
                    return (
                      <div className="mt-3 flex gap-6 text-sm text-slate-500">
                        <span>Words: {wordCount}</span>
                        <span>Characters: {q.student_answer?.length || 0}</span>
                        {expectedLimit > 0 && <span>Expected Words: {expectedLimit}</span>}
                      </div>
                    );
                  })()}
                </div>

                {/* MARKS ROW */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-4 flex-wrap">

                    {/* AI MARKS */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 text-sm">AI Marks</span>
                      <span className={`px-4 py-2 rounded-lg font-bold ${evaluated ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {evaluated ? q.ai_marks : "Pending"}
                      </span>
                      {evaluated && <span className="text-slate-400 text-sm">/ {q.max_marks}</span>}
                    </div>

                    {/* FACULTY MARKS (if edited) */}
                    {hasFacultyEdit(q) && (
                      <div className="flex items-center gap-2 ml-4">
                        <span className="font-semibold text-slate-700 text-sm">Faculty Marks</span>
                        <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold">
                          {facultyMarks[q.question_id]}
                        </span>
                        <span className="text-slate-400 text-sm">/ {q.max_marks}</span>
                      </div>
                    )}

                    {/* EDIT MARKS BUTTON / INPUT */}
                    {!editing ? (
                      <button disabled={!evaluated} onClick={() => setEditingMarks({ ...editingMarks, [q.question_id]: true })}
                        title={!evaluated ? "Evaluate first before editing marks" : "Edit marks"}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ml-2 text-white ${!evaluated ? "bg-slate-300 cursor-not-allowed opacity-60" : "bg-sky-600 hover:bg-sky-700 cursor-pointer"}`}>
                        Edit Marks
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 ml-2">
                        <span className="font-semibold text-slate-700 text-sm">Faculty Marks</span>
                        <input type="number" step="0.5" min="0" max={q.max_marks}
                          value={facultyMarks[q.question_id] ?? q.ai_marks}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (e.target.value === "") { setFacultyMarks({ ...facultyMarks, [q.question_id]: "" }); return; }
                            if (isNaN(val) || val < 0) { toast.error("Marks cannot be negative"); return; }
                            if (val > q.max_marks) { toast.error(`Marks cannot exceed ${q.max_marks}`); return; }
                            setFacultyMarks({ ...facultyMarks, [q.question_id]: val });
                          }}
                          className="border-2 border-slate-300 rounded-lg px-3 py-2 w-24 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400" />
                        <button onClick={() => setEditingMarks({ ...editingMarks, [q.question_id]: false })}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
                          Save
                        </button>
                      </div>
                    )}

                    {/* FEEDBACK BUTTON */}
                    {hasFeedback && (
                      <button onClick={() => setSelectedFeedback({ items: q.labels_json, ai_marks: q.ai_marks })}
                        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* TOTAL + FINALIZE BAR */}
          <div className={`rounded-2xl shadow p-6 ${isRevaluationMode ? "bg-amber-700" : "bg-slate-900"} text-white`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/60 text-sm">
                  {isRevaluationMode ? "Updated Assessment Marks" : "Final Assessment Marks"}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {allEvaluated ? Math.round(finalTotal) : "—"}
                </p>
                {!allEvaluated && (
                  <p className="text-yellow-400 text-xs mt-1">Evaluate all questions first</p>
                )}
              </div>
              <button onClick={finalizeEvaluation} disabled={!allEvaluated || finalizing}
                title={!allEvaluated ? "Evaluate all questions before finalizing" : ""}
                className={`px-6 py-3 rounded-xl font-semibold transition ${allEvaluated && !finalizing ? "bg-sky-500 hover:bg-sky-600 cursor-pointer" : "bg-white/20 opacity-50 cursor-not-allowed"}`}>
                {finalizing ? "Saving..." : isRevaluationMode ? "Finalize Revaluation" : "Finalize Evaluation"}
              </button>
            </div>
          </div>

          {/* FEEDBACK MODAL */}
          {selectedFeedback && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-3xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center border-b px-6 py-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Rubric Feedback</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Rubric Total: <span className="font-bold text-green-600">{getFeedbackTotal(selectedFeedback.items)}</span>
                      {" "}= AI Marks: <span className="font-bold text-green-600">{selectedFeedback.ai_marks}</span>
                    </p>
                  </div>
                  <button onClick={() => setSelectedFeedback(null)}
                    className="text-slate-500 hover:text-slate-800 text-2xl font-bold">✕</button>
                </div>
                <div className="overflow-y-auto p-6">
                  <table className="w-full border border-slate-300 text-slate-800">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border p-3 text-left">Rubric Statement</th>
                        <th className="border p-3">Status</th>
                        <th className="border p-3">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFeedback.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border p-3 text-slate-800">{item.faculty_rubric_statement}</td>
                          <td className="border p-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              item.label?.toLowerCase() === "matched" ? "bg-green-100 text-green-700" :
                              item.label?.toLowerCase() === "contradicting" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {item.label}
                            </span>
                          </td>
                          <td className="border p-3 text-center font-semibold text-slate-800">{item.total_marks}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td className="border p-3 text-right text-slate-700" colSpan={2}>Total</td>
                        <td className="border p-3 text-center text-green-700">{getFeedbackTotal(selectedFeedback.items)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="border-t p-4 flex justify-end">
                  <button onClick={() => setSelectedFeedback(null)}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg">Close</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}