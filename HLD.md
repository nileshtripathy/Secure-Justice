# High-Level Design (HLD)
## Project: Secure Justice

### 1. Overview
SecureJustice follows a classic **three-tier web architecture**: a React-based frontend, a Node.js/Express backend exposing REST APIs, and a MongoDB database for persistent storage, backed by cloud file storage for evidence.

```
[ React Frontend ]  <-->  [ Node.js / Express Backend ]  <-->  [ MongoDB Database ]
                                        |
                                        v
                              [ Cloud File Storage (S3) ]
```

### 2. System Components

#### 2.1 Frontend (React)
- Renders role-specific dashboards (Citizen, Police, Forensic, Lawyer, Court, Admin).
- Handles FIR filing forms, case tracking views, evidence upload UI, and messaging UI.
- Communicates with the backend exclusively via authenticated REST API calls.

#### 2.2 Backend (Node.js / Express)
- Exposes REST APIs for FIR management, evidence handling, and case tracking.
- Implements authentication (JWT) and authorization (role-based middleware).
- Coordinates with the database and cloud storage layers.
- Computes SHA-256 hashes for uploaded evidence before storage.

#### 2.3 Database (MongoDB)
- Stores core collections: Users, FIRs, Cases, Evidence metadata, Messages.
- Document-oriented model suited to the varying structure of FIR/case records.

#### 2.4 Storage Layer (AWS S3 or equivalent)
- Stores actual evidence files (images, documents, videos).
- Only the file reference and hash are stored in MongoDB; the file itself lives in cloud storage.

#### 2.5 Auth Layer
- JWT-based session tokens.
- Passwords hashed with bcrypt before storage.
- Role claims embedded in the JWT, checked by backend middleware on every protected route.

### 3. Key Modules
1. **FIR Management Module** — creation, retrieval, and status updates of FIRs.
2. **Evidence Management Module** — upload, hashing, and retrieval of evidence.
3. **Case Tracking Module** — aggregates FIR + evidence + status into a trackable case view.
4. **User & Role Management Module** — registration, login, role assignment.
5. **Forensic Analysis Module** — workflow for forensic experts to review evidence and submit findings.
6. **Communication Module** — secure messaging between stakeholders tied to a case.
7. **Analytics Module** — aggregates case/crime data for the admin dashboard.

### 4. High-Level Data Flow
1. Citizen logs in → JWT issued.
2. Citizen files FIR (`POST /api/fir`) → stored in MongoDB, status set to "Filed".
3. Police reviews FIR → updates status, may request evidence.
4. Evidence uploaded (`POST /api/evidence`) → file sent to cloud storage, SHA-256 hash computed and stored in MongoDB linked to the case.
5. Forensic expert reviews evidence → submits analysis findings against the case.
6. Any authorized stakeholder tracks progress (`GET /api/case/:id`) → aggregated case view returned based on role permissions.
7. Court/Lawyer access case records for judicial proceedings, subject to RBAC.

### 5. Security Architecture
- All traffic served over HTTPS.
- JWT access tokens with role claims; backend middleware enforces RBAC per route.
- Passwords hashed with bcrypt (never stored in plaintext).
- Evidence integrity ensured via SHA-256 hashing at upload time; hash can be re-verified later to detect tampering.
- (Optional/future) Blockchain anchoring of evidence hashes for an immutable audit trail.

### 6. Deployment View
- Frontend: static React build served via a web host/CDN.
- Backend: Node.js/Express service (containerizable) exposing REST APIs.
- Database: managed MongoDB instance (e.g., MongoDB Atlas).
- Storage: AWS S3 bucket (or equivalent) for evidence files.

### 7. Assumptions & Constraints
- All stakeholders access the system via web browser (no native mobile app in current phase).
- Internet connectivity is required for both citizens and officials to use the platform.
- Evidence files are assumed to be within reasonable size limits for cloud upload.
