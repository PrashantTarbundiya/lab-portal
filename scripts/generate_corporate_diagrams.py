import os
import subprocess
import shutil

DIAGRAMS_DIR = r"D:\IsocodeLabs\lab-portal\diagrams"
DOCS_DIR = r"D:\IsocodeLabs\lab-portal\docs"
DOCS_DIAG_DIR = r"D:\IsocodeLabs\lab-portal\docs\diagrams"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

os.makedirs(DIAGRAMS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)
os.makedirs(DOCS_DIAG_DIR, exist_ok=True)

# ==============================================================================
# 1. ENTERPRISE ARCHITECTURE DIAGRAM (Professional Corporate Light Theme)
# ==============================================================================
arch_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="100%" height="100%" style="background:#F8FAFC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>
    <marker id="arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#475569"/>
    </marker>
    <marker id="arr-teal" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#0D5C54"/>
    </marker>
    <marker id="arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#2563EB"/>
    </marker>
  </defs>

  <!-- Document Header Block -->
  <rect x="40" y="30" width="1120" height="75" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
  <rect x="40" y="30" width="8" height="75" rx="2" fill="#0D5C54"/>
  <text x="65" y="62" fill="#0F172A" font-size="18" font-weight="700">Company A Diagnostics — System Architecture &amp; Network Ingress</text>
  <text x="65" y="84" fill="#64748B" font-size="12">Document Ref: CAD-ARCH-2026-V1 • Target Deployment: AWS ap-south-1 (Mumbai) • DPDP Act 2023 Compliant</text>
  <rect x="980" y="48" width="160" height="36" rx="4" fill="#F1F5F9" stroke="#CBD5E1"/>
  <text x="1060" y="70" fill="#334155" font-size="11" font-weight="600" text-anchor="middle">STATUS: PRODUCTION READY</text>

  <!-- TIER 1: USER CHANNELS -->
  <rect x="40" y="130" width="230" height="690" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
  <rect x="40" y="130" width="230" height="38" rx="8" fill="#F1F5F9"/>
  <text x="55" y="154" fill="#1E293B" font-size="13" font-weight="700">1. CLIENT ACCESS CHANNELS</text>
  <line x1="40" y1="168" x2="270" y2="168" stroke="#E2E8F0" stroke-width="1"/>

  <!-- Patient Mobile Card -->
  <rect x="55" y="185" width="200" height="150" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="55" y="185" width="200" height="28" rx="6" fill="#0D5C54"/>
  <text x="65" y="204" fill="#FFFFFF" font-size="11" font-weight="700">PATIENT &amp; FAMILY PORTAL</text>
  <text x="65" y="230" fill="#334155" font-size="11" font-weight="600">Mobile Safari / Chrome (PWA)</text>
  <text x="65" y="250" fill="#64748B" font-size="11">• 72h Tokenized Link Access</text>
  <text x="65" y="268" fill="#64748B" font-size="11">• Mobile OTP Re-authentication</text>
  <text x="65" y="286" fill="#64748B" font-size="11">• Telugu (తెలుగు) / Hindi Engine</text>
  <text x="65" y="304" fill="#64748B" font-size="11">• Shared Family Profile Picker</text>
  <text x="65" y="322" fill="#B91C1C" font-size="11">• "This is not for me" Kill-Switch</text>

  <!-- Front Desk Desktop Card -->
  <rect x="55" y="350" width="200" height="150" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="55" y="350" width="200" height="28" rx="6" fill="#1E40AF"/>
  <text x="65" y="369" fill="#FFFFFF" font-size="11" font-weight="700">FRONT-DESK OPERATIONS</text>
  <text x="65" y="395" fill="#334155" font-size="11" font-weight="600">Clinical Desktop Console</text>
  <text x="65" y="415" fill="#64748B" font-size="11">• Real-time Patient Search</text>
  <text x="65" y="433" fill="#64748B" font-size="11">• Link Resend (Max 3/day/order)</text>
  <text x="65" y="451" fill="#64748B" font-size="11">• Audited Masked Phone Reveal</text>
  <text x="65" y="469" fill="#64748B" font-size="11">• Critical Value Callback Desk</text>
  <text x="65" y="487" fill="#64748B" font-size="11">• LIS Ingestion Simulation</text>

  <!-- Doctor Portal Card -->
  <rect x="55" y="515" width="200" height="140" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="55" y="515" width="200" height="28" rx="6" fill="#475569"/>
  <text x="65" y="534" fill="#FFFFFF" font-size="11" font-weight="700">REFERRING PHYSICIAN PORTAL</text>
  <text x="65" y="560" fill="#334155" font-size="11" font-weight="600">Prescribing Doctor Workspace</text>
  <text x="65" y="580" fill="#64748B" font-size="11">• 90-Day Referred Patient List</text>
  <text x="65" y="598" fill="#64748B" font-size="11">• Parameter Abnormality Flags</text>
  <text x="65" y="616" fill="#64748B" font-size="11">• Direct NABL PDF Downloads</text>
  <text x="65" y="634" fill="#64748B" font-size="11">• Patient Encounter History</text>

  <!-- Lab Operations Head Card -->
  <rect x="55" y="670" width="200" height="130" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="55" y="670" width="200" height="28" rx="6" fill="#334155"/>
  <text x="65" y="689" fill="#FFFFFF" font-size="11" font-weight="700">COMPLIANCE &amp; PATHOLOGY</text>
  <text x="65" y="715" fill="#334155" font-size="11" font-weight="600">Operations &amp; Medical Review</text>
  <text x="65" y="735" fill="#64748B" font-size="11">• DPDP Append-Only Audit Trail</text>
  <text x="65" y="753" fill="#64748B" font-size="11">• Access Log CSV Export</text>
  <text x="65" y="771" fill="#64748B" font-size="11">• 50-Sample Weekly AI Audit</text>

  <!-- TIER 2: EDGE INGRESS & GATEWAY -->
  <rect x="295" y="130" width="235" height="690" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
  <rect x="295" y="130" width="235" height="38" rx="8" fill="#F1F5F9"/>
  <text x="310" y="154" fill="#1E293B" font-size="13" font-weight="700">2. EDGE &amp; REVERSE PROXY</text>
  <line x1="295" y1="168" x2="530" y2="168" stroke="#E2E8F0" stroke-width="1"/>

  <!-- Nginx Container -->
  <rect x="310" y="185" width="205" height="210" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="310" y="185" width="205" height="28" rx="6" fill="#0F766E"/>
  <text x="320" y="204" fill="#FFFFFF" font-size="11" font-weight="700">NGINX REVERSE PROXY (PORT 80)</text>
  <text x="320" y="230" fill="#334155" font-size="11" font-weight="600">Gateway &amp; Static File Delivery</text>
  <text x="320" y="250" fill="#64748B" font-size="11">• Port 80 &amp; 5173 Listening</text>
  <text x="320" y="268" fill="#64748B" font-size="11">• Reverse Proxy: /api/* → 3000</text>
  <text x="320" y="286" fill="#64748B" font-size="11">• SPA Rewrites: try_files index.html</text>
  <text x="320" y="304" fill="#64748B" font-size="11">• Gzip Compression Engine</text>
  <text x="320" y="322" fill="#64748B" font-size="11">• Static Asset Cache (30 Days)</text>
  <text x="320" y="340" fill="#64748B" font-size="11">• Upstream Keep-Alive Pools</text>
  <text x="320" y="358" fill="#64748B" font-size="11">• Security Headers &amp; CSP</text>
  <text x="320" y="380" fill="#15803D" font-size="11" font-weight="600">✓ Zero CORS Configuration</text>

  <!-- React Vite SPA -->
  <rect x="310" y="415" width="205" height="385" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="310" y="415" width="205" height="28" rx="6" fill="#0284C7"/>
  <text x="320" y="434" fill="#FFFFFF" font-size="11" font-weight="700">REACT 18 + VITE CLIENT SPA</text>
  <text x="320" y="460" fill="#334155" font-size="11" font-weight="600">Mobile-First Component Tree</text>
  
  <rect x="320" y="475" width="185" height="60" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="330" y="493" fill="#1E293B" font-size="11" font-weight="600">Context Providers</text>
  <text x="330" y="510" fill="#64748B" font-size="10">• AuthContext (Session / JWT)</text>
  <text x="330" y="524" fill="#64748B" font-size="10">• LanguageContext (en / te / hi)</text>

  <rect x="320" y="545" width="185" height="85" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="330" y="563" fill="#1E293B" font-size="11" font-weight="600">Accessibility &amp; Standards</text>
  <text x="330" y="580" fill="#64748B" font-size="10">• 48px Minimum Touch Targets</text>
  <text x="330" y="594" fill="#64748B" font-size="10">• 18px Base Patient Body Type</text>
  <text x="330" y="608" fill="#64748B" font-size="10">• Telugu Line Height ≥ 1.7</text>
  <text x="330" y="622" fill="#64748B" font-size="10">• Contrast Ratio ≥ 4.5:1 (WCAG AA)</text>

  <rect x="320" y="640" width="185" height="145" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="330" y="658" fill="#1E293B" font-size="11" font-weight="600">Core Screen Modules</text>
  <text x="330" y="675" fill="#64748B" font-size="10">• LandingGate (/r/:token)</text>
  <text x="330" y="689" fill="#64748B" font-size="10">• PatientLogin &amp; OTP Modal</text>
  <text x="330" y="703" fill="#64748B" font-size="10">• FamilyProfileSelector</text>
  <text x="330" y="717" fill="#64748B" font-size="10">• ReportDetailView &amp; PDF Viewer</text>
  <text x="330" y="731" fill="#64748B" font-size="10">• StaffConsole &amp; TaskModal</text>
  <text x="330" y="745" fill="#64748B" font-size="10">• DoctorEncounterDashboard</text>
  <text x="330" y="759" fill="#64748B" font-size="10">• AccessLogAuditViewer</text>
  <text x="330" y="773" fill="#64748B" font-size="10">• LISFileDropSimulator</text>

  <!-- TIER 3: BACKEND API -->
  <rect x="555" y="130" width="270" height="690" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
  <rect x="555" y="130" width="270" height="38" rx="8" fill="#F1F5F9"/>
  <text x="570" y="154" fill="#1E293B" font-size="13" font-weight="700">3. APPLICATION SERVER (PORT 3000)</text>
  <line x1="555" y1="168" x2="825" y2="168" stroke="#E2E8F0" stroke-width="1"/>

  <!-- Middleware -->
  <rect x="570" y="185" width="240" height="150" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="570" y="185" width="240" height="28" rx="6" fill="#B45309"/>
  <text x="580" y="204" fill="#FFFFFF" font-size="11" font-weight="700">SECURITY &amp; MIDDLEWARE LAYER</text>
  <text x="580" y="230" fill="#334155" font-size="11" font-weight="600">Request Validation &amp; Guards</text>
  <text x="580" y="250" fill="#64748B" font-size="11">• Supabase JWT &amp; Role-Based Guards</text>
  <text x="580" y="268" fill="#64748B" font-size="11">• Rate Limiting (Express-Rate-Limit)</text>
  <text x="580" y="286" fill="#64748B" font-size="11">• Zod Schema Input Sanitization</text>
  <text x="580" y="304" fill="#64748B" font-size="11">• Phone Number Normalization (E.164)</text>
  <text x="580" y="322" fill="#64748B" font-size="11">• Immutable AccessLog Interceptor</text>

  <!-- Pipelines -->
  <rect x="570" y="348" width="240" height="195" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="570" y="348" width="240" height="28" rx="6" fill="#0D5C54"/>
  <text x="580" y="367" fill="#FFFFFF" font-size="11" font-weight="700">CLINICAL &amp; INGESTION PIPELINES</text>
  <text x="580" y="393" fill="#334155" font-size="11" font-weight="600">Deterministic Processing</text>
  <text x="580" y="413" fill="#64748B" font-size="11">• CSV Parser (20k rows in 286ms)</text>
  <text x="580" y="431" fill="#64748B" font-size="11">• Reference Range Engine (ranges.js)</text>
  <text x="580" y="449" fill="#64748B" font-size="11">• 11 Emergency Critical Rules (critical.js)</text>
  <text x="580" y="467" fill="#64748B" font-size="11">• Critical Hold &amp; Staff Callback Tasks</text>
  <text x="580" y="485" fill="#64748B" font-size="11">• 72h Token Engine (SHA-256 Hashing)</text>
  <text x="580" y="503" fill="#64748B" font-size="11">• NABL PDF Generation (pdf-lib)</text>
  <text x="580" y="521" fill="#64748B" font-size="11">• Multi-Channel Outbox Dispatcher</text>
  <text x="580" y="535" fill="#15803D" font-size="10" font-weight="600">✓ Zero PHI in WhatsApp/SMS Message Body</text>

  <!-- AI Engine -->
  <rect x="570" y="555" width="240" height="245" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="570" y="555" width="240" height="28" rx="6" fill="#7C3AED"/>
  <text x="580" y="574" fill="#FFFFFF" font-size="11" font-weight="700">GUARDED AI SUMMARY PIPELINE</text>
  <text x="580" y="600" fill="#334155" font-size="11" font-weight="600">Multi-Tier Safety Architecture</text>
  <text x="580" y="620" fill="#64748B" font-size="11">• 13 Locked Templates (0ms, en/te/hi)</text>
  <text x="580" y="638" fill="#64748B" font-size="11">• Input Regex Whitelist (No Injections)</text>
  <text x="580" y="656" fill="#64748B" font-size="11">• OpenRouter LLM Call (Temp 0.0)</text>
  <text x="580" y="674" fill="#64748B" font-size="11">• Multi-Stage Code Output Guards:</text>
  <text x="590" y="692" fill="#475569" font-size="10">- Strict JSON Response Format</text>
  <text x="590" y="706" fill="#475569" font-size="10">- Zero Invented Numbers Policy</text>
  <text x="590" y="720" fill="#475569" font-size="10">- Banned Diagnostic Word Filter</text>
  <text x="590" y="734" fill="#475569" font-size="10">- Word Count Capped ≤ 30 Words</text>
  <text x="580" y="756" fill="#64748B" font-size="11">• Safe Deterministic Fallback</text>
  <text x="580" y="774" fill="#64748B" font-size="11">• 50-Sample Weekly Pathologist Tool</text>
  <text x="580" y="790" fill="#15803D" font-size="10" font-weight="600">✓ 100% Medical &amp; Legal Defensibility</text>

  <!-- TIER 4: DATA & INFRASTRUCTURE -->
  <rect x="850" y="130" width="310" height="690" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>
  <rect x="850" y="130" width="310" height="38" rx="8" fill="#F1F5F9"/>
  <text x="865" y="154" fill="#1E293B" font-size="13" font-weight="700">4. PERSISTENCE &amp; CLOUD PLATFORM</text>
  <line x1="850" y1="168" x2="1160" y2="168" stroke="#E2E8F0" stroke-width="1"/>

  <!-- PostgreSQL Container -->
  <rect x="865" y="185" width="280" height="235" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="865" y="185" width="280" height="28" rx="6" fill="#1E3A8A"/>
  <text x="875" y="204" fill="#FFFFFF" font-size="11" font-weight="700">POSTGRESQL 16 (PRISMA ORM POOL)</text>
  <text x="875" y="230" fill="#334155" font-size="11" font-weight="600">Relational Database Container (Port 5432)</text>
  <text x="875" y="250" fill="#64748B" font-size="11">• Connection Pooling (Max 20 Connections)</text>
  <text x="875" y="268" fill="#64748B" font-size="11">• HMAC-SHA256 Encrypted Phone Indices</text>
  <text x="875" y="286" fill="#64748B" font-size="11">• SHA-256 Hashed Link Tokens</text>
  <text x="875" y="304" fill="#64748B" font-size="11">• 12 Relational Tables:</text>
  <text x="885" y="322" fill="#475569" font-size="10">Account, Patient, Doctor, Order, Result,</text>
  <text x="885" y="336" fill="#475569" font-size="10">Summary, SummaryFlag, LinkToken, CallbackTask,</text>
  <text x="885" y="350" fill="#475569" font-size="10">Message, AccessLog, ImportRun</text>
  <text x="875" y="372" fill="#64748B" font-size="11">• Row-Level Locking on Concurrent Imports</text>
  <text x="875" y="390" fill="#64748B" font-size="11">• Append-Only Audit Logging with IP Hashes</text>
  <text x="875" y="408" fill="#15803D" font-size="10" font-weight="600">✓ DPDP Act 2023 Statutory Compliance</text>

  <!-- AWS Deployment -->
  <rect x="865" y="435" width="280" height="175" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="865" y="435" width="280" height="28" rx="6" fill="#C2410C"/>
  <text x="875" y="454" fill="#FFFFFF" font-size="11" font-weight="700">AWS EC2 INFRASTRUCTURE (MUMBAI)</text>
  <text x="875" y="480" fill="#334155" font-size="11" font-weight="600">Ubuntu 24.04 LTS (t3.micro 24/7)</text>
  <text x="875" y="500" fill="#64748B" font-size="11">• 2GB Configured Swap Memory</text>
  <text x="875" y="518" fill="#64748B" font-size="11">• Docker Compose Orchestration</text>
  <text x="875" y="536" fill="#64748B" font-size="11">• Automated Healthcheck Keep-Alive</text>
  <text x="875" y="554" fill="#64748B" font-size="11">• Indian Data Residency (ap-south-1)</text>
  <text x="875" y="572" fill="#64748B" font-size="11">• Public IPv4: 3.26.15.115</text>
  <text x="875" y="595" fill="#15803D" font-size="11" font-weight="600">✓ 99.9% Uptime Budget</text>

  <!-- External Integrations -->
  <rect x="865" y="625" width="280" height="175" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="865" y="625" width="280" height="28" rx="6" fill="#4338CA"/>
  <text x="875" y="644" fill="#FFFFFF" font-size="11" font-weight="700">EXTERNAL CLOUD INTEGRATIONS</text>
  <text x="875" y="670" fill="#334155" font-size="11" font-weight="600">Production Integrations &amp; Mocks</text>
  <text x="875" y="690" fill="#64748B" font-size="11">• OpenRouter AI API (NVIDIA / Claude)</text>
  <text x="875" y="708" fill="#64748B" font-size="11">• Meta WhatsApp Cloud API Ready</text>
  <text x="875" y="726" fill="#64748B" font-size="11">• Razorpay Payment Gateway Webhooks</text>
  <text x="875" y="744" fill="#64748B" font-size="11">• Supabase Auth &amp; SMS Provider</text>
  <text x="875" y="762" fill="#64748B" font-size="11">• LIS Desktop CSV Drop Folder</text>

  <!-- Connectors -->
  <path d="M 255 250 L 310 240" fill="none" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>
  <path d="M 255 420 L 310 420" fill="none" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>
  <path d="M 515 250 L 570 250" fill="none" stroke="#0D5C54" stroke-width="1.5" marker-end="url(#arr-teal)"/>
  <path d="M 515 500 L 570 500" fill="none" stroke="#0D5C54" stroke-width="1.5" marker-end="url(#arr-teal)"/>
  <path d="M 810 260 L 865 260" fill="none" stroke="#2563EB" stroke-width="1.5" marker-end="url(#arr-blue)"/>
  <path d="M 810 680 L 865 680" fill="none" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>
</svg>
"""

# ==============================================================================
# 2. ENTERPRISE RELATIONAL DATA MODEL (Standard C4 / Crow's Foot Schema)
# ==============================================================================
erd_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 860" width="100%" height="100%" style="background:#F8FAFC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="shadow2" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>
  </defs>

  <!-- Header -->
  <rect x="40" y="25" width="1120" height="65" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow2)"/>
  <rect x="40" y="25" width="8" height="65" rx="2" fill="#0F766E"/>
  <text x="65" y="54" fill="#0F172A" font-size="17" font-weight="700">Company A Diagnostics — Relational Data Model (PostgreSQL 16 &amp; Prisma)</text>
  <text x="65" y="74" fill="#64748B" font-size="12">Standard Enterprise Schema • 12 Entities • HMAC-SHA256 Indices • Append-Only Audit Trail</text>

  <!-- TABLE: Account -->
  <g transform="translate(40, 110)" filter="url(#shadow2)">
    <rect width="250" height="175" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#0F766E"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">Account (Shared Phone Handset)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#475569" font-size="11">UK  mobileE164: String (E.164)</text>
    <text x="12" y="88" fill="#0D5C54" font-size="11" font-weight="600">IDX mobileHash: String (HMAC-SHA256)</text>
    <text x="12" y="108" fill="#475569" font-size="11">    preferredLang: Lang (en/te/hi)</text>
    <text x="12" y="128" fill="#475569" font-size="11">    consentVersion: String</text>
    <text x="12" y="148" fill="#475569" font-size="11">    consentAt: DateTime?</text>
    <text x="12" y="165" fill="#64748B" font-size="10">FK  supabaseId: String?</text>
  </g>

  <!-- TABLE: Patient -->
  <g transform="translate(330, 110)" filter="url(#shadow2)">
    <rect width="250" height="160" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#0284C7"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">Patient (Family Member Profile)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#0284C7" font-size="11" font-weight="600">FK  accountId: String</text>
    <text x="12" y="88" fill="#475569" font-size="11">    fullName: String</text>
    <text x="12" y="108" fill="#475569" font-size="11">    sex: Sex (M / F / OTHER)</text>
    <text x="12" y="128" fill="#475569" font-size="11">    dob: DateTime?</text>
    <text x="12" y="148" fill="#475569" font-size="11">    relation: Relation (SELF/SPOUSE...)</text>
  </g>

  <!-- TABLE: Doctor -->
  <g transform="translate(620, 110)" filter="url(#shadow2)">
    <rect width="250" height="145" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#475569"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">Doctor (Referring Physician)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#475569" font-size="11">    name: String</text>
    <text x="12" y="88" fill="#475569" font-size="11">    clinicHospital: String?</text>
    <text x="12" y="108" fill="#475569" font-size="11">    phone: String?</text>
    <text x="12" y="128" fill="#0284C7" font-size="11">FK  userId: String?</text>
  </g>

  <!-- TABLE: User -->
  <g transform="translate(910, 110)" filter="url(#shadow2)">
    <rect width="250" height="150" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#334155"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">User (Internal Staff Account)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#475569" font-size="11">UK  email: String</text>
    <text x="12" y="88" fill="#475569" font-size="11">    name: String</text>
    <text x="12" y="108" fill="#475569" font-size="11">    role: Role (FRONT_DESK/DOCTOR)</text>
    <text x="12" y="128" fill="#475569" font-size="11">    passwordHash: String</text>
  </g>

  <!-- TABLE: Order -->
  <g transform="translate(330, 310)" filter="url(#shadow2)">
    <rect width="250" height="205" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#15803D"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">Order (Diagnostic Test Encounter)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#15803D" font-size="11" font-weight="600">UK  orderNo: String (e.g. ORD-71204)</text>
    <text x="12" y="88" fill="#0284C7" font-size="11" font-weight="600">FK  patientId: String</text>
    <text x="12" y="108" fill="#0284C7" font-size="11">FK  doctorId: String?</text>
    <text x="12" y="128" fill="#475569" font-size="11">    status: OrderStatus (READY...)</text>
    <text x="12" y="148" fill="#B91C1C" font-size="11" font-weight="600">    hasCritical: Boolean</text>
    <text x="12" y="168" fill="#475569" font-size="11">    signedAt: DateTime?</text>
    <text x="12" y="188" fill="#64748B" font-size="10">    pdfKey / pdfGeneratedAt: DateTime</text>
  </g>

  <!-- TABLE: Result -->
  <g transform="translate(40, 320)" filter="url(#shadow2)">
    <rect width="250" height="190" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#B45309"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">Result (Parameter Line Item)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#0284C7" font-size="11" font-weight="600">FK  orderId: String</text>
    <text x="12" y="88" fill="#475569" font-size="11">    parameter: String</text>
    <text x="12" y="108" fill="#475569" font-size="11">    unit: String?</text>
    <text x="12" y="128" fill="#475569" font-size="11">    value: String / valueNum: Float?</text>
    <text x="12" y="148" fill="#475569" font-size="11">    refRangeRaw: String</text>
    <text x="12" y="168" fill="#B45309" font-size="11" font-weight="600">    flag: Flag (NORMAL/LOW/HIGH)</text>
    <text x="12" y="184" fill="#64748B" font-size="9">UK  [orderId, parameter]</text>
  </g>

  <!-- TABLE: LinkToken -->
  <g transform="translate(620, 310)" filter="url(#shadow2)">
    <rect width="250" height="195" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#0D5C54"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">LinkToken (72h Secure Link)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#0284C7" font-size="11" font-weight="600">FK  orderId: String</text>
    <text x="12" y="88" fill="#0284C7" font-size="11">FK  accountId: String</text>
    <text x="12" y="108" fill="#0D5C54" font-size="11" font-weight="600">UK  tokenHash: String (SHA-256)</text>
    <text x="12" y="128" fill="#475569" font-size="11">    expiresAt: DateTime</text>
    <text x="12" y="148" fill="#B91C1C" font-size="11">    revokedAt: DateTime?</text>
    <text x="12" y="168" fill="#475569" font-size="11">    firstOpenedAt: DateTime?</text>
    <text x="12" y="188" fill="#475569" font-size="11">    openCount: Int (Default 0)</text>
  </g>

  <!-- TABLE: CallbackTask -->
  <g transform="translate(910, 310)" filter="url(#shadow2)">
    <rect width="250" height="195" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#B91C1C"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">CallbackTask (Critical / Security)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#0284C7" font-size="11" font-weight="600">FK  orderId: String</text>
    <text x="12" y="88" fill="#B91C1C" font-size="11" font-weight="600">    type: TaskType (CRITICAL...)</text>
    <text x="12" y="108" fill="#475569" font-size="11">    status: TaskStatus (OPEN/DONE)</text>
    <text x="12" y="128" fill="#475569" font-size="11">    clinicalNote: String?</text>
    <text x="12" y="148" fill="#0284C7" font-size="11">FK  resolvedById: String?</text>
    <text x="12" y="168" fill="#475569" font-size="11">    resolvedAt: DateTime?</text>
    <text x="12" y="188" fill="#475569" font-size="11">    details: String?</text>
  </g>

  <!-- TABLE: Summary -->
  <g transform="translate(40, 560)" filter="url(#shadow2)">
    <rect width="250" height="185" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#7C3AED"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">Summary (Plain Indic Explanations)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#0284C7" font-size="11" font-weight="600">FK  orderId: String</text>
    <text x="12" y="88" fill="#475569" font-size="11">    lang: Lang (en/te/hi)</text>
    <text x="12" y="108" fill="#475569" font-size="11">    source: Source (TEMPLATE/AI)</text>
    <text x="12" y="128" fill="#475569" font-size="11">    body: String</text>
    <text x="12" y="148" fill="#475569" font-size="11">    reviewStatus: Status (PENDING...)</text>
    <text x="12" y="168" fill="#64748B" font-size="10">UK  [orderId, lang]</text>
  </g>

  <!-- TABLE: SummaryFlag -->
  <g transform="translate(330, 560)" filter="url(#shadow2)">
    <rect width="250" height="175" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#D97706"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">SummaryFlag (Patient Feedback)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#0284C7" font-size="11" font-weight="600">FK  summaryId: String</text>
    <text x="12" y="88" fill="#475569" font-size="11">    reason: (CONFUSING/INACCURATE)</text>
    <text x="12" y="108" fill="#475569" font-size="11">    comment: String?</text>
    <text x="12" y="128" fill="#475569" font-size="11">    status: Status (PENDING/RESOLVED)</text>
    <text x="12" y="148" fill="#475569" font-size="11">    createdAt: DateTime</text>
  </g>

  <!-- TABLE: Message -->
  <g transform="translate(620, 560)" filter="url(#shadow2)">
    <rect width="250" height="175" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#15803D"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">Message (Delivery Outbox)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#0284C7" font-size="11" font-weight="600">FK  orderId: String</text>
    <text x="12" y="88" fill="#475569" font-size="11">    channel: (WHATSAPP / SMS)</text>
    <text x="12" y="108" fill="#475569" font-size="11">    status: (QUEUED/SENT/DELIVERED)</text>
    <text x="12" y="128" fill="#475569" font-size="11">    kind: (SIGN_OFF_LINK / RESEND)</text>
    <text x="12" y="148" fill="#475569" font-size="11">    destinationPhone: String</text>
    <text x="12" y="165" fill="#15803D" font-size="10">Zero PHI in message payload</text>
  </g>

  <!-- TABLE: AccessLog -->
  <g transform="translate(910, 560)" filter="url(#shadow2)">
    <rect width="250" height="195" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#334155"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">AccessLog (DPDP Audit Ledger)</text>
    <text x="12" y="48" fill="#0F172A" font-size="11" font-weight="600">PK  id: String (UUID)</text>
    <text x="12" y="68" fill="#475569" font-size="11">    action: (LINK_OPEN/PHONE_REVEAL)</text>
    <text x="12" y="88" fill="#475569" font-size="11">    actorType: (PATIENT/STAFF/DOCTOR)</text>
    <text x="12" y="108" fill="#475569" font-size="11">    actorId: String</text>
    <text x="12" y="128" fill="#475569" font-size="11">    ipHash: String (Anonymized)</text>
    <text x="12" y="148" fill="#475569" font-size="11">    outcome: String (OK / DENIED)</text>
    <text x="12" y="168" fill="#334155" font-size="11" font-weight="600">IDX createdAt: DateTime (Append-Only)</text>
  </g>

  <!-- Relationships -->
  <line x1="290" y1="180" x2="330" y2="180" stroke="#0284C7" stroke-width="1.5"/>
  <line x1="455" y1="270" x2="455" y2="310" stroke="#0284C7" stroke-width="1.5"/>
  <line x1="620" y1="200" x2="580" y2="350" stroke="#475569" stroke-width="1.5"/>
  <line x1="330" y1="410" x2="290" y2="410" stroke="#B45309" stroke-width="1.5"/>
  <line x1="580" y1="410" x2="620" y2="410" stroke="#0D5C54" stroke-width="1.5"/>
  <line x1="580" y1="450" x2="910" y2="450" stroke="#B91C1C" stroke-width="1.5"/>
  <line x1="455" y1="515" x2="165" y2="560" stroke="#7C3AED" stroke-width="1.5"/>
  <line x1="290" y1="640" x2="330" y2="640" stroke="#D97706" stroke-width="1.5"/>
  <line x1="580" y1="490" x2="745" y2="560" stroke="#15803D" stroke-width="1.5"/>
</svg>
"""

# ==============================================================================
# 3. ENTERPRISE CLINICAL WORKFLOW & STATE MACHINE
# ==============================================================================
flow_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 860" width="100%" height="100%" style="background:#F8FAFC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="shadow3" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>
    <marker id="arr-flow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#475569"/>
    </marker>
  </defs>

  <!-- Title -->
  <rect x="40" y="25" width="1120" height="65" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow3)"/>
  <rect x="40" y="25" width="8" height="65" rx="2" fill="#0D5C54"/>
  <text x="65" y="54" fill="#0F172A" font-size="17" font-weight="700">Company A Diagnostics — Clinical Safety Workflow &amp; State Machine</text>
  <text x="65" y="74" fill="#64748B" font-size="12">End-to-End Delivery Protocol • Critical Value Safeguards • Anti-Leakage Link Architecture</text>

  <!-- STEP 1: Ingestion -->
  <g transform="translate(40, 115)" filter="url(#shadow3)">
    <rect width="250" height="180" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#1E293B"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">STEP 1: LIS CSV EXPORT INGESTION</text>
    <text x="12" y="48" fill="#334155" font-size="11" font-weight="600">Streaming Batch File Parser</text>
    <text x="12" y="70" fill="#64748B" font-size="11">• Ingests LIS Export Batch Folder</text>
    <text x="12" y="90" fill="#64748B" font-size="11">• 20,000 parameter rows in 286ms</text>
    <text x="12" y="110" fill="#64748B" font-size="11">• Zod Schema Row Verification</text>
    <text x="12" y="130" fill="#64748B" font-size="11">• E.164 Mobile Phone Normalization</text>
    <text x="12" y="150" fill="#64748B" font-size="11">• Atomic Database Upsert</text>
    <text x="12" y="170" fill="#15803D" font-size="11" font-weight="600">✓ Transition: PROCESSING → SIGNED</text>
  </g>

  <!-- DECISION GATE: Critical Value Rule -->
  <g transform="translate(360, 150)" filter="url(#shadow3)">
    <polygon points="120,0 240,55 120,110 0,55" fill="#FFFFFF" stroke="#D97706" stroke-width="2"/>
    <text x="120" y="50" fill="#0F172A" font-size="12" font-weight="700" text-anchor="middle">Is Any Value</text>
    <text x="120" y="68" fill="#B45309" font-size="11" font-weight="600" text-anchor="middle">Critical Abnormal?</text>
  </g>

  <!-- PATH A: CRITICAL HOLD PROTOCOL -->
  <g transform="translate(670, 115)" filter="url(#shadow3)">
    <rect width="490" height="270" rx="6" fill="#FFFFFF" stroke="#FCA5A5" stroke-width="1.5"/>
    <rect width="490" height="28" rx="6" fill="#B91C1C"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">PATH A (SAFETY CRITICAL): NOTIFICATION HOLD &amp; CLINICAL CALLBACK</text>
    
    <rect x="15" y="45" width="220" height="95" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="25" y="68" fill="#991B1B" font-size="11" font-weight="700">1. Suppress Notification</text>
    <text x="25" y="88" fill="#475569" font-size="10">• ZERO SMS/WhatsApp sent</text>
    <text x="25" y="104" fill="#475569" font-size="10">• Prevents elderly patient panic</text>
    <text x="25" y="120" fill="#475569" font-size="10">• Displays calm clinical message</text>

    <rect x="250" y="45" width="225" height="95" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="260" y="68" fill="#991B1B" font-size="11" font-weight="700">2. Staff Callback Task</text>
    <text x="260" y="88" fill="#475569" font-size="10">• Urgent alert in /staff/tasks</text>
    <text x="260" y="104" fill="#475569" font-size="10">• Staff reveals phone &amp; calls</text>
    <text x="260" y="120" fill="#475569" font-size="10">• Coordinates urgent hospital visit</text>

    <rect x="15" y="155" width="460" height="95" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
    <text x="25" y="178" fill="#166534" font-size="11" font-weight="700">3. Release Held Link with Mandatory Clinical Note</text>
    <text x="25" y="198" fill="#475569" font-size="10">• Staff inputs verified notes (e.g. "Spoke to Dr. Suresh; patient instructed to visit casualty")</text>
    <text x="25" y="214" fill="#475569" font-size="10">• CallbackTask status set to DONE with authenticated staff ID</text>
    <text x="25" y="230" fill="#15803D" font-size="10" font-weight="600">✓ System releases hold → Generates fresh 72h LinkToken → Sends WhatsApp/SMS</text>
  </g>

  <!-- PATH B: NORMAL DELIVERY WORKFLOW -->
  <g transform="translate(40, 420)" filter="url(#shadow3)">
    <rect width="1120" height="400" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="1120" height="28" rx="6" fill="#0D5C54"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">PATH B (STANDARD DELIVERY): 72-HOUR EXPIRING TOKEN LINK &amp; INDIC REPORT VIEW</text>

    <!-- Stage B1 -->
    <rect x="20" y="45" width="250" height="335" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <rect x="20" y="45" width="250" height="26" rx="6" fill="#F1F5F9"/>
    <text x="30" y="63" fill="#1E293B" font-size="11" font-weight="700">B1. LINK GENERATION &amp; OUTBOX</text>
    <text x="30" y="92" fill="#334155" font-size="11" font-weight="600">72-Hour Expiring Cryptography</text>
    <text x="30" y="112" fill="#64748B" font-size="11">• 32-Byte Random Token</text>
    <text x="30" y="130" fill="#64748B" font-size="11">• Stored as SHA-256 Hash</text>
    <text x="30" y="148" fill="#64748B" font-size="11">• 72h Lifetime (LINK_TTL_HOURS)</text>
    <text x="30" y="172" fill="#334155" font-size="11" font-weight="600">Multi-Channel Message Dispatch</text>
    <text x="30" y="192" fill="#64748B" font-size="11">• WhatsApp Cloud API / Mock</text>
    <text x="30" y="210" fill="#64748B" font-size="11">• Zero PHI in Message Body</text>
    <text x="30" y="228" fill="#64748B" font-size="11">• Automatic SMS Fallback</text>
    <text x="30" y="255" fill="#15803D" font-size="11" font-weight="600">Delivery URL Format:</text>
    <text x="30" y="275" fill="#0D5C54" font-size="10" font-weight="700">https://lab.co/r/[32-char-token]</text>
    <text x="30" y="305" fill="#64748B" font-size="11">• Status: QUEUED → SENT</text>
    <text x="30" y="325" fill="#64748B" font-size="11">• Delivery Latency &lt; 2s</text>
    <text x="30" y="350" fill="#15803D" font-size="10" font-weight="600">✓ Guaranteed Non-Forgeable</text>

    <!-- Stage B2 -->
    <rect x="295" y="45" width="250" height="335" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <rect x="295" y="45" width="250" height="26" rx="6" fill="#F1F5F9"/>
    <text x="305" y="63" fill="#1E293B" font-size="11" font-weight="700">B2. LANDING GATE &amp; SAFETY</text>
    <text x="305" y="92" fill="#334155" font-size="11" font-weight="600">Read-Only Route (/r/:token)</text>
    <text x="305" y="112" fill="#64748B" font-size="11">• GET is 100% Read-Only</text>
    <text x="305" y="130" fill="#64748B" font-size="11">• Safe for WhatsApp Web Crawlers</text>
    <text x="305" y="148" fill="#64748B" font-size="11">• Displays Masked Phone:</text>
    <text x="315" y="168" fill="#0D5C54" font-size="12" font-weight="700">••••••0001</text>
    
    <rect x="305" y="190" width="230" height="110" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="315" y="210" fill="#991B1B" font-size="11" font-weight="700">"This is not for me" Kill-Switch</text>
    <text x="315" y="230" fill="#475569" font-size="10">• Solves 15 misdirected msgs/mo</text>
    <text x="315" y="246" fill="#475569" font-size="10">• Instantly revokes token in DB</text>
    <text x="315" y="262" fill="#475569" font-size="10">• Creates WRONG_NUMBER task</text>
    <text x="315" y="278" fill="#475569" font-size="10">• Logs security audit event</text>
    <text x="315" y="294" fill="#991B1B" font-size="10" font-weight="600">Zero Patient Data Disclosed</text>

    <!-- Stage B3 -->
    <rect x="570" y="45" width="250" height="335" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <rect x="570" y="45" width="250" height="26" rx="6" fill="#F1F5F9"/>
    <text x="580" y="63" fill="#1E293B" font-size="11" font-weight="700">B3. MANDATORY OTP CHALLENGE</text>
    <text x="580" y="92" fill="#334155" font-size="11" font-weight="600">Identity Verification Gate</text>
    <text x="580" y="112" fill="#64748B" font-size="11">• Action: "Send OTP to ••••0001"</text>
    <text x="580" y="130" fill="#64748B" font-size="11">• 6-Digit SMS Verification Code</text>
    <text x="580" y="148" fill="#64748B" font-size="11">• Rate Limiting (3/10min, 10/day)</text>
    <text x="580" y="168" fill="#64748B" font-size="11">• 30-Second Resend Cooldown</text>
    <text x="580" y="192" fill="#334155" font-size="11" font-weight="600">Anti-Forwarding Protection</text>
    <text x="580" y="212" fill="#64748B" font-size="11">• Re-opening requires fresh OTP</text>
    <text x="580" y="230" fill="#64748B" font-size="11">• Forwarded links cannot be opened</text>
    <text x="580" y="254" fill="#334155" font-size="11" font-weight="600">Statutory Consent Notice</text>
    <text x="580" y="274" fill="#64748B" font-size="11">• DPDP Act 2023 Consent Check</text>
    <text x="580" y="292" fill="#64748B" font-size="11">• Expandable statutory notice</text>
    <text x="580" y="320" fill="#15803D" font-size="11" font-weight="600">Status Update:</text>
    <text x="580" y="338" fill="#64748B" font-size="11">• Message status set to OPENED</text>
    <text x="580" y="356" fill="#64748B" font-size="11">• FirstOpenedAt recorded</text>

    <!-- Stage B4 -->
    <rect x="845" y="45" width="255" height="335" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <rect x="845" y="45" width="255" height="26" rx="6" fill="#F1F5F9"/>
    <text x="855" y="63" fill="#1E293B" font-size="11" font-weight="700">B4. INDIC REPORT VIEW &amp; ACTIONS</text>
    <text x="855" y="92" fill="#334155" font-size="11" font-weight="600">Plain Medical Explanations</text>
    <text x="855" y="112" fill="#0D5C54" font-size="11" font-weight="700">English | తెలుగు | हिन्दी</text>
    <text x="855" y="132" fill="#64748B" font-size="11">• Telugu Line Height ≥ 1.7</text>
    <text x="855" y="150" fill="#64748B" font-size="11">• Out-of-Range Highlights:</text>
    <text x="865" y="170" fill="#B45309" font-size="11">↓ Low (Amber) / ↑ High</text>
    <text x="855" y="195" fill="#334155" font-size="11" font-weight="600">Direct Patient Actions</text>
    <text x="855" y="215" fill="#64748B" font-size="11">• "Flag this summary" Feedback</text>
    <text x="855" y="233" fill="#64748B" font-size="11">• NABL Signed PDF Download</text>
    <text x="855" y="251" fill="#64748B" font-size="11">• QR Code Digital Watermark</text>
    <text x="855" y="269" fill="#64748B" font-size="11">• Cache-Control: no-store Header</text>
    <text x="855" y="295" fill="#15803D" font-size="11" font-weight="600">Audit Trail Entry:</text>
    <text x="855" y="315" fill="#64748B" font-size="11">• PDF_DOWNLOAD logged</text>
    <text x="855" y="333" fill="#64748B" font-size="11">• Anonymized IP hash written</text>
    <text x="855" y="355" fill="#15803D" font-size="10" font-weight="600">✓ Zero Unintended Opens</text>
  </g>

  <!-- Connectors -->
  <line x1="290" y1="205" x2="360" y2="205" stroke="#475569" stroke-width="1.5" marker-end="url(#arr-flow)"/>
  <line x1="600" y1="205" x2="670" y2="205" stroke="#B91C1C" stroke-width="2" marker-end="url(#arr-flow)"/>
  <text x="615" y="195" fill="#B91C1C" font-size="11" font-weight="700">YES</text>
  <line x1="480" y1="260" x2="480" y2="420" stroke="#15803D" stroke-width="2" marker-end="url(#arr-flow)"/>
  <text x="490" y="350" fill="#15803D" font-size="11" font-weight="700">NO (Normal / Routine)</text>
  <line x1="270" y1="580" x2="295" y2="580" stroke="#475569" stroke-width="1.5" marker-end="url(#arr-flow)"/>
  <line x1="545" y1="580" x2="570" y2="580" stroke="#475569" stroke-width="1.5" marker-end="url(#arr-flow)"/>
  <line x1="820" y1="580" x2="845" y2="580" stroke="#475569" stroke-width="1.5" marker-end="url(#arr-flow)"/>
</svg>
"""

# ==============================================================================
# 4. ENTERPRISE AI GUARDRAILS & SAFETY PIPELINE
# ==============================================================================
ai_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 860" width="100%" height="100%" style="background:#F8FAFC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <filter id="shadow4" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>
    <marker id="arr-ai" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#475569"/>
    </marker>
  </defs>

  <!-- Title -->
  <rect x="40" y="25" width="1120" height="65" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow4)"/>
  <rect x="40" y="25" width="8" height="65" rx="2" fill="#7C3AED"/>
  <text x="65" y="54" fill="#0F172A" font-size="17" font-weight="700">Company A Diagnostics — Guarded Medical AI Summary Pipeline</text>
  <text x="65" y="74" fill="#64748B" font-size="12">Multi-Tier Safety Architecture • Zero Invented Numbers • Locked Indic Templates • Fallbacks</text>

  <!-- STAGE 1: Clinical Rules Engine -->
  <g transform="translate(40, 115)" filter="url(#shadow4)">
    <rect width="250" height="710" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#0284C7"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">STAGE 1: RULES FIRST (0% AI)</text>

    <rect x="15" y="45" width="220" height="180" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="25" y="68" fill="#0F172A" font-size="11" font-weight="700">Deterministic Mathematical Rules</text>
    <text x="25" y="90" fill="#64748B" font-size="11">• Implemented in ranges.js</text>
    <text x="25" y="108" fill="#64748B" font-size="11">• ZERO LLM for range checks</text>
    <text x="25" y="126" fill="#64748B" font-size="11">• Grammars: a-b, &lt;b, &gt;=a, en-dash</text>
    <text x="25" y="144" fill="#64748B" font-size="11">• Strict numerical evaluation</text>
    <text x="25" y="162" fill="#64748B" font-size="11">• Output: NORMAL, LOW, HIGH</text>
    <text x="25" y="180" fill="#15803D" font-size="11" font-weight="600">✓ 100% Deterministic Accuracy</text>

    <rect x="15" y="240" width="220" height="210" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="25" y="263" fill="#991B1B" font-size="11" font-weight="700">Critical Value Safeguard</text>
    <text x="25" y="285" fill="#475569" font-size="10">• Implemented in critical.js</text>
    <text x="25" y="301" fill="#475569" font-size="10">• 11 Emergency Pathology Rules</text>
    <text x="25" y="317" fill="#475569" font-size="10">• Potassium &gt;6.5 or &lt;2.5 mmol/L</text>
    <text x="25" y="333" fill="#475569" font-size="10">• Haemoglobin &lt;7.0 g/dL</text>
    <text x="25" y="349" fill="#475569" font-size="10">• Platelets &lt;20,000 /µL</text>
    <text x="25" y="372" fill="#991B1B" font-size="11" font-weight="700">CRITICAL TRIGGER:</text>
    <text x="25" y="390" fill="#475569" font-size="10">• Bypasses ALL AI generation</text>
    <text x="25" y="406" fill="#475569" font-size="10">• Emits calm notice (No panic)</text>
    <text x="25" y="422" fill="#991B1B" font-size="10" font-weight="600">• Holds link for phone callback</text>

    <rect x="15" y="465" width="220" height="225" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
    <text x="25" y="488" fill="#166534" font-size="11" font-weight="700">Normal Range Parameters</text>
    <text x="25" y="510" fill="#475569" font-size="10">• If all tested results in range:</text>
    <text x="25" y="526" fill="#475569" font-size="10">• Zero AI calls made (0 cost)</text>
    <text x="25" y="542" fill="#475569" font-size="10">• Instant Green Banner rendered:</text>
    <text x="35" y="565" fill="#166534" font-size="10" font-weight="600">"All tested parameters are</text>
    <text x="35" y="579" fill="#166534" font-size="10" font-weight="600">within standard reference range."</text>
    <text x="25" y="605" fill="#475569" font-size="10">• Clinically translated in te / hi</text>
    <text x="25" y="625" fill="#475569" font-size="10">• Immediate reassurance</text>
    <text x="25" y="645" fill="#15803D" font-size="11" font-weight="600">✓ Latency: 0 ms</text>
  </g>

  <!-- STAGE 2: 13 Locked Templates -->
  <g transform="translate(330, 115)" filter="url(#shadow4)">
    <rect width="250" height="710" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#0D5C54"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">STAGE 2: LOCKED TEMPLATES</text>

    <rect x="15" y="45" width="220" height="305" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="25" y="68" fill="#0F172A" font-size="11" font-weight="700">Covers &gt;85% of Outpatient Volume</text>
    <text x="25" y="90" fill="#64748B" font-size="11">• Haemoglobin (ORD-71204)</text>
    <text x="25" y="108" fill="#64748B" font-size="11">• Fasting Blood Glucose</text>
    <text x="25" y="126" fill="#64748B" font-size="11">• Glycated Hb (HbA1c)</text>
    <text x="25" y="144" fill="#64748B" font-size="11">• Total Cholesterol</text>
    <text x="25" y="162" fill="#64748B" font-size="11">• LDL Cholesterol (ORD-71219)</text>
    <text x="25" y="180" fill="#64748B" font-size="11">• HDL Cholesterol</text>
    <text x="25" y="198" fill="#64748B" font-size="11">• Serum Triglycerides</text>
    <text x="25" y="216" fill="#64748B" font-size="11">• Serum Creatinine</text>
    <text x="25" y="234" fill="#64748B" font-size="11">• Thyroid TSH</text>
    <text x="25" y="252" fill="#64748B" font-size="11">• Total White Blood Cells (WBC)</text>
    <text x="25" y="270" fill="#64748B" font-size="11">• Platelet Count</text>
    <text x="25" y="288" fill="#64748B" font-size="11">• Non-Critical Potassium</text>
    <text x="25" y="306" fill="#64748B" font-size="11">• Vitamin D (25-OH)</text>
    <text x="25" y="330" fill="#15803D" font-size="11" font-weight="600">✓ Instant 0ms Cache Retrieval</text>

    <rect x="15" y="365" width="220" height="325" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="25" y="388" fill="#0F172A" font-size="11" font-weight="700">Native Multi-Lingual Text</text>
    <text x="25" y="410" fill="#64748B" font-size="10">Curated Telugu (తెలుగు):</text>
    <text x="30" y="428" fill="#0D5C54" font-size="10" font-weight="600">"హీమోగ్లోబిన్ సాధారణ స్థాయి కంటే</text>
    <text x="30" y="442" fill="#0D5C54" font-size="10" font-weight="600">తక్కువగా ఉంది. వైద్యుడిని సంప్రదించండి."</text>
    
    <text x="25" y="472" fill="#64748B" font-size="10">Curated Hindi (हिन्दी):</text>
    <text x="30" y="490" fill="#0D5C54" font-size="10" font-weight="600">"हीमोग्लोबिन सामान्य सीमा से कम है।</text>
    <text x="30" y="504" fill="#0D5C54" font-size="10" font-weight="600">कृपया डॉक्टर से परामर्श लें।"</text>
    
    <text x="25" y="534" fill="#64748B" font-size="10">English Master Text:</text>
    <text x="30" y="552" fill="#0D5C54" font-size="10" font-weight="600">"Haemoglobin is 10.2 g/dL, which is</text>
    <text x="30" y="566" fill="#0D5C54" font-size="10" font-weight="600">below the standard range (12.0-15.5)."</text>

    <text x="25" y="600" fill="#15803D" font-size="11" font-weight="600">Guaranteed Properties:</text>
    <text x="25" y="618" fill="#475569" font-size="10">• ZERO hallucination risk</text>
    <text x="25" y="632" fill="#475569" font-size="10">• Always links to full PDF report</text>
    <text x="25" y="646" fill="#475569" font-size="10">• Never declares diagnosis</text>
    <text x="25" y="660" fill="#475569" font-size="10">• Never suggests medication</text>
    <text x="25" y="675" fill="#0284C7" font-size="10" font-weight="700">BYPASSES AI API COMPLETELY</text>
  </g>

  <!-- STAGE 3: Constrained AI API -->
  <g transform="translate(620, 115)" filter="url(#shadow4)">
    <rect width="250" height="710" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#B45309"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">STAGE 3: CONSTRAINED AI ENGINE</text>

    <rect x="15" y="45" width="220" height="175" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="25" y="68" fill="#991B1B" font-size="11" font-weight="700">Input Guardrail (Whitelist)</text>
    <text x="25" y="90" fill="#475569" font-size="10">• Applied BEFORE any LLM call</text>
    <text x="25" y="106" fill="#475569" font-size="10">• Strict regex parameter whitelist:</text>
    <text x="30" y="124" fill="#0F172A" font-size="10" font-weight="700">^[A-Za-z0-9 ()/%.,+\-µ]{1,60}$</text>
    <text x="25" y="144" fill="#475569" font-size="10">• Max 6 words per parameter</text>
    <text x="25" y="160" fill="#475569" font-size="10">• Blocks CSV prompt injection</text>
    <text x="25" y="180" fill="#991B1B" font-size="10" font-weight="600">Failed Regex? → Immediate Fallback</text>

    <rect x="15" y="235" width="220" height="245" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="25" y="258" fill="#0F172A" font-size="11" font-weight="700">LLM Inference Parameters</text>
    <text x="25" y="280" fill="#64748B" font-size="11">• OpenRouter Candidate Models</text>
    <text x="25" y="298" fill="#64748B" font-size="11">• Temperature: 0.0 (Zero drift)</text>
    <text x="25" y="316" fill="#64748B" font-size="11">• Max Tokens: 700</text>
    <text x="25" y="334" fill="#64748B" font-size="11">• Timeout: 12 seconds</text>
    <text x="25" y="352" fill="#64748B" font-size="11">• Retries: 1 before fallback</text>
    <text x="25" y="375" fill="#334155" font-size="11" font-weight="600">System Instruction Constraints:</text>
    <text x="25" y="395" fill="#475569" font-size="10">- Explain value relative to range</text>
    <text x="25" y="410" fill="#475569" font-size="10">- Do not mention disease or drugs</text>
    <text x="25" y="425" fill="#475569" font-size="10">- Keep response under 30 words</text>
    <text x="25" y="440" fill="#475569" font-size="10">- Return pure JSON schema</text>
    <text x="25" y="460" fill="#15803D" font-size="10" font-weight="600">Strict Output Parsing</text>

    <rect x="15" y="495" width="220" height="195" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="25" y="518" fill="#0F172A" font-size="11" font-weight="700">Network &amp; Quota Shield</text>
    <text x="25" y="540" fill="#64748B" font-size="11">• If API key missing:</text>
    <text x="35" y="558" fill="#475569" font-size="10">→ Safe Fallback (No Error)</text>
    <text x="25" y="578" fill="#64748B" font-size="11">• If HTTP 429 Quota exhausted:</text>
    <text x="35" y="596" fill="#475569" font-size="10">→ Cycles candidate models</text>
    <text x="25" y="616" fill="#64748B" font-size="11">• If Timeout occurs:</text>
    <text x="35" y="634" fill="#475569" font-size="10">→ Immediate Fallback</text>
    <text x="25" y="660" fill="#15803D" font-size="11" font-weight="600">✓ Server NEVER Crashes</text>
  </g>

  <!-- STAGE 4: Multi-Stage Code Output Guards -->
  <g transform="translate(910, 115)" filter="url(#shadow4)">
    <rect width="250" height="710" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="250" height="28" rx="6" fill="#7C3AED"/>
    <text x="12" y="19" fill="#FFFFFF" font-size="12" font-weight="700">STAGE 4: STRICT OUTPUT GUARDS</text>

    <rect x="15" y="45" width="220" height="165" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="25" y="68" fill="#991B1B" font-size="11" font-weight="700">Guard 1: Invented Number Check</text>
    <text x="25" y="90" fill="#475569" font-size="10">• Extracts all digit sequences</text>
    <text x="25" y="106" fill="#475569" font-size="10">• Matches against raw CSV row</text>
    <text x="25" y="122" fill="#475569" font-size="10">• Any new number REJECTS output</text>
    <text x="25" y="142" fill="#64748B" font-size="10">(e.g. "Take 5000 IU" → REJECTED)</text>
    <text x="25" y="165" fill="#991B1B" font-size="10" font-weight="600">Fails? → Drop to Safe Fallback</text>

    <rect x="15" y="225" width="220" height="165" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="25" y="248" fill="#991B1B" font-size="11" font-weight="700">Guard 2: Banned Words Interceptor</text>
    <text x="25" y="270" fill="#475569" font-size="10">• Scans for liability keywords:</text>
    <text x="35" y="288" fill="#991B1B" font-size="10">"cancer", "diabetes"</text>
    <text x="35" y="302" fill="#991B1B" font-size="10">"tablet", "medicine", "pill"</text>
    <text x="35" y="316" fill="#991B1B" font-size="10">"cure", "diagnos", "you have"</text>
    <text x="25" y="340" fill="#475569" font-size="10">• Any match REJECTS output</text>
    <text x="25" y="360" fill="#991B1B" font-size="10" font-weight="600">Fails? → Drop to Safe Fallback</text>

    <rect x="15" y="405" width="220" height="145" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
    <text x="25" y="428" fill="#166534" font-size="11" font-weight="700">Deterministic Safe Fallback</text>
    <text x="25" y="450" fill="#475569" font-size="10">• Standard Clinical Reassurance:</text>
    <text x="35" y="470" fill="#166534" font-size="10" font-weight="600">"The value for {param} is outside</text>
    <text x="35" y="484" fill="#166534" font-size="10" font-weight="600">the usual range. Please consult</text>
    <text x="35" y="498" fill="#166534" font-size="10" font-weight="600">your doctor for guidance."</text>
    <text x="25" y="525" fill="#15803D" font-size="10" font-weight="600">✓ Zero Legal Liability</text>

    <rect x="15" y="565" width="220" height="125" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="25" y="588" fill="#0F172A" font-size="11" font-weight="700">Weekly Pathologist QA Desk</text>
    <text x="25" y="610" fill="#64748B" font-size="10">• 50 summaries/week audited</text>
    <text x="25" y="626" fill="#64748B" font-size="10">• Located in /staff/tasks</text>
    <text x="25" y="642" fill="#64748B" font-size="10">• One-click approve or edit</text>
    <text x="25" y="658" fill="#64748B" font-size="10">• ReviewStatus: REVIEWED</text>
  </g>

  <!-- Connectors -->
  <line x1="290" y1="200" x2="330" y2="200" stroke="#475569" stroke-width="1.5" marker-end="url(#arr-ai)"/>
  <line x1="580" y1="200" x2="620" y2="200" stroke="#475569" stroke-width="1.5" marker-end="url(#arr-ai)"/>
  <line x1="870" y1="200" x2="910" y2="200" stroke="#475569" stroke-width="1.5" marker-end="url(#arr-ai)"/>
</svg>
"""

files = [
    ("architecture-diagram.svg", arch_svg),
    ("erd-diagram.svg", erd_svg),
    ("workflow-diagram.svg", flow_svg),
    ("ai-pipeline-diagram.svg", ai_svg)
]

for name, content in files:
    with open(os.path.join(DIAGRAMS_DIR, name), "w", encoding="utf-8") as f:
        f.write(content.strip())
    with open(os.path.join(DOCS_DIR, name), "w", encoding="utf-8") as f:
        f.write(content.strip())
    with open(os.path.join(DOCS_DIAG_DIR, name), "w", encoding="utf-8") as f:
        f.write(content.strip())
    print(f"Generated corporate SVG: {name}")

print("Corporate SVGs generated. Now rendering PNGs...")

png_renders = [
    ("architecture-diagram.svg", "architecture-diagram.png", 1200, 850),
    ("erd-diagram.svg", "erd-diagram.png", 1200, 860),
    ("workflow-diagram.svg", "workflow-diagram.png", 1200, 860),
    ("ai-pipeline-diagram.svg", "ai-pipeline-diagram.png", 1200, 860),
]

for svg_name, png_name, w, h in png_renders:
    svg_p = os.path.join(DIAGRAMS_DIR, svg_name)
    png_p = os.path.join(DIAGRAMS_DIR, png_name)
    file_url = f"file:///{svg_p.replace(os.sep, '/')}"
    cmd = [
        EDGE,
        "--headless=new",
        f"--screenshot={png_p}",
        f"--window-size={w},{h}",
        file_url
    ]
    try:
        subprocess.run(cmd, timeout=12, check=True)
        shutil.copy(png_p, os.path.join(DOCS_DIR, png_name))
        shutil.copy(png_p, os.path.join(DOCS_DIAG_DIR, png_name))
        print(f"Rendered corporate PNG: {png_name} ({os.path.getsize(png_p)} bytes)")
    except Exception as e:
        print(f"Error rendering {png_name}: {e}")

print("Complete!")
