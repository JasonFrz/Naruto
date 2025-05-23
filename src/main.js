import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 3, 0);
pointLight.visible = false;
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemiLight.visible = false;
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
dirLight.visible = false;
scene.add(dirLight);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let ceilingLamp = null;
let monitor = null;
let lampOn = false;

const desktopUI = document.getElementById('desktopUI');
const shutdownBtn = document.getElementById('shutdownBtn');

shutdownBtn.addEventListener('click', () => {
  desktopUI.style.display = 'none';
  controls.enabled = true; // Aktifkan kembali rotasi kamera
});

const loader = new GLTFLoader();
loader.load('../glb/narutoandroom.glb', gltf => {
  const model = gltf.scene;
  scene.add(model);

  model.traverse(obj => {
    if (obj.isMesh) console.log("Objek ditemukan:", obj.name);
  });

  ceilingLamp = model.getObjectByName("model_1");
  monitor = model.getObjectByName("model_2");

  if (!ceilingLamp) console.warn("Objek 'model_1' tidak ditemukan.");
  if (!monitor) console.warn("Objek 'model_2' tidak ditemukan.");
});

loader.load('../glb/naruto.gltf', gltf => {
  const narutoModel = gltf.scene;
  narutoModel.position.set(2, 0, 0);
  narutoModel.scale.set(1, 1, 1);
  scene.add(narutoModel);
});

window.addEventListener('click', event => {
  if (desktopUI.style.display === 'block') return; // Jangan deteksi klik di scene jika desktop aktif

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const clickableObjects = [];
  if (ceilingLamp) clickableObjects.push(ceilingLamp);
  if (monitor) clickableObjects.push(monitor);

  const intersects = raycaster.intersectObjects(clickableObjects, true);
  if (intersects.length > 0) {
    const clicked = intersects[0].object;

    if (clicked === ceilingLamp || ceilingLamp?.children.includes(clicked)) {
      lampOn = !lampOn;
      pointLight.visible = lampOn;
      hemiLight.visible = lampOn;
      dirLight.visible = lampOn;
      ambientLight.intensity = lampOn ? 0.5 : 0.1;
      scene.background = new THREE.Color(lampOn ? 0xeeeeee : 0x000000);
      console.log(`💡 Lampu ${lampOn ? "DINYALAKAN" : "DIMATIKAN"}`);
    }

    if (clicked === monitor || monitor?.children.includes(clicked)) {
      desktopUI.style.display = 'block';
      controls.enabled = false; // Nonaktifkan rotasi kamera
      desktopUI.focus();
      console.log("🖥️ Monitor diklik - UI komputer ditampilkan");
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
