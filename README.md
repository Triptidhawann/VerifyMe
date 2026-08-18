# VerifyMe

VerifyMe is a digital trust and verification platform. It will eventually provide users the ability to verify phone numbers, email addresses, and website URLs. The application will offer identity information, trust scores, reputation signals, risk levels, and an administrative system.

## Current Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js

## Current Project Structure

```
VerifyMe/
├── client/                 # Frontend React application (Vite)
├── server/                 # Backend Node.js/Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js          # Express app configuration
│   └── server.js           # Main backend entry point
├── README.md
└── .gitignore
```

## How to Install Dependencies

1. **Frontend**:
   ```bash
   cd client
   npm install
   ```

2. **Backend**:
   ```bash
   cd server
   npm install
   ```

## How to Run Frontend

```bash
cd client
npm run dev
```
The frontend should start on standard Vite development port (typically `http://localhost:5173`).

## How to Run Backend

```bash
cd server
npm run dev
```
The backend server runs on `http://localhost:5000`. You can test the health endpoint at `http://localhost:5000/api/health`.

## Current Development Status
- **Phase 0**: Project foundation initialized.
- Frontend and backend skeletal structures created.
- Express server configured with CORS, JSON parsing, and a basic health-check endpoint.
- Ready for Phase 1 development (database integration, core routing, models).
