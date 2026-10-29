import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface GlbViewerProps {
  src: string;
  className?: string;
  autoRotate?: boolean;
  background?: string | null;
  enableControls?: boolean;
  enableFloating?: boolean;
  scaleMultiplier?: number;
  cameraDistance?: number;
}

export const GlbViewer: React.FC<GlbViewerProps> = ({ 
  src, 
  className = 'w-full h-full min-h-[320px]', 
  autoRotate = true, 
  background = null,
  enableControls = true,
  enableFloating = true,
  scaleMultiplier = 1.0,
  cameraDistance = 3.8
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setProgress(0);
    setError(null);

    const w = el.clientWidth || 400;
    const h = el.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    if (background) scene.background = new THREE.Color(background);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x335533, 1.3));

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(4, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa7f3d0, 0.8);
    dirLight2.position.set(-3, -2, -3);
    scene.add(dirLight2);

    // Optimized camera FOV 36 deg and camera distance 3.8 ensuring wide clearance with zero clipping
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.01, 1000);
    camera.position.set(0, 0.05, cameraDistance);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = enableControls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.autoRotate = autoRotate && !enableFloating;
    controls.autoRotateSpeed = 1.5;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    let disposed = false;
    let modelPivot: THREE.Group | null = null;
    let baseY = 0;

    loader.load(
      src,
      (gltf) => {
        if (disposed) return;
        const obj = gltf.scene;

        // Compute tight bounding box
        const box = new THREE.Box3().setFromObject(obj);
        const boxSize = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Max dimension normalization with 1.15 / maxDim factor
        const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z) || 1;
        obj.position.sub(center);
        obj.scale.setScalar((1.15 * scaleMultiplier) / maxDim);

        const pivot = new THREE.Group();
        pivot.add(obj);
        scene.add(pivot);
        modelPivot = pivot;
        baseY = pivot.position.y;
        setProgress(100);
      },
      (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      () => setError('Model failed to load')
    );

    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      if (modelPivot && enableFloating) {
        const t = clock.getElapsedTime();
        // Gentle, bounded vertical floating oscillation (max ±0.03) so it never hits the borders
        modelPivot.position.y = baseY + Math.sin(t * 1.5) * 0.035;
        modelPivot.rotation.y = t * 0.5;
        modelPivot.rotation.x = Math.sin(t * 0.8) * 0.025;
      }

      if (enableControls) {
        controls.update();
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    tick();

    const ro = new ResizeObserver(() => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement && el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [src, autoRotate, background, enableControls, enableFloating, scaleMultiplier, cameraDistance]);

  return (
    <div ref={ref} className={`relative flex items-center justify-center p-2 ${className}`} style={{ touchAction: 'none' }}>
      {progress < 100 && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-emerald-800 pointer-events-none">
          Loading… {progress}%
        </div>
      )}
      {error && <div className="absolute inset-0 flex items-center justify-center text-xs text-red-600">{error}</div>}
    </div>
  );
};
