"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar({
  saveAssessment,
  publishAssessment,
  showPreview,
  setShowPreview,
  createNewAssessment,
  saving,
  activeSection
}) {

  const router = useRouter();
  const [facultyEmail, setFacultyEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) setFacultyEmail(email);
  }, []);

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("department");
    localStorage.removeItem("year");
    localStorage.removeItem("registerNumber");
    router.push("/login");
  };

  const isCreatePage = activeSection === "Create Assessment";

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between">

      {/* LEFT */}
      <div>
<<<<<<< HEAD
        <h1 className="text-2xl font-bold text-slate-900">
          AcadAIsist
        </h1>
=======
        <h1 className="text-2xl font-bold text-slate-900">acadAIsist</h1>
>>>>>>> origin/madhu-work-v2
        <p className="text-slate-500 text-sm mt-1">
          A Small Language Model Based Lightweight and Accessible Evaluation Tool for Reducing Faculty Workload Without Compromising Academic Rigour
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        <div className="hidden md:flex flex-col items-end mr-3">
          <p className="text-sm font-semibold text-slate-800">Faculty Logged In</p>
          <p className="text-xs text-slate-500">{facultyEmail}</p>
        </div>

        <button
          onClick={createNewAssessment}
          className="bg-slate-200 hover:bg-slate-300 transition text-slate-800 px-5 py-2 rounded-xl font-semibold text-sm"
        >
          New
        </button>

        {isCreatePage && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="bg-slate-200 hover:bg-slate-300 transition text-slate-800 px-5 py-2 rounded-xl font-semibold text-sm"
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
        )}

        {isCreatePage && (
          <button
            onClick={saveAssessment}
            disabled={saving}
            className="bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-sm"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
        )}

        {isCreatePage && (
          <button
            onClick={publishAssessment}
            disabled={saving}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-sm"
          >
            Publish
          </button>
        )}

        <button
          onClick={logoutUser}
          className="bg-red-50 hover:bg-red-100 border border-red-200 transition text-red-600 px-4 py-2 rounded-xl font-medium text-sm"
        >
          Logout
        </button>

      </div>
    </div>
  );
}
