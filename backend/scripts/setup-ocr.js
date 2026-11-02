import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const language = process.env.OCR_LANGUAGE || 'eng';
const directory = path.resolve(process.env.OCR_DATA_PATH || './data/ocr');
if (!/^[a-z]{3}(\+[a-z]{3})*$/.test(language)) throw new Error('OCR_LANGUAGE must use three-letter Tesseract language codes.');
await mkdir(directory, { recursive: true, mode: 0o700 });
for (const code of language.split('+')) {
  const response = await fetch(`https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/${code}.traineddata`, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Could not download OCR language ${code}.`);
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(directory, `${code}.traineddata`), data, { mode: 0o600 });
  console.log(`Installed OCR language ${code} (${data.length} bytes).`);
}
