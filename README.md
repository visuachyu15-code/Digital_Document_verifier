# 📄 Digital Document Verification System

A full-stack MERN web application where every document receives a **unique ID** and a **QR code**. Anyone can scan the QR code to instantly verify whether the document is genuine — no login required.

Built as a trustworthy verification portal with role-based access, audit trails, and cryptographic integrity checks.

---

## ✨ Features

### Core (Phase 1 & 2)
- **Unique Document IDs** — Every document gets an auto-generated ID like `DOC-7F3A9C2B1D`
- **QR Code Generation** — Each document has a scannable QR that links to the public verify page
- **Public Verification** — Anyone can verify a document without logging in
- **Role-Based Access Control** — Admin, Verifier, and User roles with distinct permissions
- **JWT Authentication** — Stateless auth with bcrypt password hashing
- **Full CRUD** — Create, read, update, delete documents with proper authorization
- **Search & Filter** — Debounced search by ID/name/holder/issuer; filter by status and type
- **Responsive UI** — Mobile-first design, works on all screen sizes
- **Status Management** — Pending → Verified / Rejected / Revoked workflow

### Extra Features (Phase 3)
- **📷 Camera QR Scanner** — Scan QR codes directly from the Verify page using the device camera (`html5-qrcode`)
- **📜 PDF Certificate Download** — Generate a branded PDF certificate with embedded QR code for verified documents (`jsPDF`)
- **📋 Audit Trail** — Full history of every create, update, delete, and status change with timestamps
- **📊 Dashboard Charts** — Donut chart by status + bar chart by document type (`Recharts`)
- **🔒 File Upload & Hash Check** — SHA-256 cryptographic file integrity verification (`multer`, `crypto`)
- **📅 Expiry Date** — Documents show "Expired" automatically when the date has passed
- **🛡️ Rate Limiting** — Public verify route limited to 30 requests/minute per IP (`express-rate-limit`)

---

## 🛠️ Tech Stack

| Layer       | Technology                                                        |
|-------------|-------------------------------------------------------------------|
| **Frontend**| React 19 (Vite), React Router 7, Axios, Recharts, jsPDF, html5-qrcode |
| **Backend** | Node.js, Express 5, Mongoose 9, JWT, bcryptjs, qrcode, multer    |
| **Database**| MongoDB (local or Atlas)                                          |
| **Security**| JWT tokens, bcrypt hashing, SHA-256 file integrity, rate limiting |

---

## 📁 Folder Structure

```
Document_verifier/
├── server/                     # Express + Node.js backend
│   ├── middleware/
│   │   ├── auth.js             # protect & authorize(roles) middleware
│   │   ├── error.js            # Centralised error handler
│   │   └── upload.js           # Multer memory storage config
│   ├── models/
│   │   ├── User.js             # User schema (name, email, password, role)
│   │   └── Document.js         # Document schema (documentId, status, auditTrail, fileHash…)
│   ├── routes/
│   │   ├── auth.js             # Register, login, me
│   │   ├── documents.js        # CRUD, stats, charts, QR, status change
│   │   ├── users.js            # Admin user management
│   │   └── verify.js           # Public verification + file integrity check
│   ├── scripts/
│   │   └── seed.js             # Seeds demo users and sample documents
│   ├── server.js               # App entry point
│   ├── .env                    # Environment variables (NOT committed)
│   ├── .env.example            # Template for .env
│   ├── .gitignore              # Ignores node_modules and .env
│   └── package.json
│
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Login, register, logout, session restore
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Role-aware navigation bar
│   │   │   ├── ProtectedRoute.jsx # Route guard with role checks
│   │   │   ├── DocumentModal.jsx  # Add/Edit document form modal
│   │   │   └── QrScannerModal.jsx # Camera QR scanner modal
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page with hero verify input
│   │   │   ├── Login.jsx       # Login form
│   │   │   ├── Register.jsx    # Registration form
│   │   │   ├── Dashboard.jsx   # Stats, charts, document table
│   │   │   ├── DocumentDetail.jsx # Detail view, QR, status panel, audit log, PDF
│   │   │   ├── PublicVerify.jsx # Public verification + QR scanner + file check
│   │   │   └── Users.jsx       # Admin user management
│   │   ├── api.js              # Axios instance with JWT auto-attach
│   │   ├── App.jsx             # Router and route definitions
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Design system and global styles
│   ├── .env.example            # Template for client .env
│   └── package.json
│
└── README.md                   # ← You are here
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** 18 or newer (`node -v` to check)
- **MongoDB** — either a local MongoDB Community install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Document_verifier
```

### 2. Setup the backend

```bash
cd server
npm install
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/document-verifier
JWT_SECRET=your_super_secret_key_change_this
CLIENT_URL=http://localhost:5173
```

### 3. Seed the database

```bash
npm run seed
```

This creates demo users and sample documents (see **Demo Logins** below).

### 4. Start the backend server

```bash
npm run dev
```

Server starts at `http://localhost:5000`. You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

### 5. Setup the frontend

Open a **new terminal**:

```bash
cd client
npm install
```

Create `.env` from the template:

```bash
cp .env.example .env
```

Ensure it contains:

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Start the frontend

```bash
npm run dev
```

App opens at `http://localhost:5173`.

---

## 🔑 Demo Logins

| Role     | Email               | Password     | Permissions                                                      |
|----------|---------------------|--------------|------------------------------------------------------------------|
| Admin    | `admin@demo.com`    | `password123`| Full CRUD on all documents, change status, manage users          |
| Verifier | `verifier@demo.com` | `password123`| View all documents, set status (Verified/Rejected/Revoked)       |
| User     | `user@demo.com`     | `password123`| Submit documents, view/edit/delete own documents (Pending only)  |

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Route              | Access  | Purpose                          |
|--------|--------------------|---------|----------------------------------|
| POST   | `/api/auth/register` | Public  | Register a new user (role: user) |
| POST   | `/api/auth/login`    | Public  | Login and receive JWT token      |
| GET    | `/api/auth/me`       | Private | Get current user profile         |

### Documents (`/api/documents`)

| Method | Route                       | Access                 | Purpose                                       |
|--------|-----------------------------|------------------------|-----------------------------------------------|
| GET    | `/api/documents/stats`      | Private (all roles)    | Get document counts per status                |
| GET    | `/api/documents/charts`     | Private (all roles)    | Get chart aggregation data (status + type)    |
| POST   | `/api/documents`            | Private (all roles)    | Create a new document (supports file upload)  |
| GET    | `/api/documents`            | Private (all roles)    | List documents with search & filters          |
| GET    | `/api/documents/:id`        | Private (all roles)    | Get single document details                   |
| GET    | `/api/documents/:id/qr`     | Private (all roles)    | Get QR code PNG Data URL                      |
| PUT    | `/api/documents/:id`        | Private (admin, user¹) | Update document metadata                      |
| DELETE | `/api/documents/:id`        | Private (admin, user¹) | Delete a document                             |
| PATCH  | `/api/documents/:id/status` | Private (admin, verifier) | Change verification status & remarks       |

> ¹ Users can only edit/delete their **own** documents while status is **Pending**.

### Public Verification (`/api/verify`)

| Method | Route                              | Access | Purpose                                         |
|--------|------------------------------------|--------|-------------------------------------------------|
| GET    | `/api/verify/:documentId`          | Public | Verify a document (returns valid/invalid + details) |
| POST   | `/api/verify/:documentId/check-file` | Public | Upload a file to check SHA-256 hash integrity   |

> Rate limited: **30 requests per minute per IP**

### User Management (`/api/users`)

| Method | Route                  | Access          | Purpose                        |
|--------|------------------------|-----------------|--------------------------------|
| GET    | `/api/users`           | Private (admin) | List all users                 |
| PATCH  | `/api/users/:id/role`  | Private (admin) | Change a user's role           |
| DELETE | `/api/users/:id`       | Private (admin) | Delete a user (cannot self-delete) |

### Health Check

| Method | Route          | Access | Purpose            |
|--------|----------------|--------|--------------------|
| GET    | `/api/health`  | Public | API health check   |

---

## 🎓 Viva Questions & Answers

| Question | Answer |
|----------|--------|
| **Why JWT?** | It is stateless: the server signs a token at login and checks it on each request, so no session storage is needed. |
| **How does role-based access work?** | The `protect` middleware verifies the JWT and loads `req.user`. The `authorize(roles)` middleware blocks routes the user's role is not allowed to use. |
| **Why is the verify route public?** | Anyone should be able to check a document; it returns only non-sensitive fields (no internal IDs or creator info). |
| **What does the QR contain?** | Only the verify URL with the document ID (e.g., `http://localhost:5173/verify/DOC-XXXXXXXXXX`). The real check is the database lookup. |
| **How are passwords stored?** | Hashed with **bcrypt** (10 salt rounds). Never stored as plain text. |
| **Map CRUD to REST** | **Create** → POST, **Read** → GET, **Update** → PUT/PATCH, **Delete** → DELETE |
| **Why MongoDB?** | Documents are flexible JSON-like records. Mongoose provides schema validation on top of MongoDB's flexible structure. |
| **How does file integrity work?** | When a file is uploaded, its **SHA-256 hash** is stored. On the verify page, a visitor can upload the same file and the app compares the hashes to detect tampering. |
| **What is the audit trail?** | An embedded array in the Document model. Every create, update, delete, and status change records who did it, what changed, and when. |
| **How does expiry work?** | If an `expiryDate` is set and the current date is past it, the verify route returns `isExpired: true` and displays "Expired" instead of "Verified". |

---

## 📸 Screenshots

> Add screenshots of the following pages here:

1. **Home / Landing Page** — Hero section with "Verify a Document" input
2. **Login Page** — Clean form with validation
3. **Dashboard (Admin)** — Stats cards, charts, document table
4. **Document Detail** — Details panel, QR code, status management, audit trail
5. **Public Verify (Valid)** — Green "Valid" certificate card
6. **Public Verify (Invalid)** — Red "Invalid" result card
7. **QR Scanner** — Camera-based QR scanning modal
8. **Users Management** — Admin user role management page
9. **Mobile View** — Responsive layout on phone width

---

## 📋 Submission Checklist

- [x] README complete with setup instructions and API table
- [x] Seed script gives working demo logins
- [x] All three roles tested (admin, verifier, user)
- [x] QR opens the verify page on a phone
- [x] `.env` is not committed (in `.gitignore`)
- [x] Public verification works without login
- [x] Camera QR scanner functional
- [x] PDF certificate downloads with embedded QR
- [x] Audit trail records every action
- [x] Dashboard charts display correctly
- [x] File integrity check works (SHA-256)
- [x] Rate limiting on public verify route

---

## 📜 License

This project is for educational / submission purposes.
