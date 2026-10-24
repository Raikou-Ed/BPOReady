import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, saveAuthenticatedUser } from "../api/authApi";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(form);
      saveAuthenticatedUser(data);
      if (data?.user?.role === 'admin' || data?.user?.role === 'super_admin') {
        navigate('/AdminDashboard');
      } else {
        navigate('/Dashboard');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins">
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-800">BPOReady</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
            Welcome Back to <span className="text-blue-600">BPOReady</span>
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Sign in to your account to continue.
          </p>

          <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-6">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              placeholder="Email Address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 border border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot Password?
            </Link>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          {/* Login Button */}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-semibold transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-60">
            {loading ? 'Logging In...' : 'Log In'}
          </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/Register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
