import { readFileSync, writeFileSync } from 'fs';

const file = 'server/index.mjs';
let content = readFileSync(file, 'utf8');

// Replace all unicode smart/curly quotes with ASCII straight quotes
content = content.replace(/\u2018/g, "'");  // Left single curly quote
content = content.replace(/\u2019/g, "'");  // Right single curly quote
content = content.replace(/\u201C/g, '"');  // Left double curly quote
content = content.replace(/\u201D/g, '"');  // Right double curly quote

writeFileSync(file, content, 'utf8');
console.log('Smart quotes fixed successfully');
