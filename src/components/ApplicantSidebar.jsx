import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser } from "../utils/userData";

const navItems = [
  {
    name: "Dashboard",
    path: "/Dashboard",
    matchPaths: ["/dashboard"],
  },
  {
    name: "Pre-Assessment",
    path: "/PreAssessment",
    matchPaths: ["/preassessment", "/pre-assessment"],
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
  },
  {
    name: "Call Simulation",
    path: "/call-simulation",
    matchPaths: ["/call-simulation", "/call-simulation/session"],
  },
  {
    name: "Practice History",
    path: "/PracticeHistory",
    matchPaths: ["/practicehistory"],
  },
  {
    name: "Performance Summary",
    path: "/PerformanceSummary",
    matchPaths: ["/performancesummary"],
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
    ['user', 'userId', 'token', 'bpoReadyAssessment', 'bpoReadyActivity'].forEach((key) => {
      localStorage.removeItem(key);
    });
    window.location.href = "/#/Login";
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col p-6 fixed h-screen z-40 font-poppins">
      {/* Brand Logo */}
      <Link to="/Dashboard" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          B
        </div>
        <span className="font-bold text-xl text-gray-800">BPOReady</span>
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                active
                  ? "bg-blue-50 text-blue-600 font-bold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="pt-4 border-t space-y-1">
        <Link
          to="/Profile"
          className={`flex items-center gap-3 px-4 py-2 text-xs font-semibold rounded-xl transition ${
            isProfileActive
              ? "bg-blue-50 text-blue-600 font-bold"
              : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
          }`}
        >
          My Profile
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ApplicantSidebar;
