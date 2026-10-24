import React from "react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { updateProfile } from "../api/authApi";
import ApplicantSidebar from "../components/ApplicantSidebar";

const Profile = () => {
  const [savedUser, setSavedUser] = useState({ name: '', email: '' });
  const [draftUser, setDraftUser] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const account = {
        ...savedUser,
        name: savedUser.name || [savedUser.first_name, savedUser.last_name].filter(Boolean).join(' '),
        email: savedUser.email || '',
      };
      setSavedUser(account);
      setDraftUser({ name: account.name, email: account.email });
    } catch {
      setSavedUser({ name: '', email: '' });
      setDraftUser({ name: '', email: '' });
    }
  }, []);

  const updateField = (event) => {
    setDraftUser((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      const response = await updateProfile(userId, draftUser);
      const updatedUser = { ...savedUser, ...response.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSavedUser(updatedUser);
      setDraftUser({ name: updatedUser.name, email: updatedUser.email });
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(error.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Profile" />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
        </div>

        {/* Page Content */}
        <div className="px-6 py-6 max-w-3xl space-y-6">

          {/* Account Information */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Account Information</h2>
            </div>
            <div className="px-6 py-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Name:</span> {savedUser.name || 'Not available'}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Email:</span> {savedUser.email || 'Not available'}
              </p>
            </div>
          </div>

          {/* Update Profile */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Update Profile</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={draftUser.name}
                  onChange={updateField}
                  placeholder="Enter your name"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={draftUser.email}
                  onChange={updateField}
                  placeholder="Enter your email"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                />
              </div>
              <button onClick={saveProfile} disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {message && <p className="text-sm text-green-600">{message}</p>}
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Change Password</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <button className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors">
                Update Password
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;