const fs = require('fs');
const path = require('path');

const srcDir = 'G:/Mi unidad/Proyecto personal/VYFITH';
const destDir = 'C:/Users/Luis/AndroidStudioProjects/VYFITH';

const files = [
  'lib/unipaseoTypes.ts',
  'lib/walkSimulatorStore.ts',
  'lib/santiagoKnowledgeBase.ts',
  'components/WalkRouteMap.tsx',
  'components/unipaseo/DogManagerModal.tsx',
  'components/unipaseo/MovisinuTransitViewer.tsx',
  'components/unipaseo/ConfigPanel.tsx',
  'components/unipaseo/MapContainer.tsx',
  'components/UpbWalkSimulatorSection.tsx',
];

for (const rel of files) {
  const src = path.join(srcDir, rel);
  const dest = path.join(destDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${rel} -> ${dest}`);
}
console.log('All files synced to local build directory.');
