import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const indexFile = path.join(distDir, 'index.html');
const notFoundFile = path.join(distDir, '404.html');

try {
  if (fs.existsSync(indexFile)) {
    fs.copyFileSync(indexFile, notFoundFile);
    console.log('✅ Successfully created 404.html for Cloudflare Pages SPA routing.');
  } else {
    console.warn('⚠️  Warning: index.html not found in dist/. Skipping 404.html creation.');
  }
} catch (error) {
  console.error('❌ Error creating 404.html:', error);
  process.exit(1);
}
