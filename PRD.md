# Product Requirements Document (PRD)
## Project: Secure Justice

### 1. Purpose
SecureJustice is a full-stack web application that digitizes FIR (First Information Report) registration, case tracking, and evidence management. It connects citizens, police, forensic experts, lawyers, and courts within a single secure digital system, replacing manual, paper-based police and judicial workflows.

### 2. Problem Statement
Traditional FIR filing and case-tracking processes are largely manual, fragmented across departments, and prone to delays, loss of records, and lack of transparency. Citizens have limited visibility into the status of their complaints, and evidence handling lacks tamper-proof verification. SecureJustice addresses these gaps through a unified, role-based digital platform.

### 3. Goals & Objectives
- Enable citizens to file FIRs online without visiting a police station in person.
- Provide real-time case tracking for all stakeholders.
- Ensure evidence integrity through digital hashing.
- Enforce strict role-based access so each stakeholder only sees what they're authorized to see.
- Provide a secure communication channel between citizens, police, lawyers, and courts.
- Give administrators/police a crime analytics dashboard for data-driven decisions.

### 4. Target Users / Stakeholders
| Role | Description |
|---|---|
| Citizen | Files FIRs, tracks case status, communicates with authorities |
| Police | Registers/investigates FIRs, uploads evidence, updates case status |
| Forensic Expert | Analyzes uploaded evidence, submits forensic reports |
| Lawyer | Reviews case details, communicates with clients/courts |
| Court | Accesses case records and evidence for judicial proceedings |
| Admin | Manages users, roles, and platform-wide analytics |

### 5. Core Features
1. **Online FIR Filing** — citizens submit FIRs digitally with case details.
2. **Case Tracking Dashboard** — real-time status updates for all parties.
3. **Digital Evidence Upload & Hashing** — evidence stored securely with SHA-256 hash verification.
4. **Role-Based Access Control (RBAC)** — Citizen, Police, Lawyer, Court, Admin roles with distinct permissions.
5. **Forensic Analysis Module** — dedicated workflow for forensic experts to review and report on evidence.
6. **Secure Communication** — authenticated messaging between stakeholders.
7. **Crime Analytics Dashboard** — aggregated statistics and trends for administrative use.

### 6. Functional Requirements
- Users must register/authenticate via JWT-based login (bcrypt-hashed passwords).
- Citizens can create an FIR via `POST /api/fir`.
- Evidence can be uploaded via `POST /api/evidence`, generating a SHA-256 hash on upload.
- Any authorized user can track a case via `GET /api/case/:id`.
- Access to each endpoint is restricted based on the user's role.

### 7. Non-Functional Requirements
- **Security:** JWT authentication, bcrypt password hashing, encrypted data in transit (HTTPS), evidence hashing to prevent tampering.
- **Scalability:** Node.js/Express backend with MongoDB for flexible, horizontally scalable data storage.
- **Availability:** Cloud-based file storage (AWS S3 or equivalent) for evidence durability.
- **Usability:** Responsive React frontend accessible to non-technical citizen users.

### 8. Tech Stack
- **Frontend:** React, CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Auth:** JWT, bcrypt
- **Storage:** AWS S3 (or equivalent cloud storage)
- **Optional:** Blockchain-based evidence hash anchoring

### 9. Out of Scope (Current Phase)
- Native mobile application
- AI-based crime pattern analysis
- Full blockchain integration for evidence chain-of-custody

### 10. Future Scope
- Mobile app for citizens and police
- AI-based crime analysis and prediction
- Blockchain integration for immutable evidence chain-of-custody

### 11. Success Metrics
- Reduction in average FIR filing and processing time
- Number of FIRs filed online vs. in-person
- Evidence integrity verification success rate
- User adoption across each role (citizen, police, forensic, lawyer, court)
