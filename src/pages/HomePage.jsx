import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Smooth scroll handler with offset for sticky navbar
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("home");
      window.history.pushState(null, "", "/");
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const navOffset = 76;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
      window.history.pushState(null, "", `#${id}`);
    }
  };

  // Scroll spy to highlight active menu item based on viewport position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      const sections = ["contact", "about", "how-it-works", "features"];

      if (window.scrollY < 200) {
        setActiveSection("home");
        return;
      }

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el && scrollPosition >= el.offsetTop) {
          setActiveSection(sectionId);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Handle initial hash in URL on page load
    if (window.location.hash) {
      const targetId = window.location.hash.replace("#", "");
      setTimeout(() => {
        scrollToSection(targetId);
      }, 200);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setContactForm({
        name: "",
        email: "",
        subject: "General Inquiry",
        message: "",
      });
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 800);
  };

  return (
    <div className="w-full font-poppins text-gray-800 bg-white selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 transition-all">
        <div className="container mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => scrollToSection("home")}
            className="flex items-center gap-3 group"
          >
            <img
              src="/logo-icon.png"
              alt="BPOReady Logo"
              className="w-9 h-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
              BPO<span className="text-blue-600">Ready</span>
            </span>
          </Link>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              type="button"
              onClick={() => scrollToSection("home")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeSection === "home"
                  ? "text-blue-600 bg-blue-50/80 font-bold"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeSection === "features"
                  ? "text-blue-600 bg-blue-50/80 font-bold"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeSection === "how-it-works"
                  ? "text-blue-600 bg-blue-50/80 font-bold"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeSection === "about"
                  ? "text-blue-600 bg-blue-50/80 font-bold"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeSection === "contact"
                  ? "text-blue-600 bg-blue-50/80 font-bold"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              Contact
            </button>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-sm text-gray-700 font-semibold hover:text-blue-600 transition-colors"
            >
              Log In
            </Link>
            <Link to="/register">
              <button className="px-5 py-2 text-sm bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5 cursor-pointer">
                Sign Up
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-2 shadow-lg animate-fadeIn">
            <button
              type="button"
              onClick={() => scrollToSection("home")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeSection === "home" ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeSection === "features" ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeSection === "how-it-works" ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeSection === "about" ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeSection === "contact" ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              Contact
            </button>
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-100/70 border border-blue-200/60 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            AI-Powered BPO Speech & Interview Coaching
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Prepare for BPO Interviews with <span className="text-blue-600">Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Practice paragraph reading, master words-per-minute pacing, eliminate filler words, and simulate authentic customer calls with real-time AI feedback.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-full font-bold text-base hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer">
                Get Started Free
              </button>
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-gray-700 border border-gray-300 rounded-full font-semibold text-base hover:bg-gray-50 hover:text-blue-600 transition-all cursor-pointer"
            >
              Explore Features
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-10 border-t border-gray-100 text-left">
            <div className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl font-bold text-blue-600">130–145</span>
              <p className="text-xs text-gray-500 font-medium mt-1">Target BPO Speaking WPM</p>
            </div>
            <div className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl font-bold text-green-600">100%</span>
              <p className="text-xs text-gray-500 font-medium mt-1">Speech & Filler Word Detection</p>
            </div>
            <div className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl font-bold text-indigo-600">STAR</span>
              <p className="text-xs text-gray-500 font-medium mt-1">Method Interview Scoring</p>
            </div>
            <div className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl font-bold text-amber-600">Live</span>
              <p className="text-xs text-gray-500 font-medium mt-1">Call Simulation Studio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 md:py-28 bg-white border-t border-gray-100 scroll-mt-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
              Comprehensive Training Ecosystem
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
              Key Features Designed for BPO Success
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              Discover the core tools of BPOReady engineered to help candidates conquer language assessments, eliminate interview anxiety, and meet top contact-center hiring standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-7 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-13 h-13 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Paragraph Reading Practice</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Structured passages across Easy, Medium, and Hard difficulty levels. Measures pronunciation clarity, articulation, sentence mastery, and speech coverage.
              </p>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                Tiered Level Unlocking &rarr;
              </span>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-7 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-13 h-13 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Speech & Filler Word Drills</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Identifies disfluencies like "um", "uh", "you know", and "actually". Includes Words-Per-Minute cadences and customer grammar drills.
              </p>
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                Acoustic Phonetics Tracking &rarr;
              </span>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-7 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-13 h-13 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mock Interview Simulation</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Authentic Initial and Final behavioral interview sessions. Evaluates candidate composure, confidence, vocabulary, and STAR structure.
              </p>
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                Initial & Final Stages &rarr;
              </span>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-7 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-13 h-13 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Call Simulation Studio</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Interactive voice simulation of live customer calls (DSL Outage, Banking, Platinum Card). Evaluates customer empathy, resolution, and hold etiquette.
              </p>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                Voice-Driven Turn Exchanges &rarr;
              </span>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-7 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-13 h-13 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Reports & History</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Aggregated analytics displaying clarity scores, pacing cadence trends, filler reduction rates, and hiring readiness certifications.
              </p>
              <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                Live Data Aggregation &rarr;
              </span>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-7 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-13 h-13 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pre-Assessment Calibration</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Automated diagnostic benchmarking that establishes your baseline fluency tier and dynamically curates your training path.
              </p>
              <span className="text-xs font-semibold text-teal-600 flex items-center gap-1">
                Zero-Demotion Progression &rarr;
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-28 bg-gray-50/70 border-t border-gray-200/60 scroll-mt-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full">
              Structured Methodology
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
              How BPOReady Works
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              A guided 4-step pipeline designed to take candidates from foundational speech habits to interview mastery and certified call handling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm relative flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md mb-6">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pre-Assessment</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Take a diagnostic reading test to evaluate your baseline pacing, pronunciation, and grammatical clarity.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm relative flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md mb-6">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Targeted Speech Drills</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Work through filler word reduction exercises, paragraph reading tiers, and optimal WPM cadence drills.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm relative flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md mb-6">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Realistic Simulations</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Experience voice-driven customer interactions and structured behavioral mock interviews with STAR rubrics.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm relative flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md mb-6">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Insights & Ready</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Review instant multi-dimensional QA analytics and unlock certification as a fully prepared BPO candidate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 md:py-28 bg-white border-t border-gray-200/60 scroll-mt-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 max-w-6xl mx-auto">
            {/* Visual Image Card */}
            <div className="w-full lg:w-1/2 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 group">
                <img
                  src="/about-coaching.jpg"
                  alt="BPOReady Speech Coaching"
                  className="w-full h-[380px] md:h-[420px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">BPOReady AI Engine</p>
                      <p className="text-sm font-extrabold text-gray-900">Acoustic Clarity & WPM Metronome</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      Active Coaching
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* About Text Content */}
            <div className="w-full lg:w-1/2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                About QuadSync & BPOReady
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-6 leading-tight">
                Empowering Filipino Applicants to Excel in Global BPO Careers
              </h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-5">
                <strong>BPOReady</strong> is an AI-driven speech coaching and interview simulation platform developed by <strong>QuadSync</strong>. It addresses the critical communication hurdles faced by call center applicants, including filler words, speech anxiety, and inconsistent conversational pacing.
              </p>
              <p className="text-base text-gray-600 leading-relaxed mb-6">
                By combining automated speech recognition with natural language evaluation and real-world contact center call simulations, BPOReady provides an objective, supportive environment where applicants can practice repeatedly before facing hiring recruiters.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Objective AI Feedback</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Real Voice Simulation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span className="text-sm font-semibold text-gray-700">STAR Method Evaluation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Zero-Demotion System</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-28 bg-gray-50/80 border-t border-gray-200/60 scroll-mt-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full">
              Get in Touch
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
              Contact & Inquiries
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              Have questions about BPOReady, academic research partnerships, or platform support? Send us a message and our team will get back to you promptly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info Cards (Left Column) */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Direct Email</h4>
                  <p className="text-sm text-gray-500 mt-1">Official Project & Support</p>
                  <a href="mailto:QuadSync@gmail.com" className="text-sm font-semibold text-blue-600 hover:underline mt-2 inline-block">
                    QuadSync@gmail.com
                  </a>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Facebook Community</h4>
                  <p className="text-sm text-gray-500 mt-1">Development & Updates</p>
                  <span className="text-sm font-semibold text-gray-800 mt-2 inline-block">
                    QuadSync Project Team
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Support Schedule</h4>
                  <p className="text-sm text-gray-500 mt-1">Active Coaching Assistance</p>
                  <span className="text-sm font-medium text-gray-700 mt-2 inline-block">
                    Monday – Saturday, 8:00 AM – 6:00 PM PHT
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form (Right Column) */}
            <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-3xl border border-gray-200/90 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h3>
              <p className="text-sm text-gray-500 mb-6">
                Fill out the form below and we will respond to your registered email address.
              </p>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-center gap-3 animate-fadeIn">
                  <span className="text-lg">✓</span>
                  <div>
                    <strong>Thank you!</strong> Your inquiry has been submitted successfully. Our team will review your message and reply soon.
                  </div>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan Dela Cruz"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. juan@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Inquiry Topic
                  </label>
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white cursor-pointer"
                  >
                    <option value="General Inquiry">General Inquiry & Platform Overview</option>
                    <option value="Applicant Account Support">Applicant Practice Support & Audio Calibration</option>
                    <option value="BPO Training Center Collaboration">Institutional Demo & Academic Research</option>
                    <option value="Bug or Feedback Report">Bug Report or Feature Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your inquiry, question, or feedback..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending Message...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <img
                src="/logo-icon.png"
                alt="BPOReady Logo"
                className="w-8 h-8 object-contain drop-shadow-sm brightness-110"
              />
              <span className="text-xl font-extrabold text-white tracking-tight">
                BPO<span className="text-blue-500">Ready</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <button
                type="button"
                onClick={() => scrollToSection("home")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("how-it-works")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("about")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("contact")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Contact
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
            <p>© 2026 BPOReady. All rights reserved. Developed by QuadSync.</p>
            <p>Designed for BPO Applicant Communication Readiness & Assessment Mastery.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;