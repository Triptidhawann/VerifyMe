<div align="center">
  <h1>VerifyMe</h1>
  <p><strong>Digital Trust & Verification Intelligence Platform</strong></p>
  
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
  [![Netlify Serverless](https://img.shields.io/badge/Netlify-Serverless-38B7B0.svg)](https://netlify.com/)
  [![Groq AI](https://img.shields.io/badge/AI-Groq_Llama_3-f59e0b.svg)](https://groq.com/)
</div>

<br />

VerifyMe is a professional digital trust platform that empowers users to investigate and verify unknown digital identities before trusting, responding, sharing, or clicking. It analyzes phone numbers, email addresses, and website URLs, providing deterministic evidence combined with AI-powered risk assessment. 

Built with a focus on **robust system architecture**, **security**, and **fallback-driven reliability**, VerifyMe ensures that users always receive actionable intelligence, even during third-party AI outages.

---

## ✨ Core Features

- **Comprehensive Deterministic Verification:** 
  - **Emails:** Syntax validation, DNS resolution, MX records check, SPF, and strict DMARC policies.
  - **Phone Numbers:** Robust E.164 parsing, international country code detection, and numbering rules validation via libphonenumber-js.
  - **Website URLs:** Reachability checks, TLS/HTTPS protocol validation, and SSRF (Server-Side Request Forgery) protection.
- **AI-Powered Intelligence Layer:** Leverages Groq's high-speed LLMs (Llama 3 family) to interpret deterministic signals and generate dynamic, target-aware precautions.
- **Fallback-First Architecture:** The system strictly separates deterministic truth from AI enrichment. If the AI provider experiences rate limits, API failures, or model deprecations, VerifyMe instantaneously falls back to a highly accurate deterministic explanation engine.
- **Secure Authentication:** Seamless integration with Firebase Authentication and Firestore for secure, real-time user session management and verification history logging.
- **Serverless Ready:** Fully optimized backend utilizing serverless-http for frictionless deployment to Netlify Functions.

---

## 💻 Technology Stack

### Frontend Architecture
- **Framework:** React 18 (Vite)
- **Styling:** Custom CSS with a professional dark-mode UI
- **Routing:** React Router DOM
- **Authentication:** Firebase Auth

### Backend Architecture
- **Environment:** Node.js / Express.js
- **Serverless Wrapper:** Serverless-HTTP (for Netlify deployment)
- **Intelligence Engine:** Deterministic rule-set combined with Groq SDK (openai/gpt-oss-20b fallback-configurable)
- **Database / Admin:** Firebase Admin SDK
- **Data Validation:** libphonenumber-js

---

## 📁 Repository Structure

This project is a monorepo containing both the React frontend and the Express/Serverless backend.

`	ext
VerifyMe/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Full page views (Dashboard, Login, History)
│   │   ├── services/       # API integration and Firebase logic
│   │   └── context/        # React Context providers
├── server/                 # Express Backend API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth & Error handling
│   │   ├── routes/         # Express routes
│   │   └── services/       # Deterministic Intelligence Engine & Groq AI logic
├── netlify/
│   └── functions/          # Netlify Serverless Function entry point
└── netlify.toml            # Netlify CI/CD deployment configuration
`

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- A Firebase Project (with Authentication and Firestore enabled)
- A Groq API Key

### 2. Environment Variables

Create a .env file in the client/ directory:
`env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
`

Create a .env file in the server/ directory:
`env
GROQ_API_KEY="your_groq_api_key"
GROQ_MODEL="openai/gpt-oss-20b"
FRONTEND_URL="http://localhost:5173"
`

### 3. Installation
Install dependencies for both frontend and backend:
`ash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
`

### 4. Running Locally

**Start the backend server:**
`ash
cd server
npm run dev
# Runs on http://localhost:5000
`

**Start the frontend application:**
`ash
cd client
npm run dev
# Runs on http://localhost:5173
`

---

## ☁️ Production Deployment (Netlify)

VerifyMe is configured for unified deployment on Netlify. 

1. Connect your GitHub repository to Netlify.
2. The 
etlify.toml automatically handles the build commands (cd client && npm run build...).
3. Add the following **Environment Variables** in your Netlify Dashboard:
   - All VITE_FIREBASE_* variables
   - GROQ_API_KEY
   - GROQ_MODEL
   - FRONTEND_URL (Set to your Netlify site URL, e.g., https://yoursite.netlify.app)
4. Deploy! The backend automatically deploys as a highly scalable Netlify Function.

---

<div align="center">
  <i>Engineered for reliability, security, and trust.</i>
</div>
