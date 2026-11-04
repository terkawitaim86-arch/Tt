const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const targets = ['index.js', 'src'];

function collect(entry, out) {
  const full = path.join(root, entry);
  if (fs.statSync(full).isDirectory()) {
    for (const name of fs.readdirSync(full)) collect(path.join(entry, name), out);
  } else if (full.endsWith('.js')) {
    out.push(full);
  }
  return out;
}

const files = targets.flatMap((t) => collect(t, []));
const failures = [];

for (const file of files) {
  try {
    new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  } catch (err) {
    failures.push(`${path.relative(root, file)}: ${err.message}`);
  }
}

if (failures.length) {
  console.error('Build check failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`Build check passed: ${files.length} files parsed.`);
