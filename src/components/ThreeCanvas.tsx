import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Upload, RotateCcw, Play, Pause, Eye, Sparkles, Layers, Box, Info } from 'lucide-react';

export type ModelType = 'bud' | 'leaf' | 'plant' | 'bottle' | 'seed' | 'custom';

const isWebGLSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

interface ThreeCanvasProps {
  initialModel?: ModelType;
  className?: string;
  autoRotate?: boolean;
  allowUpload?: boolean;
  /** Hides the studio chrome and pauses rendering when the canvas is off-screen. */
  presentation?: boolean;
  /** Tried in order before the procedural model. Missing files are skipped. */
  modelUrls?: string[];
  onModelLoaded?: (name: string) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  initialModel = 'bud',
  className = 'w-full h-full min-h-[360px]',
  autoRotate = true,
  allowUpload = true,
  presentation = false,
  modelUrls = [],
  onModelLoaded
}) => {
  const modelUrlsRef = useRef(modelUrls);
  modelUrlsRef.current = modelUrls;
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [activeModel, setActiveModel] = useState<ModelType>(initialModel);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [isWireframe, setIsWireframe] = useState(false);
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'warm' | 'dispensary'>('studio');
  const [customModelName, setCustomModelName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentObjectGroupRef = useRef<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);

  // Helper to clear existing model
  const clearModel = () => {
    if (currentObjectGroupRef.current && sceneRef.current) {
      sceneRef.current.remove(currentObjectGroupRef.current);
      currentObjectGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      currentObjectGroupRef.current = null;
    }
  };

  // Build Organic 3D Cannabis Bud with trichomes and amber pistils
  const buildCuredBud = (): THREE.Group => {
    const group = new THREE.Group();

    // Core calyx clusters (composed of several bumpy deformed spheres)
    const calyxMat = new THREE.MeshStandardMaterial({
      color: 0x2e6642,
      roughness: 0.85,
      metalness: 0.05,
      bumpScale: 0.08,
    });

    const purpleMat = new THREE.MeshStandardMaterial({
      color: 0x54264e,
      roughness: 0.8,
      metalness: 0.1,
    });

    const lightGreenMat = new THREE.MeshStandardMaterial({
      color: 0x488a5d,
      roughness: 0.75,
    });

    // Create stacked irregular nodular calyx spheres
    const clusterPositions: [number, number, number, number, THREE.Material][] = [
      [0, 0, 0, 1.1, calyxMat],
      [0.35, 0.4, 0.25, 0.85, lightGreenMat],
      [-0.4, 0.35, -0.2, 0.82, calyxMat],
      [-0.2, 0.75, 0.2, 0.75, purpleMat],
      [0.25, 0.8, -0.25, 0.7, calyxMat],
      [0.05, 1.25, 0.05, 0.65, lightGreenMat],
      [-0.1, 1.65, -0.05, 0.5, purpleMat],
      [0.0, 1.95, 0.0, 0.35, calyxMat],
      // Lower outer nuggets
      [0.55, -0.3, 0.3, 0.75, calyxMat],
      [-0.55, -0.25, -0.3, 0.75, purpleMat],
      [0.2, -0.6, -0.4, 0.7, lightGreenMat],
      [-0.3, -0.65, 0.35, 0.68, calyxMat],
      [0.0, -0.9, 0.0, 0.55, calyxMat],
    ];

    clusterPositions.forEach(([x, y, z, r, mat]) => {
      const geo = new THREE.DodecahedronGeometry(r, 2);
      // Displace vertices for organic crystalline bud texture
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const noise = (Math.sin(vx * 7) + Math.cos(vy * 7) + Math.sin(vz * 7)) * 0.06;
        pos.setXYZ(i, vx + vx * noise, vy + vy * noise, vz + vz * noise);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    // Amber & Orange pistil hairs (curving orange filaments)
    const pistilMat = new THREE.MeshStandardMaterial({
      color: 0xeb7a1e,
      roughness: 0.4,
      emissive: 0x3d1702,
    });

    for (let i = 0; i < 45; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(
          (Math.random() - 0.5) * 1.0,
          (Math.random() - 0.4) * 2.2,
          (Math.random() - 0.5) * 1.0
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.4) * 2.2,
          (Math.random() - 0.5) * 1.5
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * 1.7,
          (Math.random() - 0.4) * 2.2,
          (Math.random() - 0.5) * 1.7
        ),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.022, 5, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, pistilMat);
      group.add(tubeMesh);
    }

    // Sparkling Trichome gland heads (crystalline resin beads)
    const trichomeGeo = new THREE.SphereGeometry(0.025, 5, 5);
    const trichomeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    const trichomeInstanced = new THREE.InstancedMesh(trichomeGeo, trichomeMat, 150);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 150; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      const radius = 1.1 + Math.random() * 0.45;
      const py = (Math.random() - 0.45) * 2.5;
      dummy.position.set(
        Math.sin(theta) * Math.cos(phi) * 0.85,
        py,
        Math.sin(theta) * Math.sin(phi) * 0.85
      );
      dummy.scale.setScalar(0.7 + Math.random() * 0.8);
      dummy.updateMatrix();
      trichomeInstanced.setMatrixAt(i, dummy.matrix);
    }
    trichomeInstanced.instanceMatrix.needsUpdate = true;
    group.add(trichomeInstanced);

    group.position.y = -0.3;
    return group;
  };

  // Build authentic 7-point serrated Cannabis Leaf in 3D
  const buildCannabisLeaf = (): THREE.Group => {
    const group = new THREE.Group();

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x228b4a,
      roughness: 0.5,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const veinMat = new THREE.MeshStandardMaterial({
      color: 0x48b874,
      roughness: 0.4,
    });

    // Helper for creating a single serrated leaflet with vein
    const createLeaflet = (length: number, maxWidth: number): THREE.Group => {
      const leafletGroup = new THREE.Group();
      const shape = new THREE.Shape();

      const serrations = 12;
      shape.moveTo(0, 0);

      // Left edge with saw-tooth serrations
      for (let i = 1; i <= serrations; i++) {
        const t = i / serrations;
        const y = t * length;
        const widthFactor = Math.sin(t * Math.PI);
        const w = widthFactor * (maxWidth / 2);
        const notch = (i % 2 === 0) ? w * 0.78 : w;
        shape.lineTo(-notch, y);
      }

      // Tip
      shape.lineTo(0, length * 1.03);

      // Right edge with saw-tooth serrations
      for (let i = serrations; i >= 1; i--) {
        const t = i / serrations;
        const y = t * length;
        const widthFactor = Math.sin(t * Math.PI);
        const w = widthFactor * (maxWidth / 2);
        const notch = (i % 2 === 0) ? w * 0.78 : w;
        shape.lineTo(notch, y);
      }

      shape.closePath();

      const extrudeSettings = {
        depth: 0.02,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.008,
        bevelThickness: 0.008,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Give gentle natural parabolic curvature
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const curveOffset = Math.sin((y / length) * Math.PI) * 0.12;
        pos.setZ(i, pos.getZ(i) - curveOffset);
      }
      geometry.computeVertexNormals();

      const mesh = new THREE.Mesh(geometry, leafMat);
      leafletGroup.add(mesh);

      // Center vein
      const veinGeo = new THREE.CylinderGeometry(0.018, 0.004, length, 6);
      veinGeo.translate(0, length / 2, 0.015);
      const veinMesh = new THREE.Mesh(veinGeo, veinMat);
      leafletGroup.add(veinMesh);

      return leafletGroup;
    };

    // 7 leaflets at proper fan angles
    const leafletConfigs = [
      { angle: 0, length: 2.2, width: 0.44 },       // Center main
      { angle: 0.35, length: 1.85, width: 0.38 },   // Right 1
      { angle: -0.35, length: 1.85, width: 0.38 },  // Left 1
      { angle: 0.72, length: 1.45, width: 0.32 },   // Right 2
      { angle: -0.72, length: 1.45, width: 0.32 },  // Left 2
      { angle: 1.15, length: 0.95, width: 0.24 },   // Right bottom
      { angle: -1.15, length: 0.95, width: 0.24 },  // Left bottom
    ];

    leafletConfigs.forEach(({ angle, length, width }) => {
      const leaflet = createLeaflet(length, width);
      leaflet.rotation.z = angle;
      group.add(leaflet);
    });

    // Petiole (stem)
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.4, 0.05),
      new THREE.Vector3(0, -0.9, 0.15),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.035, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, veinMat);
    group.add(stemMesh);

    group.position.y = -0.5;
    return group;
  };

  // Build Amber Dropper Tincture Bottle in 3D
  const buildTinctureBottle = (): THREE.Group => {
    const group = new THREE.Group();

    // Amber Glass Material
    const amberGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x9e4c12,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.65,
      thickness: 0.6,
      transparent: true,
      opacity: 0.95,
      ior: 1.52,
    });

    // Bottle Body
    const bottleGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.8, 24);
    const bottleMesh = new THREE.Mesh(bottleGeo, amberGlassMat);
    bottleMesh.position.y = 0.9;
    group.add(bottleMesh);

    // Shoulder & Neck
    const shoulderGeo = new THREE.CylinderGeometry(0.35, 0.7, 0.45, 24);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, amberGlassMat);
    shoulderMesh.position.y = 2.025;
    group.add(shoulderMesh);

    const neckGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.4, 24);
    const neckMesh = new THREE.Mesh(neckGeo, amberGlassMat);
    neckMesh.position.y = 2.45;
    group.add(neckMesh);

    // White Medical Prescription Label
    const labelGeo = new THREE.CylinderGeometry(0.705, 0.705, 1.2, 24, 1, true, 0, Math.PI * 1.55);
    const labelMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcf9,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.y = 0.9;
    labelMesh.rotation.y = -Math.PI / 4;
    group.add(labelMesh);

    // Green label accent stripe
    const stripeGeo = new THREE.CylinderGeometry(0.708, 0.708, 0.15, 24, 1, true, 0, Math.PI * 1.55);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x1e8755,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.y = 1.35;
    stripeMesh.rotation.y = -Math.PI / 4;
    group.add(stripeMesh);

    // Black Ribbed Screw Cap
    const capGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.45, 24);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.4,
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 2.85;
    group.add(capMesh);

    // Rubber Bulb Top
    const bulbGeo = new THREE.SphereGeometry(0.32, 16, 16);
    bulbGeo.scale(0.85, 1.4, 0.85);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.85,
    });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.y = 3.35;
    group.add(bulbMesh);

    // Pipette Dropper Tip (Glass rod at bottom)
    const pipetteGeo = new THREE.CylinderGeometry(0.08, 0.04, 1.5, 12);
    const pipetteMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      transparent: true,
      opacity: 0.6,
    });
    const pipetteMesh = new THREE.Mesh(pipetteGeo, pipetteMat);
    pipetteMesh.position.y = 1.0;
    group.add(pipetteMesh);

    group.position.y = -1.3;
    return group;
  };

  // Build Tiger-Striped Cannabis Seed in 3D
  const buildCannabisSeed = (): THREE.Group => {
    const group = new THREE.Group();

    // Ovate teardrop seed geometry
    const seedGeo = new THREE.SphereGeometry(1.0, 32, 32);
    seedGeo.scale(0.72, 1.25, 0.6);

    const seedMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e2b,
      roughness: 0.45,
      metalness: 0.05,
    });

    const seedMesh = new THREE.Mesh(seedGeo, seedMat);
    group.add(seedMesh);

    // Prominent seed ridge (hilum seam)
    const seamGeo = new THREE.TorusGeometry(0.85, 0.035, 8, 32);
    seamGeo.scale(0.72, 1.26, 0.1);
    const seamMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719,
      roughness: 0.6,
    });
    const seamMesh = new THREE.Mesh(seamGeo, seamMat);
    group.add(seamMesh);

    // Dark tiger mottling stripes
    for (let i = 0; i < 18; i++) {
      const stripeGeo = new THREE.CylinderGeometry(0.03, 0.015, 0.5 + Math.random() * 0.4, 6);
      const stripeMat = new THREE.MeshStandardMaterial({
        color: 0x24170e,
        roughness: 0.5,
      });
      const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
      stripeMesh.position.set(
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 1.5,
        (Math.random() > 0.5 ? 0.38 : -0.38)
      );
      stripeMesh.rotation.z = (Math.random() - 0.5) * 1.2;
      stripeMesh.rotation.x = Math.PI / 2;
      group.add(stripeMesh);
    }

    return group;
  };

  // Load a model switch
  const fitObject = (root: THREE.Object3D) => {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    root.scale.multiplyScalar(1.85 / maxDim);
    root.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
    root.position.sub(center);
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (material && 'envMapIntensity' in material) material.envMapIntensity = 0.9;
      });
    });
    return root;
  };

  const loadGlb = async (url: string): Promise<THREE.Object3D | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      const loader = new GLTFLoader();
      const draco = new DRACOLoader();
      draco.setDecoderPath('/draco/');
      loader.setDRACOLoader(draco);
      if ('ready' in MeshoptDecoder && MeshoptDecoder.ready) {
        await MeshoptDecoder.ready;
      }
      loader.setMeshoptDecoder(MeshoptDecoder);
      const gltf = await new Promise<THREE.Object3D>((resolve, reject) => {
        loader.parse(buffer, '', (parsed) => resolve(parsed.scene), reject);
      });
      draco.dispose();
      return fitObject(gltf);
    } catch {
      return null;
    }
  };

  const loadPresetModel = async (type: ModelType) => {
    clearModel();
    if (!sceneRef.current) return;

    const urls = [...modelUrlsRef.current, `/models/${type}.glb`];
    let object: THREE.Object3D | null = null;
    for (const url of urls) {
      object = await loadGlb(url);
      if (object) break;
    }
    if (!object) {
      if (type === 'bud') object = buildCuredBud();
      else if (type === 'leaf' || type === 'plant') object = buildCannabisLeaf();
      else if (type === 'bottle') object = buildTinctureBottle();
      else if (type === 'seed') object = buildCannabisSeed();
      else object = buildCuredBud();
    }

    currentObjectGroupRef.current = object;
    sceneRef.current.add(object);
    setActiveModel(type);
    setCustomModelName(null);
    if (onModelLoaded) onModelLoaded(type);

    // Reset controls target
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Handle OBJ file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let objFile: File | null = null;
    let mtlFile: File | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.obj')) {
        objFile = file;
      } else if (file.name.toLowerCase().endsWith('.mtl')) {
        mtlFile = file;
      }
    }

    if (!objFile) {
      setStatusMessage('Please select a valid .OBJ 3D file.');
      return;
    }

    setStatusMessage(`Parsing 3D OBJ: ${objFile.name}…`);

    const objReader = new FileReader();
    objReader.onload = (event) => {
      const objContents = event.target?.result as string;
      if (!objContents) return;

      const objLoader = new OBJLoader();

      if (mtlFile) {
        const mtlReader = new FileReader();
        mtlReader.onload = (mtlEvent) => {
          const mtlContents = mtlEvent.target?.result as string;
          const mtlLoader = new MTLLoader();
          const materials = mtlLoader.parse(mtlContents, '');
          materials.preload();
          objLoader.setMaterials(materials);
          parseAndDisplayObj(objLoader, objContents, objFile!.name);
        };
        mtlReader.readAsText(mtlFile);
      } else {
        parseAndDisplayObj(objLoader, objContents, objFile.name);
      }
    };
    objReader.readAsText(objFile);
  };

  const parseAndDisplayObj = (loader: OBJLoader, contents: string, fileName: string) => {
    try {
      const object = loader.parse(contents);

      // Compute bounding box to auto-scale & center
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const targetScale = 2.4 / maxDim;

      object.position.sub(center);
      object.scale.setScalar(targetScale);

      // Apply default dispensary standard material if none set
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x228b4a,
              roughness: 0.6,
              metalness: 0.1,
            });
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      clearModel();
      if (sceneRef.current) {
        const group = new THREE.Group();
        group.add(object);
        currentObjectGroupRef.current = group;
        sceneRef.current.add(group);
      }

      setActiveModel('custom');
      setCustomModelName(fileName);
      setStatusMessage(`Successfully loaded ${fileName}!`);
      if (onModelLoaded) onModelLoaded(fileName);

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error parsing OBJ file. Please check model syntax.');
    }
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Check WebGL availability first
    if (!isWebGLSupported()) {
      setWebglSupported(false);
      return;
    }

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4.5);
    cameraRef.current = camera;

    // 3. Renderer with ACES ToneMapping & Anti-aliasing inside try/catch
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.background = 'transparent';
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, presentation ? 1.5 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      rendererRef.current = renderer;
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('Herbal Harbour 3D WebGL renderer unavailable:', err);
      setWebglSupported(false);
      return;
    }

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.enabled = !presentation;
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.38);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemi = new THREE.HemisphereLight(0xf4f4f2, 0x132a1a, 0.45);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xfff6e4, 2.4);
    dirLight.position.set(3.2, 6, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 24;
    dirLight.shadow.camera.left = -3;
    dirLight.shadow.camera.right = 3;
    dirLight.shadow.camera.top = 3;
    dirLight.shadow.camera.bottom = -3;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const rimLight = new THREE.PointLight(0xd8f05a, 0.85, 10);
    rimLight.position.set(-3, -1, -3);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Subtle floor shadow plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(8, 8);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.98;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Initial Model
    loadPresetModel(initialModel);

    // Animation Loop
    let clock = new THREE.Clock();
    const visible = { current: true };
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    }, { threshold: 0.08 });
    observer.observe(container);
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (!visible.current || document.hidden) return;
      const delta = clock.getDelta();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Smooth idle turntable & float animation
      if (currentObjectGroupRef.current && isRotating) {
        currentObjectGroupRef.current.rotation.y += delta * 0.45;
        const elapsed = clock.getElapsedTime();
        currentObjectGroupRef.current.position.y = Math.sin(elapsed * 1.5) * 0.06;
        currentObjectGroupRef.current.rotation.z = Math.sin(elapsed * 1.2) * 0.025;
      }

      renderer.render(scene, camera);
    };
    animate();
    const onVisibility = () => {
      if (!document.hidden) clock.getDelta();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearModel();
      try {
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      } catch (err) {
        // Suppress cleanup disposal errors if context lost
      }
    };
  }, []);

  // Update wireframe state
  useEffect(() => {
    if (currentObjectGroupRef.current) {
      currentObjectGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => (m.wireframe = isWireframe));
          } else {
            child.material.wireframe = isWireframe;
          }
        }
      });
    }
  }, [isWireframe]);

  // Update Lighting Presets
  useEffect(() => {
    if (!dirLightRef.current || !ambientLightRef.current || !rimLightRef.current) return;
    if (lightingPreset === 'studio') {
      dirLightRef.current.color.setHex(0xffffff);
      dirLightRef.current.intensity = 1.8;
      ambientLightRef.current.color.setHex(0xffffff);
      ambientLightRef.current.intensity = 0.85;
      rimLightRef.current.color.setHex(0xf59e0b);
    } else if (lightingPreset === 'warm') {
      dirLightRef.current.color.setHex(0xffe0b2);
      dirLightRef.current.intensity = 2.2;
      ambientLightRef.current.color.setHex(0xfff3e0);
      ambientLightRef.current.intensity = 1.0;
      rimLightRef.current.color.setHex(0xff7043);
    } else if (lightingPreset === 'dispensary') {
      // High-CRI Botanical Grow Light / Emerald glow
      dirLightRef.current.color.setHex(0xe8f5e9);
      dirLightRef.current.intensity = 2.0;
      ambientLightRef.current.color.setHex(0x69f0ae);
      ambientLightRef.current.intensity = 0.7;
      rimLightRef.current.color.setHex(0x00e676);
    }
  }, [lightingPreset]);

  return (
    <div className={`relative flex flex-col overflow-hidden ${presentation ? 'bg-transparent' : 'rounded-3xl bg-gradient-to-b from-[#f9faf9] to-[#edf2ed] border border-emerald-900/10 shadow-lg'} ${className}`}>
      
      {/* 3D Canvas Mount Point or Graceful 2D Fallback */}
      {!webglSupported ? (
        <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-44 h-44 mb-3 rounded-2xl overflow-hidden bg-white/80 p-3 shadow-sm border border-emerald-900/10 flex items-center justify-center">
            <img
              src={
                activeModel === 'leaf'
                  ? 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?w=400&q=80'
                  : activeModel === 'bottle'
                  ? 'https://images.unsplash.com/photo-1608248597359-2162c8e31006?w=400&q=80'
                  : activeModel === 'seed'
                  ? 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80'
                  : 'https://images.unsplash.com/photo-1536939459926-301728717817?w=400&q=80'
              }
              alt={activeModel}
              className={`w-full h-full object-contain filter drop-shadow-md transition-all duration-700 ${
                isRotating ? 'scale-105 rotate-3' : 'scale-100 rotate-0'
              }`}
            />
          </div>
          <span className="text-xs font-black text-[#143329] tracking-wide uppercase">
            Botanical Preview • {activeModel}
          </span>
          <span className="text-[11px] text-slate-500 max-w-xs mt-0.5">
            WebGL hardware acceleration inactive; high-definition dispensary preview active.
          </span>
        </div>
      ) : (
        <div 
          ref={containerRef} 
          className="w-full flex-1 relative cursor-grab active:cursor-grabbing"
        />
      )}

      {/* Top Floating Control Toolbar */}
      <div className={`absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none ${presentation ? 'hidden' : ''}`}>
        
        {/* Model Selector Tabs */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-slate-200/80 text-xs font-bold text-slate-700">
          <button
            onClick={() => loadPresetModel('bud')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activeModel === 'bud' ? 'bg-[#143329] text-white' : 'hover:bg-slate-100'
            }`}
          >
            🌿 Flower Bud
          </button>
          <button
            onClick={() => loadPresetModel('leaf')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activeModel === 'leaf' ? 'bg-[#143329] text-white' : 'hover:bg-slate-100'
            }`}
          >
            🍁 Leaf
          </button>
          <button
            onClick={() => loadPresetModel('bottle')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activeModel === 'bottle' ? 'bg-[#143329] text-white' : 'hover:bg-slate-100'
            }`}
          >
            🧪 Tincture
          </button>
          <button
            onClick={() => loadPresetModel('seed')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activeModel === 'seed' ? 'bg-[#143329] text-white' : 'hover:bg-slate-100'
            }`}
          >
            🌰 Seed
          </button>
          {customModelName && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black truncate max-w-[100px]">
              {customModelName}
            </span>
          )}
        </div>

        {/* Upload Custom OBJ button */}
        {allowUpload && (
          <label className="pointer-events-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#143329] hover:bg-[#1c483a] text-white text-xs font-bold shadow-md transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Load .OBJ</span>
            <input
              type="file"
              accept=".obj,.mtl"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Bottom Floating Control Toolbar */}
      <div className={`absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none ${presentation ? 'hidden' : ''}`}>
        
        {/* Interaction hints */}
        <div className="pointer-events-auto text-[11px] font-semibold text-slate-600 bg-white/80 backdrop-blur-md px-3 py-1 rounded-xl shadow-xs border border-slate-200/60 hidden sm:flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-emerald-700" />
          <span>Click & drag to rotate • Scroll to zoom</span>
        </div>

        {/* View Controls: Rotation, Wireframe, Lighting */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-slate-200/80 text-xs">
          
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isRotating ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title={isRotating ? 'Pause Turntable' : 'Play Turntable'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsWireframe(!isWireframe)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isWireframe ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Wireframe Mesh"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setLightingPreset((prev) =>
                prev === 'studio' ? 'warm' : prev === 'warm' ? 'dispensary' : 'studio'
              );
            }}
            className="px-2 py-1 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            title="Switch Studio Lighting"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="capitalize">{lightingPreset}</span>
          </button>

          <button
            onClick={() => {
              if (controlsRef.current && cameraRef.current) {
                cameraRef.current.position.set(0, 1.2, 4.5);
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
              }
            }}
            className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Temporary Status Toast */}
      {statusMessage && !presentation && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-white/10 pointer-events-none animate-fade-in">
          {statusMessage}
        </div>
      )}

    </div>
  );
};
