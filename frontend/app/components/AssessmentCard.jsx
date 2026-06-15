"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-a47a.up.railway.app";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AssessmentCard({
  assessment,
  fetchAssessments,
  fetchSubmissions,
  setTitle,
  setQuestions,
  setEditingAssessmentId,
  setActiveSection,
  setSelectedAssessmentId,
  setSubjectCode,
  setSubjectName,
  setExamDate,
  setDuration,
  setInstructions,
  setSelectedDepartments,
  setSelectedYears,
  setAvailableFrom,
  setAvailableTo
}) {

  const router = useRouter();

  // Determine status: Published but past availableTo = Live Expired
  const now = new Date();
  const availableTo = assessment.availableTo ? new Date(assessment.availableTo) : null;
  const isPublished = assessment.status === "Published";
  const isExpired = isPublished && availableTo && now > availableTo;

  const statusLabel = isExpired ? "Live Expired" : assessment.status;
  const statusColors = isExpired
    ? "bg-red-100 text-red-700"
    : isPublished
      ? "bg-green-100 text-green-700"
      : "bg-amber-100 text-amber-700";
  const dotColors = isExpired ? "bg-red-500" : isPublished ? "bg-green-500" : "bg-amber-500";

  // LOAD DRAFT FOR EDITING
  const continueEditing = () => {
    if (assessment.status === "Published") {
      toast.error("Published assessments cannot be edited");
      return;
    }
    setTitle(assessment.title || "");
    setQuestions(assessment.questions || []);
    setEditingAssessmentId(assessment._id);
    if (setSubjectCode) setSubjectCode(assessment.subjectCode || "");
    if (setSubjectName) setSubjectName(assessment.subjectName || "");
    if (setExamDate) setExamDate(assessment.examDate || "");
    if (setDuration) setDuration(assessment.duration || "");
    if (setInstructions) setInstructions(assessment.instructions || "");
    if (setAvailableFrom) setAvailableFrom(assessment.availableFrom || "");
    if (setAvailableTo) setAvailableTo(assessment.availableTo || "");
    if (setSelectedDepartments) {
      const depts = (assessment.departments || []).map(d => ({ value: d, label: d }));
      setSelectedDepartments(depts);
    }
    if (setSelectedYears) {
      const yrs = (assessment.years || []).map(y => ({ value: y, label: y }));
      setSelectedYears(yrs);
    }
    setActiveSection("Create Assessment");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Draft loaded successfully");
  };

  // DUPLICATE PUBLISHED ASSESSMENT
  const duplicateAssessment = () => {
    setTitle(`${assessment.title} - Copy`);
    setQuestions(JSON.parse(JSON.stringify(assessment.questions || [])));
    if (setSubjectCode) setSubjectCode(assessment.subjectCode || "");
    if (setSubjectName) setSubjectName(assessment.subjectName || "");
    if (setExamDate) setExamDate(assessment.examDate || "");
    if (setDuration) setDuration(assessment.duration || "");
    if (setInstructions) setInstructions(assessment.instructions || "");
    if (setAvailableFrom) setAvailableFrom(assessment.availableFrom || "");
    if (setAvailableTo) setAvailableTo(assessment.availableTo || "");
    if (setSelectedDepartments) {
      const depts = (assessment.departments || []).map(d => ({ value: d, label: d }));
      setSelectedDepartments(depts);
    }
    if (setSelectedYears) {
      const yrs = (assessment.years || []).map(y => ({ value: y, label: y }));
      setSelectedYears(yrs);
    }
    setEditingAssessmentId(null);
    setActiveSection("Create Assessment");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Assessment duplicated successfully");
  };

  // DELETE ASSESSMENT
  const deleteAssessment = async () => {
    const confirmDelete = confirm("Delete this assessment?");
    if (!confirmDelete) return;
    try {
      const response = await fetch(`${API_URL}/assessment/delete/${assessment._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      toast.success("Assessment deleted");
      fetchAssessments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="bg-white rounded-[30px] border border-slate-200 p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-6">

      {/* HEADER */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold ${statusColors}`}>
            <span className={`w-2 h-2 rounded-full ${dotColors}`} />
            {statusLabel}
          </span>
        </div>

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-slate-900 leading-snug mb-4">
          {assessment.title}
        </h2>

        {/* METADATA */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <p className="text-slate-500">Questions</p>
            <p className="font-bold text-slate-800">{assessment.questions?.length ?? 0}</p>
          </div>
          {assessment.subjectCode && (
            <div className="flex justify-between items-center text-sm">
              <p className="text-slate-500">Subject Code</p>
              <p className="font-semibold text-slate-800">{assessment.subjectCode}</p>
            </div>
          )}
          {assessment.subjectName && (
            <div className="flex justify-between items-center text-sm">
              <p className="text-slate-500">Subject</p>
              <p className="font-semibold text-slate-800 text-right max-w-[55%] truncate">{assessment.subjectName}</p>
            </div>
          )}
          {assessment.examDate && (
            <div className="flex justify-between items-center text-sm">
              <p className="text-slate-500">Exam Date</p>
              <p className="font-semibold text-slate-800">{new Date(assessment.examDate).toLocaleDateString("en-GB")}</p>
            </div>
          )}
          {assessment.duration && (
            <div className="flex justify-between items-center text-sm">
              <p className="text-slate-500">Duration</p>
              <p className="font-semibold text-slate-800">{assessment.duration}</p>
            </div>
          )}
          {assessment.departments?.length > 0 && (
            <div className="flex justify-between items-center text-sm">
              <p className="text-slate-500">Department</p>
              <p className="font-semibold text-slate-800">{assessment.departments.join(", ")}</p>
            </div>
          )}
          {assessment.years?.length > 0 && (
            <div className="flex justify-between items-center text-sm">
              <p className="text-slate-500">Year</p>
              <p className="font-semibold text-slate-800">{assessment.years.join(", ")}</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
        {!isPublished && (
          <button onClick={continueEditing} className="w-full bg-slate-900 hover:bg-slate-700 transition text-white py-3.5 rounded-xl font-semibold text-sm">
            Continue Editing
          </button>
        )}
        {isPublished && (
          <>
            <button onClick={duplicateAssessment} className="w-full bg-slate-900 hover:bg-slate-700 transition text-white py-3.5 rounded-xl font-semibold text-sm">
              Duplicate Assessment
            </button>
            <button
              onClick={() => {
                setSelectedAssessmentId(assessment._id);
                fetchSubmissions(assessment._id);
                setActiveSection("Submissions");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm transition"
            >
              View Submissions
            </button>
          </>
        )}
        <button onClick={deleteAssessment} className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-3.5 rounded-xl font-semibold text-sm transition">
          Delete
        </button>
      </div>

    </div>
  );
}
