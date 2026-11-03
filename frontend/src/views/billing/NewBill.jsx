import React, { useState, useEffect } from 'react';
import './NewBill.css';
import { QuestionMarkCircleIcon, XMarkIcon, MagnifyingGlassIcon, CheckCircleIcon, CreditCardIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';
import { demoDashboardData } from '../../data/mockLabData';
import { ensureArray } from '../../utils/arrayUtils';
import { supabase } from '../../lib/supabase';

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
  paymentMode: 'Cash',
  paymentBreakdown: {
    cash: 0,
    upi: 0,
    card: 0,
    due: 0
  },
  cardPayment: {
    amount: '',
    cardNumber: '',
    cardholderName: '',
    expiry: '',
    cvv: '',
    authRefId: ''
  },
  upiPayment: {
    upiId: '',
    refId: ''
  },
  activeCategory: 'All'
};

export default function NewBill() {
  const { data: dashData, update: updateDashData } = useDemoResource('dashboard', demoDashboardData);

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

  const paymentMode = billWorkflow?.paymentMode || 'Cash';

  const upiPayment = billWorkflow?.upiPayment || defaultBillWorkflow.upiPayment;
  const setUpiPayment = (val) => {
    updateBillWorkflow(prev => ({
      ...(prev || defaultBillWorkflow),
      upiPayment: typeof val === 'function' ? val((prev || defaultBillWorkflow).upiPayment) : val
    }));
  };

  const cardPayment = billWorkflow?.cardPayment || defaultBillWorkflow.cardPayment;
  const setCardPayment = (val) => {
    updateBillWorkflow(prev => ({
      ...(prev || defaultBillWorkflow),
      cardPayment: typeof val === 'function' ? val((prev || defaultBillWorkflow).cardPayment) : val
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
  const [toast, setToast] = useState({ show: false, message: '', isFading: false });

  const showToastNotification = (msg) => {
    setToast({ show: true, message: msg, isFading: false });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isFading: true }));
      setTimeout(() => {
        setToast({ show: false, message: '', isFading: false });
      }, 300);
    }, 3000);
  };
  const [savedNotice, setSavedNotice] = useState(false);
  const [billReceipt, setBillReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTests = [
    { id: 1, name: 'Complete Blood Count (CBC)', category: 'Haematology', price: 450 },
    { id: 2, name: 'Lipid Profile', category: 'Biochemistry', price: 800 },
    { id: 3, name: 'Liver Function Test', category: 'Biochemistry', price: 750 },
    { id: 4, name: 'X-Ray Chest PA View', category: 'Radiology', price: 300 },
    { id: 5, name: 'Dengue NS1 Antigen', category: 'Serology', price: 600 },
    { id: 6, name: 'Thyroid Function Profile', category: 'Biochemistry', price: 500 },
    { id: 7, name: 'Urine Routine Examination', category: 'Haematology', price: 200 }
  ];

  const filteredTests = ensureArray(availableTests).filter(t => {
    const matchesCat = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = !testSearch.trim() || t.name.toLowerCase().includes(testSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (test) => {
    const safeCart = ensureArray(cart);
    if (!safeCart.find(item => item.id === test.id)) {
      setCart([...safeCart, test]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.price, 0);
  const netPayable = Math.max(0, subtotal - discount);

  const [isSplitOverridden, setIsSplitOverridden] = useState(() => {
    const pb = billWorkflow?.paymentBreakdown;
    if (!pb) return false;
    return Boolean(pb.upi || pb.card || pb.due || (pb.cash && pb.cash !== netPayable));
  });

  const handlePaymentModeChange = (newMode) => {
    setIsSplitOverridden(false);
    updateBillWorkflow(prev => {
      const current = prev || defaultBillWorkflow;
      let newBreakdown = { cash: 0, upi: 0, card: 0, due: 0 };
      if (newMode === 'Cash') newBreakdown.cash = netPayable;
      else if (newMode === 'UPI') newBreakdown.upi = netPayable;
      else if (newMode === 'Card') newBreakdown.card = netPayable;
      else if (newMode === 'Due / Credit') newBreakdown.due = netPayable;
      else if (newMode === 'Split / Multi-Mode') newBreakdown.cash = netPayable;

      const cleanCardPayment = {
        amount: newMode === 'Card' ? (netPayable > 0 ? String(netPayable) : '') : '',
        cardNumber: '',
        cardholderName: '',
        expiry: '',
        cvv: '',
        authRefId: ''
      };

      const cleanUpiPayment = {
        upiId: '',
        refId: ''
      };

      return {
        ...current,
        paymentMode: newMode,
        paymentBreakdown: newBreakdown,
        cardPayment: cleanCardPayment,
        upiPayment: cleanUpiPayment
      };
    });
  };

  const handleCashChange = (val) => {
    setIsSplitOverridden(true);
    const num = val === '' ? '' : (parseFloat(val) || 0);
    setPaymentBreakdown(prev => ({ ...prev, cash: num }));
  };

  const handleUpiChange = (val) => {
    setIsSplitOverridden(true);
    const num = val === '' ? '' : (parseFloat(val) || 0);
    setPaymentBreakdown(prev => ({ ...prev, upi: num }));
  };

  const handleCardAmountChange = (val) => {
    if (paymentMode === 'Split / Multi-Mode') {
      setIsSplitOverridden(true);
    }
    const num = val === '' ? '' : (parseFloat(val) || 0);
    setPaymentBreakdown(prev => ({ ...prev, card: num }));
    setCardPayment(prev => ({ ...prev, amount: val }));
  };

  const handleDueChange = (val) => {
    setIsSplitOverridden(true);
    const num = val === '' ? '' : (parseFloat(val) || 0);
    setPaymentBreakdown(prev => ({ ...prev, due: num }));
  };

  useEffect(() => {
    if (paymentMode !== 'Split / Multi-Mode') {
      updateBillWorkflow(prev => {
        const current = prev || defaultBillWorkflow;
        let newBreakdown = { cash: 0, upi: 0, card: 0, due: 0 };
        if (paymentMode === 'Cash') newBreakdown.cash = netPayable;
        else if (paymentMode === 'UPI') newBreakdown.upi = netPayable;
        else if (paymentMode === 'Card') newBreakdown.card = netPayable;
        else if (paymentMode === 'Due / Credit') newBreakdown.due = netPayable;

        const curBreakdown = current.paymentBreakdown || {};
        const breakdownChanged = (
          curBreakdown.cash !== newBreakdown.cash ||
          curBreakdown.upi !== newBreakdown.upi ||
          curBreakdown.card !== newBreakdown.card ||
          curBreakdown.due !== newBreakdown.due
        );

        const cardAmount = netPayable > 0 ? String(netPayable) : '';
        const cardChanged = paymentMode === 'Card' && String(current.cardPayment?.amount || '') !== cardAmount;

        if (!breakdownChanged && !cardChanged) {
          return current;
        }

        return {
          ...current,
          paymentBreakdown: newBreakdown,
          cardPayment: paymentMode === 'Card'
            ? { ...(current.cardPayment || defaultBillWorkflow.cardPayment), amount: cardAmount }
            : (current.cardPayment || defaultBillWorkflow.cardPayment)
        };
      });
    } else if (!isSplitOverridden) {
      updateBillWorkflow(prev => {
        const current = prev || defaultBillWorkflow;
        const curBreakdown = current.paymentBreakdown || {};
        if (curBreakdown.cash === netPayable && curBreakdown.upi === 0 && curBreakdown.card === 0 && curBreakdown.due === 0) {
          return current;
        }
        return {
          ...current,
          paymentBreakdown: { cash: netPayable, upi: 0, card: 0, due: 0 }
        };
      });
    }
  }, [netPayable, paymentMode, isSplitOverridden, updateBillWorkflow]);

  const clearForm = () => {
    setIsSplitOverridden(false);
    updateBillWorkflow({
      ...defaultBillWorkflow,
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
      paymentMode: 'Cash',
      paymentBreakdown: {
        cash: 0,
        upi: 0,
        card: 0,
        due: 0
      },
      cardPayment: {
        amount: '',
        cardNumber: '',
        cardholderName: '',
        expiry: '',
        cvv: '',
        authRefId: ''
      },
      upiPayment: {
        upiId: '',
        refId: ''
      },
      activeCategory: 'All'
    });
    setBillReceipt(null);
  };

  const handleSaveBill = async (printAfter = false) => {
    if (cart.length === 0) {
      showToastNotification('Please add at least one laboratory test or package to the bill.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    const fullName = `${patientForm.firstName} ${patientForm.lastName}`.trim() || 'Walk-in Patient';
    const newTxnId = `TX-${Math.floor(2050 + Math.random() * 900)}`;
    const newRegNo = patientForm.uhid ? `REG-${patientForm.uhid.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 9000)}` : `REG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord = {
      id: newTxnId,
      regNo: newRegNo,
      patient: fullName,
      description: ensureArray(cart).map(c => c.name).join(', '),
      amount: netPayable,
      method: paymentMode === 'Due / Credit' ? 'Cash' : paymentMode,
      status: 'Paid',
      receivedBy: 'Cashier Desk',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    updateDashData((current) => {
      const prevTxns = current?.recentTransactions || [];
      return {
        ...current,
        recentTransactions: [newRecord, ...prevTxns]
      };
    });

    try {
      // Explicitly INSERT into transactions table with strict error verification and column fallback
      const fullPayload = {
        id: newTxnId,
        reg_no: newRegNo,
        patient: fullName,
        patient_name: fullName,
        ref: patientForm.doctor || 'Self',
        dcn: 'D-01',
        cc: 'Main Lab',
        amount: netPayable,
        method: paymentMode === 'Due / Credit' ? 'Cash' : paymentMode,
        payment_mode: paymentMode === 'Due / Credit' ? 'Cash' : paymentMode,
        status: 'Paid',
        received_by: 'Cashier Desk',
        description: ensureArray(cart).map(c => c.name).join(', '),
        center_id: 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'
      };

      let { error } = await supabase.from('transactions').insert(fullPayload);

      // Resilient fallback if schema in PostgreSQL lacks extended columns (code 42703)
      if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
        console.warn('[NewBill] Extended columns not yet migrated, falling back to core transactions schema:', error.message);
        const fallbackPayload = {
          id: newTxnId,
          amount: netPayable,
          payment_mode: paymentMode === 'Due / Credit' ? 'Cash' : paymentMode,
          center_id: 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'
        };
        const fallbackRes = await supabase.from('transactions').insert(fallbackPayload);
        error = fallbackRes.error;
      }

      if (error) {
        console.error('[NewBill] Supabase transactions insert failure:', error);
        showToastNotification(`Error saving transaction: ${error.message || 'Database error'}`);
        setIsSubmitting(false);
        return;
      }

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);

      showToastNotification(`Bill #${newTxnId} successfully saved! Ledger updated in real-time.`);

      if (printAfter) {
        setTimeout(() => {
          window.print();
          clearForm();
          setIsSubmitting(false);
        }, 400);
      } else {
        clearForm();
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('[NewBill] Transaction save exception:', err);
      showToastNotification(`Save failed: ${err.message || 'Network exception'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="newbill-container printable-area">
      {/* Animated State-Driven Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
            transform: toast.isFading ? 'translateX(100%)' : 'translateX(0)',
            opacity: toast.isFading ? 0 : 1,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            border: '1px solid #059669',
            maxWidth: '380px'
          }}
          role="alert"
        >
          <CheckCircleIcon style={{ width: '22px', height: '22px', color: '#34d399', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500', lineHeight: 1.4 }}>{toast.message}</span>
        </div>
      )}
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
            {ensureArray(cart).length === 0 ? (
              <div style={{color:'#9ca3af', fontSize:'0.9rem', textAlign:'center', marginTop:'3rem'}}>
                No tests added yet. Select diagnostics from the left.
              </div>
            ) : (
              ensureArray(cart).map(item => (
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
            <div className="newbill-input-group">
              <label className="newbill-label">Payment Mode</label>
              <select 
                className="newbill-input"
                value={paymentMode}
                onChange={(e) => handlePaymentModeChange(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Due / Credit">Due / Credit</option>
                <option value="Split / Multi-Mode">Split / Multi-Mode</option>
              </select>
            </div>

            {/* Split / Multi-Mode Amount Breakdown */}
            {paymentMode === 'Split / Multi-Mode' && (
              <div style={{ marginTop: '0.75rem' }}>
                <div className="newbill-grid-2">
                  <div className="newbill-input-group">
                    <div style={{fontSize:'0.8rem', color:'#6b7280'}}>Cash</div>
                    <input 
                      type="number" 
                      className="newbill-input" 
                      value={paymentBreakdown.cash !== undefined && paymentBreakdown.cash !== null ? paymentBreakdown.cash : ''} 
                      onChange={(e) => handleCashChange(e.target.value)} 
                    />
                  </div>
                  <div className="newbill-input-group">
                    <div style={{fontSize:'0.8rem', color:'#6b7280'}}>UPI</div>
                    <input 
                      type="number" 
                      className="newbill-input" 
                      value={paymentBreakdown.upi !== undefined && paymentBreakdown.upi !== null ? paymentBreakdown.upi : ''} 
                      onChange={(e) => handleUpiChange(e.target.value)} 
                    />
                  </div>
                  <div className="newbill-input-group">
                    <div style={{fontSize:'0.8rem', color:'#6b7280'}}>Card</div>
                    <input 
                      type="number" 
                      className="newbill-input" 
                      value={cardPayment.amount || (paymentBreakdown.card !== undefined && paymentBreakdown.card !== null ? paymentBreakdown.card : '')} 
                      placeholder="0.00"
                      onChange={(e) => handleCardAmountChange(e.target.value)} 
                    />
                  </div>
                  <div className="newbill-input-group">
                    <div style={{fontSize:'0.8rem', color:'#6b7280'}}>Due / Credit</div>
                    <input 
                      type="number" 
                      className="newbill-input" 
                      value={paymentBreakdown.due !== undefined && paymentBreakdown.due !== null ? paymentBreakdown.due : ''} 
                      onChange={(e) => handleDueChange(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UPI Payment Specification */}
            {paymentMode === 'UPI' && (
              <div className="newbill-card-box">
                <div className="newbill-card-box-header">
                  <QrCodeIcon style={{ width: '18px', height: '18px', color: '#15803d' }} />
                  <span>UPI Payment Specification</span>
                </div>
                
                <div className="newbill-card-box-body">
                  <div className="newbill-input-group">
                    <label className="newbill-label">UPI ID / VPA</label>
                    <input 
                      type="text" 
                      className="newbill-input card-input" 
                      placeholder="e.g., user@okhdfcbank" 
                      value={upiPayment.upiId || ''} 
                      onChange={(e) => setUpiPayment(prev => ({ ...prev, upiId: e.target.value }))}
                    />
                  </div>
                  <div className="newbill-input-group" style={{ marginBottom: 0 }}>
                    <label className="newbill-label">Transaction / Ref ID</label>
                    <input 
                      type="text" 
                      className="newbill-input card-input" 
                      placeholder="e.g., UPI-984210" 
                      value={upiPayment.refId || ''} 
                      onChange={(e) => setUpiPayment(prev => ({ ...prev, refId: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Card Payment Specification */}
            {paymentMode === 'Card' && (
              <div className="newbill-card-box">
                <div className="newbill-card-box-header">
                  <CreditCardIcon style={{ width: '18px', height: '18px', color: '#15803d' }} />
                  <span>Card Payment Specification</span>
                </div>
                
                <div className="newbill-card-box-body">
                  <div className="newbill-grid-2">
                    <div className="newbill-input-group">
                      <label className="newbill-label">Card Amount (Rs.)</label>
                      <input 
                        type="number" 
                        className="newbill-input card-input" 
                        placeholder="0.00" 
                        value={cardPayment.amount}
                        onChange={(e) => handleCardAmountChange(e.target.value)}
                      />
                    </div>
                    <div className="newbill-input-group">
                      <label className="newbill-label">Card Number</label>
                      <input 
                        type="text" 
                        className="newbill-input card-input" 
                        placeholder="4532 •••• •••• 8892" 
                        maxLength={19}
                        value={cardPayment.cardNumber}
                        onChange={(e) => setCardPayment(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="newbill-input-group">
                    <label className="newbill-label">Cardholder Name</label>
                    <input 
                      type="text" 
                      className="newbill-input card-input" 
                      placeholder="e.g., John Doe" 
                      value={cardPayment.cardholderName}
                      onChange={(e) => setCardPayment(prev => ({ ...prev, cardholderName: e.target.value }))}
                    />
                  </div>

                  <div className="newbill-grid-2">
                    <div className="newbill-input-group">
                      <label className="newbill-label">Expiry Date</label>
                      <input 
                        type="text" 
                        className="newbill-input card-input" 
                        placeholder="MM/YY" 
                        maxLength={5}
                        value={cardPayment.expiry}
                        onChange={(e) => setCardPayment(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                      />
                    </div>
                    <div className="newbill-input-group">
                      <label className="newbill-label">CVV</label>
                      <input 
                        type="password" 
                        className="newbill-input card-input" 
                        placeholder="CVV" 
                        maxLength={4}
                        value={cardPayment.cvv}
                        onChange={(e) => setCardPayment(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      />
                    </div>
                  </div>

                  <div className="newbill-input-group" style={{ marginBottom: 0 }}>
                    <label className="newbill-label">Transaction / Auth Ref ID</label>
                    <input 
                      type="text" 
                      className="newbill-input card-input" 
                      placeholder="e.g., TXN-984210" 
                      value={cardPayment.authRefId}
                      onChange={(e) => setCardPayment(prev => ({ ...prev, authRefId: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button 
              type="button" 
              disabled={isSubmitting || cart.length === 0}
              className="newbill-primary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isSubmitting ? 0.75 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                borderRadius: '10px'
              }}
              onClick={() => handleSaveBill(true)}
            >
              {isSubmitting ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', height: '16px', width: '16px' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing & Preparing Slip...
                </>
              ) : (
                'Save & Print Bill'
              )}
            </button>
            <button 
              type="button" 
              disabled={isSubmitting || cart.length === 0}
              className="newbill-secondary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isSubmitting ? 0.75 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                borderRadius: '10px'
              }}
              onClick={() => handleSaveBill(false)}
            >
              {isSubmitting ? 'Saving to Database...' : 'Save Only'}
            </button>
            <button 
              type="button" 
              disabled={isSubmitting}
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
