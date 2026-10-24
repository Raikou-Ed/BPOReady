import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getCurrentUser } from "../utils/userData";
import { updateProfile, changePassword } from "../api/authApi";

const AdminProfile = () => {
  const [user, setUser] = useState(() => getCurrentUser() || {
    id: 1,
    name: "System SuperAdmin",
    email: "superadmin@bpoready.com",
    role: "super_admin",
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const cur = getCurrentUser();
    if (cur) {
      setUser(cur);
      setProfileForm({
        name: cur.name || `${cur.first_name || ""} ${cur.last_name || ""}`.trim() || "Administrator",
        email: cur.email || "",
      });
    }
  }, []);

  const isSuperAdmin = user?.role === "super_admin";

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setStatusMessage({ text: "", type: "" });
    try {
      if (user?.id) {
        const res = await updateProfile(user.id, profileForm);
        if (res && res.user) {
          const updated = { ...user, ...res.user, name: profileForm.name, email: profileForm.email };
          localStorage.setItem("user", JSON.stringify(updated));
          setUser(updated);
        }
      }
      setStatusMessage({ text: "Profile information updated successfully!", type: "success" });
    } catch (err) {
      // Local fallback
      const updated = { ...user, name: profileForm.name, email: profileForm.email };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setStatusMessage({ text: "Profile saved locally!", type: "success" });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setStatusMessage({ text: "", type: "" }), 4000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setStatusMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }
    setPasswordLoading(true);
    setStatusMessage({ text: "", type: "" });
    try {
      if (user?.id) {
        await changePassword(user.id, passwordForm);
      }
      setStatusMessage({ text: "Password changed successfully!", type: "success" });
      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (err) {
      setStatusMessage({ text: err.message || "Failed to update password.", type: "error" });
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setStatusMessage({ text: "", type: "" }), 4000);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins text-gray-900">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  isSuperAdmin
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                {isSuperAdmin ? "👑 Super Admin" : "🏢 Company Admin"}
              </span>
              <span className="text-xs text-gray-400">Settings</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Administrator Profile &amp; Security
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage your administrator credentials and security settings.
            </p>
          </div>

          {/* Toast Notification */}
          {statusMessage.text && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <span>{statusMessage.type === "success" ? "✓" : "⚠"}</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Profile Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm ${
                  isSuperAdmin ? "bg-purple-600" : "bg-blue-600"
                }`}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{user.name || "Administrator"}</h2>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isSuperAdmin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isSuperAdmin ? "Super Admin" : "Company Admin"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{user.email || "admin@bpoready.com"}</p>
                <div className="mt-2 text-[11px] text-gray-500 flex gap-4">
                  <span>Role: <strong className="text-gray-700">{user.role || "super_admin"}</strong></span>
                  <span>Status: <strong className="text-emerald-600">Active</strong></span>
                  <span>Scope: <strong className="text-gray-700">{isSuperAdmin ? "Global Platform Governance" : "Institutional Controls"}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Update Profile Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Update Information</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Modify the display name and contact email for this account.
                </p>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                  >
                    {profileLoading ? "Saving Changes..." : "Save Changes"}
                  </button>
                </form>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Change Password</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Ensure your account has a strong password to safeguard access.
                </p>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new_password_confirmation}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password_confirmation: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                  >
                    {passwordLoading ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminProfile;