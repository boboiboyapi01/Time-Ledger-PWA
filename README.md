<div align="center">
  <h1>Time Ledger PWA</h1>
  <p><strong>A high-performance, offline-first time tracking Progressive Web App.</strong></p>
  
  <p>
    <a href="#features"><img src="https://img.shields.io/badge/Features-Explore-blue?style=for-the-badge" alt="Features" /></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Tech_Stack-Modern-success?style=for-the-badge&logo=react" alt="Tech Stack" /></a>
    <a href="#quick-start"><img src="https://img.shields.io/badge/Quick_Start-Run-orange?style=for-the-badge&logo=rocket" alt="Quick Start" /></a>
  </p>
</div>

<hr />

## Overview

Time Ledger is a beautifully crafted Progressive Web Application (PWA) designed to track time spent on productive and distracting activities. Built with modern web technologies, it features a sleek "Bento Box" dashboard, offline-first capabilities, and real-time background syncing.

Perfect for managing your focus, whether you are online or entirely disconnected.

## Key Features

- **Smart Timer:** Start and stop tracking instantly. Your timer persists even if you close the browser.
- **Offline-First:** Powered by Dexie.js (IndexedDB). The application is fully usable without an internet connection.
- **Cloud Sync:** Automatically syncs your locally cached activity data to Supabase the moment you come back online.
- **Rich Analytics:** Visualize your time with interactive charts (Daily pie charts & Weekly bar charts).
- **Background Notifications:** Persistent browser notifications with actionable buttons (like stopping the timer), powered by Service Workers.
- **PWA Ready:** Installable on any device (desktop, iOS, Android) for a native-like app experience.
- **Stunning UI:** Sleek dark mode by default, smooth Framer Motion animations, and a responsive Bento Box layout.

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | [Next.js 16+](https://nextjs.org/) (App Router) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Local Cache** | [Dexie.js](https://dexie.org/) (IndexedDB wrapper) |
| **State Management**| [Zustand](https://github.com/pmndrs/zustand) |
| **Charts** | [Recharts](https://recharts.org/) |

## Quick Start

### 1. Clone & Install
```bash
# Navigate to the project directory
cd time-ledger

# Install dependencies
npm install
```

### 2. Environment Setup
Create a local environment file based on the example (if available), or create a new `.env.local`:
```bash
cp .env.local.example .env.local
```
Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📄 License

This project is licensed under the MIT License.

---
<div align="center">
  <i>Built with ❤️ for modern web development.</i>
</div>
