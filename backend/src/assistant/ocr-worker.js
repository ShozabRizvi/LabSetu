import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { access } from 'node:fs/promises';
import path from 'node:path';

const problem = (status, code, message) => Object.assign(new Error(message), { status, code });
process.once('message', async workerData => {
let recognizer;
async function recognize(data) {
  if (!recognizer) {
    const langPath = workerData.langPath;
    const languages = workerData.language.split('+');
    for (const language of languages) {
      if (!/^[a-z]{3}$/.test(language)) throw problem(503, 'OCR_LANGUAGE_INVALID', 'OCR_LANGUAGE must contain three-letter language codes such as eng or eng+hin. Ask support to check the backend OCR configuration.');
      try { await access(path.join(langPath, `${language}.traineddata`)); }
      catch { throw problem(503, 'OCR_DATA_MISSING', 'OCR language files are not installed or readable. Ask support to run node scripts/setup-ocr.js from backend, or configure OCR_DATA_PATH. You can select tests manually.'); }
    }
    let initializationFailed;
    const failure = new Promise((_, reject) => { initializationFailed = () => reject(new Error('OCR initialization failed.')); });
    try { recognizer = await Promise.race([createWorker(workerData.language, 1, { langPath, gzip: false, cacheMethod: 'none', logger: () => {}, errorHandler: initializationFailed }), failure]); }
    catch { throw problem(503, 'OCR_ENGINE_UNAVAILABLE', 'The OCR engine could not initialize. Ask support to check the local language files and server dependencies, or select tests manually.'); }
  }
  let result;
  try { ({ data: result } = await recognizer.recognize(data)); }
  catch { throw problem(422, 'IMAGE_UNREADABLE', 'The image could not be decoded. Upload a clear, complete PNG or JPEG, or select tests manually.'); }
  return { text: result.text, confidence: result.confidence };
}

let response;
try {
  const data = new Uint8Array(workerData.buffer);
  let result;
  if (workerData.mimeType === 'application/pdf') {
    const parser = new PDFParse({ data, maxImageSize: 12000000, isEvalSupported: false, verbosity: 0 });
    try {
      const info = await parser.getInfo();
      if (info.total > 3) throw problem(413, 'PDF_PAGE_LIMIT', 'Prescription PDFs are limited to three pages. Upload only the prescription pages, or select tests manually.');
      const text = await parser.getText({ first: 3 });
      if (text.text.replace(/\s/g, '').length >= 15) result = { text: text.text, confidence: 100, source: 'pdf-text' };
      else {
        const pages = await parser.getScreenshot({ first: 3, desiredWidth: 1600, imageDataUrl: false });
        if (!pages.pages.length) throw problem(422, 'PDF_UNREADABLE', 'The PDF has no readable pages. Upload a valid, unlocked PDF or clear prescription image.');
        const extracted = [];
        for (const page of pages.pages) extracted.push(await recognize(page.data));
        result = { text: extracted.map(p => p.text).join('\n'), confidence: Math.min(...extracted.map(p => p.confidence)), source: 'tesseract-pdf' };
      }
    } catch (error) {
      if (error.status) throw error;
      throw problem(422, 'PDF_UNREADABLE', 'The PDF could not be read. Check that it is complete and unlocked, or upload a clear PNG/JPEG of the prescription.');
    } finally { await parser.destroy(); }
  } else result = { ...await recognize(Buffer.from(data)), source: 'tesseract-image' };
  if (!result.text?.trim()) throw problem(422, 'PRESCRIPTION_NO_TEXT', 'No readable prescription text was found. Upload a clear, upright image with the full prescription visible, or select tests manually and ask staff for help.');
  response = { success: true, ...result, text: result.text.slice(0, 20000) };
} catch (error) {
  response = { success: false, status: error.status || 422, code: error.code || 'PRESCRIPTION_UNREADABLE', error: error.status ? error.message : 'The prescription could not be read. Upload a valid PDF or clear image, or select tests manually and ask staff for help.' };
} finally { if (recognizer) await recognizer.terminate(); }
// Send only sanitized extraction output after native resources have been closed.
// Exit also closes an incomplete Tesseract initialization without leaving a process behind.
process.send(response, () => { process.disconnect(); process.exit(0); });
});
