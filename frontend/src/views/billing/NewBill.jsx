import React, { useState } from 'react';
import './NewBill.css';
import { QuestionMarkCircleIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function NewBill() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);

  const availableTests = [
    { id: 1, name: 'Complete Blood Count (CBC)', category: 'Haematology', price: 450 },
    { id: 2, name: 'Lipid Profile', category: 'Biochemistry', price: 800 },
    { id: 3, name: 'Liver Function Test', category: 'Biochemistry', price: 750 },
    { id: 4, name: 'X-Ray Chest PA View', category: 'Radiology', price: 300 },
    { id: 5, name: 'Dengue NS1 Antigen', category: 'Serology', price: 600 }
  ];

  const filteredTests = activeCategory === 'All' 
    ? availableTests 
    : availableTests.filter(t => t.category === activeCategory);

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
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.price, 0);
  const netPayable = Math.max(0, subtotal - discount);

  return (
    <div className="newbill-container">
      {/* Header */}
      <div className="newbill-header">
        <h1>Create New Laboratory Bill</h1>
        <p>Enter patient details, select diagnostics, and split payment modes.</p>
      </div>

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
                    Patient lookup prevents duplicate profiles and auto-fills historical medical preferences. Data flows seamlessly into patient history records.
                  </div>
                </div>
              </div>
              <div style={{fontSize:'0.75rem', backgroundColor:'#f3f4f6', color:'#4b5563', padding:'0.25rem 0.5rem', borderRadius:'12px', fontWeight:'500'}}>
                Hover for guide: Patient Registry
              </div>
            </div>

            <div className="newbill-grid-2">
              <div className="newbill-input-group">
                <label className="newbill-label">Mobile Number</label>
                <input type="text" className="newbill-input" placeholder="e.g. 9876543210" />
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">UHID (Optional)</label>
                <input type="text" className="newbill-input" placeholder="Enter UHID" />
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">First Name</label>
                <input type="text" className="newbill-input" placeholder="First Name" />
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">Last Name</label>
                <input type="text" className="newbill-input" placeholder="Last Name" />
              </div>
            </div>

            <div className="newbill-grid-3">
              <div className="newbill-input-group">
                <label className="newbill-label">Age</label>
                <input type="text" className="newbill-input" placeholder="Age" />
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">Gender</label>
                <select className="newbill-input">
                  <option>Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="newbill-input-group">
                <label className="newbill-label">Referring Doctor</label>
                <select className="newbill-input">
                  <option>Self</option>
                  <option>Dr. Smith</option>
                </select>
              </div>
            </div>
            <div className="newbill-input-group" style={{marginTop:'0.5rem'}}>
              <label className="newbill-label">Collection Agent</label>
              <select className="newbill-input">
                <option>None (Walk-in)</option>
                <option>Agent A</option>
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
                  Test pricing and ratelists dynamically calculate totals based on the selected center and referral logic.
                </div>
              </div>
            </div>

            <div className="newbill-input-group" style={{position:'relative'}}>
              <MagnifyingGlassIcon style={{position:'absolute', width:'20px', color:'#9ca3af', left:'10px', top:'50%', transform:'translateY(-50%)'}} />
              <input type="text" className="newbill-input" style={{paddingLeft:'2.5rem'}} placeholder="Search tests or packages..." />
            </div>

            <div style={{display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap'}}>
              {['All', 'Haematology', 'Biochemistry', 'Radiology', 'Serology'].map(cat => (
                <button 
                  key={cat} 
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
                    <button className="newbill-add-btn" onClick={() => addToCart(test)}>+ Add</button>
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
                Payment reconciliation rules apply here. Saved bills are automatically synced with the daily business ledger and cash flow reporting.
              </div>
            </div>
          </div>

          <div style={{minHeight:'150px', marginBottom:'1rem'}}>
            {cart.length === 0 ? (
              <div style={{color:'#9ca3af', fontSize:'0.9rem', textAlign:'center', marginTop:'3rem'}}>
                No tests added yet.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="newbill-cart-item">
                  <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                    <button className="newbill-cart-remove" onClick={() => removeFromCart(item.id)}>
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
                <input type="number" className="newbill-input" value={netPayable} readOnly />
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
            <button className="newbill-primary-btn">Save & Print Bill</button>
            <button className="newbill-secondary-btn">Save Only</button>
            <button className="newbill-clear-btn" onClick={clearForm}>Clear entire form</button>
          </div>

        </div>
      </div>
    </div>
  );
}
