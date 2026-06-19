"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";

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
        `${API_URL}/assessment/student/${department}/${year}`
      );
      const assessmentData = await assessmentResponse.json();

      const sorted = [...assessmentData].sort((a, b) => {
        if (a._id < b._id) return 1;
        if (a._id > b._id) return -1;
        return 0;
      });

      setAssessments(sorted);

      const submissionResponse = await fetch(
        `${API_URL}/submission/student/${email}`
      );
      const submissionData = await submissionResponse.json();



      const submittedAssessmentIds = submissionData.map(
        (submission) => submission.assessment_id
      );

      setSubmittedIds(submittedAssessmentIds);

      const map = {};

      submissionData.forEach((submission) => {
        map[submission.assessment_id] = {
          submissionId: submission._id,
          status: submission.status,
          finalMarks: submission.final_marks
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

  const filteredAssessments = assessments.filter((assessment) => {
    const isSubmitted = submittedIds.includes(assessment._id);

    const now = new Date();
    const start = new Date(assessment.availableFrom);
    const end = new Date(assessment.availableTo);

    let status = "Live";

    if (now < start) status = "Upcoming";
    else if (now > end) status = "Expired";

    if (isSubmitted) status = "Submitted";

    if (activeTab === "All") return true;

    return status === activeTab;
  });

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
        <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">My Profile</h2>
          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <p className="text-blue-600 text-sm mb-1 font-medium">
                Register Number
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {studentInfo.registerNumber}
              </p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
              <p className="text-yellow-600 text-sm mb-1 font-medium">
                Department
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {studentInfo.department}
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
              <p className="text-purple-600 text-sm mb-1 font-medium">
                Year
              </p>
              <p className="text-lg font-semibold text-slate-900">
                Year {studentInfo.year}
              </p>
            </div>
          </div>
        </div>



        {/* ASSESSMENTS */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-3">Available Assessments</h2>
          <p className="text-slate-500 text-lg">Assessments assigned to your department and year</p>
          <div className="flex flex-wrap gap-3 mt-5">
            {["All", "Live", "Upcoming", "Submitted", "Expired"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                {tab} (
                {
                  tab === "All"
                    ? assessments.length
                    : assessments.filter((assessment) => {
                      const isSubmitted = submittedIds.includes(assessment._id);

                      const now = new Date();
                      const start = new Date(assessment.availableFrom);
                      const end = new Date(assessment.availableTo);

                      let status = "Live";

                      if (now < start) status = "Upcoming";
                      else if (now > end) status = "Expired";

                      if (isSubmitted) status = "Submitted";

                      return status === tab;
                    }).length
                }
                )
              </button>
            ))}
          </div>
        </div>

        {filteredAssessments.length === 0 ? (

          <div className="bg-white rounded-[30px] p-10 border border-slate-200 shadow-sm text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Assessments Available</h2>
            <p className="text-slate-500">Check back later for new assessments from your faculty.</p>
          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment) => {

              const isSubmitted = submittedIds.includes(assessment._id);
              const submissionInfo = submissionMap[assessment._id];

              const now = new Date();
              const start = new Date(assessment.availableFrom);
              const end = new Date(assessment.availableTo);

              let assessmentStatus = "Live";

              if (now < start) {
                assessmentStatus = "Upcoming";
              } else if (now > end) {
                assessmentStatus = "Expired";
              }

              return (
                <div
                  key={assessment._id}
                  className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm hover:shadow-md transition"
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
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap text-white ${assessmentStatus === "Live"
                          ? "bg-green-600"
                          : assessmentStatus === "Upcoming"
                            ? "bg-yellow-500"
                            : "bg-red-600"
                          }`}
                      >
                        {assessmentStatus}
                      </span>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="mb-6">

                    <div className="text-sm text-slate-700 font-medium mb-4">
                      {assessment.subjectName} • {assessment.subjectCode} • {assessment.duration} mins
                    </div>

                    <div className="space-y-3 text-sm">

                      <div>
                        <p className="text-slate-500">Exam Date</p>
                        <p className="font-medium text-slate-800">
                          {new Date(assessment.examDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Window</p>
                        <p className="font-medium text-slate-800">
                          {new Date(assessment.availableFrom).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          {new Date(assessment.availableFrom).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                          {" - "}
                          {new Date(assessment.availableTo).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          {new Date(assessment.availableTo).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* BUTTON */}
                  {isSubmitted ? (

                    submissionInfo?.status === "Finalized" ? (

                      <button
                        onClick={() =>
                          router.push(
                            `/student/result/${submissionInfo.submissionId}`
                          )
                        }
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold transition"
                      >
                        View Result
                      </button>

                    ) : (

                      <button
                        disabled
                        className="w-full bg-green-600 text-white py-3 rounded-2xl font-semibold cursor-not-allowed opacity-80"
                      >
                        ✓ Submitted
                      </button>

                    )

                  ) : (
                    <button

                      onClick={() => router.push(`/student/assessment/${assessment._id}`)}
                      disabled={assessmentStatus === "Expired"}
                      className={`w-full py-3 rounded-2xl font-semibold transition ${assessmentStatus === "Expired"
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-slate-900 hover:bg-slate-700 text-white"
                        }`}
                    >
                      {assessmentStatus === "Expired"
                        ? "Assessment Expired"
                        : "Open Assessment"}
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
