import React, { useState } from 'react';
import { demoCitizenBills } from '../../data/mockLabData';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CurrencyRupeeIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

export default function CitizenBills() {
  const { currentUser } = useAuth();
  const [bills, setBills] = useState(demoCitizenBills);
  const [payingBill, setPayingBill] = useState(null);
  const [paymentMode, setPaymentMode] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const totalPaid = bills.reduce((acc, b) => acc + b.paid, 0);
  const totalDue = bills.reduce((acc, b) => acc + b.due, 0);

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setBills(bills.map(b => b.id === payingBill.id ? {
          ...b,
          paid: b.total,
          due: 0,
          status: 'Paid',
          method: paymentMode === 'upi' ? 'UPI (Verified Online)' : 'Card (Online Gateway)',
          transactionId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`
        } : b));
        setPaymentSuccess(false);
        setPayingBill(null);
      }, 1000);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>Billing & Invoices</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
          View itemized medical receipts, settle pending dues, and download tax invoices.
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircleIcon style={{ width: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a' }}>₹{totalPaid}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Settled</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: totalDue > 0 ? '#fee2e2' : '#f1f5f9',
            color: totalDue > 0 ? '#dc2626' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CreditCardIcon style={{ width: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: totalDue > 0 ? '#dc2626' : '#0f172a' }}>
              ₹{totalDue}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Outstanding Balance</div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>INVOICE ID</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>DATE</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>TESTS INCLUDED</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>TOTAL AMOUNT</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>PAID / DUE</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.9rem 1rem', fontFamily: 'monospace', fontWeight: '600', color: '#0f172a' }}>
                    {b.id}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#475569' }}>
                    {b.date}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    {b.tests.join(', ')}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#0f172a' }}>
                    ₹{b.total}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{ color: '#15803d', fontWeight: '600' }}>₹{b.paid}</span>
                    {b.due > 0 && <span style={{ color: '#dc2626', marginLeft: '0.4rem', fontWeight: '600' }}>(Due: ₹{b.due})</span>}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: b.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                      color: b.status === 'Paid' ? '#15803d' : '#dc2626'
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {b.due > 0 ? (
                        <button
                          type="button"
                          onClick={() => setPayingBill(b)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#15803d',
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '0.775rem',
                            cursor: 'pointer'
                          }}
                        >
                          Pay ₹{b.due}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(b)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontWeight: '600',
                            fontSize: '0.775rem',
                            cursor: 'pointer'
                          }}
                        >
                          <ArrowDownTrayIcon style={{ width: '14px' }} /> Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {payingBill && (
        <div className="citizen-modal-backdrop" onClick={() => setPayingBill(null)}>
          <div className="citizen-modal-card" onClick={e => e.stopPropagation()}>
            <div className="citizen-modal-header">
              <h3>Settle Invoice {payingBill.id}</h3>
              <button 
                type="button" 
                className="citizen-modal-close" 
                onClick={() => setPayingBill(null)}
              >
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <form onSubmit={handlePaySubmit} className="citizen-modal-body">
              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Invoice Amount Due:</span>
                  <strong style={{ fontSize: '1.1rem', color: '#15803d' }}>₹{payingBill.due}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Diagnostics: {payingBill.tests.join(', ')}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>
                  Choose Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: paymentMode === 'upi' ? '#15803d' : '#cbd5e1',
                      backgroundColor: paymentMode === 'upi' ? '#f0fdf4' : '#ffffff',
                      color: paymentMode === 'upi' ? '#15803d' : '#334155',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <QrCodeIcon style={{ width: '18px' }} /> UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('card')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: paymentMode === 'card' ? '#15803d' : '#cbd5e1',
                      backgroundColor: paymentMode === 'card' ? '#f0fdf4' : '#ffffff',
                      color: paymentMode === 'card' ? '#15803d' : '#334155',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <CreditCardIcon style={{ width: '18px' }} /> Card / NetBanking
                  </button>
                </div>
              </div>

              {paymentMode === 'upi' ? (
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                    Scan QR or Pay to UPI ID: <strong>labsetu@hdfcbank</strong>
                  </div>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                  }}>
                    <QrCodeIcon style={{ width: '80px', height: '80px', color: '#0f172a' }} />
                  </div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                    Demo Simulation: Click button below to complete payment
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <input
                    type="text"
                    placeholder="Card Number (Demo: 4242 •••• •••• 4242)"
                    defaultValue="4242 4242 4242 4242"
                    style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input type="text" placeholder="MM/YY" defaultValue="12/28" style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <input type="text" placeholder="CVV" defaultValue="123" style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              )}

              {paymentSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: '600', fontSize: '0.875rem' }}>
                  <CheckCircleIcon style={{ width: '20px' }} /> Payment received successfully! Updating invoice...
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || paymentSuccess}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {isProcessing ? 'Processing Payment...' : `Complete Payment of ₹${payingBill.due}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {selectedReceipt && (
        <div className="citizen-modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div className="citizen-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="citizen-modal-header">
              <h3>Payment Receipt</h3>
              <button type="button" className="citizen-modal-close" onClick={() => setSelectedReceipt(null)}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <div className="citizen-modal-body" style={{ fontSize: '0.875rem' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#15803d' }}>LabSetu Diagnostics</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Authorized Laboratory Payment Slip</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.75rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Receipt #:</span>
                  <strong>{selectedReceipt.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span>{selectedReceipt.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Patient:</span>
                  <strong>{currentUser?.name || 'Shozab Rizvi'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <span>{selectedReceipt.method || 'Online'}</span>
                </div>
                {selectedReceipt.transactionId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Txn Reference:</span>
                    <code style={{ fontSize: '0.75rem' }}>{selectedReceipt.transactionId}</code>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>Total Paid:</span>
                  <strong style={{ color: '#15803d', fontSize: '1.1rem' }}>₹{selectedReceipt.paid}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #15803d',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
