/**
 * VerifyMe Theme Rollback Utility
 * Restores all original theme files from client/src/theme_backup/original_theme/
 * Can be run via: node client/src/theme_backup/rollback.js
 * Or triggered in chat by typing: UNDO THEME
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.resolve(__dirname, 'original_theme');
const srcDir = path.resolve(__dirname, '..');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
    console.log(`[RESTORED] ${path.relative(srcDir, dest)}`);
  }
}

console.log('🔄 Restoring original VerifyMe theme from backup...');
if (!fs.existsSync(backupDir)) {
  console.error('❌ Backup directory not found:', backupDir);
  process.exit(1);
}

copyRecursiveSync(backupDir, srcDir);
console.log('✅ Original VerifyMe theme successfully restored!');
