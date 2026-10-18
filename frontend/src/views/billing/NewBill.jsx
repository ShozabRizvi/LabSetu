import React, { useState } from 'react';
import './NewBill.css';
import { QuestionMarkCircleIcon, XMarkIcon, MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';
import { demoDashboardData } from '../../data/mockLabData';

export default function NewBill() {
  const { data: dashData, update: updateDashData } = useDemoResource('dashboard', demoDashboardData);

  const defaultBillWorkflow = {
    patientForm: {
      mobile: '',
      uhid: '',
      firstName: '',
      lastName: '',
      age: '',
      gender: 'Select',
      doctor: 'Self',
      agent: 'None (Walk-in)'
    },
    cart: [],
    discount: 0,
    paymentBreakdown: {
      cash: 0,
      upi: 0,
      card: 0,
      due: 0
    },
    activeCategory: 'All'
  };

  // Persistent workflow state: refreshes keep active patient and cart draft intact
  const { data: billWorkflow, update: updateBillWorkflow } = useDemoResource('active_billing_workflow', defaultBillWorkflow);

  const patientForm = billWorkflow?.patientForm || defaultBillWorkflow.patientForm;
  const setPatientForm = (val) => {
    updateBillWorkflow(prev => ({
      ...(prev || defaultBillWorkflow),
      patientForm: typeof val === 'function' ? val((prev || defaultBillWorkflow).patientForm) : val
    }));
  };

  const cart = billWorkflow?.cart || [];
  const setCart = (val) => {
    updateBillWorkflow(prev => ({
      ...(prev || defaultBillWorkflow),
      cart: typeof val === 'function' ? val((prev || defaultBillWorkflow).cart) : val
    }));
  };

  const discount = billWorkflow?.discount ?? 0;
  const setDiscount = (val) => {
    updateBillWorkflow(prev => ({
      ...(prev || defaultBillWorkflow),
      discount: typeof val === 'function' ? val((prev || defaultBillWorkflow).discount) : val
    }));
  };

  const paymentBreakdown = billWorkflow?.paymentBreakdown || defaultBillWorkflow.paymentBreakdown;
  const setPaymentBreakdown = (val) => {
    updateBillWorkflow(prev => ({
      ...(prev || defaultBillWorkflow),
      paymentBreakdown: typeof val === 'function' ? val((prev || defaultBillWorkflow).paymentBreakdown) : val
    }));
  };

  const activeCategory = billWorkflow?.activeCategory || 'All';
  const setActiveCategory = (val) => {
    updateBillWorkflow(prev => ({
      ...(prev || defaultBillWorkflow),
      activeCategory: typeof val === 'function' ? val((prev || defaultBillWorkflow).activeCategory) : val
    }));
  };

  const [testSearch, setTestSearch] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [billReceipt, setBillReceipt] = useState(null);

  const availableTests = [
    { id: 1, name: 'Complete Blood Count (CBC)', category: 'Haematology', price: 450 },
    { id: 2, name: 'Lipid Profile', category: 'Biochemistry', price: 800 },
    { id: 3, name: 'Liver Function Test', category: 'Biochemistry', price: 750 },
    { id: 4, name: 'X-Ray Chest PA View', category: 'Radiology', price: 300 },
    { id: 5, name: 'Dengue NS1 Antigen', category: 'Serology', price: 600 },
    { id: 6, name: 'Thyroid Function Profile', category: 'Biochemistry', price: 500 },
    { id: 7, name: 'Urine Routine Examination', category: 'Haematology', price: 200 }
  ];

  const filteredTests = availableTests.filter(t => {
    const matchesCat = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = !testSearch.trim() || t.name.toLowerCase().includes(testSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (test) => {
    if (!cart.find(item => item.id === test.id)) {
      setCart([...cart, test]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearForm = () => {
    setCart([]);
    setDiscount(0);
    setPatientForm({
      mobile: '',
      uhid: '',
      firstName: '',
      lastName: '',
      age: '',
      gender: 'Select',
      doctor: 'Self',
      agent: 'None (Walk-in)'
    });
    setBillReceipt(null);
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.price, 0);
  const netPayable = Math.max(0, subtotal - discount);

  const handleSaveBill = (printAfter = false) => {
    if (cart.length === 0) {
      alert('Please add at least one laboratory test or package to the bill.');
      return;
    }
    const fullName = `${patientForm.firstName} ${patientForm.lastName}`.trim() || 'Walk-in Patient';
    const newTxnId = `TX-${Math.floor(2050 + Math.random() * 900)}`;

    const newRecord = {
      id: newTxnId,
      patient: fullName,
      description: cart.map(c => c.name).join(', '),
      amount: netPayable,
      status: 'Paid',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    updateDashData((current) => {
      const prevTxns = current?.recentTransactions || [];
      return {
        ...current,
        recentTransactions: [newRecord, ...prevTxns]
      };
    });

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);

    if (printAfter) {
      setTimeout(() => {
        window.print();
        clearForm();
      }, 400);
    } else {
      alert(`Bill #${newTxnId} saved successfully for ${fullName}!`);
      clearForm();
    }
  };

  return (
    <div className="newbill-container">
      {/* Header */}
      <div className="newbill-header">
        <h1>Create New Laboratory Bill</h1>
        <p>Enter patient details, select diagnostics, and split payment modes.</p>
      </div>

      {savedNotice && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: '600'
        }}>
          <CheckCircleIcon style={{ width: '20px' }} />
          Laboratory invoice generated and synced with ledger!
        </div>
      )}

      <div className="newbill-layout">
        {/* Left Column */}
        <div>
          {/* Step 1 */}
          <div className="newbill-card">
            <div className="newbill-card-title" style={{justifyContent: 'space-between'}}>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                1. Patient Details
                <div className="newbill-tooltip-wrapper">
                  <QuestionMarkCircleIcon style={{width:'20px'}} />
                  <div className="newbill-tooltip">
                    <strong>Patient Registry</strong><br/>
                    Patient lookup prevents duplicate profiles and auto-fills historical medical preferences.
                  </div>
                </div>
              </div>
              <div style={{fontSize:'0.75rem', backgroundColor:'#f3f4f6', color:'#4b5563', padding:'0.25rem 0.5rem', borderRadius:'12px', fontWeight:'500'}}>
                Quick Registry Entry
              </div>
            </div>

            <div className="newbill-grid-2">
              <div className="newbill-input-group">
                <label className="newbill-label">Mobile Number</label>
                <input 
                  type="tel" 
                  className="newbill-input" 
                  placeholder="e.g. 9876543210" 
                  value={patientForm.mobile}
                  onChange={e => setPatientForm({ ...patientForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                />
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">UHID (Optional)</label>
                <input 
                  type="text" 
                  className="newbill-input" 
                  placeholder="Enter UHID" 
                  value={patientForm.uhid}
                  onChange={e => setPatientForm({ ...patientForm, uhid: e.target.value })}
                />
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">First Name</label>
                <input 
                  type="text" 
                  className="newbill-input" 
                  placeholder="First Name" 
                  value={patientForm.firstName}
                  onChange={e => setPatientForm({ ...patientForm, firstName: e.target.value })}
                />
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">Last Name</label>
                <input 
                  type="text" 
                  className="newbill-input" 
                  placeholder="Last Name" 
                  value={patientForm.lastName}
                  onChange={e => setPatientForm({ ...patientForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="newbill-grid-3">
              <div className="newbill-input-group">
                <label className="newbill-label">Age</label>
                <input 
                  type="number" 
                  className="newbill-input" 
                  placeholder="Age" 
                  value={patientForm.age}
                  onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
                />
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">Gender</label>
                <select 
                  className="newbill-input" 
                  value={patientForm.gender}
                  onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
                >
                  <option>Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">Referring Doctor</label>
                <select 
                  className="newbill-input"
                  value={patientForm.doctor}
                  onChange={e => setPatientForm({ ...patientForm, doctor: e.target.value })}
                >
                  <option>Self</option>
                  <option>Dr. Smith</option>
                  <option>Dr. Jones</option>
                  <option>Dr. A. K. Gupta</option>
                </select>
              </div>
            </div>
            <div className="newbill-input-group" style={{marginTop:'0.5rem'}}>
              <label className="newbill-label">Collection Agent</label>
              <select 
                className="newbill-input"
                value={patientForm.agent}
                onChange={e => setPatientForm({ ...patientForm, agent: e.target.value })}
              >
                <option>None (Walk-in)</option>
                <option>Agent A (Sample Van)</option>
                <option>Agent B (Home Phlebotomy)</option>
              </select>
            </div>
          </div>

          {/* Step 2 */}
          <div className="newbill-card">
            <div className="newbill-card-title">
              2. Test & Package Selection
              <div className="newbill-tooltip-wrapper">
                <QuestionMarkCircleIcon style={{width:'20px'}} />
                <div className="newbill-tooltip">
                  <strong>Diagnostics Pricing</strong><br/>
                  Test pricing dynamically calculates totals based on the selected center.
                </div>
              </div>
            </div>

            <div className="newbill-input-group" style={{position:'relative', marginBottom: '1rem'}}>
              <MagnifyingGlassIcon style={{position:'absolute', width:'20px', color:'#9ca3af', left:'10px', top:'50%', transform:'translateY(-50%)'}} />
              <input 
                type="text" 
                className="newbill-input" 
                style={{paddingLeft:'2.5rem'}} 
                placeholder="Search tests or packages..." 
                value={testSearch}
                onChange={e => setTestSearch(e.target.value)}
              />
            </div>

            <div style={{display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap'}}>
              {['All', 'Haematology', 'Biochemistry', 'Radiology', 'Serology'].map(cat => (
                <button 
                  key={cat} 
                  type="button"
                  className={`newbill-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{border:'1px solid #e5e7eb', borderRadius:'6px', overflow:'hidden'}}>
              {filteredTests.map(test => (
                <div key={test.id} className="newbill-test-row">
                  <div>
                    <div style={{fontWeight:'500', color:'#111827'}}>{test.name}</div>
                    <div style={{fontSize:'0.8rem', color:'#6b7280'}}>{test.category}</div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                    <div style={{fontWeight:'600'}}>Rs. {test.price}</div>
                    <button 
                      type="button" 
                      className="newbill-add-btn" 
                      onClick={() => addToCart(test)}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="newbill-card" style={{position:'sticky', top:'1rem'}}>
          <div className="newbill-card-title">
            3. Billing Summary
            <div className="newbill-tooltip-wrapper" style={{marginLeft:'auto'}}>
              <QuestionMarkCircleIcon style={{width:'20px'}} />
              <div className="newbill-tooltip">
                <strong>Financial Ledger</strong><br/>
                Saved bills are automatically synced with the daily business ledger.
              </div>
            </div>
          </div>

          <div style={{minHeight:'150px', marginBottom:'1rem'}}>
            {cart.length === 0 ? (
              <div style={{color:'#9ca3af', fontSize:'0.9rem', textAlign:'center', marginTop:'3rem'}}>
                No tests added yet. Select diagnostics from the left.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="newbill-cart-item">
                  <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                    <button type="button" className="newbill-cart-remove" onClick={() => removeFromCart(item.id)}>
                      <XMarkIcon style={{width:'16px'}} />
                    </button>
                    <span className="newbill-cart-item-name">{item.name}</span>
                  </div>
                  <span className="newbill-cart-item-price">Rs. {item.price}</span>
                </div>
              ))
            )}
          </div>

          <div className="newbill-summary-row">
            <span>Subtotal</span>
            <span style={{fontWeight:'500'}}>Rs. {subtotal}</span>
          </div>
          
          <div className="newbill-summary-row" style={{alignItems:'center'}}>
            <span>Discount (Rs.)</span>
            <input 
              type="number" 
              className="newbill-input" 
              style={{width:'80px', padding:'0.25rem 0.5rem', textAlign:'right'}} 
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>

          <div className="newbill-summary-total">
            <span>Net Payable</span>
            <span>Rs. {netPayable}</span>
          </div>

          <div style={{marginTop:'1.5rem', marginBottom:'1.5rem'}}>
            <label className="newbill-label" style={{display:'block', marginBottom:'0.5rem'}}>Payment Mode Breakdown</label>
            <div className="newbill-grid-2">
              <div className="newbill-input-group">
                <div style={{fontSize:'0.8rem', color:'#6b7280'}}>Cash</div>
                <input type="number" className="newbill-input" defaultValue={netPayable} />
              </div>
              <div className="newbill-input-group">
                <div style={{fontSize:'0.8rem', color:'#6b7280'}}>UPI</div>
                <input type="number" className="newbill-input" defaultValue="0" />
              </div>
              <div className="newbill-input-group">
                <div style={{fontSize:'0.8rem', color:'#6b7280'}}>Card</div>
                <input type="number" className="newbill-input" defaultValue="0" />
              </div>
              <div className="newbill-input-group">
                <div style={{fontSize:'0.8rem', color:'#6b7280'}}>Due / Credit</div>
                <input type="number" className="newbill-input" defaultValue="0" />
              </div>
            </div>
          </div>

          <div>
            <button 
              type="button" 
              className="newbill-primary-btn"
              onClick={() => handleSaveBill(true)}
            >
              Save & Print Bill
            </button>
            <button 
              type="button" 
              className="newbill-secondary-btn"
              onClick={() => handleSaveBill(false)}
            >
              Save Only
            </button>
            <button 
              type="button" 
              className="newbill-clear-btn" 
              onClick={clearForm}
            >
              Clear entire form
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
