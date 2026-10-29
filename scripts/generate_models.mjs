class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    });
  }
}
globalThis.FileReader = FileReaderPolyfill;

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

const outputDir = '/home/m/nexus-tasks/herbal-harbour-upgrade/agy/public/assets/models';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function exportToGlb(scene, filename) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (glbArrayBuffer) => {
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, Buffer.from(glbArrayBuffer));
        console.log(`Saved ${filename} (${glbArrayBuffer.byteLength} bytes)`);
        resolve(filePath);
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

// 1. Create Cream Bottle / Topical Jar
async function generateCreamBottle() {
  const scene = new THREE.Scene();
  scene.name = 'CreamBottleScene';

  const jarGroup = new THREE.Group();
  jarGroup.name = 'CosmeticCreamJar';

  // Jar Body (Frosted emerald cylinder)
  const jarBodyGeo = new THREE.CylinderGeometry(0.7, 0.65, 0.8, 36, 16);
  const jarBodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#104f38'),
    roughness: 0.18,
    metalness: 0.12,
    transparent: true,
    opacity: 0.94
  });
  const jarBody = new THREE.Mesh(jarBodyGeo, jarBodyMat);
  jarBody.position.y = 0.4;
  jarGroup.add(jarBody);

  // Jar Base ring
  const baseGeo = new THREE.CylinderGeometry(0.65, 0.62, 0.1, 36);
  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#082b1e'),
    roughness: 0.25,
    metalness: 0.2
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.05;
  jarGroup.add(baseMesh);

  // Cosmetic Label band around body
  const labelGeo = new THREE.CylinderGeometry(0.705, 0.68, 0.5, 36, 1, true);
  const labelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fdfaf2'),
    roughness: 0.45,
    metalness: 0.05
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.y = 0.42;
  jarGroup.add(labelMesh);

  // Label Gold Foil Trim Rings
  const trimGeo = new THREE.TorusGeometry(0.706, 0.012, 12, 48);
  const goldMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e5a83b'),
    metalness: 0.85,
    roughness: 0.2
  });
  const topTrim = new THREE.Mesh(trimGeo, goldMat);
  topTrim.rotation.x = Math.PI / 2;
  topTrim.position.y = 0.67;
  jarGroup.add(topTrim);

  const bottomTrim = new THREE.Mesh(trimGeo, goldMat);
  bottomTrim.rotation.x = Math.PI / 2;
  bottomTrim.position.y = 0.17;
  jarGroup.add(bottomTrim);

  // Jar Neck
  const neckGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 32);
  const neckMesh = new THREE.Mesh(neckGeo, jarBodyMat);
  neckMesh.position.y = 0.85;
  jarGroup.add(neckMesh);

  // Jar Lid / Cap (Brushed Gold / Rose Metallic)
  const lidGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.28, 36);
  const lidMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f59e0b'),
    metalness: 0.88,
    roughness: 0.24
  });
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidMesh.position.y = 1.02;
  jarGroup.add(lidMesh);

  const lidTopGeo = new THREE.CylinderGeometry(0.68, 0.72, 0.04, 36);
  const lidTopMesh = new THREE.Mesh(lidTopGeo, lidMat);
  lidTopMesh.position.y = 1.18;
  jarGroup.add(lidTopMesh);

  scene.add(jarGroup);
  await exportToGlb(scene, 'cream_bottle.glb');
}

// 2. Create Psilocybin Mushroom Cluster
async function generatePsilocybinMushroom() {
  const scene = new THREE.Scene();
  scene.name = 'PsilocybinMushroomScene';

  const group = new THREE.Group();
  group.name = 'PsilocybinCluster';

  // Mushroom 1 (Main Big Specimen)
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04, 0.4, 0.02),
    new THREE.Vector3(-0.02, 0.9, -0.01),
    new THREE.Vector3(0.01, 1.4, 0.02)
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 32, 0.09, 16, false);
  const stemMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f0ece1'),
    roughness: 0.6,
    metalness: 0.05
  });
  const stemMesh = new THREE.Mesh(stemGeo, stemMat);
  group.add(stemMesh);

  // Blue Bruising (Psilocin Oxidation ring on stem)
  const bruiseGeo = new THREE.TorusGeometry(0.095, 0.03, 16, 24);
  const bruiseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1d4ed8'),
    roughness: 0.7,
    metalness: 0.1
  });
  const bruiseMesh = new THREE.Mesh(bruiseGeo, bruiseMat);
  bruiseMesh.position.set(0.03, 0.65, 0.02);
  bruiseMesh.rotation.x = Math.PI / 2.3;
  group.add(bruiseMesh);

  // Main Cap (Golden Teacher - conical caramel cap)
  const capGeo = new THREE.SphereGeometry(0.48, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const capMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d97706'),
    roughness: 0.35,
    metalness: 0.1
  });
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.position.set(0.01, 1.42, 0.02);
  group.add(capMesh);

  // Cap Umbo (Nipple peak)
  const umboGeo = new THREE.ConeGeometry(0.14, 0.12, 24);
  const umboMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#92400e'),
    roughness: 0.4
  });
  const umboMesh = new THREE.Mesh(umboGeo, umboMat);
  umboMesh.position.set(0.01, 1.78, 0.02);
  group.add(umboMesh);

  // Gills underneath cap
  const gillsGeo = new THREE.CylinderGeometry(0.44, 0.12, 0.06, 32);
  const gillsMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#451a03'),
    roughness: 0.8
  });
  const gillsMesh = new THREE.Mesh(gillsGeo, gillsMat);
  gillsMesh.position.set(0.01, 1.39, 0.02);
  group.add(gillsMesh);

  // Veil Ring (Annulus on stem)
  const veilGeo = new THREE.CylinderGeometry(0.14, 0.09, 0.08, 18, 1, true);
  const veilMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'),
    roughness: 0.5
  });
  const veilMesh = new THREE.Mesh(veilGeo, veilMat);
  veilMesh.position.set(0.0, 1.15, 0.01);
  group.add(veilMesh);

  // Mushroom 2 (Smaller secondary pin)
  const pinStemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.22, 0, 0.1),
    new THREE.Vector3(0.3, 0.35, 0.15),
    new THREE.Vector3(0.35, 0.75, 0.18)
  ]);
  const pinStemGeo = new THREE.TubeGeometry(pinStemCurve, 24, 0.06, 12, false);
  const pinStemMesh = new THREE.Mesh(pinStemGeo, stemMat);
  group.add(pinStemMesh);

  const pinCapGeo = new THREE.SphereGeometry(0.26, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const pinCapMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#b45309'),
    roughness: 0.38
  });
  const pinCapMesh = new THREE.Mesh(pinCapGeo, pinCapMat);
  pinCapMesh.position.set(0.35, 0.76, 0.18);
  group.add(pinCapMesh);

  // Mycelium Base
  const baseGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.12, 24);
  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#292524'),
    roughness: 0.95
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -0.04;
  group.add(baseMesh);

  scene.add(group);
  await exportToGlb(scene, 'psilocybin_mushroom.glb');
}

async function main() {
  await generateCreamBottle();
  await generatePsilocybinMushroom();
  console.log('All models generated successfully!');
}

main().catch(console.error);
