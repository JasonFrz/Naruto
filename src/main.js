import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 8, 50, 0.5);
pointLight.position.set(0, 12, 0);
pointLight.visible = false;
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 2048;
pointLight.shadow.mapSize.height = 2048;
pointLight.shadow.camera.near = 1;
pointLight.shadow.camera.far = 50;
pointLight.shadow.bias = -0.001;
pointLight.shadow.normalBias = 0.05;
scene.add(pointLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.8);
hemiLight.visible = false;
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(-10, 15, 8);
dirLight.target.position.set(0, 0, 0);
dirLight.visible = false;
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 40;
dirLight.shadow.camera.left = -25;
dirLight.shadow.camera.right = 25;
dirLight.shadow.camera.top = 25;
dirLight.shadow.camera.bottom = -25;
dirLight.shadow.bias = -0.001;
dirLight.shadow.normalBias = 0.05;
scene.add(dirLight);
scene.add(dirLight.target);

// --- Raycaster and mouse ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- Models & State ---
let ceilingLamp = null;
let monitor = null;
let lampOn = false;
let monitorOpen = false;
let cameraLocked = false;

let isRasengan = true;
let rasenganModel = null;
let rasenshurikenModel = null;
let rasengan = null;
const rasenganSpeed = 0.09;

let gamaBunta = null;  // Model Gama Bunta

const desktopUI = document.getElementById('desktopUI');
const shutdownBtn = document.getElementById('shutdownBtn');
const ninjaInfo = document.getElementById('ninjaInfo');

shutdownBtn.addEventListener('click', () => {
  desktopUI.style.display = 'none';
  monitorOpen = false;
  cameraLocked = false;
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
  `;
});

// Loader
const loader = new GLTFLoader();

// Load room and objects
loader.load('../glb/narutoandroom.glb', gltf => {
  const model = gltf.scene;
  scene.add(model);

  model.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            mat.shadowSide = THREE.DoubleSide;
            if (mat.transparent) mat.transparent = false;
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

// Load Naruto
loader.load('../glb/naruto.glb', gltf => {
  const narutoModel = gltf.scene;
  narutoModel.position.set(0, 0, 0);

  narutoModel.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
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

  // Load Gama Bunta kodok.glb di samping Naruto
loader.load('../glb/kodok.glb', gltf => {
  gamaBunta = gltf.scene;
  gamaBunta.position.set(60, 0, 0);
  gamaBunta.scale.set(0.07, 0.07, 0.07);  // ukuran diperkecil di sini
  gamaBunta.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
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
  scene.add(gamaBunta);
}, undefined, console.error);

});

// Load rasengan function
function loadRasenganModel() {
  return new Promise((resolve, reject) => {
    loader.load('../glb/rasengan.glb', gltf => {
      const model = gltf.scene;
      model.position.set(-8.8, 9.9, 13.9);
      model.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
      resolve(model);
    }, undefined, reject);
  });
}

// Load rasenshuriken function
function loadRasenshurikenModel() {
  return new Promise((resolve, reject) => {
    loader.load('../glb/odama.glb', gltf => {
      const model = gltf.scene;
      model.position.set(-8.8, 11.2, 13.9);
      model.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
      resolve(model);
    }, undefined, reject);
  });
}

// Load initial rasengan
loadRasenganModel().then(model => {
  rasenganModel = model;
  rasengan = rasenganModel;
  scene.add(rasengan);
}).catch(console.error);

// --- Raycaster click ---
window.addEventListener('click', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const clickableObjects = [ceilingLamp, monitor];
  if (rasengan) clickableObjects.push(rasengan);

  const intersects = raycaster.intersectObjects(clickableObjects.filter(Boolean), true);
  if (intersects.length > 0) {
    const clicked = intersects[0].object;

    if (clicked === ceilingLamp || ceilingLamp?.children.includes(clicked)) {
      lampOn = !lampOn;
      pointLight.visible = lampOn;
      hemiLight.visible = lampOn;
      dirLight.visible = lampOn;
      ambientLight.intensity = lampOn ? 0.3 : 0.05;
      scene.background = new THREE.Color(lampOn ? 0x333333 : 0x000000);
    }

    if (clicked === monitor || monitor?.children.includes(clicked)) {
      desktopUI.style.display = 'block';
      monitorOpen = true;
      cameraLocked = true;
      controls.enabled = false;
    }

    if (rasengan && (clicked === rasengan || rasengan.children.includes(clicked))) {
      scene.remove(rasengan);
      rasengan = null;

      if (isRasengan) {
        loadRasenshurikenModel().then(model => {
          rasenshurikenModel = model;
          rasengan = rasenshurikenModel;
          scene.add(rasengan);
        }).catch(console.error);
      } else {
        loadRasenganModel().then(model => {
          rasenganModel = model;
          rasengan = rasenganModel;
          scene.add(rasengan);
        }).catch(console.error);
      }

      isRasengan = !isRasengan;
    }
  }
});

// --- Shutdown button event ---
shutdownBtn.addEventListener('click', () => {
  desktopUI.style.display = 'none';
  monitorOpen = false;
  cameraLocked = false;
  controls.enabled = true;
  ninjaInfo.style.display = 'none';
});

// --- WASD Controls ---
const moveSpeed = 0.05;
const move = { forward: false, backward: false, left: false, right: false };

window.addEventListener('keydown', e => {
  switch(e.key.toLowerCase()) {
    case 'w': move.backward = true; break;
    case 's': move.forward = true; break;
    case 'a': move.left = true; break;
    case 'd': move.right = true; break;
  }
});

window.addEventListener('keyup', e => {
  switch(e.key.toLowerCase()) {
    case 'w': move.backward = false; break;
    case 's': move.forward = false; break;
    case 'a': move.left = false; break;
    case 'd': move.right = false; break;
  }
});

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Movement WASD relative to camera direction (XZ plane) - only if camera is not locked
  if (!cameraLocked) {
    const direction = new THREE.Vector3();

    if (move.forward) direction.z -= 10;
    if (move.backward) direction.z += 10;
    if (move.left) direction.x -= 10;
    if (move.right) direction.x += 10;

      if (rasengan) {  // Buat speed muter e rasengan

      rasengan.rotation.y += rasenganSpeed;
      rasengan.rotation.x += rasenganSpeed * 0.2;

    }

  controls.enabled = !monitorOpen;
  controls.update();
  renderer.render(scene, camera);

    if (direction.lengthSq() > 0) {
      direction.normalize();

      // Get forward and right vector from camera
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, camera.up).normalize();

      // Calculate movement vector
      const moveVec = new THREE.Vector3();
      moveVec.addScaledVector(forward, direction.z * moveSpeed);
      moveVec.addScaledVector(right, direction.x * moveSpeed);

      camera.position.add(moveVec);
      controls.target.add(moveVec);
    }
  }

  controls.update();

  renderer.render(scene, camera);
}

animate();
