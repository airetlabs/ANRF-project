"use client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://anrf-project-production-f434.up.railway.app";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("faculty");
  const [facultyList, setFacultyList] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [adminEmail, setAdminEmail] = useState("Admin");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") { router.push("/login"); return; }
    setAdminEmail(localStorage.getItem("userEmail") || "Admin");
    fetchFaculty();
    fetchAssessments();
    fetchSubmissions();
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchFaculty = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/faculty`);
      if (res.ok) { const data = await res.json(); setFacultyList([...data].reverse()); }
    } catch (e) { console.error(e); }
  };

  const fetchAssessments = async () => {
    try {
      const res = await fetch(`${API_URL}/assessment/admin/all`);
      if (res.ok) { const data = await res.json(); setAssessments([...data].reverse()); }
    } catch (e) { console.error(e); }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_URL}/submission/all`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)));
      }
    } catch (e) { console.error(e); }
  };

  const createFaculty = async () => {
    if (!newEmail || !newPassword) { showMessage("Please fill email and password", "error"); return; }
    try {
      setCreating(true);
      console.log("API_URL =", API_URL);
      console.log("Request URL =", `${API_URL}/auth/register`);
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: "faculty", register_number: "", department: "", year: "" }),
      });
      const data = await res.json();
      if (!res.ok) { showMessage(data.detail || "Failed to create faculty", "error"); return; }
      showMessage("Faculty account created successfully!", "success");
      setNewEmail(""); setNewPassword("");
      fetchFaculty();
    } catch (e) { showMessage("Something went wrong", "error"); }
    finally { setCreating(false); }
  };

  const deleteFaculty = async (email) => {
    if (!window.confirm(`Delete faculty account: ${email}?`)) return;
    try {
      const res = await fetch(`${API_URL}/auth/faculty/${encodeURIComponent(email)}`, { method: "DELETE" });
      if (res.ok) { showMessage("Faculty deleted successfully", "success"); fetchFaculty(); }
      else showMessage("Failed to delete faculty", "error");
    } catch (e) { showMessage("Something went wrong", "error"); }
  };

  const logout = () => { localStorage.clear(); router.push("/"); };

  // Explicit IST timezone — backend now stores UTC with +00:00 suffix
  const fmt = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  const statusColor = (status) => {
    if (status === "Finalized") return "bg-purple-100 text-purple-700";
    if (status === "Evaluated") return "bg-green-100 text-green-700";
    if (status === "Revaluation Requested") return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  const tabs = [
    { id: "faculty", label: "Faculty Management", emoji: "👨‍🏫" },
    { id: "assessments", label: "All Assessments", emoji: "📋" },
    { id: "submissions", label: "All Submissions", emoji: "📝" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      {/* NAVBAR */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AcadAIsist</h1>
          <p className="text-slate-500 text-sm">Admin Control Panel</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium">{adminEmail}</span>
          <button onClick={logout}
            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded-xl font-medium text-sm transition">
            Logout
          </button>
        </div>
      </div>

      <div className="px-8 py-8 max-w-7xl mx-auto">

        {/* STATS */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Faculty", val: facultyList.length },
            { label: "Total Assessments", val: assessments.length },
            { label: "Total Submissions", val: submissions.length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-1">{s.label}</p>
              <h2 className="text-4xl font-bold text-slate-900">{s.val}</h2>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-6">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition ${activeTab === tab.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}>
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* MESSAGE */}
        {message.text && (
          <div className={`mb-6 px-5 py-3 rounded-xl font-medium text-sm ${message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        {/* FACULTY MANAGEMENT */}
        {activeTab === "faculty" && (
          <div className="space-y-6">
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Faculty Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Faculty Email</label>
                  <input type="email" placeholder="faculty@college.edu" value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Password</label>
                  <div className="relative">
                    <input type={showNewPassword ? "text" : "password"} placeholder="Set a password"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 p-3 pr-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <button onClick={createFaculty} disabled={creating}
                    className="w-full bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition">
                    {creating ? "Creating..." : "Create Faculty"}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900">Faculty Accounts</h2>
                <p className="text-slate-500 text-sm mt-1">{facultyList.length} faculty registered</p>
              </div>
              {facultyList.length === 0 ? (
                <div className="px-8 py-10 text-slate-500 text-center">No faculty accounts yet. Create one above!</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {["#", "Email", "Role", "Action"].map((h) => (
                        <th key={h} className="px-8 py-4 text-left text-sm font-semibold text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {facultyList.map((faculty, index) => (
                      <tr key={index} className="border-t border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-8 py-4 text-slate-500 text-sm">{index + 1}</td>
                        <td className="px-8 py-4 text-slate-900 font-medium">{faculty.email}</td>
                        <td className="px-8 py-4">
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">Faculty</span>
                        </td>
                        <td className="px-8 py-4">
                          <button onClick={() => deleteFaculty(faculty.email)}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ALL ASSESSMENTS */}
        {activeTab === "assessments" && (
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900">All Assessments</h2>
              <p className="text-slate-500 text-sm mt-1">{assessments.length} total assessments</p>
            </div>
            {assessments.length === 0 ? (
              <div className="px-8 py-10 text-slate-500 text-center">No assessments found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {["#", "Title", "Faculty", "Subject", "Status", "Departments"].map((h) => (
                      <th key={h} className="px-8 py-4 text-left text-sm font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a, index) => (
                    <tr key={index} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-8 py-4 text-slate-500 text-sm">{index + 1}</td>
                      <td className="px-8 py-4 text-slate-900 font-medium">{a.title}</td>
                      <td className="px-8 py-4 text-slate-600 text-sm">{a.faculty_email}</td>
                      <td className="px-8 py-4 text-slate-600 text-sm">{a.subjectName}</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${a.status === "Published"
                          ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-slate-600 text-sm">{a.departments?.join(", ") || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ALL SUBMISSIONS */}
        {activeTab === "submissions" && (
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900">All Submissions</h2>
              <p className="text-slate-500 text-sm mt-1">{submissions.length} total submissions</p>
            </div>
            {submissions.length === 0 ? (
              <div className="px-8 py-10 text-slate-500 text-center">No submissions yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {["#", "Student", "Student ID", "Assessment", "Start Time", "Submitted At", "Status"].map((h) => (
                      <th key={h} className="px-8 py-4 text-left text-sm font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, index) => (
                    <tr key={index} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-8 py-4 text-slate-500 text-sm">{index + 1}</td>
                      <td className="px-8 py-4 text-slate-900 font-medium">{s.student_email}</td>
                      <td className="px-8 py-4 text-slate-600 text-sm">{s.student_id}</td>
                      <td className="px-8 py-4 text-slate-600 text-sm">{s.assessment_title}</td>
                      <td className="px-8 py-4 text-slate-500 text-sm">{fmt(s.started_at)}</td>
                      <td className="px-8 py-4 text-slate-600 text-sm">{fmt(s.submitted_at)}</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}