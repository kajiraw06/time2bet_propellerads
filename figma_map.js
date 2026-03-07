// Script to map all Figma imageRefs to layer names and download them
const fs = require('fs');
const https = require('https');
const path = require('path');

const data = JSON.parse(fs.readFileSync('figma_file_d7.json', 'utf8'));
const allImages = JSON.parse(fs.readFileSync('figma_all_images.json', 'utf8')).meta.images;

function bfs(root, matchFn) {
  const results = [];
  const q = Array.isArray(root) ? [...root] : [root];
  while (q.length) {
    const n = q.shift();
    if (!n || typeof n !== 'object') continue;
    if (Array.isArray(n)) { q.push(...n); continue; }
    if (matchFn(n)) results.push(n);
    if (n.children) q.push(...n.children);
  }
  return results;
}

// Get all nodes with image fills
const imgNodes = bfs(data.document, n =>
  n.fills && n.fills.some(f => f.type === 'IMAGE' && f.imageRef)
);

const map = imgNodes.map(n => ({
  id: n.id,
  name: n.name,
  imageRef: n.fills.find(f => f.type === 'IMAGE').imageRef,
  w: n.absoluteBoundingBox && Math.round(n.absoluteBoundingBox.width),
  h: n.absoluteBoundingBox && Math.round(n.absoluteBoundingBox.height),
}));

console.log('All image-fill nodes:');
map.forEach(m => console.log(m.id.padEnd(8), m.imageRef, m.name));

// Find imageRefs in figma_all_images.json not in any known node
const knownRefs = new Set(map.map(m => m.imageRef));
const unknownRefs = Object.entries(allImages).filter(([k]) => !knownRefs.has(k));
console.log('\nImageRefs in figma_all_images but NOT in figma_file_d7:');
unknownRefs.forEach(([k]) => console.log(k));
