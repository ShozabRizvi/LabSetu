import React, { useEffect, useState } from 'react';
import { assistantService } from '../../services/assistantService';
import { money } from '../../utils/assistantUtils';
import { catalogueParameters, priceInPaise } from '../../utils/catalogueUtils';

const blankTest = { name: '', code: '', aliases: '', price: '', parameters: '', description: '', active: true };
const blankSlot = { date: '', startTime: '', endTime: '', offset: '+05:30', capacity: '', active: true };

export default function StaffCatalogue() {
  const [catalogue, setCatalogue] = useState({ tests: [], slots: [] });
  const [test, setTest] = useState(blankTest);
  const [slot, setSlot] = useState(blankSlot);
  const [testId, setTestId] = useState(null);
  const [slotId, setSlotId] = useState(null);
  const [reviewed, setReviewed] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    assistantService.staffCatalogue().then(data => { if (active) setCatalogue(data); })
      .catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, []);

  function updateTest(key, value) { setTest(previous => ({ ...previous, [key]: value })); setReviewed(''); }
  function updateSlot(key, value) { setSlot(previous => ({ ...previous, [key]: value })); setReviewed(''); }

  async function save(event, kind) {
    event.preventDefault();
    if (reviewed !== kind || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (kind === 'test') {
        await assistantService.publishTest(testId, { confirmed: true, name: test.name, code: test.code,
          aliases: test.aliases.split(',').map(value => value.trim()).filter(Boolean), pricePaise: priceInPaise(test.price), currency: 'INR',
          parameters: catalogueParameters(test.parameters), description: test.description, active: test.active });
        setTest(blankTest); setTestId(null);
      } else {
        await assistantService.publishSlot(slotId, { confirmed: true, date: slot.date, startTime: slot.startTime, endTime: slot.endTime,
          startsAt: `${slot.date}T${slot.startTime}:00${slot.offset}`, capacity: Number(slot.capacity), active: slot.active });
        setSlot(blankSlot); setSlotId(null);
      }
      setReviewed('');
      setCatalogue(await assistantService.staffCatalogue());
      setNotice('The backend saved the laboratory publication. Patients can retrieve the published catalogue and slots.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  function editTest(item) {
    setTestId(item.id); setReviewed(''); setNotice('');
    setTest({ name: item.name, code: item.code, aliases: (item.aliases || []).join(', '), price: (item.pricePaise / 100).toFixed(2),
      parameters: (item.parameters || []).map(row => `${row.name} | ${row.unit || ''} | ${row.referenceRange || ''}`).join('\n'), description: item.description || '', active: item.active !== false });
  }
  function editSlot(item) {
    setSlotId(item.id); setReviewed(''); setNotice('');
    setSlot({ date: item.date, startTime: item.startTime, endTime: item.endTime || '', offset: item.startsAt?.match(/[+-]\d{2}:\d{2}$/)?.[0] || '+05:30', capacity: String(item.capacity), active: item.active !== false });
  }

  return <details className="assistant-card">
    <summary>Publish laboratory tests, approved prices and appointment slots</summary>
    <p>Only authorized staff for this laboratory can publish. Enter genuine approved laboratory information. No catalogue records or availability are generated automatically.</p>
    {error && <p className="assistant-error" role="alert">{error}</p>}
    {notice && <p className="assistant-notice" role="status">{notice}</p>}
    <div className="assistant-columns">
      <form onSubmit={event => save(event, 'test')}>
        <h2>{testId ? 'Update laboratory test' : 'Publish laboratory test'}</h2>
        <label className="assistant-field">Test name<input required maxLength={160} value={test.name} onChange={event => updateTest('name', event.target.value)} /></label>
        <label className="assistant-field">Laboratory code<input required maxLength={50} value={test.code} onChange={event => updateTest('code', event.target.value)} /></label>
        <label className="assistant-field">Verified aliases (comma separated)<input value={test.aliases} onChange={event => updateTest('aliases', event.target.value)} /></label>
        <label className="assistant-field">Approved price (INR)<input required inputMode="decimal" value={test.price} onChange={event => updateTest('price', event.target.value)} /></label>
        <label className="assistant-field">Verified description or preparation instructions<textarea maxLength={2000} value={test.description} onChange={event => updateTest('description', event.target.value)} /></label>
        <label className="assistant-field">Report parameters: name | unit | laboratory reference interval<textarea rows={4} value={test.parameters} onChange={event => updateTest('parameters', event.target.value)} /></label>
        <p>Leave unconfigured intervals blank. Clinical report approval requires configured parameters.</p>
        <label><input type="checkbox" checked={test.active} onChange={event => updateTest('active', event.target.checked)} /> Available to patients</label>
        <p><label><input type="checkbox" checked={reviewed === 'test'} onChange={event => setReviewed(event.target.checked ? 'test' : '')} /> I reviewed and approve these laboratory test details and this price.</label></p>
        <button disabled={busy || reviewed !== 'test'}>Confirm and save test</button>
        {testId && <button type="button" className="secondary" onClick={() => { setTestId(null); setTest(blankTest); setReviewed(''); }}>New test</button>}
      </form>
      <form onSubmit={event => save(event, 'slot')}>
        <h2>{slotId ? 'Update published slot capacity' : 'Publish appointment slot'}</h2>
        <label className="assistant-field">Laboratory date<input type="date" required disabled={Boolean(slotId)} value={slot.date} onChange={event => updateSlot('date', event.target.value)} /></label>
        <label className="assistant-field">Start time<input type="time" required disabled={Boolean(slotId)} value={slot.startTime} onChange={event => updateSlot('startTime', event.target.value)} /></label>
        <label className="assistant-field">End time<input type="time" required disabled={Boolean(slotId)} value={slot.endTime} onChange={event => updateSlot('endTime', event.target.value)} /></label>
        <label className="assistant-field">UTC offset (India: +05:30)<input required pattern="[+-][0-9]{2}:[0-9]{2}" disabled={Boolean(slotId)} value={slot.offset} onChange={event => updateSlot('offset', event.target.value)} /></label>
        <label className="assistant-field">Approved capacity<input type="number" required min="1" max="1000" step="1" value={slot.capacity} onChange={event => updateSlot('capacity', event.target.value)} /></label>
        <label><input type="checkbox" checked={slot.active} onChange={event => updateSlot('active', event.target.checked)} /> Accept bookings</label>
        <p><label><input type="checkbox" checked={reviewed === 'slot'} onChange={event => setReviewed(event.target.checked ? 'slot' : '')} /> I verified laboratory availability and capacity for this slot.</label></p>
        <button disabled={busy || reviewed !== 'slot'}>Confirm and save slot</button>
        {slotId && <button type="button" className="secondary" onClick={() => { setSlotId(null); setSlot(blankSlot); setReviewed(''); }}>New slot</button>}
      </form>
    </div>
    <h3>Published tests for your laboratory</h3>
    {!catalogue.tests.length && <p>No laboratory tests returned. Publish a genuine approved test above.</p>}
    <ul>{catalogue.tests.map(item => <li key={item.id}>{item.name} ({item.code}) - {money(item.pricePaise, item.currency)} - {item.active === false ? 'Inactive' : 'Active'} <button type="button" className="secondary" disabled={busy} onClick={() => editTest(item)}>Edit test</button></li>)}</ul>
    <h3>Published slots for your laboratory</h3>
    {!catalogue.slots.length && <p>No laboratory slots returned. Publish verified availability above.</p>}
    <ul>{catalogue.slots.map(item => <li key={item.id}>{item.date} {item.startTime} - {item.endTime || 'End time unconfigured'} - capacity {item.capacity} - {item.active === false ? 'Inactive' : 'Active'} <button type="button" className="secondary" disabled={busy || !item.endTime} onClick={() => editSlot(item)}>Edit capacity</button></li>)}</ul>
  </details>;
}
