#!/usr/bin/env node
// Run from the project root: node scripts/audit-base44-usage.mjs
import fs from 'node:fs';
import path from 'node:path';

const roots = ['src'];
const hits = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(ent.name)) {
      const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
      lines.forEach((line, i) => {
        if (/\bbase44\b|\bentities\.(filter|list|get|create|update|delete)\b/.test(line)) {
          hits.push(`${p}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}
for (const root of roots) if (fs.existsSync(root)) walk(root);
console.log(`Found ${hits.length} potential Base44 call lines`);
console.log(hits.join('\n'));
