import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

const SYMBOLS = ['cherry', 'apple', 'orange', 'bell', 'star'] as const;
export type SlotSymbol = (typeof SYMBOLS)[number];

const GLYPH: Record<SlotSymbol, string> = {
  cherry: '🍒',
  apple: '🍏',
  orange: '🍊',
  bell: '🔔',
  star: '⭐',
};

const REEL_UV = [
  { v0: 0.21293117105960846, v1: 0.30773085355758667 },
  { v0: 0.32742664217948914, v1: 0.4224993586540222 },
  { v0: 0.4373782277107239, v1: 0.5321781635284424 },
];

export interface SlotMachineHandle {
  pullAndLand: (symbols: Promise<string[]>) => Promise<void>;
  celebrate: () => void;
}

interface SlotMachineProps {
  reducedMotion: boolean;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function symbolIndex(code: string): number {
  const index = SYMBOLS.indexOf(code as SlotSymbol);
  return index < 0 ? 0 : index;
}

function paintReelTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(0, 0, size, size);
  const u0 = 0.024 * size;
  const u1 = 0.831 * size;
  const cell = (u1 - u0) / SYMBOLS.length;
  REEL_UV.forEach((band) => {
    const y = (1 - band.v1) * size;
    const height = (band.v1 - band.v0) * size;
    SYMBOLS.forEach((code, index) => {
      ctx.fillStyle = index % 2 === 0 ? '#f7f3ea' : '#efe6d4';
      ctx.fillRect(u0 + index * cell, y, cell + 1, height + 1);
      ctx.font = `${Math.max(18, Math.floor(height * 0.72))}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(GLYPH[code], u0 + index * cell + cell / 2, y + height / 2);
    });
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function FlatReels({ faces, spinning, win }: { faces: string[]; spinning: boolean; win: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-3 rounded-2xl bg-forest-900 p-3 ${win ? 'ring-4 ring-signal' : ''}`}>
      {faces.map((code, index) => (
        <div key={index} className={`flex h-28 items-center justify-center rounded-xl bg-paper text-5xl ${spinning ? 'animate-pulse' : ''}`}>
          {GLYPH[code as SlotSymbol] ?? '·'}
        </div>
      ))}
    </div>
  );
}

export const SlotMachine = forwardRef<SlotMachineHandle, SlotMachineProps>(function SlotMachine({ reducedMotion }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SlotMachineHandle>({
    pullAndLand: async (symbols) => { await symbols; },
    celebrate: () => undefined,
  });
  const [webgl, setWebgl] = useState(true);
  const [faces, setFaces] = useState<string[]>(['cherry', 'apple', 'orange']);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState(false);
  const flatSpin = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (reducedMotion || !hasWebGL() || !mountRef.current) {
      setWebgl(false);
      return;
    }
    const mount = mountRef.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'default' });
    } catch {
      setWebgl(false);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.background = 'transparent';
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
    camera.position.set(0, 0.12, 3.15);
    camera.lookAt(0, 0.02, 0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.AmbientLight(0xfff8ee, 0.42));
    scene.add(new THREE.HemisphereLight(0xf4f4f2, 0x132a1a, 0.4));
    const key = new THREE.DirectionalLight(0xfff6e4, 2.2);
    key.position.set(2.4, 4.2, 3.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd8f05a, 0.9);
    rim.position.set(-2.2, 1.4, -1.6);
    scene.add(rim);
    const glow = new THREE.PointLight(0xd8f05a, 0.4, 6);
    glow.position.set(0, 0.4, 1.2);
    scene.add(glow);

    const reelNodes: THREE.Object3D[] = [];
    const baseQuats: THREE.Quaternion[] = [];
    const angles = [{ angle: 0 }, { angle: 0 }, { angle: 0 }];
    const handleState = { pull: 0 };
    let handleNode: THREE.Object3D | null = null;
    let handleBase = new THREE.Quaternion();
    let lightMaterial: THREE.MeshStandardMaterial | null = null;
    let root: THREE.Object3D | null = null;
    let baseY = 0;
    let disposed = false;
    const axis = new THREE.Vector3(1, 0, 0);
    const pullAxis = new THREE.Vector3(0, 0, 1);
    const shown = [0, 1, 2];

    const applyReel = (index: number) => {
      const node = reelNodes[index];
      if (!node) return;
      const extra = new THREE.Quaternion().setFromAxisAngle(axis, angles[index].angle);
      node.quaternion.copy(baseQuats[index]).multiply(extra);
      const face = Math.round(((angles[index].angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * SYMBOLS.length) % SYMBOLS.length;
      if (shown[index] !== face) {
        shown[index] = face;
        setFaces(shown.map((item) => SYMBOLS[item]));
      }
    };
    const applyHandle = () => {
      if (!handleNode) return;
      const extra = new THREE.Quaternion().setFromAxisAngle(pullAxis, handleState.pull);
      handleNode.quaternion.copy(handleBase).multiply(extra);
    };

    const resize = () => {
      const width = mount.clientWidth || 320;
      const height = mount.clientHeight || 280;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const loader = new GLTFLoader();
    const reelTexture = paintReelTexture();
    const loadSlot = async () => {
      if ('ready' in MeshoptDecoder && MeshoptDecoder.ready) await MeshoptDecoder.ready;
      if (disposed) return;
      loader.setMeshoptDecoder(MeshoptDecoder);
      const url = '/models/slot_machine.glb';
      loader.load(url, (gltf) => {
      if (disposed) return;
      root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      root.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      root.scale.setScalar(1.7 / maxDim);
      baseY = root.position.y;
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      });
      ['Roll', 'Roll1', 'Roll2'].forEach((name) => {
        const node = root?.getObjectByName(name);
        if (!node) return;
        reelNodes.push(node);
        baseQuats.push(node.quaternion.clone());
        node.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          const source = mesh.material as THREE.MeshStandardMaterial;
          const material = source.clone();
          material.map = reelTexture;
          material.color = new THREE.Color('#ffffff');
          mesh.material = material;
        });
      });
      handleNode = root.getObjectByName('handle') ?? null;
      if (handleNode) handleBase = handleNode.quaternion.clone();
      const light = root.getObjectByName('light');
      light?.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || lightMaterial) return;
        const material = (mesh.material as THREE.MeshStandardMaterial).clone();
        material.emissive = new THREE.Color('#d8f05a');
        material.emissiveIntensity = 0.85;
        mesh.material = material;
        lightMaterial = material;
      });
      scene.add(root);
    }, undefined, () => {
      if (!disposed) setWebgl(false);
    });
    };
    void loadSlot();

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (root) root.position.y = baseY + Math.sin(t * 1.3) * 0.015;
      if (lightMaterial) lightMaterial.emissiveIntensity = glow.intensity > 2 ? lightMaterial.emissiveIntensity : 0.55 + Math.sin(t * 2.2) * 0.28;
      glow.intensity = Math.max(0.35, glow.intensity * 0.96);
      renderer.render(scene, camera);
    };
    animate();

    apiRef.current = {
      async pullAndLand(pending) {
        setSpinning(true);
        setWin(false);
        const lever = gsap.timeline();
        lever.to(handleState, { pull: -1.15, duration: 0.26, ease: 'power2.in', onUpdate: applyHandle });
        lever.to(handleState, { pull: 0, duration: 0.5, ease: 'elastic.out(1, 0.55)', onUpdate: applyHandle });
        const free = angles.map((state, index) => gsap.to(state, {
          angle: state.angle + Math.PI * 14,
          duration: 2.4,
          ease: 'none',
          repeat: -1,
          onUpdate: () => applyReel(index),
        }));
        let symbols: string[] = ['cherry', 'cherry', 'cherry'];
        try {
          symbols = await pending;
        } catch (error) {
          free.forEach((tween) => tween.kill());
          setSpinning(false);
          throw error;
        }
        free.forEach((tween) => tween.kill());
        await new Promise<void>((resolve) => {
          const timeline = gsap.timeline({ onComplete: resolve });
          symbols.forEach((code, index) => {
            const current = angles[index].angle;
            const currentMod = ((current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            let delta = (symbolIndex(code) / SYMBOLS.length) * Math.PI * 2 - currentMod;
            if (delta < 0.2) delta += Math.PI * 2;
            timeline.to(angles[index], {
              angle: current + (3 + index) * Math.PI * 2 + delta,
              duration: 1.35 + index * 0.42,
              ease: index === 0 ? 'power2.out' : index === 1 ? 'power3.out' : 'power4.out',
              onUpdate: () => applyReel(index),
            }, 0.05);
          });
        });
        setFaces(symbols);
        setSpinning(false);
      },
      celebrate() {
        setWin(true);
        glow.intensity = 6;
        if (lightMaterial) lightMaterial.emissiveIntensity = 2.4;
        window.setTimeout(() => setWin(false), 1400);
      },
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      angles.forEach((state) => gsap.killTweensOf(state));
      gsap.killTweensOf(handleState);
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reducedMotion]);

  useImperativeHandle(ref, () => ({
    async pullAndLand(pending) {
      if (!webgl || reducedMotion) {
        setSpinning(true);
        setWin(false);
        const symbols = await pending;
        if (!reducedMotion) {
          flatSpin.current = new Promise((resolve) => {
            let frame = 0;
            const timer = window.setInterval(() => {
              frame += 1;
              setFaces([0, 1, 2].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
              if (frame > 10) {
                window.clearInterval(timer);
                resolve();
              }
            }, 70);
          });
          await flatSpin.current;
        }
        setFaces(symbols);
        setSpinning(false);
        return;
      }
      await apiRef.current.pullAndLand(pending);
    },
    celebrate() {
      setWin(true);
      apiRef.current.celebrate();
      window.setTimeout(() => setWin(false), 1400);
    },
  }), [reducedMotion, webgl]);

  const sparks = win ? Array.from({ length: 14 }, (_, index) => {
    const angle = (index / 14) * Math.PI * 2;
    return { id: index, dx: `${Math.cos(angle) * 90}px`, dy: `${Math.sin(angle) * 70}px` };
  }) : [];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-forest-900">
      {webgl && !reducedMotion ? (
        <div ref={mountRef} className="h-64 sm:h-80 w-full" />
      ) : (
        <div className="p-3">
          <FlatReels faces={faces} spinning={spinning} win={win} />
        </div>
      )}
      {webgl && !reducedMotion && (
        <div className="pointer-events-none absolute inset-x-[8%] top-[34%] grid grid-cols-3 gap-[8%]">
          {faces.map((code, index) => (
            <div key={index} className="flex h-16 sm:h-20 items-center justify-center rounded-lg bg-paper/95 text-4xl shadow-md">
              {GLYPH[code as SlotSymbol] ?? '·'}
            </div>
          ))}
        </div>
      )}
      {win && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {sparks.map((spark) => (
            <span key={spark.id} className="win-spark" style={{ '--dx': spark.dx, '--dy': spark.dy } as React.CSSProperties} />
          ))}
        </div>
      )}
    </div>
  );
});
