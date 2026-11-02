# Lab Portal — Diagnostic Lab Report-Delivery System

A secure portal for **Company A Diagnostics**, Vijayawada — enabling automatic report delivery via secure OTP-gated links with plain-language summaries in English, Telugu, and Hindi.

## Quick Links

- 📋 [Technical Design Document](docs/TDD.md)
- 🚀 [Deployment Guide](deployment.md)

## What It Does

- **Patients** receive a secure link when their report is signed. They open it with a mobile OTP, view results with a simple explanation, and download the PDF.
- **Front-desk staff** can search patients, resend links, track delivery, and manage critical callback tasks.
- **Referring doctors** see their patients' reports from the last 90 days.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite (JSX) |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase (Phone OTP + Email/Password) |
| AI | Anthropic Claude (optional, with fallback) |
| Styling | Tailwind CSS |

## Getting Started

See [deployment.md](deployment.md) for full instructions.

```bash
# 1. Clone and install
git clone <repo-url>
cd lab-portal
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Set up environment
cp .env.example .env  # Fill in Supabase + DB credentials

# 3. Database
cd server
npx prisma migrate dev
node prisma/seed.js
cd ..

# 4. Run
# Terminal 1:
cd server && npm run dev
# Terminal 2:
cd client && npm run dev
```

## License

Private — Company A Diagnostics

