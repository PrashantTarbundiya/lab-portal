import os

DIAGRAMS_DIR = r"d:\IsocodeLabs\lab-portal\docs\diagrams"
DOCS_DIR = r"d:\IsocodeLabs\lab-portal\docs"
os.makedirs(DIAGRAMS_DIR, exist_ok=True)

# 1. Architecture Diagram SVG
arch_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 780" width="100%" height="100%" style="background:#0F172A; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;">
  <defs>
    <filter id="cardGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0F5E57"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
  </defs>

  <!-- Title Banner -->
  <rect x="30" y="25" width="1040" height="70" rx="12" fill="url(#headerGrad)" filter="url(#cardGlow)"/>
  <text x="50" y="65" fill="#FFFFFF" font-size="22" font-weight="700">Company A Diagnostics — End-to-End System Architecture</text>
  <text x="50" y="85" fill="#CCFBF1" font-size="13">High-Availability Containerized Deployment on AWS EC2 (Docker Compose, Nginx Reverse Proxy, PERN Stack)</text>

  <!-- COLUMN 1: End Users & Handsets -->
  <rect x="30" y="115" width="220" height="630" rx="14" fill="#1E293B" stroke="#334155" stroke-width="2" filter="url(#cardGlow)"/>
  <rect x="45" y="130" width="190" height="32" rx="8" fill="#0F5E57"/>
  <text x="140" y="152" fill="#FFFFFF" font-size="14" font-weight="700" text-anchor="middle">1. END USERS</text>

  <!-- Patient Card -->
  <rect x="45" y="180" width="190" height="150" rx="10" fill="#0F172A" stroke="#14B8A6" stroke-width="1.5"/>
  <rect x="55" y="190" width="34" height="34" rx="8" fill="#14B8A6"/>
  <text x="72" y="213" fill="#FFFFFF" font-size="18" text-anchor="middle">📱</text>
  <text x="98" y="206" fill="#F8FAFC" font-size="14" font-weight="700">Patients &amp; Families</text>
  <text x="98" y="222" fill="#94A3B8" font-size="11">Mobile Safari / Chrome</text>
  <text x="55" y="250" fill="#CBD5E1" font-size="11">• 72h Expiring OTP Link</text>
  <text x="55" y="270" fill="#CBD5E1" font-size="11">• Telugu (తెలుగు) / Hindi</text>
  <text x="55" y="290" fill="#CBD5E1" font-size="11">• Family Profile Switcher</text>
  <text x="55" y="310" fill="#CBD5E1" font-size="11">• "This is not for me" button</text>

  <!-- Front Desk Card -->
  <rect x="45" y="350" width="190" height="150" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
  <rect x="55" y="360" width="34" height="34" rx="8" fill="#0284C7"/>
  <text x="72" y="383" fill="#FFFFFF" font-size="18" text-anchor="middle">💻</text>
  <text x="98" y="376" fill="#F8FAFC" font-size="14" font-weight="700">Front-Desk Staff</text>
  <text x="98" y="392" fill="#94A3B8" font-size="11">Desktop Web Console</text>
  <text x="55" y="420" fill="#CBD5E1" font-size="11">• Instant Patient Search</text>
  <text x="55" y="440" fill="#CBD5E1" font-size="11">• Resend Link (Rate Limited)</text>
  <text x="55" y="460" fill="#CBD5E1" font-size="11">• Masked Phone Reveal</text>
  <text x="55" y="480" fill="#CBD5E1" font-size="11">• Critical Callback Clearance</text>

  <!-- Referring Doctor Card -->
  <rect x="45" y="520" width="190" height="135" rx="10" fill="#0F172A" stroke="#A855F7" stroke-width="1.5"/>
  <rect x="55" y="530" width="34" height="34" rx="8" fill="#7E22CE"/>
  <text x="72" y="553" fill="#FFFFFF" font-size="18" text-anchor="middle">🩺</text>
  <text x="98" y="546" fill="#F8FAFC" font-size="14" font-weight="700">Referring Doctors</text>
  <text x="98" y="562" fill="#94A3B8" font-size="11">Clinical Portal</text>
  <text x="55" y="590" fill="#CBD5E1" font-size="11">• 90-Day Referred Patient List</text>
  <text x="55" y="610" fill="#CBD5E1" font-size="11">• Parameter Abnormality View</text>
  <text x="55" y="630" fill="#CBD5E1" font-size="11">• 1-Click PDF Report Access</text>

  <!-- Operations Head Card -->
  <rect x="45" y="670" width="190" height="60" rx="10" fill="#0F172A" stroke="#E2E8F0" stroke-width="1"/>
  <text x="55" y="695" fill="#F8FAFC" font-size="12" font-weight="700">Operations Head / Pathologist</text>
  <text x="55" y="715" fill="#94A3B8" font-size="11">Access Log Export &amp; 50-Summary Weekly Review</text>

  <!-- COLUMN 2: Nginx & Frontend SPA -->
  <rect x="280" y="115" width="240" height="630" rx="14" fill="#1E293B" stroke="#334155" stroke-width="2" filter="url(#cardGlow)"/>
  <rect x="295" y="130" width="210" height="32" rx="8" fill="#0F5E57"/>
  <text x="400" y="152" fill="#FFFFFF" font-size="14" font-weight="700" text-anchor="middle">2. CLIENT TIER (PORT 80 / 5173)</text>

  <!-- Nginx Box -->
  <rect x="295" y="180" width="210" height="100" rx="10" fill="#0F172A" stroke="#22C55E" stroke-width="1.5"/>
  <text x="310" y="205" fill="#22C55E" font-size="13" font-weight="700">Nginx Alpine Gateway (Port 80)</text>
  <text x="310" y="225" fill="#CBD5E1" font-size="11">• Static Asset Caching (30 Days)</text>
  <text x="310" y="243" fill="#CBD5E1" font-size="11">• Gzip Compression Engine</text>
  <text x="310" y="261" fill="#CBD5E1" font-size="11">• Reverse Proxy: /api/* → Node.js</text>

  <!-- React SPA Box -->
  <rect x="295" y="295" width="210" height="435" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
  <text x="310" y="320" fill="#38BDF8" font-size="14" font-weight="700">React 18 + Vite SPA</text>
  <text x="310" y="338" fill="#94A3B8" font-size="11">Zero external UI bloat (Tailwind CSS)</text>

  <rect x="305" y="355" width="190" height="70" rx="6" fill="#1E293B"/>
  <text x="315" y="375" fill="#F8FAFC" font-size="12" font-weight="700">Routing &amp; Nav Context</text>
  <text x="315" y="393" fill="#94A3B8" font-size="10">• React Router v7 with Guards</text>
  <text x="315" y="408" fill="#94A3B8" font-size="10">• Role Switcher &amp; TopMainNavbar</text>

  <rect x="305" y="435" width="190" height="70" rx="6" fill="#1E293B"/>
  <text x="315" y="455" fill="#F8FAFC" font-size="12" font-weight="700">Indic Language Engine</text>
  <text x="315" y="473" fill="#94A3B8" font-size="10">• English | తెలుగు | हिन्दी</text>
  <text x="315" y="488" fill="#94A3B8" font-size="10">• Relaxed 1.8 Line Height for Conjuncts</text>

  <rect x="305" y="515" width="190" height="70" rx="6" fill="#1E293B"/>
  <text x="315" y="535" fill="#F8FAFC" font-size="12" font-weight="700">Mobile Accessibility (Elderly UX)</text>
  <text x="315" y="553" fill="#94A3B8" font-size="10">• 48px Min Tap Targets</text>
  <text x="315" y="568" fill="#94A3B8" font-size="10">• 18px Base Font, High Contrast</text>

  <rect x="305" y="595" width="190" height="120" rx="6" fill="#1E293B"/>
  <text x="315" y="615" fill="#F8FAFC" font-size="12" font-weight="700">Core Client Views</text>
  <text x="315" y="632" fill="#94A3B8" font-size="10">• LandingGate (/r/:token)</text>
  <text x="315" y="647" fill="#94A3B8" font-size="10">• PatientLogin &amp; ProfilePicker</text>
  <text x="315" y="662" fill="#94A3B8" font-size="10">• ReportDetail &amp; PDF View</text>
  <text x="315" y="677" fill="#94A3B8" font-size="10">• StaffConsole &amp; TaskModal</text>
  <text x="315" y="692" fill="#94A3B8" font-size="10">• DoctorPortal &amp; ImportTool</text>

  <!-- COLUMN 3: Express Backend -->
  <rect x="550" y="115" width="250" height="630" rx="14" fill="#1E293B" stroke="#334155" stroke-width="2" filter="url(#cardGlow)"/>
  <rect x="565" y="130" width="220" height="32" rx="8" fill="#0F5E57"/>
  <text x="675" y="152" fill="#FFFFFF" font-size="14" font-weight="700" text-anchor="middle">3. BACKEND API (PORT 3000)</text>

  <rect x="565" y="180" width="220" height="135" rx="10" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="580" y="205" fill="#F59E0B" font-size="13" font-weight="700">Middleware &amp; Security Layer</text>
  <text x="580" y="225" fill="#CBD5E1" font-size="11">• Bearer Token &amp; Supabase Auth</text>
  <text x="580" y="243" fill="#CBD5E1" font-size="11">• Role Guards: Patient, Staff, Doctor</text>
  <text x="580" y="261" fill="#CBD5E1" font-size="11">• Rate Limiter (Max 3 Resends/Day)</text>
  <text x="580" y="279" fill="#CBD5E1" font-size="11">• Zod Schema Input Validator</text>
  <text x="580" y="297" fill="#CBD5E1" font-size="11">• DPDP Audit Logger (writeLog)</text>

  <rect x="565" y="325" width="220" height="175" rx="10" fill="#0F172A" stroke="#10B981" stroke-width="1.5"/>
  <text x="580" y="350" fill="#10B981" font-size="13" font-weight="700">Core Services &amp; Pipelines</text>
  <text x="580" y="370" fill="#CBD5E1" font-size="11">• LIS CSV Streaming Parser</text>
  <text x="580" y="388" fill="#CBD5E1" font-size="11">• Clinical Rules Engine (ranges.js)</text>
  <text x="580" y="406" fill="#CBD5E1" font-size="11">• 11 Critical Rules (critical.js)</text>
  <text x="580" y="424" fill="#CBD5E1" font-size="11">• Critical Hold &amp; Callback Trigger</text>
  <text x="580" y="442" fill="#CBD5E1" font-size="11">• 72h Token Cryptography (tokens.js)</text>
  <text x="580" y="460" fill="#CBD5E1" font-size="11">• On-the-Fly PDF Engine (pdf-lib)</text>
  <text x="580" y="478" fill="#CBD5E1" font-size="11">• Mock Outbox (WhatsApp / SMS)</text>

  <rect x="565" y="510" width="220" height="220" rx="10" fill="#0F172A" stroke="#EC4899" stroke-width="1.5"/>
  <text x="580" y="535" fill="#EC4899" font-size="13" font-weight="700">AI Medical Summary Pipeline</text>
  <text x="580" y="555" fill="#CBD5E1" font-size="11">• 13 Locked Outpatient Templates</text>
  <text x="580" y="573" fill="#94A3B8" font-size="10">  (0ms, 100% Deterministic)</text>
  <text x="580" y="593" fill="#CBD5E1" font-size="11">• AI Input Regex Whitelist</text>
  <text x="580" y="611" fill="#CBD5E1" font-size="11">• OpenRouter LLM Call (Temp 0)</text>
  <text x="580" y="629" fill="#CBD5E1" font-size="11">• Multi-Stage Output Guard:</text>
  <text x="595" y="647" fill="#94A3B8" font-size="10">- No invented numbers</text>
  <text x="595" y="663" fill="#94A3B8" font-size="10">- Banned word filter (cancer, etc.)</text>
  <text x="595" y="679" fill="#94A3B8" font-size="10">- Word count &lt;= 30</text>
  <text x="580" y="700" fill="#CBD5E1" font-size="11">• Deterministic Safe Fallback</text>

  <!-- COLUMN 4: Data & External Layer -->
  <rect x="830" y="115" width="240" height="630" rx="14" fill="#1E293B" stroke="#334155" stroke-width="2" filter="url(#cardGlow)"/>
  <rect x="845" y="130" width="210" height="32" rx="8" fill="#0F5E57"/>
  <text x="950" y="152" fill="#FFFFFF" font-size="14" font-weight="700" text-anchor="middle">4. DATA &amp; INFRASTRUCTURE</text>

  <!-- PostgreSQL Box -->
  <rect x="845" y="180" width="210" height="190" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="860" y="205" fill="#3B82F6" font-size="13" font-weight="700">PostgreSQL 16 (Prisma ORM)</text>
  <text x="860" y="225" fill="#CBD5E1" font-size="11">• Dedicated Docker Container</text>
  <text x="860" y="243" fill="#CBD5E1" font-size="11">• HMAC-SHA256 Phone Indexing</text>
  <text x="860" y="261" fill="#CBD5E1" font-size="11">• 12 Relational Tables:</text>
  <text x="870" y="280" fill="#94A3B8" font-size="10">Account, Patient, Doctor, Order,</text>
  <text x="870" y="296" fill="#94A3B8" font-size="10">Result, Summary, SummaryFlag,</text>
  <text x="870" y="312" fill="#94A3B8" font-size="10">LinkToken, CallbackTask, Message,</text>
  <text x="870" y="328" fill="#94A3B8" font-size="10">AccessLog, ImportRun</text>
  <text x="860" y="352" fill="#10B981" font-size="11">✓ Pooled connection (20 max)</text>

  <!-- Cloud Infrastructure Box -->
  <rect x="845" y="380" width="210" height="150" rx="10" fill="#0F172A" stroke="#F97316" stroke-width="1.5"/>
  <text x="860" y="405" fill="#F97316" font-size="13" font-weight="700">AWS EC2 Hosting (Mumbai / 24/7)</text>
  <text x="860" y="425" fill="#CBD5E1" font-size="11">• t3.micro Ubuntu 24.04 LTS</text>
  <text x="860" y="443" fill="#CBD5E1" font-size="11">• 2GB Configured Swap Memory</text>
  <text x="860" y="461" fill="#CBD5E1" font-size="11">• DPDP Indian Data Sovereignty</text>
  <text x="860" y="479" fill="#CBD5E1" font-size="11">• Automated Healthcheck Keep-Alive</text>
  <text x="860" y="497" fill="#CBD5E1" font-size="11">• Ports 22, 80, 443, 3000, 5173</text>

  <!-- External AI & Integrations Box -->
  <rect x="845" y="540" width="210" height="190" rx="10" fill="#0F172A" stroke="#A855F7" stroke-width="1.5"/>
  <text x="860" y="565" fill="#A855F7" font-size="13" font-weight="700">Integrations &amp; Outside Systems</text>
  <text x="860" y="585" fill="#CBD5E1" font-size="11">• OpenRouter AI API</text>
  <text x="870" y="603" fill="#94A3B8" font-size="10">(NVIDIA Nemotron / Claude)</text>
  <text x="860" y="623" fill="#CBD5E1" font-size="11">• Meta WhatsApp Cloud API Ready</text>
  <text x="870" y="641" fill="#94A3B8" font-size="10">(MockProvider in Dev/Demo)</text>
  <text x="860" y="661" fill="#CBD5E1" font-size="11">• Razorpay Payment Gateway</text>
  <text x="870" y="679" fill="#94A3B8" font-size="10">(Pre-configured keys in ENV)</text>
  <text x="860" y="701" fill="#CBD5E1" font-size="11">• Supabase Auth &amp; Session Store</text>

  <!-- CONNECTING ARROWS -->
  <path d="M 235 255 L 295 230" fill="none" stroke="#14B8A6" stroke-width="2"/>
  <path d="M 235 425 L 295 425" fill="none" stroke="#38BDF8" stroke-width="2"/>
  <path d="M 235 580 L 295 540" fill="none" stroke="#A855F7" stroke-width="2"/>
  <path d="M 495 240 L 565 240" fill="none" stroke="#22C55E" stroke-width="2.5"/>
  <path d="M 495 480 L 565 480" fill="none" stroke="#38BDF8" stroke-width="2"/>
  <path d="M 775 270 L 845 270" fill="none" stroke="#3B82F6" stroke-width="2.5"/>
  <path d="M 775 620 L 845 620" fill="none" stroke="#A855F7" stroke-width="2"/>
</svg>
"""

# 2. Entity-Relationship Diagram SVG
erd_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 820" width="100%" height="100%" style="background:#0F172A; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;">
  <defs>
    <filter id="erdGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Header -->
  <rect x="30" y="20" width="1040" height="60" rx="10" fill="#0F5E57" filter="url(#erdGlow)"/>
  <text x="50" y="55" fill="#FFFFFF" font-size="20" font-weight="700">Relational Data Model (PostgreSQL 16 &amp; Prisma ORM)</text>
  <text x="650" y="55" fill="#CCFBF1" font-size="13">DPDP Act 2023 Compliant • SHA-256 Hashes • Append-Only Logs</text>

  <!-- TABLE 1: Account -->
  <g transform="translate(40, 100)" filter="url(#erdGlow)">
    <rect width="210" height="170" rx="8" fill="#1E293B" stroke="#14B8A6" stroke-width="2"/>
    <rect width="210" height="30" rx="8" fill="#0F5E57"/>
    <text x="105" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">Account (Shared Phone)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F8FAFC" font-size="11">mobileE164: String [UK]</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">mobileHash: String [INDEX]</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">preferredLang: Lang (en/te/hi)</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">consentAt: DateTime</text>
    <text x="15" y="152" fill="#F8FAFC" font-size="11">consentVersion: String</text>
  </g>

  <!-- TABLE 2: Patient -->
  <g transform="translate(300, 100)" filter="url(#erdGlow)">
    <rect width="210" height="150" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
    <rect width="210" height="30" rx="8" fill="#0284C7"/>
    <text x="105" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">Patient (Profile)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F59E0B" font-size="11">🔗 accountId: String [FK]</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">fullName: String</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">sex: Sex (M/F/OTHER)</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">relation: Relation (SELF/CHILD...)</text>
  </g>

  <!-- TABLE 3: Doctor -->
  <g transform="translate(560, 100)" filter="url(#erdGlow)">
    <rect width="210" height="130" rx="8" fill="#1E293B" stroke="#A855F7" stroke-width="2"/>
    <rect width="210" height="30" rx="8" fill="#7E22CE"/>
    <text x="105" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">Doctor (Referring)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F8FAFC" font-size="11">name: String</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">clinicHospital: String</text>
    <text x="15" y="112" fill="#F59E0B" font-size="11">🔗 userId: String? [FK]</text>
  </g>

  <!-- TABLE 4: User (Staff / Doctor Auth) -->
  <g transform="translate(820, 100)" filter="url(#erdGlow)">
    <rect width="220" height="150" rx="8" fill="#1E293B" stroke="#E2E8F0" stroke-width="2"/>
    <rect width="220" height="30" rx="8" fill="#334155"/>
    <text x="110" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">User (Internal Staff)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F8FAFC" font-size="11">email: String [UK]</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">role: UserRole (FRONT_DESK...)</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">name: String</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">passwordHash: String</text>
  </g>

  <!-- TABLE 5: Order -->
  <g transform="translate(300, 300)" filter="url(#erdGlow)">
    <rect width="230" height="190" rx="8" fill="#1E293B" stroke="#22C55E" stroke-width="2"/>
    <rect width="230" height="30" rx="8" fill="#15803D"/>
    <text x="115" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">Order (Diagnostic Encounter)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F8FAFC" font-size="11">orderNo: String [UK]</text>
    <text x="15" y="92" fill="#F59E0B" font-size="11">🔗 patientId: String [FK]</text>
    <text x="15" y="112" fill="#F59E0B" font-size="11">🔗 doctorId: String [FK]</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">status: OrderStatus (READY...)</text>
    <text x="15" y="152" fill="#EF4444" font-size="11">hasCritical: Boolean</text>
    <text x="15" y="172" fill="#F8FAFC" font-size="11">signedAt: DateTime?</text>
  </g>

  <!-- TABLE 6: Result -->
  <g transform="translate(40, 310)" filter="url(#erdGlow)">
    <rect width="220" height="180" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
    <rect width="220" height="30" rx="8" fill="#B45309"/>
    <text x="110" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">Result (Parameter Test)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F59E0B" font-size="11">🔗 orderId: String [FK]</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">parameter: String</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">value: String / valueNum</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">refRangeRaw: String</text>
    <text x="15" y="152" fill="#F8FAFC" font-size="11">flag: ResultFlag (NORMAL/LOW...)</text>
    <text x="15" y="172" fill="#94A3B8" font-size="10">UK: [orderId, parameter]</text>
  </g>

  <!-- TABLE 7: LinkToken (Expiring 72h) -->
  <g transform="translate(580, 300)" filter="url(#erdGlow)">
    <rect width="220" height="180" rx="8" fill="#1E293B" stroke="#14B8A6" stroke-width="2"/>
    <rect width="220" height="30" rx="8" fill="#0F5E57"/>
    <text x="110" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">LinkToken (72h Expiring Link)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F59E0B" font-size="11">🔗 orderId: String [FK]</text>
    <text x="15" y="92" fill="#F59E0B" font-size="11">🔗 accountId: String [FK]</text>
    <text x="15" y="112" fill="#10B981" font-size="11">tokenHash: String [SHA-256 UK]</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">expiresAt: DateTime</text>
    <text x="15" y="152" fill="#EF4444" font-size="11">revokedAt: DateTime?</text>
    <text x="15" y="172" fill="#F8FAFC" font-size="11">firstOpenedAt / openCount</text>
  </g>

  <!-- TABLE 8: CallbackTask (Critical Hold) -->
  <g transform="translate(840, 300)" filter="url(#erdGlow)">
    <rect width="220" height="180" rx="8" fill="#1E293B" stroke="#EF4444" stroke-width="2"/>
    <rect width="220" height="30" rx="8" fill="#B91C1C"/>
    <text x="110" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">CallbackTask (Critical Hold)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F59E0B" font-size="11">🔗 orderId: String [FK]</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">type: TaskType (CRITICAL...)</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">status: TaskStatus (OPEN/DONE)</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">clinicalNote: String?</text>
    <text x="15" y="152" fill="#F59E0B" font-size="11">🔗 resolvedById: String? [FK]</text>
    <text x="15" y="172" fill="#F8FAFC" font-size="11">resolvedAt: DateTime?</text>
  </g>

  <!-- TABLE 9: Summary & SummaryFlag -->
  <g transform="translate(40, 540)" filter="url(#erdGlow)">
    <rect width="220" height="170" rx="8" fill="#1E293B" stroke="#EC4899" stroke-width="2"/>
    <rect width="220" height="30" rx="8" fill="#BE185D"/>
    <text x="110" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">Summary (Indic Explanations)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F59E0B" font-size="11">🔗 orderId: String [FK]</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">lang: Lang (en/te/hi)</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">source: (TEMPLATE / AI)</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">body: String</text>
    <text x="15" y="152" fill="#F8FAFC" font-size="11">reviewStatus: (PENDING/REVIEWED)</text>
  </g>

  <!-- TABLE 10: SummaryFlag -->
  <g transform="translate(300, 540)" filter="url(#erdGlow)">
    <rect width="210" height="150" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
    <rect width="210" height="30" rx="8" fill="#B45309"/>
    <text x="105" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">SummaryFlag (Feedback)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F59E0B" font-size="11">🔗 summaryId: String [FK]</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">reason: FlagReason (CONFUSING...)</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">comment: String?</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">status: FlagStatus</text>
  </g>

  <!-- TABLE 11: Message (WhatsApp/SMS Outbox) -->
  <g transform="translate(560, 540)" filter="url(#erdGlow)">
    <rect width="230" height="160" rx="8" fill="#1E293B" stroke="#22C55E" stroke-width="2"/>
    <rect width="230" height="30" rx="8" fill="#15803D"/>
    <text x="115" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">Message (Outbox Delivery)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F59E0B" font-size="11">🔗 orderId: String [FK]</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">channel: Channel (WHATSAPP/SMS)</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">status: MsgStatus (SENT/FAILED...)</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">kind: (SIGN_OFF_LINK / RESEND)</text>
    <text x="15" y="152" fill="#10B981" font-size="10">Zero PHI in message body!</text>
  </g>

  <!-- TABLE 12: AccessLog (DPDP Audit Trail) -->
  <g transform="translate(830, 540)" filter="url(#erdGlow)">
    <rect width="230" height="170" rx="8" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
    <rect width="230" height="30" rx="8" fill="#334155"/>
    <text x="115" y="21" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">AccessLog (Append-Only Audit)</text>
    <text x="15" y="52" fill="#38BDF8" font-size="11">🔑 id: String [PK]</text>
    <text x="15" y="72" fill="#F8FAFC" font-size="11">action: (LINK_OPEN/PHONE_REVEAL...)</text>
    <text x="15" y="92" fill="#F8FAFC" font-size="11">actorType: (PATIENT / STAFF)</text>
    <text x="15" y="112" fill="#F8FAFC" font-size="11">actorId: String</text>
    <text x="15" y="132" fill="#F8FAFC" font-size="11">ipHash: String [Anonymized]</text>
    <text x="15" y="152" fill="#F8FAFC" font-size="11">createdAt: DateTime [INDEX]</text>
  </g>

  <!-- ERD CONNECTIONS -->
  <line x1="250" y1="170" x2="300" y2="170" stroke="#38BDF8" stroke-width="2"/>
  <line x1="415" y1="250" x2="415" y2="300" stroke="#38BDF8" stroke-width="2"/>
  <line x1="560" y1="180" x2="530" y2="350" stroke="#A855F7" stroke-width="1.5"/>
  <line x1="300" y1="390" x2="260" y2="390" stroke="#F59E0B" stroke-width="2"/>
  <line x1="530" y1="390" x2="580" y2="390" stroke="#14B8A6" stroke-width="2"/>
  <line x1="530" y1="420" x2="840" y2="420" stroke="#EF4444" stroke-width="2"/>
  <line x1="350" y1="490" x2="150" y2="540" stroke="#EC4899" stroke-width="1.5"/>
  <line x1="260" y1="620" x2="300" y2="620" stroke="#F59E0B" stroke-width="1.5"/>
  <line x1="470" y1="490" x2="630" y2="540" stroke="#22C55E" stroke-width="1.5"/>
</svg>
"""

# 3. Clinical Workflow Diagram SVG
flow_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 800" width="100%" height="100%" style="background:#0F172A; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;">
  <defs>
    <filter id="wfGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Title -->
  <rect x="30" y="20" width="1040" height="60" rx="10" fill="#0F5E57" filter="url(#wfGlow)"/>
  <text x="50" y="55" fill="#FFFFFF" font-size="20" font-weight="700">Clinical Workflow &amp; Safety State Machine</text>
  <text x="660" y="55" fill="#CCFBF1" font-size="13">LIS Export → Critical Check → Link Generation → Delivery</text>

  <!-- STEP 1: LIS CSV Import -->
  <g transform="translate(40, 110)" filter="url(#wfGlow)">
    <rect width="220" height="150" rx="10" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
    <rect width="220" height="28" rx="8" fill="#0284C7"/>
    <text x="110" y="20" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">STEP 1: LIS CSV Drop</text>
    <text x="15" y="55" fill="#F8FAFC" font-size="12" font-weight="700">Streaming Batch Ingestion</text>
    <text x="15" y="75" fill="#CBD5E1" font-size="11">• 20,000 rows in 286 ms</text>
    <text x="15" y="95" fill="#CBD5E1" font-size="11">• Zod Schema Row Validation</text>
    <text x="15" y="115" fill="#CBD5E1" font-size="11">• E.164 Phone Normalization</text>
    <text x="15" y="135" fill="#10B981" font-size="11">✓ Status Transition: SIGNED</text>
  </g>

  <!-- DECISION: Critical Value Check -->
  <g transform="translate(320, 135)" filter="url(#wfGlow)">
    <polygon points="110,0 220,50 110,100 0,50" fill="#B45309" stroke="#F59E0B" stroke-width="2"/>
    <text x="110" y="47" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">Is Any Value</text>
    <text x="110" y="65" fill="#FEF3C7" font-size="12" font-weight="700" text-anchor="middle">Critical Abnormal?</text>
  </g>

  <!-- PATH A: CRITICAL FLOW (Held Link) -->
  <g transform="translate(590, 110)" filter="url(#wfGlow)">
    <rect width="470" height="250" rx="10" fill="#1E293B" stroke="#EF4444" stroke-width="2"/>
    <rect width="470" height="28" rx="8" fill="#B91C1C"/>
    <text x="235" y="20" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">PATH A (SAFETY CRITICAL): LINK HELD — MANDATORY CALLBACK</text>
    
    <rect x="20" y="45" width="200" height="85" rx="6" fill="#0F172A" stroke="#EF4444" stroke-width="1"/>
    <text x="30" y="68" fill="#EF4444" font-size="12" font-weight="700">1. Suppress Notification</text>
    <text x="30" y="88" fill="#CBD5E1" font-size="11">• Zero SMS/WhatsApp sent</text>
    <text x="30" y="106" fill="#CBD5E1" font-size="11">• Calm notice if accessed</text>
    <text x="30" y="122" fill="#CBD5E1" font-size="11">• Prevents elderly panic</text>

    <rect x="240" y="45" width="210" height="85" rx="6" fill="#0F172A" stroke="#F59E0B" stroke-width="1"/>
    <text x="250" y="68" fill="#F59E0B" font-size="12" font-weight="700">2. Staff Callback Task</text>
    <text x="250" y="88" fill="#CBD5E1" font-size="11">• Alert in /staff/tasks</text>
    <text x="250" y="106" fill="#CBD5E1" font-size="11">• Reveal phone &amp; call</text>
    <text x="250" y="122" fill="#CBD5E1" font-size="11">• Urgent ER/clinic advice</text>

    <rect x="20" y="145" width="430" height="85" rx="6" fill="#0F172A" stroke="#10B981" stroke-width="1"/>
    <text x="30" y="168" fill="#10B981" font-size="12" font-weight="700">3. Release Held Link with Mandatory Clinical Note</text>
    <text x="30" y="188" fill="#CBD5E1" font-size="11">• Front desk enters clinical conversation note (e.g. "Advised immediate ER visit")</text>
    <text x="30" y="206" fill="#CBD5E1" font-size="11">• Status set to DONE → Generates fresh 72h LinkToken → Sends WhatsApp/SMS</text>
  </g>

  <!-- PATH B: NORMAL / NON-CRITICAL FLOW -->
  <g transform="translate(40, 390)" filter="url(#wfGlow)">
    <rect width="1020" height="370" rx="10" fill="#1E293B" stroke="#10B981" stroke-width="2"/>
    <rect width="1020" height="28" rx="8" fill="#15803D"/>
    <text x="510" y="20" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">PATH B (NORMAL / NON-CRITICAL): AUTOMATIC SECURE EXPIRING LINK DELIVERY</text>

    <!-- Substep B1 -->
    <rect x="25" y="50" width="220" height="295" rx="8" fill="#0F172A" stroke="#14B8A6" stroke-width="1.5"/>
    <text x="40" y="75" fill="#14B8A6" font-size="13" font-weight="700">B1: Link Token Creation</text>
    <text x="40" y="100" fill="#CBD5E1" font-size="11">• 32-byte Cryptographic Token</text>
    <text x="40" y="120" fill="#CBD5E1" font-size="11">• SHA-256 Hash stored in DB</text>
    <text x="40" y="140" fill="#CBD5E1" font-size="11">• 72h Lifespan (LINK_TTL)</text>
    <text x="40" y="165" fill="#10B981" font-size="11">Outbox Dispatch:</text>
    <text x="40" y="185" fill="#CBD5E1" font-size="11">• WhatsApp Cloud API / Mock</text>
    <text x="40" y="205" fill="#CBD5E1" font-size="11">• ZERO personal health data</text>
    <text x="40" y="223" fill="#94A3B8" font-size="10">  in message text (No name/test)</text>
    <text x="40" y="250" fill="#CBD5E1" font-size="11">• SMS Fallback if WhatsApp fails</text>
    <text x="40" y="275" fill="#F59E0B" font-size="11">Link: https://.../r/[token]</text>

    <!-- Substep B2 -->
    <rect x="270" y="50" width="230" height="295" rx="8" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
    <text x="285" y="75" fill="#38BDF8" font-size="13" font-weight="700">B2: Landing Gate (/r/:token)</text>
    <text x="285" y="100" fill="#CBD5E1" font-size="11">• GET request is PURE READ-ONLY</text>
    <text x="285" y="118" fill="#94A3B8" font-size="10">  (WhatsApp crawler safe; 0 state)</text>
    <text x="285" y="140" fill="#CBD5E1" font-size="11">• Masked Phone Display:</text>
    <text x="295" y="160" fill="#38BDF8" font-size="12" font-weight="700">••••••0001</text>
    <text x="285" y="190" fill="#EF4444" font-size="12" font-weight="700">"This is not for me" Button:</text>
    <text x="285" y="210" fill="#CBD5E1" font-size="11">• If sent to wrong phone number</text>
    <text x="285" y="230" fill="#CBD5E1" font-size="11">• Instantly revokes token in DB</text>
    <text x="285" y="250" fill="#CBD5E1" font-size="11">• Logs security incident</text>
    <text x="285" y="270" fill="#CBD5E1" font-size="11">• Alerts front desk to fix phone</text>

    <!-- Substep B3 -->
    <rect x="525" y="50" width="220" height="295" rx="8" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="540" y="75" fill="#F59E0B" font-size="13" font-weight="700">B3: Mobile OTP Verification</text>
    <text x="540" y="100" fill="#CBD5E1" font-size="11">• Click "Send OTP to ••••0001"</text>
    <text x="540" y="120" fill="#CBD5E1" font-size="11">• 6-Digit OTP challenge sent</text>
    <text x="540" y="140" fill="#CBD5E1" font-size="11">• 3 Attempts / 10 Min limit</text>
    <text x="540" y="165" fill="#10B981" font-size="11">Security Verification:</text>
    <text x="540" y="185" fill="#CBD5E1" font-size="11">• Re-opening always requires OTP</text>
    <text x="540" y="205" fill="#CBD5E1" font-size="11">• Forwards cannot leak data</text>
    <text x="540" y="230" fill="#CBD5E1" font-size="11">• DPDP Consent Check:</text>
    <text x="550" y="250" fill="#94A3B8" font-size="10">Shows statutory notice if first visit</text>
    <text x="540" y="275" fill="#CBD5E1" font-size="11">• Updates Message: OPENED</text>

    <!-- Substep B4 -->
    <rect x="770" y="50" width="225" height="295" rx="8" fill="#0F172A" stroke="#10B981" stroke-width="1.5"/>
    <text x="785" y="75" fill="#10B981" font-size="13" font-weight="700">B4: Report View &amp; Telugu</text>
    <text x="785" y="100" fill="#CBD5E1" font-size="11">• Plain Language Explanation:</text>
    <text x="795" y="120" fill="#FEF3C7" font-size="12" font-weight="700">English | తెలుగు | हिन्दी</text>
    <text x="785" y="145" fill="#CBD5E1" font-size="11">• Directional Out-of-Range</text>
    <text x="795" y="165" fill="#F59E0B" font-size="11">↓ Low (Amber) / ↑ High</text>
    <text x="785" y="190" fill="#CBD5E1" font-size="11">• "Flag this summary" modal</text>
    <text x="785" y="215" fill="#CBD5E1" font-size="11">• Download Signed PDF:</text>
    <text x="795" y="235" fill="#94A3B8" font-size="10">NABL layout, QR watermark,</text>
    <text x="795" y="250" fill="#94A3B8" font-size="10">pathologist signature</text>
    <text x="785" y="275" fill="#10B981" font-size="11">✓ Logs PDF_DOWNLOAD audit</text>
  </g>

  <!-- FLOW ARROWS -->
  <line x1="260" y1="185" x2="320" y2="185" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="430" y1="150" x2="590" y2="150" stroke="#EF4444" stroke-width="2.5"/>
  <text x="490" y="140" fill="#EF4444" font-size="11" font-weight="700">YES (Critical)</text>
  <line x1="430" y1="220" x2="430" y2="390" stroke="#10B981" stroke-width="2.5"/>
  <text x="440" y="310" fill="#10B981" font-size="11" font-weight="700">NO (Normal / Abnormal)</text>
</svg>
"""

# 4. AI Guardrails Pipeline Diagram SVG
ai_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 780" width="100%" height="100%" style="background:#0F172A; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;">
  <defs>
    <filter id="aiGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Title -->
  <rect x="30" y="20" width="1040" height="60" rx="10" fill="#0F5E57" filter="url(#aiGlow)"/>
  <text x="50" y="55" fill="#FFFFFF" font-size="20" font-weight="700">Guarded Medical AI Pipeline &amp; Multi-Tier Safety Fallbacks</text>
  <text x="690" y="55" fill="#CCFBF1" font-size="13">Zero Hallucinations • 13 Locked Templates • Strict Output Guards</text>

  <!-- STAGE 1: Clinical Rules First -->
  <g transform="translate(40, 110)" filter="url(#aiGlow)">
    <rect width="210" height="630" rx="10" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
    <rect width="210" height="28" rx="8" fill="#0284C7"/>
    <text x="105" y="20" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">STAGE 1: RULES FIRST</text>
    
    <rect x="15" y="45" width="180" height="150" rx="6" fill="#0F172A" stroke="#38BDF8" stroke-width="1"/>
    <text x="25" y="70" fill="#38BDF8" font-size="12" font-weight="700">Deterministic Math Rules</text>
    <text x="25" y="90" fill="#CBD5E1" font-size="11">• Zero LLM for ranges</text>
    <text x="25" y="110" fill="#CBD5E1" font-size="11">• Evaluated in ranges.js</text>
    <text x="25" y="130" fill="#CBD5E1" font-size="11">• Handles: a-b, &lt;b, &gt;=a</text>
    <text x="25" y="150" fill="#CBD5E1" font-size="11">• Flags: NORMAL, LOW, HIGH</text>
    <text x="25" y="175" fill="#10B981" font-size="11">✓ 100% Deterministic</text>

    <rect x="15" y="215" width="180" height="170" rx="6" fill="#0F172A" stroke="#EF4444" stroke-width="1"/>
    <text x="25" y="240" fill="#EF4444" font-size="12" font-weight="700">Critical Value Check</text>
    <text x="25" y="260" fill="#CBD5E1" font-size="11">• Evaluated in critical.js</text>
    <text x="25" y="280" fill="#CBD5E1" font-size="11">• 11 Emergency Rules</text>
    <text x="25" y="300" fill="#CBD5E1" font-size="11">• Potassium &gt;6.5 / &lt;2.5</text>
    <text x="25" y="320" fill="#CBD5E1" font-size="11">• Haemoglobin &lt;7.0 g/dL</text>
    <text x="25" y="345" fill="#EF4444" font-size="11">IF CRITICAL:</text>
    <text x="25" y="365" fill="#FEF3C7" font-size="10">Bypass ALL AI → Emit Calm Notice</text>

    <rect x="15" y="405" width="180" height="205" rx="6" fill="#0F172A" stroke="#10B981" stroke-width="1"/>
    <text x="25" y="430" fill="#10B981" font-size="12" font-weight="700">Normal Values</text>
    <text x="25" y="450" fill="#CBD5E1" font-size="11">• If all results in range:</text>
    <text x="25" y="470" fill="#CBD5E1" font-size="11">• Zero AI calls made</text>
    <text x="25" y="490" fill="#CBD5E1" font-size="11">• Instant Green Banner:</text>
    <text x="30" y="515" fill="#86EFAC" font-size="11">"All tested parameters</text>
    <text x="30" y="530" fill="#86EFAC" font-size="11">are within standard</text>
    <text x="30" y="545" fill="#86EFAC" font-size="11">reference range."</text>
    <text x="25" y="580" fill="#94A3B8" font-size="10">Available in en / te / hi</text>
  </g>

  <!-- STAGE 2: 13 Locked Templates -->
  <g transform="translate(290, 110)" filter="url(#aiGlow)">
    <rect width="230" height="630" rx="10" fill="#1E293B" stroke="#14B8A6" stroke-width="2"/>
    <rect width="230" height="28" rx="8" fill="#0F5E57"/>
    <text x="115" y="20" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">STAGE 2: LOCKED TEMPLATES</text>

    <rect x="15" y="45" width="200" height="260" rx="6" fill="#0F172A" stroke="#14B8A6" stroke-width="1"/>
    <text x="25" y="70" fill="#14B8A6" font-size="12" font-weight="700">Covering &gt;85% of Outpatient Tests</text>
    <text x="25" y="95" fill="#CBD5E1" font-size="11">• Haemoglobin (ORD-71204)</text>
    <text x="25" y="115" fill="#CBD5E1" font-size="11">• Fasting Blood Glucose</text>
    <text x="25" y="135" fill="#CBD5E1" font-size="11">• HbA1c (Glycated Hb)</text>
    <text x="25" y="155" fill="#CBD5E1" font-size="11">• Total Cholesterol</text>
    <text x="25" y="175" fill="#CBD5E1" font-size="11">• LDL Cholesterol (ORD-71219)</text>
    <text x="25" y="195" fill="#CBD5E1" font-size="11">• HDL Cholesterol</text>
    <text x="25" y="215" fill="#CBD5E1" font-size="11">• Serum Triglycerides</text>
    <text x="25" y="235" fill="#CBD5E1" font-size="11">• Serum Creatinine</text>
    <text x="25" y="255" fill="#CBD5E1" font-size="11">• Thyroid TSH, Platelets, etc.</text>
    <text x="25" y="285" fill="#10B981" font-size="11">✓ Zero AI latency (0 ms)</text>

    <rect x="15" y="325" width="200" height="285" rx="6" fill="#0F172A" stroke="#F59E0B" stroke-width="1"/>
    <text x="25" y="350" fill="#F59E0B" font-size="12" font-weight="700">Native Indic Translations</text>
    <text x="25" y="375" fill="#CBD5E1" font-size="11">• Clinically curated in Telugu:</text>
    <text x="30" y="400" fill="#FEF3C7" font-size="11">"హీమోగ్లోబిన్ సాధారణ స్థాయి</text>
    <text x="30" y="415" fill="#FEF3C7" font-size="11">కంటే తక్కువగా ఉంది..."</text>
    <text x="25" y="445" fill="#CBD5E1" font-size="11">• Clinically curated in Hindi:</text>
    <text x="30" y="470" fill="#FEF3C7" font-size="11">"हीमोग्लोबिन सामान्य स्तर से</text>
    <text x="30" y="485" fill="#FEF3C7" font-size="11">कम है..."</text>
    <text x="25" y="520" fill="#10B981" font-size="11">✓ Always links to full PDF</text>
    <text x="25" y="545" fill="#10B981" font-size="11">✓ Never invents numbers</text>
    <text x="25" y="570" fill="#10B981" font-size="11">✓ Zero hallucinations</text>
    <text x="25" y="595" fill="#38BDF8" font-size="10">BYPASSES AI API COMPLETELY</text>
  </g>

  <!-- STAGE 3: AI Fallback with Input Guard -->
  <g transform="translate(560, 110)" filter="url(#aiGlow)">
    <rect width="230" height="630" rx="10" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
    <rect width="230" height="28" rx="8" fill="#B45309"/>
    <text x="115" y="20" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">STAGE 3: GUARDED AI API</text>

    <rect x="15" y="45" width="200" height="150" rx="6" fill="#0F172A" stroke="#EF4444" stroke-width="1"/>
    <text x="25" y="70" fill="#EF4444" font-size="12" font-weight="700">Input Guardrail (Whitelist)</text>
    <text x="25" y="90" fill="#CBD5E1" font-size="11">• Regex Whitelist on param:</text>
    <text x="30" y="110" fill="#38BDF8" font-size="10">^[A-Za-z0-9 ()/%.,+\-µ]{1,60}$</text>
    <text x="25" y="130" fill="#CBD5E1" font-size="11">• Max 6 words per param</text>
    <text x="25" y="150" fill="#CBD5E1" font-size="11">• Blocks prompt injection</text>
    <text x="25" y="170" fill="#FEF3C7" font-size="11">Fails? → Drop to Safe Fallback</text>

    <rect x="15" y="215" width="200" height="200" rx="6" fill="#0F172A" stroke="#EC4899" stroke-width="1"/>
    <text x="25" y="240" fill="#EC4899" font-size="12" font-weight="700">LLM Generation Parameters</text>
    <text x="25" y="260" fill="#CBD5E1" font-size="11">• Model: OpenRouter free tier</text>
    <text x="30" y="278" fill="#94A3B8" font-size="10">  (NVIDIA Nemotron / Claude)</text>
    <text x="25" y="298" fill="#CBD5E1" font-size="11">• Temperature: 0.0 (Zero drift)</text>
    <text x="25" y="318" fill="#CBD5E1" font-size="11">• Timeout: 12 seconds</text>
    <text x="25" y="338" fill="#CBD5E1" font-size="11">• Retries: 1 retry before fallback</text>
    <text x="25" y="358" fill="#CBD5E1" font-size="11">• Prompt format: Strict JSON</text>
    <text x="25" y="378" fill="#CBD5E1" font-size="11">• No medical prescriptions</text>
    <text x="25" y="398" fill="#CBD5E1" font-size="11">• No diagnostic declarations</text>

    <rect x="15" y="435" width="200" height="175" rx="6" fill="#0F172A" stroke="#64748B" stroke-width="1"/>
    <text x="25" y="460" fill="#94A3B8" font-size="12" font-weight="700">Network / Quota Catch</text>
    <text x="25" y="480" fill="#CBD5E1" font-size="11">• If API key is missing,</text>
    <text x="25" y="500" fill="#CBD5E1" font-size="11">• HTTP 429 quota reached,</text>
    <text x="25" y="520" fill="#CBD5E1" font-size="11">• or socket timeout occurs:</text>
    <text x="25" y="545" fill="#10B981" font-size="11">✓ NEVER crashes the server</text>
    <text x="25" y="565" fill="#10B981" font-size="11">✓ Seamlessly defaults to</text>
    <text x="30" y="585" fill="#FEF3C7" font-size="11">  Deterministic Safe Fallback</text>
  </g>

  <!-- STAGE 4: Multi-Stage Output Guard -->
  <g transform="translate(830, 110)" filter="url(#aiGlow)">
    <rect width="230" height="630" rx="10" fill="#1E293B" stroke="#22C55E" stroke-width="2"/>
    <rect width="230" height="28" rx="8" fill="#15803D"/>
    <text x="115" y="20" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">STAGE 4: OUTPUT GUARDS</text>

    <rect x="15" y="45" width="200" height="150" rx="6" fill="#0F172A" stroke="#EF4444" stroke-width="1"/>
    <text x="25" y="70" fill="#EF4444" font-size="12" font-weight="700">Guard 1: Number Verification</text>
    <text x="25" y="90" fill="#CBD5E1" font-size="11">• Regex extracts all numbers</text>
    <text x="25" y="110" fill="#CBD5E1" font-size="11">• Must exist in input report</text>
    <text x="25" y="130" fill="#CBD5E1" font-size="11">• Invented numbers rejected</text>
    <text x="25" y="150" fill="#94A3B8" font-size="10">(e.g. "Take 5000 IU" fails)</text>
    <text x="25" y="175" fill="#FEF3C7" font-size="11">Fails? → Safe Fallback</text>

    <rect x="15" y="215" width="200" height="150" rx="6" fill="#0F172A" stroke="#EF4444" stroke-width="1"/>
    <text x="25" y="240" fill="#EF4444" font-size="12" font-weight="700">Guard 2: Banned Words</text>
    <text x="25" y="260" fill="#CBD5E1" font-size="11">• Immediate rejection for:</text>
    <text x="30" y="280" fill="#F87171" font-size="11">- "cancer", "diabetes"</text>
    <text x="30" y="296" fill="#F87171" font-size="11">- "medicine", "tablet"</text>
    <text x="30" y="312" fill="#F87171" font-size="11">- "diagnos", "cure", "you have"</text>
    <text x="25" y="340" fill="#FEF3C7" font-size="11">Fails? → Safe Fallback</text>

    <rect x="15" y="385" width="200" height="225" rx="6" fill="#0F172A" stroke="#10B981" stroke-width="1"/>
    <text x="25" y="410" fill="#10B981" font-size="12" font-weight="700">Deterministic Fallback</text>
    <text x="25" y="435" fill="#CBD5E1" font-size="11">• Guaranteed Safe Output:</text>
    <text x="30" y="460" fill="#86EFAC" font-size="11">"The value for {param} is</text>
    <text x="30" y="475" fill="#86EFAC" font-size="11">outside the usual range.</text>
    <text x="30" y="490" fill="#86EFAC" font-size="11">Please consult your doctor."</text>
    <text x="25" y="525" fill="#CBD5E1" font-size="11">• Weekly Pathologist Review:</text>
    <text x="30" y="545" fill="#94A3B8" font-size="10">50 summaries/week audited</text>
    <text x="30" y="560" fill="#94A3B8" font-size="10">in /staff/tasks console</text>
    <text x="25" y="585" fill="#10B981" font-size="11">✓ Zero Legal/Clinical Liability</text>
  </g>

  <!-- ARROWS -->
  <line x1="250" y1="200" x2="290" y2="200" stroke="#38BDF8" stroke-width="2"/>
  <line x1="520" y1="200" x2="560" y2="200" stroke="#14B8A6" stroke-width="2"/>
  <line x1="790" y1="200" x2="830" y2="200" stroke="#F59E0B" stroke-width="2"/>
</svg>
"""

# Write all to docs/diagrams and docs/
files = [
    ("architecture-diagram.svg", arch_svg),
    ("erd-diagram.svg", erd_svg),
    ("workflow-diagram.svg", flow_svg),
    ("ai-pipeline-diagram.svg", ai_svg)
]

for name, content in files:
    # in docs/diagrams
    p1 = os.path.join(DIAGRAMS_DIR, name)
    with open(p1, "w", encoding="utf-8") as f:
        f.write(content.strip())
    # in docs/
    p2 = os.path.join(DOCS_DIR, name)
    with open(p2, "w", encoding="utf-8") as f:
        f.write(content.strip())
    print(f"Generated {name}")

print("All 4 SVGs successfully written.")
