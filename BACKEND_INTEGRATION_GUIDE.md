# 🩺 LabSetu - Backend Integration & API Specification Guide

Welcome to the **LabSetu** backend integration guide! This document is designed for backend developers building or integrating a server (Node.js/Express, Python/FastAPI/Django, Go, Java/Spring Boot, PHP/Laravel, C#/.NET, etc.) with the LabSetu frontend.

---

## 📑 Table of Contents
1. [Architecture & Request Lifecycle](#1-architecture--request-lifecycle)
2. [Frontend Configuration (.env)](#2-frontend-configuration-env)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Complete REST API Specification](#4-complete-rest-api-specification)
   - [Auth Endpoints](#auth-endpoints)
   - [Appointments Endpoints](#appointments-endpoints)
   - [Diagnostic Reports Endpoints](#diagnostic-reports-endpoints)
   - [Lab Operations & Dashboard Endpoints](#lab-operations--dashboard-endpoints)
   - [Billing & Invoicing Endpoints](#billing--invoicing-endpoints)
   - [Generic Resource Adapter Endpoints](#generic-resource-adapter-endpoints)
5. [Data Models & Database Schemas](#5-data-models--database-schemas)
6. [Included Starter Backend Server](#6-included-starter-backend-server)
7. [API Testing with cURL](#7-api-testing-with-curl)

---

## 1. Architecture & Request Lifecycle

```
┌────────────────────────────────────────────────────────┐
│               LabSetu React Frontend                   │
│                                                        │
│  [Views: Citizen / Authority / Auth / Registration]    │
│                           │                            │
│                           ▼                            │
│   [Services: authService, appointmentService, etc.]    │
│                           │                            │
│                           ▼                            │
│       [apiClient: Axios/Fetch + JWT Interceptor]       │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTP JSON Requests + JWT
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend REST API                     │
│               (http://localhost:5000/api)              │
│                                                        │
│  - POST /auth/login, /auth/register                    │
│  - GET/POST /appointments                              │
│  - GET /reports, /reports/:id/pdf                      │
│  - GET /lab/dashboard, /billing                        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │  Database (PostgreSQL /   │
              │   MongoDB / MySQL / etc.) │
              └───────────────────────────┘
```

### Transparent Fallback Resilience
The frontend includes a built-in fallback mechanism:
- If `VITE_USE_MOCK=true`, the frontend reads/writes to `localStorage`.
- If `VITE_USE_MOCK=false`, the frontend sends live HTTP requests to your backend server.
- If your backend server goes offline during development, the frontend gracefully falls back to mock storage so screens never crash!

---

## 2. Frontend Configuration (.env)

In `LabSetu/frontend/.env`:

```env
# Point this to your backend server URL
VITE_API_BASE_URL=http://localhost:5000/api

# Set to "false" to connect to your real backend server
# Set to "true" to force local mock data
VITE_USE_MOCK=false

# Enable detailed API request/response logs in the browser console
VITE_ENABLE_API_LOGS=true
```

---

## 3. Authentication & Authorization

### Token Standard
- Authentication uses standard **JWT (JSON Web Tokens)**.
- Transmitted in the HTTP header:
  ```http
  Authorization: Bearer <your_jwt_token_here>
  ```
- The frontend `apiClient` automatically extracts the token from `localStorage.getItem('labsetu_token')` and attaches it to all outgoing requests.

### Roles
The system distinguishes two primary roles:
1. `citizen` — Patients accessing test reports, booking home collections, tracking appointments.
2. `authority` — Pathologists, lab directors, technicians, billing receptionists.

---

## 4. Complete REST API Specification

All endpoints are prefixed with `/api`.

### Auth Endpoints

#### 1. Login
- **Method / Path:** `POST /api/auth/login`
- **Description:** Authenticates a citizen or authority user.
- **Request Body:**
  ```json
  {
    "identifier": "admin@labsetu.com",
    "password": "password123",
    "role": "authority"
  }
  ```
  *(Note: `identifier` can be user email, 10-digit mobile number, patient name, or organisation name)*
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "USR-001",
      "email": "admin@labsetu.com",
      "name": "Dr. Shozab Rizvi",
      "role": "authority",
      "phone": "9876543210",
      "labId": "61326885",
      "centerName": "LabSetu Diagnostics"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error (401 / 403 / 404):**
  ```json
  {
    "success": false,
    "error": "Incorrect password. Please try again."
  }
  ```

#### 2. Register
- **Method / Path:** `POST /api/auth/register`
- **Description:** Creates a new patient or authority account.
- **Request Body:**
  ```json
  {
    "name": "Rahul Verma",
    "email": "rahul.verma@example.com",
    "phone": "9876543210",
    "password": "SecurePassword123!",
    "role": "citizen",
    "dob": "1995-06-15",
    "gender": "Male",
    "address": "45 Green Park, New Delhi"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "user": {
      "id": "USR-1042",
      "email": "rahul.verma@example.com",
      "name": "Rahul Verma",
      "role": "citizen",
      "phone": "9876543210",
      "uhid": "UHID-2026-4821"
    },
    "message": "User registered successfully"
  }
  ```

#### 3. Current User Profile
- **Method / Path:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "USR-001",
      "email": "admin@labsetu.com",
      "name": "Dr. Shozab Rizvi",
      "role": "authority",
      "phone": "9876543210",
      "labId": "61326885"
    }
  }
  ```

#### 4. Reset Password
- **Method / Path:** `POST /api/auth/reset-password`
- **Request Body:**
  ```json
  {
    "email": "patient@labsetu.com",
    "newPassword": "NewStrongPassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password updated successfully"
  }
  ```

---

### Appointments Endpoints

#### 1. List Appointments
- **Method / Path:** `GET /api/appointments?status=Confirmed`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "APT-1001",
        "patientName": "Shozab Rizvi",
        "uhid": "UHID-2026-8901",
        "testName": "Complete Blood Count (CBC)",
        "labName": "LabSetu Diagnostics",
        "date": "2026-10-20",
        "time": "09:30 AM",
        "type": "Home Collection",
        "status": "Confirmed",
        "amount": 450
      }
    ]
  }
  ```

#### 2. Book New Appointment
- **Method / Path:** `POST /api/appointments`
- **Request Body:**
  ```json
  {
    "patientName": "Ananya Sharma",
    "uhid": "UHID-2026-3042",
    "testName": "Lipid Profile + Fasting Blood Sugar",
    "labName": "LabSetu Diagnostics",
    "date": "2026-10-22",
    "time": "08:00 AM",
    "type": "Lab Visit",
    "address": "B-402, Sunrise Towers",
    "amount": 950
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "APT-2051",
      "status": "Confirmed",
      "bookingDate": "2026-10-17T10:30:00Z"
    }
  }
  ```

#### 3. Update / Cancel Appointment
- **Method / Path:** `PUT /api/appointments/:id` (Update status or time)
- **Method / Path:** `DELETE /api/appointments/:id` (Cancel appointment)

---

### Diagnostic Reports Endpoints

#### 1. List Reports
- **Method / Path:** `GET /api/reports?uhid=UHID-2026-8901`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "REP-8012",
        "patientName": "Shozab Rizvi",
        "uhid": "UHID-2026-8901",
        "testName": "Complete Blood Count (CBC) with ESR",
        "labName": "LabSetu Central Lab",
        "date": "16/10/2026",
        "status": "Available",
        "doctor": "Dr. S. K. Gupta (MD Pathology)",
        "parameters": [
          { "name": "Hemoglobin", "value": "14.2", "unit": "g/dL", "normalRange": "13.0 - 17.0", "status": "Normal" },
          { "name": "Total Leukocyte Count", "value": "7,400", "unit": "/cumm", "normalRange": "4,000 - 11,000", "status": "Normal" }
        ]
      }
    ]
  }
  ```

#### 2. Download Report PDF
- **Method / Path:** `GET /api/reports/:id/pdf`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "pdfUrl": "https://storage.labsetu.com/reports/REP-8012.pdf"
  }
  ```

---

### Lab Operations & Dashboard Endpoints

#### 1. Dashboard Metrics
- **Method / Path:** `GET /api/lab/dashboard`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "employeeLogins": 4,
      "browserSecurity": "Active",
      "doctorAccess": "Enabled",
      "paymentsDue": 18450,
      "recentTransactions": [
        { "id": 1, "patient": "Rahul Verma", "description": "CBC + Lipid Profile", "time": "15 mins ago", "amount": 1250, "status": "Paid" },
        { "id": 2, "patient": "Sunita Sharma", "description": "Thyroid Profile", "time": "40 mins ago", "amount": 800, "status": "Due" }
      ]
    }
  }
  ```

#### 2. Center Details & Configuration
- **Method / Path:** `GET /api/lab/center-details`
- **Method / Path:** `PUT /api/lab/center-details`
- **Payload:**
  ```json
  {
    "name": "LabSetu Diagnostics",
    "phone": "9876543210",
    "email": "admin@labsetu.com",
    "address": "12, Healthcare Avenue, Medical Enclave",
    "city": "New Delhi",
    "pincode": "110001",
    "labId": "61326885"
  }
  ```

---

### Billing & Invoicing Endpoints

#### 1. Create Patient Bill
- **Method / Path:** `POST /api/billing`
- **Payload:**
  ```json
  {
    "patientName": "Sunita Sharma",
    "uhid": "UHID-2026-9041",
    "totalAmount": 1500,
    "discount": 100,
    "paidAmount": 1000,
    "dueAmount": 400,
    "items": [
      { "testCode": "T101", "testName": "Lipid Profile", "cost": 900 },
      { "testCode": "T105", "testName": "Fasting Blood Sugar", "cost": 600 }
    ]
  }
  ```

---

### Generic Resource Adapter Endpoints
*(Used by the `useDemoResource(key)` React hook for automatic persistent state sync)*
- `GET /api/resources/:key` — Retrieve saved state object.
- `PUT /api/resources/:key` — Update or overwrite state object.
- `DELETE /api/resources/:key` — Reset state object to defaults.

---

## 5. Data Models & Database Schemas

### User Entity
```typescript
interface User {
  id: string;               // e.g. "USR-001"
  email: string;            // unique, lowercase
  passwordHash: string;     // bcrypt hashed
  name: string;             // Full name
  role: 'citizen' | 'authority';
  phone?: string;           // 10 digits
  uhid?: string;            // Unique Health ID (for citizen, e.g. UHID-2026-8901)
  labId?: string;           // Laboratory ID (for authority, e.g. 61326885)
  centerName?: string;      // Organization name
  dob?: string;
  gender?: string;
  address?: string;
  createdAt: Date;
}
```

### Appointment Entity
```typescript
interface Appointment {
  id: string;               // e.g. "APT-1001"
  patientName: string;
  uhid: string;
  testName: string;
  labName: string;
  date: string;             // YYYY-MM-DD
  time: string;             // e.g. "09:30 AM"
  type: 'Lab Visit' | 'Home Collection';
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  amount: number;
  bookingDate: Date;
}
```

---

## 6. Included Starter Backend Server

A fully functioning Express.js reference server is already provided in the `backend/` directory:

```bash
# 1. Navigate to backend directory
cd LabSetu/backend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The server runs on `http://localhost:5000/api` with CORS enabled for `http://localhost:5173`.

---

## 7. API Testing with cURL

### 1. Test Authority Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@labsetu.com","password":"password123","role":"authority"}'
```

### 2. Test Citizen Login (Shozab Rizvi)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"Shozab Rizvi","password":"password123","role":"citizen"}'
```

### 3. Fetch Dashboard Data
```bash
curl -X GET http://localhost:5000/api/lab/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Book Appointment
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Shozab Rizvi","testName":"Complete Blood Count","date":"2026-10-21","time":"10:00 AM","type":"Home Collection","amount":450}'
```

---
*Generated for the LabSetu Healthcare Integration Team.*
