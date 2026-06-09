"use client";

export default function RecentActivity({ savedAssessments, setActiveSection }) {

  const recentAssessments = [...savedAssessments]
    .sort((a, b) => {
      if (a._id < b._id) return 1;
      if (a._id > b._id) return -1;
      return 0;
    })
    .slice(0, 5);

  const handleClick = (assessment) => {
    if (assessment.status === "Draft") {
      setActiveSection("Drafts");
    } else {
      setActiveSection("Published");
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
            className="flex items-center justify-between border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-slate-400 hover:shadow-md transition"
          >
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{assessment.title}</h3>
              <p className="text-slate-500 text-sm mt-1">{assessment.questions.length} Questions</p>
            </div>
            <div>
              <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                assessment.status === "Published"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {assessment.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
