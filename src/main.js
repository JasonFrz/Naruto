import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Light (default ambient)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Spotlight for lampu
const lampuLight = new THREE.PointLight(0xffee88, 1, 10);
lampuLight.visible = false; // Mulai mati
scene.add(lampuLight);

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lampuObject = null;

const loader = new GLTFLoader();
const loadingDiv = document.getElementById('loading');

loader.load('../src/hokageRoom.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // Cari objek yang bernama 'Lampu' (ubah jika nama berbeda)
  model.traverse(child => {
    if (child.isMesh && child.name.toLowerCase().includes('lampu')) {
      lampuObject = child;
      lampuLight.position.copy(child.position);
    }
  });

  loadingDiv.style.display = 'none';
  render();
}, undefined, error => {
  console.error('GLB Load Error:', error);
});

// Mouse click detection
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    if (lampuObject && intersects[i].object === lampuObject) {
      lampuLight.visible = !lampuLight.visible;
      break;
    }
  }
});

// Resize responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
});

function render() {
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
}
animate();
