import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/userData";

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser() || {
    name: "System SuperAdmin",
    email: "superadmin@bpoready.com",
    role: "super_admin",
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const isSuperAdmin = currentUser?.role === "super_admin";

  // Super Admin manages approvals and system quality control
  const superAdminLinks = [
    {
      name: "Dashboard",
      path: "/AdminDashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "Content Approvals",
      path: "/AdminApprovals",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: "Passages Repository",
      path: "/ManageParagraphs",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: "Speech Drills Repository",
      path: "/ManageExercises",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
    },
    {
      name: "Question Bank Repository",
      path: "/ManageInterviewQuestions",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      name: "Monitor Registered Users",
      path: "/MonitorUsers",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: "Profile",
      path: "/AdminProfile",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  // Company Admin manages institutional standards and proposes training content (Scoring, Paragraphs, Drills, Questions, Trainees)
  const companyAdminLinks = [
    {
      name: "Dashboard",
      path: "/AdminDashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: "Scoring Standards",
      path: "/AdminScoringStandards",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
    {
      name: "Propose Reading Passages",
      path: "/ManageParagraphs",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: "Propose Speech Drills",
      path: "/ManageExercises",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
    },
    {
      name: "Propose Interview Questions",
      path: "/ManageInterviewQuestions",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: "Monitor Trainees",
      path: "/MonitorUsers",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: "Profile",
      path: "/AdminProfile",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const links = isSuperAdmin ? superAdminLinks : companyAdminLinks;

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col py-6 fixed h-screen z-10 font-poppins select-none">
      {/* Brand Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            B
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900 block leading-none">BPOReady</span>
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
              {isSuperAdmin ? "Super Admin" : "Company Admin"}
            </span>
          </div>
        </div>

        {/* Clean Role Badge */}
        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              Account Role
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isSuperAdmin
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              {isSuperAdmin ? "Super Admin" : "Company Admin"}
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-800 mt-1 truncate">
            {isSuperAdmin ? "Platform Owner" : "Company Institution"}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname.toLowerCase() === link.path.toLowerCase();
          return (
            <Link key={link.name} to={link.path}>
              <div
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <span className={isActive ? "text-blue-600" : "text-gray-400"}>
                  {link.icon}
                </span>
                <span>{link.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Info & Sign Out */}
      <div className="px-3 pt-4 border-t border-gray-200 space-y-2 mt-auto">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-xs font-bold text-gray-900 truncate">{currentUser?.name || "Admin"}</p>
            <p className="text-[10px] text-gray-500 truncate">{currentUser?.email || "admin@bpoready.com"}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
