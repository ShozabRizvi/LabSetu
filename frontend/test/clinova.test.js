import test from 'node:test';
import assert from 'node:assert/strict';
import { requestClinova } from '../src/services/clinovaService.js';
import { paymentLink } from '../src/utils/assistantUtils.js';

test('Clinova sends conversational history to its informational endpoint without patient credentials', async () => {
  const body = { message: 'What does that term mean?', language: 'hi', history: [{ role: 'user', content: 'What is CBC?' }] };
  const data = await requestClinova('http://localhost:5000/api', body, async (url, options) => {
    assert.equal(url, 'http://localhost:5000/api/clinova/chat');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(options.body), body);
    return Response.json({ success: true, data: { reply: 'Provider reply', mode: 'gemini' } });
  });
  assert.equal(data.reply, 'Provider reply');
});

test('missing Gemini configuration and unavailable backend produce honest errors without medical fallback', async () => {
  await assert.rejects(requestClinova('/api', {}, async () => Response.json({ success: false, error: 'GEMINI_API_KEY is not configured.' }, { status: 503 })), /GEMINI_API_KEY/);
  await assert.rejects(requestClinova('/api', {}, async () => { throw new TypeError('Failed to fetch'); }), /cannot reach the backend/);
  await assert.rejects(requestClinova('/api', {}, async () => Response.json({ success: true, data: {} })), /unavailable/);
});

test('payment navigation accepts only the exact HTTPS provider host', () => {
  assert.equal(paymentLink('https://rzp.io/i/verified'), 'https://rzp.io/i/verified');
  for (const url of ['javascript:alert(1)', 'http://rzp.io/i/payment', 'https://rzp.io.attacker.test/pay', 'https://attacker.test/rzp.io/pay', 'https://rzp.io@attacker.test/pay', 'https://user:pass@rzp.io/pay', 'https://rzp.io:444/pay', 'https://rzp.io/', null]) {
    assert.equal(paymentLink(url), null);
  }
});
