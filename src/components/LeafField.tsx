import React, { useEffect, useRef } from 'react';
import { canUseWebGL } from '../lib/display';

/** A small instanced leaf field. It does not start on phones or when motion is reduced. */
export const LeafField: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canUseWebGL() || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      if (cancelled) return;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 40);
      camera.position.z = 7;
      const count = 70;
      const geo = new THREE.PlaneGeometry(0.16, 0.3);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x3e6440,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      const dummy = new THREE.Object3D();
      const seeds = Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 9,
        y: (Math.random() - 0.5) * 6,
        z: -1 - Math.random() * 3,
        s: 0.45 + Math.random(),
        spin: Math.random() * Math.PI,
      }));
      scene.add(mesh);

      const resize = () => {
        const width = canvas.clientWidth || 1;
        const height = canvas.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();

      const visible = { current: true };
      const observer = new IntersectionObserver(([entry]) => {
        visible.current = entry.isIntersecting;
      }, { threshold: 0.05 });
      observer.observe(canvas);

      let frame = 0;
      const loop = (time: number) => {
        frame = requestAnimationFrame(loop);
        if (!visible.current || document.hidden) return;
        seeds.forEach((leaf, index) => {
          dummy.position.set(
            leaf.x + Math.sin(time * 0.00025 + index) * 0.35,
            leaf.y + Math.cos(time * 0.0002 + index) * 0.2,
            leaf.z
          );
          dummy.rotation.z = leaf.spin + time * 0.00015;
          dummy.scale.setScalar(leaf.s);
          dummy.updateMatrix();
          mesh.setMatrixAt(index, dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(loop);
      window.addEventListener('resize', resize);
      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener('resize', resize);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (!canUseWebGL()) return null;
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};
