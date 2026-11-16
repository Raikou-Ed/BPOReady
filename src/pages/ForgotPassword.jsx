import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendResetCode, verifyResetCode } from "../api/authApi";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step 1: Request Code | Step 2: Verify Code & Set Password
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Resend cooldown timer (60s)
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handler for Step 1: Send 6-digit OTP code to email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendResetCode({ email: email.trim().toLowerCase() });
      setStep(2);
      setCountdown(60);
      setSuccess(res?.message || "A 6-digit verification code has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for Step 2: Verify code and update password
  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError("");

    if (code.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("New password and confirmation password do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password,
        password_confirmation: passwordConfirmation,
      };
      const res = await verifyResetCode(payload);
      setSuccess(res?.message || "Password has been successfully reset! You can now log in.");
      setStep(3); // Completed state
    } catch (err) {
      setError(err.message || "Failed to reset password. Please check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins py-12 px-4">
      <div className="w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex flex-col items-center group">
            <img
              src="/logo-icon.png"
              alt="BPOReady Logo"
              className="w-16 h-16 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-3xl font-black text-gray-900 tracking-tight mt-2.5">
              BPO<span className="text-blue-600">Ready</span>
            </span>
            <span className="text-xs sm:text-sm font-semibold text-gray-500 tracking-wider uppercase mt-1">
              Practice Today, Perform Tomorrow.
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              {step === 1 ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : step === 2 ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? "Forgot Password?" : step === 2 ? "Enter Verification Code" : "Password Reset"}
            </h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              {step === 1
                ? "Enter your registered email and we'll send a 6-digit verification code to reset your password."
                : step === 2
                ? "We sent a 6-digit code to your inbox. Enter it below along with your new password."
                : "Your password has been successfully updated."}
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2.5">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner (when moving from Step 1 to Step 2) */}
          {success && step === 2 && (
            <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* STEP 1: Enter Email Form */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Registered Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="applicant@bpoready.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-60 text-sm mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending Verification Code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter Code & New Password Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              {/* Email Tag */}
              <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs">
                <span className="text-gray-600 truncate max-w-[240px]">
                  Recipient: <strong className="text-gray-900">{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-[11px]"
                >
                  Change
                </button>
              </div>

              {/* 6-Digit Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  6-Digit Verification Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg font-bold tracking-[8px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all"
                />
              </div>

              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  placeholder="Re-enter your new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-60 text-sm mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying & Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              {/* Resend Code Button */}
              <div className="text-center pt-2">
                {countdown > 0 ? (
                  <span className="text-xs text-gray-400">
                    Resend code available in <strong>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    Didn't receive the email? Resend code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: Complete Success State */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-base text-emerald-900">Password Reset Completed!</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Your new credentials are now active. You can immediately sign in to continue practicing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all text-sm"
              >
                Proceed to Sign In
              </button>
            </div>
          )}

          {/* Back to Sign In Link */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Remembered your password?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
