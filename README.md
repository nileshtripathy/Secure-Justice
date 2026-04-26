# Secure Justice

This is our collaborative project focused on building a secure justice platform.

## Team
- Nilesh
- Divyesh
- Shourya
- Markose
- Devi Shree
- Deva Sorya

📖 Project Description

Digital Platform for FIR Management & Evidence Handling

📌 Overview

SecureJustice is a full-stack web application that digitizes FIR registration, case tracking, and evidence management. It connects citizens, police, forensic experts, lawyers, and courts in one secure system.

🎯 Features

Online FIR Filing
Case Tracking Dashboard
Digital Evidence Upload & Hashing
Role-Based Access (Citizen, Police, Lawyer, Court, Admin)
Forensic Analysis Module
Secure Communication
Crime Analytics Dashboard


🛠️ Tech Stack

Frontend: React, CSS
Backend: Node.js, Express
Database: MongoDB
Auth: JWT, bcrypt
Storage: AWS S3 (or cloud)
Optional: Blockchain (for evidence hash)

🏗️ Architecture

React → Node.js/Express → MongoDB → File Storage


🔌 APIs

POST /api/fir        → Create FIR  
POST /api/evidence   → Upload Evidence  
GET  /api/case/:id   → Track Case  


🔐 Security

Role-based access control
Encrypted authentication (JWT)
Evidence hashing (SHA-256)


📈 Future Scope

Mobile app
AI-based crime analysis
Blockchain integration
