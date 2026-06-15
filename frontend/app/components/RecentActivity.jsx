"use client";

export default function RecentActivity({
  savedAssessments,
  setActiveSection,
  setTitle,
  setQuestions,
  setEditingAssessmentId,
  setSelectedAssessment,
  setSubjectCode,
  setSubjectName,
  setExamDate,
  setDuration,
  setInstructions,
  setSelectedDepartments,
  setSelectedYears,
  setAvailableFrom,
  setAvailableTo,
}) {

  const recentAssessments = [...savedAssessments]
    .sort((a, b) => {
      if (a._id < b._id) return 1;
      if (a._id > b._id) return -1;
      return 0;
    })
    .slice(0, 5);

  const handleClick = (assessment) => {
    if (assessment.status === "Published") {
      setActiveSection("Published");
    } else {
      // Load all fields into editor
      setTitle(assessment.title || "");
      setQuestions(
        assessment.questions && assessment.questions.length > 0
          ? assessment.questions
          : [{ question: "", answer_key: "", rubric: "", marks: 5, word_limit: 100 }]
      );
      setEditingAssessmentId(assessment._id);
      if (setSelectedAssessment) setSelectedAssessment(assessment);

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
    }
  };

  return (
    <div className="bg-white rounded-[30px] border border-slate-200 p-8 shadow-sm">

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Recent Activity</h2>
        <p className="text-slate-500 mt-2">Latest assessment updates</p>
      </div>

      <div className="space-y-5">

        {recentAssessments.length === 0 && (
          <div className="text-slate-500">No recent activity</div>
        )}

        {recentAssessments.map((assessment, index) => (
          <div
            key={index}
            onClick={() => handleClick(assessment)}
            className="flex items-center justify-between border border-slate-200 rounded-2xl p-5 cursor-pointer hover:bg-slate-50 transition"
          >
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{assessment.title}</h3>
              <p className="text-slate-500 text-sm mt-1">{assessment.questions.length} Questions</p>
            </div>
            <div>
              <span className={`px-4 py-2 rounded-xl text-sm font-semibold
                ${assessment.status === "Published"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"}`}
              >
                {assessment.status}
              </span>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
