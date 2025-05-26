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

// S2 purple glow light
const s2GlowLight = new THREE.PointLight(0x9966ff, 2, 30, 0.3);
s2GlowLight.visible = false;
scene.add(s2GlowLight);

// Rasengan blue glow light
const rasenganGlowLight = new THREE.PointLight(0x0088ff, 1.5, 25, 0.4);
rasenganGlowLight.visible = false;
scene.add(rasenganGlowLight);

// Susanoo purple glow light
const susanooGlowLight = new THREE.PointLight(0x6600cc, 3, 40, 0.5);
susanooGlowLight.visible = false;
scene.add(susanooGlowLight);

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
let S2Loaded = false;
let S2Rendered = false;
let s2GlowMeshes = []; // Store glow outline meshes only

let isRasengan = true;
let rasenganModel = null;
let rasenshurikenModel = null;
let rasengan = null;
let rasenganSpinning = false;
const rasenganSpeed = 0.12;
let rasenganGlowMeshes = []; // Store rasengan glow outline meshes
let sasukeModel = null;
let gamaBunta = null;
let narutoModel = null;
let gamaBuntaVisible = false;
let smokeParticles = [];
let isSpawning = false;

// Susanoo variables
let susanooModel = null;
let susanooLoaded = false;
let susanooVisible = false;
let susanooGlowMeshes = []; // Store susanoo glow outline meshes

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

textureLoader.load('../asset/smoke1.gif', (texture) => {
  smokeTexture = texture;
  console.log('Smoke texture loaded successfully');
}, undefined, (error) => {
  console.error('Error loading smoke texture:', error);
});

function createSmokeEffect(position, callback, isSusanooSummon = false) {
  if (!smokeTexture) {
    console.warn('Smoke texture not loaded yet');
    return;
  }

  // Clear existing smoke particles
  smokeParticles.forEach(particle => {
    scene.remove(particle);
  });
  smokeParticles = [];

  // Only create smoke for Gama Bunta
  if (!isSusanooSummon) {
    for (let i = 0; i < 25; i++) {
      const smokeGeometry = new THREE.PlaneGeometry(700, 700);
      const smokeMaterial = new THREE.MeshBasicMaterial({
        map: smokeTexture,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });

      const smokeParticle = new THREE.Mesh(smokeGeometry, smokeMaterial);
      
      smokeParticle.position.set(
        position.x + (Math.random() - 0.5) * 20,
        position.y + Math.random() * 8,
        position.z + (Math.random() - 0.5) * 20
      );
      
      smokeParticle.rotation.z = Math.random() * Math.PI * 2;
      
      smokeParticle.userData = {
        initialY: smokeParticle.position.y,
        speed: 0.08 + Math.random() * 0.07,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        lifeTime: 360,
        age: 0
      };

      scene.add(smokeParticle);
      smokeParticles.push(smokeParticle);
    }
  }

  if (callback) {
    // If it's a Susanoo summon, execute callback immediately without smoke delay
    if (isSusanooSummon) {
      callback();
    } else {
      setTimeout(callback, 3000); // Existing delay for Gama Bunta smoke
    }
  }
}


function updateSmokeEffect() {
  smokeParticles.forEach((particle, index) => {
    particle.userData.age++;
    
    particle.position.y += particle.userData.speed;
    
    particle.rotation.x += particle.userData.rotSpeed * 1;
    particle.rotation.y += particle.userData.rotSpeed * 1;
    particle.rotation.z += particle.userData.rotSpeed * 1;
    
    const lifeRatio = particle.userData.age / particle.userData.lifeTime;
    particle.material.opacity = 0.8 * (1 - lifeRatio);
    
    const scale = 1 + lifeRatio * 1.5;
    particle.scale.set(scale, scale, scale);
    
    if (particle.userData.age >= particle.userData.lifeTime) {
      scene.remove(particle);
      smokeParticles.splice(index, 1);
    }
  });
}

// Function to add purple glow outline to S2 (no color change to model itself)
function addGlowToS2() {
  if (!S2) return;
  
  S2.traverse((child) => {
    if (child.isMesh) {
      // Create purple glow outline effect only
      const glowGeometry = child.geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x9966ff, // Purple color
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.scale.multiplyScalar(1.06); // Slightly larger for outline effect
      glowMesh.position.copy(child.position);
      glowMesh.rotation.copy(child.rotation);
      
      // Add glow mesh to the same parent as the original mesh
      if (child.parent) {
        child.parent.add(glowMesh);
      } else {
        scene.add(glowMesh);
      }
      
      s2GlowMeshes.push(glowMesh);
    }
  });
  
  // Position purple glow light at S2's position
  s2GlowLight.position.copy(S2.position);
  s2GlowLight.visible = true;
}

// Function to remove glow effect from S2
function removeGlowFromS2() {
  // Remove glow outline meshes
  s2GlowMeshes.forEach(glowMesh => {
    if (glowMesh.parent) {
      glowMesh.parent.remove(glowMesh);
    } else {
      scene.remove(glowMesh);
    }
    glowMesh.geometry.dispose();
    glowMesh.material.dispose();
  });
  s2GlowMeshes = [];
  
  s2GlowLight.visible = false;
}

// Function to add blue glow outline to rasengan (no color change to model itself)
function addGlowToRasengan() {
  if (!rasengan) return;
  
  // Remove existing glow first
  removeGlowFromRasengan();
  
  rasengan.traverse((child) => {
    if (child.isMesh) {
      // Create blue glow outline effect only
      const glowGeometry = child.geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0088ff, // Blue color
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.scale.multiplyScalar(1.08); // Slightly larger for outline effect
      glowMesh.position.copy(child.position);
      glowMesh.rotation.copy(child.rotation);
      
      // Add glow mesh to the same parent as the original mesh
      if (child.parent) {
        child.parent.add(glowMesh);
      } else {
        scene.add(glowMesh);
      }
      
      rasenganGlowMeshes.push(glowMesh);
    }
  });
  
  // Position blue glow light at rasengan's position
  rasenganGlowLight.position.copy(rasengan.position);
  rasenganGlowLight.visible = true;
}

// Function to remove glow effect from rasengan
function removeGlowFromRasengan() {
  // Remove glow outline meshes
  rasenganGlowMeshes.forEach(glowMesh => {
    if (glowMesh.parent) {
      glowMesh.parent.remove(glowMesh);
    } else {
      scene.remove(glowMesh);
    }
    glowMesh.geometry.dispose();
    glowMesh.material.dispose();
  });
  rasenganGlowMeshes = [];
  
  rasenganGlowLight.visible = false;
}

// Function to add purple glow outline to Susanoo
function addGlowToSusanoo() {
  if (!susanooModel) return;
  
  susanooModel.traverse((child) => {
    if (child.isMesh) {
      // Create purple glow outline effect only
      const glowGeometry = child.geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6600cc, // Dark purple color for Susanoo
        transparent: true,
        opacity: 0.6,
        side: THREE.BackSide
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.scale.multiplyScalar(1.05); // Slightly larger for outline effect
      glowMesh.position.copy(child.position);
      glowMesh.rotation.copy(child.rotation);
      
      // Add glow mesh to the same parent as the original mesh
      if (child.parent) {
        child.parent.add(glowMesh);
      } else {
        scene.add(glowMesh);
      }
      
      susanooGlowMeshes.push(glowMesh);
    }
  });
  
  // Position purple glow light at Susanoo's position
  susanooGlowLight.position.copy(susanooModel.position);
  susanooGlowLight.visible = true;
}

// Function to remove glow effect from Susanoo
function removeGlowFromSusanoo() {
  // Remove glow outline meshes
  susanooGlowMeshes.forEach(glowMesh => {
    if (glowMesh.parent) {
      glowMesh.parent.remove(glowMesh);
    } else {
      scene.remove(glowMesh);
    }
    glowMesh.geometry.dispose();
    glowMesh.material.dispose();
  });
  susanooGlowMeshes = [];
  
  susanooGlowLight.visible = false;
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
    console.log('Gama Bunta loaded, press E to summon!');
  }, undefined, console.error);
});

// Load Sasuke
loader.load('../glb/sasuke.glb', gltf => {
  sasukeModel = gltf.scene;
  scene.add(sasukeModel);

  // Atur posisi awal Sasuke (misalnya berdiri di samping Naruto)
  sasukeModel.position.set(0, 1, 0); // Sesuaikan posisi dengan kebutuhan
  sasukeModel.scale.set(0.11, 0.11, 0.11);     // Sesuaikan skala jika perlu
  sasukeModel.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  console.log('Model Sasuke berhasil dimuat, click to activate Susanoo!');
}, undefined, error => {
  console.error('Gagal memuat model Sasuke:', error);
});

// Load Susanoo model
loader.load('../glb/susanoo.glb', gltf => {
  susanooModel = gltf.scene;
  susanooModel.position.set(0, 5, 0); // Position around Sasuke
  susanooModel.scale.set(500, 500, 500); // Adjust scale as needed
  susanooModel.rotation.set(5, 0, 0); 
  susanooModel.traverse(obj => {
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
  
  susanooLoaded = true;
  console.log('Susanoo model loaded, click Sasuke to activate!');
}, undefined, error => {
  console.error('Error loading Susanoo model:', error);
});

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

function loadRasenshurikenModel() {
  return new Promise((resolve, reject) => {
    loader.load('../glb/rasengan.glb', gltf => {
      const model = gltf.scene;
      model.position.set(-8.8, 11.2, 13.9);
      model.scale.set(2.5, 2.5, 2.5); // Make it bigger than regular rasengan
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
  addGlowToRasengan(); // Add blue glow to rasengan immediately
}).catch(console.error);

// --- Raycaster click ---
window.addEventListener('click', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const clickableObjects = [ceilingLamp, monitor, narutoModel, sasukeModel];
  if (rasengan) clickableObjects.push(rasengan);

  const intersects = raycaster.intersectObjects(clickableObjects.filter(Boolean), true);
  if (intersects.length > 0) {
    const clicked = intersects[0].object;

    if (narutoModel && (clicked === narutoModel || narutoModel.children.includes(clicked) || isChildOfNaruto(clicked))) {
      rasenganSpinning = !rasenganSpinning;
      console.log("Naruto clicked! Rasengan spinning:", rasenganSpinning);
    }

    // Handle Sasuke click for Susanoo toggle
    if (sasukeModel && (clicked === sasukeModel || sasukeModel.children.includes(clicked) || isChildOfSasuke(clicked))) {
      if (susanooLoaded) {
        if (susanooVisible) {
          // Remove Susanoo
          removeGlowFromSusanoo();
          scene.remove(susanooModel);
          susanooVisible = false;
          console.log("Susanoo deactivated!");
        } else {
          // Add Susanoo without smoke effect
          createSmokeEffect(sasukeModel.position, () => {
            scene.add(susanooModel);
            addGlowToSusanoo();
            susanooVisible = true;
            console.log("Susanoo activated!");
          }, true); // Pass true to indicate it's a Susanoo summon
        }
      } else {
        console.log("Susanoo model not loaded yet!");
      }
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
      
      // Render S2 model with purple glow when monitor is clicked
      if (S2Loaded && !S2Rendered) {
        scene.add(S2);
        addGlowToS2();
        S2Rendered = true;
        console.log('S2 model rendered to scene with purple glow effect!');
      }
    }

    if (rasengan && (clicked === rasengan || rasengan.children.includes(clicked))) {
      scene.remove(rasengan);
      removeGlowFromRasengan(); // Remove glow from current rasengan
      rasengan = null;

      if (isRasengan) {
        loadRasenshurikenModel().then(model => {
          rasenshurikenModel = model;
          rasengan = rasenshurikenModel;
          scene.add(rasengan);
          addGlowToRasengan(); // Add blue glow to new rasengan
        }).catch(console.error);
      } else {
        loadRasenganModel().then(model => {
          rasenganModel = model;
          rasengan = rasenganModel;
          scene.add(rasengan);
          addGlowToRasengan(); // Add blue glow to new rasengan
        }).catch(console.error);
      }

      isRasengan = !isRasengan;
    }
  }
});

function isChildOfNaruto(object) {
  if (!narutoModel) return false;
  let parent = object.parent;
  while (parent) {
    if (parent === narutoModel) return true;
    parent = parent.parent;
  }
  return false;
}

function isChildOfSasuke(object) {
  if (!sasukeModel) return false;
  let parent = object.parent;
  while (parent) {
    if (parent === sasukeModel) return true;
    parent = parent.parent;
  }
  return false;
}

// --- Shutdown button event ---
shutdownBtn.addEventListener('click', () => {
  desktopUI.style.display = 'none';
  monitorOpen = false;
  cameraLocked = false;
  ninjaInfo.style.display = 'none';

  // Remove S2 and its glow effect when shutting down
  if (S2Rendered && S2) {
    removeGlowFromS2();
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
      if (gamaBunta && !isSpawning) {
        if (gamaBuntaVisible) {
          scene.remove(gamaBunta);
          gamaBuntaVisible = false;
          console.log('Gama Bunta dismissed!');
        } else {
          isSpawning = true;
          console.log('Summoning Gama Bunta... creating smoke effect first!');
          
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

// Pulsing glow animation
let glowTime = 0;

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

    if (rasengan && rasenganSpinning) { 
      rasengan.rotation.y += rasenganSpeed;
      rasengan.rotation.x += rasenganSpeed * 0.2;
      
      // Rotate rasengan glow meshes as well
      rasenganGlowMeshes.forEach(glowMesh => {
        glowMesh.rotation.y += rasenganSpeed;
        glowMesh.rotation.x += rasenganSpeed * 0.2;
      });
    }

    controls.enabled = !monitorOpen;

    if (direction.lengthSq() > 0) {
      direction.normalize();

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, camera.up).normalize();

      const moveVec = new THREE.Vector3();
      moveVec.addScaledVector(forward, direction.z * moveSpeed);
      moveVec.addScaledVector(right, direction.x * moveSpeed);

      camera.position.add(moveVec);
      controls.target.add(moveVec);
    }
  }

  // Animate S2 purple glow effect
  if (S2Rendered && s2GlowMeshes.length > 0) {
    glowTime += 0.016; // Assuming 60fps
    const glowOpacity = 0.3 + Math.sin(glowTime * 2) * 0.2; // Pulsing opacity for outline
    
    // Animate glow outline opacity and scale
    s2GlowMeshes.forEach(glowMesh => {
      glowMesh.material.opacity = glowOpacity;
      const scale = 1.06 + Math.sin(glowTime * 2.5) * 0.02; // Slight breathing effect
      glowMesh.scale.setScalar(scale);
    });
    
    // Also animate the purple point light intensity
    s2GlowLight.intensity = 1.5 + Math.sin(glowTime * 2) * 0.8;
  }

  // Animate rasengan blue glow effect
  if (rasenganGlowMeshes.length > 0) {
    const rasenganGlowOpacity = 0.4 + Math.sin(glowTime * 3) * 0.2; // Pulsing opacity for outline
    
    // Animate rasengan glow outline opacity and scale
    rasenganGlowMeshes.forEach(glowMesh => {
      glowMesh.material.opacity = rasenganGlowOpacity;
      const scale = 1.08 + Math.sin(glowTime * 3.5) * 0.03; // Slight breathing effect
      glowMesh.scale.setScalar(scale);
    });
    
    // Also animate the blue point light intensity
    rasenganGlowLight.intensity = 1.2 + Math.sin(glowTime * 3) * 0.6;
  }

  // Animate Susanoo purple glow effect
  if (susanooVisible && susanooGlowMeshes.length > 0) {
    const susanooGlowOpacity = 0.5 + Math.sin(glowTime * 1.5) * 0.3; // Pulsing opacity for outline
    
    // Animate Susanoo glow outline opacity and scale
    susanooGlowMeshes.forEach(glowMesh => {
      glowMesh.material.opacity = susanooGlowOpacity;
      const scale = 1.05 + Math.sin(glowTime * 2) * 0.025; // Slight breathing effect
      glowMesh.scale.setScalar(scale);
    });
    
    // Also animate the purple point light intensity
    susanooGlowLight.intensity = 2.5 + Math.sin(glowTime * 1.5) * 1.2;
  }

  updateSmokeEffect();
  controls.update();
  
  // Use standard renderer instead of composer
  renderer.render(scene, camera);
}

animate();