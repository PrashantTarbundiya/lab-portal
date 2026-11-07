# Deployment & Reviewer Guide: Diagnostic Lab Report-Delivery Portal

This document provides complete, step-by-step instructions for running the application locally, deploying to production, running the automated test suite, and executing a **7-minute comprehensive reviewer walkthrough**.

---

## 1. Prerequisites

Before starting, ensure your local development machine has:
- **Node.js**: Version 20.x or 22.x LTS (`node -v`)
- **npm**: Version 10.x (`npm -v`)
- **Docker & Docker Compose**: For local PostgreSQL 16 (`docker compose version`)
- **Git**: (`git --version`)

---

## 2. Local Setup & Run (Step by Step)

### Step 1: Clone Repository
```bash
git clone <REPO_URL>
cd lab-portal
```

### Step 2: Configure Environment
Copy `.env.example` in both server and client folders:
```bash
# Server environment
cp .env.example server/.env

# Client environment (optional for Vite)
cp .env.example client/.env
```

Ensure the following default values exist in `server/.env` for local testing:
```ini
PORT=3000
NODE_ENV=development
APP_BASE_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lab_portal?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/lab_portal?schema=public
APP_HASH_SECRET=super-secret-dev-hash-key-12345
LAB_NAME=Company A Diagnostics
OTP_DEMO_MODE=true
DEMO_PASSWORD=Demo@12345
LINK_TTL_HOURS=72
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free
```

### Step 3: Start Local PostgreSQL via Docker
```bash
docker compose up -d
```
*Verify Postgres is ready:*
```bash
docker ps
```

### Step 4: Install Dependencies & Setup Database
```bash
# Install server dependencies
cd server
npm install

# Push Prisma schema to local database
npx prisma db push

# Seed the database with all 12 demo scenarios & sample data
node prisma/seed.js

# Return to root and install client dependencies
cd ../client
npm install
cd ..
```

### Step 5: Start Development Servers
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server runs on http://localhost:3000
# Health check: http://localhost:3000/api/health
```

**Terminal 2 (Frontend React App):**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

Open your browser to: **`http://localhost:5173`**

---

## 3. Production & Container Deployment

### 3.1 Containerized Deployment with Docker Compose (Recommended)
The fastest, turnkey way to run the entire stack (PostgreSQL + Backend API + Nginx Frontend) in Docker:

```bash
# Build and start all services in detached mode
docker compose up --build -d

# Check running containers and health status
docker compose ps

# View backend logs in real-time
docker compose logs -f backend
```

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health
- **PostgreSQL**: `localhost:5432` (database: `lab_portal`)

### 3.2 Standalone Backend Docker Container
To build and deploy only the backend Express container (e.g. AWS ECS, GCP Cloud Run, Render, Railway, DigitalOcean):

```bash
# Build the backend image
docker build -t lab-portal-backend ./server

# Run container with environment file
docker run -d \
  --name lab-portal-backend \
  -p 3000:3000 \
  --env-file server/.env \
  --restart unless-stopped \
  lab-portal-backend

# Test backend health
curl http://localhost:3000/api/health
```

### 3.3 Render (Backend API) Deployment
The repository includes a ready-to-use Render Blueprint [`render.yaml`](render.yaml) and pre-configured `package.json` scripts.

#### Option 1: 1-Click Blueprint (Recommended)
1. In the [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Blueprint**.
2. Connect your GitHub repository. Render reads `render.yaml` automatically.
3. Provide your PostgreSQL database connection string (`DATABASE_URL`).
4. Click **Apply**.

#### Option 2: Manual Web Service Setup
1. In Render, click **New +** -> **Web Service**.
2. Select your repository.
3. Configure settings:
   - **Name**: `lab-portal-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node src/index.js`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *[Your PostgreSQL connection string]*
   - `DIRECT_URL`: *[Your unpooled direct connection string]*
   - `APP_BASE_URL`: *[Your Vercel URL, e.g. `https://your-app.vercel.app`]*
   - `APP_HASH_SECRET`: `super-secret-dev-hash-key-12345`
   - `LAB_NAME`: `Company A Diagnostics`
   - `OTP_DEMO_MODE`: `true`
   - `DEMO_PASSWORD`: `Demo@12345`
   - `LINK_TTL_HOURS`: `72`
5. Click **Deploy Web Service**.

---

### 3.4 Vercel (Frontend SPA) Deployment
The client is pre-configured with SPA fallback rewrites via [`vercel.json`](vercel.json) and [`client/vercel.json`](client/vercel.json).

1. In the [Vercel Dashboard](https://vercel.com/new), import your repository.
2. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` *(click Edit and select `client`)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the following Environment Variables:
   - `VITE_API_BASE_URL`: `https://<your-render-service>.onrender.com/api`
   - `VITE_SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - `VITE_OTP_DEMO_MODE`: `true`
   - `VITE_RAZORPAY_KEY_ID`: `<your-razorpay-key-id>`
4. Click **Deploy**. Vercel will build and assign your production URL.
5. Copy your Vercel URL (e.g. `https://lab-portal.vercel.app`) and paste it as `APP_BASE_URL` in your Render backend settings so CORS and link generation are perfectly matched.

---

### 3.5 AWS Free Tier (EC2 24/7 Deployment)
AWS Free Tier includes **750 hours per month** of `t2.micro` instances (12 months free), which is enough to run your application **24 hours a day, 7 days a week, 365 days a year for free**.

#### Step 1: Launch an EC2 Free Tier Instance
1. In the [AWS Management Console](https://console.aws.amazon.com/ec2/), click **Launch Instance**.
2. **Name**: `lab-portal-server`
3. **OS / AMI**: **Ubuntu Server 24.04 LTS (HVM)** *(Free Tier eligible)*
4. **Instance Type**: **`t2.micro`** (or `t3.micro` where eligible)
5. **Key Pair**: Select your `.pem` key pair (or create a new one).
6. **Network / Security Group**:
   - Check **Allow SSH traffic from Anywhere** (Port 22)
   - Check **Allow HTTP traffic from the internet** (Port 80)
   - Check **Allow HTTPS traffic from the internet** (Port 443)
   - Add Custom TCP Rule: Port `3000` (Backend API)
   - Add Custom TCP Rule: Port `5173` (Vite Client)
7. **Storage**: Set to **`30 GB` gp3** (maximum free tier limit).
8. Click **Launch Instance**.

#### Step 2: Connect and Run Setup
Connect to your EC2 instance via SSH:
```bash
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
```

Run the automated one-click setup script (configures 2GB Swap Memory to prevent OOM on 1GB RAM and installs Docker):
```bash
# Clone the repository
git clone https://github.com/PrashantTarbundiya/lab-portal.git
cd lab-portal

# Make setup script executable and run
chmod +x scripts/aws-setup.sh
./scripts/aws-setup.sh

# Apply docker group permissions
newgrp docker
```

#### Step 3: Configure Environment & Start 24/7
```bash
# Copy example environment configuration
cp server/.env.docker.example server/.env

# Start PostgreSQL, Backend API, and Frontend with Docker Compose in background
docker compose up -d --build

# Verify all containers are running and healthy
docker compose ps
```
Your application is now running 24/7 on AWS EC2!
- Frontend UI: `http://<your-ec2-ip>:5173`
- Backend API: `http://<your-ec2-ip>:3000`
- Healthcheck: `http://<your-ec2-ip>:3000/api/health`

---

### 3.6 24/7 Free-Tier Keep-Alive Automation
Free hosting tiers (such as Render Free) automatically spin down web services after 15 minutes of idle time. The repository includes two zero-cost solutions to keep services awake 24/7:

#### Solution A: GitHub Actions Heartbeat (100% Free on Public Repos)
A pre-configured GitHub Actions workflow [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) runs on a cron schedule (`*/10 * * * *`) every 10 minutes:
1. In your GitHub repository, navigate to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Click **New repository secret**.
3. Name: `TARGET_URL`, Value: `https://your-service.onrender.com` (or your AWS EC2 domain).
4. GitHub Actions will automatically ping the endpoint every 10 minutes 24/7, keeping it warm and eliminating cold starts.

#### Solution B: Standalone Node.js Keep-Alive Daemon
Run the lightweight background script [`scripts/keep-alive.js`](scripts/keep-alive.js) on any machine, VPS, or background worker:
```bash
TARGET_URL=https://your-service.onrender.com node scripts/keep-alive.js &
```

---

## 4. Environment Variables Reference

*(Names only, per specification)*

| Variable Name | Description |
|---|---|
| `DATABASE_URL` | Pooled connection string for application runtime |
| `DIRECT_URL` | Direct unpooled connection string for Prisma migrations |
| `DATABASE_URL_TEST` | Isolated PostgreSQL database for automated test runs |
| `APP_BASE_URL` | Canonical frontend domain for secure link URL generation |
| `SUPABASE_URL` | Supabase project URL for authentication |
| `SUPABASE_ANON_KEY` | Public anon key for client-side authentication |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for server-side user/token management |
| `APP_HASH_SECRET` | Secret key used for HMAC-SHA256 mobile phone hashing |
| `ANTHROPIC_API_KEY` | (Optional) Anthropic API key for non-template summaries |
| `ANTHROPIC_MODEL` | Claude model identifier (default: `claude-sonnet-4-6`) |
| `OTP_DEMO_MODE` | Set `true` to display OTP banners and allow test bypass |
| `LINK_TTL_HOURS` | Lifespan of secure report links (default: `72`) |
| `DEMO_PASSWORD` | Universal password for demo staff accounts |
| `LAB_NAME` | Organization branding string in SMS/WhatsApp messages |

---

## 5. Reviewer Demo Logins & Scenarios

### 5.1 Quick Logins
| Role | Portal URL | Username / Credential | Password / OTP |
|---|---|---|---|
| **Patient** | `http://localhost:5173/` | Mobile: `9000000001` | OTP: `123456` |
| **Front Desk** | `http://localhost:5173/staff/login` | Email: `frontdesk@demo.local` | `Demo@12345` |
| **Referring Doctor** | `http://localhost:5173/staff/login` | Email: `doctor@demo.local` | `Demo@12345` |

### 5.2 The 12 Specific Demo Scenarios
All 12 scenarios from the brief and specification are pre-loaded in the seed data:

| # | Scenario Description | Order ID / Data | How to Verify |
|---|---|---|---|
| **1** | **Normal report (all values normal)** | `ORD-71206` (Padmavathi D) | Open order. Summary shows green "All tested parameters are within standard reference range". |
| **2** | **Low haemoglobin (template summary in en/te/hi)** | `ORD-71204` (Lakshmi Prasanna K) | View report. Hb is 10.2 (LOW). Shows locked medical explanation. Switch to Telugu (తెలుగు) — verified font rendering. |
| **3** | **Multiple out-of-range parameters (AI / fallback)** | `ORD-71205` (Srinivas Rao T) | Fasting glucose 145, HbA1c 7.8, LDL 155. Out-of-range items cleanly listed with reference ranges and arrows. |
| **4** | **Critical potassium: held, callback open** | `ORD-71233` (Farzana Begum) | Potassium 6.8 mmol/L. Link is **held** (`Held: callback needed`). No SMS sent. Report shows calm medical notice. |
| **5** | **Critical with callback done & link released** | `ORD-71234` (Narasimha Rao K) | Critical low Hb (6.5). Staff callback already marked DONE with clinical note. Link released to patient. |
| **6** | **Expired link & resent link** | `ORD-71235` (Priya Sharma) | Link created 5 days ago expired. Staff console shows "Resend link" button with fresh 72h token. |
| **7** | **Failed WhatsApp delivery with SMS fallback** | `ORD-71208` (Sumalatha G) | WhatsApp status is `FAILED` ("Number not on WhatsApp"). Console shows blue "Send SMS Fallback" button. |
| **8** | **Patient flagged summary** | `ORD-71207` (Ramesh Kumar B) | Open report has "Flag this summary" button. Flag appears under Staff "Tasks & Flags" tab. |
| **9** | **Family account (shared number)** | `9000000001` (Lakshmi family) | Log in with `9000000001`. "Whose reports?" profile picker shows 4 family members (Self, Spouse, Children) plus "All family reports". |
| **10** | **Order still processing** | `ORD-71219` (Venkata Rao M) | Appears as `PROCESSING` in both staff console and patient list. PDF download disabled until sign-off. |
| **11** | **"This is not for me" (wrong number)** | `ORD-71236` (Rajesh Varma) | Recipient clicked "This is not for me" on landing gate. Link revoked; open `WRONG_NUMBER` task in staff console. |
| **12** | **Mobile change conflict on re-import** | Seeded Task | Re-import with mismatched phone creates `MOBILE_CHANGE` task for staff verification. |

---

## 6. How to Run Tests & Reset Data

### Run Automated Vitest Test Suite
```bash
cd server
npm test
```
All unit, rule, guard, and safety tests will execute and pass.

### Reset Demo Database
To restore the database to a clean demo state at any time:
```bash
cd server
node prisma/seed.js
```

### Health Check Endpoint
Verify server and database status:
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok","db":"connected","timestamp":"..."}
```

---

## 7. 7-Minute Reviewer Walkthrough

Follow these 7 steps to evaluate every core requirement in under 7 minutes:

### Minute 1: Patient Login & Language Switch
1. Go to `http://localhost:5173`.
2. Notice the yellow **Demo Mode** ribbon at the top.
3. In the top-right corner, click **తెలుగు** (Telugu) or **हिन्दी** (Hindi). Observe the instant UI translation.
4. Switch back to English or keep Telugu. Enter mobile `9000000001` and click **Get OTP**.
5. The 6-digit OTP boxes auto-populate `123456`. Click **Verify**.

### Minute 2: DPDP Consent & Family Profile Picker
1. If prompted with the **Consent** screen, click "Why we ask ↓" to expand the DPDP statutory notice, then click **I agree**.
2. On the **"Whose reports?"** screen, observe the 4 cards representing Lakshmi, Srinivas, Bhavani, and Raghavendra.
3. Click on **Lakshmi Prasanna K**.

### Minute 3: Report Details & Telugu Explanation
1. Click **Open report →** on `ORD-71204`.
2. Notice the **"What this means"** card highlighting Haemoglobin 10.2 g/dL (↓ Low).
3. Toggle the language switch to **తెలుగు** in the header. Notice the medical explanation rendered in clear Telugu script with relaxed line-height ($\ge 1.7$).
4. Click **Download full report (PDF)** to download the signed PDF report.
5. Click **Flag this summary**, select "Confusing", type a brief note, and submit. A success toast confirms the submission.

### Minute 4: Staff Console & Search
1. Open a new tab or click the bottom link to go to `http://localhost:5173/staff/login`.
2. Sign in with `frontdesk@demo.local` / `Demo@12345`.
3. In the search box, search `Farzana` or `71233` or `0003`.
4. Observe the results table displaying masked contact numbers (`••••••0003`), Delivery status chips, and Link status.

### Minute 5: Critical Value Hold & Clinical Callback
1. In the console, find `ORD-71233` (Farzana Begum) with status **Held**. Click **Open →**.
2. Notice the prominent red alert banner: **"Critical Result Callback Required (Potassium 6.8 mmol/L)"**.
3. Notice that the patient report link has been **held** to protect the patient.
4. Next to the patient phone number, click **Reveal**. Notice the number unmasks to `+919000000003` (and an audit log entry is written).
5. Click **Mark Callback Done →**. In the dialog, enter: *"Spoke to patient at 11:55 AM. Advised immediate ER visit."* and submit.
6. The alert clears, and the report link is released!

### Minute 6: LIS Re-Import & Real-Time Sign-Off
1. Click **LIS Import** in the top navigation.
2. Click the button: **Simulate Sign-Off Update 🚀**.
3. Observe the import summary report showing orders created/signed.
4. Navigate back to **Orders** — observe that previously `PROCESSING` orders (`ORD-71219` and `ORD-71220`) are now `SIGNED`, with links generated and messages in the outbox.

### Minute 7: Audit Log & Referring Doctor View
1. Click **Access Log** in the top navigation.
2. Observe the chronological audit log showing:
   - Your earlier login
   - The phone reveal
   - The callback completion
   - The PDF download
3. Click **Export CSV** to verify the downloadable audit trail.
4. Log out and log in as `doctor@demo.local` / `Demo@12345` to view the 90-day Referring Physician portal.

