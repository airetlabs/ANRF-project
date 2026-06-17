"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StudentAssessmentPage() {

  const params = useParams();
  const router = useRouter();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});

  const [assessmentStatus, setAssessmentStatus] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (params.id) {
      fetchAssessment();
    }
  }, [params.id]);

  useEffect(() => {
    if (!assessment?.duration) return;

    const savedStartTime = localStorage.getItem(
      `assessment_start_${assessment._id}`
    );

    let startTime;

    if (savedStartTime) {
      startTime = Number(savedStartTime);
    } else {
      startTime = Date.now();
      localStorage.setItem(
        `assessment_start_${assessment._id}`,
        startTime
      );
    }

    const durationMs = assessment.duration * 60 * 1000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = durationMs - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft(0);

        if (!submitting) {
          alert("Time is up. Assessment will be submitted.");
          submitAssessment();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment, submitting]);

  // UNSAVED CHANGES WARNING — browser tab close / refresh
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
      const now = new Date();
      const start = new Date(data.availableFrom);
      const end = new Date(data.availableTo);

      if (now < start) {
        setAssessmentStatus("Upcoming");
      } else if (now > end) {
        setAssessmentStatus("Expired");
      } else {
        setAssessmentStatus("Live");
      }
      setQuestions(Array.isArray(questionData) ? questionData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: value
    }));
  };

  const getWordCount = (text) => {
    return (text || "").trim().split(/\s+/).filter(Boolean).length;
  };

  const getCharacterCount = (text) => {
    return (text || "").length;
  };

  const submitAssessment = async () => {

    if (submitting) return;

    try {
      setSubmitting(true);

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
          answers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || data.message || "Failed to submit assessment");
        return;
      }

      // Clear answers so unsaved warning doesn't trigger after submit

      setAnswers({});

      localStorage.removeItem(
        `assessment_start_${assessment._id}`
      );

      alert(data.message || "Assessment Submitted Successfully");
      router.push("/student/dashboard");

    } catch (error) {
      console.error(error);
      alert("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-8">

      <div className="max-w-5xl mx-auto">

        {/* ASSESSMENT HEADER */}
        <div className="bg-white rounded-[30px] border border-slate-200 p-10 shadow-sm mb-8">

          <div className="mb-6 border-b border-slate-200 pb-6">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              {assessment.title}
            </h1>
            <p className="text-slate-500 text-lg">Student Assessment</p>
          </div>



          <div className="mt-4 flex flex-wrap gap-4 items-center">

            <span
              className={`px-4 py-2 rounded-xl font-semibold text-white ${assessmentStatus === "Live"
                ? "bg-green-600"
                : assessmentStatus === "Expired"
                  ? "bg-red-600"
                  : "bg-yellow-500"
                }`}
            >
              {assessmentStatus}
            </span>

            {timeLeft !== null && (
              <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
                <span className="font-semibold text-red-700">
                  Time Remaining: {formatTime(timeLeft)}
                </span>
              </div>
            )}

          </div>

          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-800">
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
            const characterCount = getCharacterCount(answerText);
            const expectedLength = Number(question.ans_length) || 0;
            const isOverLimit = expectedLength > 0 && wordCount > expectedLength;

            return (
              <div
                key={questionId}
                className="bg-white rounded-[30px] border border-slate-200 p-8 shadow-sm"
              >

                {/* QUESTION HEADER */}
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Question {index + 1}
                  </h2>
                  <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold">
                    {question.max_marks ?? question.marks} Marks
                  </div>
                </div>

                {/* QUESTION TEXT */}
                <div className="mb-6">
                  <p className="text-slate-800 text-lg leading-7">
                    {question.question_text ?? question.question}
                  </p>
                </div>

                {/* ANSWER BOX — border always normal, never red */}
                <textarea
                  rows={8}
                  value={answerText}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  placeholder="Write your answer here..."
                  className="w-full border-2 border-slate-200 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-900 transition"
                />

                {/* WORD COUNT — only the count text turns red when over limit */}
                <div className="flex justify-between items-center mt-3 px-1">
                  <p className="text-slate-500 text-sm">
                    Expected length:{" "}
                    <span className="font-semibold text-slate-700">
                      {expectedLength > 0 ? `${expectedLength} words` : "Not specified"}
                    </span>
                  </p>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${isOverLimit ? "text-red-500" : "text-slate-500"
                        }`}
                    >
                      {wordCount} / {expectedLength > 0 ? expectedLength : "—"} words
                    </p>

                    <p className="text-sm text-slate-500">
                      {characterCount} characters
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              const confirmSubmit = window.confirm(
                "Once submitted, you cannot edit your answers. Do you want to continue?"
              );
              if (confirmSubmit) {
                submitAssessment();
              }
            }}
            disabled={submitting || assessmentStatus === "Expired"}
            className="bg-slate-900 hover:bg-slate-700 text-white px-10 py-4 rounded-2xl font-semibold transition disabled:opacity-50 text-lg"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>

      </div>
    </div>
  );
}
