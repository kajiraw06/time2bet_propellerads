// Downloads all unaccounted Figma images and identifies them by size
const fs = require('fs');
const https = require('https');
const path = require('path');

const allImages = JSON.parse(fs.readFileSync('figma_all_images.json', 'utf8')).meta.images;

// ImageRefs already accounted for (in figma_file_d7.json nodes)
const knownRefs = new Set([
  'f4f45de8a6436e359f53f1c591fb5bce89834fee', // Layer 0 bg
  '1ebeb6f408a31488f50008ef0fdca657594feae2', // Hue/Saturation 2
  '3a601848a1a76c6fe86ef3485869b5714e1007c0', // Hue/Saturation 3
  '11972e6524d8e80fa133ed3d24397a99af1b4f34', // Board (wheel)
  '44f52394e4e073576a8ea15b1902a7cb0a16cee3', // Arrow
  'b42b76f85647c4e1ef60cb4bb30983810f884d6d', // hub button
  '792c9e72ea06be118bd0c7d7edff6d2ad34213b9', // spin-btn
  '921353052deaa6e1cf5f2eb04d455b1fec69f385', // Headline
  'e1788a35651044f102f63558a801fb25072d0735', // Logo (p1)
  'e10c94284fea082ce82bf851e303287997f2995e', // LB row
  'aa544b50cf08e8dc60e688941a477761deeb73ac', // LB amount
  '4941ffb0250d73a33043f72669c7e223fcf82242', // Libre/CTA
  '8d5436f5fbe7577917f02d3b527d166a95167a68', // Exit Button
  '1fa4e82cc3e45d46eb061c5316a5e7acf06e39a7', // Nav Bar
  '7c47286da000542ded72e14278f6d906f6b2acb9', // reward-text
  '851eb5e88f0ab63cf57ef5ba0ffbfc0d6d38a47b', // Rect3 bg (SKIP)
  'cb86d8a8791354915f8b29db3632aa84356f3c32', // Spin Button (modal bg art)
  '9767ec09a1a5d066d9c4adf9cb15be5480b09478', // Logo copy (modal)
  // Desktop layers
  '2077412491035ba46932c0ecfc3006c14aa71e5c', // 66:18 Background
  '6957a9420c0d0f0606334aad985ee9abdb03edf0', // 66:24 Headline
  'aae01f48465b9fac4bd720f0abe6657505642bfc', // 66:25 Logo
  '17aa4476b8189cbe998b8a1411965fa0b6f10513', // 66:26 Winners
  '6dd7752e18ac464a3458288779614ad3f9745e0c', // 66:27 Libre
  '84e54388bd0fd4167f2cc2c9eb03c3c7ae8aaed4', // 66:28 Sub Copy
  '37977564670acb474ed9c2a1542c90fe8efcfeed', // 66:29 Spin Button desktop
  'babc7a6fa16b986d7ef4cb6ce5dad20948e7e896', // 66:20 Body
  '04adce5217b2f6c8ae7167a829f6d0d87e72b2f4', // 66:21 Board desktop
  'cfb3ae5bc1be08851284bfac92b8c628b7aee3f8', // 66:22 Arrow desktop
  '3e2e95ecd5f55bb22c52458ffd26e269d3a85045', // 66:23 button desktop
]);

const unknown = Object.entries(allImages).filter(([k]) => !knownRefs.has(k));
console.log(`Downloading ${unknown.length} unknown images...`);

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Get image dimensions from PNG header
function getPngDimensions(filepath) {
  try {
    const buf = fs.readFileSync(filepath);
    if (buf[0] !== 0x89 || buf[1] !== 0x50) return null;
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return { w, h };
  } catch { return null; }
}

async function run() {
  const dir = 'assets/figma-new';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const [ref, url] of unknown) {
    const dest = path.join(dir, ref + '.png');
    if (fs.existsSync(dest)) {
      console.log('SKIP (exists):', ref.slice(0, 8));
      continue;
    }
    try {
      await downloadFile(url, dest);
      const dim = getPngDimensions(dest);
      console.log(`OK  ${ref.slice(0, 8)}  ${dim ? dim.w + 'x' + dim.h : '?'}`);
    } catch (e) {
      console.error(`ERR ${ref.slice(0, 8)}:`, e.message);
    }
  }
  console.log('\nDone. Now checking sizes to identify layers...');
  // Print all downloaded with sizes
  const results = [];
  for (const [ref] of unknown) {
    const dest = path.join(dir, ref + '.png');
    const dim = getPngDimensions(dest);
    results.push({ ref, w: dim && dim.w, h: dim && dim.h });
  }
  results.sort((a, b) => (b.w || 0) - (a.w || 0));
  results.forEach(r => console.log(r.ref.slice(0,8), `${r.w}x${r.h}`));
}
run();
