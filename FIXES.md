# What was fixed

## Bugs
| Area | Problem | Fix |
|---|---|---|
| Evidence | `verifyEvidence` always returned `verified: true` and never re-hashed the file | Re-hashes the stored file (streamed), compares with a timing-safe check, reports mismatch / missing file, writes the result to the audit log |
| FIR | Judgment text was sent by the UI but never saved | Judge-only, saved with date + judge, case closes, immutable afterwards |
| FIR | Status log said `Status updated to undefined` when only assigning | Assignment and status are separate, validated, logged actions |
| Auth middleware | Could send two responses (`headers already sent`) | Single early-return flow |
| Password reset | UI never asked for the OTP, so every reset failed | OTP step added to the form |
| Registration | OTP countdown started when the page loaded, not when the OTP was sent | Countdown starts on send/resend |
| Registration | `AuthContext.register` called a non-existent `/auth/register`; page used `window.location.reload()` | Removed; `setSession` signs the user in directly |
| User model | `status` was written but missing from the schema (silently dropped) | Added; pending staff cannot log in until approved |
| Notifications | Collection and pages existed but nothing ever created a notification | Created on status change, assignment, evidence, message, judgment; pushed live |
| Assignment | `assignedPoliceId` could never be set from the UI | "Assign this case to me" for police, officer shown on the case |
| Sockets | Room joined with the URL id (may be a case number); duplicate messages/evidence for the sender; rooms lost on reconnect; socket recreated on every profile change | Joins by real `_id`, dedupes, re-joins on reconnect, depends on user id |
| Public tracking | `/track` required login despite being advertised as public | Dedicated public endpoint returning minimal data |
| TrackCase / dashboards | `forensic_review` / `legal_review` rendered as "closed" or broke the stepper; duplicate `color` key | Shared status metadata used everywhere |
| Landing page | Dynamic Tailwind classes (`bg-${color}-900`) never generated, so colours were missing; fake stats ("10,000+ FIRs", "99.9%") and "encrypted at rest" claim | Static class maps; claims replaced with true statements |
| Dead code | `routes/evidence.js` referenced undefined `upload`, `Evidence`, `AuditLog`; unused `active` variable | Removed |
| Profile | Misc unused code that failed ESLint | Cleaned |

## Security
- **Privilege escalation:** anyone could register as `admin`/`police`/`judge`. Now only citizen/police/forensic/lawyer can self-register, privileged ones need an ID card + admin approval; admins/judges are seeded.
- **IDOR:** any user could read any FIR, its evidence, messages and logs, delete any FIR, and mark anyone's notifications read. Every route now checks case ownership; notifications are scoped to the owner.
- **Public uploads:** `/uploads` served evidence and ID cards to anyone with a URL. Now served only via authenticated routes; ID cards are admin-only.
- **Uploads:** random server-side file names, MIME + extension allow-list, size limits, orphan files cleaned up on failure.
- **JWT:** no more `'secret'` fallback (server refuses to start), 1-day expiry, user re-loaded on each request so revoked/pending accounts stop working.
- **Sockets:** now authenticated with the JWT; users cannot join arbitrary user/case rooms.
- **NoSQL injection:** inputs type-checked (`{ "$ne": null }` on login no longer works).
- **OTP:** `crypto.randomInt`, stored as HMAC, 5-attempt limit, rate limited endpoints, purpose-separated (register vs reset), no email enumeration on forgot-password.
- **Passwords:** min 8 chars with letter + number, bcrypt cost 12. Removed `console.log(req.body)` that printed passwords.
- **Anonymous FIRs:** identity is now actually hidden from staff (previously only the label changed).
- **Errors:** internal error messages are no longer returned to clients; central error handler; CORS allow-list also applied to Socket.io (was `*`).
- **FIR deletion:** admin, or citizen on own *pending* case only (was any logged-in user); evidence files, messages and notifications are cleaned up and the audit log keeps the deletion.
- **Closed cases** are locked (admin excepted).

## Added
- Backend tests (`npm test`): 14 passing tests (hashing/tamper detection, RBAC, judgment, validation, OTP, rate limiting, anonymity).
- `seed:admin` / `seed:judge` scripts, admin approval panel, shared role/status constants, `.env.example` updates, accurate README.
