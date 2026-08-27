import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';

const features = [
  {
    icon: '🌾',
    title: 'Crop Selection',
    desc: 'Get AI-powered crop recommendations tailored to your soil type, climate, and farming goals.',
  },
  {
    icon: '🔬',
    title: 'Soil-Aware Advice',
    desc: 'Factor in your soil pH, texture, and conditions for precise agronomic guidance.',
  },
  {
    icon: '💧',
    title: 'Irrigation Planning',
    desc: 'Receive water management recommendations matched to your irrigation availability.',
  },
  {
    icon: '🛡️',
    title: 'Risk & Pest Guidance',
    desc: 'Understand potential risks, pest pressures, and preventive management strategies.',
  },
  {
    icon: '♻️',
    title: 'Sustainable Practices',
    desc: 'Get eco-friendly tips to conserve resources and improve long-term soil health.',
  },
  {
    icon: '📋',
    title: 'Advisory History',
    desc: 'Access all your previous advisories anytime to track decisions season by season.',
  },
];

const steps = [
  { num: '1', title: 'Create Your Account', desc: 'Sign up for free in seconds — no credit card required.' },
  { num: '2', title: 'Describe Your Farm', desc: 'Enter your location, soil type, land size, water availability, and season.' },
  { num: '3', title: 'Get AI Advisory', desc: 'Our AI analyzes your conditions and generates a structured, personalized crop plan.' },
  { num: '4', title: 'Make Informed Decisions', desc: 'Review recommendations with reasoning, risks, and sustainability tips — then consult your local expert.' },
];

export const Landing: React.FC = () => {
  const { user } = useAuthContext();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-300 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="text-2xl font-bold">CropSage</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance mb-6">
            Smarter Crop Decisions,<br />
            <span className="text-green-200">Powered by AI</span>
          </h1>
          <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            Enter your farm's soil, location, water, and season — get a personalized, structured crop advisory from Google Gemini AI in under a minute.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-green-700 hover:bg-green-50 transition-colors shadow-lg focus-ring"
            >
              Get Free Advisory
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors focus-ring"
            >
              Sign In
            </Link>
          </div>

          {/* Trust badge */}
          <p className="mt-8 text-sm text-green-200 opacity-80">
            🔒 Your farm data is private &amp; secure · Powered by Google Gemini AI
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-gray-50" aria-labelledby="features-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-3xl font-bold text-gray-900 mb-3">
              Everything a Modern Farmer Needs
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              CropSage combines your local farming knowledge with AI agricultural reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-card-md transition-shadow">
                <div className="text-3xl mb-3" aria-hidden="true">{f.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-white" aria-labelledby="how-it-works-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="how-it-works-heading" className="text-3xl font-bold text-gray-900 mb-3">
              How CropSage Works
            </h2>
            <p className="text-gray-600">Four simple steps to your personalized crop advisory.</p>
          </div>

          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-5 items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {step.num}
                </div>
                <div className="pt-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section className="py-12 bg-amber-50 border-t border-amber-100" aria-labelledby="disclaimer-heading">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="disclaimer-heading" className="text-base font-semibold text-amber-800 mb-3">⚠️ Agricultural Advisory Disclaimer</h2>
          <p className="text-sm text-amber-700 leading-relaxed">
            CropSage is an AI-powered decision-support tool designed to assist farmers in making informed crop-planning decisions.
            It is <strong>not a replacement</strong> for qualified agronomists, certified soil laboratories, or local agricultural extension officers.
            All AI-generated advisories contain uncertainty and should be validated with qualified local experts before implementation.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-green-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-green-200 mb-8">Create a free account and get your first AI crop advisory in minutes.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-green-700 hover:bg-green-50 transition-colors shadow-lg focus-ring"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};
