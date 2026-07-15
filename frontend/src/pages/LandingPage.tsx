import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Shield,
  Bot,
  PieChart,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Users,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const features = [
    {
      title: 'AI Financial Wealth Coach',
      desc: 'Ask our Gemini-powered AI advisor for real-time recommendations, savings plans, and custom investment ideas.',
      icon: Bot
    },
    {
      title: 'Dynamic Budgeting',
      desc: 'Set up category budgets and receive automated alerts before you overspend. Compare actuals vs targets in real-time.',
      icon: PieChart
    },
    {
      title: 'Clean Money Tracking',
      desc: 'Log and organize incomes, expenses, transfers, and recurring payments with robust searching and date filter tools.',
      icon: TrendingUp
    },
    {
      title: 'Bank-Grade Security',
      desc: 'Rest easy knowing all transaction records, tokens, and password configurations are heavily encrypted and secured.',
      icon: Shield
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter Pilot',
      price: 'Free',
      period: 'forever',
      desc: 'Essential budgeting tools for individuals just getting started.',
      features: ['Log unlimited transactions', 'Manual budgeting by category', 'Basic expense metrics charts', 'Weekly system notification alerts'],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Copilot Premium',
      price: '$9.99',
      period: 'per month',
      desc: 'Advanced intelligence for users serious about growing wealth.',
      features: ['Everything in Starter Pilot', 'Gemini AI Wealth Coach access', 'Predictive cash flow suggestions', 'Cloudinary receipt photo backups', 'CSV/PDF data report exports', 'Priority 24/7 client support'],
      cta: 'Start 14-Day Free Trial',
      popular: true
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Freelance Product Designer',
      quote: 'PocketPilot changed how I manage my volatile income. The AI suggestion dashboard helps me forecast next month\'s taxes effortlessly!',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    },
    {
      name: 'Michael Chen',
      role: 'Senior QA Engineer',
      quote: 'I used to track things in messy spreadsheets. PocketPilot\'s glassmorphic dashboards look fantastic and make budgeting a fun habit.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    }
  ];

  const faqs = [
    {
      q: 'How does the Gemini AI Coach work?',
      a: 'PocketPilot aggregates your categorized transactions, income flows, and active budget goals to build a contextual prompt. Our Gemini API integration analyzes this info to deliver tailored advice.'
    },
    {
      q: 'Is my financial data secure?',
      a: 'Absolutely. We enforce SSL encryption for transit data, secure JWT session hashes, helmet defensive security filters, and never store plaintext login passwords.'
    },
    {
      q: 'Can I cancel my premium subscription at any time?',
      a: 'Yes. You can manage your subscription plan directly under account settings. There are no locking contracts, and cancellations apply at the end of the billing period.'
    }
  ];

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-100 overflow-x-hidden">
      {/* Navbar overlay */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center font-bold text-white text-xl shadow-glow">
            P
          </div>
          <span className="font-outfit font-extrabold text-2xl tracking-tight">
            Pocket<span className="text-violet-400">Pilot</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 text-sm font-semibold transition"
          >
            {user ? 'Dashboard' : 'Log In'}
          </Link>
          {!user && (
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-sm font-semibold text-white shadow-glow transition"
            >
              Sign Up Free
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="px-3.5 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-6 inline-block">
            Introducing PocketPilot AI
          </span>
          <h1 className="font-outfit font-extrabold text-5xl md:text-7xl leading-tight text-white mb-6">
            Take Control of Your Wealth with <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-fuchsia-400">Intelligent AI</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            PocketPilot is the premium AI financial assistant that helps you monitor balances, configure budget limits, and chat with a wealth coach.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-base font-bold text-white shadow-glow flex items-center justify-center gap-2 group transition-all"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 rounded-xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 text-base font-semibold text-slate-300 transition flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </motion.div>

        {/* Dashboard Preview Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="w-full max-w-5xl mt-16 rounded-2xl border border-white/10 bg-slate-950/40 p-2.5 shadow-2xl relative overflow-hidden backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-xl overflow-hidden border border-white/5 bg-slate-900/60 aspect-[16/9] flex flex-col items-center justify-center p-8 relative">
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            {/* Visual preview representation of dashboard */}
            <div className="w-full max-w-lg glass-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4 text-left animate-float">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Balance</h4>
                  <p className="text-3xl font-extrabold font-outfit text-white mt-1">$14,845.50</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-brand-500" />
              </div>
              <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl flex gap-2.5 items-start">
                <Bot className="w-4 h-4 mt-0.5 text-brand-400" />
                <p className="text-xs text-brand-300 leading-relaxed font-medium">
                  "Your entertainment bills increased by 12% this week. I recommend moving $150 to your emergency savings goal."
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="font-outfit font-extrabold text-3xl md:text-5xl text-white mb-4">
            Everything You Need to Master Your Money
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Take benefit of modern, clean dashboard visualizations combined with state-of-the-art AI analytics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="glass-panel border border-white/5 rounded-2xl p-6 hover:border-violet-500/20 hover:scale-[1.02] transition duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-5 group-hover:bg-violet-500 group-hover:text-white transition duration-300">
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-lg text-white mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24 bg-gradient-premium border-y border-white/5 relative">
        <div className="text-center mb-16">
          <h2 className="font-outfit font-extrabold text-3xl md:text-5xl text-white mb-4 flex items-center justify-center gap-3">
            <Users className="w-8 h-8 text-violet-400" />
            Loved by Wealth Builders
          </h2>
          <p className="text-slate-400">What users say about our personal financial assistant.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((test) => (
            <div key={test.name} className="glass-panel border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-left">
              <p className="text-slate-300 italic text-sm leading-relaxed">"{test.quote}"</p>
              <div className="flex items-center gap-3.5 mt-2">
                <img
                  src={test.avatar}
                  alt={test.name}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{test.name}</h4>
                  <p className="text-slate-500 text-xs">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Table */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-outfit font-extrabold text-3xl md:text-5xl text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400">Choose the level of financial navigation you need.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 border text-left flex flex-col justify-between relative ${
                plan.popular
                  ? 'glass-panel border-violet-500/40 shadow-glow bg-slate-900/60'
                  : 'glass-panel border-white/5'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-violet-600 font-semibold text-[11px] uppercase text-white shadow-glow">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="font-outfit font-bold text-xl text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-slate-500 text-xs">/ {plan.period}</span>
                </div>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">{plan.desc}</p>
                <div className="w-full h-px bg-white/5 my-6" />
                <ul className="flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={user ? '/dashboard' : '/register'}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-center mt-8 transition ${
                  plan.popular
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-glow'
                    : 'border border-white/10 bg-slate-900/40 hover:bg-slate-900 text-slate-300'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordions */}
      <section className="max-w-4xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="font-outfit font-extrabold text-3xl text-white mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-semibold text-sm md:text-base text-white flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-violet-400" />
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen[idx] && (
                <div className="px-6 pb-5 text-xs md:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center font-bold text-white shadow-glow">
              P
            </div>
            <span className="font-outfit font-bold text-slate-200">PocketPilot</span>
          </div>
          <p>© 2026 PocketPilot Technologies Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:underline hover:text-slate-300">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
