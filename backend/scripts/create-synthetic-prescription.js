import PDFDocument from 'pdfkit';
import { mkdir, writeFile } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import path from 'node:path';

const directory = path.resolve('test/fixtures');
await mkdir(directory, { recursive: true });
const document = new PDFDocument({ size: 'A4', margin: 60 });
const chunks = [];
const ready = new Promise(resolve => { document.on('data', data => chunks.push(data)); document.on('end', () => resolve(Buffer.concat(chunks))); });
document.fontSize(25).text('SYNTHETIC PRESCRIPTION');
document.moveDown().fontSize(15).text('Software demonstration only. No real patient data.');
document.moveDown().text('Patient: Synthetic LabSetu patient');
document.moveDown().text('Requested laboratory tests:');
document.moveDown().fontSize(22).text('CBC');
document.moveDown().text('Thyroid Profile');
document.moveDown().text('Blood Glucose');
document.moveDown().fontSize(12).text('Please review all extracted candidates before booking.');
document.end();
const pdf = await ready;
await writeFile(path.join(directory, 'synthetic-prescription.pdf'), pdf);
const parser = new PDFParse({ data: pdf });
try {
  const screenshots = await parser.getScreenshot({ desiredWidth: 1600, imageDataUrl: false });
  await writeFile(path.join(directory, 'synthetic-prescription.png'), screenshots.pages[0].data);
  // A raster-only PDF exercises scanned-prescription OCR.
  const scanned = new PDFDocument({ size: 'A4', margin: 0 });
  const scanChunks = [];
  const scanReady = new Promise(resolve => { scanned.on('data', c => scanChunks.push(c)); scanned.on('end', () => resolve(Buffer.concat(scanChunks))); });
  scanned.image(screenshots.pages[0].data, 0, 0, { width: 595.28, height: 841.89 });
  scanned.end();
  await writeFile(path.join(directory, 'synthetic-prescription-scan.pdf'), await scanReady);
} finally { await parser.destroy(); }
console.log('Created clearly labelled synthetic PDF, image and scanned-PDF fixtures.');
