"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-f434.up.railway.app";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();

  const [assessments, setAssessments] = useState([]);
  const [submittedIds, setSubmittedIds] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentEmail, setStudentEmail] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [revalModal, setRevalModal] = useState(null);
  const [revalReason, setRevalReason] = useState("");
  const [revalLoading, setRevalLoading] = useState(false);
  const assessmentsPerPage = 9;

  const [studentInfo, setStudentInfo] = useState({
    registerNumber: "",
    department: "",
    year: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "student") {
      router.push("/login");
      return;
    }
    setStudentEmail(localStorage.getItem("userEmail") || "");
    setStudentInfo({
      registerNumber: localStorage.getItem("registerNumber") || "",
      department: localStorage.getItem("department") || "",
      year: localStorage.getItem("year") || ""
    });
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const department = localStorage.getItem("department");
      const year = localStorage.getItem("year");
      const email = localStorage.getItem("userEmail");

      const [assessmentRes, submissionRes] = await Promise.all([
        fetch(`${API_URL}/assessment/student/${department}/${year}`),
        fetch(`${API_URL}/submission/student/${email}`),
      ]);

      const assessmentData = await assessmentRes.json();
      const submissionData = await submissionRes.json();

      const sorted = [...assessmentData].sort((a, b) => (a._id < b._id ? 1 : -1));
      setAssessments(sorted);

      const submittedAssessmentIds = submissionData.map((s) => s.assessment_id);
      setSubmittedIds(submittedAssessmentIds);

      const map = {};
      submissionData.forEach((s) => {
        map[s.assessment_id] = {
          submissionId: s._id,
          status: s.status,
          finalMarks: s.final_marks,
          submittedAt: s.submitted_at || null,
          startedAt: s.started_at || null,
          revaluationRequested: s.revaluation_requested || false,
        };
      });
      setSubmissionMap(map);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  const fmt = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  const submitRevaluation = async () => {
    if (!revalReason.trim()) return;
    setRevalLoading(true);
    try {
      await fetch(`${API_URL}/submission/revaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: revalModal.submissionId,
          student_email: studentEmail,
          reason: revalReason.trim(),
        }),
      });
      setRevalModal(null);
      setRevalReason("");
      fetchAssessments();
    } catch (e) {
      console.error(e);
    } finally {
      setRevalLoading(false);
    }
  };

  const getStatus = (assessment) => {
    const isSubmitted = submittedIds.includes(assessment._id);
    const now = new Date();
    const start = new Date(assessment.availableFrom);
    const end = new Date(assessment.availableTo);
    if (isSubmitted) return "Submitted";
    if (now < start) return "Upcoming";
    if (now > end) return "Missed";
    return "Live";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-900">Loading AcadAIsist</h2>
          <p className="text-slate-500 mt-2">Fetching your assessments...</p>
        </div>
      </div>
    );
  }

  const tabs = ["All", "Live", "Upcoming", "Submitted", "Missed"];

  const filteredAssessments = assessments.filter((a) => {
    if (activeTab === "All") return true;
    return getStatus(a) === activeTab;
  });

  const totalPages = Math.ceil(filteredAssessments.length / assessmentsPerPage);
  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * assessmentsPerPage,
    currentPage * assessmentsPerPage
  );

  const tabCount = (tab) =>
    tab === "All" ? assessments.length : assessments.filter((a) => getStatus(a) === tab).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">AcadAIsist</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Student Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <p className="text-sm font-semibold text-slate-800">Student</p>
            <p className="text-xs text-slate-500">{studentEmail}</p>
          </div>
          <button onClick={logout}
            className="bg-red-50 hover:bg-red-100 border border-red-200 transition text-red-600 px-3 sm:px-4 py-2 rounded-xl font-medium text-sm">
            Logout
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-10 py-8">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl px-5 py-4 border border-slate-200 shadow-sm mb-7">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm">
            <div>
              <span className="text-slate-500">Register No:</span>{" "}
              <span className="font-semibold text-slate-900">{studentInfo.registerNumber}</span>
            </div>
            <div>
              <span className="text-slate-500">Department:</span>{" "}
              <span className="font-semibold text-slate-900">{studentInfo.department}</span>
            </div>
            <div>
              <span className="text-slate-500">Year:</span>{" "}
              <span className="font-semibold text-slate-900">{studentInfo.year}</span>
            </div>
          </div>
        </div>

        {/* ASSESSMENTS HEADER + TABS */}
        <div className="mb-7">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">My Assessments</h2>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                {tab} ({tabCount(tab)})
              </button>
            ))}
          </div>
        </div>

        {/* EMPTY STATE */}
        {filteredAssessments.length === 0 ? (
          <div className="bg-white rounded-[30px] p-10 border border-slate-200 shadow-sm text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Assessments Available</h2>
            <p className="text-slate-500">Check back later for new assessments from your faculty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedAssessments.map((assessment) => {
              const status = getStatus(assessment);
              const isSubmitted = submittedIds.includes(assessment._id);
              const sub = submissionMap[assessment._id];
              const isMissed = status === "Missed";
              const isFinalized = sub?.status === "Finalized";

              const statusBadge = {
                Live: "bg-green-600 text-white",
                Upcoming: "bg-yellow-500 text-white",
                Submitted: "bg-green-100 text-green-700",
                Missed: "bg-red-100 text-red-700",
              };

              return (
                <div key={assessment._id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition flex flex-col ${
                    isMissed ? "border-red-200" : "border-slate-200"
                  }`}>

                  {/* TITLE + STATUS BADGE */}
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <h2 className="text-lg font-bold text-slate-900 flex-1 leading-snug">
                      {assessment.title}
                    </h2>
                    {/* CHANGE 1: removed ⚠ from Missed badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${statusBadge[status] || "bg-slate-200 text-slate-600"}`}>
                      {status}
                    </span>
                  </div>

                  {/* DETAILS */}
                  <div className="mb-4 space-y-2 text-sm flex-1">
                    <p className="text-slate-700 font-medium text-xs">
                      {assessment.subjectName} • {assessment.subjectCode} • {assessment.duration} mins
                    </p>

                    <div>
                      <p className="text-slate-500 text-xs">Exam Date</p>
                      <p className="font-medium text-slate-800 text-xs">
                        {new Date(assessment.examDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500 text-xs">Window</p>
                      <p className="font-medium text-slate-800 text-xs">
                        {new Date(assessment.availableFrom).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{" "}
                        {new Date(assessment.availableFrom).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                        {" – "}
                        {new Date(assessment.availableTo).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{" "}
                        {new Date(assessment.availableTo).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                      </p>
                    </div>

                    {/* START / SUBMIT TIMES */}
                    {sub?.startedAt && (
                      <div>
                        <p className="text-slate-500 text-xs">Started</p>
                        <p className="font-medium text-slate-800 text-xs">{fmt(sub.startedAt)}</p>
                      </div>
                    )}
                    {sub?.submittedAt && (
                      <div>
                        <p className="text-slate-500 text-xs">Submitted</p>
                        <p className="font-medium text-slate-800 text-xs">{fmt(sub.submittedAt)}</p>
                      </div>
                    )}

                    {/* SCORE BADGE */}
                    {isFinalized && sub?.finalMarks != null && (
                      <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                        <span className="text-blue-800 font-bold text-sm">Score: {sub.finalMarks}</span>
                        {sub.revaluationRequested && (
                          <span className="text-xs text-amber-600 font-semibold">· Revaluation pending</span>
                        )}
                      </div>
                    )}

                    {/* CHANGE 2: removed the red "You did not submit within..." notice box */}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="space-y-2 mt-auto">
                    {isSubmitted ? (
                      <>
                        {/* VIEW SUBMISSION */}
                        <button
                          onClick={() => router.push(`/student/view-submission/${sub.submissionId}`)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-semibold transition text-sm border border-slate-200">
                          View Submission
                        </button>

                        {/* VIEW RESULT */}
                        {isFinalized && (
                          <button
                            onClick={() => router.push(`/student/result/${sub.submissionId}`)}
                            className="w-full bg-blue-800 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition text-sm">
                            View Result
                          </button>
                        )}

                        {/* AWAITING EVALUATION */}
                        {!isFinalized && (
                          <div className="w-full text-center text-xs text-slate-500 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                            Awaiting faculty evaluation
                          </div>
                        )}

                        {/* REVALUATION */}
                        {isFinalized && !sub.revaluationRequested && (
                          <button
                            onClick={() => setRevalModal({ assessmentTitle: assessment.title, submissionId: sub.submissionId })}
                            className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 py-2 rounded-xl font-semibold transition text-sm">
                            Request Revaluation
                          </button>
                        )}

                        {/* REVALUATION ALREADY REQUESTED */}
                        {isFinalized && sub.revaluationRequested && (
                          <div className="w-full text-center text-xs text-amber-700 font-semibold py-2 bg-amber-50 border border-amber-200 rounded-xl">
                            🔄 Revaluation requested — pending faculty review
                          </div>
                        )}
                      </>
                    ) : isMissed ? (
                      // CHANGE 3: removed "Assessment window closed" button — nothing shown for missed
                      null
                    ) : (
                      <button
                        onClick={() => router.push(`/student/assessment/${assessment._id}`)}
                        disabled={status === "Upcoming"}
                        className={`w-full py-2.5 rounded-xl font-semibold transition text-sm ${
                          status === "Upcoming"
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-slate-900 hover:bg-slate-700 text-white"
                        }`}>
                        {status === "Upcoming" ? "Not Yet Open" : "Open Assessment"}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10 text-slate-500">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}
              className="text-xl hover:text-slate-900 disabled:opacity-30">‹</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)}
                className={`text-lg transition ${
                  currentPage === i + 1
                    ? "text-slate-900 font-semibold underline underline-offset-4"
                    : "text-slate-400 hover:text-slate-700"
                }`}>
                {i + 1}
              </button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}
              className="text-xl hover:text-slate-900 disabled:opacity-30">›</button>
          </div>
        )}
      </div>

      {/* REVALUATION MODAL */}
      {revalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => { setRevalModal(null); setRevalReason(""); }}>
          <div className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Request Revaluation</h2>
            <p className="text-slate-500 text-sm mb-5">
              <span className="font-medium text-slate-700">{revalModal.assessmentTitle}</span> — describe what you think needs review.
            </p>
            <textarea
              value={revalReason}
              onChange={(e) => setRevalReason(e.target.value)}
              placeholder="E.g. My answer for Q2 explains the concept correctly but was marked contradicting — I believe it should be partial or matched."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-blue-400 placeholder-slate-400"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRevalModal(null); setRevalReason(""); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition border border-slate-200">
                Cancel
              </button>
              <button onClick={submitRevaluation}
                disabled={!revalReason.trim() || revalLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50">
                {revalLoading ? "Sending…" : "Submit Request"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Faculty will be notified and will re-review your submission.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}