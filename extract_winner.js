const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma_file_d7.json','utf8'));

function walk(node, target) {
  if (!node) return null;
  if (node.name === target) return node;
  if (node.children) {
    for (const c of node.children) {
      const r = walk(c, target);
      if (r) return r;
    }
  }
  return null;
}

const popup = walk(data.document, 'Winner Pop-up');
if (!popup) { console.log('NOT FOUND'); process.exit(1); }

// frame origin = the artboard frame. Let's find Artboard 2@2x 1
const artboard = walk(data.document, 'Artboard 2@2x 1');
const origin = artboard ? artboard.absoluteBoundingBox : {x: -807, y: -1863};
console.log('Artboard origin:', JSON.stringify(origin));
console.log('Winner Pop-up bb:', JSON.stringify(popup.absoluteBoundingBox));
console.log('\n=== CHILDREN ===');

function printTree(node, depth) {
  const indent = '  '.repeat(depth);
  const bb = node.absoluteBoundingBox || {};
  const fills = node.fills || [];
  const imgRef = fills.find(f => f.imageRef) ? fills.find(f => f.imageRef).imageRef.slice(0,8) : '';
  // relative to artboard
  const rx = bb.x !== undefined ? (bb.x - origin.x).toFixed(1) : '?';
  const ry = bb.y !== undefined ? (bb.y - origin.y).toFixed(1) : '?';
  const rw = bb.width !== undefined ? bb.width.toFixed(1) : '?';
  const rh = bb.height !== undefined ? bb.height.toFixed(1) : '?';
  // % of 1500x3248
  const lp = bb.x !== undefined ? ((bb.x - origin.x)/1500*100).toFixed(2)+'%' : '';
  const tp = bb.y !== undefined ? ((bb.y - origin.y)/3248*100).toFixed(2)+'%' : '';
  const wp = bb.width !== undefined ? (bb.width/1500*100).toFixed(2)+'%' : '';
  const hp = bb.height !== undefined ? (bb.height/3248*100).toFixed(2)+'%' : '';
  console.log(`${indent}[${node.id}] "${node.name}" ${node.type}  rel:(${rx},${ry}) ${rw}x${rh}  css: left=${lp} top=${tp} w=${wp} h=${hp} ${imgRef ? 'IMG:'+imgRef : ''}`);
  if (node.children && depth < 5) {
    node.children.forEach(c => printTree(c, depth+1));
  }
}

printTree(popup, 0);
