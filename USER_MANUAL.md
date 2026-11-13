# Company A Diagnostics — Comprehensive User & Operations Manual

**Client:** Company A Diagnostics, Vijayawada, Andhra Pradesh  
**Target Environment:** AWS EC2 Cloud Infrastructure (`http://3.26.15.115`) & Local Development (`http://localhost:5173`)  
**Compliance Standard:** Digital Personal Data Protection (DPDP) Act 2023  
**Document Ref:** CAD-OPS-MANUAL-2026-V1  
**Last Updated:** November 2026  

---

## 📖 Table of Contents

1. [Executive Overview & Quick Reference](#1-executive-overview--quick-reference)
2. [Role 1: Patients & Family Members (Mobile Portal)](#2-role-1-patients--family-members-mobile-portal)
   - 2.1 How to Access & Log In
   - 2.2 First-Time DPDP Consent Gate
   - 2.3 Shared Family Phone Profile Switcher ("Whose reports?")
   - 2.4 Patient Orders Dashboard
   - 2.5 Detailed Diagnostic Report View
   - 2.6 Reading Summaries in Telugu (తెలుగు) and Hindi (हिन्दी)
   - 2.7 Flagging a Confusing or Inaccurate Summary
   - 2.8 Downloading Signed NABL PDF Reports
   - 2.9 Opening Expiring Links via WhatsApp/SMS (`/r/[token]`)
   - 2.10 "This is not for me" (Wrong Number Protection)
   - 2.11 Managing Privacy & Consent Withdrawal (`/privacy`)
3. [Role 2: Front-Desk Operations Staff (Desktop Console)](#3-role-2-front-desk-operations-staff-desktop-console)
   - 3.1 How to Access & Sign In
   - 3.2 Patient & Order Lookup Console
   - 3.3 Interpreting Delivery Status Chips
   - 3.4 Unmasking Contact Numbers (Audited Reveal)
   - 3.5 Resending Report Links (Rate Limiting Rules)
   - 3.6 Managing SMS Fallback for Failed WhatsApp Messages
   - 3.7 Ingesting LIS Exports & Simulating Pathologist Sign-Off
4. [Role 3: Critical Care & Clinical Callback Desk](#4-role-3-critical-care--clinical-callback-desk)
   - 4.1 Understanding the Critical Value Hold Protocol
   - 4.2 Locating Open Critical Alerts in `/staff/tasks`
   - 4.3 Conducting the Telephone Callback
   - 4.4 Mandatory Clinical Documentation & Link Release
5. [Role 4: Pathologist & Quality Assurance (QA)](#5-role-4-pathologist--quality-assurance-qa)
   - 5.1 The 13 Locked Clinical Medical Templates
   - 5.2 Weekly 50-Summary Quality Audit Desk
   - 5.3 Reviewing Patient-Flagged Summaries
6. [Role 5: Referring Physicians / Doctors](#6-role-5-referring-physicians--doctors)
   - 6.1 Accessing the 90-Day Referring Doctor Portal
   - 6.2 Patient Roster & Abnormality Highlighting
   - 6.3 1-Click PDF Report Retrieval
7. [Role 6: Operations Head & DPDP Compliance Officer](#7-role-6-operations-head--dpdp-compliance-officer)
   - 7.1 Access Log Ledger & Search
   - 7.2 Exporting Tamper-Evident Audit Trails (CSV)
   - 7.3 Monitoring KPI Reductions (Status Calls & Paper Usage)
8. [Role 7: Multi-Hospital CMO Super Admin & Facility Superintendents](#8-role-7-multi-hospital-cmo-super-admin--facility-superintendents)
   - 8.1 Multi-Hospital Network Management (`/admin`)
   - 8.2 Hospital Facility Superintendent Console (`/:hospitalSlug/admin`)
9. [Core Feature: Hospital Locator, OPD Booking & Razorpay Gateway](#9-core-feature-hospital-locator-opd-booking--razorpay-gateway)
   - 9.1 Interactive Facility Locator & Department Navigation (`/book-appointment`)
   - 9.2 Booking an OPD Doctor Consultation or Diagnostic Test
   - 9.3 Seamless Razorpay Online Settlement & Express Token Generation
10. [Core Feature: "Labby" Clinical AI Copilot & Patient Educator](#10-core-feature-labby-clinical-ai-copilot--patient-educator)
    - 10.1 Accessing the AI Copilot
    - 10.2 Trilingual Healthcare Education (English, Telugu, Hindi)
    - 10.3 Strict Clinical & Safety Guardrails
11. [Edge Cases, Error Handling & FAQ](#11-edge-cases-error-handling--faq)

---

## 1. Executive Overview & Quick Reference

Company A Diagnostics operates 6 central diagnostic laboratories and 38 collection centres across coastal Andhra Pradesh. This web platform eliminates the ₹70.56 lakh annual loss incurred from manual WhatsApp messaging and status calls by delivering cryptographically secure, self-service test reports with multi-lingual explanations.

### Universal Portal Credentials & URLs:

| User Role | Portal URL (Live or Local) | Username / Credential | Password / OTP |
|---|---|---|---|
| **Patient & Family** | `http://3.26.15.115/` *(or `http://localhost:5173/`)* | Mobile: `9000000001` | OTP: `123456` |
| **Front-Desk Staff** | `http://3.26.15.115/staff/login` | Email: `frontdesk@demo.local` | `Demo@12345` |
| **Referring Doctor** | `http://3.26.15.115/staff/login` | Email: `doctor@demo.local` | `Demo@12345` |
| **Pathologist / QA** | `http://3.26.15.115/staff/login` | Email: `frontdesk@demo.local` | `Demo@12345` |
| **Operations Head** | `http://3.26.15.115/staff/login` | Email: `frontdesk@demo.local` | `Demo@12345` |

---

## 2. Role 1: Patients & Family Members (Mobile Portal)

### 2.1 How to Access & Log In
1. Open any mobile browser (Safari, Chrome, Firefox) and navigate to `http://3.26.15.115` (or `http://localhost:5173`).
2. **Language Selection:** At the top right, tap **తెలుగు** (Telugu), **हिन्दी** (Hindi), or **English**. The entire portal updates instantly.
3. **Enter Mobile Number:** Type your 10-digit Indian mobile number (e.g. `9000000001`).
4. **Get OTP:** Tap the large teal button **Get OTP**.
5. **Verify OTP:** A 6-box numeric code prompt appears. Enter `123456` (in demo mode, the code is auto-populated for reviewer convenience). Tap **Verify & Proceed**.

### 2.2 First-Time DPDP Consent Gate
1. If logging in for the first time on a new handset, the **Statutory Data Protection Notice** appears.
2. Tap **"Why we ask ↓"** to view why Company A Diagnostics processes diagnostic data, retention periods (72-hour link token lifetime), and your statutory rights under the Digital Personal Data Protection Act 2023.
3. Tap **I Agree & Continue**. Your cryptographic consent timestamp is recorded immutably in the database.

### 2.3 Shared Family Phone Profile Switcher ("Whose reports?")
In coastal Andhra Pradesh, multiple family members frequently share a single smartphone.
1. Once authenticated, the **"Whose reports?"** screen displays profile cards for all family members linked to that mobile number:
   - **Lakshmi Prasanna K** (Self, Female, 42y)
   - **Srinivas Rao T** (Spouse, Male, 46y)
   - **Bhavani K** (Daughter, Female, 14y)
   - **Raghavendra K** (Parent, Male, 71y)
   - **"All Family Reports"** (Consolidated view)
2. Tap any family member card to isolate their diagnostic history.

### 2.4 Patient Orders Dashboard
1. A clean, mobile-first card list displays all recent diagnostic orders.
2. Each order displays:
   - **Order ID** (e.g., `ORD-71204`)
   - **Test Date & Time**
   - **Referring Physician** (e.g., `Dr. S. Ramanaiah`)
   - **Status Badge:**
     - `Ready` (Emerald green): Pathologist has approved and signed; report is immediately viewable and downloadable.
     - `Processing` (Warm amber): Specimen is undergoing analyzer testing; estimated completion time is shown.
     - `In Review / Callback` (Calm blue): Requires clinical coordination before public display.
3. Tap **Open Report →** on any `Ready` order to view full medical details.

### 2.5 Detailed Diagnostic Report View
The report view prioritizes patient comprehension over raw technical jargon:
1. **"What This Means" Summary Card (Top of Screen):**
   - Highlights any parameter that is outside the normal physiological range.
   - Low values display an amber down arrow (`↓ Low`).
   - High values display an amber up arrow (`↑ High`).
   - Provides a clear, non-alarming explanation in plain conversational language.
2. **Complete Parameter Table:**
   - Displays all tested parameters, observed patient values, standard units (e.g. `g/dL`, `mg/dL`), and biological reference intervals.
   - In-range parameters are subtly formatted in calm neutral tones to prevent visual overload.

### 2.6 Reading Summaries in Telugu (తెలుగు) and Hindi (हिन्दी)
1. At the top of any report, tap the **తెలుగు** button.
2. The summary immediately renders in high-clarity Telugu script:
   - *Example:* *"హీమోగ్లోబిన్ సాధారణ స్థాయి (12.0 - 15.5 g/dL) కంటే తక్కువగా 10.2 g/dL ఉంది. దయచేసి పూర్తి నివేదికను పరిశీలించి మీ వైద్యుడిని సంప్రదించండి."*
3. **Elderly Readability:** Typography incorporates an expanded line-height of $\ge 1.7$ and larger fonts ($\ge 18\text{px}$) to prevent Telugu conjunct glyphs from clipping on low-cost Android displays.

### 2.7 Flagging a Confusing or Inaccurate Summary
If an explanation is unclear or confusing:
1. Tap the **Flag this summary** button beneath the explanation card.
2. Select a reason:
   - `Confusing wording`
   - `Inaccurate reference range`
   - `Language translation error`
   - `Other`
3. Optional: Type a brief comment (e.g. *"Telugu wording for platelets is difficult to understand"*).
4. Tap **Submit Flag**.
5. The summary is immediately routed to the Pathologist QA desk for review, and the patient receives an on-screen acknowledgement.

### 2.8 Downloading Signed NABL PDF Reports
1. On the report detail screen, tap the prominent button: **Download Full Report (PDF)**.
2. The server dynamically compiles an official NABL-compliant PDF with:
   - Official Company A Diagnostics branding and laboratory accreditation number.
   - Comprehensive results matrix with abnormal values highlighted in bold.
   - Digital QR verification watermark and signing pathologist credentials.
   - Secure HTTP response headers (`Cache-Control: no-store`) preventing browser caching on shared internet cafe devices.

### 2.9 Opening Expiring Links via WhatsApp/SMS (`/r/[token]`)
When a test report is signed, the patient receives an automated WhatsApp or SMS message containing an encrypted 72-hour link:
1. Tap the link in your WhatsApp or SMS message (e.g. `http://3.26.15.115/r/abc123token...`).
2. **Landing Gate Display:**
   - The landing page confirms the laboratory name and displays a masked phone number: `••••••0001`.
   - **Zero Medical Data Leaked:** No patient name or test name is shown at this stage. Even if forwarded or intercepted by a crawler bot, no health information is exposed.
3. Tap **Send OTP to ••••••0001**.
4. Enter the 6-digit OTP delivered to your phone.
5. Upon successful OTP entry, you are redirected directly into your report.

### 2.10 "This is not for me" (Wrong Number Protection)
If Company A Diagnostics front-desk staff accidentally entered an incorrect mobile number:
1. When the unintended recipient taps the WhatsApp link, they see the Landing Gate with `••••••9999`.
2. Notice the prominent red button: **"This is not for me"**.
3. Tap **"This is not for me"**.
4. **Immediate Actions Executed:**
   - The link token is permanently revoked in the database.
   - An immutable security incident entry is recorded in `AccessLog`.
   - An urgent `WRONG_NUMBER` alert is dispatched to the front-desk console.
   - A confirmation message confirms: *"Thank you. Access to this report has been permanently disabled on this link."*

### 2.11 Managing Privacy & Consent Withdrawal (`/privacy`)
1. Tap **Privacy & DPDP Rights** in the footer navigation.
2. Patients can review their logged consent timestamp and statutory rights.
3. Tap **Withdraw Consent & Request Deletion**.
4. A confirmation prompt explains that historic medical records will be archived per statutory clinical retention guidelines (5 years per Clinical Establishments Act) while all active digital marketing and WhatsApp dispatches are terminated immediately.

---

## 3. Role 2: Front-Desk Operations Staff (Desktop Console)

### 3.1 How to Access & Sign In
1. On any desktop workstation in the laboratory or collection centre, navigate to:  
   **`http://3.26.15.115/staff/login`** (or `http://localhost:5173/staff/login`).
2. Enter staff credentials:
   - **Email:** `frontdesk@demo.local`
   - **Password:** `Demo@12345`
3. Tap **Sign In to Console**.

### 3.2 Patient & Order Lookup Console
The main console (`/staff` / `/staff/orders`) replaces manual phone lookups:
1. **Search Bar:** Type any identifier into the omni-search input:
   - Patient Full Name (e.g. `Lakshmi`, `Farzana`)
   - Order Number (e.g. `ORD-71204`, `71233`)
   - Last 4 digits of phone number (e.g. `0001`, `0003`)
2. The results table updates in real time with zero page reloads.
3. **Columns Displayed:**
   - `Order ID`
   - `Patient Name & Relation`
   - `Masked Contact` (`••••••0001`)
   - `Order Status` (`READY`, `PROCESSING`, `HELD`)
   - `Link Delivery Status` (`QUEUED`, `DELIVERED`, `OPENED`, `FAILED`)
   - `Action Controls`

### 3.3 Interpreting Delivery Status Chips
- `SENT` (Blue chip): Outbox message has been transmitted to WhatsApp Cloud API.
- `DELIVERED` (Indigo chip): Two grey ticks received from WhatsApp network.
- `OPENED` (Green chip): Patient has passed the OTP challenge and unlocked the report.
- `FAILED` (Red chip): Recipient number is not registered on WhatsApp or network rejected dispatch.
- `HELD` (Yellow chip): Report contains critical life-threatening values; link dispatch paused until clinical callback is logged.

### 3.4 Unmasking Contact Numbers (Audited Reveal)
To prevent staff snooping while complying with DPDP data minimization rules:
1. Patient telephone numbers are displayed masked by default (`••••••0001`).
2. To place a clinical call, click the **Reveal** link next to the number.
3. The number unmasks to standard international format (e.g. `+91 90000 00001`).
4. **Audit Trail:** Clicking reveal writes an immutable `PHONE_REVEAL` event containing the staff member's ID, patient ID, and timestamp into `AccessLog`.

### 3.5 Resending Report Links (Rate Limiting Rules)
If a patient calls stating they accidentally deleted their WhatsApp message:
1. Locate the patient's order in the console.
2. Click the **Resend Link** button.
3. A confirmation modal confirms the patient's phone number. Click **Confirm Resend**.
4. **Automated Enforcement:**
   - Previous token hashes for this order are immediately marked `revokedAt = now()`.
   - A fresh cryptographic 72-hour link token is minted.
   - An outbox dispatch is queued.
   - **Rate Limiting Guard:** The server strictly permits a maximum of **3 resends per order per 24 hours**. If exceeded, the button disables and displays: *"Daily resend limit reached (3/3). Please direct patient to mobile OTP login."*

### 3.6 Managing SMS Fallback for Failed WhatsApp Messages
1. If an outbox status shows **`FAILED`** (e.g. `ORD-71208` - Sumalatha G):
2. Click the blue button: **Send SMS Fallback**.
3. The system converts the delivery channel to Indian National SMS gateway (mocked or live DLT template), transmitting the identical expiring link over carrier SMS.

### 3.7 Ingesting LIS Exports & Simulating Pathologist Sign-Off
1. Click **LIS Import** in the top navigation bar.
2. **Method A (Drag-and-Drop CSV):** Drag an export CSV file from the laboratory information system onto the upload zone. Click **Process Import File**.
3. **Method B (One-Click Simulation):** Click **Simulate Sign-Off Update 🚀**.
4. The system executes streaming batch validation across the records:
   - Validates columns against Zod schema.
   - Updates previously `PROCESSING` orders (`ORD-71219` and `ORD-71220`) to `SIGNED`.
   - Automatically generates NABL PDFs.
   - Mints link tokens and queues outbox notifications.
5. An **Import Run Summary** modal reports: `Orders Processed: 24`, `Newly Signed: 2`, `Critical Alerts Held: 0`, `Ingestion Time: 286 ms`.

---

## 4. Role 3: Critical Care & Clinical Callback Desk

### 4.1 Understanding the Critical Value Hold Protocol
When an analyzer detects a life-threatening critical abnormality (e.g. Serum Potassium $>6.5\text{ mmol/L}$ or Haemoglobin $<7.0\text{ g/dL}$):
1. **Zero Patient Notification:** The patient **must not** receive a cold automated message on WhatsApp that could cause severe panic or delay immediate hospital admission.
2. **Automated Hold:** The order status is flagged `hasCritical: true`, link generation is **held**, and a priority `CRITICAL_CALLBACK` task is created.

### 4.2 Locating Open Critical Alerts in `/staff/tasks`
1. Navigate to **Tasks & Flags** in the top navigation (`/staff/tasks`).
2. Click the **Critical Callbacks** tab.
3. Observe all held orders requiring clinical action.  
   *Example:* `ORD-71233` — **Farzana Begum** — Parameter: `Potassium 6.8 mmol/L` (Reference Range: `3.5 - 5.1 mmol/L`). Status: **`OPEN (CALLBACK REQUIRED)`**.

### 4.3 Conducting the Telephone Callback
1. Next to the patient name, click **Reveal Phone Number**.
2. Dial the unmasked phone number (`+91 90000 00003`) or contact referring doctor `Dr. K. Suresh`.
3. Inform the patient or physician of the emergency potassium reading and advise immediate emergency department consultation.

### 4.4 Mandatory Clinical Documentation & Link Release
1. On the critical task card, click **Mark Callback Done →**.
2. A required clinical documentation dialog appears:
   - Input field: **Clinical Conversation Notes** *(Mandatory — cannot be blank)*.
   - Enter detailed clinical notes:  
     *Example:* `"Spoke with patient's daughter at 11:45 AM. Confirmed patient is experiencing mild palpitations. Instructed immediate presentation to Vijayawada Government General Hospital ER. Informed Dr. K. Suresh via SMS."*
3. Click **Submit & Release Link**.
4. **Automated Resolution:**
   - The `CallbackTask` is marked `DONE` with the resolving staff member's ID and timestamp.
   - The held report link is unlocked and dispatched via WhatsApp to the patient.
   - The critical banner on the console clears to verified green.

---

## 5. Role 4: Pathologist & Quality Assurance (QA)

### 5.1 The 13 Locked Clinical Medical Templates
To achieve 100% legal and clinical defensibility, Company A Diagnostics enforces locked medical templates for $>85\%$ of outpatient routine volume. These bypass LLM generation completely:
1. **Haemoglobin:** Clarifies low values in terms of mild anemia and balanced iron nutrition; advises doctor consultation.
2. **Fasting Glucose & HbA1c:** Explains blood sugar status relative to coastal AP standard thresholds.
3. **Lipid Panel (Total Cholesterol, LDL, HDL, Triglycerides):** Clarifies arterial plaque risk factors without prescribing statins.
4. **Kidney Function (Serum Creatinine):** Highlights renal filtration baseline.
5. **Thyroid (TSH):** Explains metabolic regulation boundaries.
6. **Routine Hematology (WBC, Platelets):** Contextualizes immune and clotting ranges.
7. **Micronutrients (Vitamin D, B12):** Bone health and metabolic indicators.

### 5.2 Weekly 50-Summary Quality Audit Desk
Per chief pathologist protocol, 50 AI-generated summaries must be audited weekly:
1. Navigate to `/staff/tasks` $\rightarrow$ **Pathologist AI Audit**.
2. The queue displays non-template summaries generated by the AI fallback engine.
3. Review the patient parameter, input value, standard reference range, and AI explanation text.
4. Click **Approve Summary** or **Edit & Correct Text**.
5. Once approved, `reviewStatus` updates from `UNREVIEWED` to `REVIEWED`.

### 5.3 Reviewing Patient-Flagged Summaries
1. In `/staff/tasks`, click the **Flagged Summaries** tab.
2. View patient-submitted flags (e.g. `ORD-71207` - Ramesh Kumar B: *"Language confusing"*).
3. The pathologist can read the exact feedback note, modify the explanation text, and click **Resolve Flag**.
4. An SMS update is dispatched notifying the patient that an updated clinical explanation is available.

---

## 6. Role 5: Referring Physicians / Doctors

### 6.1 Accessing the 90-Day Referring Doctor Portal
1. Prescribing physicians navigate to:  
   **`http://3.26.15.115/staff/login`** (or `http://localhost:5173/staff/login`).
2. Sign in with physician credentials:
   - **Email:** `doctor@demo.local`
   - **Password:** `Demo@12345`
3. The portal immediately redirects to `/doctor`.

### 6.2 Patient Roster & Abnormality Highlighting
1. The dashboard automatically filters the database to show **only patients referred by that authenticated doctor in the preceding 90 days** (`signedAt >= now() - 90 days`).
2. **Doctor Information Banner:** Confirms physician identity (e.g., `Dr. S. Ramanaiah, MD, General Medicine`).
3. **Search & Filters:**
   - Search by Patient Name or Order ID.
   - Toggle **"Show Out-of-Range Only"** to instantly isolate patients with abnormal results requiring follow-up.
4. **Abnormality Badges:** Out-of-range parameters are visually highlighted (e.g. `Haemoglobin 10.2 ↓ Low`, `Potassium 6.8 ↑ High`).

### 6.3 1-Click PDF Report Retrieval
1. In the physician roster, click **Download PDF** on any patient row.
2. The complete NABL-signed test report opens instantly without requiring patient OTP challenges (as the prescribing physician of record possesses statutory clinical authority).

---

## 7. Role 6: Operations Head & DPDP Compliance Officer

### 7.1 Access Log Ledger & Search
1. Sign in as operations staff and click **Access Log** in top navigation (`/staff/access-log`).
2. An append-only audit ledger displays every single system interaction:
   - `Timestamp` (UTC & IST)
   - `Action Type` (`LOGIN_OTP`, `LINK_OPEN`, `PHONE_REVEAL`, `PDF_DOWNLOAD`, `CALLBACK_DONE`, `TOKEN_REVOKED`, `CONSENT_WITHDRAWN`)
   - `Actor Role & Identifier` (`PATIENT:9000000001`, `STAFF:frontdesk@demo.local`)
   - `Order ID Reference`
   - `Anonymized IP Hash`
   - `Outcome` (`OK` or `DENIED / RATE_LIMITED`)

### 7.2 Exporting Tamper-Evident Audit Trails (CSV)
1. In the top right corner of the Access Log ledger, click **Export Audit CSV**.
2. A cryptographically clean CSV file (`access-log-audit-YYYY-MM-DD.csv`) downloads directly to the compliance officer's computer for archiving or statutory submission.

### 7.3 Monitoring KPI Reductions (Status Calls & Paper Usage)
Navigate to the **Analytics Dashboard** (`/staff/analytics`):
- **Status Inquiry Reduction:** Measures volume of inbound status calls avoided through self-service order tracking (Target: $\ge 60\%$ reduction).
- **Digital Adoption Rate:** Tracks percentage of total completed orders opened digitally via OTP links (Target: $\ge 80\%$).
- **Paper Printing Savings:** Measures physical sheets prevented from being printed and delivered by road courier (Target: $\ge 50\%$ reduction).
- **Security Metric:** Zero reports opened by unintended recipients.

---

## 8. Role 7: Multi-Hospital CMO Super Admin & Facility Superintendents

### 8.1 Multi-Hospital Network Management (`/admin`)
1. Access the **Super Admin Console** from the top navigation bar or navigate to `/admin`.
2. Provides unified oversight across all 6 healthcare campuses of Company A Diagnostics & Hospitals in the Vijayawada / Krishna district:
   - **Main Hospital & Trauma Center (Governorpet)**: 450 Beds, 24/7 Tertiary Emergency.
   - **Super Specialty Wing (Bunder Road)**: Cardiology, Oncology & Nephrology.
   - **Children & Maternity Hospital (Suryaraopet)**: Pediatrics, NICU & Obstetrics.
   - **Diagnostic Center & Day Care Clinic (One Town)**: Express Specimen Processing & Pathology.
   - **Multi-Specialty Facility (Auto Nagar)**: Orthopedics, Industrial Health & Occupational Medicine.
   - **Health Center (Benz Circle)**: Preventive Healthcare & Outpatient Consultations.
3. Key capabilities:
   - Live multi-center bed occupancy and intensive care capacity tracking.
   - Cross-facility laboratory throughput and turnaround time (TAT) monitoring.
   - Aggregated network revenue, Razorpay settlement ledgers, and cash collections.
   - Global DPDP Act compliance audit ledger inspection.

### 8.2 Hospital Facility Superintendent Console (`/:hospitalSlug/admin`)
1. Access directly via the hospital selector in the top bar or via `/hospital/:hospitalSlug/admin`.
2. Capabilities for local medical directors and hospital superintendents:
   - Departmental OPD doctor roster and shift management.
   - Real-time waiting queue inspection and token status tracking.
   - Local specimen accessioning metrics and pathologist backlog identification.

---

## 9. Core Feature: Hospital Locator, OPD Booking & Razorpay Gateway

### 9.1 Interactive Facility Locator & Department Navigation (`/book-appointment`)
1. Navigate to **Book OPD & Lab Test** from the top Services menu or directly via `/book-appointment`.
2. Filter through the 6 regional healthcare centers by proximity, specialty, emergency availability, and diagnostic equipment.
3. View detailed facility profiles, contact coordinates, operating hours, and mapped Google Maps directions.

### 9.2 Booking an OPD Doctor Consultation or Diagnostic Test
1. Select the desired facility and choose between **OPD Doctor Consultation** or **Diagnostic Lab Test**.
2. Select the clinical department (Cardiology, Neurology, Pediatrics, General Medicine, Orthopedics, Pathology).
3. Pick your preferred physician, available consultation date, and morning/evening time slot.
4. Review the fixed clinical consultation fee (₹500 - ₹1,250 depending on super-specialty).

### 9.3 Seamless Razorpay Online Settlement & Express Token Generation
1. Select **Pay via Razorpay Payment Gateway** or **Pay at Hospital Reception Desk**.
2. When Razorpay is selected, the patient can settle via:
   - **Unified Payments Interface (UPI)**: Google Pay, PhonePe, Paytm, or custom VPA.
   - **Debit / Credit Cards**: Visa, MasterCard, RuPay with secure 3D-Secure 2.0.
   - **Net Banking**: HDFC, ICICI, SBI, Axis, Kotak, and 50+ Indian commercial banks.
3. Once authorized, the payment settles directly into the designated hospital facility's verified bank clearing account.
4. **Digital Token Generation**:
   - An immediate high-resolution digital booking token is issued (e.g. `#TK-HOSP01-8421`).
   - Includes embedded QR code and barcode for express scanning at physical hospital reception kiosks.
   - Permanent UHID linkage allows seamless retrieval across all future diagnostic reports.

---

## 10. Core Feature: "Labby" Clinical AI Copilot & Patient Educator

### 10.1 Accessing the AI Copilot
1. The floating **Labby AI Copilot** button is permanently anchored at the bottom-right corner of the interface across all screens.
2. Click the sparkling stethoscope badge to open the conversational copilot drawer.

### 10.2 Trilingual Healthcare Education (English, Telugu, Hindi)
- Supports natural conversational queries in **English**, **Telugu (తెలుగు)**, and **Hindi (हिन्दी)**.
- Example patient questions:
  - *"నా రక్తంలో గ్లూకోజ్ ఎక్కువ ఉంది, దీని అర్థం ఏమిటి?"* (Telugu: *"My blood glucose is high, what does this mean?"*)
  - *"What are normal platelet levels for dengue patients?"*
  - *"उपवास रक्त शर्करा परीक्षण की तैयारी कैसे करें?"* (Hindi: *"How to prepare for a fasting blood sugar test?"*)

### 10.3 Strict Clinical & Safety Guardrails
- **No Prescriptions**: Never recommends dosages, antibiotics, or pharmaceutical interventions.
- **Reference Range Clarification**: Clearly explains what standard clinical markers measure in lay language.
- **Attending Physician Referral**: Prominently directs patients with critical or abnormal values to schedule an appointment with their treating doctor or visit the 24/7 casualty wing.

---

## 11. Edge Cases, Error Handling & FAQ

### Q1: What happens if a patient enters the wrong OTP 5 times?
**A:** The OTP gate locks that specific verification challenge for 10 minutes to prevent brute-force attacks. After 3 consecutive locked challenges, the mobile number is throttled for 1 hour, and an incident is logged in `AccessLog`.

### Q2: What if a patient forwards their WhatsApp link to a family member or friend?
**A:** The forwarded recipient cannot view the report. Clicking the link prompts: *"Enter the 6-digit OTP sent to ••••••0001"*. Since the OTP is dispatched solely to the registered handset, forwarding the link is completely secure.

### Q3: What happens after 72 hours have elapsed?
**A:** The link expires (`expiresAt < now()`). If tapped, the landing page displays: *"This link expired after 72 hours for your security. Please enter your mobile number to receive a fresh secure link or log in directly."*

### Q4: What if an external AI API (OpenRouter/Claude) suffers downtime or HTTP 429 quota exhaustion?
**A:** The system incorporates a multi-tier fallback. First, it cycles through candidate models (e.g. `nvidia/nemotron-3.5-super-vl` $\rightarrow$ `lightning`). If all external AI endpoints are unreachable, the code **never crashes**; it seamlessly renders the deterministic clinical fallback:  
*"The value for {parameter} is outside the standard reference range. Please consult your physician for clinical interpretation."*

### Q5: How are misdirected phone numbers corrected in the LIS?
**A:** When a user taps *"This is not for me"*, a `WRONG_NUMBER` task is created in `/staff/tasks`. Front-desk staff contacts the patient at their physical collection centre encounter address, corrects the phone number in the desktop LIS, and re-imports the record.

---

*End of User & Operations Manual*
