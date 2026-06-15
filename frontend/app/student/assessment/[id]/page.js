"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StudentAssessmentPage() {

  const params = useParams();
  const router = useRouter();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (params.id) fetchAssessment();
  }, [params.id]);

  // Start countdown timer once assessment is loaded
  useEffect(() => {
    if (!assessment) return;

    const durationMins = Number(assessment.duration) || 0;
    const availableTo = assessment.availableTo ? new Date(assessment.availableTo) : null;

    let secondsLeft;

    if (availableTo) {
      const now = new Date();
      const secsToEnd = Math.floor((availableTo - now) / 1000);
      const durSecs = durationMins * 60;
      secondsLeft = Math.min(secsToEnd, durSecs);
    } else {
      secondsLeft = durationMins * 60;
    }

    if (secondsLeft <= 0) {
      setTimeLeft(0);
      return;
    }

    setTimeLeft(secondsLeft);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-submit when time runs out
          submitAssessmentAuto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [assessment]);

  // UNSAVED CHANGES WARNING
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasAnswers = Object.values(answers).some(a => a.trim());
      if (hasAnswers) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers]);

  const fetchAssessment = async () => {
    try {
      const [assessmentRes, questionsRes] = await Promise.all([
        fetch(`${API_URL}/assessment/view/${params.id}`),
        fetch(`${API_URL}/assessment/questions/${params.id}`),
      ]);
      const data = await assessmentRes.json();
      const questionData = await questionsRes.json();
      setAssessment(data);
      setQuestions(Array.isArray(questionData) ? questionData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [String(questionId)]: value }));
  };

  const getWordCount = (text) => (text || "").split(/\s+/).filter(Boolean).length;

  const formatTime = (secs) => {
    if (secs === null) return "--:--";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const doSubmit = async (currentAnswers) => {
    try {
      setSubmitting(true);
      clearInterval(timerRef.current);
      const registerNumber = localStorage.getItem("registerNumber");
      if (!registerNumber) {
        alert("Registration number not found. Please log in again.");
        return;
      }
      const response = await fetch(`${API_URL}/submission/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: assessment._id,
          student_email: localStorage.getItem("userEmail"),
          student_id: registerNumber,
          answers: currentAnswers
        })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || data.message || "Failed to submit assessment");
        return;
      }
      setAnswers({});
      alert(data.message || "Assessment Submitted Successfully");
      router.push("/student/dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  // For auto-submit on timer end (uses ref to get latest answers)
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const submitAssessmentAuto = () => {
    alert("Time is up! Your answers are being submitted automatically.");
    doSubmit(answersRef.current);
  };

  const submitAssessment = () => doSubmit(answers);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-900">Loading Assessment...</h2>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
        <h2 className="text-xl font-semibold text-red-600">Assessment Not Found</h2>
      </div>
    );
  }

  const isWarning = timeLeft !== null && timeLeft <= 300; // last 5 mins

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-8">
      <div className="max-w-5xl mx-auto">

        {/* ASSESSMENT HEADER */}
        <div className="bg-white rounded-[30px] border border-slate-200 p-10 shadow-sm mb-8">

          <div className="mb-6 border-b border-slate-200 pb-6 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-3">{assessment.title}</h1>
              <p className="text-slate-500 text-lg">Student Assessment</p>
            </div>

            {/* TIMER */}
            {timeLeft !== null && (
              <div className={`flex flex-col items-center px-6 py-4 rounded-2xl font-bold text-2xl shadow-sm border ${
                timeLeft === 0
                  ? "bg-red-100 border-red-300 text-red-700"
                  : isWarning
                    ? "bg-orange-100 border-orange-300 text-orange-700 animate-pulse"
                    : "bg-slate-900 border-slate-900 text-white"
              }`}>
                <span className="text-xs font-semibold mb-1 tracking-widest uppercase opacity-70">Time Left</span>
                {timeLeft === 0 ? "Time Up!" : formatTime(timeLeft)}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p><span className="font-semibold">Subject Code:</span> {assessment.subjectCode}</p>
              <p><span className="font-semibold">Subject Name:</span> {assessment.subjectName}</p>
              <p><span className="font-semibold">Examination Date:</span> {new Date(assessment.examDate).toLocaleDateString("en-GB")}</p>
              <p><span className="font-semibold">Duration:</span> {assessment.duration} mins</p>
              <p><span className="font-semibold">Department:</span> {assessment.departments?.join(", ")}</p>
              <p><span className="font-semibold">Year:</span> {assessment.years?.join(", ")}</p>
              <p><span className="font-semibold">Available From:</span> {new Date(assessment.availableFrom).toLocaleString("en-GB")}</p>
              <p><span className="font-semibold">Available To:</span> {new Date(assessment.availableTo).toLocaleString("en-GB")}</p>
            </div>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-[30px] p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Instructions</h2>
          <p className="text-slate-700 whitespace-pre-line">{assessment.instructions}</p>
        </div>

        {/* QUESTIONS */}
        <div className="space-y-8">
          {(questions.length > 0
            ? questions
            : assessment.questions?.map((q, index) => ({
                question_id: index + 1,
                question_text: q.question,
                max_marks: q.marks,
                ans_length: q.expected_length
              })) || []
          ).map((question, index) => {
            const questionId = question.question_id ?? index + 1;
            const answerText = answers[String(questionId)] || "";
            const wordCount = getWordCount(answerText);
            const expectedLength = Number(question.ans_length) || 0;
            const isOverLimit = expectedLength > 0 && wordCount > expectedLength;

            return (
              <div key={questionId} className="bg-white rounded-[30px] border border-slate-200 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-bold text-slate-900">Question {index + 1}</h2>
                  <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold">
                    {question.max_marks ?? question.marks} Marks
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-slate-800 text-lg leading-7">{question.question_text ?? question.question}</p>
                </div>
                <textarea
                  rows={8}
                  value={answerText}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  placeholder="Write your answer here..."
                  className="w-full border-2 border-slate-200 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 transition"
                />
                <div className="flex justify-between items-center mt-3 px-1">
                  <p className="text-slate-500 text-sm">
                    Expected length:{" "}
                    <span className="font-semibold text-slate-700">
                      {expectedLength > 0 ? `${expectedLength} words` : "Not specified"}
                    </span>
                  </p>
                  <p className={`text-sm font-semibold ${isOverLimit ? "text-red-500" : "text-slate-500"}`}>
                    {wordCount} / {expectedLength > 0 ? expectedLength : "—"} words
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              const confirmSubmit = window.confirm("Once submitted, you cannot edit your answers. Do you want to continue?");
              if (confirmSubmit) submitAssessment();
            }}
            disabled={submitting || timeLeft === 0}
            className="bg-slate-900 hover:bg-slate-700 text-white px-10 py-4 rounded-2xl font-semibold transition disabled:opacity-50 text-lg"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>

      </div>
    </div>
  );
}