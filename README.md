<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=7C3AED&height=200&section=header&text=CollegeConnect&fontSize=70&fontColor=ffffff&fontAlignY=38&desc=meet%20·%20share%20·%20joy&descAlignY=58&descSize=22&descColor=A78BFA&animation=fadeIn" width="100%"/>

<br/>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-collegeconnect--samxv.vercel.app-7C3AED?style=for-the-badge&logoColor=white)](https://collegeconnect-samxv.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-99.4%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.x-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-34D399?style=for-the-badge)](LICENSE)

<br/>

> **A next-generation social platform built exclusively for college students.**  
> Real-time gaming · Peer networking · Academic intelligence — all in one Command Shard interface.

<br/>

<table>
<tr>
<td align="center"><b>🎭 Persona Matrix</b><br/>Snapchat-style avatar system</td>
<td align="center"><b>⚔️ Grandmaster Arena</b><br/>Chess · Snake · Speed Racing</td>
<td align="center"><b>🔔 Intelligence Hub</b><br/>Gmail-style unified feed</td>
<td align="center"><b>🏰 Kingdoms</b><br/>Secure group management</td>
<td align="center"><b>🚀 Venture Catalog</b><br/>Scholarships & courses</td>
</tr>
</table>

</div>

---

## 📌 Table of Contents

- [✨ Overview](#-overview)
- [🖼️ Screenshots](#️-screenshots)
- [⚡ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔥 Firebase Setup](#-firebase-setup)
- [🌐 Deployment](#-deployment)
- [📖 How to Use](#-how-to-use)
- [🤝 Contributing](#-contributing)
- [👤 Author](#-author)

---

## ✨ Overview

**CollegeConnect** is a full-stack, production-grade social platform engineered from the ground up for the modern college student. It tears down the fragmentation of juggling WhatsApp, LinkedIn, gaming apps, and scholarship portals — compressing everything into one dark, immersive **Command Shard** interface.

Built with **Next.js 15 App Router**, **Firebase** real-time infrastructure, **Google Genkit AI**, and a handcrafted UI system using **shadcn/ui + Tailwind CSS**, CollegeConnect is a showcase of what a student with serious engineering ambition can build.

```
🧩  Fragment No More.
    One platform. Five superpowers. Zero compromise.
```

---

## 🖼️ Screenshots

<div align="center">

| Dashboard — Command Shard | Grandmaster Arena |
|:---:|:---:|
| ![Dashboard](https://collegeconnect-samxv.vercel.app/og-dashboard.png) | ![Arena](https://collegeconnect-samxv.vercel.app/og-arena.png) |

| Venture Catalog | Kingdoms — Group Hub |
|:---:|:---:|
| ![Catalog](https://collegeconnect-samxv.vercel.app/og-catalog.png) | ![Kingdoms](https://collegeconnect-samxv.vercel.app/og-kingdoms.png) |

> 🔗 **[View the live platform →](https://collegeconnect-samxv.vercel.app)**

</div>

---

## ⚡ Features

### 🎭 Persona Matrix — Your Campus Identity
> *"Your avatar. Your legend."*

- 100+ cartoon & anime avatars in a Snapchat-style selection gallery
- Chosen persona syncs instantly across **all** features — games, groups, notifications
- **Global Student Search** — find any classmate by username or name in real-time
- Custom display names with verified student identity via Firebase Auth

---

### ⚔️ Grandmaster Arena — Competitive Gaming Hub
> *"Challenge. Compete. Dominate."*

- **♟️ Chess** — Real-time rated matches with ELO-based ranking powered by `chess.js`
- **🐍 Snake** — Compete for the global high score on a live leaderboard
- **🏎️ Speed Racing** — Time-trial races with immersive audio and lap-based rankings
- Challenge any student directly — notifications routed through the Intelligence Hub
- **Apex Predator** status unlocked for the #1 ranked player globally

---

### 🔔 Intelligence Hub — Unified Notification Feed
> *"Every transmission. One dashboard."*

- Gmail-inspired real-time notification aggregator
- Three notification types handled:
  - `⚔️  Combat Encounter` — incoming game challenges
  - `👥  Kingdom Recruitment` — group join requests for admins
  - `🏆  Apex Predator Alert` — #1 leaderboard achievement banner
- Powered by **Firestore real-time listeners** — zero polling, instant updates
- Action buttons route directly to the relevant module

---

### 🏰 Kingdoms — Group & Community Management
> *"Build your circle. Vet your recruits."*

- Create public or private student groups (Kingdoms)
- Admin-controlled join request approval system
- Real-time member management and group discovery
- Join requests appear live in the admin's Intelligence Hub feed
- Perfect for study circles, clubs, societies, and project teams

---

### 🚀 Venture Catalog — Academic Growth Engine
> *"Everything you need to level up. In one place."*

- **🎓 Scholarships** — Google Generation, Reliance Foundation, AICTE, GitHub Student Pack, AWS Educate
- **💻 CSE Courses** — CS50 Harvard, MIT OCW, NPTEL IIT, Stanford ML, Neetcode DSA
- **🚀 Startup Schools** — Y Combinator, First Round Capital, Startup India, Antler Insights
- **▶️ YouTube Channels** — freeCodeCamp, Fireship, Apna College, Code With Harry, NetworkChuck
- Live search + category filter system for instant discovery
- 28+ hand-curated resources, updated continuously

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | SSR, routing, server components |
| **Language** | TypeScript 5 (99.4%) | Type-safe, battle-hardened codebase |
| **Styling** | Tailwind CSS + shadcn/ui | Component system + utility-first CSS |
| **Auth** | Firebase Authentication | Verified student identity |
| **Database** | Cloud Firestore | Real-time NoSQL synchronization |
| **Storage** | Firebase Storage | Avatar & file transmission |
| **AI Engine** | Google Genkit v1.28 | Smart AI-powered suggestions |
| **Game Logic** | chess.js | In-browser chess engine |
| **Deployment** | Vercel | Global CDN, zero-config CI/CD |
| **UI Components** | Radix UI Primitives | Accessible, headless components |
| **Forms** | React Hook Form + Zod | Validated, type-safe forms |
| **Charts** | Recharts | Leaderboard & stats visualization |

</div>

---

## 📁 Project Structure

```
collegeconnect/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login / Signup flows
│   │   ├── dashboard/          # Command Shard home
│   │   ├── courses/            # Venture Catalog + Intelligence Hub
│   │   ├── games/              # Grandmaster Arena
│   │   ├── connect/            # Kingdoms & peer discovery
│   │   ├── leaderboard/        # Global rankings
│   │   └── profile/            # Persona Matrix
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   └── [feature]/          # Feature-specific components
│   ├── ai/                     # Google Genkit AI flows
│   ├── firebase/               # Firebase hooks & config
│   ├── types/                  # Firestore type definitions
│   └── lib/                    # Utilities & helpers
├── docs/                       # Architecture documentation
├── firestore.rules             # Firestore security rules
├── firebase-blueprint.json     # Firebase project config
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind theme
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

```bash
node  >= 18.x
npm   >= 9.x
git   >= 2.x
```

### 1. Clone the Repository

```bash
git clone https://github.com/samrudh-nux/collegeconnect.git
cd collegeconnect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Genkit AI
GOOGLE_GENAI_API_KEY=your_genai_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. (Optional) Start the Genkit AI Dev Server

```bash
npm run genkit:dev
```

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** (Email/Password provider)
3. Create a **Firestore Database** in production mode
4. Enable **Firebase Storage**
5. Copy your config into `.env.local` (see above)
6. Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

**Firestore Collections used:**

| Collection | Purpose |
|-----------|---------|
| `userProfiles` | Avatar, username, high score, verified status |
| `groupJoinRequests` | Kingdom recruitment requests |
| `gameRequests` | Challenge notifications between students |
| `kingdoms` | Group metadata and membership |

---

## 🌐 Deployment

CollegeConnect is deployed on **Vercel** with zero-config CI/CD.

### Deploy Your Own Fork

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or click below for one-click deployment:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/samrudh-nux/collegeconnect)

### Quick Push Script

The repo includes a convenience script for fast pushes:

```bash
npm run push
# Equivalent to: git add . && git commit -m 'CollegeConnect Build' && git push origin main
```

---

## 📖 How to Use

```
Step 1  →  Visit collegeconnect-samxv.vercel.app
Step 2  →  Sign Up with your college email
Step 3  →  Verify your identity via Firebase Auth email link
Step 4  →  Open Profile → Pick your Persona avatar
Step 5  →  Explore the Dashboard (Command Shard)
Step 6  →  Join or create a Kingdom in the Connect tab
Step 7  →  Challenge a student in the Grandmaster Arena
Step 8  →  Browse the Venture Catalog for scholarships & courses
Step 9  →  Check your Intelligence Hub for real-time notifications
Step 10 →  Climb the Leaderboard. Become the Apex Predator.
```

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome!

```bash
# Fork the repo, create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then push
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# Open a Pull Request on GitHub
```

Please follow the existing code style (TypeScript strict, Tailwind classes, shadcn/ui components).

---

## 👤 Author

<div align="center">

<img src="https://avatars.githubusercontent.com/u/266487896?v=4" width="120" style="border-radius: 50%;" alt="Samrudh"/>

### **Samrudh**
*Builder · Student · Engineer*

[![GitHub](https://img.shields.io/badge/GitHub-samrudh--nux-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/samrudh-nux)
[![Live Project](https://img.shields.io/badge/Live-CollegeConnect-7C3AED?style=for-the-badge&logo=vercel&logoColor=white)](https://collegeconnect-samxv.vercel.app)


</div>

---

## 📄 License

```
MIT License — © 2025 Samrudh (samrudh-nux)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies.
```

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=7C3AED&height=120&section=footer&fontSize=20&fontColor=ffffff&animation=fadeIn" width="100%"/>

**CollegeConnect** · Built with ❤️ by [Samrudh](https://github.com/samrudh-nux)

*meet · share · joy*

⭐ **Star this repo if you found it useful!**

</div>
