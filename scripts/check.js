#!/usr/bin/env node
/**
 * Lightweight static check used by `npm run check`.
 * Parses every JavaScript file in the project with `node --check` so syntax
 * errors are caught before deploying. No dependencies, no side effects.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'supabase']);
const CHECK_DIRS = ['src', 'scripts', 'test'];

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collect(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

const files = CHECK_DIRS.flatMap((dir) => {
  const full = path.join(ROOT, dir);
  return fs.existsSync(full) ? collect(full) : [];
});
const rootIndex = path.join(ROOT, 'index.js');
if (fs.existsSync(rootIndex)) files.push(rootIndex);

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    failed++;
    const details = (error.stderr || error.stdout || '').toString().trim();
    console.error(`✗ ${path.relative(ROOT, file)}\n${details}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed the syntax check.`);
  process.exit(1);
}

console.log(`✓ Syntax check passed for ${files.length} JavaScript file(s).`);
