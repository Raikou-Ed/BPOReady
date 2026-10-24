import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="w-full font-poppins">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">BPOReady</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-green-500 font-semibold">Home</Link>
            <Link to="#features" className="text-gray-600 hover:text-gray-800">Features</Link>
            <Link to="#how-it-works" className="text-gray-600 hover:text-gray-800">How It Works</Link>
            <Link to="#about" className="text-gray-600 hover:text-gray-800">About</Link>
            <Link to="#contact" className="text-gray-600 hover:text-gray-800">Contact</Link>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/Login"
              className="px-6 py-2 text-blue-600 font-semibold hover:text-blue-700"
            >
              Log In
            </Link>
            <Link to="/Register">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Prepare for BPO Interviews with Confidence
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">
            Practice paragraph reading, improve your speech, and train for mock interviews with AI-powered feedback.
          </p>
          <Link to="/Dashboard">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-md transition-all">
              Get Started
            </button>
          </Link>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Key Features</h2>
            <p className="text-lg text-gray-600">
              Discover the core tools of BPOReady designed to help BPO applicants improve their communication skills, build confidence, and prepare effectively for job interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Paragraph Reading Practice</h3>
              <p className="text-gray-600 text-sm">Practice reading predefined passages in Easy, Medium, and Hard levels to improve fluency, pronunciation, and speech delivery.</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c3.314 0 6-1.343 6-3s-2.686-3-6-3-6 1.343-6 3 2.686 3 6 3zM12 8v7m0 0c-3.314 0-6 1.343-6 3s2.686 3 6 3 6-1.343 6-3-2.686-3-6-3zm6-8v10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Speech Analysis</h3>
              <p className="text-gray-600 text-sm">Analyze recorded responses to detect filler words, pacing, grammar issues and other common speech flows.</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Mock Interview Simulation</h3>
              <p className="text-gray-600 text-sm">Practice answering BPQ interview questions in a structured interview environment.</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Performance Summary</h3>
              <p className="text-gray-600 text-sm">View feedback, evaluation results, and progress reports to monitor improvement over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">
              How It <span className="text-blue-600">Works?</span>
            </h2>
            <p className="text-lg text-gray-600">
              BPOReady guides BPO applicants through a simple step-by-step process to improve communication skills and prepare for interviews effectively.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-24 h-24 rounded-full bg-blue-400 flex items-center justify-center text-white text-4xl font-bold mb-6">1</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Practice Your Skills</h3>
              <p className="text-gray-600">Choose a training module such as paragraph reading or mock interview simulation to start improving your communication.</p>
            </div>
            <div className="hidden md:block w-12 h-1 bg-gray-300"></div>
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold mb-6">2</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Record and Submit Responses</h3>
              <p className="text-gray-600">Speak your answers using the recording feature and submit your responses for analysis.</p>
            </div>
            <div className="hidden md:block w-12 h-1 bg-gray-300"></div>
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-white text-4xl font-bold mb-6">3</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Receive Feedback</h3>
              <p className="text-gray-600">Get instant feedback on your speech, including grammar, filler words, pacing, and confidence, and use it to improve your performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto">
            <div className="md:w-1/2">
              <div className="bg-blue-100 rounded-lg p-8 flex items-center justify-center h-80">
                <svg className="w-full h-full text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold text-gray-800 mb-6">About Us</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                BPOReady is a web-based interview coaching system that helps BPO applicants improve their communication skills through speech analysis, practice modules, and automated feedback.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our platform combines the latest in AI-driven speech analysis with intuitive practice tools to help you prepare confidently for your BPO interviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-blue-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">BPOReady</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-gray-700 font-semibold">QuodSync</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-gray-700 font-semibold">QuodSync@gmail.com</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-6 text-center text-gray-600">
            <p>© 2026 BPOReady. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;