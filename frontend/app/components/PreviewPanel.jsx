"use client";

export default function PreviewPanel({
  title,
  subjectCode,
  subjectName,
  examDate,
  duration,

  department,
  year,

  availableFrom,
  availableTo,

  instructions,
  questions
}) {

  return (

    <div className="bg-white rounded-[30px] border border-slate-200 p-10 shadow-sm">

      {/* HEADER */}
      <div className="mb-10 border-b border-slate-200 pb-6">

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          {title || "Untitled Assessment"}
        </h1>

        <p className="text-slate-500 text-lg">
          Student Assessment Preview
        </p>

      </div>


      {/* EXAM DETAILS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <p>
            <span className="font-semibold">
              Subject Code:
            </span>{" "}
            {subjectCode || "-"}
          </p>

          <p>
            <span className="font-semibold">
              Subject Name:
            </span>{" "}
            {subjectName || "-"}
          </p>

          <p>
            <span className="font-semibold">
              Examination Date:
            </span>{" "}
            {examDate || "-"}
          </p>

          <p>
            <span className="font-semibold">
              Duration:
            </span>{" "}
            {duration || "-"}
          </p>

          <p>
            <span className="font-semibold">
              Department:
            </span>{" "}
            {department || "-"}
          </p>

          <p>
            <span className="font-semibold">
              Year:
            </span>{" "}
            {year || "-"}
          </p>

          <p>
            <span className="font-semibold">
              Available From:
            </span>{" "}
            {availableFrom || "-"}
          </p>

          <p>
            <span className="font-semibold">
              Available To:
            </span>{" "}
            {availableTo || "-"}
          </p>

        </div>

      </div>


      {/* INSTRUCTIONS */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-10">

        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Instructions
        </h2>

        <p className="text-slate-700 whitespace-pre-line">
          {instructions || "No instructions provided."}
        </p>

      </div>


      {/* QUESTIONS — Answer Key, Rubric, Expected Length intentionally hidden */}
      <div className="space-y-8">

        {questions.filter(q => q.question && q.question.trim()).map((q, index) => (

          <div
            key={index}
            className="border border-slate-200 rounded-2xl p-7 bg-slate-50"
          >

            {/* QUESTION */}
            <div className="mb-6">

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-2xl font-bold text-slate-900">
                  Question {index + 1}
                </h2>

                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
  {q.marks > 0 ? q.marks : 0} Marks
</div>

              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">

                <p className="text-slate-800 text-lg leading-relaxed">
                  {q.question || "No question added"}
                </p>

              </div>

            </div>


           {/* STUDENT ANSWER BOX */}
<div>

  <label className="block text-lg font-semibold text-slate-700 mb-3">
    Your Answer
  </label>

  <textarea
    rows={6}
    placeholder="Write your answer here..."
    className="w-full border border-slate-300 rounded-2xl p-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
  />

  {q.expected_length && (
    <p className="text-sm text-slate-500 mt-2">
      Expected length: {q.expected_length}
    </p>
  )}

</div>

          </div>

        ))}

      </div>

    </div>
  );
}