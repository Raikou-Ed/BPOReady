import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser, clearLegacyUserData } from "../utils/userData";

const navItems = [
  {
    name: "Dashboard",
    path: "/Dashboard",
    matchPaths: ["/dashboard"],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Pre-Assessment",
    path: "/PreAssessment",
    matchPaths: ["/preassessment", "/pre-assessment"],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: "Paragraph Reading",
    path: "/ParagraphReading",
    matchPaths: [
      "/paragraphreading",
      "/paragraph-reading",
      "/easy-level-paragraph-reading",
      "/medium-level-paragraph-reading",
      "/hard-level-paragraph-reading",
      "/easylevelresult",
      "/medium-level-result",
      "/hard-level-result",
    ],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: "Mock Interview",
    path: "/MockInterview",
    matchPaths: [
      "/mockinterview",
      "/initialinterview",
      "/initialinterviewrecording",
      "/finalinterview",
      "/finalinterviewrecording",
      "/mockinterviewfeedback",
    ],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    name: "Exercises",
    path: "/communication-exercises",
    matchPaths: [
      "/communication-exercises",
      "/grammar-exercise",
      "/filler-words-exercise",
      "/speech-pacing-exercise",
    ],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: "Call Simulation",
    path: "/call-simulation",
    matchPaths: ["/call-simulation", "/call-simulation/session"],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    name: "Practice History",
    path: "/PracticeHistory",
    matchPaths: ["/practicehistory"],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: "Performance Summary",
    path: "/PerformanceSummary",
    matchPaths: ["/performancesummary", "/performance-summary"],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: "Apply for Certification",
    path: "/apply-certification",
    matchPaths: ["/apply-certification", "/applycertification"],
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

const ApplicantSidebar = ({ activeItem = null }) => {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();
  const user = getCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const isItemActive = (item) => {
    if (activeItem) {
      return activeItem.toLowerCase() === item.name.toLowerCase();
    }
    if (item.matchPaths) {
      return item.matchPaths.some(
        (p) => currentPath === p || currentPath.startsWith(p + "/")
      );
    }
    return currentPath === item.path.toLowerCase();
  };

  const isProfileActive =
    activeItem?.toLowerCase() === "profile" ||
    activeItem?.toLowerCase() === "my profile" ||
    currentPath === "/profile";

  const handleLogout = (e) => {
    e.preventDefault();
    clearLegacyUserData();
    ['user', 'userId', 'token', 'bpoReadyAssessment', 'bpoReadyActivity', 'bpoReadyLastParagraphResult'].forEach((key) => {
      localStorage.removeItem(key);
    });
    window.location.href = "/#/Login";
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col p-6 fixed h-screen z-40 font-poppins">
      {/* Brand Logo */}
      <Link to="/Dashboard" className="flex items-center gap-3 mb-8 group">
        <img
          src="/logo-icon.png"
          alt="BPOReady Logo"
          className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
        />
        <div className="flex flex-col">
          <span className="font-extrabold text-xl text-gray-900 tracking-tight leading-none">
            BPO<span className="text-blue-600">Ready</span>
          </span>
          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
            Speech &amp; Interview
          </span>
        </div>
      </Link>

      {isAdmin && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-indigo-700 block">
            {user.role === "super_admin" ? "👑 Super Admin" : "🏢 Company Admin"}
          </span>
          <Link
            to="/AdminDashboard"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline block mt-0.5"
          >
            Open Admin Console →
          </Link>
        </div>
      )}

      {/* Main Nav Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const active = isItemActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                active
                  ? "bg-blue-50 text-blue-600 font-bold shadow-xs"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
              }`}
            >
              {item.icon}
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="pt-4 border-t space-y-1">
        <Link
          to="/Profile"
          className={`flex items-center gap-3 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
            isProfileActive
              ? "bg-blue-50 text-blue-600 font-bold"
              : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>My Profile</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default ApplicantSidebar;
