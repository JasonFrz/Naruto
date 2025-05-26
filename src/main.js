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
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
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
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
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
let S2 = null;
let S2Loaded = false; // Flag to track if S2 is loaded but not yet added to scene
let S2Rendered = false; // Flag to track if S2 is currently rendered in scene

let isRasengan = true;
let rasenganModel = null;
let rasenshurikenModel = null;
let rasengan = null;
let rasenganSpinning = false;
const rasenganSpeed = 0.12;

let gamaBunta = null;
let narutoModel = null;
let gamaBuntaVisible = false; // State untuk visibility Gama Bunta
let smokeParticles = []; // Array untuk menyimpan partikel asap
let isSpawning = false; // State untuk proses spawning

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
        <strong>Hasil Ujian Chunin:</strong> Lulus 
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

// --- Smoke Effect Setup ---
let smokeTexture;
const textureLoader = new THREE.TextureLoader();

// Load smoke texture
textureLoader.load('../asset/smoke1.gif', (texture) => {
  smokeTexture = texture;
  console.log('Smoke texture loaded successfully');
}, undefined, (error) => {
  console.error('Error loading smoke texture:', error);
});

// Function to create smoke effect
function createSmokeEffect(position, callback) {
  if (!smokeTexture) {
    console.warn('Smoke texture not loaded yet');
    return;
  }

  // Clear existing smoke particles
  smokeParticles.forEach(particle => {
    scene.remove(particle);
  });
  smokeParticles = [];

  // Create multiple smoke particles (lebih banyak dan lebih besar)
  for (let i = 0; i < 25; i++) {
    const smokeGeometry = new THREE.PlaneGeometry(700, 700); // Ukuran lebih besar
    const smokeMaterial = new THREE.MeshBasicMaterial({
      map: smokeTexture,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide

      
    });

    const smokeParticle = new THREE.Mesh(smokeGeometry, smokeMaterial);
    
    // Position particles around the spawn point dengan area lebih luas
    smokeParticle.position.set(
      position.x + (Math.random() - 0.5) * 20,
      position.y + Math.random() * 8,
      position.z + (Math.random() - 0.5) * 20
    );
    
    // Random rotation
    smokeParticle.rotation.z = Math.random() * Math.PI * 2;
    
    // Store initial properties for animation
    smokeParticle.userData = {
      initialY: smokeParticle.position.y,
      speed: 0.08 + Math.random() * 0.07,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      lifeTime: 360, // 6 detik pada 60fps untuk durasi lebih lama
      age: 0
    };

    scene.add(smokeParticle);
    smokeParticles.push(smokeParticle);
  }

  // Set timer untuk spawn Gama Bunta setelah 3 detik
  if (callback) {
    setTimeout(callback, 3000);
  }
}

// Function to update smoke particles
function updateSmokeEffect() {
  smokeParticles.forEach((particle, index) => {
    particle.userData.age++;
    
    // Move particle upward
    particle.position.y += particle.userData.speed;
    
    // Rotate particle
    particle.rotation.z += particle.userData.rotSpeed;
    
    // Fade out over time
    const lifeRatio = particle.userData.age / particle.userData.lifeTime;
    particle.material.opacity = 0.8 * (1 - lifeRatio);
    
    // Scale up over time (lebih dramatis)
    const scale = 1 + lifeRatio * 1.5;
    particle.scale.set(scale, scale, scale);
    
    // Remove particle when lifetime is over
    if (particle.userData.age >= particle.userData.lifeTime) {
      scene.remove(particle);
      smokeParticles.splice(index, 1);
    }
  });
}

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
  narutoModel = gltf.scene;
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

  // Load Gama Bunta tapi tidak langsung ditambahkan ke scene
  loader.load('../glb/kodok.glb', gltf => {
    gamaBunta = gltf.scene;
    gamaBunta.position.set(-230, -80, 0);
    gamaBunta.scale.set(0.21, 0.21, 0.21);
    gamaBunta.rotation.set(0,89.7,0);
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
    // Jangan langsung add ke scene, tunggu tombol E ditekan
    console.log('Gama Bunta loaded, press E to summon!');
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

// Load S2 model but don't add to scene yet
loader.load('../glb/S2.glb', gltf => {
  S2 = gltf.scene;
  S2.position.set(0, 0, 0);
  S2Loaded = true;
  console.log('S2 model loaded, waiting for monitor click to render...');
}, undefined, error => {
  console.error('Error loading S2 model:', error);
});

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

  const clickableObjects = [ceilingLamp, monitor, narutoModel];
  if (rasengan) clickableObjects.push(rasengan);

  const intersects = raycaster.intersectObjects(clickableObjects.filter(Boolean), true);
  if (intersects.length > 0) {
    const clicked = intersects[0].object;

    if (narutoModel && (clicked === narutoModel || narutoModel.children.includes(clicked) || isChildOfNaruto(clicked))) {
      rasenganSpinning = !rasenganSpinning;
      console.log("Naruto clicked! Rasengan spinning:", rasenganSpinning);
    }

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
      
      // Render S2 model when monitor is clicked
      if (S2Loaded && !S2Rendered) {
        scene.add(S2);
        S2Rendered = true;
        console.log('S2 model rendered to scene!');
      }
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

// Helper function untuk cek apakah object adalah child dari Naruto
function isChildOfNaruto(object) {
  if (!narutoModel) return false;
  let parent = object.parent;
  while (parent) {
    if (parent === narutoModel) return true;
    parent = parent.parent;
  }
  return false;
}

// --- Shutdown button event ---
shutdownBtn.addEventListener('click', () => {
  // Sembunyikan tampilan desktop
  desktopUI.style.display = 'none';

  // Ubah status monitor dan kamera
  monitorOpen = false;
  cameraLocked = false;

  // Sembunyikan panel ninja info
  ninjaInfo.style.display = 'none';

  // Hapus S2 dari scene jika sedang ditampilkan
  if (S2Rendered && S2) {
    scene.remove(S2);
    S2Rendered = false;
  }
});


// --- WASD Controls + E key for Gama Bunta ---
const moveSpeed = 0.05;
const move = { forward: false, backward: false, left: false, right: false };

window.addEventListener('keydown', e => {
  switch(e.key.toLowerCase()) {
    case 'w': move.backward = true; break;
    case 's': move.forward = true; break;
    case 'a': move.left = true; break;
    case 'd': move.right = true; break;
    case 'e': 
      // Toggle Gama Bunta visibility
      if (gamaBunta && !isSpawning) {
        if (gamaBuntaVisible) {
          // Hide Gama Bunta
          scene.remove(gamaBunta);
          gamaBuntaVisible = false;
          console.log('Gama Bunta dismissed!');
        } else {
          // Start spawning process
          isSpawning = true;
          console.log('Summoning Gama Bunta... creating smoke effect first!');
          
          // Create smoke effect first, then spawn Gama Bunta after 3 seconds
          createSmokeEffect(gamaBunta.position, () => {
            scene.add(gamaBunta);
            gamaBuntaVisible = true;
            isSpawning = false;
            console.log('Gama Bunta has appeared!');
          });
        }
      }
      break;
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

    // Rasengan hanya berputar jika rasenganSpinning = true (setelah Naruto diklik)
    if (rasengan && rasenganSpinning) { 
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

  // Update smoke effect
  updateSmokeEffect();

  controls.update();
  renderer.render(scene, camera);
}

animate();
