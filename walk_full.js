const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma_file_full.json', 'utf8'));

const ORIGIN_X = -807;
const ORIGIN_Y = -1863;
const FW = 1500;
const FH = 3248;

function walk(node, depth) {
  if (!node) return;
  const bb = node.absoluteBoundingBox || {};
  const indent = '  '.repeat(depth);
  const fills = node.fills || [];
  const imgRef = fills.find(f => f.imageRef) ? fills.find(f => f.imageRef).imageRef.slice(0, 8) : '';
  const rx = bb.x !== undefined ? (bb.x - ORIGIN_X).toFixed(0) : '?';
  const ry = bb.y !== undefined ? (bb.y - ORIGIN_Y).toFixed(0) : '?';
  const rw = bb.width !== undefined ? bb.width.toFixed(0) : '?';
  const rh = bb.height !== undefined ? bb.height.toFixed(0) : '?';
  const lp = bb.x !== undefined ? ((bb.x - ORIGIN_X) / FW * 100).toFixed(2) + '%' : '';
  const tp = bb.y !== undefined ? ((bb.y - ORIGIN_Y) / FH * 100).toFixed(2) + '%' : '';
  const wp = bb.width !== undefined ? (bb.width / FW * 100).toFixed(2) + '%' : '';
  const line = `${indent}[${node.id}] "${node.name}" ${node.type}  rel:(${rx},${ry}) ${rw}x${rh}  left=${lp} top=${tp} w=${wp} ${imgRef}`;
  fs.appendFileSync('full_out.txt', line + '\n');
  if (node.children && depth < 10) node.children.forEach(c => walk(c, depth + 1));
}

fs.writeFileSync('full_out.txt', '');
walk(data.document, 0);
console.log('done');
