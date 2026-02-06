import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function App() {
  const mountRef = useRef(null);
  const sunRef = useRef(null);

  // Three.js object refs
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const frameIdRef = useRef();

  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");
    sceneRef.current = scene;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(-5, 3, 5);
    scene.add(directionalLight);

    // Sun
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: "#888888", // gray placeholder while loading
    });
    material.emissive = new THREE.Color("#ff8800");
    material.emissiveIntensity = 0.3;

    const sun = new THREE.Mesh(geometry, material);
    scene.add(sun);
    sunRef.current = sun;
    sun.updateMatrixWorld(true);

    const loader = new THREE.TextureLoader();

    loader.load(
      "https://threejsfundamentals.org/threejs/resources/images/sun.jpg",
      (texture) => {
        sun.material.map = texture;
        sun.material.needsUpdate = true;
      }
    );

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 8;
    cameraRef.current = camera;
    camera.lookAt(0, 0, 0);

    //Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;

    //Animation Loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (sunRef.current) {
        sunRef.current.rotation.y += 0.005;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    //mouse Move
    function onMouseMove(event) {
      const rect = renderer.domElement.getBoundingClientRect();

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(sunRef.current);

      if (intersects.length > 0) {
        setHovered(true);
        sunRef.current.material.emissive = new THREE.Color("#ff8800");
        sunRef.current.material.emissiveIntensity = 0.6;
      } else {
        setHovered(false);
        sunRef.current.material.emissiveIntensity = 0.2;
      }
    }

    function onClick() {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(sunRef.current);

      if (intersects.length > 0) {
        setActive((prev) => !prev);
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);

    function onResize() {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      if (sunRef.current) {
        sunRef.current.geometry.dispose();
        sunRef.current.material.map?.dispose();
        sunRef.current.material.dispose();
      }
      controls.dispose();
      renderer.dispose();
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (active) {
      document.title = "Sun Expanded";
    } else {
      document.title = "Reactive Universe";
    }
  }, [active]);

  useEffect(() => {
    if (!sunRef.current) return;

    sunRef.current.scale.setScalar(active ? 2 : 1);

    sunRef.current.material.emissiveIntensity = active ? 0.6 : 0.3;
  }, [active]);

  function logCamera() {
    console.log("Camera Position:", cameraRef.current.position);
    console.log("Renderer Info:", rendererRef.current.info);
  }

  return (
    <>
      <div
        ref={mountRef}
        style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
      />

      <button
        onClick={logCamera}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          padding: "10px 15px",
          background: "#111",
          color: "white",
          border: "1px solid #555",
          cursor: "pointer",
        }}
      >
        Log Camera
      </button>
    </>
  );
}
