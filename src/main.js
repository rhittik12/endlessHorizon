import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";

const canvas = document.querySelector("#game");
const statusEl = document.querySelector("#status");
const qualitySelect = document.querySelector("#quality-select");
const touchButtons = Array.from(document.querySelectorAll(".touch-controls button"));

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbdd0da, 140, 2100);

const camera = new THREE.PerspectiveCamera(63, window.innerWidth / window.innerHeight, 0.1, 3600);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.05, 0.25, 1.0);
composer.addPass(bloomPass);

const hemi = new THREE.HemisphereLight(0xe0efff, 0x5a6447, 0.95);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2d5, 1.25);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xbfcbd7, 0.22);
scene.add(ambient);

const sky = new Sky();
sky.scale.setScalar(9000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms.turbidity.value = 4.8;
skyUniforms.rayleigh.value = 1.2;
skyUniforms.mieCoefficient.value = 0.0012;
skyUniforms.mieDirectionalG.value = 0.68;
const skySunPosition = new THREE.Vector3();

function makeCanvasTexture(size, drawFn, wrap = true) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.wrapT = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

const roadTexture = makeCanvasTexture(1024, (ctx, s) => {
  ctx.fillStyle = "#7f7a71";
  ctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 20000; i += 1) {
    const v = 92 + Math.random() * 58;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.05 + Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.8, 1 + Math.random() * 2.8);
  }

  for (let i = 0; i < 240; i += 1) {
    ctx.strokeStyle = `rgba(20,20,20,${0.09 + Math.random() * 0.14})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.6;
    ctx.beginPath();
    const x = Math.random() * s;
    const y = Math.random() * s;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 120);
    ctx.stroke();
  }
});
roadTexture.repeat.set(1.6, 88);

const grassTexture = makeCanvasTexture(1024, (ctx, s) => {
  const grad = ctx.createLinearGradient(0, 0, 0, s);
  grad.addColorStop(0, "#c0c47f");
  grad.addColorStop(1, "#7f9567");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 21000; i += 1) {
    const hue = 62 + Math.random() * 30;
    const sat = 20 + Math.random() * 36;
    const light = 30 + Math.random() * 50;
    ctx.fillStyle = `hsla(${hue},${sat}%,${light}%,${0.08 + Math.random() * 0.11})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5);
  }

  for (let i = 0; i < 6000; i += 1) {
    ctx.fillStyle = "rgba(92,116,76,0.06)";
    ctx.fillRect(Math.random() * s, Math.random() * s, 2.2, 2.2);
  }
});
grassTexture.repeat.set(26, 26);

const stoneTexture = makeCanvasTexture(512, (ctx, s) => {
  ctx.fillStyle = "#7f786e";
  ctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 700; i += 1) {
    const w = 20 + Math.random() * 58;
    const h = 10 + Math.random() * 24;
    const x = Math.random() * s;
    const y = Math.random() * s;
    const shade = 84 + Math.random() * 78;
    ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 9})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(28,24,20,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
});
stoneTexture.repeat.set(1.2, 8);

const grassBladeTexture = makeCanvasTexture(
  128,
  (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    const g = ctx.createLinearGradient(0, s, 0, 0);
    g.addColorStop(0, "rgba(114,136,78,0)");
    g.addColorStop(0.25, "rgba(132,157,86,0.86)");
    g.addColorStop(1, "rgba(232,237,162,0.95)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, 0);
    ctx.lineTo(s * 0.92, s);
    ctx.lineTo(s * 0.08, s);
    ctx.closePath();
    ctx.fill();
  },
  false
);

const roadWidth = 9.3;
const roadShoulder = 19;
const chunkSize = 280;
const chunkResolution = 82;
let activeChunkRadius = 2;
let densityFactor = 1;

const roadMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: roadTexture, roughness: 0.94, metalness: 0.02 });
const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0xa89f88, roughness: 0.98, metalness: 0.01 });
const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.83, metalness: 0.0 });
const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: grassTexture, roughness: 1, metalness: 0, vertexColors: true });
const barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xc9d0d7, roughness: 0.54, metalness: 0.18 });
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xd4cdc0, map: stoneTexture, roughness: 0.96, metalness: 0.01 });
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4f30, roughness: 1, metalness: 0 });
const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x5f7e4d, roughness: 0.95, metalness: 0 });
const grassBillboardMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: grassBladeTexture,
  alphaMap: grassBladeTexture,
  transparent: true,
  alphaTest: 0.38,
  side: THREE.DoubleSide,
  roughness: 1,
  metalness: 0,
});

const input = { throttle: false, brake: false, left: false, right: false, boost: false };
const chunks = new Map();
const reusableVecA = new THREE.Vector3();
const reusableVecB = new THREE.Vector3();
const reusableVecC = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);

let speed = 0;
let yaw = 0;
let steerVisual = 0;
let clockTime = 0.28;
let weather = "clear";
let weatherTimer = 18;
let prevSpeed = 0;
let currentQuality = "high";

const MAX_FORWARD_SPEED = 31;
const MAX_REVERSE_SPEED = 6;
const SPEED_TO_KMH = 3.1;

const car = new THREE.Group();
car.rotation.order = "YXZ";

const bodyPaint = new THREE.MeshStandardMaterial({ color: 0xfafbff, metalness: 0.24, roughness: 0.35 });
const glassPaint = new THREE.MeshStandardMaterial({ color: 0x8ba7bb, metalness: 0.3, roughness: 0.2 });
const trimPaint = new THREE.MeshStandardMaterial({ color: 0x191f25, metalness: 0.08, roughness: 0.82 });
const tailLightPaint = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0x330000, emissiveIntensity: 0.7, roughness: 0.45, metalness: 0.05 });

const body = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.58, 4.25), bodyPaint);
body.position.y = 0.82;
car.add(body);

const hood = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.24, 1.36), bodyPaint);
hood.position.set(0, 1.04, 1.38);
car.add(hood);

const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.86), glassPaint);
roof.position.set(0, 1.23, -0.1);
car.add(roof);

const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.24, 0.68), trimPaint);
bumper.position.set(0, 0.66, -1.92);
car.add(bumper);

const tailLightL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.08), tailLightPaint);
const tailLightR = tailLightL.clone();
tailLightL.position.set(-0.58, 0.95, -2.09);
tailLightR.position.set(0.58, 0.95, -2.09);
car.add(tailLightL, tailLightR);

const headLightPaint = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 0, roughness: 0.4, metalness: 0.1 });
const headLightL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.08), headLightPaint);
const headLightR = headLightL.clone();
headLightL.position.set(-0.64, 0.95, 2.12);
headLightR.position.set(0.64, 0.95, 2.12);
car.add(headLightL, headLightR);

const spotLightL = new THREE.SpotLight(0xffeedd, 0, 180, Math.PI / 4, 0.6, 1.8);
spotLightL.position.set(-0.64, 0.95, 2.12);
spotLightL.target.position.set(-0.64, 0.2, 12.0);
car.add(spotLightL);
car.add(spotLightL.target);

const spotLightR = new THREE.SpotLight(0xffeedd, 0, 180, Math.PI / 4, 0.6, 1.8);
spotLightR.position.set(0.64, 0.95, 2.12);
spotLightR.target.position.set(0.64, 0.2, 12.0);
car.add(spotLightR);
car.add(spotLightR.target);

const wheelGeometry = new THREE.CylinderGeometry(0.36, 0.36, 0.29, 18);
wheelGeometry.rotateZ(Math.PI / 2);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x101419, roughness: 0.82, metalness: 0.06 });

function createWheel(px, py, pz, front) {
  const pivot = new THREE.Group();
  pivot.position.set(px, py, pz);
  const mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
  pivot.add(mesh);
  car.add(pivot);
  return { pivot, mesh, front };
}

const wheelData = [
  createWheel(-0.88, 0.37, 1.34, true),
  createWheel(0.88, 0.37, 1.34, true),
  createWheel(-0.88, 0.37, -1.38, false),
  createWheel(0.88, 0.37, -1.38, false),
];

scene.add(car);

const cloudCanvas = document.createElement("canvas");
cloudCanvas.width = 180;
cloudCanvas.height = 180;
const cloudCtx = cloudCanvas.getContext("2d");
const cloudGrad = cloudCtx.createRadialGradient(90, 90, 12, 90, 90, 82);
cloudGrad.addColorStop(0, "rgba(255,255,255,0.96)");
cloudGrad.addColorStop(1, "rgba(255,255,255,0)");
cloudCtx.fillStyle = cloudGrad;
cloudCtx.fillRect(0, 0, 180, 180);

const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
cloudTexture.colorSpace = THREE.SRGBColorSpace;

const cloudPoints = new THREE.BufferGeometry();
const cloudCount = 260;
const cloudArr = new Float32Array(cloudCount * 3);
for (let i = 0; i < cloudCount; i += 1) {
  cloudArr[i * 3] = (Math.random() - 0.5) * 1900;
  cloudArr[i * 3 + 1] = 200 + Math.random() * 180;
  cloudArr[i * 3 + 2] = (Math.random() - 0.5) * 1900;
}
cloudPoints.setAttribute("position", new THREE.BufferAttribute(cloudArr, 3));
const cloudMaterial = new THREE.PointsMaterial({ map: cloudTexture, size: 36, transparent: true, opacity: 0.3, depthWrite: false });
const clouds = new THREE.Points(cloudPoints, cloudMaterial);
clouds.frustumCulled = false;
scene.add(clouds);

const rainGeometry = new THREE.BufferGeometry();
const rainCount = 3500;
const rainArr = new Float32Array(rainCount * 3);
for (let i = 0; i < rainCount; i += 1) {
  rainArr[i * 3] = (Math.random() - 0.5) * 320;
  rainArr[i * 3 + 1] = 6 + Math.random() * 115;
  rainArr[i * 3 + 2] = (Math.random() - 0.5) * 320;
}
rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainArr, 3));
const rainMaterialPoints = new THREE.PointsMaterial({ color: 0xc8ddeb, size: 0.2, opacity: 0, transparent: true, depthWrite: false });
const rain = new THREE.Points(rainGeometry, rainMaterialPoints);
rain.frustumCulled = false;
scene.add(rain);

const distantTerrainMaterialNear = new THREE.MeshStandardMaterial({
  color: 0x8ea076,
  roughness: 1,
  metalness: 0,
  fog: true,
});
const distantTerrainMaterialFar = new THREE.MeshStandardMaterial({
  color: 0xa4af8a,
  roughness: 1,
  metalness: 0,
  fog: true,
});
const distantForestMaterial = new THREE.MeshStandardMaterial({
  color: 0x445a3b,
  roughness: 1,
  metalness: 0,
  fog: true,
});

function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothNoise(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const h00 = hash2(xi, zi);
  const h10 = hash2(xi + 1, zi);
  const h01 = hash2(xi, zi + 1);
  const h11 = hash2(xi + 1, zi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const x0 = h00 * (1 - u) + h10 * u;
  const x1 = h01 * (1 - u) + h11 * u;
  return x0 * (1 - v) + x1 * v;
}

function fbm(x, z) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let totalAmp = 0;
  for (let i = 0; i < 5; i += 1) {
    sum += smoothNoise(x * freq, z * freq) * amp;
    totalAmp += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / totalAmp;
}

function smoothstep(a, b, x) {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function chunkSeed(cx, cz) {
  const n = (cx * 73856093) ^ (cz * 19349663);
  return (n >>> 0) + 1;
}

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function buildDistantRing(innerRadius, outerRadius, radialSteps, angularSteps, seed, material) {
  const positions = [];
  const indices = [];

  for (let i = 0; i <= radialSteps; i += 1) {
    const t = i / radialSteps;
    const r = THREE.MathUtils.lerp(innerRadius, outerRadius, t);

    for (let j = 0; j <= angularSteps; j += 1) {
      const a = (j / angularSteps) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;

      const broad = fbm((x + seed * 71) * 0.00042, (z - seed * 37) * 0.00042) * 95;
      const ridged = Math.pow(Math.abs(fbm((x - seed * 29) * 0.00086, (z + seed * 19) * 0.00086) * 2 - 1), 1.7) * 130;
      const radialLift = Math.pow(t, 1.4) * 200;
      const sideBias = (x / outerRadius) * 52;
      const y = -115 + broad + ridged + radialLift + sideBias;

      positions.push(x, y, z);
    }
  }

  for (let i = 0; i < radialSteps; i += 1) {
    for (let j = 0; j < angularSteps; j += 1) {
      const cols = angularSteps + 1;
      const a = i * cols + j;
      const b = a + cols;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, material);
}

function createDistantForestBand(radius, count, seed) {
  const rng = createRng(seed);
  const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(11, 34, 8), distantForestMaterial, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i += 1) {
    const a = rng() * Math.PI * 2;
    const r = radius + (rng() - 0.5) * 260;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = -130 + fbm((x + seed * 13) * 0.0007, (z - seed * 23) * 0.0007) * 85;

    dummy.position.set(x, y, z);
    dummy.rotation.y = rng() * Math.PI * 2;
    const s = 0.7 + rng() * 1.25;
    dummy.scale.set(s, s * (0.9 + rng() * 0.4), s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

const distantRingNear = buildDistantRing(1400, 3200, 18, 96, 11, distantTerrainMaterialNear);
const distantRingFar = buildDistantRing(3200, 5600, 12, 96, 23, distantTerrainMaterialFar);
const distantForest = createDistantForestBand(2600, 700, 41);
scene.add(distantRingNear, distantRingFar, distantForest);

function updateDistantBackdrop() {
  distantRingNear.position.x = car.position.x;
  distantRingNear.position.z = car.position.z;

  distantRingFar.position.x = car.position.x;
  distantRingFar.position.z = car.position.z;

  distantForest.position.x = car.position.x;
  distantForest.position.z = car.position.z;

  sky.position.copy(camera.position);
}

const bendA = 0.0028;
const bendB = 0.0076;
const bendC = 0.0012;

function roadCenterX(z) {
  return Math.sin(z * bendA) * 36 + Math.sin(z * bendB + 1.2) * 22 + Math.sin(z * bendC + 2.8) * 15;
}

function roadSlopeX(z) {
  return Math.cos(z * bendA) * 36 * bendA + Math.cos(z * bendB + 1.2) * 22 * bendB + Math.cos(z * bendC + 2.8) * 15 * bendC;
}

function sideFromRoad(x, z) {
  return x - roadCenterX(z);
}

function terrainHeight(x, z) {
  const side = sideFromRoad(x, z);

  const broad = fbm(x * 0.0012, z * 0.0012) * 40;
  const medium = fbm(x * 0.0060, z * 0.0060) * 10;
  const detail = fbm(x * 0.019, z * 0.019) * 2.0;

  const rightFactor = THREE.MathUtils.clamp(side / 145, 0, 1);
  const leftFactor = THREE.MathUtils.clamp(-side / 170, 0, 1);

  const rightHill = Math.pow(rightFactor, 1.25) * 98;
  const leftValley = -Math.pow(leftFactor, 1.08) * 58;
  const shoulderShelf = -smoothstep(14, 68, Math.abs(side)) * 6;

  return broad + medium + detail + rightHill + leftValley + shoulderShelf - 15;
}

function roadHeight(z) {
  return terrainHeight(roadCenterX(z), z) + 0.14;
}

function groundAt(x, z) {
  const dist = Math.abs(sideFromRoad(x, z));
  const natural = terrainHeight(x, z);
  if (dist >= roadShoulder) return natural;

  const flatten = 1 - smoothstep(roadWidth * 0.55, roadShoulder, dist);
  const paved = roadHeight(z) - 0.18;
  return THREE.MathUtils.lerp(natural, paved, flatten * 0.92);
}

function buildRoadStrip(zStart, zEnd, width, xOffset, yOffset, material) {
  const zLen = zEnd - zStart;
  const geo = new THREE.PlaneGeometry(width, zLen, 7, 116);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;

  for (let i = 0; i < pos.count; i += 1) {
    const localX = pos.getX(i);
    const localZ = pos.getZ(i);
    const z = zStart + (localZ + zLen * 0.5);
    const center = roadCenterX(z);
    const slope = roadSlopeX(z);

    reusableVecA.set(slope, 0, 1).normalize();
    reusableVecB.crossVectors(worldUp, reusableVecA).normalize();

    const worldX = center + xOffset + reusableVecB.x * localX;
    const worldZ = z + reusableVecB.z * localX;

    let worldY = roadHeight(z) + yOffset;
    const edgeRatio = Math.abs(localX) / (width * 0.5);
    worldY += edgeRatio * edgeRatio * 0.03;

    pos.setXYZ(i, worldX, worldY, worldZ);

    const u = localX / width + 0.5;
    const v = (z - zStart) / 6;
    uv.setXY(i, u, v);
  }

  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return new THREE.Mesh(geo, material);
}

function createTerrainChunk(originX, originZ) {
  const geo = new THREE.PlaneGeometry(chunkSize, chunkSize, chunkResolution, chunkResolution);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();

  const valleyGreen = new THREE.Color(0x76915f);
  const hillGold = new THREE.Color(0xbec07a);
  const nearRoadDry = new THREE.Color(0xaa9d79);
  const shadowTone = new THREE.Color(0x627952);

  for (let i = 0; i < pos.count; i += 1) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    const wx = originX + lx;
    const wz = originZ + lz;
    const y = groundAt(wx, wz);
    pos.setXYZ(i, wx, y, wz);

    const side = sideFromRoad(wx, wz);
    const roadDist = Math.abs(side);
    const hill = THREE.MathUtils.clamp((y + 20) / 90, 0, 1);
    const nearRoad = 1 - smoothstep(roadWidth * 0.75, roadShoulder + 22, roadDist);
    const patchNoise = fbm(wx * 0.022, wz * 0.022);
    const slopeBias = THREE.MathUtils.clamp((side + 15) / 130, 0, 1);
    const valleyBias = THREE.MathUtils.clamp((-side + 20) / 160, 0, 1);
    const shade = THREE.MathUtils.clamp(0.44 + (fbm(wx * 0.012, wz * 0.012) - 0.5) * 0.56, 0, 1);

    color
      .copy(valleyGreen)
      .lerp(hillGold, hill * 0.62 + slopeBias * 0.4 + patchNoise * 0.15)
      .lerp(nearRoadDry, nearRoad * 0.38)
      .lerp(shadowTone, valleyBias * (1 - shade) * 0.42);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    uv.setXY(i, wx / 105, wz / 105);
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return new THREE.Mesh(geo, terrainMaterial);
}

function createTree(x, z, group, scale = 1, rng = Math.random) {
  const y = terrainHeight(x, z);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.18 * scale, 1.45 * scale, 7), trunkMaterial);
  trunk.position.set(x, y + 0.72 * scale, z);
  group.add(trunk);

  const crownA = new THREE.Mesh(new THREE.ConeGeometry(0.84 * scale, 1.58 * scale, 9), foliageMaterial);
  crownA.position.set(x, y + 1.9 * scale, z);
  group.add(crownA);

  const crownB = new THREE.Mesh(new THREE.ConeGeometry(0.58 * scale, 1.05 * scale, 9), foliageMaterial);
  crownB.position.set(x + (rng() - 0.5) * 0.08, y + 2.62 * scale, z + (rng() - 0.5) * 0.08);
  group.add(crownB);
}

function createShrub(x, z, group, rng = Math.random) {
  const y = terrainHeight(x, z);
  const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.52, 8, 7), foliageMaterial);
  shrub.position.set(x, y + 0.42, z);
  shrub.scale.set(0.8 + rng() * 1.1, 0.45 + rng() * 0.55, 0.8 + rng() * 1.1);
  group.add(shrub);
}

function createRock(x, z, group, rng = Math.random) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + rng() * 1.1, 0), stoneMaterial);
  const y = terrainHeight(x, z) + 0.32;
  rock.position.set(x, y, z);
  const s = 0.5 + rng() * 1.2;
  rock.scale.set(s, s * (0.75 + rng() * 0.5), s);
  group.add(rock);
}

function createBarrier(z, side, group) {
  const edge = roadWidth * 0.5 + 0.87;
  const x = roadCenterX(z) + side * edge;
  const y = roadHeight(z) + 0.22;
  const yawAngle = Math.atan2(roadSlopeX(z), 1);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 4.35), barrierMaterial);
  rail.position.set(x, y + 0.25, z);
  rail.rotation.y = yawAngle;
  group.add(rail);

  if ((Math.floor(z / 8) & 1) === 0) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.84, 0.14), barrierMaterial);
    post.position.set(x, y - 0.08, z);
    group.add(post);
  }
}

function createWallSegment(z, side, group) {
  const offset = roadWidth * 0.5 + 4.7;
  const x = roadCenterX(z) + side * offset;
  const y = groundAt(x, z) + 0.54;
  const yawAngle = Math.atan2(roadSlopeX(z), 1);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.1, 4.2), stoneMaterial);
  wall.position.set(x, y, z);
  wall.rotation.y = yawAngle;
  group.add(wall);
}

function createGrassBand(zStart, zEnd, side, chunk, rng) {
  const baseCount = currentQuality === "low" ? 90 : currentQuality === "medium" ? 160 : 260;
  const count = Math.floor(baseCount * densityFactor);
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 1.5), grassBillboardMaterial, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i += 1) {
    const z = zStart + rng() * (zEnd - zStart);
    const x = roadCenterX(z) + side * (roadWidth * 0.5 + 1.0 + rng() * 3.0);
    const y = groundAt(x, z) + 0.42;

    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rng() * Math.PI * 2, 0);
    const s = 0.55 + rng() * 1.15;
    dummy.scale.set(s, s * (0.9 + rng() * 0.7), s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  chunk.add(mesh);
}

function createChunk(cx, cz) {
  const chunk = new THREE.Group();
  const originX = cx * chunkSize;
  const originZ = cz * chunkSize;
  const rng = createRng(chunkSeed(cx, cz));

  chunk.add(createTerrainChunk(originX, originZ));

  const zStart = originZ - 18;
  const zEnd = originZ + chunkSize + 18;

  const road = buildRoadStrip(zStart, zEnd, roadWidth, 0, 0.03, roadMaterial);
  const shoulderL = buildRoadStrip(zStart, zEnd, 1.5, -roadWidth * 0.5 - 0.72, 0.02, shoulderMaterial);
  const shoulderR = buildRoadStrip(zStart, zEnd, 1.5, roadWidth * 0.5 + 0.72, 0.02, shoulderMaterial);
  const centerL = buildRoadStrip(zStart, zEnd, 0.1, -0.15, 0.046, lineMaterial);
  const centerR = buildRoadStrip(zStart, zEnd, 0.1, 0.15, 0.046, lineMaterial);
  const edgeL = buildRoadStrip(zStart, zEnd, 0.1, -roadWidth * 0.5 + 0.33, 0.043, lineMaterial);
  const edgeR = buildRoadStrip(zStart, zEnd, 0.1, roadWidth * 0.5 - 0.33, 0.043, lineMaterial);

  chunk.add(road, shoulderL, shoulderR, centerL, centerR, edgeL, edgeR);

  createGrassBand(zStart, zEnd, -1, chunk, rng);
  createGrassBand(zStart, zEnd, 1, chunk, rng);

  for (let z = zStart; z < zEnd; z += 4.2) {
    if ((Math.floor(z / 13) & 1) === 0) createBarrier(z, -1, chunk);
    if ((Math.floor(z / 18) & 1) === 0) createWallSegment(z, 1, chunk);
  }

  const scenicCount = Math.floor((currentQuality === "low" ? 24 : currentQuality === "medium" ? 42 : 62) * densityFactor);
  for (let i = 0; i < scenicCount; i += 1) {
    const rx = originX + (rng() - 0.5) * chunkSize;
    const rz = originZ + (rng() - 0.5) * chunkSize;
    const side = sideFromRoad(rx, rz);
    const dist = Math.abs(side);
    if (dist < roadShoulder + 7) continue;

    if (side < -20) {
      if (rng() > 0.33) {
        createTree(rx, rz, chunk, 0.88 + rng() * 0.55, rng);
      } else {
        createShrub(rx, rz, chunk, rng);
      }
    } else if (rng() > 0.6) {
      createShrub(rx, rz, chunk, rng);
    } else {
      createRock(rx, rz, chunk, rng);
    }
  }

  const beltCount = Math.floor((currentQuality === "low" ? 12 : currentQuality === "medium" ? 20 : 30) * densityFactor);
  for (let i = 0; i < beltCount; i += 1) {
    const z = zStart + rng() * (zEnd - zStart);
    const x = roadCenterX(z) - (70 + rng() * 105);
    if (x < originX - chunkSize * 0.5 || x > originX + chunkSize * 0.5) continue;
    if (z < originZ - chunkSize * 0.5 || z > originZ + chunkSize * 0.5) continue;
    if (rng() > 0.2) createTree(x, z, chunk, 0.72 + rng() * 0.46, rng);
  }

  scene.add(chunk);
  chunks.set(`${cx},${cz}`, chunk);
}

function disposeChunk(chunk) {
  chunk.traverse((obj) => {
    if (obj.isMesh && obj.geometry) obj.geometry.dispose();
  });
}

function clearChunks() {
  for (const chunk of chunks.values()) {
    scene.remove(chunk);
    disposeChunk(chunk);
  }
  chunks.clear();
}

function updateChunks() {
  const cx = Math.floor(car.position.x / chunkSize);
  const cz = Math.floor(car.position.z / chunkSize);

  for (let x = cx - activeChunkRadius; x <= cx + activeChunkRadius; x += 1) {
    for (let z = cz - activeChunkRadius; z <= cz + activeChunkRadius; z += 1) {
      const key = `${x},${z}`;
      if (!chunks.has(key)) createChunk(x, z);
    }
  }

  for (const [key, chunk] of chunks.entries()) {
    const [x, z] = key.split(",").map(Number);
    if (Math.abs(x - cx) > activeChunkRadius + 1 || Math.abs(z - cz) > activeChunkRadius + 1) {
      scene.remove(chunk);
      disposeChunk(chunk);
      chunks.delete(key);
    }
  }
}

function updateLighting(dt) {
  clockTime = (clockTime + dt * 0.0035) % 1;
  const theta = clockTime * Math.PI * 2;
  const day = THREE.MathUtils.clamp(Math.sin(theta) * 0.9 + 0.4, 0, 1);

  const elevation = THREE.MathUtils.lerp(-6, 52, day);
  const azimuth = (clockTime * 360 + 190) % 360;
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const t = THREE.MathUtils.degToRad(azimuth);

  skySunPosition.setFromSphericalCoords(1, phi, t);
  skyUniforms.sunPosition.value.copy(skySunPosition);

  sun.position.copy(skySunPosition).multiplyScalar(540);
  sun.intensity = 0.05 + day * 0.6;
  sun.color.set(day < 0.2 ? 0x96abd9 : 0xfff0d2);
  hemi.intensity = 0.16 + day * 0.48;
  ambient.intensity = 0.08 + day * 0.14;

  const fogNight = new THREE.Color(0x1c2433);
  const fogDay = new THREE.Color(0x94a8b2);
  scene.fog.color.copy(fogNight.clone().lerp(fogDay, day));

  const baseExposure = THREE.MathUtils.lerp(0.38, 0.62, day);
  reusableVecA.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
  reusableVecB.copy(sun.position).normalize();
  const glare = Math.pow(Math.max(0, reusableVecA.dot(reusableVecB)), 2);
  renderer.toneMappingExposure = Math.max(0.22, baseExposure * (1 - glare * 0.75));
  const bloomBase = currentQuality === "low" ? 0.0 : currentQuality === "medium" ? 0.03 : 0.06;
  bloomPass.strength = THREE.MathUtils.lerp(bloomBase * 0.2, bloomBase * 0.5, day) * (1 - glare * 0.95);

  const isNight = day < 0.25;
  const targetIntensity = isNight ? 180 : 0;
  const targetHeadlightGlow = isNight ? 3.0 : 0;
  
  spotLightL.intensity = THREE.MathUtils.lerp(spotLightL.intensity, targetIntensity, 0.05);
  spotLightL.target.updateMatrixWorld();
  spotLightR.intensity = THREE.MathUtils.lerp(spotLightR.intensity, targetIntensity, 0.05);
  spotLightR.target.updateMatrixWorld();
  headLightPaint.emissiveIntensity = THREE.MathUtils.lerp(headLightPaint.emissiveIntensity, targetHeadlightGlow, 0.05);
}

function updateWeather(dt) {
  weatherTimer -= dt;
  if (weatherTimer <= 0) {
    weatherTimer = 36 + Math.random() * 52;
    const r = Math.random();
    weather = r < 0.58 ? "clear" : r < 0.86 ? "mist" : "rain";
  }

  if (weather === "rain") {
    rainMaterialPoints.opacity = THREE.MathUtils.damp(rainMaterialPoints.opacity, 0.86, 4.1, dt);
    cloudMaterial.opacity = THREE.MathUtils.damp(cloudMaterial.opacity, 0.54, 2.6, dt);
    scene.fog.near = 70;
    scene.fog.far = 1050;
    scene.fog.color.lerp(new THREE.Color(0x7d8c98), 0.35);
    roadMaterial.roughness = THREE.MathUtils.damp(roadMaterial.roughness, 0.62, 3.2, dt);
  } else if (weather === "mist") {
    rainMaterialPoints.opacity = THREE.MathUtils.damp(rainMaterialPoints.opacity, 0, 4.1, dt);
    cloudMaterial.opacity = THREE.MathUtils.damp(cloudMaterial.opacity, 0.44, 2.6, dt);
    scene.fog.near = 68;
    scene.fog.far = 960;
    scene.fog.color.lerp(new THREE.Color(0x83919d), 0.45);
    roadMaterial.roughness = THREE.MathUtils.damp(roadMaterial.roughness, 0.8, 3.2, dt);
  } else {
    rainMaterialPoints.opacity = THREE.MathUtils.damp(rainMaterialPoints.opacity, 0, 4.1, dt);
    cloudMaterial.opacity = THREE.MathUtils.damp(cloudMaterial.opacity, 0.3, 2.6, dt);
    scene.fog.near = 140;
    scene.fog.far = 2100;
    scene.fog.color.lerp(new THREE.Color(0x94a8b2), 0.12);
    roadMaterial.roughness = THREE.MathUtils.damp(roadMaterial.roughness, 0.94, 3.2, dt);
  }

  const rp = rain.geometry.attributes.position;
  for (let i = 0; i < rp.count; i += 1) {
    const k = i * 3;
    rp.array[k] += Math.sin(i * 1.7) * dt * 0.3;
    rp.array[k + 1] -= dt * 58;
    rp.array[k + 2] += Math.cos(i * 1.2) * dt * 0.2;
    if (rp.array[k + 1] < car.position.y - 10) {
      rp.array[k] = car.position.x + (Math.random() - 0.5) * 320;
      rp.array[k + 1] = car.position.y + 8 + Math.random() * 118;
      rp.array[k + 2] = car.position.z + (Math.random() - 0.5) * 320;
    }
  }
  rp.needsUpdate = true;

  const cp = clouds.geometry.attributes.position;
  const cloudDrift = weather === "rain" ? 13 : 8;
  for (let i = 0; i < cp.count; i += 1) {
    const k = i * 3;
    cp.array[k + 2] += dt * cloudDrift;
    if (cp.array[k + 2] - car.position.z > 980) {
      cp.array[k] = car.position.x + (Math.random() - 0.5) * 1950;
      cp.array[k + 1] = 200 + Math.random() * 180;
      cp.array[k + 2] = car.position.z - 980;
    }
  }
  cp.needsUpdate = true;
}

function updateCar(dt) {
  const accel = input.throttle ? 13.5 : 0;
  const brake = input.brake ? 20 : 0;
  const drag = THREE.MathUtils.lerp(3.3, 8.2, Math.min(Math.abs(speed) / MAX_FORWARD_SPEED, 1));
  const boostMul = input.boost ? 1.14 : 1;

  speed += accel * boostMul * dt;
  speed -= brake * dt;
  speed -= Math.sign(speed) * drag * dt;

  if (Math.abs(speed) < 0.015) speed = 0;
  speed = THREE.MathUtils.clamp(speed, -MAX_REVERSE_SPEED, MAX_FORWARD_SPEED);

  const steerInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const laneCenter = roadCenterX(car.position.z);
  const laneOffset = (car.position.x - laneCenter) / (roadWidth * 0.5);
  speed -= THREE.MathUtils.clamp(Math.abs(laneOffset) - 0.9, 0, 1) * 10.8 * dt;

  const steerPower = THREE.MathUtils.lerp(1.38, 0.36, Math.min(Math.abs(speed) / MAX_FORWARD_SPEED, 1));
  yaw -= steerInput * steerPower * dt * (speed >= 0 ? 1 : -1);
  yaw += laneOffset * 0.028 * dt;

  car.position.x += Math.sin(yaw) * speed * dt;
  car.position.z += Math.cos(yaw) * speed * dt;

  const groundY = groundAt(car.position.x, car.position.z);
  car.position.y = THREE.MathUtils.damp(car.position.y, groundY + 0.44, 8.4, dt);

  const slope = roadSlopeX(car.position.z + 3.0);
  const accelLong = (speed - prevSpeed) / Math.max(dt, 0.0001);
  prevSpeed = speed;

  steerVisual = THREE.MathUtils.damp(steerVisual, steerInput * 0.58, 9, dt);
  const pitch = THREE.MathUtils.clamp(-accelLong * 0.0056 - slope * 0.07, -0.18, 0.16);
  const roll = THREE.MathUtils.clamp(-steerVisual * Math.min(Math.abs(speed) / MAX_FORWARD_SPEED, 1) * 0.16, -0.22, 0.22);

  car.rotation.y = yaw;
  car.rotation.x = pitch;
  car.rotation.z = roll;

  const brakeGlow = input.brake ? 2.2 : 0.7;
  tailLightPaint.emissiveIntensity = THREE.MathUtils.damp(tailLightPaint.emissiveIntensity, brakeGlow, 7, dt);

  for (const w of wheelData) {
    if (w.front) w.pivot.rotation.y = steerVisual;
    w.mesh.rotation.x += speed * dt * 0.95;
  }

  const speedRatio = Math.min(Math.abs(speed) / MAX_FORWARD_SPEED, 1);
  const camDistance = THREE.MathUtils.lerp(7.6, 12.8, speedRatio);
  const camHeight = THREE.MathUtils.lerp(3.4, 4.9, speedRatio);

  reusableVecA.set(Math.sin(yaw), 0, Math.cos(yaw));
  reusableVecB.copy(car.position).addScaledVector(reusableVecA, -camDistance);
  reusableVecB.y += camHeight;

  camera.position.lerp(reusableVecB, 1 - Math.exp(-dt * 7.1));
  reusableVecC.copy(car.position).addScaledVector(reusableVecA, 18);
  reusableVecC.y += 1.5;
  camera.lookAt(reusableVecC);

  camera.fov = THREE.MathUtils.lerp(61, 73, speedRatio);
  camera.updateProjectionMatrix();

  const kmh = Math.max(0, speed) * SPEED_TO_KMH;
  statusEl.textContent = `Speed ${kmh.toFixed(0)} km/h | Weather ${weather} | Time ${(clockTime * 24).toFixed(1)}h | Quality ${currentQuality}`;
}

function applyQuality(preset) {
  currentQuality = preset;
  const dprBase = window.devicePixelRatio || 1;

  if (preset === "low") {
    renderer.setPixelRatio(Math.min(1.0, dprBase));
    activeChunkRadius = 1;
    densityFactor = 0.55;
    bloomPass.enabled = false;
    cloudMaterial.size = 30;
  } else if (preset === "medium") {
    renderer.setPixelRatio(Math.min(1.35, dprBase));
    activeChunkRadius = 2;
    densityFactor = 0.9;
    bloomPass.enabled = true;
    cloudMaterial.size = 34;
  } else {
    renderer.setPixelRatio(Math.min(1.9, dprBase));
    activeChunkRadius = 3;
    densityFactor = 1.35;
    bloomPass.enabled = true;
    cloudMaterial.size = 37;
  }

  clearChunks();
  updateChunks();
  onResize();
}

function bindTouchControls() {
  const bind = (button, active) => {
    const key = button.dataset.key;
    if (!key || !(key in input)) return;
    input[key] = active;
    button.classList.toggle("active", active);
  };

  for (const button of touchButtons) {
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      bind(button, true);
    });

    const release = (e) => {
      e.preventDefault();
      bind(button, false);
    };

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }
}

function resetCar() {
  speed = 0;
  prevSpeed = 0;
  steerVisual = 0;
  yaw = 0;
  const x = roadCenterX(0);
  const y = roadHeight(0) + 0.44;
  car.position.set(x, y, 0);
  car.rotation.set(0, 0, 0);
  camera.position.set(x, y + 4.2, -11.8);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") input.throttle = true;
  if (e.code === "KeyS" || e.code === "ArrowDown") input.brake = true;
  if (e.code === "KeyA" || e.code === "ArrowLeft") input.left = true;
  if (e.code === "KeyD" || e.code === "ArrowRight") input.right = true;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") input.boost = true;
  if (e.code === "KeyR") resetCar();
});

window.addEventListener("keyup", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") input.throttle = false;
  if (e.code === "KeyS" || e.code === "ArrowDown") input.brake = false;
  if (e.code === "KeyA" || e.code === "ArrowLeft") input.left = false;
  if (e.code === "KeyD" || e.code === "ArrowRight") input.right = false;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") input.boost = false;
});

window.addEventListener("resize", onResize);
qualitySelect.addEventListener("change", () => applyQuality(qualitySelect.value));

bindTouchControls();
resetCar();
updateDistantBackdrop();
applyQuality("high");
statusEl.textContent = "Drive forward to begin";

let last = performance.now();
function animate(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  updateCar(dt);
  updateChunks();
  updateDistantBackdrop();
  updateLighting(dt);
  updateWeather(dt);

  composer.render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);