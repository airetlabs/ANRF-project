
"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import AssessmentCard from "../../components/AssessmentCard";
import PreviewPanel from "../../components/PreviewPanel";
import AnalyticsChart from "../../components/AnalyticsChart";
import RecentActivity from "../../components/RecentActivity";
import Select from "react-select";

export default function Home() {

  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [title, setTitle] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [savedAssessments, setSavedAssessments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAssessmentId, setEditingAssessmentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);

  const [questions, setQuestions] = useState([
    {
      question_id: "",
      question: "",
      answer_key: "",
      rubric: "",
      marks: "",
      expected_length: ""
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogIndex, setDialogIndex] = useState(null);
  const [dialogData, setDialogData] = useState({
    question: "", answer_key: "", rubric: "", marks: "", expected_length: ""
  });

  const [submissionDetails, setSubmissionDetails] = useState([]);
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);


  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (activeSection === "Create Assessment" && title.trim()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeSection, title]);


  const handleSectionChange = (newSection) => {
    if (activeSection === "Create Assessment" && newSection !== "Create Assessment") {
      const hasData = title.trim() || questions.some((q) => q.question?.trim());
      if (hasData) {
        const choice = window.confirm("You have unsaved changes. Leave without saving?");
        if (!choice) return;
        resetFields();
        localStorage.removeItem("assessmentDraft");
      }
    }
    setActiveSection(newSection);
  };


  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "faculty") {
      router.push("/login");
    } else {
      setCheckingAuth(false);
    }
  }, []);


  useEffect(() => {
    const savedDraft = localStorage.getItem("assessmentDraft");
    if (savedDraft) {
      const parsedDraft = JSON.parse(savedDraft);
      if (!parsedDraft.title && (!parsedDraft.questions || !parsedDraft.questions[0]?.question)) {
        return;
      }
      setTitle(parsedDraft.title || "");
      setSubjectCode(parsedDraft.subjectCode || "");
      setSubjectName(parsedDraft.subjectName || "");
      setExamDate(parsedDraft.examDate || "");
      setDuration(parsedDraft.duration || "");
      setInstructions(parsedDraft.instructions || "");
      setAvailableFrom(parsedDraft.availableFrom || "");
      setAvailableTo(parsedDraft.availableTo || "");
      setQuestions(
        parsedDraft.questions || [
          { question_id: "", question: "", answer_key: "", rubric: "", marks: "", expected_length: "" }
        ]
      );
      if (parsedDraft.selectedDepartments) setSelectedDepartments(parsedDraft.selectedDepartments);
      if (parsedDraft.selectedYears) setSelectedYears(parsedDraft.selectedYears);
    }
  }, []);


  useEffect(() => {
    const hasContent = title.trim() || questions.some((q) => q.question?.trim());
    if (!hasContent) return;
    localStorage.setItem(
      "assessmentDraft",
      JSON.stringify({
        title, subjectCode, subjectName, examDate, duration, instructions,
        availableFrom, availableTo, questions, selectedDepartments, selectedYears
      })
    );
  }, [title, subjectCode, subjectName, examDate, duration, instructions, availableFrom, availableTo, questions, selectedDepartments, selectedYears]);


  useEffect(() => {
    fetchAssessments();
  }, []);


  useEffect(() => {
    const handler = (event) => { fetchSubmissions(event.detail); };
    window.addEventListener("loadSubmissions", handler);
    return () => window.removeEventListener("loadSubmissions", handler);
  }, []);


  useEffect(() => {
    if (activeSection === "Submissions" && selectedAssessmentId) {
      fetchSubmissions(selectedAssessmentId);
    }
  }, [activeSection]);


  useEffect(() => {
    const openSubmissions = localStorage.getItem("openSubmissions");
    const savedAssessmentId = localStorage.getItem("selectedAssessmentId");
    if (openSubmissions === "true" && savedAssessmentId) {
      setActiveSection("Submissions");
      setSelectedAssessmentId(savedAssessmentId);
      fetchSubmissions(savedAssessmentId);
      localStorage.removeItem("openSubmissions");
    }
    const handler = (event) => { fetchSubmissions(event.detail); };
    window.addEventListener("loadSubmissions", handler);
    return () => window.removeEventListener("loadSubmissions", handler);
  }, []);


  const fetchAssessments = async () => {
    try {
      const facultyEmail = localStorage.getItem("userEmail");
      const response = await fetch(`${API_URL}/assessment/all/${facultyEmail}`);
      const data = await response.json();
      const sorted = [...data].sort((a, b) => (a._id < b._id ? 1 : -1));
      setSavedAssessments(sorted);
    } catch (error) {
      console.error(error);
    }
  };


  const fetchSubmissions = async (assessmentId) => {
    try {
      setLoadingSubmissions(true);
      const response = await fetch(`${API_URL}/submission/assessment/${assessmentId}`);
      const data = await response.json();
      setAssessmentSubmissions(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  };


  const evaluateSubmission = async (submissionId) => {
    setEvaluatingSubmission(submissionId);
    try {
      const response = await fetch(
        `${API_URL}/submission/evaluate/${submissionId}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Evaluation failed");
      alert("Evaluation Completed");
      fetchSubmissions(selectedAssessmentId);
    } catch (error) {
      console.error(error);
      alert("Evaluation Failed");
    } finally {
      setEvaluatingSubmission(null);
    }
  };


  const viewSubmission = async (submissionId) => {
    try {
      const response = await fetch(`${API_URL}/submission/view/${submissionId}`);
      const data = await response.json();
      setSubmissionDetails(data);
      setShowSubmissionDetails(true);
    } catch (error) {
      console.error(error);
      alert("Failed to load submission");
    } finally {
      setEvaluatingSubmission(null);
    }
  };


  const resetFields = () => {
    setTitle(""); setSubjectCode(""); setSubjectName(""); setExamDate("");
    setDuration(""); setInstructions(""); setSelectedDepartments([]);
    setSelectedYears([]); setAvailableFrom(""); setAvailableTo("");
    setQuestions([{ question_id: "", question: "", answer_key: "", rubric: "", marks: "", expected_length: "" }]);
    setEditingAssessmentId(null);
  };


  const createNewAssessment = () => {
    const hasData = title.trim() || questions.some((q) => q.question?.trim());
    if (hasData) {
      const choice = window.confirm("You have unsaved changes. Leave without saving?");
      if (!choice) return;
    }
    resetFields();
    localStorage.removeItem("assessmentDraft");
    setActiveSection("Create Assessment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const addQuestionCard = (index) => {
    const newQuestion = { question_id: "", question: "", answer_key: "", rubric: "", marks: "", expected_length: "" };
    const updated = [...questions];
    updated.splice(index + 1, 0, newQuestion);
    setQuestions(updated);
  };


  const deleteQuestion = (index) => {
    if (questions.length === 1) {
      toast.error("At least one question is required");
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };


  const openDialog = (index) => {
    setDialogIndex(index);
    setDialogData({ ...questions[index] });
    setDialogOpen(true);
  };


  const saveDialog = () => {
    const q = dialogData;
    const qNum = dialogIndex + 1;
    if (!q.question.trim()) { toast.error(`Fill question text for Q${qNum}`); return; }
    if (!q.answer_key.trim()) { toast.error(`Fill answer key for Q${qNum}`); return; }
    if (!q.rubric.trim()) { toast.error(`Fill rubric for Q${qNum}`); return; }
    if (!q.marks) { toast.error(`Fill marks for Q${qNum}`); return; }
    const marksVal = parseInt(q.marks);
    if (isNaN(marksVal) || marksVal < 1 || marksVal > 100) {
      toast.error(`Marks must be between 1 and 100 for Q${qNum}`); return;
    }
    if (!q.expected_length.trim()) { toast.error(`Fill word limit for Q${qNum}`); return; }
    const updated = [...questions];
    updated[dialogIndex] = { ...updated[dialogIndex], ...q };
    setQuestions(updated);
    setDialogOpen(false);
    toast.success(`Q${qNum} saved`);
  };


  const buildPayload = (status) => ({
    title, subjectCode, subjectName, examDate, duration, instructions,
    departments: selectedDepartments.map((d) => d.value),
    years: selectedYears.map((y) => y.value),
    availableFrom, availableTo,
    questions: questions.map((q, i) => ({ ...q, question_id: q.question_id || i + 1 })),
    id: editingAssessmentId,
    status,
    faculty_email: localStorage.getItem("userEmail")
  });


  const validateFields = () => {
    if (!title.trim()) { toast.error("Fill assessment title"); return false; }
    if (!subjectCode.trim()) { toast.error("Fill subject code"); return false; }
    if (!subjectName.trim()) { toast.error("Fill subject name"); return false; }
    if (!examDate) { toast.error("Fill exam date"); return false; }
    if (!duration.trim()) { toast.error("Fill total time / duration"); return false; }
    if (selectedDepartments.length === 0) { toast.error("Select at least one department"); return false; }
    if (selectedYears.length === 0) { toast.error("Select at least one year"); return false; }
    if (!availableFrom) { toast.error("Fill available from date/time"); return false; }
    if (!availableTo) { toast.error("Fill available to date/time"); return false; }
    if (questions.length === 0) { toast.error("Add at least one question"); return false; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qNum = i + 1;
      if (!q.question.trim()) { toast.error(`Fill question text for Q${qNum}`); return false; }
      if (!q.answer_key.trim()) { toast.error(`Fill answer key for Q${qNum}`); return false; }
      if (!q.rubric.trim()) { toast.error(`Fill rubric for Q${qNum}`); return false; }
      if (!q.marks) { toast.error(`Fill marks for Q${qNum}`); return false; }
      const marksVal = parseInt(q.marks);
      if (isNaN(marksVal) || marksVal < 1 || marksVal > 100) {
        toast.error(`Marks must be between 1 and 100 for Q${qNum}`); return false;
      }
      if (!q.expected_length.trim()) { toast.error(`Fill word limit for Q${qNum}`); return false; }
    }
    return true;
  };


  const saveAssessment = async () => {
    if (!validateFields()) return;
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/assessment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("Draft"))
      });
      if (!response.ok) throw new Error("Failed to save");
      toast.success("Assessment saved as draft");
      resetFields();
      localStorage.removeItem("assessmentDraft");
      fetchAssessments();
      setActiveSection("Drafts");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };


  const publishAssessment = async () => {
    if (!validateFields()) return;
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/assessment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("Published"))
      });
      if (!response.ok) throw new Error();
      toast.success("Assessment published successfully");
      resetFields();
      localStorage.removeItem("assessmentDraft");
      fetchAssessments();
      setActiveSection("Published");
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish assessment");
    } finally {
      setSaving(false);
    }
  };


  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-900">Loading AcadAIsist</h2>
          <p className="text-slate-500 mt-2">Verifying authentication session...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-gray-900 flex">

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
      />

      <div className={`w-full transition-all duration-300 ${sidebarOpen ? "ml-[240px]" : "ml-[80px]"}`}>

        <Navbar
          saveAssessment={saveAssessment}
          publishAssessment={publishAssessment}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          createNewAssessment={createNewAssessment}
          saving={saving}
          activeSection={activeSection}
        />

        <div className="px-10 py-10">

          {/* DASHBOARD */}
          {activeSection === "Dashboard" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[30px] p-7 border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-sm mb-2">Total Assessments</p>
                  <h2 className="text-5xl font-bold text-slate-900">{savedAssessments.length}</h2>
                </div>
                <div className="bg-white rounded-[30px] p-7 border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-sm mb-2">Draft Assessments</p>
                  <h2 className="text-5xl font-bold text-slate-900">
                    {savedAssessments.filter((a) => a.status === "Draft").length}
                  </h2>
                </div>
                <div className="bg-white rounded-[30px] p-7 border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-sm mb-2">Published Assessments</p>
                  <h2 className="text-5xl font-bold text-slate-900">
                    {savedAssessments.filter((a) => a.status === "Published").length}
                  </h2>
                </div>
              </div>
              <div className="mt-10">
                <RecentActivity
                  savedAssessments={savedAssessments}
                  setActiveSection={setActiveSection}
                  setTitle={setTitle}
                  setQuestions={setQuestions}
                  setEditingAssessmentId={setEditingAssessmentId}
                  setSubjectCode={setSubjectCode}
                  setSubjectName={setSubjectName}
                  setExamDate={setExamDate}
                  setDuration={setDuration}
                  setInstructions={setInstructions}
                  setSelectedDepartments={setSelectedDepartments}
                  setSelectedYears={setSelectedYears}
                  setAvailableFrom={setAvailableFrom}
                  setAvailableTo={setAvailableTo}
                />
              </div>
            </div>
          )}


          {/* CREATE ASSESSMENT */}
          {activeSection === "Create Assessment" && (
            <div className="flex flex-col gap-6">

              <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm p-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-1">
                  {editingAssessmentId ? "Edit Assessment" : "Create Assessment"}
                </h2>
                <p className="text-slate-500 mb-8">Fill in the test details, then add questions below.</p>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Assessment Title</label>
                  <input
                    type="text"
                    placeholder="Enter assessment title"
                    className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Subject Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS301"
                      className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Subject Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Database Management Systems"
                      className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Department</label>
                    <Select
                      isMulti
                      options={[
                        { value: "CSE", label: "CSE" }, { value: "IT", label: "IT" },
                        { value: "AIDS", label: "AIDS" }, { value: "ECE", label: "ECE" },
                        { value: "EEE", label: "EEE" }, { value: "MECH", label: "MECH" },
                        { value: "CIVIL", label: "CIVIL" }
                      ]}
                      value={selectedDepartments}
                      onChange={setSelectedDepartments}
                      placeholder="Select Departments"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Year</label>
                    <Select
                      isMulti
                      options={[
                        { value: "1", label: "1" }, { value: "2", label: "2" },
                        { value: "3", label: "3" }, { value: "4", label: "4" }
                      ]}
                      value={selectedYears}
                      onChange={setSelectedYears}
                      placeholder="Select Years"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Date of Examination</label>
                    <input
                      type="date"
                      className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition text-slate-700"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Total Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 90 Minutes"
                      className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Available From</label>
                    <input
                      type="datetime-local"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Available To</label>
                    <input
                      type="datetime-local"
                      value={availableTo}
                      onChange={(e) => setAvailableTo(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Exam Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Enter exam instructions for students"
                    className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none text-slate-700"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Questions</h3>
                    <p className="text-slate-500 text-sm mt-1">Click a question to edit its details. Use + to insert after.</p>
                  </div>
                  <span className="text-sm text-slate-400 font-medium">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="space-y-2">
                  {questions.map((q, index) => {
                    const isFilled = q.question.trim() && q.answer_key.trim() && q.rubric.trim() && q.marks && q.expected_length.trim();
                    return (
                      <div key={index} className="flex items-center gap-3 group">
                        <button
                          onClick={() => openDialog(index)}
                          className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition hover:shadow-md ${
                            isFilled
                              ? "bg-slate-50 border-slate-200 hover:border-slate-400"
                              : "bg-amber-50 border-amber-200 hover:border-amber-400"
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isFilled ? "bg-slate-900 text-white" : "bg-amber-400 text-white"
                          }`}>
                            {index + 1}
                          </span>
                          <span className={`flex-1 text-sm truncate ${isFilled ? "text-slate-700" : "text-amber-700 italic"}`}>
                            {q.question.trim() ? q.question : "Click to fill question details..."}
                          </span>
                          {q.marks && (
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex-shrink-0">
                              {q.marks} marks
                            </span>
                          )}
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => addQuestionCard(index)}
                          title="Add question after this"
                          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 flex items-center justify-center transition font-bold text-lg flex-shrink-0"
                        >
                          +
                        </button>
                        <button
                          onClick={() => deleteQuestion(index)}
                          title="Delete this question"
                          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 flex items-center justify-center transition font-bold text-lg flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {showPreview && (
                <PreviewPanel
                  title={title}
                  subjectCode={subjectCode}
                  subjectName={subjectName}
                  examDate={examDate}
                  duration={duration}
                  department={selectedDepartments.map(d => d.value).join(", ") || "All Departments"}
                  year={selectedYears.map(y => y.value).join(", ") || "All Years"}
                  availableFrom={availableFrom}
                  availableTo={availableTo}
                  instructions={instructions}
                  questions={questions}
                />
              )}
            </div>
          )}


          {/* QUESTION DIALOG */}
          {dialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setDialogOpen(false)}
              />
              <div className="relative bg-white rounded-[30px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Question {dialogIndex + 1}</h3>
                    <p className="text-slate-500 text-sm mt-1">Fill all fields to complete this question</p>
                  </div>
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xl font-bold transition"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Question</label>
                  <textarea
                    rows={3}
                    placeholder="Enter the question"
                    className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none"
                    value={dialogData.question}
                    onChange={(e) => setDialogData({ ...dialogData, question: e.target.value })}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Answer Key</label>
                  <textarea
                    rows={3}
                    placeholder="Enter the model answer / answer key"
                    className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none"
                    value={dialogData.answer_key}
                    onChange={(e) => setDialogData({ ...dialogData, answer_key: e.target.value })}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Rubric</label>
                  <textarea
                    rows={3}
                    placeholder="Enter the grading rubric (e.g. 1 mark for definition, 1 mark for example)"
                    className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none"
                    value={dialogData.rubric}
                    onChange={(e) => setDialogData({ ...dialogData, rubric: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Marks</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="e.g. 5"
                      className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                      value={dialogData.marks}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (e.target.value === "") { setDialogData({ ...dialogData, marks: "" }); return; }
                        if (val < 1) { toast.error("Marks cannot be less than 1"); return; }
                        if (val > 100) { toast.error("Marks cannot exceed 100"); return; }
                        setDialogData({ ...dialogData, marks: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Word Limit</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 150"
                      className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                      value={dialogData.expected_length}
                      onChange={(e) => setDialogData({ ...dialogData, expected_length: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveDialog}
                    className="flex-1 py-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition font-semibold"
                  >
                    Save Question
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* SEARCH BAR */}
          {(activeSection === "Drafts" || activeSection === "Published") && (
            <div className="mb-8">
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-[400px] border border-slate-200 bg-white p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition shadow-sm"
              />
            </div>
          )}


          {/* DRAFTS */}
          {activeSection === "Drafts" && (
            <div>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-slate-900 mb-3">Draft Assessments</h2>
                <p className="text-slate-500 text-lg">Continue editing previously saved drafts</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {savedAssessments
                  .filter((a) => a.status === "Draft" && a.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((assessment) => (
                    <AssessmentCard
                      key={assessment._id}
                      assessment={assessment}
                      fetchAssessments={fetchAssessments}
                      setTitle={setTitle}
                      setQuestions={setQuestions}
                      setEditingAssessmentId={setEditingAssessmentId}
                      setActiveSection={setActiveSection}
                      setSubjectCode={setSubjectCode}
                      setSubjectName={setSubjectName}
                      setExamDate={setExamDate}
                      setDuration={setDuration}
                      setInstructions={setInstructions}
                      setSelectedDepartments={setSelectedDepartments}
                      setSelectedYears={setSelectedYears}
                      setAvailableFrom={setAvailableFrom}
                      setAvailableTo={setAvailableTo}
                    />
                  ))}
              </div>
            </div>
          )}


          {/* PUBLISHED */}
          {activeSection === "Published" && (
            <div>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-slate-900 mb-3">Published Assessments</h2>
                <p className="text-slate-500 text-lg">Live assessments available for students</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {savedAssessments
                  .filter((a) => a.status === "Published" && a.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((assessment) => (
                    <AssessmentCard
                      key={assessment._id}
                      assessment={assessment}
                      fetchAssessments={fetchAssessments}
                      fetchSubmissions={fetchSubmissions}
                      setTitle={setTitle}
                      setQuestions={setQuestions}
                      setEditingAssessmentId={setEditingAssessmentId}
                      setSelectedAssessmentId={setSelectedAssessmentId}
                      setActiveSection={setActiveSection}
                      setSubjectCode={setSubjectCode}
                      setSubjectName={setSubjectName}
                      setExamDate={setExamDate}
                      setDuration={setDuration}
                      setInstructions={setInstructions}
                      setSelectedDepartments={setSelectedDepartments}
                      setSelectedYears={setSelectedYears}
                      setAvailableFrom={setAvailableFrom}
                      setAvailableTo={setAvailableTo}
                    />
                  ))}
              </div>
            </div>
          )}


          {/* ANALYTICS */}
          {activeSection === "Analytics" && (
            <div className="space-y-8">
              <AnalyticsChart savedAssessments={savedAssessments} />
            </div>
          )}


          {/* SUBMISSIONS */}
          {activeSection === "Submissions" && (
            <div>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-slate-900 mb-3">Student Submissions</h2>
                <p className="text-slate-500 text-lg">Assessment ID: {selectedAssessmentId}</p>
              </div>
              {loadingSubmissions ? (
                <div className="bg-white rounded-3xl p-8">Loading submissions...</div>
              ) : (
                <>
                  <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-4 text-left">Student ID</th>
                          <th className="p-4 text-left">Email</th>
                          <th className="p-4 text-left">Status</th>
                          <th className="p-4 text-left">Final Marks</th>
                          <th className="p-4 text-left">View</th>
                          <th className="p-4 text-left">Evaluate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessmentSubmissions.map((submission) => (
                          <tr key={submission.submission_id} className="border-t">
                            <td className="p-4">{submission.student_id}</td>
                            <td className="p-4">{submission.student_email}</td>
                            <td className="p-4">{submission.status}</td>
                            <td className="p-4 font-semibold text-[#071330]">
                              {submission.final_marks > 0 ? Math.round(submission.final_marks) : "-"}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => {
                                  localStorage.setItem("selectedAssessmentId", selectedAssessmentId);
                                  router.push(`/assessment-review/${submission.submission_id}`);
                                }}
                                className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg"
                              >
                                View
                              </button>
                            </td>
                            <td className="p-4">
                              <button
                                disabled={
                                  (submission.status === "Evaluated" || submission.status === "Finalized") ||
                                  evaluatingSubmission === submission.submission_id
                                }
                                onClick={() => evaluateSubmission(submission.submission_id)}
                                className={`px-4 py-2 rounded-lg text-white ${
                                  (submission.status === "Evaluated" || submission.status === "Finalized")
                                    ? "bg-green-600 cursor-not-allowed"
                                    : evaluatingSubmission === submission.submission_id
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                              >
                                {evaluatingSubmission === submission.submission_id
                                  ? "Evaluating..."
                                  : (submission.status === "Evaluated" || submission.status === "Finalized")
                                    ? "Evaluated"
                                    : "Evaluate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {showSubmissionDetails && (
                    <div className="mt-8 bg-white p-6 rounded-3xl shadow">
                      <h2 className="text-2xl font-bold mb-6">Submission Details</h2>
                      {submissionDetails.map((item, index) => (
                        <div key={index} className="mb-6 border-b pb-4">
                          <h3 className="font-bold mb-2">Question {item.question_id}</h3>
                          <p className="text-slate-700 whitespace-pre-wrap">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}