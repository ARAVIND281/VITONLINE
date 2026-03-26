# 🎓 VITONLINE Security Lab
**JWT Authentication & Role-Based Access Control (RBAC)**

![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge&logo=appveyor)
![Framework](https://img.shields.io/badge/Frontend-React.js_|_Vite-blue?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/Backend-Node.js_|_Express-green?style=for-the-badge&logo=node.js)
![Security](https://img.shields.io/badge/Security-JWT_Auth-purple?style=for-the-badge&logo=jsonwebtokens)

A premium, state-of-the-art web application engineered to demonstrate secure authentication flows using **JSON Web Tokens (JWT)** and **Role-Based Access Control (RBAC)**. Built as part of the **Cryptography and Network Security Lab - BCSE309P** curriculum, this application seamlessly bridges a sleek, glassmorphic React frontend with a robust, authenticated Express backend ecosystem.

---

## 📜 Problem Statement

**Secure Online Examination System using JWT with Role-Based Access**

An VITONLINE examination system must ensure that only authenticated users can securely access its services. The system supports two types of users: **Faculty** and **Students**, each with different access privileges. 

As a developer, you are required to implement a JWT-based authentication and authorization system to provide secure and stateless session management. Design and develop a web application where users log in to receive a JWT, which is required to access protected endpoints. The server must validate the token for every request and enforce role-based access control such that:
- **Students** can view exam questions and submit answers.
- **Faculty** can create exams, view submissions, and manage results.

Access must be denied if the token is invalid, missing, expired, or does not match the required role.

**Flow of Execution:**
`Login` → `JWT Generation (with Role)` → `Token Usage` → `Token Verification` → `Role-Based Authorization` → `Access Control`

---

## ✨ Features

- **Robust JWT Generation & Validation**: Securely signs payloads using `HMAC-SHA256` via the Node.js backend to ensure session integrity.
- **Role-Based Access Control (RBAC)**: Strict privilege enforcement between `STUDENT` and `FACULTY` user roles.
- **Real-Time Security Terminal**: A visual debug console embedded into the application that tracks HTTP headers, JWT signature parsing, and access phases.
- **Tampered Token Simulation**: A dedicated security utility demonstrating backend rejection of maliciously modified JWT signatures.
- **Premium UI / UX**: A dark-themed, glassmorphic aesthetic modeled after cutting-edge developer tooling.
- **Stateless RESTful API**: True HTTP request isolation using Axios and standard `Authorization: Bearer <token>` schemas.

---

## 🏗️ Architecture Stack

### Frontend (User Interface)
- **Vite** (Next-generation lightning-fast build tool)
- **React.js** (Component-driven UI architecture)
- **Axios** (Promise-based asynchronous HTTP client)
- **Vanilla CSS3** (Custom glassmorphism & CSS-grid layouts without heavy frameworks)

### Backend (API Engine)
- **Node.js** (JavaScript runtime environment)
- **Express.js** (Minimalist routing and middleware framework)
- **jsonwebtoken** (Industry standard RFC 7519 method for representing claims)
- **Cors** (Cross-origin resource sharing middleware)

---

## 🚀 Getting Started

Follow these instructions to spin up the entire ecosystem on your local machine.

### 1. Backend Setup

The Express server handles all token authorization, issuance, and protected routes.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the Node.js server (Runs on port 5001)
node server.js
```

### 2. Frontend Setup

The React frontend handles the UI presentation, Axios interconnectivity, and JWT storage.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Boot the Vite development server
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🔐 Demonstration Credentials

To securely test the Role-Based Access boundaries, utilize the following built-in credentials:

| Type | Username | Password | Role Permissions |
| :--- | :--- | :--- | :--- |
| **Student** | `student1` | `password` | Submit Answers, View Exams |
| **Faculty** | `faculty1` | `password` | Create Exams, View Submissions, Manage Results, View Exams |

---

## 📡 API Endpoints Reference

All secure endpoints strictly require the `Authorization: Bearer <token>` header payload. Missing or tampered signatures immediately return `401 Unauthorized` or `403 Forbidden`.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/login` | *Public* | Validates physical credentials and issues the JWT. |
| **`GET`** | `/api/exams` | `student`, `faculty` | Retrieves the list of examination questions. |
| **`POST`** | `/api/exams/:id/submit` | `student` | Submits answers against a specific question ID. |
| **`POST`** | `/api/exams` | `faculty` | Creates a new examination container. |
| **`GET`** | `/api/submissions` | `faculty` | Retrieves student examination submissions. |
| **`GET`** | `/api/results` | `faculty` | Calculates and manages aggregated student results. |

---

## 🛡️ Security Execution Flow

1. **Authentication (Phase 1)**: User inputs credentials into the React client.
2. **Token Issuance (Phase 2)**: The Express backend validates the identity against the internal Mock DB and signs a JWT (`Header.Payload.Signature`) mapped to the user's explicit role.
3. **Storage & Usage (Phase 3)**: React caches the JWT and attaches it to the `.headers.Authorization` object for upcoming Axios calls.
4. **Backend Validation (Phase 4)**: The `authenticateJWT` middleware utilizes the server secret to cryptographically verify if the token originated from the system.
5. **Authorization (Phase 5)**: The `authorizeRole` middleware variably intercepts the request if the verified token's `req.user.role` does not match the strict whitelist required for the endpoint.

---

> **Author**: Aravind S (23BCE0924)  
> **Course**: Cryptography and Network Security Lab - BCSE309P  
> **Faculty**: Dr. ISLABUDEEN M  
> **Institution**: VIT Vellore
