import *as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Starts dark (night mode)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 12, 5);
camera.rotation.order = 'YXZ';
let isFirstPositionActive = true;
camera.lookAt(new THREE.Vector3(0, 3, 0));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); // Dim for night
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 8, 50, 0.5);
pointLight.position.set(0, 12, 0);
pointLight.visible = false;
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
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

const sphereLampSize = 5;
const centerSphereGeometry = new THREE.SphereGeometry(sphereLampSize, 32, 32);
const centerSphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 1.0
});


const centerSphereMesh = new THREE.Mesh(centerSphereGeometry, centerSphereMaterial);
centerSphereMesh.position.set(3.7, sphereLampSize + 14.8, 3.55);
scene.add(centerSphereMesh);

const centerSphereLight = new THREE.PointLight(0xffddaa, 7, 60, 0.9);
const lightOffsetY = 1.2;
centerSphereLight.position.set(
    centerSphereMesh.position.x,
    centerSphereMesh.position.y - lightOffsetY,
    centerSphereMesh.position.z
);
centerSphereLight.castShadow = true;
centerSphereLight.visible = true;
centerSphereLight.shadow.mapSize.width = 1024;
centerSphereLight.shadow.mapSize.height = 1024;
centerSphereLight.shadow.camera.near = 0.5;
centerSphereLight.shadow.camera.far = 70;
centerSphereLight.shadow.bias = -0.005;
centerSphereLight.shadow.normalBias = 0.05;
scene.add(centerSphereLight);

const s2GlowLight = new THREE.PointLight(0x9966ff, 2, 30, 0.3);
s2GlowLight.visible = false;
scene.add(s2GlowLight);

const rasenganGlowLight = new THREE.PointLight(0x0088ff, 50, 50, 1);
rasenganGlowLight.visible = false;
scene.add(rasenganGlowLight);

const susanooGlowLight = new THREE.PointLight(0x6600cc, 3, 40, 0.5);
susanooGlowLight.visible = false;
scene.add(susanooGlowLight);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const crosshair = document.getElementById('crosshair');

let ceilingLamp = null;
let monitor = null;
let lampOn = false;
let centerSphereLightOn = true;

let monitorOpen = false;
let cameraLocked = false;
let S2 = null, S2Loaded = false, S2Rendered = false, s2GlowMeshes = [];

// Variabel state untuk Rasengan
let isRasengan = true; // true jika model saat ini adalah rasengan.glb, false jika rasenshuriken.glb
let rasenganModel = null; // Referensi ke model rasengan.glb (untuk penggunaan spesifik jika perlu)
let rasengan = null; // Variabel umum untuk menunjuk ke model rasengan/rasenshuriken yang aktif
let rasenganSpinning = false, rasenganGlowMeshes = [];
const rasenganSpeed = 0.12;

let rasenganOrbitRadius = 6;
let rasenganOrbitSpeed = 1.0;
let rasenganOrbitAngle = 0;
let rasenganBasePosition = null;

// State untuk Cho Odama Rasengan dan siklus klik
let rasenganIsChoOdama = false;
let currentRasenganBaseScale = new THREE.Vector3(1, 1, 1);
const choOdamaScaleMultiplier = 1.8;
let nextClickOnNormalRasenganChangesModel = false; // BARU: Jika true, klik pada Rasengan normal akan ganti model, jika false akan jadi Cho Odama.


let sasukeModel = null, gamaBunta = null, narutoModel = null, gamaBuntaVisible = false;
let smokeParticles = [], isSpawning = false;
let susanooModel = null, susanooLoaded = false, susanooVisible = false, susanooGlowMeshes = [];

const desktopUI = document.getElementById('desktopUI');
const shutdownBtn = document.getElementById('shutdownBtn');
const ninjaInfo = document.getElementById('ninjaInfo');

let isPointerLocked = false;
const mouseLookSensitivity = 0.002;
const pitchLimit = Math.PI / 2 - 0.01;

function onMouseMove(event) {
    if (isPointerLocked && !cameraLocked) {
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        camera.rotation.y -= movementX * mouseLookSensitivity;
        camera.rotation.x -= movementY * mouseLookSensitivity;
        camera.rotation.x = Math.max(-pitchLimit, Math.min(pitchLimit, camera.rotation.x));
    }
}

function onPointerLockChange() {
    isPointerLocked = (document.pointerLockElement === renderer.domElement);
    if (crosshair) crosshair.style.display = isPointerLocked ? 'block' : 'none';
    console.log('Pointer Locked:', isPointerLocked);
}

function onPointerLockError() {
    console.error('Pointer Lock Error');
    isPointerLocked = false;
    if (crosshair) crosshair.style.display = 'none';
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
        if(S2.parent) scene.remove(S2);
        S2Rendered = false;
    }
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
    smokeTexture = texture; console.log('Smoke texture loaded.');
}, undefined, (error) => console.error('Error loading smoke texture:', error));

function createSmokeEffect(position, callback, isSusanooSummon = false) {
    if (!smokeTexture) {
        console.warn('Smoke texture not loaded.'); if (callback) callback(); return;
    }
    smokeParticles.forEach(p => { scene.remove(p); p.geometry.dispose(); p.material.dispose(); });
    smokeParticles = [];
    if (!isSusanooSummon) {
        for (let i = 0; i < 25; i++) {
            const smokeGeo = new THREE.PlaneGeometry(700, 700);
            const smokeMat = new THREE.MeshBasicMaterial({ map: smokeTexture, transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
            const p = new THREE.Mesh(smokeGeo, smokeMat);
            p.position.set(position.x + (Math.random() - 0.5) * 20, position.y + Math.random() * 8, position.z + (Math.random() - 0.5) * 20);
            p.rotation.z = Math.random() * Math.PI * 2;
            p.userData = { initialY: p.position.y, speed: 0.08 + Math.random() * 0.07, rotSpeed: (Math.random() - 0.5) * 0.03, lifeTime: 360, age: 0 };
            scene.add(p); smokeParticles.push(p);
        }
    }
    if (callback) { isSusanooSummon ? callback() : setTimeout(callback, 3000); }
}

function updateSmokeEffect() {
    smokeParticles.forEach((p, index) => {
        p.userData.age++; p.position.y += p.userData.speed;
        p.rotation.x += p.userData.rotSpeed; p.rotation.y += p.userData.rotSpeed; p.rotation.z += p.userData.rotSpeed;
        const lifeRatio = p.userData.age / p.userData.lifeTime;
        p.material.opacity = 0.8 * (1 - lifeRatio);
        const scale = 1 + lifeRatio * 1.5; p.scale.set(scale, scale, scale);
        if (p.userData.age >= p.userData.lifeTime) {
            scene.remove(p); p.geometry.dispose(); p.material.dispose(); smokeParticles.splice(index, 1);
        }
    });
}

function createGlowMesh(child, color, scaleFactor, initialOpacity = 0.4, blending = THREE.NormalBlending) {
    const glowGeometry = child.geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: initialOpacity,
        side: THREE.BackSide, depthWrite: false, blending: blending
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);

    if (child.parent) {
        child.parent.add(glowMesh);
        glowMesh.position.copy(child.position);
        glowMesh.quaternion.copy(child.quaternion);
        glowMesh.scale.copy(child.scale).multiplyScalar(scaleFactor);
    } else {
        scene.add(glowMesh);
        glowMesh.position.copy(child.position);
        glowMesh.rotation.copy(child.rotation);
        glowMesh.scale.multiplyScalar(scaleFactor);
    }
    return glowMesh;
}

function addGlowToS2() {
    if (!S2) return; removeGlowFromS2();
    S2.traverse((child) => { if (child.isMesh) s2GlowMeshes.push(createGlowMesh(child, 0x9966ff, 1.06, 0.4)); });
    if (S2.parent) s2GlowLight.position.setFromMatrixPosition(S2.matrixWorld); else s2GlowLight.position.copy(S2.position);
    s2GlowLight.visible = true;
}
function removeGlowFromS2() {
    s2GlowMeshes.forEach(gm => { if (gm.parent) gm.parent.remove(gm); else scene.remove(gm); gm.geometry.dispose(); gm.material.dispose(); });
    s2GlowMeshes = []; s2GlowLight.visible = false;
}

function addGlowToRasengan() {
    if (!rasengan) {
        console.warn("addGlowToRasengan called but rasengan model is null.");
        rasenganGlowLight.visible = false;
        return;
    }
    rasenganGlowMeshes.forEach(gm => {
        if (gm.parent) gm.parent.remove(gm); else scene.remove(gm);
        gm.geometry.dispose(); gm.material.dispose();
    });
    rasenganGlowMeshes = [];

    if (rasengan.parent) rasenganGlowLight.position.setFromMatrixPosition(rasengan.matrixWorld);
    else rasenganGlowLight.position.copy(rasengan.position);

    rasenganGlowLight.visible = true;
    rasenganGlowLight.intensity = 50;
}
function removeGlowFromRasengan() {
    rasenganGlowMeshes.forEach(gm => {
        if (gm.parent) gm.parent.remove(gm);
        else scene.remove(gm);
        gm.geometry.dispose();
        gm.material.dispose();
    });
    rasenganGlowMeshes = [];
    rasenganGlowLight.visible = false;
    console.log("Rasengan glow (light) removed.");
}

function addGlowToSusanoo() {
    if (!susanooModel) return; removeGlowFromSusanoo();
    susanooModel.traverse((child) => { if (child.isMesh) susanooGlowMeshes.push(createGlowMesh(child, 0x6600cc, 1.05, 0.6)); });
    if (susanooModel.parent) susanooGlowLight.position.setFromMatrixPosition(susanooModel.matrixWorld); else susanooGlowLight.position.copy(susanooModel.position);
    susanooGlowLight.visible = true;
    susanooGlowLight.intensity = 3.0;
}
function removeGlowFromSusanoo() {
    susanooGlowMeshes.forEach(gm => { if (gm.parent) gm.parent.remove(gm); else scene.remove(gm); gm.geometry.dispose(); gm.material.dispose(); });
    susanooGlowMeshes = []; susanooGlowLight.visible = false;
}

const loader = new GLTFLoader();
loader.load('../glb/narutoandroom.glb', gltf => {
    const model = gltf.scene; scene.add(model);
    model.traverse(obj => {
        if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true;
            if (obj.material) { const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(mat => mat.shadowSide = THREE.FrontSide); }
        }
    });
    ceilingLamp = model.getObjectByName("model_1"); monitor = model.getObjectByName("model_2");
    console.log("Main scene loaded. Lamp:", !!ceilingLamp, "Monitor:", !!monitor);
});
loader.load('../glb/naruto.glb', gltf => {
    narutoModel = gltf.scene; narutoModel.position.set(0, 0, 0);
    narutoModel.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; if (obj.material) { const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(mat => mat.shadowSide = THREE.FrontSide);}}});
    scene.add(narutoModel); console.log('Naruto model loaded.');
    loader.load('../glb/kodok.glb', gltf => {
        gamaBunta = gltf.scene;
        gamaBunta.position.set(-230, -80, 0);
        gamaBunta.scale.set(0.21, 0.21, 0.21);
        gamaBunta.rotation.set(0, Math.PI / 180 * 89.7, 0);
        gamaBunta.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; if (obj.material) { const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(mat => mat.shadowSide = THREE.FrontSide);}}});
        console.log('Gama Bunta loaded at fixed position.');
    }, undefined, e => console.error('Error loading Gama Bunta:', e));
}, undefined, e => console.error('Error loading Naruto:', e));
loader.load('../glb/sasuke.glb', gltf => {
    sasukeModel = gltf.scene; sasukeModel.position.set(0, 1, -15); sasukeModel.scale.set(2.6, 2.6, 2.6);
    sasukeModel.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    scene.add(sasukeModel); console.log('Sasuke model loaded.');
}, undefined, e => console.error('Error loading Sasuke:', e));
loader.load('../glb/susanoo.glb', gltf => {
    susanooModel = gltf.scene; susanooModel.scale.set(0.07, 0.07, 0.07);
    susanooModel.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; if (obj.material) { const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(mat => mat.shadowSide = THREE.FrontSide);}}});
    susanooLoaded = true; console.log('Susanoo model loaded.');
}, undefined, e => console.error('Error loading Susanoo:', e));

function loadDynamicModel(path, position, scale = null) {
    console.log(`Attempting to load dynamic model: ${path}`);
    return new Promise((resolve, reject) => {
        loader.load(path, gltf => {
            const model = gltf.scene; model.position.copy(position);
            if (scale) model.scale.copy(scale);
            model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
            console.log(`Successfully loaded: ${path}`);
            resolve(model);
        },
        (xhr) => { console.log(`${path} ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`); },
        error => {
            console.error(`Error loading model ${path}:`, error);
            reject(error);
        });
    });
}

const initialRasenganPosition = new THREE.Vector3(-8.8, 9.9, 13.9);
loadDynamicModel('../glb/rasengan.glb', initialRasenganPosition, null).then(model => {
    rasenganModel = model;
    rasengan = rasenganModel;
    rasenganBasePosition = initialRasenganPosition.clone();
    currentRasenganBaseScale.copy(rasengan.scale);
    scene.add(rasengan);
    addGlowToRasengan();
    console.log('Initial Rasengan loaded and glow added. Click to make Cho Odama.');
    isRasengan = true;
    rasenganIsChoOdama = false;
    nextClickOnNormalRasenganChangesModel = false; // Setelah load awal, klik pertama adalah untuk membesar
}).catch(e => {
    console.error('FATAL: Error loading initial Rasengan:', e);
    rasengan = null;
    rasenganBasePosition = null;
    isRasengan = true;
    rasenganIsChoOdama = false;
    nextClickOnNormalRasenganChangesModel = false;
});

loader.load('../glb/S2.glb', gltf => {
    S2 = gltf.scene; S2.position.set(0,0,0); S2Loaded = true; console.log('S2 model loaded.');
}, undefined, e => console.error('Error loading S2:', e));


window.addEventListener('click', event => {
    if (monitorOpen) return;
    if (isPointerLocked && !cameraLocked) { mouse.x = 0; mouse.y = 0; }
    else if (!isPointerLocked && !cameraLocked) { renderer.domElement.requestPointerLock(); return; }
    else { console.log("Click ignored: pointer/camera state."); return; }

    raycaster.setFromCamera(mouse, camera);
    const clickables = [ceilingLamp, monitor, narutoModel, sasukeModel, rasengan].filter(Boolean);

    let targetName = null;
    const intersects = raycaster.intersectObjects(clickables, true);

    if (intersects.length > 0) {
        let clickedRootObject = intersects[0].object;
        for(const obj of clickables) {
            if (obj === clickedRootObject || isChildOf(clickedRootObject, obj)) {
                if (obj === ceilingLamp) targetName = "ceilingLamp";
                else if (obj === monitor) targetName = "monitor";
                else if (obj === narutoModel) targetName = "narutoModel";
                else if (obj === sasukeModel) targetName = "sasukeModel";
                else if (obj === rasengan) {
                    targetName = "rasengan";
                }
                break;
            }
        }
    } else {
        targetName = null;
    }

    switch (targetName) {
        case "narutoModel":
            rasenganSpinning = !rasenganSpinning;
            console.log("Rasengan spinning & orbiting toggled:", rasenganSpinning);
            if (!rasengan && rasenganSpinning) {
                console.warn("Trying to spin a non-existent Rasengan. Load it first.");
                rasenganSpinning = false;
            }
            break;
        case "sasukeModel":
            if (susanooLoaded && sasukeModel) {
                if (susanooVisible) {
                    removeGlowFromSusanoo(); if (susanooModel.parent) scene.remove(susanooModel); susanooVisible = false; console.log("Susanoo deactivated.");
                } else {
                    susanooModel.position.copy(sasukeModel.position).y += 1.5;
                    createSmokeEffect(sasukeModel.position, () => {
                        scene.add(susanooModel); addGlowToSusanoo(); susanooVisible = true; console.log("Susanoo activated.");
                    }, true);
                }
            } else console.log("Susanoo/Sasuke model not ready.");
            break;
        case "ceilingLamp":
            lampOn = !lampOn;
            centerSphereLightOn = !lampOn;

            pointLight.visible = lampOn;
            hemiLight.visible = lampOn;
            dirLight.visible = lampOn;
            ambientLight.intensity = lampOn ? 0.3 : 0.05;
            scene.background = new THREE.Color(lampOn ? 0x333333 : 0x000000);

            centerSphereLight.visible = centerSphereLightOn;
            centerSphereLight.intensity = centerSphereLightOn ? 7 : 0;
            centerSphereMesh.material.emissiveIntensity = centerSphereLightOn ? 1.0 : 0.1;

            console.log("Main Lamp ON:", lampOn, "Sphere Lamp ON:", centerSphereLightOn);
            break;
        case "monitor":
            desktopUI.style.display = 'block'; monitorOpen = true; cameraLocked = true;
            if (document.pointerLockElement) document.exitPointerLock();
            if (crosshair) crosshair.style.display = 'none';
            if (S2Loaded && !S2Rendered && S2) { scene.add(S2); addGlowToS2(); S2Rendered = true; console.log('S2 rendered.'); }
            break;
        case "rasengan":
            if (rasengan && rasengan.parent) {
                if (rasenganIsChoOdama) {
                    // Saat ini Cho Odama, kembalikan ke ukuran normal
                    rasengan.scale.copy(currentRasenganBaseScale);
                    rasenganIsChoOdama = false;
                    // MODIFIKASI: Set agar klik berikutnya kembali membesarkan, bukan ganti model
                    nextClickOnNormalRasenganChangesModel = false; 
                    // MODIFIKASI LOG: Sesuaikan pesan log
                    console.log(`Model ${isRasengan ? 'Rasengan' : 'Rasenshuriken'} kembali ke ukuran normal. Klik lagi untuk menjadi Cho Odama.`);
                    addGlowToRasengan(); // Perbarui glow
                } else {
                    // Saat ini ukuran normal, cek apakah mau membesar atau ganti model
                    // Karena nextClickOnNormalRasenganChangesModel akan selalu false dalam siklus ini,
                    // maka blok 'if' di bawah ini untuk ganti model tidak akan tercapai melalui klik Rasengan.
                    if (nextClickOnNormalRasenganChangesModel) { 
                        // Bagian ini (ganti model) tidak akan dieksekusi karena perubahan di atas.
                        // Kode tetap ada, namun tidak akan dijangkau oleh klik rasengan untuk siklus Odama.
                        if (rasengan.parent) scene.remove(rasengan);
                        removeGlowFromRasengan();
                        rasengan = null;
                        rasenganBasePosition = null;

                        const loadRasenshurikenNext = isRasengan; // Jika saat ini Rasengan, berikutnya Rasenshuriken
                        const modelToLoad = loadRasenshurikenNext ? 'rasenshuriken' : 'rasengan';
                        const modelPath = `../glb/${modelToLoad}.glb`;
                        const newPos = loadRasenshurikenNext
                            ? new THREE.Vector3(-8.8, 11.2, 13.9) // Posisi Rasenshuriken
                            : new THREE.Vector3(-8.8, 9.9, 13.9);  // Posisi Rasengan
                        const newScaleForModel = loadRasenshurikenNext
                            ? new THREE.Vector3(2.5, 2.5, 2.5)     // Skala dasar Rasenshuriken
                            : null;                                // Skala dasar Rasengan (gunakan default)

                        console.log(`Mengganti model. Memuat ${modelToLoad}.`);
                        loadDynamicModel(modelPath, newPos, newScaleForModel).then(loadedModel => {
                            rasengan = loadedModel;
                            if (newScaleForModel) {
                                currentRasenganBaseScale.copy(newScaleForModel);
                            } else {
                                currentRasenganBaseScale.copy(rasengan.scale); // Ambil skala dari model yang di-load
                            }
                            rasenganBasePosition = newPos.clone();
                            scene.add(rasengan);
                            addGlowToRasengan();

                            isRasengan = !loadRasenshurikenNext; // Perbarui state model saat ini
                            rasenganIsChoOdama = false;         // Model baru selalu ukuran normal
                            nextClickOnNormalRasenganChangesModel = false; // Setelah ganti model, klik berikutnya adalah untuk membesar
                            console.log(`${modelToLoad} dimuat. Model dasar saat ini: ${isRasengan ? 'Rasengan' : 'Rasenshuriken'}. Klik berikutnya akan jadi Cho Odama.`);
                        }).catch(e => {
                            console.error(`Gagal memuat atau memproses ${modelToLoad}:`, e);
                            rasenganIsChoOdama = false;
                            nextClickOnNormalRasenganChangesModel = false; // Reset state jika error
                        });

                    } else {
                        // Saatnya membesar menjadi Cho Odama
                        rasengan.scale.copy(currentRasenganBaseScale).multiplyScalar(choOdamaScaleMultiplier);
                        rasenganIsChoOdama = true;
                        // nextClickOnNormalRasenganChangesModel tetap false, karena setelah jadi Cho Odama, klik berikutnya akan mengembalikan ke normal
                        console.log(`Model ${isRasengan ? 'Rasengan' : 'Rasenshuriken'} menjadi Cho Odama. Klik lagi untuk kembali normal.`);
                        addGlowToRasengan();
                    }
                }
            } else {
                console.log("Model Rasengan tidak tersedia untuk diinteraksi.");
                // Reset state jika tidak ada model
                rasenganIsChoOdama = false;
                nextClickOnNormalRasenganChangesModel = false;
            }
            break;
    }
});

function isChildOf(object, parentModel) {
    if (!object || !parentModel) return false; let p = object.parent;
    while (p) { if (p === parentModel) return true; p = p.parent; } return false;
}

let userMoveSpeed = 0.3;
const userShiftMoveSpeed = 0.8;

const move = { forward: false, backward: false, left: false, right: false };

window.addEventListener('keydown', e => {
    if (monitorOpen || (cameraLocked && e.key.toLowerCase() !== 't')) return;
    const key = e.key.toLowerCase();
    switch (key) {
        case 'w': move.forward = true; break;
        case 's': move.backward = true; break;
        case 'a': move.left = true; break;
        case 'd': move.right = true; break;
        case 'e':
            if (gamaBunta && !isSpawning) {
                if (gamaBuntaVisible) {
                    if (gamaBunta.parent) scene.remove(gamaBunta);
                    gamaBuntaVisible = false;
                    console.log('Gama Bunta dismissed.');
                } else {
                    isSpawning = true;
                    console.log('Summoning Gama Bunta at fixed position...');
                    createSmokeEffect(gamaBunta.position, () => {
                        scene.add(gamaBunta);
                        gamaBuntaVisible = true;
                        isSpawning = false;
                        console.log('Gama Bunta appeared.');
                    });
                }
            } break;
        case 'shift':
            userMoveSpeed = userShiftMoveSpeed;
            break;
    }
});
window.addEventListener('keyup', e => {
    if (e.key.toLowerCase() !== 't' && (monitorOpen || cameraLocked)) return;
    const key = e.key.toLowerCase();
    switch (key) {
        case 'w': move.forward = false; break;
        case 's': move.backward = false; break;
        case 'a': move.left = false; break;
        case 'd': move.right = false; break;
        case 't':
            if (isFirstPositionActive) { camera.position.set(2, 12, 5); camera.lookAt(0, 3, 0); }
            else { camera.position.set(-350, -65, 50); camera.lookAt(0, 0, 0); }
            isFirstPositionActive = !isFirstPositionActive; console.log("Cam Toggled. FP Active:", isFirstPositionActive);
            break;
        case 'shift':
            userMoveSpeed = 0.3;
            break;
    }
});
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let glowTime = 0; const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (isPointerLocked && !cameraLocked) {
        const camForward = new THREE.Vector3();
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        camForward.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camera.up, camForward).negate().normalize();

        const effectiveSpeed = userMoveSpeed;
        const moveDirection = new THREE.Vector3();

        if (move.forward) moveDirection.add(camForward);
        if (move.backward) moveDirection.sub(camForward);
        if (move.left) moveDirection.sub(camRight);
        if (move.right) moveDirection.add(camRight);

        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            camera.position.addScaledVector(moveDirection, effectiveSpeed);
        }
    }

    if (rasengan && rasenganSpinning) {
        const spinDelta = rasenganSpeed * delta * 60;
        rasengan.rotation.y += spinDelta;
        rasengan.rotation.x += spinDelta * 0.2;

        if (rasenganBasePosition) {
            rasenganOrbitAngle += rasenganOrbitSpeed * delta;
            rasengan.position.x = rasenganBasePosition.x + rasenganOrbitRadius * Math.cos(rasenganOrbitAngle);
            rasengan.position.z = rasenganBasePosition.z + rasenganOrbitRadius * Math.sin(rasenganOrbitAngle);
            rasengan.position.y = rasenganBasePosition.y;
        }
    }
    glowTime += delta;

    const updateGlowEffect = (glowMeshes, baseOpacity, opacityVar, baseScale, scaleVar, timeMult, lightObj, baseIntensity, intensityVar) => {
        if (lightObj && (lightObj.visible || intensityVar !==0)) {
             lightObj.intensity = baseIntensity + Math.sin(glowTime * timeMult) * intensityVar;
        }
        if (glowMeshes.length > 0) {
            const currentOpacity = baseOpacity + Math.sin(glowTime * timeMult) * opacityVar;
            glowMeshes.forEach(gm => {
                gm.material.opacity = currentOpacity;
            });
        }
    };

    updateGlowEffect(s2GlowMeshes, 0.3, 0.2, 1.06, 0.02, 2, s2GlowLight, 1.5, 0.8);

    if (rasengan) {
        updateGlowEffect([], 0, 0, 1, 0, 3, rasenganGlowLight, 50, 25);
        if (rasenganGlowLight.visible && rasengan.parent) {
             rasenganGlowLight.position.copy(rasengan.position);
        }
    } else {
        if (rasenganGlowLight.visible) {
            rasenganGlowLight.visible = false;
        }
    }

    if (susanooModel && susanooVisible) {
        updateGlowEffect(susanooGlowMeshes, 0.6, 0, 1.05, 0.025, 1.5, susanooGlowLight, 3.0, 0);
        if (susanooModel.parent && susanooGlowLight.visible) susanooGlowLight.position.setFromMatrixPosition(susanooModel.matrixWorld);
    }

    if (S2 && S2.parent && s2GlowLight.visible) s2GlowLight.position.setFromMatrixPosition(S2.matrixWorld);

    updateSmokeEffect();
    renderer.render(scene, camera);
}
document.addEventListener('DOMContentLoaded', () => {
    if (crosshair) crosshair.style.display = 'none';
    userMoveSpeed = 0.3;
    animate();
});