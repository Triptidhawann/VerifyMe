<div align="center">
  <h1>VerifyMe 🛡️</h1>
  <p><strong>Digital Trust & Verification Intelligence Platform</strong></p>
</div>

VerifyMe is a professional digital trust platform that empowers users to investigate and verify unknown digital identities before trusting, responding, sharing, or clicking. It analyzes phone numbers, email addresses, and website URLs, providing deterministic evidence combined with AI-powered risk assessment.

## 🚀 Features

- **Comprehensive Verification:** Analyze Emails (Syntax, DNS, MX, SPF, DMARC), Phone Numbers (E.164 formats, Country Codes), and Website URLs (Reachability, TLS, Format).
- **AI-Powered Intelligence:** Leverages Groq's high-speed LLMs (Llama 3) to interpret deterministic signals and assign actionable risk scores and recommended actions.
- **Evidence-Based Scoring:** Built on the philosophy that "Valid ≠ Trusted" and "Unknown Must Not Become Safe".
- **Secure Authentication:** Integrated with Firebase Authentication for seamless, secure user access.
- **History Tracking:** Automatically persists verification history to Firebase Firestore for later review.
- **Serverless Architecture:** Fully optimized for Netlify Serverless Functions deployment.

## 💻 Technology Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** Custom CSS with a professional dark-mode UI
- **Routing:** React Router DOM
- **Authentication:** Firebase Auth

### Backend
- **Environment:** Node.js / Express.js
- **Serverless Wrapper:** Serverless-HTTP (for Netlify deployment)
- **AI Integration:** Groq SDK (`llama3-8b-8192`)
- **Database / Admin:** Firebase Admin SDK

## 📂 Project Structure

```text
VerifyMe/
├── client/                 # React Frontend (Vite)
├── server/                 # Express Backend API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth & Error handling
│   │   ├── routes/         # Express routes
│   │   └── services/       # Groq AI & Verification logic
├── netlify/
│   └── functions/          # Netlify Serverless Function entry point
├── netlify.toml            # Netlify deployment configuration
└── package.json            # Root configuration for cloud deployment
```

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- A Firebase Project (with Authentication and Firestore enabled)
- A Groq API Key

### 2. Environment Variables
Create a `.env` file in the `client/` directory:
```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

Create a `.env` file in the `server/` directory:
```env
GROQ_API_KEY="your_groq_api_key"
FRONTEND_URL="http://localhost:5173"
```

### 3. Installation
Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 4. Running Locally
Start the backend server:
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

Start the frontend application:
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

## ☁️ Production Deployment (Netlify)

VerifyMe is configured for unified deployment on Netlify. 

1. Connect your GitHub repository to Netlify.
2. The `netlify.toml` automatically handles the build commands (`cd client && npm run build...`).
3. Add the following **Environment Variables** in your Netlify Dashboard:
   - All `VITE_FIREBASE_*` variables
   - `GROQ_API_KEY`
   - `FRONTEND_URL` (Set to your Netlify site URL, e.g., `https://yoursite.netlify.app`)
4. Deploy! The backend automatically deploys as a highly scalable Netlify Function.
