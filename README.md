# PocketPilot - AI-Powered Personal Finance assistant

PocketPilot is a premium, production-ready AI financial assistant SaaS application built on clean modular architecture. It helps users log transactions (income, expenses, transfers), establish category budgets, track analytics, and get personalized wealth guidance via the Google Gemini AI API.

---

## 🚀 Main Features

*   **Premium SaaS Design:** Glassmorphic layout panels, soft border glows, outfit typography, dark mode, responsive columns (Desktop, Tablet, Mobile), and Framer Motion micro-animations.
*   **Authentication Flow:** Secure JWT tokens, register/login, verification codes, and forgot/reset password recovery loops.
*   **Ledger Transactions:** CRUD transactions with search, type (income, expense, transfer), category selectors, and recurring triggers.
*   **AI Financial Coach:** Gemini-powered wealth coach persisting chat history, parsing transaction tallies, category budgets, and offering actionable expense tips.
*   **Category Budgets:** Category limit setups, progress metrics, and actual vs budget graphs.
*   **Trend Analytics:** Last 6 months cash flow curves, savings growths, and data export handles (CSV).
*   **Bill Alerts:** Warning tickers if budget categories are exceeded.

---

## 🛠️ Tech Stack

### Frontend
*   **React 19 / TypeScript / Vite**
*   **Tailwind CSS** (Custom glassmorphism theme configurations)
*   **Framer Motion** (Subtle UI float/fade animations)
*   **Recharts** (Cash flow areas, spending distributions, budget targets bar charts)
*   **Axios** (REST requests with JWT token interceptors)
*   **React Hook Form / Zod** (Input validation boundaries)

### Backend
*   **Node.js / Express / TypeScript**
*   **MongoDB / Mongoose** (Optimized indexing schemas)
*   **JWT & bcrypt** (Security hash algorithms)
*   **Google Gemini API** (Intelligent wealth coaching)
*   **Cloudinary / Multer** (Profile photo uploads)

---

## 📁 Folder Structure

```
Project Root
├── package.json              # Runs concurrent dev scripts
├── README.md                 # Project catalog & API documentation
├── backend/
│   ├── package.json          # Node backend dependencies
│   ├── tsconfig.json         # TypeScript compiler configurations
│   ├── .env                  # Port variables, Mongo URI, Gemini API keys
│   └── src/
│       ├── config/           # Database setup configurations
│       ├── models/           # Mongoose models (User, Transaction, Budget, Chat, Notification)
│       ├── middleware/       # JWT auth guards, Zod validators, upload storage
│       ├── controllers/      # Requests handlers for routes
│       ├── routes/           # Routing controllers mapping paths
│       ├── services/         # Gemini, Cloudinary, SMTP services
│       ├── utils/            # Zod validation schemas
│       ├── types/            # TypeScript interfaces
│       ├── app.ts            # App config & Express middleware pipelines
│       └── server.ts         # App entry point
└── frontend/
    ├── package.json          # Vite & React dependencies
    ├── tsconfig.json         # TS configs
    ├── vite.config.ts        # Vite config
    ├── tailwind.config.js    # Design guidelines & variables
    └── src/
        ├── index.html        # HTML mount point
        ├── main.tsx          # React bootstrapper
        ├── App.tsx           # Router mappings & contexts wrapping
        ├── context/          # Context Providers (Auth, Theme, Notifications)
        ├── components/       # UI overlays, navigation items, cards, charts
        ├── pages/            # Landing page and views
        ├── services/         # Axios client mappings
        └── index.css         # Tailwind directives & scroll styles
```

---

## 💾 Database Schema Design

### Users Collection
*   `name` (String, required): User display name.
*   `email` (String, required, unique): Verification and recovery email address.
*   `password` (String, required): bcrypt hashed password credentials.
*   `isVerified` (Boolean): Registered email verification lock state.
*   `verificationCode` / `verificationExpires` (String/Date): Verification tokens.
*   `avatar` (String): Cloudinary link to profile photo.
*   `currency` / `language` / `theme` (String): Configuration options.
*   `notifications` (Object): Settings toggles for alerts.

### Transactions Collection
*   `user` (ObjectId, ref: User, indexed): Owner link.
*   `type` (String, enum: ['income', 'expense', 'transfer']): Flow types.
*   `category` (String): Expense/income classification.
*   `amount` (Number): Cash value.
*   `date` (Date, indexed): Transaction timestamp.
*   `description` (String): Memo.
*   `isRecurring` / `recurringFrequency` (Boolean/String): Automated recurring status.

### Budgets Collection
*   `user` (ObjectId, ref: User, indexed): Owner link.
*   `category` (String): Target classification.
*   `limit` (Number): Target limit value.
*   `period` (String, indexed): format `YYYY-MM`.

### Chat Collection
*   `user` (ObjectId, ref: User, unique): Owner link.
*   `messages` (Array): Conversation blocks containing `role` ('user'|'model'), `content`, and `timestamp`.

### Notifications Collection
*   `user` (ObjectId, ref: User, indexed): Owner link.
*   `title` (String): Alert header.
*   `message` (String): Detail context.
*   `type` (String, enum: ['budget_exceeded', 'upcoming_bill', 'reminder', 'system']): Type tags.
*   `isRead` (Boolean, indexed): Active state indicator.

---

## 📡 REST API Documentation

### 🔓 Public Auth API `/api/auth`
*   `POST /register`: Request new account. (Body: `name`, `email`, `password`)
*   `POST /login`: Log in to account. Returns JWT. (Body: `email`, `password`)
*   `POST /verify-email`: Validates verification code. (Body: `email`, `code`)
*   `POST /resend-code`: Re-dispatches a code. (Body: `email`)
*   `POST /forgot-password`: Generates reset token. (Body: `email`)
*   `POST /reset-password`: Commits new password. (Body: `email`, `code`, `password`)

### 🔒 Protected Application APIs (Require `Authorization: Bearer <token>`)

#### Transactions `/api/transactions`
*   `GET /`: Fetches paginated, searchable, filtered transactions.
*   `POST /`: Creates a transaction. (Triggers budget limit alert if exceeded)
*   `GET /summary`: Compiles dashboard metrics, trend analytics and calls AI Suggestion.
*   `PUT /:id`: Updates transaction details.
*   `DELETE /:id`: Deletes transaction records.

#### Budgets `/api/budgets`
*   `GET /`: Fetches active category budgets for a period.
*   `POST /`: Creates or updates category caps. (Body: `category`, `limit`, `period`)
*   `GET /progress`: Compiles spent vs limit ratios and fetches AI budget tips.
*   `DELETE /:id`: Deletes budget limits.

#### AI Chat Coach `/api/chats`
*   `GET /history`: Retrieves conversation history logs.
*   `POST /message`: Sends query to Gemini Wealth Coach. Returns model response. (Body: `query`)
*   `DELETE /clear`: Resets chat memory logs.

#### Notifications `/api/notifications`
*   `GET /`: Fetches alerts.
*   `PUT /:id/read`: Marks warning read.
*   `PUT /read-all`: Marks all read.
*   `DELETE /:id`: Dismisses notification.

#### User Profile `/api/profile`
*   `GET /`: Retrieves account profile settings.
*   `PUT /`: Updates name, currency, language, theme preferences.
*   `POST /avatar`: Uploads avatar image file (via Multer form-data).
*   `PUT /change-password`: Modifies current password credentials.
*   `DELETE /`: Wipes user details and all linked transactions/budgets/chats database files.

---

## ⚙️ Installation & Setup

1.  **Dependencies Setup:**
    Open a terminal in the root workspace directory and run:
    ```bash
    npm run setup
    ```
    This triggers Node dependency installations for both backend and frontend.

2.  **Environment Setup:**
    Create a `.env` configuration file in the `/backend` directory. Fill in appropriate details based on `/backend/.env.example`.
    *(Note: If `GEMINI_API_KEY` or `CLOUDINARY` coordinates are left empty, PocketPilot operates using comprehensive dynamic fallbacks automatically).*

3.  **Run Development Server:**
    Open two terminals in the root workspace directory:
    *   Terminal 1 (Backend Node server):
        ```bash
        npm run backend
        ```
    *   Terminal 2 (Frontend React client):
        ```bash
        npm run frontend
        ```
    Open your browser and navigate to the local client address: [http://localhost:5173](http://localhost:5173) to operate PocketPilot.
