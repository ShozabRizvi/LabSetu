import PDFDocument from 'pdfkit';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export async function reportPdf(report) {
  const doc = new PDFDocument({ size: 'A4', margin: 46, bufferPages: true, info: { Title: 'LabSetu approved laboratory report', Author: report.laboratoryName || 'LabSetu Diagnostics' } });
  const chunks = [];
  const completed = new Promise((resolve, reject) => { doc.on('data', c => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  const font = process.env.REPORT_FONT_PATH || 'C:/Windows/Fonts/Nirmala.ttf';
  try { await access(font); doc.font(font); } catch { doc.font('Helvetica'); }
  const title = () => {
    doc.rect(0, 0, 596, 12).fill('#087c82');
    doc.fillColor('#102f3e').fontSize(25).text('LabSetu', 46, 38);
    doc.fontSize(11).fillColor('#4a6571').text('Approved laboratory report', 46, 72);
    doc.moveTo(46, 100).lineTo(549, 100).strokeColor('#cddfe4').stroke();
    doc.y = 117;
  };
  title();
  if (report.synthetic) doc.fontSize(10).fillColor('#9a4500').text('SYNTHETIC DEMONSTRATION - not a clinical patient record').moveDown(.5);
  doc.fillColor('#243b46').fontSize(10);
  for (const [label, value] of [['Laboratory', report.laboratoryName], ['Patient', report.patientName], ['Patient ID', report.patientId], ['Booking ID', report.bookingId], ['Report ID', report.id], ['Collection booking', report.bookingDate], ['Approved by', report.approvedBy], ['Approval time', report.approvedAt]]) {
    doc.text(`${label}: ${value || 'Not recorded'}`, { width: 503 }).moveDown(.28);
  }
  doc.moveDown(.8).fontSize(14).fillColor('#087c82').text('Verified result data').moveDown(.5);
  for (const row of report.results || []) {
    if (doc.y > 655) { doc.addPage(); title(); }
    const y = doc.y;
    const test = report.tests?.find(test => test.id === row.testId);
    doc.fontSize(11).fillColor('#183c4c').text(`${test?.name || row.testId} - ${row.name}`, 46, y, { width: 503 });
    doc.moveDown(.2).fontSize(11).fillColor('#142f3a').text(`Result: ${row.value} ${row.unit || ''}`, { width: 503 });
    doc.moveDown(.15).fontSize(9).fillColor('#506a76').text(`Laboratory reference interval: ${row.referenceRange || 'Not configured'}`, { width: 503 });
    doc.moveDown(.7);
    doc.moveTo(46, doc.y).lineTo(549, doc.y).strokeColor('#e2ebef').stroke();
    doc.moveDown(.7);
  }
  if (doc.y > 690) { doc.addPage(); title(); }
  doc.moveDown(.5).fontSize(9).fillColor('#506a76').text('Results were entered and approved by authorised laboratory staff. Reference intervals depend on the laboratory method and patient context. Please consult your healthcare professional for clinical interpretation.', 46, doc.y, { width: 503 });
  const range = doc.bufferedPageRange();
  for (let page = 0; page < range.count; page++) {
    doc.switchToPage(page);
    doc.fontSize(8).fillColor('#627983').text(`Private healthcare record | LabSetu | Page ${page + 1} of ${range.count}`, 46, 785, { width: 503, lineBreak: false });
  }
  doc.end();
  return completed;
}

export function createReportService({ store, workflow, config }) {
  const directory = path.join(path.dirname(config.uploadDir), 'reports');
  return {
    async getPdf(actor, bookingId) {
      // Approval, ownership and configured payment policy are checked on every retrieval, even for a cached file.
      const report = await workflow.report(actor, bookingId);
      const filePath = path.join(directory, `${report.id}.pdf`);
      try {
        const existing = await readFile(filePath);
        if (report.pdfSha256 && createHash('sha256').update(existing).digest('hex') === report.pdfSha256) return existing;
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
      const buffer = await reportPdf(report);
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(filePath, buffer, { mode: 0o600 });
      await store.transaction(state => {
        state.reports[bookingId].pdfSha256 = createHash('sha256').update(buffer).digest('hex');
        state.reports[bookingId].pdfGeneratedAt = new Date().toISOString();
      });
      return buffer;
    }
  };
}
