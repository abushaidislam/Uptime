import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const sourceDir = path.join(packageRoot, 'src/email');
const targetDir = path.join(packageRoot, 'dist/email');

if (!fs.existsSync(sourceDir)) {
  process.exit(0);
}

fs.rmSync(targetDir, { force: true, recursive: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });
