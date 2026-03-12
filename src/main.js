import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const canvas = document.querySelector("#game");
const statusEl = document.querySelector("#status");
const qualitySelect = document.querySelector("#quality-select");
const touchButtons = Array.from(document.querySelectorAll(".touch-controls button"));

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb8d0dd, 110, 1700);

const camera = new THREE.PerspectiveCamera(63, window.innerWidth / window.innerHeight, 0.1, 3200);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.62, 0.9);
composer.addPass(bloomPass);

const hemi = new THREE.HemisphereLight(0xd7eaff, 0x53654a, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2d5, 1.35);
sun.position.set(170, 220, -130);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xb6c6d5, 0.25);
scene.add(ambient);

const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(2400, 36, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x6ea6d9) },
      bottomColor: { value: new THREE.Color(0xe4f2f9) },
      offset: { value: 140.0 },
      exponent: { value: 0.72 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float k = pow(max(h, 0.0), exponent);
        gl_FragColor = vec4(mix(bottomColor, topColor, k), 1.0);
      }
    `,
  })
);
scene.add(skyDome);

function makeCanvasTexture(size, drawFn) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

const roadTexture = makeCanvasTexture(512, (ctx, s) => {
  ctx.fillStyle = "#7d786d";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 9000; i += 1) {
    const v = 100 + Math.random() * 45;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.07 + Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, Math.random() * 2.4, Math.random() * 2.4);
  }
  for (let i = 0; i < 130; i += 1) {
    ctx.strokeStyle = `rgba(30,30,30,${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.5;
    ctx.beginPath();
    const x = Math.random() * s;
    const y = Math.random() * s;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 70, y + (Math.random() - 0.5) * 70);
    ctx.stroke();
  }
});
roadTexture.repeat.set(1.5, 65);

const grassTexture = makeCanvasTexture(512, (ctx, s) => {
  const grad = ctx.createLinearGradient(0, 0, 0, s);
  grad.addColorStop(0, "#b5bf7a");
  grad.addColorStop(1, "#7e9265");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 14500; i += 1) {
    const hue = 68 + Math.random() * 19;
    const sat = 24 + Math.random() * 25;
    const light = 34 + Math.random() * 43;
    ctx.fillStyle = `hsla(${hue},${sat}%,${light}%,${0.08 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.2, 1 + Math.random() * 2.2);
  }
});
grassTexture.repeat.set(24, 24);

const stoneTexture = makeCanvasTexture(256, (ctx, s) => {
  ctx.fillStyle = "#807a70";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 320; i += 1) {
    const w = 15 + Math.random() * 42;
    const h = 9 + Math.random() * 19;
    const x = Math.random() * s;
    const y = Math.random() * s;
    const shade = 95 + Math.random() * 55;
    ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 7})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(26,22,18,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
});
stoneTexture.repeat.set(1, 7);

const roadWidth = 9.4;
const roadShoulder = 19;
const chunkSize = 280;
const chunkResolution = 78;
const chunkRadius = 2;

const roadMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: roadTexture, roughness: 0.95, metalness: 0.02 });
const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0xa89f8a, roughness: 0.98, metalness: 0.01 });
const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xf2efe7, roughness: 0.85, metalness: 0.0 });
const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: grassTexture, roughness: 1, metalness: 0, vertexColors: true });
const barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xc7cfd6, roughness: 0.56, metalness: 0.16 });
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xd7d0c2, map: stoneTexture, roughness: 0.96, metalness: 0.01 });
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6a4a2d, roughness: 1, metalness: 0 });
const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x587948, roughness: 0.95, metalness: 0 });

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
let weatherTimer = 14;
let prevSpeed = 0;
let currentQuality = "high";

const car = new THREE.Group();
car.rotation.order = "YXZ";

const bodyPaint = new THREE.MeshStandardMaterial({ color: 0xf8f8fb, metalness: 0.2, roughness: 0.38 });
const glassPaint = new THREE.MeshStandardMaterial({ color: 0x89a7bd, metalness: 0.3, roughness: 0.2 });

const mainShell = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.58, 4.28), bodyPaint);
mainShell.position.y = 0.82;
car.add(mainShell);

const hood = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.24, 1.44), bodyPaint);
hood.position.set(0, 1.05, 1.38);
car.add(hood);

const roof = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.52, 1.9), glassPaint);
roof.position.set(0, 1.24, -0.14);
car.add(roof);

const tail = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.22, 0.9), bodyPaint);
tail.position.set(0, 0.98, -1.83);
car.add(tail);

const wheelGeometry = new THREE.CylinderGeometry(0.36, 0.36, 0.29, 18);
wheelGeometry.rotateZ(Math.PI / 2);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.82, metalness: 0.06 });

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
cloudCanvas.width = 160;
cloudCanvas.height = 160;
const cloudCtx = cloudCanvas.getContext("2d");
const cloudGrad = cloudCtx.createRadialGradient(80, 80, 12, 80, 80, 72);
cloudGrad.addColorStop(0, "rgba(255,255,255,0.95)");
cloudGrad.addColorStop(1, "rgba(255,255,255,0)");
cloudCtx.fillStyle = cloudGrad;
cloudCtx.fillRect(0, 0, 160, 160);

const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
cloudTexture.colorSpace = THREE.SRGBColorSpace;

const cloudPoints = new THREE.BufferGeometry();
const cloudCount = 210;
const cloudArr = new Float32Array(cloudCount * 3);
for (let i = 0; i < cloudCount; i += 1) {
  cloudArr[i * 3] = (Math.random() - 0.5) * 1700;
  cloudArr[i * 3 + 1] = 190 + Math.random() * 170;
  cloudArr[i * 3 + 2] = (Math.random() - 0.5) * 1700;
}
cloudPoints.setAttribute("position", new THREE.BufferAttribute(cloudArr, 3));
const cloudMaterial = new THREE.PointsMaterial({ map: cloudTexture, size: 35, transparent: true, opacity: 0.3, depthWrite: false });
const clouds = new THREE.Points(cloudPoints, cloudMaterial);
scene.add(clouds);

const rainGeometry = new THREE.BufferGeometry();
const rainCount = 3000;
const rainArr = new Float32Array(rainCount * 3);
for (let i = 0; i < rainCount; i += 1) {
  rainArr[i * 3] = (Math.random() - 0.5) * 300;
  rainArr[i * 3 + 1] = 5 + Math.random() * 110;
  rainArr[i * 3 + 2] = (Math.random() - 0.5) * 300;
}
rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainArr, 3));
const rainMaterialPoints = new THREE.PointsMaterial({ color: 0xc8dded, size: 0.2, opacity: 0, transparent: true, depthWrite: false });
const rain = new THREE.Points(rainGeometry, rainMaterialPoints);
scene.add(rain);

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

const bendA = 0.0028;
const bendB = 0.0077;
const bendC = 0.0013;

function roadCenterX(z) {
  return Math.sin(z * bendA) * 38 + Math.sin(z * bendB + 1.3) * 20 + Math.sin(z * bendC + 3.1) * 15;
}

function roadSlopeX(z) {
  return Math.cos(z * bendA) * 38 * bendA + Math.cos(z * bendB + 1.3) * 20 * bendB + Math.cos(z * bendC + 3.1) * 15 * bendC;
}

function sideFromRoad(x, z) {
  return x - roadCenterX(z);
}

function terrainHeight(x, z) {
  const side = sideFromRoad(x, z);

  const broad = fbm(x * 0.0013, z * 0.0013) * 42;
  const medium = fbm(x * 0.0062, z * 0.0062) * 11;
  const detail = fbm(x * 0.018, z * 0.018) * 2.2;
  const ridge = Math.pow(Math.abs(fbm(x * 0.0028 + 9.1, z * 0.0028 + 7.3) * 2 - 1), 1.6) * 8;

  const rightFactor = THREE.MathUtils.clamp(side / 135, 0, 1);
  const leftFactor = THREE.MathUtils.clamp(-side / 155, 0, 1);
  const rightHill = Math.pow(rightFactor, 1.2) * 92;
  const leftValley = -Math.pow(leftFactor, 1.1) * 62;
  const shoulderShelf = -smoothstep(14, 70, Math.abs(side)) * 7;

  return broad + medium + detail + ridge + rightHill + leftValley + shoulderShelf - 18;
}

function roadHeight(z) {
  const x = roadCenterX(z);
  return terrainHeight(x, z) + 0.13;
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
  const geo = new THREE.PlaneGeometry(width, zLen, 6, 110);
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
  return new THREE.Mesh(geo, material);
}

function createTerrainChunk(originX, originZ) {
  const geo = new THREE.PlaneGeometry(chunkSize, chunkSize, chunkResolution, chunkResolution);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();

  const valleyGreen = new THREE.Color(0x7a9364);
  const hillGold = new THREE.Color(0xb9bb79);
  const nearRoadDry = new THREE.Color(0xa79a78);
  const shadowTone = new THREE.Color(0x657a57);

  for (let i = 0; i < pos.count; i += 1) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    const wx = originX + lx;
    const wz = originZ + lz;

    const y = groundAt(wx, wz);
    pos.setY(i, y);

    const side = sideFromRoad(wx, wz);
    const roadDist = Math.abs(side);
    const hill = THREE.MathUtils.clamp((y + 20) / 90, 0, 1);
    const nearRoad = 1 - smoothstep(roadWidth * 0.7, roadShoulder + 24, roadDist);
    const patchNoise = fbm(wx * 0.021, wz * 0.021);
    const slopeBias = THREE.MathUtils.clamp((side + 16) / 130, 0, 1);
    const valleyBias = THREE.MathUtils.clamp((-side + 16) / 150, 0, 1);
    const shading = THREE.MathUtils.clamp(0.4 + (fbm(wx * 0.011, wz * 0.011) - 0.5) * 0.55, 0, 1);

    color
      .copy(valleyGreen)
      .lerp(hillGold, hill * 0.6 + slopeBias * 0.45 + patchNoise * 0.15)
      .lerp(nearRoadDry, nearRoad * 0.44)
      .lerp(shadowTone, valleyBias * (1 - shading) * 0.4);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    uv.setXY(i, wx / 110, wz / 110);
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, terrainMaterial);
}

function createTree(x, z, group, scale = 1) {
  const y = terrainHeight(x, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.18 * scale, 1.5 * scale, 7), trunkMaterial);
  trunk.position.set(x, y + 0.74 * scale, z);
  group.add(trunk);

  const crownA = new THREE.Mesh(new THREE.ConeGeometry(0.85 * scale, 1.6 * scale, 9), foliageMaterial);
  crownA.position.set(x, y + 1.95 * scale, z);
  group.add(crownA);

  const crownB = new THREE.Mesh(new THREE.ConeGeometry(0.6 * scale, 1.1 * scale, 9), foliageMaterial);
  crownB.position.set(x, y + 2.7 * scale, z);
  group.add(crownB);
}

function createShrub(x, z, group) {
  const y = terrainHeight(x, z);
  const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.52, 8, 7), foliageMaterial);
  shrub.position.set(x, y + 0.42, z);
  shrub.scale.set(1 + Math.random() * 0.9, 0.58 + Math.random() * 0.5, 1 + Math.random() * 0.9);
  group.add(shrub);
}

function createBarrier(z, side, group) {
  const edge = roadWidth * 0.5 + 0.86;
  const x = roadCenterX(z) + side * edge;
  const y = roadHeight(z) + 0.22;
  const yawAngle = Math.atan2(roadSlopeX(z), 1);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 4.4), barrierMaterial);
  rail.position.set(x, y + 0.25, z);
  rail.rotation.y = yawAngle;
  group.add(rail);

  if ((Math.floor(z / 8) & 1) === 0) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.82, 0.14), barrierMaterial);
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

function createChunk(cx, cz) {
  const chunk = new THREE.Group();
  const originX = cx * chunkSize;
  const originZ = cz * chunkSize;

  chunk.add(createTerrainChunk(originX, originZ));

  const zStart = originZ - 18;
  const zEnd = originZ + chunkSize + 18;

  const road = buildRoadStrip(zStart, zEnd, roadWidth, 0, 0.03, roadMaterial);
  const shoulderL = buildRoadStrip(zStart, zEnd, 1.5, -roadWidth * 0.5 - 0.7, 0.02, shoulderMaterial);
  const shoulderR = buildRoadStrip(zStart, zEnd, 1.5, roadWidth * 0.5 + 0.7, 0.02, shoulderMaterial);
  const centerL = buildRoadStrip(zStart, zEnd, 0.1, -0.14, 0.046, lineMaterial);
  const centerR = buildRoadStrip(zStart, zEnd, 0.1, 0.14, 0.046, lineMaterial);
  const edgeL = buildRoadStrip(zStart, zEnd, 0.12, -roadWidth * 0.5 + 0.35, 0.042, lineMaterial);
  const edgeR = buildRoadStrip(zStart, zEnd, 0.12, roadWidth * 0.5 - 0.35, 0.042, lineMaterial);

  chunk.add(road, shoulderL, shoulderR, centerL, centerR, edgeL, edgeR);

  for (let z = zStart; z < zEnd; z += 4.3) {
    if ((Math.floor(z / 13) & 1) === 0) createBarrier(z, -1, chunk);
    if ((Math.floor(z / 18) & 1) === 0) createWallSegment(z, 1, chunk);
  }

  const scenicCount = currentQuality === "low" ? 20 : currentQuality === "medium" ? 34 : 48;
  for (let i = 0; i < scenicCount; i += 1) {
    const rx = originX + (Math.random() - 0.5) * chunkSize;
    const rz = originZ + (Math.random() - 0.5) * chunkSize;
    const side = sideFromRoad(rx, rz);
    const dist = Math.abs(side);
    if (dist < roadShoulder + 7) continue;

    if (side < -20) {
      if (hash2(Math.floor(rx * 0.2), Math.floor(rz * 0.2)) > 0.35) {
        createTree(rx, rz, chunk, 0.92 + Math.random() * 0.5);
      } else {
        createShrub(rx, rz, chunk);
      }
    } else {
      if (hash2(Math.floor(rx * 0.23 + 4), Math.floor(rz * 0.23)) > 0.58) {
        createShrub(rx, rz, chunk);
      } else {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + Math.random() * 1.1, 0), stoneMaterial);
        const y = terrainHeight(rx, rz) + 0.34;
        rock.position.set(rx, y, rz);
        const s = 0.55 + Math.random() * 1.25;
        rock.scale.set(s, s * (0.8 + Math.random() * 0.45), s);
        chunk.add(rock);
      }
    }
  }

  const beltCount = currentQuality === "low" ? 10 : currentQuality === "medium" ? 16 : 24;
  for (let i = 0; i < beltCount; i += 1) {
    const z = zStart + Math.random() * (zEnd - zStart);
    const x = roadCenterX(z) - (65 + Math.random() * 90);
    if (x < originX - chunkSize * 0.5 || x > originX + chunkSize * 0.5) continue;
    if (z < originZ - chunkSize * 0.5 || z > originZ + chunkSize * 0.5) continue;
    if (hash2(Math.floor(x * 0.13), Math.floor(z * 0.13)) > 0.25) {
      createTree(x, z, chunk, 0.75 + Math.random() * 0.45);
    }
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

  for (let x = cx - chunkRadius; x <= cx + chunkRadius; x += 1) {
    for (let z = cz - chunkRadius; z <= cz + chunkRadius; z += 1) {
      const key = `${x},${z}`;
      if (!chunks.has(key)) createChunk(x, z);
    }
  }

  for (const [key, chunk] of chunks.entries()) {
    const [x, z] = key.split(",").map(Number);
    if (Math.abs(x - cx) > chunkRadius + 1 || Math.abs(z - cz) > chunkRadius + 1) {
      scene.remove(chunk);
      disposeChunk(chunk);
      chunks.delete(key);
    }
  }
}

function updateLighting(dt) {
  clockTime = (clockTime + dt * 0.0034) % 1;
  const theta = clockTime * Math.PI * 2;
  const day = THREE.MathUtils.clamp(Math.sin(theta) * 0.92 + 0.38, 0, 1);

  const fogNight = new THREE.Color(0x1c2433);
  const fogDay = new THREE.Color(0xb8d0dd);
  scene.fog.color.copy(fogNight.clone().lerp(fogDay, day));

  const topNight = new THREE.Color(0x101b33);
  const topDay = new THREE.Color(0x6ea6d9);
  const bottomNight = new THREE.Color(0x2f3752);
  const bottomDay = new THREE.Color(0xe4f2f9);
  skyDome.material.uniforms.topColor.value.copy(topNight.clone().lerp(topDay, day));
  skyDome.material.uniforms.bottomColor.value.copy(bottomNight.clone().lerp(bottomDay, day));

  sun.intensity = 0.16 + day * 1.35;
  sun.color.set(day < 0.18 ? 0x96abd9 : 0xfff2d5);
  hemi.intensity = 0.22 + day * 0.92;
  ambient.intensity = 0.12 + day * 0.25;

  const sx = Math.cos(theta) * 245;
  const sy = Math.sin(theta) * 255;
  sun.position.set(sx, Math.max(20, sy), -120);

  renderer.toneMappingExposure = THREE.MathUtils.lerp(0.55, 1.13, day);
  const bloomBase = currentQuality === "low" ? 0.12 : currentQuality === "medium" ? 0.2 : 0.3;
  bloomPass.strength = THREE.MathUtils.lerp(bloomBase * 0.7, bloomBase, day);
}

function updateWeather(dt) {
  weatherTimer -= dt;
  if (weatherTimer <= 0) {
    weatherTimer = 34 + Math.random() * 50;
    const r = Math.random();
    weather = r < 0.58 ? "clear" : r < 0.86 ? "mist" : "rain";
  }

  if (weather === "rain") {
    rainMaterialPoints.opacity = THREE.MathUtils.damp(rainMaterialPoints.opacity, 0.86, 4.2, dt);
    cloudMaterial.opacity = THREE.MathUtils.damp(cloudMaterial.opacity, 0.52, 2.7, dt);
    scene.fog.near = 68;
    scene.fog.far = 850;
  } else if (weather === "mist") {
    rainMaterialPoints.opacity = THREE.MathUtils.damp(rainMaterialPoints.opacity, 0.0, 4.2, dt);
    cloudMaterial.opacity = THREE.MathUtils.damp(cloudMaterial.opacity, 0.4, 2.6, dt);
    scene.fog.near = 56;
    scene.fog.far = 760;
  } else {
    rainMaterialPoints.opacity = THREE.MathUtils.damp(rainMaterialPoints.opacity, 0.0, 4.2, dt);
    cloudMaterial.opacity = THREE.MathUtils.damp(cloudMaterial.opacity, 0.28, 2.6, dt);
    scene.fog.near = 130;
    scene.fog.far = 1700;
  }

  const rp = rain.geometry.attributes.position;
  for (let i = 0; i < rp.count; i += 1) {
    const k = i * 3;
    rp.array[k] += Math.sin(i * 1.7) * dt * 0.32;
    rp.array[k + 1] -= dt * 57;
    rp.array[k + 2] += Math.cos(i * 1.2) * dt * 0.2;
    if (rp.array[k + 1] < 1) {
      rp.array[k] = car.position.x + (Math.random() - 0.5) * 300;
      rp.array[k + 1] = car.position.y + 8 + Math.random() * 110;
      rp.array[k + 2] = car.position.z + (Math.random() - 0.5) * 300;
    }
  }
  rp.needsUpdate = true;

  const cp = clouds.geometry.attributes.position;
  const cloudDrift = weather === "rain" ? 13 : 8;
  for (let i = 0; i < cp.count; i += 1) {
    const k = i * 3;
    cp.array[k + 2] += dt * cloudDrift;
    if (cp.array[k + 2] - car.position.z > 920) {
      cp.array[k] = car.position.x + (Math.random() - 0.5) * 1700;
      cp.array[k + 1] = 190 + Math.random() * 170;
      cp.array[k + 2] = car.position.z - 920;
    }
  }
  cp.needsUpdate = true;
}

function updateCar(dt) {
  const accel = input.throttle ? 24 : 0;
  const brake = input.brake ? 33 : 0;
  const drag = THREE.MathUtils.lerp(2.8, 8.8, Math.min(Math.abs(speed) / 74, 1));
  const boostMul = input.boost ? 1.3 : 1;

  speed += accel * boostMul * dt;
  speed -= brake * dt;
  speed -= Math.sign(speed) * drag * dt;

  if (Math.abs(speed) < 0.015) speed = 0;
  speed = THREE.MathUtils.clamp(speed, -12, 74);

  const steerInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const laneCenter = roadCenterX(car.position.z);
  const laneOffset = (car.position.x - laneCenter) / (roadWidth * 0.5);
  speed -= THREE.MathUtils.clamp(Math.abs(laneOffset) - 0.9, 0, 1) * 10.5 * dt;

  const steerPower = THREE.MathUtils.lerp(1.35, 0.29, Math.min(Math.abs(speed) / 74, 1));
  yaw -= steerInput * steerPower * dt * (speed >= 0 ? 1 : -1);
  yaw += laneOffset * 0.027 * dt;

  car.position.x += Math.sin(yaw) * speed * dt;
  car.position.z += Math.cos(yaw) * speed * dt;

  const groundY = groundAt(car.position.x, car.position.z);
  car.position.y = THREE.MathUtils.damp(car.position.y, groundY + 0.44, 8.5, dt);

  const slope = roadSlopeX(car.position.z + 3.0);
  const accelLong = (speed - prevSpeed) / Math.max(dt, 0.0001);
  prevSpeed = speed;

  steerVisual = THREE.MathUtils.damp(steerVisual, steerInput * 0.58, 9, dt);
  const pitch = THREE.MathUtils.clamp(-accelLong * 0.0055 - slope * 0.07, -0.18, 0.16);
  const roll = THREE.MathUtils.clamp(-steerVisual * Math.min(Math.abs(speed) / 58, 1) * 0.18, -0.24, 0.24);

  car.rotation.y = yaw;
  car.rotation.x = pitch;
  car.rotation.z = roll;

  for (const w of wheelData) {
    if (w.front) w.pivot.rotation.y = steerVisual;
    w.mesh.rotation.x += speed * dt * 0.95;
  }

  const speedRatio = Math.min(Math.abs(speed) / 74, 1);
  const camDistance = THREE.MathUtils.lerp(8.2, 15.5, speedRatio);
  const camHeight = THREE.MathUtils.lerp(3.5, 5.7, speedRatio);

  reusableVecA.set(Math.sin(yaw), 0, Math.cos(yaw));
  reusableVecB.copy(car.position).addScaledVector(reusableVecA, -camDistance);
  reusableVecB.y += camHeight;

  camera.position.lerp(reusableVecB, 1 - Math.exp(-dt * 7.2));
  reusableVecC.copy(car.position).addScaledVector(reusableVecA, 18);
  reusableVecC.y += 1.5;
  camera.lookAt(reusableVecC);

  camera.fov = THREE.MathUtils.lerp(61, 73, speedRatio);
  camera.updateProjectionMatrix();

  const kmh = Math.max(0, speed) * 5.2;
  statusEl.textContent = `Speed ${kmh.toFixed(0)} km/h | Weather ${weather} | Time ${(clockTime * 24).toFixed(1)}h | Quality ${currentQuality}`;
}

function applyQuality(preset) {
  currentQuality = preset;
  const dprBase = window.devicePixelRatio || 1;
  const pixelRatio = preset === "low" ? Math.min(1.0, dprBase) : preset === "medium" ? Math.min(1.35, dprBase) : Math.min(1.85, dprBase);
  renderer.setPixelRatio(pixelRatio);

  if (preset === "low") {
    bloomPass.enabled = false;
    cloudMaterial.size = 28;
  } else if (preset === "medium") {
    bloomPass.enabled = true;
    cloudMaterial.size = 32;
  } else {
    bloomPass.enabled = true;
    cloudMaterial.size = 35;
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
  camera.position.set(x, y + 4.3, -11.8);
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
applyQuality("high");
statusEl.textContent = "Drive forward to begin";

let last = performance.now();
function animate(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  updateCar(dt);
  updateChunks();
  updateLighting(dt);
  updateWeather(dt);

  composer.render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);