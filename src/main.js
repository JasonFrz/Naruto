import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Hemisphere Light (ambient) ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

// --- Directional Light (utama) ---
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// --- Light helper (debug) ---
const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 0.5);
scene.add(dirLightHelper);

// --- Load GLB Model ---
const loader = new GLTFLoader();
loader.load(
  '../glb/narutoandroom.glb', // ⬅️ Ganti path jika perlu
  gltf => {
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        console.log('Material ditemukan:', child.material);

        // Jika model tidak punya material, beri material coklat default
        if (!child.material) {
          child.material = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // warna coklat
        }
      }
    });

    scene.add(gltf.scene);
  },
  xhr => {
    console.log(`Loading: ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`);
  },
  error => {
    console.error('Error loading GLB:', error);
  }
);

// --- Resize Handler ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Render Loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
