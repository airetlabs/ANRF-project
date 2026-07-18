"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import QuestionCard from "../components/QuestionCard";
import AssessmentCard from "../components/AssessmentCard";
import PreviewPanel from "../components/PreviewPanel";
import AnalyticsChart from "../components/AnalyticsChart";
import RecentActivity from "../components/RecentActivity";
import Select from "react-select";

export default function Home() {

    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-f434.up.railway.app";
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
    const [exportingCSV, setExportingCSV] = useState(false);
    const [exportingHTML, setExportingHTML] = useState(false);
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

    const [submissionDetails, setSubmissionDetails] = useState([]);
    const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);


    // UNSAVED CHANGES WARNING
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


    // HANDLE SECTION CHANGE
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


    // AUTH CHECK
    useEffect(() => {
        const timer = setTimeout(() => {
            const token = localStorage.getItem("token");
            const role = localStorage.getItem("userRole");
            if (!token || role !== "faculty") {
                router.replace("/login");
            } else {
                setCheckingAuth(false);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);


    // LOAD AUTOSAVE
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


    // AUTOSAVE
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


    // FETCH ASSESSMENTS
    useEffect(() => {
        fetchAssessments();
    }, []);


    // LOAD SUBMISSIONS EVENT
    useEffect(() => {
        const handler = (event) => {
            fetchSubmissions(event.detail);
        };
        window.addEventListener("loadSubmissions", handler);
        return () => window.removeEventListener("loadSubmissions", handler);
    }, []);


    // REFETCH SUBMISSIONS WHEN RETURNING FROM REVIEW PAGE
    useEffect(() => {
        if (activeSection === "Submissions" && selectedAssessmentId) {
            fetchSubmissions(selectedAssessmentId);
        }
    }, [activeSection]);


    // OPEN SUBMISSIONS PAGE AFTER RETURNING FROM REVIEW
    useEffect(() => {
        const openSubmissions = localStorage.getItem("openSubmissions");
        const savedAssessmentId = localStorage.getItem("selectedAssessmentId");

        if (openSubmissions === "true" && savedAssessmentId) {
            setActiveSection("Submissions");
            setSelectedAssessmentId(savedAssessmentId);
            fetchSubmissions(savedAssessmentId);
            localStorage.removeItem("openSubmissions");
        }

        const handler = (event) => {
            fetchSubmissions(event.detail);
        };
        window.addEventListener("loadSubmissions", handler);
        return () => window.removeEventListener("loadSubmissions", handler);
    }, []);


    const fetchAssessments = async () => {
        try {
            const facultyEmail = localStorage.getItem("userEmail");
            const response = await fetch(`${API_URL}/assessment/all/${facultyEmail}`);
            const data = await response.json();
            const sorted = [...data].sort((a, b) => {
                if (a._id < b._id) return 1;
                if (a._id > b._id) return -1;
                return 0;
            });
            setSavedAssessments(sorted);
        } catch (error) {
            console.error(error);
        }
    };


    const fetchSubmissions = async (assessmentId) => {
        try {
            setLoadingSubmissions(true);
            const [subRes] = await Promise.all([
                fetch(`${API_URL}/submission/assessment/${assessmentId}`),
                fetchAssessments()
            ]);
            const data = await subRes.json();
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
            if (!response.ok) {
                throw new Error(data.detail || "Evaluation failed");
            }
            toast.success("Evaluation Completed");
            fetchSubmissions(selectedAssessmentId);
        } catch (error) {
            console.error(error);
            toast.error("Evaluation Failed");
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
            toast.error("Failed to load submission");
        } finally {
            setEvaluatingSubmission(null);
        }
    };

    const exportCSV = async () => {
        if (!selectedAssessmentId) return;
        const allEvaluatedForCSV =
            assessmentSubmissions.length > 0 &&
            assessmentSubmissions.every((s) => s.status === "Evaluated" || s.status === "Finalized");
        if (!allEvaluatedForCSV) {
            toast.error("Please evaluate all submissions before exporting CSV.");
            return;
        }
        try {
            setExportingCSV(true);
            const response = await fetch(`${API_URL}/submission/export-csv/${selectedAssessmentId}`);
            if (!response.ok) throw new Error();
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const assessment = savedAssessments.find(a => String(a._id) === String(selectedAssessmentId));
            const safeTitle = (assessment?.title || "assessment").replace(/[^a-zA-Z0-9-_]/g, "_");
            a.download = `${safeTitle}_marks.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("CSV exported successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to export CSV");
        } finally {
            setExportingCSV(false);
        }
    };

    const exportHTMLMarksheet = () => {
        if (!selectedAssessmentId || assessmentSubmissions.length === 0) return;
        try {
            setExportingHTML(true);
            const assessment = savedAssessments.find(a => String(a._id) === String(selectedAssessmentId));
            const assessmentTitle = assessment?.title || "Assessment";
            const evaluatedCount = assessmentSubmissions.filter(s => s.status === "Finalized" || s.status === "Evaluated").length;
            const pendingCount = assessmentSubmissions.length - evaluatedCount;
            const scored = assessmentSubmissions.filter(s => s.final_marks > 0);
            const avgMarks = scored.length > 0 ? Math.round(scored.reduce((sum, s) => sum + s.final_marks, 0) / scored.length) : 0;
            const escapeHtml = (str) => String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
            const rows = assessmentSubmissions.map((s, idx) => {
                const statusStyle = s.status === "Finalized" ? "background:#dcfce7;color:#16a34a" : s.status === "Evaluated" ? "background:#dbeafe;color:#2563eb" : "background:#fef9c3;color:#92400e";
                return `<tr style="${idx % 2 === 0 ? "background:#f8fafc" : "background:#fff"}">
              <td style="border:1px solid #e2e8f0;padding:12px 16px;text-align:center;color:#64748b">${idx + 1}</td>
              <td style="border:1px solid #e2e8f0;padding:12px 16px;font-weight:600;color:#0f172a">${escapeHtml(s.student_id)}</td>
              <td style="border:1px solid #e2e8f0;padding:12px 16px;color:#334155">${escapeHtml(s.student_email)}</td>
              <td style="border:1px solid #e2e8f0;padding:12px 16px;text-align:center"><span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;${statusStyle}">${escapeHtml(s.status)}</span></td>
              <td style="border:1px solid #e2e8f0;padding:12px 16px;text-align:center;font-weight:700;font-size:16px;color:${s.final_marks > 0 ? "#16a34a" : "#94a3b8"}">${s.final_marks > 0 ? Math.round(s.final_marks) : "—"}</td>
            </tr>`;
            }).join("");
            const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Marksheet - ${escapeHtml(assessmentTitle)}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;}@media print{body{background:#fff;}.no-print{display:none !important;}.page{box-shadow:none !important;margin:0 !important;border-radius:0 !important;}}</style></head><body>
          <div class="no-print" style="background:#1e293b;color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600">AcadAIsist — Faculty Marksheet</span><button onclick="window.print()" style="background:#3b82f6;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:600;cursor:pointer">Print / Save as PDF</button></div>
          <div class="page" style="max-width:960px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
            <div style="background:#0f172a;padding:36px 40px"><p style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Faculty Marksheet</p><h1 style="color:#fff;font-size:24px;font-weight:800;margin-bottom:20px">${escapeHtml(assessmentTitle)}</h1>
              <div style="display:flex;gap:20px;flex-wrap:wrap">
                <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:14px 20px;text-align:center"><p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Total Students</p><p style="color:#fff;font-size:24px;font-weight:800">${assessmentSubmissions.length}</p></div>
                <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:14px 20px;text-align:center"><p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Evaluated</p><p style="color:#4ade80;font-size:24px;font-weight:800">${evaluatedCount}</p></div>
                <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:14px 20px;text-align:center"><p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Pending</p><p style="color:#facc15;font-size:24px;font-weight:800">${pendingCount}</p></div>
                <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:14px 20px;text-align:center"><p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Class Average</p><p style="color:#60a5fa;font-size:24px;font-weight:800">${avgMarks}</p></div>
              </div>
            </div>
            <div style="padding:32px 40px"><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="background:#f1f5f9"><th style="border:1px solid #e2e8f0;padding:12px 16px;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">#</th><th style="border:1px solid #e2e8f0;padding:12px 16px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Register No.</th><th style="border:1px solid #e2e8f0;padding:12px 16px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Email</th><th style="border:1px solid #e2e8f0;padding:12px 16px;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Status</th><th style="border:1px solid #e2e8f0;padding:12px 16px;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Final Marks</th></tr></thead><tbody>${rows}</tbody></table></div>
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;display:flex;justify-content:space-between;align-items:center"><p style="font-size:12px;color:#94a3b8">Generated by AcadAIsist • AI-Assisted Academic Evaluation</p><p style="font-size:12px;color:#94a3b8">Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></div>
          </div></body></html>`;
            const blob = new Blob([html], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${assessmentTitle.replace(/[^a-zA-Z0-9-_]/g, "_")}_marksheet.html`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("HTML marksheet exported");
        } catch (error) {
            console.error(error);
            toast.error("Failed to export marksheet");
        } finally {
            setExportingHTML(false);
        }
    };


    // RESET ALL FIELDS
    const resetFields = () => {
        setTitle("");
        setSubjectCode("");
        setSubjectName("");
        setExamDate("");
        setDuration("");
        setInstructions("");
        setSelectedDepartments([]);
        setSelectedYears([]);
        setAvailableFrom("");
        setAvailableTo("");
        setQuestions([{
            question_id: "",
            question: "",
            answer_key: "",
            rubric: "",
            marks: "",
            expected_length: ""
        }]);
        setEditingAssessmentId(null);
    };


    // CREATE NEW ASSESSMENT
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


    // ADD QUESTION
    const addQuestionCard = (index) => {
        const newQuestion = {
            question_id: "",
            question: "",
            answer_key: "",
            rubric: "",
            marks: "",
            expected_length: ""
        };
        const updatedQuestions = [...questions];
        updatedQuestions.splice(index + 1, 0, newQuestion);
        setQuestions(updatedQuestions);
    };


    // UPDATE QUESTION
    const updateQuestion = (index, field, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index][field] = value;
        setQuestions(updatedQuestions);
    };


    // DELETE QUESTION
    const deleteQuestion = (index) => {
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
    };


    // BUILD PAYLOAD
    const buildPayload = (status) => ({
        title, subjectCode, subjectName, examDate, duration, instructions,
        departments: selectedDepartments.map((dept) => dept.value),
        years: selectedYears.map((year) => year.value),
        availableFrom, availableTo,
        questions: questions.map((q, index) => ({
            ...q,
            question_id: q.question_id || index + 1,
        })),
        id: editingAssessmentId,
        status,
        faculty_email: localStorage.getItem("userEmail")
    });


    // VALIDATE FIELDS
    const validateFields = () => {
        if (!title.trim()) {
            toast.error("Assessment title is required");
            return false;
        }
        if (questions.length === 0) {
            toast.error("Please add at least one question");
            return false;
        }
        for (let q of questions) {
            if (!q.question.trim() || !q.answer_key.trim() || !q.rubric.trim() || !q.marks || !q.expected_length.trim()) {
                toast.error("Please fill all question fields");
                return false;
            }
            const marksVal = parseInt(q.marks);
            if (isNaN(marksVal) || marksVal < 1 || marksVal > 100) {
                toast.error("Marks must be between 1 and 100");
                return false;
            }
        }
        return true;
    };


    // SAVE ASSESSMENT
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
            toast.success("Assessment saved successfully");
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


    // PUBLISH ASSESSMENT
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


    // LOADING SCREEN
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

            {/* SIDEBAR */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeSection={activeSection}
                setActiveSection={handleSectionChange}
            />

            {/* MAIN CONTENT */}
            <div className={`w-full transition-all duration-300 ${sidebarOpen ? "ml-[240px]" : "ml-[80px]"}`}>

                {/* NAVBAR */}
                <Navbar
                    saveAssessment={saveAssessment}
                    publishAssessment={publishAssessment}
                    showPreview={showPreview}
                    setShowPreview={setShowPreview}
                    createNewAssessment={createNewAssessment}
                    saving={saving}
                    activeSection={activeSection}
                />

                {/* PAGE CONTENT */}
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
                        <div className="space-y-10">

                            <div className="bg-white rounded-[30px] border border-slate-200 p-10 mb-12 shadow-sm">

                                <div className="mb-10">
                                    <h2 className="text-4xl font-bold text-slate-900">
                                        {editingAssessmentId ? "Edit Assessment" : "Create Assessment"}
                                    </h2>
                                    <p className="text-slate-500 mt-3 text-lg">Build professional assessments for students</p>
                                </div>

                                {/* TITLE */}
                                <div className="mb-8">
                                    <label className="block text-sm font-semibold text-slate-600 mb-4">Assessment Title</label>
                                    <input
                                        type="text"
                                        placeholder="Enter assessment title"
                                        className="w-full border border-slate-200 bg-slate-50 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                {/* SUBJECT CODE & NAME */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-4">Subject Code</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. CS301"
                                            className="w-full border border-slate-200 bg-slate-50 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                                            value={subjectCode}
                                            onChange={(e) => setSubjectCode(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-4">Subject Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Database Management Systems"
                                            className="w-full border border-slate-200 bg-slate-50 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                                            value={subjectName}
                                            onChange={(e) => setSubjectName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* DEPARTMENT & YEAR */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-4">Department</label>
                                        <Select
                                            isMulti
                                            options={[
                                                { value: "CSE", label: "CSE" },
                                                { value: "IT", label: "IT" },
                                                { value: "AIDS", label: "AIDS" },
                                                { value: "ECE", label: "ECE" },
                                                { value: "EEE", label: "EEE" },
                                                { value: "MECH", label: "MECH" },
                                                { value: "CIVIL", label: "CIVIL" }
                                            ]}
                                            value={selectedDepartments}
                                            onChange={setSelectedDepartments}
                                            placeholder="Select Departments"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-4">Year</label>
                                        <Select
                                            isMulti
                                            options={[
                                                { value: "1", label: "1" },
                                                { value: "2", label: "2" },
                                                { value: "3", label: "3" },
                                                { value: "4", label: "4" }
                                            ]}
                                            value={selectedYears}
                                            onChange={setSelectedYears}
                                            placeholder="Select Years"
                                        />
                                    </div>
                                </div>

                                {/* DATE & DURATION */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-4">Date of Examination</label>
                                        <input
                                            type="date"
                                            className="w-full border border-slate-200 bg-slate-50 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition text-slate-700"
                                            value={examDate}
                                            onChange={(e) => setExamDate(e.target.value)}
                                            onKeyDown={(e) => e.preventDefault()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-4">Total Time</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 90 Minutes"
                                            className="w-full border border-slate-200 bg-slate-50 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* AVAILABLE FROM & TO */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-4">Available From</label>
                                        <input
                                            type="datetime-local"
                                            value={availableFrom}
                                            onChange={(e) => setAvailableFrom(e.target.value)}
                                            onKeyDown={(e) => e.preventDefault()}
                                            className="w-full border border-slate-200 bg-slate-50 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-4">Available To</label>
                                        <input
                                            type="datetime-local"
                                            value={availableTo}
                                            onChange={(e) => setAvailableTo(e.target.value)}
                                            onKeyDown={(e) => e.preventDefault()}
                                            className="w-full border border-slate-200 bg-slate-50 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                                        />
                                    </div>
                                </div>

                                {/* INSTRUCTIONS */}
                                <div className="mb-10">
                                    <label className="block text-sm font-semibold text-slate-600 mb-4">Exam Instructions</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Enter exam instructions for students"
                                        className="w-full border border-slate-200 bg-slate-50 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none text-slate-700"
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                    />
                                </div>

                                {/* QUESTIONS */}
                                <div className="space-y-8">
                                    {questions.map((q, index) => (
                                        <QuestionCard
                                            key={index}
                                            q={q}
                                            index={index}
                                            addQuestionCard={addQuestionCard}
                                            deleteQuestion={deleteQuestion}
                                            updateQuestion={updateQuestion}
                                        />
                                    ))}
                                </div>

                            </div>

                            {/* PREVIEW PANEL */}
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
                                    .filter((assessment) =>
                                        assessment.status === "Draft" &&
                                        assessment.title.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
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
                                    .filter((assessment) =>
                                        assessment.status === "Published" &&
                                        assessment.title.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
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

                            {/* HEADER + PUBLISH RESULTS BUTTON */}
                            <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
                                <div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <h2 className="text-4xl font-bold text-slate-900">
                                            Student Submissions
                                        </h2>


                                    </div>

                                    <p className="text-slate-500 text-lg">
                                        Assessment: {savedAssessments.find(a => String(a._id) === String(selectedAssessmentId))?.title || ""}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={exportCSV}
                                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-2xl text-sm transition"
                                    >
                                        Export CSV
                                    </button>

                                    <button
                                        onClick={exportHTMLMarksheet}
                                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-2xl text-sm transition"
                                    >
                                        Export Marksheet
                                    </button>

                                    {savedAssessments.find(a => String(a._id) === String(selectedAssessmentId))?.results_published ? (
                                        <div className="bg-green-100 text-green-700 font-semibold px-5 py-2.5 rounded-2xl border border-green-200 text-sm flex items-center gap-2">
                                            ✓ Results Published
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                const allEvaluated = assessmentSubmissions.length > 0 &&
                                                    assessmentSubmissions.every(s => s.status === "Evaluated" || s.status === "Finalized");
                                                if (!allEvaluated) {
                                                    toast.error("Please evaluate all submissions before publishing results.");
                                                    return;
                                                }
                                                try {
                                                    const res = await fetch(`${API_URL}/assessment/publish-results/${selectedAssessmentId}`, { method: "PATCH" });
                                                    if (!res.ok) throw new Error();
                                                    toast.success("Results published! Students can now view their results.");
                                                    fetchAssessments();
                                                } catch {
                                                    toast.error("Failed to publish results.");
                                                }
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-2xl transition text-sm"
                                        >
                                            Publish Results
                                        </button>
                                    )}
                                </div>
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
                                                                    if (submission.status !== "Evaluated" && submission.status !== "Finalized") {
                                                                        toast("⚠️ Evaluation not yet done. AI marks will show as pending.", {
                                                                            duration: 3000,
                                                                        });
                                                                    }
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
                                                                className={`px-4 py-2 rounded-lg text-white ${(submission.status === "Evaluated" || submission.status === "Finalized")
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