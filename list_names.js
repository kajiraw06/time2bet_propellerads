const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma_file_d7.json', 'utf8'));

function names(node, depth) {
  if (!node) return;
  const indent = '  '.repeat(depth);
  process.stdout.write(indent + node.name + '\n');
  if (node.children && depth < 6) {
    node.children.forEach(c => names(c, depth + 1));
  }
}
names(data.document, 0);
