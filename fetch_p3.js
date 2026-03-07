// fetch_p3.js  – fetches Page 3 node tree + renders + downloads new PNGs
// Usage: node fetch_p3.js
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const TOKEN   = process.env.FIGMA_TOKEN;
const FILE    = 'lcgkU1D79mamvKawqWS8uX';
const P3_NODE = '73:16'; // Artboard 2@2x 1

if (!TOKEN) { console.error('Set FIGMA_TOKEN env var'); process.exit(1); }

function get(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'X-Figma-Token': TOKEN } }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res({ status: r.statusCode, body: d, headers: r.headers }));
    }).on('error', rej);
  });
}

async function fetchWithRetry(url, label) {
  while (true) {
    const r = await get(url);
    if (r.status === 429) {
      const wait = parseInt(r.headers['retry-after'] || '30000', 10);
      const secs = Math.ceil(wait / 1000);
      console.log(`[429] ${label} – waiting ${secs}s…`);
      await new Promise(ok => setTimeout(ok, wait + 1000));
    } else {
      return r;
    }
  }
}

function dlFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const doGet = (u) => {
      https.get(u, r => {
        if (r.statusCode === 301 || r.statusCode === 302) {
          file.close(); fs.unlinkSync(dest);
          return doGet(r.headers.location);
        }
        r.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', e => { fs.unlink(dest, () => {}); reject(e); });
    };
    doGet(url);
  });
}

function getPngDim(fpath) {
  try {
    const b = fs.readFileSync(fpath);
    if (b[0] !== 0x89) return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } catch { return null; }
}

function allNodes(node, out = []) {
  out.push(node);
  if (node.children) node.children.forEach(c => allNodes(c, out));
  return out;
}

async function run() {
  // 1. Fetch node tree
  console.log('Fetching node tree for', P3_NODE, '…');
  const nr = await fetchWithRetry(
    `https://api.figma.com/v1/files/${FILE}/nodes?ids=${encodeURIComponent(P3_NODE)}&depth=6`,
    'nodes'
  );
  fs.writeFileSync('page3_fresh.json', nr.body);
  const nd = JSON.parse(nr.body);
  const artboard = nd.nodes && nd.nodes[P3_NODE] && nd.nodes[P3_NODE].document;
  if (!artboard) { console.error('Could not parse artboard'); return; }

  console.log('Artboard:', artboard.name, artboard.absoluteBoundingBox);
  const nodes = allNodes(artboard);

  // 2. Collect all imageRefs
  const refToNode = {};
  for (const n of nodes) {
    for (const f of (n.fills || [])) {
      if (f.type === 'IMAGE' && f.imageRef) refToNode[f.imageRef] = n;
    }
  }
  const refs = Object.keys(refToNode);
  console.log('Image refs found:', refs.length, refs.map(r => r.slice(0,8)));

  // 3. Fetch image fill URLs
  let imageUrls = {};
  if (refs.length) {
    console.log('Fetching image fill URLs…');
    const ir = await fetchWithRetry(
      `https://api.figma.com/v1/files/${FILE}/images`,
      'images'
    );
    const idata = JSON.parse(ir.body);
    imageUrls = (idata.meta && idata.meta.images) || {};
  }

  // 4. Fetch render URLs (2x scale PNG) for each meaningful node
  // Request renders for each direct child of the artboard group
  const group = artboard.children && artboard.children[0]; // Artboard 2 group
  const renderNodes = (group && group.children) ? group.children : artboard.children || [];
  const renderIds = renderNodes.map(n => n.id);

  console.log('Fetching renders for', renderIds.length, 'nodes…');
  const rr = await fetchWithRetry(
    `https://api.figma.com/v1/images/${FILE}?ids=${renderIds.map(encodeURIComponent).join(',')}&scale=2&format=png`,
    'renders'
  );
  fs.writeFileSync('page3_renders_fresh.json', rr.body);
  const rdata = JSON.parse(rr.body);
  const renderUrls = rdata.images || {};
  console.log('Render URLs:', Object.keys(renderUrls).length);

  // 5. Also render the full artboard at 1x
  console.log('Fetching full artboard render…');
  const ar = await fetchWithRetry(
    `https://api.figma.com/v1/images/${FILE}?ids=${encodeURIComponent(P3_NODE)}&scale=1&format=png`,
    'artboard-render'
  );
  fs.writeFileSync('page3_artboard_render.json', ar.body);
  const adata = JSON.parse(ar.body);
  const artboardUrl = adata.images && adata.images[P3_NODE];
  console.log('Artboard URL:', artboardUrl ? artboardUrl.slice(0, 60) : 'none');

  // 6. Download all render PNGs
  const outDir = 'assets/figma-new';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const downloads = [];
  for (const [id, url] of Object.entries(renderUrls)) {
    if (!url) continue;
    const safe = id.replace(':', '-');
    const dest = path.join(outDir, 'p3_' + safe + '.png');
    downloads.push({ id, url, dest, node: renderNodes.find(n => n.id === id) });
  }
  if (artboardUrl) {
    downloads.push({ id: P3_NODE, url: artboardUrl, dest: path.join(outDir, 'p3_artboard.png'), node: artboard });
  }

  for (const dl of downloads) {
    if (fs.existsSync(dl.dest)) {
      const d = getPngDim(dl.dest);
      console.log('EXISTS', path.basename(dl.dest), d ? d.w+'x'+d.h : '');
      continue;
    }
    try {
      await dlFile(dl.url, dl.dest);
      const d = getPngDim(dl.dest);
      const name = dl.node ? dl.node.name : dl.id;
      console.log('OK   ', path.basename(dl.dest), d ? d.w+'x'+d.h : '', '|', name);
    } catch(e) {
      console.error('ERR  ', dl.id, e.message);
    }
  }

  // 7. Summary: print layer layout as CSS %
  console.log('\n=== LAYER LAYOUT (relative to artboard) ===');
  const ab = artboard.absoluteBoundingBox;
  for (const n of renderNodes) {
    const bb = n.absoluteBoundingBox || {};
    const l = ((bb.x - ab.x) / ab.width  * 100).toFixed(2);
    const t = ((bb.y - ab.y) / ab.height * 100).toFixed(2);
    const w = (bb.width  / ab.width  * 100).toFixed(2);
    const h = (bb.height / ab.height * 100).toFixed(2);
    const safe = n.id.replace(':', '-');
    console.log(`/* [${n.id}] ${n.name} */\nleft:${l}%; top:${t}%; width:${w}%; height:${h}%;\n`);
  }

  console.log('\nDone.');
}

run().catch(e => { console.error(e); process.exit(1); });
