import assert from 'node:assert/strict';
import test from 'node:test';
import { access, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import express from 'express';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import { PDFParse } from 'pdf-parse';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { extractWithWorker, validateUpload, matchPrescription } from '../src/assistant/prescriptions.js';
import { createAssistantRouter } from '../src/assistant/router.js';
import { assistantConfig } from '../src/assistant/config.js';
import { createMemoryStore, createSyntheticState, SYNTHETIC_PATIENT_ID } from '../src/assistant/store.js';

const backendDir = fileURLToPath(new URL('..', import.meta.url));
const ocrDir = fileURLToPath(new URL('../data/ocr', import.meta.url));
const fixture = name => readFile(new URL(`./fixtures/${name}`, import.meta.url));
const envelope = (buffer, filename = 'synthetic.pdf', mimeType = 'application/pdf') => ({ filename, mimeType, base64: buffer.toString('base64') });
async function hasOcr() { try { await access(path.join(ocrDir, 'eng.traineddata')); return true; } catch { return false; } }
async function renderedImages() {
  const parser = new PDFParse({ data: await fixture('synthetic-prescription.pdf') });
  try {
    const screenshot = await parser.getScreenshot({ desiredWidth: 1600, imageDataUrl: false });
    const png = Buffer.from(screenshot.pages[0].data);
    const image = await loadImage(png);
    const canvas = createCanvas(image.width, image.height);
    canvas.getContext('2d').drawImage(image, 0, 0);
    return { png, jpeg: canvas.toBuffer('image/jpeg') };
  } finally { await parser.destroy(); }
}

test('upload validation enforces decoded 5 MB and useful format/encoding errors', () => {
  const maximum = Buffer.alloc(5 * 1024 * 1024);
  maximum.write('%PDF-1.7 synthetic byte-limit fixture');
  assert.equal(validateUpload(envelope(maximum)).buffer.length, maximum.length);
  assert.throws(() => validateUpload(envelope(Buffer.concat([maximum, Buffer.from('x')]))), error => error.status === 413 && error.code === 'UPLOAD_TOO_LARGE');
  assert.throws(() => validateUpload(envelope(Buffer.from('short'))), error => error.status === 415 && error.code === 'INVALID_FILE_CONTENT');
  assert.throws(() => validateUpload({ filename: 'x.pdf', mimeType: 'application/pdf', base64: 'not valid base64' }), error => error.status === 400 && error.code === 'INVALID_UPLOAD_ENCODING');
  assert.throws(() => validateUpload(envelope(Buffer.from('%PDF-1.7 synthetic mismatch'), 'x.png', 'image/png')), error => error.status === 415 && error.code === 'UNSUPPORTED_FILE_TYPE');
});

test('actual text-PDF extraction works without installed OCR language data', async () => {
  const result = await extractWithWorker(await fixture('synthetic-prescription.pdf'), 'application/pdf', { ocrDataPath: path.join(tmpdir(), 'missing-labsetu-ocr-assets') });
  assert.equal(result.source, 'pdf-text');
  assert.match(result.text, /CBC/);
  assert.equal(result.confidence, 100);
  assert.deepEqual(matchPrescription(result.text, Object.values(createSyntheticState().tests)).map(candidate => candidate.testId).sort(), ['cbc', 'glucose', 'thyroid']);
});

test('actual scanned PDF, PNG and JPEG extraction identifies catalogue candidates', { timeout: 45000 }, async t => {
  if (!await hasOcr()) return t.skip('Local eng.traineddata is not installed; no network/model download occurs in tests.');
  const images = await renderedImages();
  for (const [buffer, mimeType, filename, source] of [
    [await fixture('synthetic-prescription-scan.pdf'), 'application/pdf', 'synthetic-scan.pdf', 'tesseract-pdf'],
    [images.png, 'image/png', 'synthetic.png', 'tesseract-image'],
    [images.jpeg, 'image/jpeg', 'synthetic.jpeg', 'tesseract-image'],
  ]) {
    validateUpload(envelope(buffer, filename, mimeType));
    const result = await extractWithWorker(buffer, mimeType, {});
    assert.equal(result.source, source);
    assert.match(result.text, /CBC/i);
    assert.ok(result.confidence > 0);
    assert.equal(matchPrescription(result.text, Object.values(createSyntheticState().tests)).some(candidate => candidate.testId === 'cbc'), true);
  }
});

test('default OCR path works when the backend is launched from the repository root', { timeout: 15000 }, async t => {
  if (!await hasOcr()) return t.skip('Local eng.traineddata is not installed.');
  const script = `import {readFile} from 'node:fs/promises'; import {extractWithWorker} from './backend/src/assistant/prescriptions.js'; const result=await extractWithWorker(await readFile('./backend/test/fixtures/synthetic-prescription-scan.pdf'),'application/pdf',{}); console.log(JSON.stringify({source:result.source,hasCBC:/CBC/i.test(result.text)}));`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.dirname(backendDir), encoding: 'utf8', timeout: 12000 });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout.trim()), { source: 'tesseract-pdf', hasCBC: true });
});

test('missing OCR data and invalid language configuration return explicit 503 errors', async () => {
  const scan = await fixture('synthetic-prescription-scan.pdf');
  await assert.rejects(extractWithWorker(scan, 'application/pdf', { ocrDataPath: path.join(tmpdir(), 'missing-labsetu-ocr-assets') }), error => error.status === 503 && error.code === 'OCR_DATA_MISSING' && /setup-ocr/.test(error.message) && !error.message.includes(tmpdir()));
  await assert.rejects(extractWithWorker(scan, 'application/pdf', { ocrLanguage: '../invalid' }), error => error.status === 503 && error.code === 'OCR_LANGUAGE_INVALID');
});

test('corrupt local OCR language data fails promptly as a sanitized server error', { timeout: 10000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'labsetu-corrupt-ocr-'));
  try {
    await writeFile(path.join(directory, 'eng.traineddata'), 'synthetic-invalid-language-file');
    await assert.rejects(extractWithWorker(await fixture('synthetic-prescription-scan.pdf'), 'application/pdf', { ocrDataPath: directory }), error => error.status === 503 && error.code === 'OCR_ENGINE_UNAVAILABLE' && !error.message.includes(directory));
  } finally {
    const absolute = path.resolve(directory);
    assert.ok(absolute.startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(absolute, { recursive: true, force: true });
  }
});

test('corrupt PDF and excessive page count return distinct actionable file errors', async () => {
  await assert.rejects(extractWithWorker(Buffer.from('%PDF-1.7 incomplete synthetic document'), 'application/pdf', {}), error => error.status === 422 && error.code === 'PDF_UNREADABLE');
  const document = new PDFDocument();
  const chunks = [];
  const completed = new Promise(resolve => { document.on('data', chunk => chunks.push(chunk)); document.on('end', () => resolve(Buffer.concat(chunks))); });
  document.text('SYNTHETIC page 1');
  for (let index = 2; index <= 4; index++) document.addPage().text(`SYNTHETIC page ${index}`);
  document.end();
  await assert.rejects(extractWithWorker(await completed, 'application/pdf', {}), error => error.status === 413 && error.code === 'PDF_PAGE_LIMIT' && /three pages/.test(error.message));
});

test('actual blank-image OCR reports no readable text instead of successful extraction', { timeout: 15000 }, async t => {
  if (!await hasOcr()) return t.skip('Local eng.traineddata is not installed.');
  const canvas = createCanvas(500, 300);
  const context = canvas.getContext('2d');
  context.fillStyle = 'white'; context.fillRect(0, 0, 500, 300);
  await assert.rejects(extractWithWorker(canvas.toBuffer('image/png'), 'image/png', {}), error => error.status === 422 && error.code === 'PRESCRIPTION_NO_TEXT');
});

test('HTTP real extraction returns success and missing OCR returns 503 with no persisted upload', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'labsetu-extraction-http-'));
  const secret = 'synthetic-prescription-http-test-secret-32-characters';
  const config = { ...assistantConfig({}), demoMode: true, jwtSecret: secret, uploadDir: path.join(directory, 'uploads'), ocrDataPath: path.join(directory, 'missing-ocr') };
  const store = createMemoryStore(createSyntheticState());
  const app = express();
  app.use('/api/assistant', createAssistantRouter({ config, store }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const token = jwt.sign({}, secret, { algorithm: 'HS256', audience: 'labsetu-demo', issuer: 'labsetu-local', subject: SYNTHETIC_PATIENT_ID, expiresIn: '5m' });
  const request = async filename => fetch(`http://127.0.0.1:${server.address().port}/api/assistant/prescriptions`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(envelope(await fixture(filename), filename)) });
  try {
    const success = await request('synthetic-prescription.pdf');
    assert.equal(success.status, 200);
    const data = (await success.json()).data;
    assert.equal(data.source, 'pdf-text');
    assert.ok(data.candidates.some(candidate => candidate.testId === 'cbc'));
    const failed = await request('synthetic-prescription-scan.pdf');
    assert.equal(failed.status, 503);
    const failure = await failed.json();
    assert.equal(failure.code, 'OCR_DATA_MISSING');
    assert.match(failure.error, /select tests manually/);
    assert.equal(await store.read(state => Object.keys(state.prescriptions).length), 1);
    assert.equal((await readdir(config.uploadDir)).length, 1, 'failed extraction file must be removed');
  } finally {
    await new Promise(resolve => server.close(resolve));
    const absolute = path.resolve(directory);
    assert.ok(absolute.startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(absolute, { recursive: true, force: true });
  }
});
