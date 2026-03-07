const fs = require('fs');
const txt = fs.readFileSync('page3_fresh.json', 'utf8');
const d = JSON.parse(txt);

function walk(n, depth) {
  if (!n) return;
  const bb = n.absoluteBoundingBox || {};
  const indent = '  '.repeat(depth);
  const line = indent + '[' + n.id + '] ' + n.name + ' type=' + n.type + ' x=' + bb.x + ' y=' + bb.y + ' w=' + bb.width + ' h=' + bb.height;
  fs.appendFileSync('p3_out.txt', line + '\n');
  if (n.children && depth < 10) n.children.forEach(c => walk(c, depth + 1));
}
fs.writeFileSync('p3_out.txt', '');
walk(d, 0);
console.log('done');
