const fs = require('fs');
const path = require('path');
const imgs = [
  ['061b99bfd1edbb1ae174bd7c0f5952d0c41cd2d3', 'modal-congrats'],
  ['26a2a6e7f808ab04c4a68b4c250e741056d436aa', 'modal-register-btn'],
  ['e15cecd9984831e51c4d8ef2b2f4f62e7588dc4a', 'modal-register-btn2'],
  ['bc627f98d216127c737e6bf7a7e9771fc796efe0', 'modal-full-bg'],
  ['292da34b1c5c3eb3d4abf469af7f4ab388213690', 'modal-full-bg2'],
  ['93fb4a320bdb4081725ec8e074b7a7bd3b185bb5', 'modal-claim-text'],
  ['25ab7b759c2d1354a853b411bb1be26371fd21e0', 'modal-claim-text2'],
  ['3900156a28c26e220a7e1c971a0d36efa5f55a68', 'modal-credits-bonus'],
  ['77b1900a2df2633c2566fc27ffcd60581ae5d56c', 'modal-credits-bonus2'],
  ['3cec25ea8d222e6ca2e1f6b0858b640c5253cb20', 'modal-nakareserve'],
  ['5d93e14a8531cf7728d969748492c7d3b2f3a55f', 'modal-nakareserve2'],
  ['8d015ab1abdccb011d0e105271a8895cb2baeaef', 'modal-maybe-next'],
  ['bec8990634b3f1f6ffc52f9240bbdce36509a964', 'modal-divider'],
  ['5af831b997c8561cfec25a1946f47d4fbffbdb28', 'modal-frame1'],
  ['aacd813205712ce91930d971f3d5d14b6ca65053', 'modal-frame2'],
  ['7eff4b065f96c6b098276e827232f271a8d3a25a', 'modal-box-a'],
  ['7e286973d4230a15987a9cfd473464082fc6cdb0', 'modal-box-b'],
  ['acc8a67fca95296bb3198bd9797b3c371862710c', 'modal-box-c'],
  ['1f45b3dbabc6fc22442b0be89c982cd609f026b8', 'modal-box-d'],
  ['90b4246dbe46045a553c15059e542e26e8961a66', 'modal-tall-a'],
  ['df6899da667e721ca141f989b3dd611dd0097d8b', 'modal-tall-b'],
  ['7252e0dd9fdcf4f2a31372cc98925ef1b3ead832', 'modal-tall-c'],
  ['358fcde2155ed40dfa8927d9954bf69179ecbf47', 'modal-small-a'],
  ['503aa9f67739771f5656b956d14793f140a734c5', 'modal-mobile-bg'],
];
let copied = 0;
for (const [ref, name] of imgs) {
  const src = path.join('assets/figma-new', ref + '.png');
  const dst = path.join('assets', name + '.png');
  if (fs.existsSync(src) && !fs.existsSync(dst)) {
    fs.copyFileSync(src, dst);
    copied++;
    process.stdout.write('Copied: ' + name + '.png\n');
  }
}
process.stdout.write('Total copied: ' + copied + '\n');
