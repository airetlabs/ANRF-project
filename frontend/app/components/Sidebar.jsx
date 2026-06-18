"use client";

import { useEffect, useState } from "react";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeSection,
  setActiveSection
}) {

  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) setUserEmail(email);
  }, []);

  const menuItems = [
    "Dashboard",
    "Create Assessment",
    "Drafts",
    "Published",
    "Analytics"
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        />
      )}

      <div
        className={`fixed top-0 left-0 h-screen bg-slate-900 text-white z-50 transition-all duration-300 flex flex-col justify-between p-5
        ${sidebarOpen
          ? "w-[240px] translate-x-0"
          : "w-[80px] -translate-x-full lg:translate-x-0 lg:w-[80px]"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-10">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold tracking-tight">AcadAIsist</h1>
                <p className="text-slate-400 text-xs mt-1">Faculty Platform</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-slate-800 hover:bg-slate-700 transition w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
            >
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveSection(item)}
                className={`w-full flex items-center gap-3 transition px-4 py-3 rounded-xl
                ${activeSection === item
                  ? "bg-sky-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeSection === item ? "bg-white" : "bg-slate-400"}`} />
                {sidebarOpen && <span className="font-medium text-sm">{item}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {userEmail ? userEmail[0].toUpperCase() : "F"}
            </div>
            {sidebarOpen && (
              <div>
                <h3 className="font-semibold text-sm">Faculty</h3>
                <p className="text-xs text-slate-400 break-all">{userEmail}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
