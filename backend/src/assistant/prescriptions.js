import { randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fault } from './config.js';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const defaultOcrDataPath = fileURLToPath(new URL('../../data/ocr', import.meta.url));

export function validateUpload({ filename, mimeType, base64 } = {}) {
  if (typeof filename !== 'string' || !filename.trim() || filename.length > 180 || typeof base64 !== 'string' || !base64.length) throw fault(400, 'Choose a PDF, PNG or JPEG file of at most 5 MB.', 'INVALID_UPLOAD');
  if (base64.length > Math.ceil(MAX_UPLOAD_BYTES / 3) * 4) throw fault(413, 'Prescriptions must be at most 5 MB.', 'UPLOAD_TOO_LARGE');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 !== 0) throw fault(400, 'The uploaded file encoding is invalid. Choose the file again.', 'INVALID_UPLOAD_ENCODING');
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_UPLOAD_BYTES) throw fault(413, 'Prescriptions must be at most 5 MB.', 'UPLOAD_TOO_LARGE');
  if (buffer.length < 12) throw fault(415, 'The uploaded file is empty or incomplete. Choose a valid PDF, PNG or JPEG.', 'INVALID_FILE_CONTENT');
  const png = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const pdf = buffer.subarray(0, 5).toString() === '%PDF-';
  const actual = png ? 'image/png' : jpeg ? 'image/jpeg' : pdf ? 'application/pdf' : null;
  const ext = path.extname(filename).toLowerCase();
  if (!actual || actual !== mimeType || !(actual === 'image/png' ? ['.png'] : actual === 'image/jpeg' ? ['.jpg','.jpeg'] : ['.pdf']).includes(ext)) throw fault(415, 'The file content, extension and declared type must match PDF, PNG or JPEG.', 'UNSUPPORTED_FILE_TYPE');
  if (png) {
    if (buffer.length < 24 || !buffer.readUInt32BE(16) || !buffer.readUInt32BE(20)) throw fault(415, 'The PNG is incomplete or has invalid image dimensions.', 'INVALID_FILE_CONTENT');
    if (buffer.readUInt32BE(16) * buffer.readUInt32BE(20) > 12_000_000) throw fault(413, 'Image dimensions exceed the 12 megapixel limit.', 'IMAGE_TOO_LARGE');
  }
  if (jpeg) {
    let offset = 2;
    let dimensionsFound = false;
    while (offset + 8 < buffer.length) {
      if (buffer[offset] !== 255) break;
      const marker = buffer[offset + 1];
      if (marker === 218 || marker === 217) break;
      const size = buffer.readUInt16BE(offset + 2);
      if (size < 2 || offset + 2 + size > buffer.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
        if (buffer.readUInt16BE(offset + 5) * buffer.readUInt16BE(offset + 7) > 12_000_000) throw fault(413, 'Image dimensions exceed the 12 megapixel limit.', 'IMAGE_TOO_LARGE');
        dimensionsFound = true; break;
      }
      offset += size + 2;
    }
    if (!dimensionsFound) throw fault(415, 'The JPEG has no supported image dimensions.', 'INVALID_FILE_CONTENT');
  }
  return { buffer, extension: actual === 'application/pdf' ? '.pdf' : actual === 'image/png' ? '.png' : '.jpg', mimeType: actual };
}

const normalize = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { let previous = row[0]; row[0] = i; for (let j = 1; j <= b.length; j++) { const old = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = old; } }
  return row[b.length];
}
export function matchPrescription(text, catalogue, ocrConfidence = 100) {
  const normalized = ` ${normalize(text)} `;
  const words = normalize(text).split(' ').filter(Boolean).slice(0, 1000);
  const candidates = [];
  for (const test of catalogue) {
    let score = 0, matchedAlias = '';
    for (const alias of [test.name, test.code, ...(test.aliases || [])].filter(Boolean)) {
      const target = normalize(alias);
      if (target && normalized.includes(` ${target} `)) { score = 1; matchedAlias = alias; break; }
      if (target.length >= 6 && !target.includes(' ')) {
        for (const word of words) { const similarity = 1 - distance(word, target) / Math.max(word.length, target.length); if (similarity > score && similarity >= .8) { score = similarity; matchedAlias = word; } }
      }
      if (target.includes(' ') && target.length >= 8) {
        const count = target.split(' ').length;
        for (let i = 0; i <= words.length - count; i++) { const phrase = words.slice(i, i + count).join(' '); const similarity = 1 - distance(phrase, target) / Math.max(phrase.length, target.length); if (similarity > score && similarity >= .85) { score = similarity; matchedAlias = phrase; } }
      }
    }
    if (score >= .8) candidates.push({ testId: test.id, name: test.name, matchedAlias, confidence: Math.round(score * Math.min(100, ocrConfidence)) / 100, uncertain: score < 1 || ocrConfidence < 80 || matchedAlias.length <= 4 });
  }
  // The same abbreviation can match multiple catalogue items; show all possible matches.
  for (const c of candidates) if (candidates.some(other => other !== c && normalize(other.matchedAlias) === normalize(c.matchedAlias))) c.uncertain = true;
  return candidates;
}

export function extractWithWorker(buffer, mimeType, config) {
  return new Promise((resolve, reject) => {
    // PDF/canvas native modules can crash during worker_threads teardown on Windows.
    // A bounded child process contains native failures and receives no server secrets.
    const env = Object.fromEntries(['SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'PATH', 'PATHEXT', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA']
      .filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
    const worker = fork(fileURLToPath(new URL('./ocr-worker.js', import.meta.url)), [], {
      execArgv: ['--max-old-space-size=256'], serialization: 'advanced', windowsHide: true,
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'], env,
    });
    let settled = false;
    let message;
    const finish = (error, result, stopWorker = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (stopWorker && !worker.killed) worker.kill();
      error ? reject(error) : resolve(result);
    };
    const timer = setTimeout(() => finish(fault(504, 'Prescription processing timed out. Try a smaller, clearer file, select tests manually or contact staff.', 'OCR_TIMEOUT'), undefined, true), 45000);
    worker.once('message', result => { message = result; });
    worker.once('error', () => finish(fault(503, 'The prescription reader could not start. Ask support to check the server OCR/PDF dependencies, or select tests manually.', 'OCR_ENGINE_UNAVAILABLE'), undefined, true));
    worker.once('exit', code => {
      if (code !== 0 || !message) return finish(fault(503, 'The prescription reader stopped before completing. Retry or select tests manually and contact support.', 'OCR_ENGINE_UNAVAILABLE'));
      if (message.success) return finish(null, message);
      const status = [413, 422, 503].includes(message.status) ? message.status : 422;
      finish(fault(status, message.error || 'The prescription could not be read. Upload a clearer file or select tests manually.', message.code || 'PRESCRIPTION_UNREADABLE'));
    });
    worker.send({ buffer, mimeType, language: config.ocrLanguage || 'eng', langPath: config.ocrDataPath || defaultOcrDataPath }, error => {
      if (error) finish(fault(503, 'The prescription reader could not receive the file. Retry or select tests manually.', 'OCR_ENGINE_UNAVAILABLE'), undefined, true);
    });
  });
}

export function createPrescriptionService({ store, workflow, config, extract = extractWithWorker }) {
  let active = 0;
  return {
    async upload(actor, body) {
      if (actor.role !== 'citizen') throw fault(403, 'Upload prescriptions from a patient account.');
      if (active >= 2) throw fault(429, 'Prescription processing is busy. Please retry shortly.');
      const { buffer, extension, mimeType } = validateUpload(body);
      const id = randomUUID();
      const filePath = path.join(config.uploadDir, id + extension);
      active++;
      try {
        await mkdir(config.uploadDir, { recursive: true, mode: 0o700 });
        await writeFile(filePath, buffer, { mode: 0o600, flag: 'wx' });
        const extracted = await extract(buffer, mimeType, config);
        const candidates = matchPrescription(extracted.text, await workflow.prescriptionCatalogue(), extracted.confidence);
        const result = { id, candidates, needsReview: true, lowConfidence: extracted.confidence < 80 || !candidates.length, source: extracted.source, warning: 'Possible matches only. Check every test against the prescription. Handwriting and abbreviations require review; you must explicitly confirm selected tests before booking.' };
        await store.transaction(state => {
          state.prescriptions[id] = { ...result, patientId: actor.id, storageName: id + extension, sha256: createHash('sha256').update(buffer).digest('hex'), createdAt: new Date().toISOString() };
          state.auditEvents[id] = { id, actorId: actor.id, action: 'prescription.uploaded', resourceId: id, createdAt: new Date().toISOString() };
        });
        return result;
      } catch (error) { await unlink(filePath).catch(() => {}); throw error; }
      finally { active--; }
    }
  };
}
