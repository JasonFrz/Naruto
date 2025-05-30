import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 3.5, 5);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;

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

const s2GlowLight = new THREE.PointLight(0x9966ff, 2, 30, 0.3);
s2GlowLight.visible = false;
scene.add(s2GlowLight);

const rasenganGlowLight = new THREE.PointLight(0x0088ff, 1.5, 25, 0.4);
rasenganGlowLight.visible = false;
scene.add(rasenganGlowLight);

const susanooGlowLight = new THREE.PointLight(0x6600cc, 3, 40, 0.5);
susanooGlowLight.visible = false;
scene.add(susanooGlowLight);

// --- Raycaster and mouse ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- AMBIL ELEMEN CROSSHAIR ---
const crosshair = document.getElementById('crosshair');

// --- Models & State ---
let ceilingLamp = null;
let monitor = null;
let lampOn = false;
let monitorOpen = false;
let cameraLocked = false;
let S2 = null;
let S2Loaded = false;
let S2Rendered = false;
let s2GlowMeshes = [];

let isRasengan = true;
let rasenganModel = null;
let rasenshurikenModel = null;
let rasengan = null;
let rasenganSpinning = false;
const rasenganSpeed = 0.12;
let rasenganGlowMeshes = [];
let sasukeModel = null;
let gamaBunta = null;
let narutoModel = null;
let gamaBuntaVisible = false;
let smokeParticles = [];
let isSpawning = false;

let susanooModel = null;
let susanooLoaded = false;
let susanooVisible = false;
let susanooGlowMeshes = [];

const desktopUI = document.getElementById('desktopUI');
const shutdownBtn = document.getElementById('shutdownBtn');
const ninjaInfo = document.getElementById('ninjaInfo');

// --- Pointer Lock & Mouse Look ---
let isPointerLocked = false;
const mouseLookSensitivity = 0.002;
const pitchLimit = Math.PI / 2 - 0.01;

function onMouseMove(event) {
    if (isPointerLocked && !cameraLocked) {
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        camera.rotation.y -= movementX * mouseLookSensitivity; // Yaw
        camera.rotation.x -= movementY * mouseLookSensitivity; // Pitch
        camera.rotation.x = Math.max(-pitchLimit, Math.min(pitchLimit, camera.rotation.x));
    }
}

function onPointerLockChange() {
    if (document.pointerLockElement === renderer.domElement) {
        console.log('Pointer Locked');
        isPointerLocked = true;
        if (crosshair) crosshair.style.display = 'block'; // Tampilkan crosshair
        controls.enabled = false;
    } else {
        console.log('Pointer Unlocked');
        isPointerLocked = false;
        if (crosshair) crosshair.style.display = 'none'; // Sembunyikan crosshair
        if (!cameraLocked) {
             controls.enabled = true;
        }
    }
}

function onPointerLockError() {
    console.error('Pointer Lock Error');
    isPointerLocked = false;
    if (crosshair) crosshair.style.display = 'none'; // Sembunyikan juga jika error
    if (!cameraLocked) {
        controls.enabled = true;
    }
}

document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('pointerlockchange', onPointerLockChange, false);
document.addEventListener('pointerlockerror', onPointerLockError, false);

renderer.domElement.addEventListener('click', () => {
    if (!isPointerLocked && !monitorOpen) {
        renderer.domElement.requestPointerLock();
    }
});

shutdownBtn.addEventListener('click', () => {
  desktopUI.style.display = 'none';
  monitorOpen = false;
  cameraLocked = false;
  ninjaInfo.style.display = 'none';
  if (S2Rendered && S2) {
    removeGlowFromS2();
    scene.remove(S2);
    S2Rendered = false;
  }
  if (!isPointerLocked) {
    controls.enabled = true;
  }
  // Jika pointer terkunci, crosshair akan hilang via onPointerLockChange saat exitPointerLock
  // Jika tidak, pastikan tetap hilang jika sebelumnya monitor dibuka
  if (crosshair && !isPointerLocked) crosshair.style.display = 'none';
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
    if (callback) callback();
    return;
  }

  smokeParticles.forEach(particle => {
    scene.remove(particle);
    particle.geometry.dispose();
    particle.material.dispose();
  });
  smokeParticles = [];

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
    if (isSusanooSummon) {
      callback();
    } else {
      setTimeout(callback, 3000);
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
      particle.geometry.dispose();
      particle.material.dispose();
      smokeParticles.splice(index, 1);
    }
  });
}

function addGlowToS2() {
  if (!S2) return;
  S2.traverse((child) => {
    if (child.isMesh) {
      const glowGeometry = child.geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x9966ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.scale.multiplyScalar(1.06);
      glowMesh.position.copy(child.position);
      glowMesh.rotation.copy(child.rotation);
      if (child.parent) {
        child.parent.add(glowMesh);
      } else {
        scene.add(glowMesh);
      }
      s2GlowMeshes.push(glowMesh);
    }
  });
  s2GlowLight.position.copy(S2.position);
  s2GlowLight.visible = true;
}

function removeGlowFromS2() {
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

function addGlowToRasengan() {
  if (!rasengan) return;
  removeGlowFromRasengan();
  rasengan.traverse((child) => {
    if (child.isMesh) {
      const glowGeometry = child.geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.scale.multiplyScalar(1.08);
      glowMesh.position.copy(child.position);
      glowMesh.rotation.copy(child.rotation);
      if (child.parent) {
        child.parent.add(glowMesh);
      } else {
        scene.add(glowMesh);
      }
      rasenganGlowMeshes.push(glowMesh);
    }
  });
  if (rasengan) rasenganGlowLight.position.copy(rasengan.position);
  rasenganGlowLight.visible = true;
}

function removeGlowFromRasengan() {
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

function addGlowToSusanoo() {
  if (!susanooModel) return;
  susanooModel.traverse((child) => {
    if (child.isMesh) {
      const glowGeometry = child.geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6600cc,
        transparent: true,
        opacity: 0.6,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.scale.multiplyScalar(1.05);
      glowMesh.position.copy(child.position);
      glowMesh.rotation.copy(child.rotation);
      if (child.parent) {
        child.parent.add(glowMesh);
      } else {
        scene.add(glowMesh);
      }
      susanooGlowMeshes.push(glowMesh);
    }
  });
  if (susanooModel) susanooGlowLight.position.copy(susanooModel.position);
  susanooGlowLight.visible = true;
}

function removeGlowFromSusanoo() {
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

const loader = new GLTFLoader();

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
          });
        } else {
          obj.material.shadowSide = THREE.DoubleSide;
        }
      }
    }
  });
  ceilingLamp = model.getObjectByName("model_1");
  monitor = model.getObjectByName("model_2");
  console.log("Ceiling lamp found:", !!ceilingLamp, "Monitor found:", !!monitor);
});

loader.load('../glb/naruto.glb', gltf => {
  narutoModel = gltf.scene;
  narutoModel.position.set(0, 0, 0);
  narutoModel.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => { mat.shadowSide = THREE.DoubleSide; });
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
    gamaBunta.rotation.set(0, Math.PI / 180 * 89.7, 0);
    gamaBunta.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => { mat.shadowSide = THREE.DoubleSide; });
          } else {
            obj.material.shadowSide = THREE.DoubleSide;
          }
        }
      }
    });
    console.log('Gama Bunta loaded, press E to summon!');
  }, undefined, console.error);
});

loader.load('../glb/sasuke.glb', gltf => {
  sasukeModel = gltf.scene;
  sasukeModel.position.set(0, 1, -15);
  sasukeModel.scale.set(2.7, 2.7, 2.7);
  sasukeModel.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(sasukeModel);
  console.log('Model Sasuke berhasil dimuat, click to activate Susanoo!');
}, undefined, error => {
  console.error('Gagal memuat model Sasuke:', error);
});

loader.load('../glb/susanoo.glb', gltf => {
  susanooModel = gltf.scene;
  susanooModel.position.set(0, 3, -15);
  susanooModel.scale.set(0.07, 0.07, 0.07);
  susanooModel.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => { mat.shadowSide = THREE.DoubleSide; });
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
      model.scale.set(2.5, 2.5, 2.5);
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

loader.load('../glb/S2.glb', gltf => {
  S2 = gltf.scene;
  S2.position.set(0, 0, 0);
  S2Loaded = true;
  console.log('S2 model loaded, waiting for monitor click to render...');
}, undefined, error => {
  console.error('Error loading S2 model:', error);
});

loadRasenganModel().then(model => {
  rasenganModel = model;
  rasengan = rasenganModel;
  scene.add(rasengan);
  addGlowToRasengan();
}).catch(console.error);

window.addEventListener('click', event => {
  if (monitorOpen) return;

  if (isPointerLocked) {
    mouse.x = 0;
    mouse.y = 0;
  } else {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  raycaster.setFromCamera(mouse, camera);

  const clickableObjects = [ceilingLamp, monitor, narutoModel, sasukeModel];
  if (rasengan) clickableObjects.push(rasengan);

  const intersects = raycaster.intersectObjects(clickableObjects.filter(Boolean), true);
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    let currentObject = clickedObject;
    let targetName = null;

    while(currentObject) {
        if (currentObject === ceilingLamp) { targetName = "ceilingLamp"; break; }
        if (currentObject === monitor) { targetName = "monitor"; break; }
        if (narutoModel && (currentObject === narutoModel || isChildOf(currentObject, narutoModel))) {
            targetName = "narutoModel"; break;
        }
        if (sasukeModel && (currentObject === sasukeModel || isChildOf(currentObject, sasukeModel))) {
            targetName = "sasukeModel"; break;
        }
        if (rasengan && (currentObject === rasengan || isChildOf(currentObject, rasengan))) {
            targetName = "rasengan"; break;
        }
        currentObject = currentObject.parent;
    }

    switch(targetName) {
      case "narutoModel":
        rasenganSpinning = !rasenganSpinning;
        console.log("Naruto clicked! Rasengan spinning:", rasenganSpinning);
        break;

      case "sasukeModel":
        if (susanooLoaded) {
          if (susanooVisible) {
            removeGlowFromSusanoo();
            if(susanooModel.parent) scene.remove(susanooModel);
            susanooVisible = false;
            console.log("Susanoo deactivated!");
          } else {
            createSmokeEffect(sasukeModel.position, () => {
              scene.add(susanooModel);
              addGlowToSusanoo();
              susanooVisible = true;
              console.log("Susanoo activated!");
            }, true);
          }
        } else {
          console.log("Susanoo model not loaded yet!");
        }
        break;

      case "ceilingLamp":
        lampOn = !lampOn;
        pointLight.visible = lampOn;
        hemiLight.visible = lampOn;
        dirLight.visible = lampOn;
        ambientLight.intensity = lampOn ? 0.3 : 0.05;
        scene.background = new THREE.Color(lampOn ? 0x333333 : 0x000000);
        break;

      case "monitor":
        desktopUI.style.display = 'block';
        monitorOpen = true;
        cameraLocked = true;
        controls.enabled = false;
        if (document.pointerLockElement) {
            document.exitPointerLock();
        } else {
            if (crosshair) crosshair.style.display = 'none';
        }
        if (S2Loaded && !S2Rendered) {
          scene.add(S2);
          addGlowToS2();
          S2Rendered = true;
          console.log('S2 model rendered to scene with purple glow effect!');
        }
        break;

      case "rasengan":
        if (rasengan) {
            if(rasengan.parent) scene.remove(rasengan);
            removeGlowFromRasengan();
            rasengan = null;
        }
        if (isRasengan) {
          loadRasenshurikenModel().then(model => {
            rasenshurikenModel = model;
            rasengan = rasenshurikenModel;
            scene.add(rasengan);
            addGlowToRasengan();
          }).catch(console.error);
        } else {
          loadRasenganModel().then(model => {
            rasenganModel = model;
            rasengan = rasenganModel;
            scene.add(rasengan);
            addGlowToRasengan();
          }).catch(console.error);
        }
        isRasengan = !isRasengan;
        break;
    }
  }
});

function isChildOf(object, parentModel) {
  if (!parentModel) return false;
  let parent = object.parent;
  while (parent) {
    if (parent === parentModel) return true;
    parent = parent.parent;
  }
  return false;
}

const moveSpeed = 0.05;
const moveMultiplier = 12;
const move = { forward: false, backward: false, left: false, right: false };

window.addEventListener('keydown', e => {
  if (monitorOpen) return;
  switch(e.key.toLowerCase()) {
    case 'w': move.forward = true; break;
    case 's': move.backward = true; break;
    case 'a': move.left = true; break;
    case 'd': move.right = true; break;
    case 'e':
      if (gamaBunta && !isSpawning) {
        if (gamaBuntaVisible) {
          if(gamaBunta.parent) scene.remove(gamaBunta);
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
  if (monitorOpen) return;
  switch(e.key.toLowerCase()) {
    case 'w': move.forward = false; break;
    case 's': move.backward = false; break;
    case 'a': move.left = false; break;
    case 'd': move.right = false; break;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let glowTime = 0;

function animate() {
  requestAnimationFrame(animate);

  if (!cameraLocked) {
    const direction = new THREE.Vector3();

    if (move.forward) direction.z += moveMultiplier;
    if (move.backward) direction.z -= moveMultiplier;
    if (move.left) direction.x -= moveMultiplier;
    if (move.right) direction.x += moveMultiplier;

    if (direction.lengthSq() > 0) {
        direction.normalize();

        const worldDirection = new THREE.Vector3();
        camera.getWorldDirection(worldDirection);
        worldDirection.y = 0;
        worldDirection.normalize();

        const rightDirection = new THREE.Vector3();
        rightDirection.crossVectors(camera.up, worldDirection).normalize().negate();

        const moveVec = new THREE.Vector3();
        moveVec.addScaledVector(worldDirection, direction.z * moveSpeed);
        moveVec.addScaledVector(rightDirection, direction.x * moveSpeed);
        
        camera.position.add(moveVec);
        
        if (controls.enabled) {
            controls.target.add(moveVec);
        }
    }
  }

  if (rasengan && rasenganSpinning) {
    rasengan.rotation.y += rasenganSpeed;
    rasengan.rotation.x += rasenganSpeed * 0.2;
    rasenganGlowMeshes.forEach(glowMesh => {
      glowMesh.rotation.y += rasenganSpeed;
      glowMesh.rotation.x += rasenganSpeed * 0.2;
    });
  }

  if (S2Rendered && s2GlowMeshes.length > 0) {
    glowTime += 0.016;
    const glowOpacity = 0.3 + Math.sin(glowTime * 2) * 0.2;
    s2GlowMeshes.forEach(glowMesh => {
      glowMesh.material.opacity = glowOpacity;
      const scale = 1.06 + Math.sin(glowTime * 2.5) * 0.02;
      glowMesh.scale.setScalar(scale);
    });
    s2GlowLight.intensity = 1.5 + Math.sin(glowTime * 2) * 0.8;
  }

  if (rasenganGlowMeshes.length > 0) {
    const rasenganGlowOpacity = 0.4 + Math.sin(glowTime * 3) * 0.2;
    rasenganGlowMeshes.forEach(glowMesh => {
      glowMesh.material.opacity = rasenganGlowOpacity;
      const scale = 1.08 + Math.sin(glowTime * 3.5) * 0.03;
      glowMesh.scale.setScalar(scale);
    });
    rasenganGlowLight.intensity = 1.2 + Math.sin(glowTime * 3) * 0.6;
  }

  if (susanooVisible && susanooGlowMeshes.length > 0) {
    const susanooGlowOpacity = 0.5 + Math.sin(glowTime * 1.5) * 0.3;
    susanooGlowMeshes.forEach(glowMesh => {
      glowMesh.material.opacity = susanooGlowOpacity;
      const scale = 1.05 + Math.sin(glowTime * 2) * 0.025;
      glowMesh.scale.setScalar(scale);
    });
    susanooGlowLight.intensity = 2.5 + Math.sin(glowTime * 1.5) * 1.2;
  }

  updateSmokeEffect();
  if (controls.enabled) {
      controls.update();
  }
  renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
    if (crosshair) {
        crosshair.style.display = 'none';
    }
});

animate();