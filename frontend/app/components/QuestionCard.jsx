"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function QuestionCard({
  q,
  index,
  addQuestionCard,
  deleteQuestion,
  updateQuestion
}) {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => setShowModal(true);

  const handleCloseModal = () => {
    if (!q.question?.trim()) {
      toast.error(`Enter question for Q${index + 1}`);
      return;
    }
    if (!q.answer_key?.trim()) {
      toast.error(`Enter answer key for Q${index + 1}`);
      return;
    }
    if (!q.rubric?.trim()) {
      toast.error(`Enter rubric for Q${index + 1}`);
      return;
    }
    if (!q.marks) {
      toast.error(`Enter marks for Q${index + 1}`);
      return;
    }
    const marksVal = parseInt(q.marks);
    if (isNaN(marksVal) || marksVal < 1 || marksVal > 100) {
      toast.error(`Marks must be between 1 and 100 for Q${index + 1}`);
      return;
    }
    if (!q.expected_length?.trim()) {
      toast.error(`Enter expected length for Q${index + 1}`);
      return;
    }
    setShowModal(false);
  };

  const isComplete = q.question?.trim() && q.answer_key?.trim() && q.rubric?.trim() && q.marks && q.expected_length?.trim();

  return (
    <>
      {/* COMPACT ROW */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`flex items-center justify-between border rounded-2xl px-6 py-4 cursor-pointer transition hover:shadow-md
          ${isComplete ? "bg-white border-slate-200" : "bg-amber-50 border-amber-200"}`}
        onClick={handleOpenModal}
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${isComplete ? "bg-slate-900 text-white" : "bg-amber-400 text-white"}`}>
            {index + 1}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Question {index + 1}</p>
            <p className="font-semibold text-slate-800 text-sm max-w-[400px] truncate">
              {q.question?.trim() ? q.question : "Click to fill question details..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
          {isComplete && (
            <span className="text-xs text-slate-600 font-semibold bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg mr-2">
              {q.marks} marks
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); addQuestionCard(index); }}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition flex items-center justify-center text-lg font-bold"
          >
            +
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteQuestion(index); }}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:border-red-300 transition flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>
      </motion.div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Assessment Question</p>
                  <h2 className="text-2xl font-bold text-slate-900">Question {index + 1}</h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="bg-slate-900 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  Done
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Question</label>
                <textarea
                  placeholder="Enter the assessment question..."
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                  value={q.question || ""}
                  onChange={(e) => updateQuestion(index, "question", e.target.value)}
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Answer Key</label>
                <textarea
                  placeholder="Enter expected answer..."
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                  value={q.answer_key || ""}
                  onChange={(e) => updateQuestion(index, "answer_key", e.target.value)}
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Rubric</label>
                <textarea
                  placeholder="Enter evaluation criteria..."
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none"
                  value={q.rubric || ""}
                  onChange={(e) => updateQuestion(index, "rubric", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Marks (1–100)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    min={1}
                    max={100}
                    className="w-full border border-slate-200 bg-slate-50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                    value={q.marks || ""}
                    onChange={(e) => updateQuestion(index, "marks", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Expected Length (words)</label>
                  <input
                    type="text"
                    placeholder="e.g. 150"
                    className="w-full border border-slate-200 bg-slate-50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                    value={q.expected_length || ""}
                    onChange={(e) => updateQuestion(index, "expected_length", e.target.value)}
                  />
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
