import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// === Scene ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee); // latar belakang abu muda

// === Camera ===
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

// === Renderer ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === Lighting ===
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// === Load GLB ===
const loader = new GLTFLoader();
loader.load(
  '../glb/narutoandroom.glb', // Ganti dengan path glb kamu
  gltf => {
    scene.add(gltf.scene);
  },
  xhr => console.log(`Loading: ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
  err => console.error('Error loading GLB:', err)
);

// === Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Render Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
