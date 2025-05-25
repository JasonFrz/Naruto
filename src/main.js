import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Enable shadow mapping
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
renderer.shadowMap.autoUpdate = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 8, 50, 0.5);
pointLight.position.set(0, 12, 0);
pointLight.visible = false;
// Enable shadow casting for point light
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 2048;
pointLight.shadow.mapSize.height = 2048;
pointLight.shadow.camera.near = 1;
pointLight.shadow.camera.far = 50;
pointLight.shadow.bias = -0.001;
pointLight.shadow.normalBias = 0.05;
scene.add(pointLight);

// // Add a helper to visualize the light (remove this later if not needed)
// const lightHelper = new THREE.PointLightHelper(pointLight, 1);
// scene.add(lightHelper);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.8);
hemiLight.visible = false;
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(-10, 15, 8);
dirLight.target.position.set(0, 0, 0);
dirLight.visible = false;
// Enable shadow casting for directional light
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 40;
// Set shadow camera bounds for directional light - much larger area
dirLight.shadow.camera.left = -25;
dirLight.shadow.camera.right = 25;
dirLight.shadow.camera.top = 25;
dirLight.shadow.camera.bottom = -25;
dirLight.shadow.bias = -0.001;
dirLight.shadow.normalBias = 0.05;
scene.add(dirLight);
scene.add(dirLight.target);

// Add helper to visualize directional light
// const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 3);
// scene.add(dirLightHelper);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let ceilingLamp = null;
let monitor = null;
let lampOn = false;
let monitorOpen = false;
let rasengan = null;
let rasenganSpeed = 3; // You can tweak this anytime

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
  
  // Enable shadows for all meshes in the room model
  model.traverse(obj => {
    if (obj.isMesh) {
      console.log("Room object found:", obj.name, "Material:", obj.material?.type);
      obj.castShadow = true;
      obj.receiveShadow = true;
      // Ensure material receives shadows properly
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            mat.shadowSide = THREE.DoubleSide;
            if (mat.transparent) mat.transparent = false; // Transparent materials don't receive shadows well
          });
        } else {
          obj.material.shadowSide = THREE.DoubleSide;
          if (obj.material.transparent) obj.material.transparent = false;
        }
      }
    }
  });

  ceilingLamp = model.getObjectByName("model_1");
  
  monitor = model.getObjectByName("model_2");
  
  console.log("Ceiling lamp found:", !!ceilingLamp, "Monitor found:", !!monitor);
});

loader.load('../glb/naruto.glb', gltf => {
  const narutoModel = gltf.scene;
  narutoModel.position.set(0, 0, 0);
  
  // Enable shadows for Naruto model
  narutoModel.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      // Ensure material receives shadows properly
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            mat.shadowSide = THREE.DoubleSide;
          });
        } else {
          obj.material.shadowSide = THREE.DoubleSide;
        }
      }
    }
  });
  
  scene.add(narutoModel);
});
//rasengan e
loader.load('../glb/rasengan.glb', gltf => {
  rasengan = gltf.scene;
  rasengan.position.set(-8.8, 9.9, 13.9);
  scene.add(rasengan);
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
      lightHelper.visible = lampOn; // Show/hide light helper
      dirLightHelper.visible = lampOn; // Show/hide directional light helper
      ambientLight.intensity = lampOn ? 0.3 : 0.05;
      scene.background = new THREE.Color(lampOn ? 0x333333 : 0x000000);
      
      console.log("Light toggled:", lampOn ? "ON" : "OFF");
      console.log("Point light position:", pointLight.position);
      console.log("Point light casting shadows:", pointLight.castShadow);
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

  if (rasengan) {  // Buat speed muter e rasengan

    rasengan.rotation.y += rasenganSpeed;
    rasengan.rotation.x += rasenganSpeed * 0.2;

  

  }

  controls.enabled = !monitorOpen;
  controls.update();
  renderer.render(scene, camera);
}
animate();