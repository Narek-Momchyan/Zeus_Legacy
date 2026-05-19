import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const symbolsDir = path.join(__dirname, '../src/assets/symbols');

const files = fs.readdirSync(symbolsDir).filter((f) => f.endsWith('.png'));

for (const file of files) {
  const input = path.join(symbolsDir, file);
  const before = fs.statSync(input).size;
  const tmp = `${input}.opt`;

  await sharp(input)
    .resize(192, 192, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 85 })
    .toFile(tmp);

  fs.renameSync(tmp, input);
  const after = fs.statSync(input).size;
  console.log(`${file}: ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB`);
}
