/* ============================================================
   PixelDev — data.js
   Single source of truth for ALL portfolio content.
   Edit this file to customize the site; desktop + mobile
   and the game world all read from here.
   ============================================================ */

const DATA = {

  /* ---------------- profile ---------------- */
  profile: {
    name: "Rakib",
    role: "Full Stack Developer",
    location: "Dhaka, Bangladesh",
    tagline: "A Living Pixel-Art World",
    intro:
      "Hi! I'm Rakib — a Full Stack Developer from Bangladesh. I like turning ideas into small, " +
      "polished products: clean interfaces up front, solid APIs and data behind them.",
    intro2:
      "Away from the keyboard I practise algorithms, tinker with automation and game dev, and " +
      "attempt the occasional bicycle kick. This site is a hand-built canvas game — have a wander.",
    interests: [
      { icon: "code",  text: "React · Next.js · Node.js" },
      { icon: "cap",   text: "Competitive programming practice" },
      { icon: "heart", text: "Football · Automation · AI" },
      { icon: "leaf",  text: "Always learning something new" }
    ],
    /* supplied real portfolio reference (used in "View All Projects") */
    moreUrl: "https://rakib-builds.pages.dev/"
  },

  /* ---------------- skills (complete, official spec) ---------------- */
  skills: [
    {
      category: "Programming Languages",
      items: ["JavaScript", "TypeScript", "C", "C++"]
    },
    {
      category: "Frontend Development",
      items: ["React.js", "Next.js", "Firebase", "Tailwind CSS", "shadcn/ui"]
    },
    {
      category: "Backend Development",
      items: ["Node.js", "Express.js", "Next.js API Routes"]
    },
    {
      category: "Databases & ORMs",
      items: ["MongoDB", "MySQL", "PostgreSQL", "Prisma", "Drizzle ORM"]
    },
    {
      category: "DevOps & Deployment",
      items: ["Git", "GitHub Actions", "CI/CD Pipelines", "Docker", "Vercel"]
    },
    {
      category: "CS Fundamentals",
      items: ["Data Structures and Algorithms (DSA)", "Problem Solving"]
    }
  ],

  /* ---------------- projects ---------------- */
  projects: [
    {
      id: "kickzone",
      name: "Kickzone",
      url: "https://kickzone-2sm.pages.dev/",
      desc: "Football jersey store — browse kits and shop the collection.",
      tags: ["Next.js", "Tailwind"],
      thumb: "kickzone"
    },
    {
      id: "jersey",
      name: "Jersey Store Demo",
      url: "https://jersey-store-demo.pages.dev/",
      desc: "E-commerce demo focused on product cards and cart flow.",
      tags: ["Next.js", "Framer"],
      thumb: "jersey"
    },
    {
      id: "forme",
      name: "Forme Studio",
      url: "https://forme-studio.pages.dev/",
      desc: "Modern e-commerce concept with a soft, editorial look.",
      tags: ["Next.js", "Framer"],
      thumb: "forme"
    },
    {
      id: "scentora",
      name: "Scentora",
      url: "https://scentora.pages.dev/",
      desc: "Perfume store concept — catalogue, product pages, cart.",
      tags: ["Next.js", "Tailwind"],
      thumb: "scentora"
    },
    {
      id: "pixeldev",
      name: "PixelDev (this site)",
      url: "",
      desc: "The interactive pixel-art world you're exploring right now — hand-painted canvas art, a tiny game engine and full portfolio UI in vanilla JS.",
      tags: ["HTML", "Canvas", "JavaScript"],
      thumb: "pixeldev"
    },
    {
      id: "odyssey",
      name: "Odyssey FC",
      url: "https://odessey-fc.pages.dev/",
      desc: "Official website of a football club — squad hub, news, trials and match section.",
      tags: ["Next.js", "Tailwind"],
      thumb: "odyssey"
    },
    {
      id: "interior",
      name: "Interior Flame by Dia",
      url: "https://interior-flame-by-dia.pages.dev/",
      desc: "Handcrafted art & décor store — paintings, embroidery hoops, custom frames and hand-painted attire.",
      tags: ["Next.js", "Tailwind"],
      thumb: "interior"
    },
    {
      id: "brittrade",
      name: "BritTrade",
      url: "https://brittrade.britsync.co.uk/",
      desc: "Automated crypto trading signals and an AI-powered futures trading platform.",
      tags: ["React", "Vite"],
      thumb: "brittrade"
    },
    {
      id: "classtg",
      name: "ClassTG",
      url: "https://classtg.pages.dev/login",
      desc: "Classroom coding lab — online code compiler with subject lessons and a student login.",
      tags: ["HTML", "Monaco Editor"],
      thumb: "classtg"
    },
    {
      id: "exclusive",
      name: "Exclusive Sources",
      url: "https://exclusivesources.online/",
      desc: "AI news and editorial digest — benchmarks, model breakdowns and engineering field reports.",
      tags: ["Next.js", "Tailwind"],
      thumb: "exclusive"
    }
  ],

  /* ---------------- achievements (honest, no fabricated stats) ---------------- */
  achievements: [
    {
      icon: "cap", title: "Competitive Programming",
      desc: "Ongoing algorithm practice — arrays, graphs, DP and friends.",
      meta: "Ongoing"
    },
    {
      icon: "users", title: "Null Pointers",
      desc: "Team participation — hackathons and projects built together with friends.",
      meta: "Team"
    },
    {
      icon: "code", title: "Web Development",
      desc: "Multiple real-world projects shipped as live sites.",
      meta: "Projects"
    },
    {
      icon: "chart", title: "Learning",
      desc: "AI · Automation · DevOps — steadily widening the toolkit.",
      meta: "Ongoing"
    },
    {
      icon: "ball", title: "Football",
      desc: "Play · Practice · Team.",
      meta: "For fun"
    }
  ],

  /* HackerRank skill certificates — verified skill awards (link out) */
  certificates: [
    {
      id: "rec-certificate",
      issuer: "HackerRank",
      title: "Frontend Developer (React)",
      url: "https://www.hackerrank.com/certificates/ca33237ee048"
    },
    {
      id: "js-certificate",
      issuer: "HackerRank",
      title: "JavaScript (Basic)",
      url: "https://www.hackerrank.com/certificates/d727f405c816"
    },
    {
      id: "node-certificate",
      issuer: "HackerRank",
      title: "Node (Basic)",
      url: "https://www.hackerrank.com/certificates/dc3045cbf007"
    },
    {
      id: "ps-certificate",
      issuer: "HackerRank",
      title: "Problem Solving (Basic)",
      url: "https://www.hackerrank.com/certificates/01dde2777e72"
    }
  ],

  /* in-game achievements — unlocked by actually playing, stored locally */
  gameAchievements: [
    { id: "first", icon: "play", title: "First Steps",  desc: "Move around the world for the first time." },
    { id: "visit", icon: "map",  title: "Explorer",    desc: "Open six different sections." },
    { id: "night", icon: "sound",title: "Night Owl",   desc: "Turn on the sound and enjoy the night." },
    { id: "read",  icon: "blog", title: "Bookworm",    desc: "Spend a while in the reading corner." },
    { id: "hello", icon: "mail", title: "Hello World", desc: "Reach out through the contact screen." }
  ],

  /* ---------------- blog (clearly-labelled SAMPLE content) ----------------
     Replace these entries with real posts. sample:true marks them.        */
  blogNote: "The posts below are sample content so you can preview the layout. Replace the `blog` list in scripts/data.js with real articles.",
  blog: [
    {
      id: "n8n",
      sample: true, date: "Oct 20, 2026",
      title: "How I use n8n for small automations",
      excerpt: "Little workflows that save minutes every day — webhooks, scrapes and scheduled jobs.",
      body: "This is sample content. Write here about the automation pipelines you build with n8n: the triggers, the nodes, the things that quietly save you time each week."
    },
    {
      id: "journey",
      sample: true, date: "Oct 15, 2026",
      title: "My journey into full stack development",
      excerpt: "From first HTML file to shipping products — the winding road so far.",
      body: "This is sample content. Tell the real story here: the first project, the first deploy, the bugs that taught you the most."
    },
    {
      id: "jstricks",
      sample: true, date: "Oct 10, 2026",
      title: "Top 10 JavaScript tricks I actually use",
      excerpt: "Short, practical patterns from everyday code — no clever-cleverness.",
      body: "This is sample content. List the patterns you genuinely reach for: optional chaining, structuredClone, Intl formatting, and friends."
    },
    {
      id: "jersey",
      sample: true, date: "Oct 5, 2026",
      title: "Building a football jersey store",
      excerpt: "Notes from building Kickzone — catalogue, filters and a friendly cart.",
      body: "This is sample content. Walk through how the store came together: the stack, the decisions, what you'd do differently."
    }
  ],

  /* ---------------- resume ----------------
     Drop your real PDF at assets/resume.pdf — the panel detects it and
     enables the download / view buttons automatically. Until then it
     shows an honest placeholder state.                                  */
  resume: {
    file: "assets/resume.pdf",
    note: "No resume PDF was found in the site assets yet. Add your file at assets/resume.pdf and refresh this page — the buttons below will enable automatically."
  },

  /* ---------------- contact (real details, live links) -- */
  contact: {
    name: "Rakibul Hasan Rakib",
    message: "Let's work together! I'm always open to new opportunities.",
    email: "rakibulhasanrakib2004@gmail.com",
    phone: "+8801646774173",              phoneLabel: "+880 1646 774173",
    linkedin: "https://www.linkedin.com/in/noobrakib/", linkedinHandle: "linkedin.com/in/noobrakib",
    github: "https://github.com/r-akib-77",             githubHandle: "github.com/r-akib-77",
    codeforces: "https://codeforces.com/profile/rakib_NP", codeforcesHandle: "codeforces.com/rakib_NP"
  },

  /* ---------------- navigation (order matters) ---------------- */
  nav: [
    { id: "about",        label: "About",        full: "About Me",     icon: "user",    accent: "#ff9f43" },
    { id: "skills",       label: "Skills",       full: "Skills",       icon: "gear",    accent: "#5cc8ff" },
    { id: "projects",     label: "Projects",     full: "Projects",     icon: "folder",  accent: "#ffd24a" },
    { id: "achievements", label: "Achievements", full: "Achievements", icon: "trophy",  accent: "#ffd24a", short: "Achiev." },
    { id: "blog",         label: "Blog",         full: "Blog",         icon: "blog",    accent: "#7fe07f" },
    { id: "resume",       label: "Resume",       full: "Resume",       icon: "resume",  accent: "#5cc8ff" },
    { id: "contact",      label: "Contact",      full: "Contact",      icon: "mail",    accent: "#ff7a6b" }
  ]
};
