// DEMO DATA ONLY. Replace this module with API/Supabase queries after backend integration.
// Keep all temporary records here so they can be removed without editing UI components.
export const departments = [
  { id: 'general', name: 'General Medicine', description: 'General consultation and routine diagnostics' },
  { id: 'pathology', name: 'Pathology', description: 'Blood, urine and laboratory investigations' },
  { id: 'radiology', name: 'Radiology', description: 'Imaging and diagnostic scans' },
  { id: 'cardiology', name: 'Cardiology', description: 'Heart health and cardiac investigations' },
  { id: 'orthopedics', name: 'Orthopedics', description: 'Bone, joint and mobility care' },
];

export const appointmentSlots = [
  { id: '09:00', label: '09:00 AM – 09:30 AM' },
  { id: '09:30', label: '09:30 AM – 10:00 AM' },
  { id: '10:00', label: '10:00 AM – 10:30 AM' },
  { id: '10:30', label: '10:30 AM – 11:00 AM' },
  { id: '11:00', label: '11:00 AM – 11:30 AM' },
  { id: '14:00', label: '02:00 PM – 02:30 PM' },
  { id: '14:30', label: '02:30 PM – 03:00 PM' },
  { id: '15:00', label: '03:00 PM – 03:30 PM' },
];

export const demoPatient = { name: 'Demo Patient', mobile: '9876543210', patientId: 'LS-DEMO-1042' };

export const demoDashboardData = {
  employeeLogins: 8,
  smsCredits: 100,
  paymentsDue: 2450,
  recentTransactions: [
    { id: 'TX-2041', patient: 'Riya Sharma', description: 'CBC + Thyroid Profile', amount: 850, status: 'Paid', time: '10:42 AM' },
    { id: 'TX-2040', patient: 'Aarav Singh', description: 'Liver Function Test', amount: 600, status: 'Due', time: '10:15 AM' },
    { id: 'TX-2039', patient: 'Meera Verma', description: 'Blood Sugar Fasting', amount: 250, status: 'Paid', time: '09:54 AM' },
  ],
};

export const setupInitialData = {
  kyc: { ownerName: '', email: '', phone: '', documentType: 'Aadhaar', documentNumber: '' },
  centerDetails: { centerName: 'LabSetu Diagnostics', address: '', city: '', pincode: '', phone: '', email: '' },
  ratelist: [{ id: 'cbc', name: 'Complete Blood Count (CBC)', price: 350 }, { id: 'lft', name: 'Liver Function Test', price: 600 }, { id: 'tsh', name: 'Thyroid Profile', price: 500 }],
  letterhead: { title: 'LabSetu Diagnostics', address: '', phone: '', footer: 'Thank you for choosing our laboratory.' },
  smsTemplates: [{ id: 'report-ready', name: 'Report ready', message: 'Dear {patient}, your lab report is ready.' }, { id: 'appointment', name: 'Appointment reminder', message: 'Reminder: your appointment is scheduled for {date} at {time}.' }],
  panels: [{ id: 'routine', name: 'Routine Health Panel', tests: 'CBC, Blood Sugar, Lipid Profile' }],
  proofread: { enabled: true, requireSecondReview: false, footerNote: 'Please consult your physician for interpretation.' },
};

export const demoCitizenReports = [
  {
    id: 'REP-8941',
    testName: 'Complete Blood Count (CBC)',
    category: 'Haematology',
    date: '12 Sep 2026',
    doctor: 'Dr. A. K. Gupta (MD Pathology)',
    status: 'Ready',
    downloadUrl: '#',
    parameters: [
      { name: 'Hemoglobin', value: '13.8', unit: 'g/dL', reference: '12.0 - 15.5', status: 'Normal' },
      { name: 'Total WBC Count', value: '7,200', unit: '/cu mm', reference: '4,000 - 11,000', status: 'Normal' },
      { name: 'Platelet Count', value: '2.45', unit: 'Lakh/cu mm', reference: '1.5 - 4.5', status: 'Normal' },
      { name: 'RBC Count', value: '4.6', unit: 'million/cu mm', reference: '3.8 - 5.2', status: 'Normal' },
      { name: 'Packed Cell Volume (PCV)', value: '41.2', unit: '%', reference: '36.0 - 46.0', status: 'Normal' }
    ],
    doctorRemark: 'All haematological indices within healthy normal biological limits.'
  },
  {
    id: 'REP-8812',
    testName: 'Lipid Profile Comprehensive',
    category: 'Biochemistry',
    date: '28 Aug 2026',
    doctor: 'Dr. Meenakshi Rao (Pathologist)',
    status: 'Ready',
    downloadUrl: '#',
    parameters: [
      { name: 'Total Cholesterol', value: '185', unit: 'mg/dL', reference: '< 200', status: 'Normal' },
      { name: 'Triglycerides', value: '142', unit: 'mg/dL', reference: '< 150', status: 'Normal' },
      { name: 'HDL Cholesterol (Good)', value: '52', unit: 'mg/dL', reference: '> 40', status: 'Normal' },
      { name: 'LDL Cholesterol', value: '104', unit: 'mg/dL', reference: '< 100', status: 'Borderline' },
      { name: 'VLDL Cholesterol', value: '28.4', unit: 'mg/dL', reference: '10.0 - 30.0', status: 'Normal' }
    ],
    doctorRemark: 'Mild elevation in LDL cholesterol. Moderate dietary fiber recommended.'
  },
  {
    id: 'REP-8705',
    testName: 'Thyroid Function Test (T3, T4, TSH)',
    category: 'Endocrinology',
    date: '10 Aug 2026',
    doctor: 'Dr. A. K. Gupta (MD Pathology)',
    status: 'Ready',
    parameters: [
      { name: 'Total Triiodothyronine (T3)', value: '1.25', unit: 'ng/mL', reference: '0.8 - 2.0', status: 'Normal' },
      { name: 'Total Thyroxine (T4)', value: '8.4', unit: 'µg/dL', reference: '5.1 - 14.1', status: 'Normal' },
      { name: 'TSH (Ultrasensitive)', value: '2.14', unit: 'µIU/mL', reference: '0.4 - 4.2', status: 'Normal' }
    ],
    doctorRemark: 'Thyroid hormones normal. Euthyroid state observed.'
  },
  {
    id: 'REP-9022',
    testName: 'Glycosylated Hemoglobin (HbA1c)',
    category: 'Biochemistry',
    date: '14 Sep 2026',
    doctor: 'Dr. Meenakshi Rao',
    status: 'Sample Processing',
    parameters: [],
    doctorRemark: 'Sample in laboratory analyser. Results expected within 4 hours.'
  }
];

export const demoCitizenBills = [
  {
    id: 'INV-2026-1049',
    date: '12 Sep 2026',
    tests: ['Complete Blood Count (CBC)'],
    total: 450,
    paid: 450,
    due: 0,
    status: 'Paid',
    method: 'UPI (Google Pay)',
    transactionId: 'UPI-982348271039'
  },
  {
    id: 'INV-2026-0982',
    date: '28 Aug 2026',
    tests: ['Lipid Profile Comprehensive', 'Thyroid Profile'],
    total: 1300,
    paid: 1300,
    due: 0,
    status: 'Paid',
    method: 'Debit Card',
    transactionId: 'TXN-CARD-4429'
  },
  {
    id: 'INV-2026-1102',
    date: '14 Sep 2026',
    tests: ['Glycosylated Hemoglobin (HbA1c)'],
    total: 550,
    paid: 0,
    due: 550,
    status: 'Due',
    method: 'Pending Online Settlement'
  }
];

export const demoAvailableTests = [
  { id: 't1', code: 'CBC', name: 'Complete Blood Count (CBC)', category: 'Haematology', sample: 'Blood (EDTA)', fasting: 'No fasting required', tat: 'Same Day (4 Hours)', price: 450 },
  { id: 't2', code: 'LIPID', name: 'Lipid Profile Comprehensive', category: 'Biochemistry', sample: 'Blood (Serum)', fasting: '10-12 hours overnight fasting mandatory', tat: 'Same Day', price: 800 },
  { id: 't3', code: 'LFT', name: 'Liver Function Test (LFT)', category: 'Biochemistry', sample: 'Blood (Serum)', fasting: '8-10 hours fasting', tat: 'Same Day', price: 750 },
  { id: 't4', code: 'KFT', name: 'Kidney Function Test / Renal Profile', category: 'Biochemistry', sample: 'Blood & Spot Urine', fasting: 'Not required', tat: 'Same Day', price: 700 },
  { id: 't5', code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrinology', sample: 'Blood (Serum)', fasting: 'Morning fasting preferred', tat: 'Same Day', price: 350 },
  { id: 't6', code: 'HBA1C', name: 'HbA1c (Glycated Hemoglobin)', category: 'Biochemistry', sample: 'Blood (EDTA)', fasting: 'No fasting required', tat: 'Same Day', price: 550 },
  { id: 't7', code: 'VITD', name: 'Vitamin D (25-Hydroxy)', category: 'Special Diagnostics', sample: 'Blood (Serum)', fasting: 'No fasting required', tat: '24 Hours', price: 1200 },
  { id: 't8', code: 'VITB12', name: 'Vitamin B12 Cyanocobalamin', category: 'Special Diagnostics', sample: 'Blood (Serum)', fasting: 'Fasting preferred', tat: '24 Hours', price: 950 },
  { id: 't9', code: 'USG-ABD', name: 'Ultrasound Whole Abdomen & Pelvis', category: 'Radiology / USG', sample: 'Full bladder required', fasting: 'Overnight fasting', tat: 'Instant with Scan', price: 1500 },
  { id: 't10', code: 'XRAY-CH', name: 'Digital X-Ray Chest PA View', category: 'Radiology', sample: 'Non-contrast digital scan', fasting: 'No fasting required', tat: '30 Minutes', price: 400 }
];

export const demoActivitiesData = [
  { id: 1, type: 'billing', title: 'New Bill Generated', desc: 'Bill #INV-2026-1051 generated for Riya Sharma (Rs. 850).', user: 'Jane Doe (Receptionist)', time: '10 mins ago' },
  { id: 2, type: 'reports', title: 'Diagnostic Report Published', desc: 'CBC report published and signed by Dr. Shozab Rizvi for Patient #1024.', user: 'Mark Evans (Lab Tech)', time: '35 mins ago' },
  { id: 3, type: 'security', title: 'Employee Login Verified', desc: 'Successful login from Chrome on Windows (IP: 192.168.1.14).', user: 'Anna Lee (Manager)', time: '1 hour ago' },
  { id: 4, type: 'setup', title: 'Ratelist Updated', desc: 'Price updated for Thyroid Function Test from Rs. 450 to Rs. 500.', user: 'Dr. Shozab Rizvi', time: '3 hours ago' },
  { id: 5, type: 'billing', title: 'Payment Reconciled', desc: 'Cashier Counter 1 closed shift reconciliation with Rs. 14,200 collected.', user: 'Counter 1', time: 'Yesterday, 8:30 PM' }
];

