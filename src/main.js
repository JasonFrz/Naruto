import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// === Scene ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // awal gelap

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
// Ambient light redup saat awal
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// Point light dari lampu plafon
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 3, 0);
pointLight.visible = false;
scene.add(pointLight);

// Hemisphere light (cahaya lingkungan)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemiLight.visible = false;
scene.add(hemiLight);

// Directional light (cahaya arah)
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
dirLight.visible = false;
scene.add(dirLight);

// === Raycaster untuk deteksi klik ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Objek lampu
let ceilingLamp = null;
let lampOn = false; // Status ON/OFF lampu

// === Load GLB Model ===
const loader = new GLTFLoader();
loader.load(
  '../glb/narutoandroom.glb', // Ubah path sesuai lokasi file kamu
  gltf => {
    const model = gltf.scene;
    scene.add(model);

    // Debug: log semua nama objek
    model.traverse(obj => {
      if (obj.isMesh) {
        console.log("Objek ditemukan:", obj.name);
      }
    });

    // Ambil objek bernama "model_1" (lampu)
    ceilingLamp = model.getObjectByName("model_1");

    if (!ceilingLamp) {
      console.warn("Objek 'model_1' tidak ditemukan di dalam GLB.");
    }
  },
  xhr => console.log(`Loading: ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
  err => console.error('Gagal memuat GLB:', err)
);
// === Load Naruto GLB ===
loader.load(
  '../glb/naruto.gltf', // Make sure the path is correct
  gltf => {
    const narutoModel = gltf.scene;
    narutoModel.position.set(2, 0, 0);
    narutoModel.scale.set(1, 1, 1); // Tweak this if he's invisible
    scene.add(narutoModel);
  },
  xhr => console.log(`Loading Naruto GLTF: ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
  err => console.error('Error loading Naruto GLTF:', err)
);



// === Toggle lampu saat diklik ===
window.addEventListener('click', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (ceilingLamp) {
    const intersects = raycaster.intersectObject(ceilingLamp, true);
    if (intersects.length > 0) {
      lampOn = !lampOn;

      if (lampOn) {
        pointLight.visible = true;
        hemiLight.visible = true;
        dirLight.visible = true;
        ambientLight.intensity = 0.5;
        scene.background = new THREE.Color(0xeeeeee);
        console.log("💡 Lampu DINYALAKAN");
      } else {
        pointLight.visible = false;
        hemiLight.visible = false;
        dirLight.visible = false;
        ambientLight.intensity = 0.1;
        scene.background = new THREE.Color(0x000000);
        console.log("💡 Lampu DIMATIKAN");
      }
    }
  }
});

// === Handle Resize ===
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
