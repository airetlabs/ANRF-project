"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {

  const router = useRouter();

  const [assessments, setAssessments] = useState([]);
  const [submittedIds, setSubmittedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentEmail, setStudentEmail] = useState("");

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

      const assessmentResponse = await fetch(
        `https://anrf-project-production.up.railway.app/assessment/student/${department}/${year}`
      );
      const assessmentData = await assessmentResponse.json();

      const sorted = [...assessmentData].sort((a, b) => {
        if (a._id < b._id) return 1;
        if (a._id > b._id) return -1;
        return 0;
      });

      setAssessments(sorted);

      const submissionResponse = await fetch(
        `https://anrf-project-production.up.railway.app/submission/student/${email}`
      );
      const submissionData = await submissionResponse.json();
      const submittedAssessmentIds = submissionData.map(
        (submission) => submission.assessment_id
      );
      setSubmittedIds(submittedAssessmentIds);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AcadAIsist</h1>
          <p className="text-slate-500 text-sm mt-1">Student Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-3">
            <p className="text-sm font-semibold text-slate-800">Student</p>
            <p className="text-xs text-slate-500">{studentEmail}</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-50 hover:bg-red-100 border border-red-200 transition text-red-600 px-4 py-2 rounded-xl font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-10 py-10">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-[30px] p-8 border border-slate-200 shadow-sm mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">My Profile</h2>
          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <p className="text-slate-500 text-sm mb-1">Register Number</p>
              <p className="text-xl font-bold text-slate-900">{studentInfo.registerNumber}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <p className="text-slate-500 text-sm mb-1">Department</p>
              <p className="text-xl font-bold text-slate-900">{studentInfo.department}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <p className="text-slate-500 text-sm mb-1">Year</p>
              <p className="text-xl font-bold text-slate-900">Year {studentInfo.year}</p>
            </div>

          </div>
        </div>

        {/* ASSESSMENTS */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-3">Available Assessments</h2>
          <p className="text-slate-500 text-lg">Assessments assigned to your department and year</p>
        </div>

        {assessments.length === 0 ? (

          <div className="bg-white rounded-[30px] p-10 border border-slate-200 shadow-sm text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Assessments Available</h2>
            <p className="text-slate-500">Check back later for new assessments from your faculty.</p>
          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {assessments.map((assessment) => {

              const isSubmitted = submittedIds.includes(assessment._id);

              return (
                <div
                  key={assessment._id}
                  className="bg-white rounded-[30px] p-8 border border-slate-200 shadow-sm hover:shadow-md transition"
                >

                  {/* TITLE + STATUS */}
                  <div className="flex justify-between items-start mb-5">
                    <h2 className="text-xl font-bold text-slate-900 flex-1 pr-3">
                      {assessment.title}
                    </h2>
                    {isSubmitted ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        Submitted
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        Available
                      </span>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="space-y-2 mb-6 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-700">Subject:</span> {assessment.subjectName}</p>
                    <p><span className="font-semibold text-slate-700">Subject Code:</span> {assessment.subjectCode}</p>
                    <p><span className="font-semibold text-slate-700">Duration:</span> {assessment.duration} mins</p>
                    <p><span className="font-semibold text-slate-700">Exam Date:</span> {new Date(assessment.examDate).toLocaleDateString("en-GB")}</p>
                    <p><span className="font-semibold text-slate-700">Available From:</span> {new Date(assessment.availableFrom).toLocaleString("en-GB")}</p>
                    <p><span className="font-semibold text-slate-700">Available To:</span> {new Date(assessment.availableTo).toLocaleString("en-GB")}</p>
                  </div>

                  {/* BUTTON */}
                  {isSubmitted ? (
                    <button
                      disabled
                      className="w-full bg-green-600 text-white py-3 rounded-2xl font-semibold cursor-not-allowed opacity-80"
                    >
                      ✓ Submitted
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/student/assessment/${assessment._id}`)}
                      className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 rounded-2xl font-semibold transition"
                    >
                      Open Assessment
                    </button>
                  )}

                </div>
              );
            })}
          </div>

        )}
      </div>
    </div>
  );
}