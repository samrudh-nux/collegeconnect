"use client";

import { useState } from "react";
import {
  ExternalLink,
  GraduationCap,
  Search,
  Lightbulb,
  Zap,
  Ghost
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   DATA: 28 Academic and Professional Shards
───────────────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  "All",
  "Scholarships",
  "CSE Courses",
  "Startup Schools",
  "YouTube Channels",
] as const;

type Category = (typeof CATEGORIES)[number];

interface Resource {
  id: number;
  category: Exclude<Category, "All">;
  title: string;
  description: string;
  url: string;
  badge?: string;
  icon: string;
}

const RESOURCES: Resource[] = [
  // ── Scholarships ─────────────────────────────────────────────────────────
  {
    id: 1, category: "Scholarships",
    title: "Google Generation Scholarship",
    description: "Google's scholarship for aspiring CS students from underrepresented groups in APAC and India.",
    url: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
    badge: "₹75,000", icon: "🎓",
  },
  {
    id: 2, category: "Scholarships",
    title: "Reliance Foundation Undergraduate",
    description: "Merit-based scholarships for Indian students in engineering and technology programs.",
    url: "https://scholarships.reliancefoundation.org/",
    badge: "Fully Funded", icon: "🏆",
  },
  {
    id: 3, category: "Scholarships",
    title: "AICTE Pragati & Saksham",
    description: "Government scholarship for girl students and differently-abled students in technical programs.",
    url: "https://www.aicte-india.org/schemes/students-development-schemes",
    badge: "₹50,000/yr", icon: "🇮🇳",
  },
  {
    id: 4, category: "Scholarships",
    title: "GitHub Education Student Pack",
    description: "Free access to 100+ developer tools, GitHub Pro, and premium courses.",
    url: "https://education.github.com/pack",
    badge: "$200k+ tools", icon: "🐙",
  },
  {
    id: 5, category: "Scholarships",
    title: "AWS Educate",
    description: "Free cloud learning for students with credits and job-ready skills in AWS cloud computing.",
    url: "https://aws.amazon.com/education/awseducate/",
    badge: "Cloud Credits", icon: "☁️",
  },
  {
    id: 6, category: "Scholarships",
    title: "Microsoft TEALS",
    description: "Scholarship program supporting students interested in computer science education.",
    url: "https://microsoft.com/en-us/teals",
    badge: "Free", icon: "🪟",
  },

  // ── CSE Courses ───────────────────────────────────────────────────────────
  {
    id: 7, category: "CSE Courses",
    title: "CS50 — Harvard University",
    description: "Harvard's legendary intro CS course covering C, Python, SQL, and JavaScript.",
    url: "https://cs50.harvard.edu/x/",
    badge: "Certificate", icon: "🏛️",
  },
  {
    id: 8, category: "CSE Courses",
    title: "The Odin Project",
    description: "Full-stack web dev curriculum with project-based learning. Completely free.",
    url: "https://www.theodinproject.com/",
    badge: "Open Source", icon: "⚔️",
  },
  {
    id: 9, category: "CSE Courses",
    title: "MIT OCW — EECS",
    description: "MIT's free lecture notes, exams, and problem sets for CS courses.",
    url: "https://ocw.mit.edu/search/?d=Electrical+Engineering+and+Computer+Science",
    badge: "MIT Quality", icon: "🔬",
  },
  {
    id: 10, category: "CSE Courses",
    title: "freeCodeCamp Curriculum",
    description: "2,000+ hours of free coding certifications: Web Design, JS, Python.",
    url: "https://www.freecodecamp.org/learn",
    badge: "Certification", icon: "🔥",
  },
  {
    id: 11, category: "CSE Courses",
    title: "NPTEL — IIT & IISc Courses",
    description: "India's premier free online courses with verifiable certificates for all CS/IT subjects.",
    url: "https://nptel.ac.in/",
    badge: "IIT Faculty", icon: "🇮🇳",
  },
  {
    id: 12, category: "CSE Courses",
    title: "Google Tech Dev Guide",
    description: "Google's own curated learning path for CS students — DSA and Interview prep.",
    url: "https://techdevguide.withgoogle.com/",
    badge: "By Google", icon: "🔵",
  },
  {
    id: 13, category: "CSE Courses",
    title: "Stanford ML Specialization",
    description: "Andrew Ng's world-famous Machine Learning course from Stanford.",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    badge: "Free Audit", icon: "🤖",
  },
  {
    id: 14, category: "CSE Courses",
    title: "Neetcode — DSA Roadmap",
    description: "Structured DSA roadmap and free video explanations for LeetCode.",
    url: "https://neetcode.io/roadmap",
    badge: "Placement", icon: "📊",
  },

  // ── Startup Schools ───────────────────────────────────────────────────────
  {
    id: 15, category: "Startup Schools",
    title: "Y Combinator Startup School",
    description: "YC's free online program teaching you how to start a startup.",
    url: "https://www.startupschool.org/",
    badge: "YC", icon: "🚀",
  },
  {
    id: 16, category: "Startup Schools",
    title: "YC Startup Library",
    description: "All of YC's advice in one place — essays from Paul Graham and talks.",
    url: "https://www.ycombinator.com/library",
    badge: "YC", icon: "📚",
  },
  {
    id: 17, category: "Startup Schools",
    title: "How to Start a Startup",
    description: "Sam Altman's legendary Stanford CS183 course with top founder talks.",
    url: "https://startupclass.samaltman.com/",
    badge: "Stanford", icon: "🌟",
  },
  {
    id: 18, category: "Startup Schools",
    title: "First Round Review",
    description: "Tactical advice from First Round Capital on building product and hiring.",
    url: "https://review.firstround.com/",
    badge: "VC Insights", icon: "💡",
  },
  {
    id: 19, category: "Startup Schools",
    title: "Startup India Hub",
    description: "Government of India's free learning portal for aspiring entrepreneurs.",
    url: "https://learning.startupindia.gov.in/",
    badge: "India Gov", icon: "🇮🇳",
  },
  {
    id: 20, category: "Startup Schools",
    title: "Antler Insights",
    description: "Startup knowledge from one of the world's most active early-stage VCs.",
    url: "https://www.antler.co/blog",
    badge: "Global VC", icon: "🦌",
  },

  // ── YouTube Channels ──────────────────────────────────────────────────────
  {
    id: 21, category: "YouTube Channels",
    title: "freeCodeCamp.org",
    description: "Full-length programming courses on YouTube. 100% free.",
    url: "https://www.youtube.com/@freecodecamp",
    badge: "9M+ subs", icon: "▶️",
  },
  {
    id: 22, category: "YouTube Channels",
    title: "Bro Code",
    description: "Fast-paced, beginner-friendly tutorials for Python, Java, C++.",
    url: "https://www.youtube.com/@BroCodez",
    badge: "5M+ subs", icon: "👨‍💻",
  },
  {
    id: 23, category: "YouTube Channels",
    title: "Traversy Media",
    description: "Brad Traversy's crash courses on modern web development.",
    url: "https://www.youtube.com/@TraversyMedia",
    badge: "2M+ subs", icon: "🌐",
  },
  {
    id: 24, category: "YouTube Channels",
    title: "Fireship",
    description: "100-second concept videos for staying updated on dev tools.",
    url: "https://www.youtube.com/@Fireship",
    badge: "4M+ subs", icon: "⚡",
  },
  {
    id: 25, category: "YouTube Channels",
    title: "Apna College",
    description: "India's top coding channel for DSA and placement preparation.",
    url: "https://www.youtube.com/@ApnaCollegeOfficial",
    badge: "5M+ subs", icon: "🎯",
  },
  {
    id: 26, category: "YouTube Channels",
    title: "Code With Harry",
    description: "Hindi tutorials on Python, Web Dev, DSA, and more.",
    url: "https://www.youtube.com/@CodeWithHarry",
    badge: "6M+ subs", icon: "🧙",
  },
  {
    id: 27, category: "YouTube Channels",
    title: "Tech With Tim",
    description: "Python-focused tutorials including game dev and AI/ML.",
    url: "https://www.youtube.com/@TechWithTim",
    badge: "1M+ subs", icon: "🐍",
  },
  {
    id: 28, category: "YouTube Channels",
    title: "NetworkChuck",
    description: "Networking, Linux, and ethical hacking tutorials made fun.",
    url: "https://www.youtube.com/@NetworkChuck",
    badge: "3M+ subs", icon: "🔒",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   THEME CONFIG
───────────────────────────────────────────────────────────────────────────── */

const CAT_CONFIG: Record<
  Exclude<Category, "All">,
  { glow: string; border: string; pill: string; accent: string }
> = {
  Scholarships: {
    glow: "shadow-lg shadow-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/50",
    pill: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
    accent: "text-emerald-600",
  },
  "CSE Courses": {
    glow: "shadow-lg shadow-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-500/50",
    pill: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
    accent: "text-blue-600",
  },
  "Startup Schools": {
    glow: "shadow-lg shadow-orange-500/10",
    border: "border-orange-500/20 hover:border-orange-500/50",
    pill: "bg-orange-500/10 text-orange-700 border border-orange-500/20",
    accent: "text-orange-600",
  },
  "YouTube Channels": {
    glow: "shadow-lg shadow-red-500/10",
    border: "border-red-500/20 hover:border-red-500/50",
    pill: "bg-red-500/10 text-red-700 border border-red-500/20",
    accent: "text-red-600",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE: Venture Catalog
───────────────────────────────────────────────────────────────────────────── */

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filtered = RESOURCES.filter((r) => {
    const matchCat = activeCategory === "All" || r.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const grouped = activeCategory === "All"
      ? (CATEGORIES.slice(1) as Exclude<Category, "All">[])
          .map((cat) => ({
            cat,
            items: filtered.filter((r) => r.category === cat),
          }))
          .filter((g) => g.items.length > 0)
      : null;

  return (
    <>
      <style>{`
        .cc-root { font-family: 'Rajdhani', sans-serif; }
        .cc-mono { font-family: 'Orbitron', monospace; }

        .pill-active {
          background: hsl(var(--primary));
          border: 2px solid hsl(var(--primary));
          color: white;
          box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
          font-weight: 800;
          transform: scale(1.05);
        }
        .pill-inactive {
          background: #1e293b; 
          border: 2px solid #334155;
          color: white;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .pill-inactive:hover {
          background: #0f172a;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="cc-root min-h-screen pb-24 bg-background/50">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-5 flex-1">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="cc-mono text-3xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                    VENTURE CATALOG
                  </h1>
                  <p className="text-[11px] tracking-[0.4em] mt-1.5 uppercase font-black text-muted-foreground/60">
                    Verified Student Resource Matrix
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                <input
                  type="text"
                  placeholder="Scan Resource Database..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-6 py-3.5 rounded-2xl text-sm w-full lg:w-96 transition-all font-bold tracking-tight bg-card border-2 border-border/50 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8 overflow-x-auto pb-2 no-scrollbar" style={{ scrollbarWidth: "none" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`cc-mono flex-shrink-0 px-8 py-3 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase transition-all ${
                    activeCategory === cat ? "pill-active" : "pill-inactive"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 space-y-16">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-48 gap-6 opacity-20 animate-pulse">
                <Ghost className="h-20 w-20 text-foreground" />
                <p className="cc-mono text-center tracking-[0.4em] text-sm font-black uppercase">// Zero Nodes Indexed</p>
            </div>
          )}

          {grouped
            ? grouped.map(({ cat, items }) => (
                <CatalogSection key={cat} cat={cat} items={items} />
              ))
            : filtered.length > 0 && (
                <CatalogSection
                  cat={activeCategory as Exclude<Category, "All">}
                  items={filtered}
                />
              )}

          <div className="p-12 rounded-[3rem] border-2 border-dashed border-primary/10 bg-primary/[0.02] flex flex-col sm:flex-row items-center gap-10 shadow-inner">
            <div className="h-20 w-20 rounded-[1.5rem] flex items-center justify-center bg-primary/10 border-2 border-primary/20 flex-shrink-0 shadow-inner">
              <Lightbulb className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="text-center sm:text-left space-y-2">
              <p className="text-xl font-black italic tracking-tighter text-foreground uppercase">
                Resources are cryptographically verified via the <span className="text-primary italic">CollegeConnect Initiative</span>.
              </p>
              <p className="cc-mono text-[10px] uppercase tracking-[0.5em] font-black text-muted-foreground/40">
                Sync Status: Operational · High-Fidelity Data
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CatalogSection({ cat, items }: { cat: Exclude<Category, "All">, items: Resource[] }) {
  const cfg = CAT_CONFIG[cat];
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6 mb-10">
        <div className="flex items-center gap-4">
            <Zap className={cn("h-6 w-6", cfg.accent)} />
            <h2 className={cn("cc-mono text-lg font-black tracking-[0.5em] uppercase", cfg.accent)}>
              {cat}
            </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="cc-mono text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl bg-card border border-border/50 text-muted-foreground/60">
          {items.length} Nodes
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {items.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group rounded-[2rem] border-2 p-8 flex flex-col gap-6 bg-card transition-all hover:-translate-y-1 shadow-xl",
              cfg.border,
              cfg.glow
            )}
          >
            <div className="flex items-start justify-between">
              <div className="h-16 w-16 rounded-[1.2rem] bg-background border-2 border-border/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                {r.icon}
              </div>
              {r.badge && (
                <span className={cn("cc-mono text-[9px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-sm", cfg.pill)}>
                  {r.badge}
                </span>
              )}
            </div>
            <div className="space-y-4">
                <h3 className={cn("cc-mono font-black text-xl leading-tight uppercase italic tracking-tighter", cfg.accent)}>
                  {r.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground/80 line-clamp-3 italic">
                  "{r.description}"
                </p>
            </div>
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/30">
              <span className={cn("cc-mono text-[9px] font-black tracking-[0.3em] uppercase opacity-40 group-hover:opacity-100 transition-opacity", cfg.accent)}>Access Shard</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}