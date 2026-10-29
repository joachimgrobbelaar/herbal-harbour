import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { sound } from '../utils/audio';

interface AnimatedSlotMachineProps {
  isSpinning: boolean;
  onLeverPull: () => void;
  onSpinFinished: (symbols: [string, string, string], payout: number) => void;
  targetSymbols: [string, string, string];
  targetPayout: number;
}

export const AnimatedSlotMachine: React.FC<AnimatedSlotMachineProps> = ({
  isSpinning,
  onLeverPull,
  onSpinFinished,
  targetSymbols,
  targetPayout
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);

  // References across render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const handleMeshRef = useRef<THREE.Object3D | null>(null);
  const rollLeftRef = useRef<THREE.Object3D | null>(null);
  const rollCenterRef = useRef<THREE.Object3D | null>(null);
  const rollRightRef = useRef<THREE.Object3D | null>(null);
  const neonLightRedRef = useRef<THREE.PointLight | null>(null);
  const neonLightGoldRef = useRef<THREE.PointLight | null>(null);

  // Animation state refs
  const spinStartTimeRef = useRef<number | null>(null);
  const activeSpinningRef = useRef<boolean>(false);
  const leverPullProgressRef = useRef<number>(0);
  const reel1LockedRef = useRef<boolean>(false);
  const reel2LockedRef = useRef<boolean>(false);
  const reel3LockedRef = useRef<boolean>(false);
  const lastTickTimeRef = useRef<number>(0);

  // Initial rotations
  const initHandleRotXRef = useRef<number>(0);
  const initRollLeftRotXRef = useRef<number>(0);
  const initRollCenterRotXRef = useRef<number>(0);
  const initRollRightRotXRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera (Centered and framed for optimal view of reels and lever)
    const camera = new THREE.PerspectiveCamera(
      34,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.45, 4.3);
    cameraRef.current = camera;

    // Renderer with tone mapping and anti-aliasing
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting (Amsterdam Red Light District Vibrant Atmosphere)
    const ambientLight = new THREE.AmbientLight(0xfff0f5, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffebee, 2.2);
    dirLight.position.set(3, 6, 4);
    scene.add(dirLight);

    // Red Light District Neon Point Lights
    const neonRed = new THREE.PointLight(0xff0055, 3.5, 9);
    neonRed.position.set(-2.5, 1.2, 2.0);
    scene.add(neonRed);
    neonLightRedRef.current = neonRed;

    const neonGold = new THREE.PointLight(0xffb703, 3.0, 9);
    neonGold.position.set(2.5, 1.5, 2.0);
    scene.add(neonGold);
    neonLightGoldRef.current = neonGold;

    const neonEmerald = new THREE.PointLight(0x00ff88, 2.2, 7);
    neonEmerald.position.set(0, -1.5, 2.2);
    scene.add(neonEmerald);

    // Load Model
    const loader = new GLTFLoader();
    loader.load(
      'assets/models/slot_machine.glb',
      (gltf) => {
        const root = gltf.scene;

        // Bounding Box Normalization
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetScale = 1.6 / maxDim;

        root.scale.setScalar(targetScale);
        root.position.x = -center.x * targetScale;
        root.position.y = -center.y * targetScale - 0.05;
        root.position.z = -center.z * targetScale;

        // Traverse & identify nodes
        root.traverse((child) => {
          if (child.name === 'handle') {
            handleMeshRef.current = child;
            initHandleRotXRef.current = child.rotation.x;
          } else if (child.name === 'Roll') {
            rollLeftRef.current = child;
            initRollLeftRotXRef.current = child.rotation.x;
          } else if (child.name === 'Roll1') {
            rollCenterRef.current = child;
            initRollCenterRotXRef.current = child.rotation.x;
          } else if (child.name === 'Roll2') {
            rollRightRef.current = child;
            initRollRightRotXRef.current = child.rotation.x;
          }

          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Make machine body materials vibrant with slight metallic sheen
            if (mesh.material && !Array.isArray(mesh.material)) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mesh.name.toLowerCase().includes('light')) {
                mat.emissive = new THREE.Color(0xff0055);
                mat.emissiveIntensity = 0.8;
              }
            }
          }
        });

        scene.add(root);
        setModelLoaded(true);
      },
      undefined,
      (err) => console.error('Failed to load slot machine:', err)
    );

    // Raycasting for interactive 3D Lever click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (handleMeshRef.current) {
        const intersects = raycaster.intersectObjects([handleMeshRef.current], true);
        setIsHoveringHandle(intersects.length > 0);
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (activeSpinningRef.current) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (handleMeshRef.current) {
        const intersects = raycaster.intersectObjects([handleMeshRef.current], true);
        if (intersects.length > 0) {
          onLeverPull();
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handlePointerDown);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Atmospheric Neon Lights Breathing Pulse (Amsterdam Red Light Vibe)
      if (neonLightRedRef.current) {
        neonLightRedRef.current.intensity = 2.8 + Math.sin(elapsed * 4.5) * 1.2;
      }
      if (neonLightGoldRef.current) {
        neonLightGoldRef.current.intensity = 2.4 + Math.cos(elapsed * 3.8) * 0.9;
      }

      // Handle Lever Pull Animation
      if (leverPullProgressRef.current > 0) {
        // Recoil spring curve
        leverPullProgressRef.current = Math.max(0, leverPullProgressRef.current - delta * 2.8);
        const pullAngle = Math.sin(leverPullProgressRef.current * Math.PI) * 0.95;
        if (handleMeshRef.current) {
          handleMeshRef.current.rotation.x = initHandleRotXRef.current + pullAngle;
        }
      }

      // Reel Spinning Animation
      if (activeSpinningRef.current && spinStartTimeRef.current !== null) {
        const spinTime = (Date.now() - spinStartTimeRef.current) / 1000;

        // Continuous clicking sound while reels spin
        if (Date.now() - lastTickTimeRef.current > 75) {
          sound.playReelTick();
          lastTickTimeRef.current = Date.now();
        }

        // Reel 1: Stop at 1.7s
        if (spinTime < 1.7) {
          if (rollLeftRef.current) {
            rollLeftRef.current.rotation.x += delta * 24;
          }
        } else if (!reel1LockedRef.current) {
          reel1LockedRef.current = true;
          sound.playReelThud();
          if (rollLeftRef.current) {
            rollLeftRef.current.rotation.x = initRollLeftRotXRef.current;
          }
        }

        // Reel 2: Stop at 2.3s
        if (spinTime < 2.3) {
          if (rollCenterRef.current) {
            rollCenterRef.current.rotation.x += delta * 28;
          }
        } else if (!reel2LockedRef.current) {
          reel2LockedRef.current = true;
          sound.playReelThud();
          if (rollCenterRef.current) {
            rollCenterRef.current.rotation.x = initRollCenterRotXRef.current;
          }
        }

        // Reel 3: Stop at 2.9s
        if (spinTime < 2.9) {
          if (rollRightRef.current) {
            rollRightRef.current.rotation.x += delta * 32;
          }
        } else if (!reel3LockedRef.current) {
          reel3LockedRef.current = true;
          sound.playReelThud();
          if (rollRightRef.current) {
            rollRightRef.current.rotation.x = initRollRightRotXRef.current;
          }

          // All reels locked: Complete Spin
          activeSpinningRef.current = false;
          spinStartTimeRef.current = null;
          onSpinFinished(targetSymbols, targetPayout);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handlePointerDown);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Trigger spin reaction when prop changes
  useEffect(() => {
    if (isSpinning && !activeSpinningRef.current) {
      activeSpinningRef.current = true;
      spinStartTimeRef.current = Date.now();
      leverPullProgressRef.current = 1.0;
      reel1LockedRef.current = false;
      reel2LockedRef.current = false;
      reel3LockedRef.current = false;
      sound.playLeverPull();
    }
  }, [isSpinning]);

  return (
    <div className="relative w-full h-full select-none">
      {/* 3D Canvas Mount */}
      <div 
        ref={containerRef} 
        className={`w-full h-full ${isHoveringHandle ? 'cursor-pointer' : 'cursor-grab'}`} 
      />

      {/* Loading state indicator */}
      {!modelLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono">
            Loading 3D Animated Machine...
          </span>
        </div>
      )}

      {/* Interactive 3D Lever Pull Prompt */}
      {modelLoaded && !isSpinning && (
        <div className="absolute top-3 right-3 pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-black tracking-wide flex items-center gap-1.5 shadow-lg animate-pulse">
            <span className="text-xs">🕹️</span>
            <span>CLICK LEVER OR PRESS SPIN</span>
          </div>
        </div>
      )}

      {/* Neon Atmospheric Banner Overlay */}
      <div className="absolute bottom-2 left-3 right-3 pointer-events-none flex items-center justify-between text-[10px] font-bold text-slate-300">
        <span className="flex items-center gap-1 text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          3D MECHANICAL REELS ACTIVE
        </span>
        <span className="text-amber-400 font-mono">
          AMSTERDAM CASINO SPEC
        </span>
      </div>
    </div>
  );
};
