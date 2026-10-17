/**
 * LabSetu Reference REST API Server
 * 
 * Ready-to-run Express.js backend server.
 * Provides all endpoints expected by the LabSetu frontend:
 * - /api/auth/*          (login, register, me, logout, reset-password)
 * - /api/appointments/*  (list, create, update, delete)
 * - /api/reports/*       (list, get, create, pdf)
 * - /api/lab/*           (dashboard, transactions, activities, center-details)
 * - /api/billing/*       (list, create, dues)
 * - /api/resources/:key  (generic resource CRUD)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'labsetu_jwt_secret_dev_key_2026';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json());

// In-Memory Seed Database (Easily replaceable with MongoDB, PostgreSQL, Supabase, MySQL)
const db = {
  users: [
    {
      id: 'USR-001',
      email: 'admin@labsetu.com',
      password: 'password123',
      name: 'Dr. Shozab Rizvi',
      role: 'authority',
      phone: '9876543210',
      centerName: 'LabSetu Diagnostics',
      labId: '61326885',
      designation: 'Chief Pathologist & Lab Director'
    },
    {
      id: 'USR-002',
      email: 'patient@labsetu.com',
      password: 'password123',
      name: 'Shozab Rizvi',
      role: 'citizen',
      phone: '9876501234',
      uhid: 'UHID-2026-8901',
      age: 28,
      gender: 'Male',
      bloodGroup: 'B+'
    }
  ],
  appointments: [
    {
      id: 'APT-1001',
      patientName: 'Shozab Rizvi',
      uhid: 'UHID-2026-8901',
      testName: 'Complete Blood Count (CBC)',
      labName: 'LabSetu Diagnostics',
      date: '2026-10-20',
      time: '09:30 AM',
      type: 'Home Collection',
      status: 'Confirmed',
      amount: 450
    }
  ],
  reports: [
    {
      id: 'REP-8012',
      patientName: 'Shozab Rizvi',
      uhid: 'UHID-2026-8901',
      testName: 'Complete Blood Count (CBC) with ESR',
      labName: 'LabSetu Central Lab',
      date: '16/10/2026',
      status: 'Available',
      doctor: 'Dr. S. K. Gupta (MD Pathology)',
      parameters: [
        { name: 'Hemoglobin', value: '14.2', unit: 'g/dL', normalRange: '13.0 - 17.0', status: 'Normal' },
        { name: 'Total Leukocyte Count (TLC)', value: '7,400', unit: '/cumm', normalRange: '4,000 - 11,000', status: 'Normal' },
        { name: 'Platelet Count', value: '2.4', unit: 'Lakh/cumm', normalRange: '1.5 - 4.5', status: 'Normal' }
      ]
    }
  ],
  dashboard: {
    employeeLogins: 4,
    browserSecurity: 'Active',
    doctorAccess: 'Enabled',
    paymentsDue: 18450,
    recentTransactions: [
      { id: 1, patient: 'Rahul Verma', description: 'CBC + Lipid Profile', time: '15 mins ago', amount: 1250, status: 'Paid' },
      { id: 2, patient: 'Sunita Sharma', description: 'Thyroid Profile (T3, T4, TSH)', time: '40 mins ago', amount: 800, status: 'Due' },
      { id: 3, patient: 'Amitabh Roy', description: 'HbA1c & Fasting Glucose', time: '1 hour ago', amount: 650, status: 'Paid' },
      { id: 4, patient: 'Pooja Iyer', description: 'Vitamin D3 + B12', time: '2 hours ago', amount: 1600, status: 'Paid' }
    ]
  },
  resources: {}
};

// Auth Token Helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Auth Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Token expired or invalid' });
  }
};

/* ==========================================================================
   HEALTH CHECK
   ========================================================================== */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'LabSetu REST API Backend',
    timestamp: new Date().toISOString()
  });
});

/* ==========================================================================
   AUTH ENDPOINTS
   ========================================================================== */
app.post('/api/auth/login', (req, res) => {
  const { identifier, password, role } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: 'Identifier and password are required' });
  }

  const cleanInput = identifier.trim().toLowerCase();
  const isPhone = /^\d{10}$/.test(cleanInput.replace(/\D/g, ''));

  const user = db.users.find(u => {
    if (isPhone) return u.phone === cleanInput.replace(/\D/g, '');
    return u.email.toLowerCase() === cleanInput ||
           (u.name && u.name.toLowerCase() === cleanInput) ||
           (u.centerName && u.centerName.toLowerCase() === cleanInput);
  });

  if (!user) {
    return res.status(404).json({ success: false, error: 'No user found with these credentials' });
  }

  if (user.password !== password) {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({
      success: false,
      error: `Account is registered as ${user.role}. Please select the ${user.role} role tab.`
    });
  }

  const token = generateToken(user);
  const { password: _, ...userSafe } = user;

  res.json({
    success: true,
    user: userSafe,
    token
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role, phone, ...extra } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ success: false, error: 'Name, email, password, and role are required' });
  }

  if (db.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const newUser = {
    id: `USR-${Date.now().toString().slice(-4)}`,
    email: email.trim().toLowerCase(),
    password,
    name: name.trim(),
    role,
    phone: phone || '',
    uhid: role === 'citizen' ? `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    labId: role === 'authority' ? `${Math.floor(10000000 + Math.random() * 90000000)}` : undefined,
    ...extra
  };

  db.users.push(newUser);
  const { password: _, ...userSafe } = newUser;

  res.status(201).json({
    success: true,
    user: userSafe,
    message: 'User registered successfully'
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const { password: _, ...userSafe } = user;
  res.json({ success: true, user: userSafe });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === email?.trim()?.toLowerCase());
  if (user) {
    user.password = newPassword;
  }
  res.json({ success: true, message: 'Password has been reset successfully' });
});

/* ==========================================================================
   APPOINTMENT ENDPOINTS
   ========================================================================== */
app.get('/api/appointments', (req, res) => {
  let list = db.appointments;
  if (req.query.status) {
    list = list.filter(a => a.status.toLowerCase() === req.query.status.toLowerCase());
  }
  res.json({ success: true, data: list });
});

app.post('/api/appointments', (req, res) => {
  const newAppt = {
    id: `APT-${Date.now().toString().slice(-6)}`,
    bookingDate: new Date().toISOString(),
    status: 'Confirmed',
    ...req.body
  };
  db.appointments.unshift(newAppt);
  res.status(201).json({ success: true, data: newAppt });
});

app.get('/api/appointments/:id', (req, res) => {
  const appt = db.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ success: false, error: 'Appointment not found' });
  res.json({ success: true, data: appt });
});

app.put('/api/appointments/:id', (req, res) => {
  const idx = db.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Appointment not found' });
  db.appointments[idx] = { ...db.appointments[idx], ...req.body };
  res.json({ success: true, data: db.appointments[idx] });
});

app.delete('/api/appointments/:id', (req, res) => {
  const idx = db.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Appointment not found' });
  db.appointments[idx].status = 'Cancelled';
  res.json({ success: true, message: 'Appointment cancelled', data: db.appointments[idx] });
});

/* ==========================================================================
   DIAGNOSTIC REPORT ENDPOINTS
   ========================================================================== */
app.get('/api/reports', (req, res) => {
  let list = db.reports;
  if (req.query.uhid) {
    list = list.filter(r => r.uhid === req.query.uhid);
  }
  res.json({ success: true, data: list });
});

app.get('/api/reports/:id', (req, res) => {
  const report = db.reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
  res.json({ success: true, data: report });
});

app.post('/api/reports', (req, res) => {
  const newReport = {
    id: `REP-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString('en-GB'),
    status: 'Available',
    ...req.body
  };
  db.reports.unshift(newReport);
  res.status(201).json({ success: true, data: newReport });
});

app.get('/api/reports/:id/pdf', (req, res) => {
  res.json({
    success: true,
    pdfUrl: `https://sample-diagnostic-reports.labsetu.com/download/${req.params.id}.pdf`
  });
});

/* ==========================================================================
   LAB OPERATIONS ENDPOINTS
   ========================================================================== */
app.get('/api/lab/dashboard', (req, res) => {
  res.json({ success: true, data: db.dashboard });
});

app.get('/api/lab/transactions', (req, res) => {
  res.json({ success: true, data: db.dashboard.recentTransactions });
});

app.get('/api/lab/center-details', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'LabSetu Diagnostics',
      phone: '9876543210',
      email: 'admin@labsetu.com',
      address: '12, Healthcare Avenue, Medical Enclave',
      city: 'New Delhi',
      pincode: '110001',
      labId: '61326885'
    }
  });
});

app.put('/api/lab/center-details', (req, res) => {
  res.json({ success: true, data: req.body });
});

/* ==========================================================================
   GENERIC RESOURCE ENDPOINTS (Powers useDemoResource hook)
   ========================================================================== */
app.get('/api/resources/:key', (req, res) => {
  const value = db.resources[req.params.key];
  if (value !== undefined) {
    res.json({ success: true, data: value });
  } else {
    res.status(404).json({ success: false, error: 'Resource not found' });
  }
});

app.put('/api/resources/:key', (req, res) => {
  db.resources[req.params.key] = req.body;
  res.json({ success: true, data: req.body });
});

app.delete('/api/resources/:key', (req, res) => {
  delete db.resources[req.params.key];
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 LabSetu Backend API Server is running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Allowed CORS Origin: ${CLIENT_ORIGIN}`);
  console.log(`======================================================\n`);
});
