import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, saveAuthenticatedUser } from "../api/authApi";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    agreedToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.agreedToTerms) {
      setError('Please agree to the Terms and Conditions to proceed.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      };
      const data = await registerUser(payload);
      ['bpoReadyAssessment', 'bpoReadyActivity'].forEach((key) => localStorage.removeItem(key));
      saveAuthenticatedUser(data);
      navigate('/Dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-tight">BPOReady</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
            Create Account
          </h2>
          <p className="text-center text-gray-500 text-sm mb-8">
            Sign up to start practicing your interview skills
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name & Middle Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={updateField}
                  required
                  placeholder="e.g. Juan"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={form.middle_name}
                  onChange={updateField}
                  placeholder="e.g. Santos"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={updateField}
                required
                placeholder="e.g. Dela Cruz"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                required
                placeholder="juan.delacruz@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={updateField}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={updateField}
                required
                minLength={6}
                placeholder="Re-type your password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                name="agreedToTerms"
                checked={form.agreedToTerms}
                onChange={updateField}
                required
                className="mt-1 w-4 h-4 border border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-gray-600 select-none cursor-pointer leading-relaxed">
                I agree to the <span className="text-blue-600 font-medium hover:underline">Terms and Conditions</span> and Privacy Policy
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-lg font-semibold text-sm transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Log In Link */}
          <p className="text-center text-xs text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/Login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
