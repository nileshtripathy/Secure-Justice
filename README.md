# Secure Justice

A MERN platform that digitizes FIR (First Information Report) registration, case tracking and evidence handling for citizens, police, forensic experts, lawyers, judges and admins.

**Team:** Nilesh, Divyesh, Shourya, Markose, Devi Shree, Deva Sorya

## Features

- **Online FIR filing** with an auto-generated case number and optional anonymous filing (identity hidden from staff).
- **Public case tracking** by case number: status + activity timeline only, no personal data.
- **Evidence upload with SHA-256 hashing.** `GET /api/evidence/verify/:id` re-hashes the stored file and compares it with the hash recorded at upload, so tampering is detected.
- **Role-based access control + object-level checks.** Roles decide *what* you can do; case ownership decides *which* cases you can see.
- **Email OTP registration / password reset** (OTP stored hashed, 5-minute TTL, max 5 attempts).
- **Admin approval** for police, forensic and lawyer accounts (ID card upload, reviewed in the admin dashboard).
- **Real-time updates** with Socket.io (JWT-authenticated sockets, per-case rooms) plus persisted notifications.
- **Audit trail** of every status change, assignment, evidence upload and integrity check.
- **Analytics** for police/admin.

## Tech stack

React 19 + Vite + Tailwind 4 · Node.js + Express 5 · MongoDB (Mongoose 9) · Socket.io · JWT + bcrypt · Multer · Nodemailer

Evidence files are stored on the server's local disk (`backend/uploads`) and are only served through an authenticated route. Swapping in S3 would only touch `middleware/upload.js` and the evidence controller.

## Quick start

```bash
# 1. install
npm run install-all            # from the repo root (or run npm install in backend/ and frontend/)

# 2. configure the backend
cp backend/.env.example backend/.env
#    set JWT_SECRET (required, 16+ chars). Generate one with:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#    Leave EMAIL_USER/EMAIL_PASS empty in development: OTPs are printed to the backend console.

# 3. configure the frontend
cp frontend/.env.example frontend/.env

# 4. create the first admin (admins and judges cannot self-register)
cd backend
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='Admin12345' npm run seed:admin
JUDGE_EMAIL=judge@example.com JUDGE_PASSWORD='Judge12345' npm run seed:judge   # optional

# 5. run both servers from the repo root
npm run dev
```

Backend: <http://localhost:5000> · Frontend: <http://localhost:5173>

### Tests

```bash
cd backend && npm test
```

## Roles

| Role | Self-register | Can do |
|---|---|---|
| citizen | yes (instant) | file FIRs, see/delete (while pending) own FIRs, message, track |
| police | yes, **needs admin approval** | see all FIRs, assign themselves, update any status, upload/verify evidence, analytics |
| forensic | yes, **needs admin approval** | upload/verify evidence, set investigating / forensic review / legal review |
| lawyer | yes, **needs admin approval** | read cases, evidence and messages |
| judge | no (seeded) | record the judgment (closes the case), verify evidence |
| admin | no (seeded) | everything, approve accounts, delete cases, analytics |

## API overview

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/send-otp` · `/verify-otp` · `/login` | public (rate limited) |
| POST | `/api/auth/forgot-password/verify-email` · `/reset-password` | public (rate limited) |
| GET | `/api/auth/profile` | any user |
| GET/PATCH | `/api/auth/admin/pending` · `/admin/users/:id` · `/admin/users/:id/id-card` | admin |
| GET | `/api/fir/track/:caseNumber` | **public**, minimal data |
| POST/GET | `/api/fir` | create: citizen/police/admin · list: scoped by role |
| GET/PUT/DELETE | `/api/fir/:id` | access checked per case |
| GET | `/api/fir/analytics` | police, admin |
| POST | `/api/evidence/upload` | police, forensic, admin |
| GET | `/api/evidence/fir/:firId` · `/file/:id` | case participants |
| GET | `/api/evidence/verify/:id` | forensic, judge, police, admin |
| GET/POST | `/api/messages/fir/:firId` | case participants |
| GET | `/api/caselogs/:firId` | case participants |
| GET/PATCH | `/api/notifications` · `/unread-count` · `/read-all` · `/:id/read` | own notifications |

## Deployment notes

- Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `EMAIL_USER`, `EMAIL_PASS` on the backend host. The server refuses to start without a valid `JWT_SECRET`.
- Set `VITE_API_URL` (ending in `/api`) on the frontend host.
- To allow Vercel preview deployments set `ALLOW_VERCEL_PREVIEWS=true`.
- Behind a load balancer with several instances, replace the in-memory rate limiter with a shared store and add the Socket.io Redis adapter.
- Render's disk is ephemeral: use a persistent disk or object storage for `backend/uploads` in production.

## Known limitations

- The JWT is kept in `localStorage` (simple, but exposed to XSS). An httpOnly-cookie + refresh-token flow is the next hardening step.
- Evidence storage is local disk, not object storage.
- Lawyers see all cases (there is no per-case lawyer assignment yet).
