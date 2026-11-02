import { parentPort, workerData } from 'node:worker_threads';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { access } from 'node:fs/promises';
import path from 'node:path';

let recognizer;
async function recognize(data) {
  if (!recognizer) {
    const langPath = workerData.langPath;
    const languages = workerData.language.split('+');
    for (const language of languages) {
      if (!/^[a-z]{3}$/.test(language)) throw new Error('Unsupported OCR language configuration.');
      await access(path.join(langPath, `${language}.traineddata`));
    }
    recognizer = await createWorker(workerData.language, 1, { langPath, gzip: false, cacheMethod: 'none', logger: () => {} });
  }
  const { data: result } = await recognizer.recognize(data);
  return { text: result.text, confidence: result.confidence };
}

try {
  const data = new Uint8Array(workerData.buffer);
  let result;
  if (workerData.mimeType === 'application/pdf') {
    const parser = new PDFParse({ data, maxImageSize: 12000000, isEvalSupported: false, verbosity: 0 });
    try {
      const info = await parser.getInfo();
      if (info.total > 3) throw new Error('Prescription PDFs are limited to three pages.');
      const text = await parser.getText({ first: 3 });
      if (text.text.replace(/\s/g, '').length >= 15) result = { text: text.text, confidence: 100, source: 'pdf-text' };
      else {
        const pages = await parser.getScreenshot({ first: 3, desiredWidth: 1600, imageDataUrl: false });
        const extracted = [];
        for (const page of pages.pages) extracted.push(await recognize(page.data));
        result = { text: extracted.map(p => p.text).join('\n'), confidence: Math.min(...extracted.map(p => p.confidence)), source: 'tesseract-pdf' };
      }
    } finally { await parser.destroy(); }
  } else result = { ...await recognize(Buffer.from(data)), source: 'tesseract-image' };
  parentPort.postMessage({ success: true, ...result, text: result.text.slice(0, 20000) });
} catch {
  parentPort.postMessage({ success: false, error: 'The prescription could not be read. Check the PDF/image and OCR language setup, or select tests manually and ask staff for help.' });
} finally { if (recognizer) await recognizer.terminate(); }
