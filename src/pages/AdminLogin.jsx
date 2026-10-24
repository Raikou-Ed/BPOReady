import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, saveAuthenticatedUser } from "../api/authApi";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginAdmin(form);
      saveAuthenticatedUser(data);
      navigate('/AdminDashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins py-12">
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-800">BPOReady</span>
          </div>
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600">Administrator Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
            Admin <span className="text-blue-600">Sign In</span>
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            Authorized personnel only. Enter your administrative credentials.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Admin Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="admin@bpoready.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-60 text-sm mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
