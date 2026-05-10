import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  ArrowRight, Download, BookOpen, Zap, BarChart3,
  Bookmark, Target, Layers
} from 'lucide-react';

const HomePage = () => {
  const { user } = useContext(AuthContext);

  const features = [
    {
      icon: <Bookmark size={24} />,
      title: 'One-Click Save',
      description: 'Save any LeetCode problem instantly from your browser with our Chrome extension.',
      color: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/20',
    },
    {
      icon: <Layers size={24} />,
      title: 'Smart Organization',
      description: 'Auto-categorize problems by topic tags — Arrays, DP, Graphs and more.',
      color: 'from-blue-500 to-indigo-500',
      shadowColor: 'shadow-blue-500/20',
    },
    {
      icon: <Target size={24} />,
      title: 'Revision Tracking',
      description: 'Track solved status and build a revision queue for consistent practice.',
      color: 'from-violet-500 to-purple-500',
      shadowColor: 'shadow-violet-500/20',
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Progress Insights',
      description: 'Visualize your progress across difficulties and topics at a glance.',
      color: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden" id="hero-section">
        {/* Background Effects */}
        <div className="hero-glow" />
        <div className="hero-glow-secondary" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative max-w-[1280px] mx-auto px-6 pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            {/* <div className="animate-fade-in mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
                Built for LeetCode Enthusiasts — CodeMark
              </span>
            </div> */}

            {/* Heading */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 animate-fade-in"
              style={{ animationDelay: '100ms' }}
            >
              <span className="text-white">Save, Organize &</span>
              <br />
              <span className="gradient-text-primary">Master LeetCode</span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg text-white/50 max-w-[560px] leading-relaxed mb-10 animate-fade-in"
              style={{ animationDelay: '200ms' }}
            >
              Clip problems in one click, auto-organize by topic, and build a
              personalized revision system to ace your coding interviews.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in"
              style={{ animationDelay: '300ms' }}
            >
              <a
                href="#"
                id="cta-add-to-chrome"
                className="group inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                <Download size={20} />
                Add to Chrome
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              {user ? (
                <Link
                  to="/dashboard"
                  id="cta-dashboard"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-white/70 font-medium rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] hover:text-white transition-all duration-200"
                >
                  <BookOpen size={18} />
                  Open Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  id="cta-sign-in"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-white/70 font-medium rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] hover:text-white transition-all duration-200"
                >
                  Sign In to Dashboard
                </Link>
              )}
            </div>

            {/* Stats Bar */}
            {/* <div
              className="mt-16 flex items-center gap-8 sm:gap-12 text-center animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              {[
                { value: '10K+', label: 'Problems Saved' },
                { value: '1K+', label: 'Active Users' },
                { value: '50+', label: 'Topic Tags' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/35 mt-1">{stat.label}</div>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section className="relative py-24 md:py-32" id="features-section">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to{' '}
              <span className="gradient-text-primary">stay consistent</span>
            </h2>
            <p className="text-white/40 text-base max-w-[480px] mx-auto">
              From saving problems to tracking revision — we've got your entire LeetCode workflow covered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="glass-card p-6 group cursor-default transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
                id={`feature-card-${idx}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg ${feature.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Banner */}
      <section className="relative py-20" id="cta-section">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <div className="glass-card p-10 sm:p-14 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
            <div className="relative">
              <Zap size={36} className="text-emerald-400 mx-auto mb-5 animate-float" />
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to supercharge your prep?
              </h3>
              <p className="text-white/40 text-sm sm:text-base mb-8 max-w-[420px] mx-auto">
                Join thousands of developers who use CodeMark to organize and master their coding interview prep.
              </p>
              <a
                href="#"
                id="cta-bottom-chrome"
                className="group inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <Download size={18} />
                Get Started — It's Free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-[1000px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-white/25">
            © {new Date().getFullYear()} CodeMark. Built for learners.
          </span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">Privacy</a>
            <a href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">Terms</a>
            <a href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
