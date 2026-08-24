# Low-Level Design (LLD)
## Project: Secure Justice

### 1. Purpose
This document details the internal design of SecureJustice's backend modules, database schemas, API contracts, and key logic flows, building on the architecture defined in the HLD.

### 2. Database Schema (MongoDB Collections)

#### 2.1 `users`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique user ID |
| name | String | Full name |
| email | String | Unique login identifier |
| passwordHash | String | bcrypt-hashed password |
| role | String (enum) | citizen / police / forensic / lawyer / court / admin |
| createdAt | Date | Account creation timestamp |

#### 2.2 `firs`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique FIR ID |
| citizenId | ObjectId (ref: users) | FIR filer |
| title | String | Short case title |
| description | String | Incident details |
| location | String | Incident location |
| status | String (enum) | Filed / Under Investigation / Forwarded / Closed |
| assignedPoliceId | ObjectId (ref: users) | Officer handling the case |
| createdAt | Date | Filing timestamp |
| updatedAt | Date | Last status update timestamp |

#### 2.3 `evidence`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique evidence ID |
| firId | ObjectId (ref: firs) | Linked FIR/case |
| uploadedBy | ObjectId (ref: users) | Uploader (usually police) |
| fileUrl | String | Cloud storage reference (S3 URL) |
| fileHash | String | SHA-256 hash of file content |
| fileType | String | image / video / document |
| uploadedAt | Date | Upload timestamp |

#### 2.4 `forensic_reports`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique report ID |
| evidenceId | ObjectId (ref: evidence) | Related evidence |
| forensicExpertId | ObjectId (ref: users) | Analyst |
| findings | String | Analysis result/summary |
| submittedAt | Date | Report submission time |

#### 2.5 `messages`
| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Unique message ID |
| firId | ObjectId (ref: firs) | Related case |
| senderId | ObjectId (ref: users) | Sender |
| receiverId | ObjectId (ref: users) | Recipient |
| content | String | Message body |
| sentAt | Date | Timestamp |

### 3. API Design

#### 3.1 `POST /api/fir`
- **Auth:** Required (role: citizen)
- **Body:** `{ title, description, location }`
- **Logic:**
  1. Validate JWT and extract citizenId.
  2. Validate input fields.
  3. Insert new document into `firs` with `status: "Filed"`.
  4. Return created FIR with generated `_id`.
- **Response:** `201 Created`, FIR object.

#### 3.2 `POST /api/evidence`
- **Auth:** Required (role: police or forensic)
- **Body:** multipart/form-data — `{ firId, file }`
- **Logic:**
  1. Validate JWT and role.
  2. Validate that `firId` exists.
  3. Upload file to cloud storage (S3), obtain `fileUrl`.
  4. Compute SHA-256 hash of file contents.
  5. Insert record into `evidence` collection linking `firId`, `fileUrl`, `fileHash`.
- **Response:** `201 Created`, evidence metadata (excluding raw file).

#### 3.3 `GET /api/case/:id`
- **Auth:** Required (any authenticated role, filtered by RBAC)
- **Logic:**
  1. Validate JWT, extract role and userId.
  2. Fetch FIR by `id`.
  3. Apply role-based field filtering (e.g., citizens see status but not internal police notes).
  4. Aggregate linked evidence (metadata only) and forensic report summaries.
- **Response:** `200 OK`, aggregated case object.

### 4. Authentication & Authorization Flow
1. User submits credentials to a login endpoint.
2. Backend verifies password via bcrypt comparison against `passwordHash`.
3. On success, backend issues a JWT containing `{ userId, role }`, signed with a server secret.
4. Client attaches JWT as `Authorization: Bearer <token>` on subsequent requests.
5. Express middleware verifies token signature and expiry, attaches `req.user`.
6. Role-check middleware compares `req.user.role` against the route's allowed roles before invoking the controller.

### 5. Evidence Hashing Logic
```
1. Receive file buffer from multipart upload.
2. Compute hash = SHA256(fileBuffer).
3. Upload fileBuffer to cloud storage → get fileUrl.
4. Store { firId, fileUrl, hash, uploadedBy, uploadedAt } in `evidence` collection.
5. (Verification, on demand) Re-download file, recompute SHA256, compare to stored hash to detect tampering.
```

### 6. Error Handling
- **400** — invalid/missing input fields.
- **401** — missing or invalid JWT.
- **403** — valid JWT but role not permitted for the action.
- **404** — referenced FIR/evidence/user not found.
- **500** — unhandled server/database errors, logged server-side.

### 7. Module Interaction Diagram (Textual)
```
Citizen UI --(POST /api/fir)--> FIR Controller --> firs collection
Police UI --(POST /api/evidence)--> Evidence Controller --> S3 Storage
                                                          --> evidence collection
Any Role UI --(GET /api/case/:id)--> Case Controller --> firs + evidence + forensic_reports (joined)
Forensic UI --(submit findings)--> Forensic Controller --> forensic_reports collection
```

### 8. Non-Functional Design Notes
- Indexes recommended on `firs.citizenId`, `firs.assignedPoliceId`, `evidence.firId`, and `messages.firId` for query performance.
- All file uploads should enforce a max size limit and allowed MIME types at the API layer before hitting storage.
- JWT secret and cloud storage credentials must be managed via environment variables, never committed to source control.
