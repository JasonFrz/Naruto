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
let monitorOpen = false;

const desktopUI = document.getElementById('desktopUI');
const shutdownBtn = document.getElementById('shutdownBtn');
const ninjaInfo = document.getElementById('ninjaInfo');

shutdownBtn.addEventListener('click', () => {
  desktopUI.style.display = 'none';
  monitorOpen = false;
  ninjaInfo.style.display = 'none';
});

document.getElementById('shortcutVSCode').addEventListener('click', () => {
  ninjaInfo.style.display = 'block';
  ninjaInfo.innerHTML = `
    <h2>📚 Data Ninja Era Boruto</h2>
    <div class="ninja-card">
      <img src="../asset/naruto.jpg" alt="Naruto Uzumaki">
      <div>
        <strong>Nama:</strong> Naruto Uzumaki<br>
        <strong>Tier:</strong> S<br>
        <strong>Misi:</strong> 400+ S-rank<br>
        <strong>Hasil Ujian Chunin:</strong> Lulus (dengan kekacauan 😅)
      </div>
    </div>
    <div class="ninja-card">
      <img src="../asset/boruto.jpg" alt="Boruto Uzumaki">
      <div>
        <strong>Nama:</strong> Boruto Uzumaki<br>
        <strong>Tier:</strong> A<br>
        <strong>Misi:</strong> 80+ B-rank<br>
        <strong>Hasil Ujian Chunin:</strong> Tidak Lulus (Kecurangan)
      </div>
    </div>
    <!-- Tambahkan ninja lainnya di sini -->
  `;
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
});

loader.load('../glb/naruto.glb', gltf => {
  const narutoModel = gltf.scene;
  narutoModel.position.set(0, 0, 0);
  scene.add(narutoModel);
});

window.addEventListener('click', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([ceilingLamp, monitor].filter(Boolean), true);
  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    if (clicked === ceilingLamp || ceilingLamp?.children.includes(clicked)) {
      lampOn = !lampOn;
      pointLight.visible = lampOn;
      hemiLight.visible = lampOn;
      dirLight.visible = lampOn;
      ambientLight.intensity = lampOn ? 0.5 : 0.1;
      scene.background = new THREE.Color(lampOn ? 0xeeeeee : 0x000000);
    }

    if (clicked === monitor || monitor?.children.includes(clicked)) {
      desktopUI.style.display = 'block';
      monitorOpen = true;
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
  if (!monitorOpen) controls.enabled = true;
  else controls.enabled = false;
  controls.update();
  renderer.render(scene, camera);
}
animate();
