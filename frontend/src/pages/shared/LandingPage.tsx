import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '📷',
    title: 'AI-Powered Detection',
    desc: 'Snap a photo of your items. Our YOLOv8 AI instantly identifies and categorises them for donation.',
  },
  {
    icon: '🤝',
    title: 'Intelligent Matching',
    desc: 'Our matching engine scores donations against NGO demands — connecting the right items to the right organisations.',
  },
  {
    icon: '🚚',
    title: 'Seamless Pickups',
    desc: 'Schedule pickups in seconds. Track status from scheduled to delivered, all in one place.',
  },
  {
    icon: '📊',
    title: 'Real-time Analytics',
    desc: 'Donors, NGOs and admins each get role-specific dashboards with live stats and trend charts.',
  },
  {
    icon: '🏢',
    title: 'NGO Demand Management',
    desc: 'NGOs post what they need with urgency levels. Donors see exactly where their items are most impactful.',
  },
  {
    icon: '🔔',
    title: 'Instant Notifications',
    desc: 'Get notified at every step — match found, accepted, pickup scheduled, donation completed.',
  },
]

const STATS = [
  { value: '10,000+', label: 'Items Donated' },
  { value: '500+',    label: 'NGOs Onboarded' },
  { value: '95%',     label: 'Match Success Rate' },
  { value: '48 hrs',  label: 'Average Match Time' },
]

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0B0F14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1D8CF8] text-sm font-bold text-white">D</div> DonateAI
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#A1A8B3] sm:flex">
          <a href="#features" className="hover:text-[#1D8CF8] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#1D8CF8] transition-colors">How it Works</a>
          <a href="#stats" className="hover:text-[#1D8CF8] transition-colors">Impact</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-[#A1A8B3] hover:bg-white/[0.06] hover:text-white transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="rounded-lg bg-[#1D8CF8] px-4 py-2 text-sm font-medium text-white hover:bg-[#3AA0FF] transition-colors">
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B0F14] via-[#0d1420] to-[#0B0F14] dark:from-[#0B0F14] dark:via-[#0d1420] dark:to-[#0B0F14] py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#1D8CF8]/10 px-4 py-1.5 text-sm font-medium text-[#1D8CF8] mb-6">
          🤖 Powered by YOLOv8 AI
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight">
          Donate Smarter.<br />
          <span className="text-[#1D8CF8]">Impact More.</span>
        </h1>
        <p className="mt-6 text-lg text-[#A1A8B3] max-w-2xl mx-auto">
          The AI-powered donation platform that connects donors with NGOs intelligently.
          Snap a photo, let AI detect your items, and get matched with the organisations that need them most.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/register" className="rounded-xl bg-[#1D8CF8] px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-[#3AA0FF] transition-colors">
            Start Donating Free
          </Link>
          <Link to="/login" className="rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-[#A1A8B3] hover:bg-white/[0.06] hover:text-white transition-colors">
            Sign in to your account
          </Link>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="bg-[#0B0F14] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Everything you need to donate with impact</h2>
          <p className="mt-4 text-[#A1A8B3]">A complete platform for donors, NGOs, and administrators.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-white/[0.08] bg-[#171B22] p-6">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-[#A1A8B3]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Register & Verify', desc: 'Create a donor or NGO account. NGOs go through a quick admin verification.' },
    { num: '02', title: 'Capture Your Items', desc: 'Use the camera feature to photograph items. AI auto-detects and categorises them.' },
    { num: '03', title: 'Get Matched', desc: 'Our scoring engine matches your donation to the NGO demands that fit best.' },
    { num: '04', title: 'Schedule Pickup', desc: 'Confirm the match, schedule a pickup, and track it to completion.' },
  ]
  return (
    <section id="how-it-works" className="bg-[#0d1118] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">How it works</h2>
          <p className="mt-4 text-[#A1A8B3]">From photo to delivery in four simple steps.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(s => (
            <div key={s.num} className="rounded-2xl bg-[#171B22] border border-white/[0.08] p-6">
              <span className="text-3xl font-extrabold text-[#1D8CF8]">{s.num}</span>
              <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-[#A1A8B3]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section id="stats" className="bg-[#1D8CF8] py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-extrabold text-white">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-blue-100">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="bg-[#0B0F14] py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-bold text-white">Ready to make a difference?</h2>
        <p className="mt-4 text-[#A1A8B3]">Join thousands of donors and NGOs already using DonateAI.</p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link to="/register?role=donor" className="rounded-xl bg-[#1D8CF8] px-8 py-3.5 text-base font-semibold text-white hover:bg-[#3AA0FF] transition-colors">
            I want to donate
          </Link>
          <Link to="/register?role=ngo" className="rounded-xl border border-[#1D8CF8] px-8 py-3.5 text-base font-semibold text-[#1D8CF8] hover:bg-[#1D8CF8]/10 transition-colors">
            Register my NGO
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0d1118] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2 text-white font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1D8CF8] text-xs font-bold text-white">D</div> DonateAI
        </div>
        <p className="text-sm text-[#6B7280]">© {new Date().getFullYear()} DonateAI. Built with ❤️ for social impact.</p>
        <div className="flex gap-4 text-sm">
          <Link to="/login" className="text-[#A1A8B3] hover:text-[#1D8CF8] transition-colors">Sign in</Link>
          <Link to="/register" className="text-[#A1A8B3] hover:text-[#1D8CF8] transition-colors">Register</Link>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <StatsSection />
      <CTA />
      <Footer />
    </div>
  )
}
