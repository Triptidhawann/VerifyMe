<div align="center">
  <h1>VerifyMe</h1>
  <p><strong>Digital Trust & Verification Intelligence Platform</strong></p>
  
  [![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat-square&logo=express)](https://expressjs.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-Admin_%26_Auth-FFCA28.svg?style=flat-square&logo=firebase)](https://firebase.google.com/)
  [![Groq AI](https://img.shields.io/badge/AI-Groq_Llama_3-F59E0B.svg?style=flat-square)](https://groq.com/)
  [![Tests](https://img.shields.io/badge/Tests-139%20Passing-10B981.svg?style=flat-square)](https://nodejs.org/api/test.html)
  [![Netlify](https://img.shields.io/badge/Netlify-Serverless_Ready-00C7B7.svg?style=flat-square&logo=netlify)](https://netlify.com/)
</div>

<br />

**VerifyMe** is an enterprise-grade digital trust and verification intelligence platform designed to investigate and verify digital entities (Phone Numbers, Email Addresses, and Website URLs) before trusting, responding, sharing, or clicking.

VerifyMe couples **standards-compliant deterministic protocol inspection** (DNS, TLS, RFC 7208 SPF, RFC 7489 DMARC, E.164 numbering plans, SSRF network filters) with an **AI explanation layer** (powered by Groq Llama 3) backed by an instantaneous fail-safe deterministic fallback engine.

---

## 🚀 Key Architectural Pillars

### 1. Three-Dimensional Assessment Architecture (Batch 3)
VerifyMe separates technical validity from reputation and identity, eliminating artificial score caps:
* **Dimension A: Technical Health Score (0–100):** Evaluates protocol syntax, network reachability, TLS CA validity, MX configuration, and numbering plan allocation. Known legitimate services (e.g. `google.com`, `+919876543210`) score 95–100/100 without artificial dampening.
* **Dimension B: Trust & Threat Intelligence Assessment:** Distinguishes between technical transport safety and organization/caller authenticity. Surfaces explicit dimensions: `reputationStatus` (`NOT CHECKED`, `CHECKED`, `UNAVAILABLE`), `threatAssessmentStatus` (`NOT CHECKED`, `NO KNOWN THREATS DETECTED`, `THREAT INDICATORS DETECTED`), and `identityStatus` (`NOT VERIFIED`).
* **Dimension C: Evidence Completeness (0–100%):** Measures what proportion of total theoretical checks were evaluated (e.g., 75% for websites without live threat feeds; 65% for phone numbers without carrier subscriber lookup). Completeness never caps the technical health score.

### 2. Precise Risk Classification
* **Invalid Input vs. Malicious Threat:** Incomplete inputs (e.g. `123`, `not-an-email`) are classified strictly as `INVALID INPUT` (`formatValid: false`) with 0 threat indicators, rather than falsely flagged as high-risk security attacks.
* **Precise Technical Verdicts:**
  - `TECHNICAL CHECKS PASSED` (Clean infrastructure)
  - `INVALID INPUT` (Syntactically incomplete)
  - `TRANSPORT SECURITY WEAKNESS` (Plaintext HTTP without upgrade)
  - `CERTIFICATE VALIDATION FAILURE` (Expired/untrusted TLS)
  - `REACHABILITY FAILURE` (Host unresponsive / connection timed out)
  - `DNS RESOLUTION FAILURE` (NXDOMAIN or missing MX records)
  - `AUTHENTICATION POLICY WEAKNESS` (DMARC `p=none` or permissive SPF)
  - `SUSPICIOUS INDICATOR` (Punycode homoglyph, disposable domain, premium-rate phone)
  - `CONFIRMED THREAT` (Positive threat feed detection)

### 3. Backend-Authoritative Persistence & Security (Batch 2A)
* **Authoritative Database Writes:** Verification records are persisted server-side via Firebase Admin SDK directly to `users/{uid}/verifications/{id}`. Client-supplied scores, risk levels, and timestamps are strictly ignored.
* **Hardened Firestore Security Rules:** Browser clients have read-only access to their own verification logs (`allow write: if false;`).
* **Role-Based Access Control (RBAC):** Administrative endpoints require verified Firebase Auth Custom Claims (`role: 'ADMIN'`). Client-supplied role claims cannot escalate privilege.

### 4. Production Reliability & Anti-Abuse (Batch 2B)
* **Distributed Rate Limiting:** Enforces rate limits using atomic Firestore transactions to prevent race conditions during concurrent request bursts.
* **Graceful Failure Modes:** If distributed storage is unavailable in production, requests return a controlled HTTP 503 instead of silently disabling protection. In local dev, a fast in-memory store is used.
* **Comprehensive SSRF Protection:** Pre-flight DNS resolution, private/internal IP filtering (IPv4/IPv6 loopback, RFC 1918, RFC 5737, cloud metadata `169.254.169.254`), and socket pinning prevent TOCTOU DNS rebinding.
* **API Hardening:** Strict origin-matching CORS, Helmet security headers, 16KB JSON payload limits, and centralized error sanitization.

---

## 🛠️ Modality Verification Capabilities

| Modality | Technical Checks Performed | Unverified Limitations Explicitly Disclosed |
| :--- | :--- | :--- |
| **Website** | • RFC URL syntax & Punycode homograph check<br>• Authoritative DNS lookup & SSRF filtering<br>• Standard web ports enforcement (80/443)<br>• HTTP reachability & automatic HTTPS upgrade<br>• TLS certificate CA validation & expiration check | Domain reputation, registration age, and organizational authenticity are unverified unless external threat intelligence is configured. |
| **Email** | • RFC syntax validation<br>• Authoritative DNS resolution (NXDOMAIN detection)<br>• MX server discovery & priority parsing<br>• RFC 7208 SPF evaluation (recursion tracking, diamond dependencies, lookup limit inspection)<br>• RFC 7489 DMARC policy check (`p=none`, `quarantine`, `reject`)<br>• Disposable email domain detection | Mailbox existence (SMTP recipient check) and individual sender identity/DKIM signatures are unverified. |
| **Phone** | • E.164 national and international invariant parsing<br>• ITU country calling code validation<br>• Authoritative national numbering plan conformity<br>• Line type allocation (Mobile, Fixed Line, VoIP, Toll-Free, Premium Rate)<br>• Ambiguous regional format detection | Live telecom subscriber identity, active network registration, and live spam score are unverified. |

---

## 💻 Tech Stack

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Modular CSS, dark-mode cybersecurity theme
- **Icons:** Lucide React
- **Authentication:** Firebase Client SDK (Auth)

### Backend
- **Runtime:** Node.js 18+, Express.js
- **Serverless Adapter:** `serverless-http` (Netlify Functions)
- **Security:** Helmet, CORS, custom SSRF validator, Firestore transaction rate limiter
- **Telecom Parsing:** `libphonenumber-js`
- **DNS Engine:** Node.js native DNS with promise timeouts
- **AI Engine:** Groq SDK (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) with deterministic fail-safe engine

---

## 📁 Repository Structure

```
VerifyMe/
├── client/                     # React Single-Page Application (Vite)
│   ├── firestore.rules         # Hardened Firestore security rules
│   ├── src/
│   │   ├── components/         # Dashboard, Results, History panels
│   │   ├── context/            # AuthContext (Firebase Auth state)
│   │   ├── pages/              # Dashboard, History, Login, Admin views
│   │   └── services/           # Backend API client
├── server/                     # Express REST API & Netlify Function
│   ├── src/
│   │   ├── config/             # Firebase Admin configuration
│   │   ├── controllers/        # Verification & User controllers
│   │   ├── middleware/         # Auth, Rate Limiter, Validator, Error handlers
│   │   ├── routes/             # REST API route declarations
│   │   ├── services/           # Deterministic Engine & Groq AI logic
│   │   └── utils/              # Admin claim seeding utility
│   ├── test/                   # Comprehensive 139-test automated test suite
│   └── server.js               # Express application server entry
├── netlify/                    # Netlify serverless functions
└── netlify.toml                # Netlify build and redirect configuration
```

---

## 🧪 Testing & Verification

VerifyMe includes a full automated test suite containing **139 tests across 10 test suites** using Node's native test runner (`node:test`):

```bash
cd server
npm test
```

### Test Coverage Highlights
- `batch3ScoringOverhaul.test.js`: Validates all 6 target calibration benchmarks (`google.com`, `neverssl.com`, `+919876543210`, `123`, `test@gmail.com`, `test@example.com`).
- `batch2bDistributedRateLimiting.test.js`: Concurrency serialization via Firestore transactions and HTTP 503 fallback testing.
- `batch2bProductionSecurity.test.js`: Strict CORS origin matching, Helmet headers, payload limit defense, and netlify IP resolution.
- `batch2aSecurity.test.js`: Backend-authoritative persistence, token forgery rejection, and RBAC admin enforcement.
- `realLocalNetworkSecurity.test.js`: Real ephemeral HTTP/HTTPS servers (port 0) testing SSRF blocks, redirect loops, and self-signed certificate rejection.
- `spfRecursionAndOrdering.test.js`: Diamond dependencies, circular loop detection, and modifier mechanics.

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- **Node.js** v18 or higher
- A **Firebase Project** with Authentication (Email/Password or Google) and Firestore Database enabled
- A **Groq Cloud API Key** (optional: if omitted, deterministic fallback executes automatically)

### 2. Environment Variables

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FIREBASE_PROJECT_ID=your_firebase_project_id

# Optional for live AI interpretation (fallback operates if omitted)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Service Account credentials for persistent history (optional in local dev)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Installation & Startup

```bash
# 1. Install root, client, and server dependencies
npm run install:all

# 2. Run backend server (Port 5000)
cd server
npm run dev

# 3. In a separate terminal, run frontend client (Port 5173)
cd client
npm run dev
```

---

## ☁️ Deployment (Netlify)

VerifyMe is configured for unified monorepo deployment on **Netlify**:
1. Connect your repository in Netlify.
2. The root `netlify.toml` handles frontend build (`cd client && npm run build`) and redirects `/api/*` to the serverless backend function (`netlify/functions/api.js`).
3. Set your production environment variables in Netlify Dashboard:
   - `ALLOWED_ORIGINS`: Exact URL of your deployed Netlify app (e.g. `https://your-site.netlify.app`)
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_SERVICE_ACCOUNT`: Full JSON string of your Firebase Service Account key
   - `GROQ_API_KEY`: Your Groq API key
   - `VITE_FIREBASE_*`: Your client Firebase credentials

---

<div align="center">
  <sub>Engineered for technical precision, defensible credibility, and uncompromising security.</sub>
</div>
