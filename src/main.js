import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";

const canvas = document.querySelector("#game");
const statusEl = document.querySelector("#status");
const qualitySelect = document.querySelector("#quality-select");
const scenarioSelect = document.querySelector("#scenario-select");
const touchButtons = Array.from(document.querySelectorAll(".touch-controls button"));

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xc7d7e2, 0.00068);

const camera = new THREE.PerspectiveCamera(63, window.innerWidth / window.innerHeight, 0.1, 3600);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.05, 0.25, 1.0);
composer.addPass(bloomPass);

const hemi = new THREE.HemisphereLight(0xe0efff, 0x738164, 1.08);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2d5, 1.25);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.near = 8;
sun.shadow.camera.far = 850;
sun.shadow.camera.left = -160;
sun.shadow.camera.right = 160;
sun.shadow.camera.top = 160;
sun.shadow.camera.bottom = -160;
sun.shadow.bias = -0.00006;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 6;
scene.add(sun);

const ambient = new THREE.AmbientLight(0xd9e3eb, 0.44);
scene.add(ambient);

const sky = new Sky();
sky.scale.setScalar(9000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms.turbidity.value = 5.2;
skyUniforms.rayleigh.value = 1.2;
skyUniforms.mieCoefficient.value = 0.0012;
skyUniforms.mieDirectionalG.value = 0.67;
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
  grad.addColorStop(0, "#d4d79a");
  grad.addColorStop(1, "#93ab72");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 21000; i += 1) {
    const hue = 68 + Math.random() * 24;
    const sat = 22 + Math.random() * 28;
    const light = 40 + Math.random() * 42;
    ctx.fillStyle = `hsla(${hue},${sat}%,${light}%,${0.07 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5);
  }

  for (let i = 0; i < 6000; i += 1) {
    ctx.fillStyle = "rgba(130,152,98,0.05)";
    ctx.fillRect(Math.random() * s, Math.random() * s, 2.2, 2.2);
  }
});
grassTexture.repeat.set(26, 26);

const snowGroundTexture = makeCanvasTexture(1024, (ctx, s) => {
  const grad = ctx.createLinearGradient(0, 0, 0, s);
  grad.addColorStop(0, "#e8edf4");
  grad.addColorStop(1, "#dce3ee");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 18000; i += 1) {
    const light = 210 + Math.random() * 45;
    ctx.fillStyle = `rgba(${light},${light + 2},${light + 6},${0.06 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }

  for (let i = 0; i < 4000; i += 1) {
    ctx.fillStyle = `rgba(195,205,220,${0.03 + Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 5, 2 + Math.random() * 5);
  }
});
snowGroundTexture.repeat.set(26, 26);

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
const chunkResolution = 56;
let activeChunkRadius = 2;
let densityFactor = 1;

const roadMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  map: roadTexture,
  roughness: 0.9,
  metalness: 0.03,
  clearcoat: 0.08,
  clearcoatRoughness: 0.52,
});
const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0xa89f88, roughness: 0.93, metalness: 0.03 });
const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.83, metalness: 0.0 });
const terrainMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: grassTexture,
  roughness: 0.97,
  metalness: 0,
  vertexColors: true,
  dithering: true,
});
const barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xc9d0d7, roughness: 0.54, metalness: 0.18 });
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xd4cdc0, map: stoneTexture, roughness: 0.96, metalness: 0.01 });
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4f30, roughness: 1, metalness: 0 });
const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x5f7e4d, roughness: 0.95, metalness: 0 });
const cactusMaterial = new THREE.MeshStandardMaterial({ color: 0x6f8751, roughness: 0.96, metalness: 0.02 });
const grassBillboardMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: grassBladeTexture,
  alphaMap: grassBladeTexture,
  transparent: true,
  alphaTest: 0.38,
  side: THREE.DoubleSide,
  roughness: 1,
  metalness: 0,
  vertexColors: true,
  dithering: true,
});

const input = { throttle: false, brake: false, left: false, right: false, boost: false };
const chunks = new Map();
const reusableVecA = new THREE.Vector3();
const reusableVecB = new THREE.Vector3();
const reusableVecC = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);
const reusableColorA = new THREE.Color();
const reusableColorB = new THREE.Color();
const reusableColorC = new THREE.Color();

const scenarioColors = {
  fogNight: new THREE.Color(0x1c2433),
  fogDay: new THREE.Color(0xb6c7d2),
  fogClear: new THREE.Color(0xb8c9d4),
  fogMist: new THREE.Color(0x83919d),
  fogRain: new THREE.Color(0x7d8c98),
  fogSnow: new THREE.Color(0xdce6f2),
  valley: new THREE.Color(0x90a972),
  hill: new THREE.Color(0xd0cd8b),
  nearRoad: new THREE.Color(0xb7a885),
  shadow: new THREE.Color(0x7f9469),
  distantNear: new THREE.Color(0x8ea076),
  distantFar: new THREE.Color(0xa4af8a),
  distantForest: new THREE.Color(0x445a3b),
};
const atmosphereFogColor = new THREE.Color(0xc7d7e2);

const SCENARIO_PRESETS = {
  sunny: {
    label: "sunny",
    forcedWeather: "clear",
    timeStart: 0.26,
    timeRate: 1,
    speedScale: 0.9,
    density: { grass: 1.05, scenic: 1.0, belt: 1.0 },
    sky: { turbidity: 5.2, rayleigh: 1.2, mieCoefficient: 0.0012, mieDirectionalG: 0.67 },
    palette: {
      valley: 0x90a972,
      hill: 0xd0cd8b,
      nearRoad: 0xb7a885,
      shadow: 0x7f9469,
      foliage: 0x5f7e4d,
      trunk: 0x6d4f30,
      stone: 0xd4cdc0,
      barrier: 0xc7ced5,
      shoulder: 0xa89f88,
      lines: 0xf4f1e8,
      distantNear: 0xa7b68a,
      distantFar: 0xc3cda6,
      distantForest: 0x60784f,
      roadTint: 0xffffff,
      grassTint: 0xeef6da,
    },
    fog: {
      night: 0x1c2433,
      day: 0xb6c7d2,
      clear: 0xb8c9d4,
      mist: 0x8f9ca7,
      rain: 0x7d8c98,
      snow: 0xcdd8e6,
      clearNear: 150,
      clearFar: 2200,
      mistNear: 82,
      mistFar: 1120,
      rainNear: 76,
      rainFar: 1180,
      snowNear: 76,
      snowFar: 1100,
    },
    lighting: {
      sunNight: 0.03,
      sunDay: 0.46,
      hemiNight: 0.18,
      hemiDay: 0.62,
      ambientNight: 0.1,
      ambientDay: 0.25,
      sunNightColor: 0x93abd8,
      sunDayColor: 0xfff3da,
      exposureNight: 0.34,
      exposureDay: 0.64,
      minExposure: 0.3,
      glareFactor: 0.45,
      bloomScale: 0.72,
    },
    precip: {
      rainOpacity: 0,
      snowOpacity: 0,
      sizeRain: 0.2,
      sizeSnow: 0.33,
      colorRain: 0xc8ddeb,
      colorSnow: 0xf2f7ff,
      rainFall: 58,
      snowFall: 14,
      windRain: 0.26,
      windSnow: 1.05,
      cloudClear: 0.3,
      cloudStorm: 0.52,
      cloudSnow: 0.44,
    },
  },
  rainy: {
    label: "rainy",
    forcedWeather: "rain",
    timeStart: 0.24,
    timeRate: 0.72,
    speedScale: 0.82,
    density: { grass: 1.0, scenic: 0.95, belt: 0.95 },
    sky: { turbidity: 8.2, rayleigh: 0.72, mieCoefficient: 0.0048, mieDirectionalG: 0.73 },
    palette: {
      valley: 0x5e7967,
      hill: 0x7f9276,
      nearRoad: 0x7f7f76,
      shadow: 0x4f6255,
      foliage: 0x486451,
      trunk: 0x5f4832,
      stone: 0xa7a7a5,
      barrier: 0xaab6c1,
      shoulder: 0x8a8c84,
      lines: 0xece8de,
      distantNear: 0x6f7f73,
      distantFar: 0x879185,
      distantForest: 0x3c5044,
      roadTint: 0xcfd4dc,
      grassTint: 0xe6ebe7,
    },
    fog: {
      night: 0x1a2230,
      day: 0x788591,
      clear: 0x7d8c97,
      mist: 0x76828d,
      rain: 0x707e8a,
      snow: 0xb8c4d1,
      clearNear: 120,
      clearFar: 1500,
      mistNear: 70,
      mistFar: 920,
      rainNear: 66,
      rainFar: 940,
      snowNear: 72,
      snowFar: 980,
    },
    lighting: {
      sunNight: 0.03,
      sunDay: 0.37,
      hemiNight: 0.14,
      hemiDay: 0.35,
      ambientNight: 0.08,
      ambientDay: 0.16,
      sunNightColor: 0x8ea4cf,
      sunDayColor: 0xdbe6f0,
      exposureNight: 0.28,
      exposureDay: 0.44,
      minExposure: 0.18,
      glareFactor: 0.75,
      bloomScale: 0.5,
    },
    precip: {
      rainOpacity: 0.86,
      snowOpacity: 0,
      sizeRain: 0.21,
      sizeSnow: 0.32,
      colorRain: 0xbad1e2,
      colorSnow: 0xf2f7ff,
      rainFall: 78,
      snowFall: 14,
      windRain: 0.34,
      windSnow: 1.05,
      cloudClear: 0.5,
      cloudStorm: 0.64,
      cloudSnow: 0.5,
    },
  },
  snow: {
    label: "snow",
    forcedWeather: "snow",
    timeStart: 0.3,
    timeRate: 0.68,
    speedScale: 0.74,
    density: { grass: 0, scenic: 0.7, belt: 0.6 },
    sky: { turbidity: 7.5, rayleigh: 0.85, mieCoefficient: 0.004, mieDirectionalG: 0.72 },
    palette: {
      valley: 0xe8eef5,
      hill: 0xf5f8fc,
      nearRoad: 0xe0e7f0,
      shadow: 0xc8d4e2,
      foliage: 0xb8c4be,
      trunk: 0x8a8078,
      stone: 0xd8dee8,
      barrier: 0xe2e8f0,
      shoulder: 0xd5dce6,
      lines: 0xfafcff,
      distantNear: 0xdbe4ef,
      distantFar: 0xecf1f8,
      distantForest: 0xb0b8b4,
      roadTint: 0xe0e6ee,
      grassTint: 0xf0f5fc,
    },
    fog: {
      night: 0x2a3344,
      day: 0xc8d6e4,
      clear: 0xd0dce8,
      mist: 0xc8d8e6,
      rain: 0xb4c2cf,
      snow: 0xdce8f2,
      clearNear: 90,
      clearFar: 1100,
      mistNear: 60,
      mistFar: 850,
      rainNear: 70,
      rainFar: 920,
      snowNear: 50,
      snowFar: 750,
    },
    lighting: {
      sunNight: 0.02,
      sunDay: 0.35,
      hemiNight: 0.12,
      hemiDay: 0.42,
      ambientNight: 0.08,
      ambientDay: 0.18,
      sunNightColor: 0x94a8d2,
      sunDayColor: 0xe4ecf6,
      exposureNight: 0.26,
      exposureDay: 0.40,
      minExposure: 0.18,
      glareFactor: 0.50,
      bloomScale: 0.6,
    },
    precip: {
      rainOpacity: 0,
      snowOpacity: 0.92,
      sizeRain: 0.2,
      sizeSnow: 0.45,
      colorRain: 0xc8ddeb,
      colorSnow: 0xf8fcff,
      rainFall: 58,
      snowFall: 12,
      windRain: 0.26,
      windSnow: 0.9,
      cloudClear: 0.52,
      cloudStorm: 0.55,
      cloudSnow: 0.62,
    },
  },
  desert: {
    label: "desert",
    forcedWeather: "clear",
    timeStart: 0.33,
    timeRate: 0.95,
    speedScale: 0.86,
    density: { grass: 0.0, scenic: 1.0, belt: 0.72 },
    sky: { turbidity: 3.4, rayleigh: 0.42, mieCoefficient: 0.0012, mieDirectionalG: 0.59 },
    palette: {
      valley: 0xd5a15a,
      hill: 0xf0cb8d,
      nearRoad: 0xc29462,
      shadow: 0xa36f45,
      foliage: 0x8e864f,
      trunk: 0x7f6740,
      stone: 0xbca37d,
      barrier: 0xb8b0a1,
      shoulder: 0xaa9470,
      lines: 0xf9f3dc,
      distantNear: 0xcf9250,
      distantFar: 0xe1b77d,
      distantForest: 0xa68452,
      roadTint: 0xe6d3b4,
      grassTint: 0xd9bc84,
    },
    fog: {
      night: 0x2b2730,
      day: 0xe0b983,
      clear: 0xe2bc88,
      mist: 0xd2ae85,
      rain: 0xb7a18a,
      snow: 0xd9ccb9,
      clearNear: 140,
      clearFar: 1900,
      mistNear: 100,
      mistFar: 1280,
      rainNear: 88,
      rainFar: 1160,
      snowNear: 88,
      snowFar: 1160,
    },
    lighting: {
      sunNight: 0.03,
      sunDay: 0.5,
      hemiNight: 0.12,
      hemiDay: 0.41,
      ambientNight: 0.07,
      ambientDay: 0.13,
      sunNightColor: 0xa0abcf,
      sunDayColor: 0xffd28f,
      exposureNight: 0.3,
      exposureDay: 0.46,
      minExposure: 0.2,
      glareFactor: 0.66,
      bloomScale: 0.62,
    },
    precip: {
      rainOpacity: 0,
      snowOpacity: 0,
      sizeRain: 0.2,
      sizeSnow: 0.33,
      colorRain: 0xc8ddeb,
      colorSnow: 0xf2f7ff,
      rainFall: 58,
      snowFall: 14,
      windRain: 0.26,
      windSnow: 1.05,
      cloudClear: 0.16,
      cloudStorm: 0.35,
      cloudSnow: 0.28,
    },
  },
};

let speed = 0;
let yaw = 0;
let steerVisual = 0;
let clockTime = 0.28;
let weather = "clear";
let weatherTimer = 18;
let prevSpeed = 0;
let currentQuality = "high";
let currentScenario = "sunny";
let activeScenario = SCENARIO_PRESETS.sunny;
let scenarioGrassDensity = 1;
let scenarioScenicDensity = 1;
let scenarioBeltDensity = 1;
let fixedWeather = "clear";

const BASE_MAX_FORWARD_SPEED = 22;
let maxForwardSpeed = BASE_MAX_FORWARD_SPEED;
const MAX_REVERSE_SPEED = 4.8;
const SPEED_TO_KMH = 3.1;
const car = new THREE.Group();
car.rotation.order = "YXZ";

const bodyPaint = new THREE.MeshPhysicalMaterial({
  color: 0xfafbff,
  metalness: 0.5,
  roughness: 0.22,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  sheen: 0.2,
  sheenRoughness: 0.35,
  reflectivity: 0.75,
});
const glassPaint = new THREE.MeshPhysicalMaterial({
  color: 0x90a9be,
  metalness: 0,
  roughness: 0.05,
  transmission: 0.74,
  thickness: 0.16,
  ior: 1.47,
  reflectivity: 0.95,
});
const trimPaint = new THREE.MeshStandardMaterial({ color: 0x191f25, metalness: 0.18, roughness: 0.58 });
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
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x101419, roughness: 0.72, metalness: 0.24 });

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

car.traverse((obj) => {
  if (obj.isMesh) {
    obj.castShadow = true;
    obj.receiveShadow = true;
  }
});

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
const cloudCount = 160;
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
const rainCount = 1800;
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


const snowTexture = makeCanvasTexture(64, (ctx, s) => {
  const center = s / 2;
  const radius = s / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.18, "rgba(250, 252, 255, 0.95)");
  grad.addColorStop(0.45, "rgba(240, 246, 255, 0.6)");
  grad.addColorStop(0.75, "rgba(230, 240, 255, 0.2)");
  grad.addColorStop(1, "rgba(220, 235, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
});

const snowGeometry = new THREE.BufferGeometry();
const snowCount = 10000;
const snowArr = new Float32Array(snowCount * 3);
const snowSizes = new Float32Array(snowCount);
for (let i = 0; i < snowCount; i += 1) {
  snowArr[i * 3] = (Math.random() - 0.5) * 400;
  snowArr[i * 3 + 1] = Math.random() * 140;
  snowArr[i * 3 + 2] = (Math.random() - 0.5) * 400;
  snowSizes[i] = 0.5 + Math.random() * 1.5;
}
snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowArr, 3));
snowGeometry.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));
const snowMaterialPoints = new THREE.PointsMaterial({ size: 1.8, map: snowTexture, transparent: true, opacity: 0, depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true, color: 0xffffff });
const snow = new THREE.Points(snowGeometry, snowMaterialPoints);
snow.frustumCulled = false;
scene.add(snow);

const distantTerrainMaterialNear = new THREE.MeshStandardMaterial({
  color: 0x8ea076,
  roughness: 0.98,
  metalness: 0,
  transparent: true,
  opacity: 0.94,
  fog: true,
  dithering: true,
});
const distantTerrainMaterialFar = new THREE.MeshStandardMaterial({
  color: 0xa4af8a,
  roughness: 1,
  metalness: 0,
  transparent: true,
  opacity: 0.84,
  fog: true,
  dithering: true,
});
const distantForestMaterial = new THREE.MeshStandardMaterial({
  color: 0x445a3b,
  roughness: 1,
  metalness: 0,
  transparent: true,
  opacity: 0.88,
  fog: true,
  dithering: true,
});
const distantDesertSpireMaterial = new THREE.MeshStandardMaterial({
  color: 0xb8925c,
  roughness: 1,
  metalness: 0,
  fog: true,
});

function capitalizeWord(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function applyScenario(name, rebuildWorld = true) {
  const next = SCENARIO_PRESETS[name] || SCENARIO_PRESETS.sunny;
  currentScenario = SCENARIO_PRESETS[name] ? name : "sunny";
  activeScenario = next;
  fixedWeather = next.forcedWeather || null;
  weather = fixedWeather || weather;
  weatherTimer = 18;
  clockTime = next.timeStart;

  scenarioGrassDensity = next.density.grass;
  scenarioScenicDensity = next.density.scenic;
  scenarioBeltDensity = next.density.belt;
  maxForwardSpeed = BASE_MAX_FORWARD_SPEED * next.speedScale;

  skyUniforms.turbidity.value = next.sky.turbidity;
  skyUniforms.rayleigh.value = next.sky.rayleigh;
  skyUniforms.mieCoefficient.value = next.sky.mieCoefficient;
  skyUniforms.mieDirectionalG.value = next.sky.mieDirectionalG;

  scenarioColors.fogNight.setHex(next.fog.night);
  scenarioColors.fogDay.setHex(next.fog.day);
  scenarioColors.fogClear.setHex(next.fog.clear);
  scenarioColors.fogMist.setHex(next.fog.mist);
  scenarioColors.fogRain.setHex(next.fog.rain);
  scenarioColors.fogSnow.setHex(next.fog.snow);
  scenarioColors.valley.setHex(next.palette.valley);
  scenarioColors.hill.setHex(next.palette.hill);
  scenarioColors.nearRoad.setHex(next.palette.nearRoad);
  scenarioColors.shadow.setHex(next.palette.shadow);
  scenarioColors.distantNear.setHex(next.palette.distantNear);
  scenarioColors.distantFar.setHex(next.palette.distantFar);
  scenarioColors.distantForest.setHex(next.palette.distantForest);

  roadMaterial.color.setHex(next.palette.roadTint);
  shoulderMaterial.color.setHex(next.palette.shoulder);
  lineMaterial.color.setHex(next.palette.lines);
  barrierMaterial.color.setHex(next.palette.barrier);
  stoneMaterial.color.setHex(next.palette.stone);
  trunkMaterial.color.setHex(next.palette.trunk);
  foliageMaterial.color.setHex(next.palette.foliage);
  cactusMaterial.color.setHex(currentScenario === "desert" ? 0x6f8751 : 0x6f8751);
  grassBillboardMaterial.color.setHex(next.palette.grassTint);
  terrainMaterial.map = currentScenario === "snow" ? snowGroundTexture : grassTexture;
  terrainMaterial.needsUpdate = true;
  distantTerrainMaterialNear.color.copy(scenarioColors.distantNear);
  distantTerrainMaterialFar.color.copy(scenarioColors.distantFar);
  distantForestMaterial.color.copy(scenarioColors.distantForest);
  distantTerrainMaterialNear.opacity = 0.94;
  distantTerrainMaterialFar.opacity = 0.84;
  distantForestMaterial.opacity = 0.88;
  distantDesertSpireMaterial.color.setHex(currentScenario === "desert" ? 0xb8925c : next.palette.distantFar);
  distantForest.visible = currentScenario !== "desert";
  distantDesertSpires.visible = currentScenario === "desert";

  rainMaterialPoints.color.setHex(next.precip.colorRain);
  rainMaterialPoints.size = next.precip.sizeRain;
  snowMaterialPoints.color.setHex(next.precip.colorSnow || 0xffffff);
  snowMaterialPoints.size = (next.precip.sizeSnow || 0.45) * 2.8;
  cloudMaterial.opacity = next.precip.cloudClear;

  scene.fog.color.copy(scenarioColors.fogClear);
  atmosphereFogColor.copy(scenarioColors.fogClear);
  scene.fog.density = THREE.MathUtils.clamp(0.96 / Math.max(next.fog.clearFar - next.fog.clearNear, 280), 0.00036, 0.0029);

  if (rebuildWorld) {
    clearChunks();
    updateChunks();
  }
}

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

function createDistantSpireBand(radius, count, seed) {
  const rng = createRng(seed);
  const mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(8, 13, 96, 6), distantDesertSpireMaterial, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i += 1) {
    const a = rng() * Math.PI * 2;
    const r = radius + (rng() - 0.5) * 340;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = -125 + fbm((x + seed * 17) * 0.00065, (z - seed * 9) * 0.00065) * 70;
    const s = 0.55 + rng() * 1.5;

    dummy.position.set(x, y + 24 * s, z);
    dummy.rotation.y = rng() * Math.PI * 2;
    dummy.scale.set(s, 0.7 + rng() * 1.35, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

const distantRingNear = buildDistantRing(1400, 3200, 14, 72, 11, distantTerrainMaterialNear);
const distantRingFar = buildDistantRing(3200, 5600, 10, 72, 23, distantTerrainMaterialFar);
const distantForest = createDistantForestBand(2600, 380, 41);
const distantDesertSpires = createDistantSpireBand(2480, 140, 59);
distantDesertSpires.visible = false;
scene.add(distantRingNear, distantRingFar, distantForest, distantDesertSpires);

function updateDistantBackdrop() {
  distantRingNear.position.x = car.position.x;
  distantRingNear.position.z = car.position.z;

  distantRingFar.position.x = car.position.x;
  distantRingFar.position.z = car.position.z;

  distantForest.position.x = car.position.x;
  distantForest.position.z = car.position.z;

  distantDesertSpires.position.x = car.position.x;
  distantDesertSpires.position.z = car.position.z;

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

  if (currentScenario === "desert") {
    const broad = fbm(x * 0.0009, z * 0.0009) * 18;
    const dunes = Math.sin(x * 0.016 + z * 0.006) * 6 + Math.sin(z * 0.022 - x * 0.004) * 3.5;
    const duneNoise = fbm(x * 0.0042, z * 0.0042) * 14 + fbm(x * 0.012, z * 0.012) * 3.2;
    const sideRise = Math.pow(THREE.MathUtils.clamp(Math.abs(side) / 120, 0, 1), 1.25) * 18;
    const shoulderShelf = -smoothstep(12, 84, Math.abs(side)) * 3.5;
    return broad + dunes + duneNoise + sideRise + shoulderShelf - 10;
  }

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
  const geo = new THREE.PlaneGeometry(width, zLen, 5, 76);
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
  for (let i = 0; i < pos.count; i += 1) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    const wx = originX + lx;
    const wz = originZ + lz;
    const y = groundAt(wx, wz);
    pos.setXYZ(i, wx, y, wz);

    const side = sideFromRoad(wx, wz);
    const roadDist = Math.abs(side);
    const hill = smoothstep(-14, 54, y);
    const nearRoad = 1 - smoothstep(roadWidth * 0.72, roadShoulder + 24, roadDist);
    const macroNoise = fbm(wx * 0.0065, wz * 0.0065);
    const patchNoise = fbm(wx * 0.018, wz * 0.018);
    const tintNoise = smoothNoise(wx * 0.045 + 17.3, wz * 0.045 - 11.8);
    const sampleOffset = 6;
    const dx = groundAt(wx + sampleOffset, wz) - groundAt(wx - sampleOffset, wz);
    const dz = groundAt(wx, wz + sampleOffset) - groundAt(wx, wz - sampleOffset);
    const slope = THREE.MathUtils.clamp(Math.hypot(dx, dz) / 7.5, 0, 1);
    const slopeBias = THREE.MathUtils.clamp((side + 18) / 150, 0, 1);
    const valleyBias = THREE.MathUtils.clamp((-side + 24) / 180, 0, 1);
    const shade = THREE.MathUtils.clamp(0.62 + (macroNoise - 0.5) * 0.18 - slope * 0.16, 0, 1);

    color
      .copy(scenarioColors.valley)
      .lerp(scenarioColors.hill, hill * 0.46 + slopeBias * 0.12 + patchNoise * 0.12)
      .lerp(scenarioColors.nearRoad, nearRoad * 0.26)
      .lerp(scenarioColors.shadow, valleyBias * 0.12 + slope * 0.08);

    color.offsetHSL(
      (macroNoise - 0.5) * 0.025,
      (tintNoise - 0.5) * 0.08,
      (shade - 0.5) * 0.14 + (patchNoise - 0.5) * 0.05
    );

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    uv.setXY(i, wx / 105, wz / 105);
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  const terrainMesh = new THREE.Mesh(geo, terrainMaterial);
  terrainMesh.receiveShadow = true;
  return terrainMesh;
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

function createCactus(x, z, group, rng = Math.random) {
  const y = terrainHeight(x, z);
  const height = 2.1 + rng() * 2.8;

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, height, 8), cactusMaterial);
  trunk.position.set(x, y + height * 0.5, z);
  group.add(trunk);

  const armHeight = height * (0.34 + rng() * 0.12);
  const armLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, armHeight, 8), cactusMaterial);
  armLeft.position.set(x - 0.32, y + height * 0.56, z);
  armLeft.rotation.z = Math.PI * 0.36;
  group.add(armLeft);

  const armRight = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, armHeight * 0.82, 8), cactusMaterial);
  armRight.position.set(x + 0.34, y + height * 0.58, z);
  armRight.rotation.z = -Math.PI * 0.34;
  group.add(armRight);
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
  if (currentScenario === "desert") return;

  const baseCount = currentQuality === "low" ? 72 : currentQuality === "medium" ? 120 : 180;
  const count = Math.floor(baseCount * densityFactor * scenarioGrassDensity);
  if (count <= 0) return;

  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 1.5), grassBillboardMaterial, count);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

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

    const dryNoise = smoothNoise(x * 0.035 + 9.2, z * 0.035 - 4.6);
    const lushNoise = fbm(x * 0.02 - 6.4, z * 0.02 + 12.8);
    const tintLightness = THREE.MathUtils.clamp(0.76 + (lushNoise - dryNoise) * 0.08, 0.68, 0.84);
    tint.setHSL(0.24 + (lushNoise - 0.5) * 0.035, 0.2 + dryNoise * 0.08, tintLightness);
    mesh.setColorAt(i, tint);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  chunk.add(mesh);
}

function createChunk(cx, cz) {
  const chunk = new THREE.Group();
  const originX = cx * chunkSize;
  const originZ = cz * chunkSize;
  const rng = createRng(chunkSeed(cx, cz));
  const isDesert = currentScenario === "desert";

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

  road.receiveShadow = true;
  shoulderL.receiveShadow = true;
  shoulderR.receiveShadow = true;

  chunk.add(road, shoulderL, shoulderR, centerL, centerR, edgeL, edgeR);

  createGrassBand(zStart, zEnd, -1, chunk, rng);
  createGrassBand(zStart, zEnd, 1, chunk, rng);

  for (let z = zStart; z < zEnd; z += isDesert ? 7.8 : 4.2) {
    if ((Math.floor(z / (isDesert ? 16 : 13)) & 1) === 0) createBarrier(z, -1, chunk);
    if (!isDesert && (Math.floor(z / 18) & 1) === 0) createWallSegment(z, 1, chunk);
  }

  const scenicBase = isDesert ? (currentQuality === "low" ? 14 : currentQuality === "medium" ? 22 : 32) : (currentQuality === "low" ? 24 : currentQuality === "medium" ? 42 : 62);
  const scenicCount = Math.floor(scenicBase * densityFactor * scenarioScenicDensity);
  for (let i = 0; i < scenicCount; i += 1) {
    const rx = originX + (rng() - 0.5) * chunkSize;
    const rz = originZ + (rng() - 0.5) * chunkSize;
    const side = sideFromRoad(rx, rz);
    const dist = Math.abs(side);
    if (dist < roadShoulder + 7) continue;

    if (isDesert) {
      if (rng() > 0.62) createCactus(rx, rz, chunk, rng);
      else createRock(rx, rz, chunk, rng);
      continue;
    }

    if (side < -20) {
      if (rng() > 0.33) createTree(rx, rz, chunk, 0.88 + rng() * 0.55, rng);
      else createShrub(rx, rz, chunk, rng);
    } else if (rng() > 0.6) {
      createShrub(rx, rz, chunk, rng);
    } else {
      createRock(rx, rz, chunk, rng);
    }
  }

  const beltBase = isDesert ? (currentQuality === "low" ? 8 : currentQuality === "medium" ? 12 : 18) : (currentQuality === "low" ? 12 : currentQuality === "medium" ? 20 : 30);
  const beltCount = Math.floor(beltBase * densityFactor * scenarioBeltDensity);
  for (let i = 0; i < beltCount; i += 1) {
    const z = zStart + rng() * (zEnd - zStart);
    const sideDir = rng() > 0.5 ? -1 : 1;
    const x = roadCenterX(z) + sideDir * (isDesert ? 54 + rng() * 96 : 70 + rng() * 105);
    if (x < originX - chunkSize * 0.5 || x > originX + chunkSize * 0.5) continue;
    if (z < originZ - chunkSize * 0.5 || z > originZ + chunkSize * 0.5) continue;

    if (isDesert) {
      if (rng() > 0.45) createCactus(x, z, chunk, rng);
      else createRock(x, z, chunk, rng);
    } else if (rng() > 0.2) {
      createTree(x, z, chunk, 0.72 + rng() * 0.46, rng);
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
  clockTime = (clockTime + dt * 0.0035 * activeScenario.timeRate) % 1;
  const theta = clockTime * Math.PI * 2;
  const day = THREE.MathUtils.clamp(Math.sin(theta) * 0.9 + 0.4, 0, 1);

  const elevation = THREE.MathUtils.lerp(-8, 50, day);
  const azimuth = (clockTime * 360 + 190) % 360;
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const t = THREE.MathUtils.degToRad(azimuth);

  skySunPosition.setFromSphericalCoords(1, phi, t);
  skyUniforms.sunPosition.value.copy(skySunPosition);

  const weatherHaze = weather === "rain" ? 0.85 : weather === "snow" ? 0.72 : currentScenario === "desert" ? 0.58 : 0.48;
  skyUniforms.rayleigh.value = THREE.MathUtils.damp(skyUniforms.rayleigh.value, activeScenario.sky.rayleigh * (0.72 + day * 0.34), 2.6, dt);
  skyUniforms.mieCoefficient.value = THREE.MathUtils.damp(skyUniforms.mieCoefficient.value, activeScenario.sky.mieCoefficient + weatherHaze * 0.00072, 2.6, dt);
  skyUniforms.turbidity.value = THREE.MathUtils.damp(skyUniforms.turbidity.value, activeScenario.sky.turbidity + weatherHaze * 1.42, 2.2, dt);

  const light = activeScenario.lighting;
  sun.position.copy(skySunPosition).multiplyScalar(540);
  sun.intensity = THREE.MathUtils.lerp(light.sunNight, light.sunDay * 0.96, day);
  sun.color.set(day < 0.2 ? light.sunNightColor : light.sunDayColor);
  hemi.intensity = THREE.MathUtils.lerp(light.hemiNight + 0.06, light.hemiDay + 0.14, day);
  ambient.intensity = THREE.MathUtils.lerp(light.ambientNight + 0.08, light.ambientDay + 0.14, day);

  atmosphereFogColor.copy(scenarioColors.fogNight).lerp(scenarioColors.fogDay, day);
  reusableColorA.copy(atmosphereFogColor).lerp(scenarioColors.fogClear, 0.16 + day * 0.18);
  scene.fog.color.copy(reusableColorA);

  const baseExposure = THREE.MathUtils.lerp(light.exposureNight, light.exposureDay, day);
  reusableVecA.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
  reusableVecB.copy(sun.position).normalize();
  const glare = Math.pow(Math.max(0, reusableVecA.dot(reusableVecB)), 2.6);
  renderer.toneMappingExposure = Math.max(light.minExposure + 0.04, baseExposure * (1 - glare * light.glareFactor * 0.58));

  const bloomBase = currentQuality === "low" ? 0.0 : currentQuality === "medium" ? 0.012 : 0.022;
  bloomPass.strength = THREE.MathUtils.lerp(bloomBase * 0.12, bloomBase * 0.28, day) * (1 - glare * 0.72) * light.bloomScale;

  const isNight = day < 0.24;
  const targetIntensity = isNight ? 180 : 0;
  const targetHeadlightGlow = isNight ? 3.0 : 0;

  spotLightL.intensity = THREE.MathUtils.lerp(spotLightL.intensity, targetIntensity, 0.05);
  spotLightL.target.updateMatrixWorld();
  spotLightR.intensity = THREE.MathUtils.lerp(spotLightR.intensity, targetIntensity, 0.05);
  spotLightR.target.updateMatrixWorld();
  headLightPaint.emissiveIntensity = THREE.MathUtils.lerp(headLightPaint.emissiveIntensity, targetHeadlightGlow, 0.05);
}
function updateWeather(dt) {
  if (!fixedWeather) {
    weatherTimer -= dt;
    if (weatherTimer <= 0) {
      weatherTimer = 36 + Math.random() * 52;
      const r = Math.random();
      weather = r < 0.58 ? "clear" : r < 0.86 ? "mist" : "rain";
    }
  } else {
    weather = fixedWeather;
  }

  const fog = activeScenario.fog;
  const precip = activeScenario.precip;

  let targetDropOpacity = 0;
  let targetSnowOpacity = 0;
  let targetCloudOpacity = precip.cloudClear;
  let fogNear = fog.clearNear;
  let fogFar = fog.clearFar;
  let fogTint = scenarioColors.fogClear;
  let roadRoughness = 0.94;
  let dropColor = precip.colorRain;
  let dropSize = precip.sizeRain;
  let fallSpeed = precip.rainFall;
  let windScale = precip.windRain;

  if (weather === "rain") {
    targetDropOpacity = precip.rainOpacity;
    targetCloudOpacity = precip.cloudStorm;
    fogNear = fog.rainNear;
    fogFar = fog.rainFar;
    fogTint = scenarioColors.fogRain;
    roadRoughness = currentScenario === "rainy" ? 0.56 : 0.64;
    dropColor = precip.colorRain;
    dropSize = precip.sizeRain;
    fallSpeed = precip.rainFall;
    windScale = precip.windRain;
  } else if (weather === "snow") {
    targetSnowOpacity = precip.snowOpacity;
    targetCloudOpacity = precip.cloudSnow;
    fogNear = fog.snowNear;
    fogFar = fog.snowFar;
    fogTint = scenarioColors.fogSnow;
    roadRoughness = 0.9;
    fallSpeed = precip.snowFall;
    windScale = precip.windSnow;
  } else if (weather === "mist") {
    targetDropOpacity = 0;
    targetCloudOpacity = Math.max(precip.cloudClear, 0.44);
    fogNear = fog.mistNear;
    fogFar = fog.mistFar;
    fogTint = scenarioColors.fogMist;
    roadRoughness = 0.82;
  } else if (currentScenario === "desert") {
    roadRoughness = 0.9;
  }

  rainMaterialPoints.color.setHex(dropColor);
  rainMaterialPoints.size = dropSize;
  rainMaterialPoints.opacity = THREE.MathUtils.damp(rainMaterialPoints.opacity, targetDropOpacity, 4.1, dt);

  snowMaterialPoints.opacity = THREE.MathUtils.damp(snowMaterialPoints.opacity, targetSnowOpacity, 3.5, dt);

  cloudMaterial.opacity = THREE.MathUtils.damp(cloudMaterial.opacity, targetCloudOpacity, 2.6, dt);
  scene.fog.density = THREE.MathUtils.damp(
    scene.fog.density,
    THREE.MathUtils.clamp(1.06 / Math.max(fogFar - fogNear, 220), 0.00038, 0.0031),
    3.1,
    dt
  );
  reusableColorB.copy(atmosphereFogColor).lerp(
    fogTint,
    weather === "mist" ? 0.58 : weather === "rain" ? 0.52 : weather === "snow" ? 0.5 : 0.36
  );
  scene.fog.color.lerp(reusableColorB, 0.25);
  roadMaterial.roughness = THREE.MathUtils.damp(roadMaterial.roughness, roadRoughness, 3.2, dt);

  const haze = THREE.MathUtils.clamp((scene.fog.density - 0.00035) / 0.0026, 0, 1);
  distantTerrainMaterialNear.opacity = THREE.MathUtils.lerp(0.94, 0.72, haze);
  distantTerrainMaterialFar.opacity = THREE.MathUtils.lerp(0.84, 0.48, haze);
  distantForestMaterial.opacity = THREE.MathUtils.lerp(0.88, 0.58, haze);
  reusableColorC.copy(scenarioColors.distantNear).lerp(scene.fog.color, 0.18 + haze * 0.3);
  distantTerrainMaterialNear.color.copy(reusableColorC);
  reusableColorC.copy(scenarioColors.distantFar).lerp(scene.fog.color, 0.32 + haze * 0.42);
  distantTerrainMaterialFar.color.copy(reusableColorC);
  reusableColorC.copy(scenarioColors.distantForest).lerp(scene.fog.color, 0.14 + haze * 0.24);
  distantForestMaterial.color.copy(reusableColorC);

  if (rainMaterialPoints.opacity > 0.01 || targetDropOpacity > 0) {
    const rp = rain.geometry.attributes.position;
    for (let i = 0; i < rp.count; i += 1) {
      const k = i * 3;
      rp.array[k] += Math.sin(i * 1.7) * dt * windScale;
      rp.array[k + 1] -= dt * fallSpeed;
      rp.array[k + 2] += Math.cos(i * 1.2) * dt * windScale * 0.7;
      if (rp.array[k + 1] < car.position.y - 10) {
        rp.array[k] = car.position.x + (Math.random() - 0.5) * 320;
        rp.array[k + 1] = car.position.y + 8 + Math.random() * 118;
        rp.array[k + 2] = car.position.z + (Math.random() - 0.5) * 320;
      }
    }
    rp.needsUpdate = true;
  }

  if (snowMaterialPoints.opacity > 0.01 || targetSnowOpacity > 0) {
    const sp = snow.geometry.attributes.position;
    const time = clockTime * 40.0;
    for (let i = 0; i < sp.count; i += 1) {
      const k = i * 3;
      const phase = i * 13.5;
      const layerSpeed = 0.6 + (i % 5) * 0.18;
      const flutter = Math.sin(phase + time * 0.5);
      sp.array[k] += (flutter * 1.4 + windScale * 2.0) * dt * 3.5;
      sp.array[k + 1] -= dt * (fallSpeed * layerSpeed);
      sp.array[k + 2] += (Math.cos(phase + time * 0.35) * 1.2 + windScale * 1.5) * dt * 3.5;
      if (sp.array[k + 1] < car.position.y - 8) {
        sp.array[k] = car.position.x + (Math.random() - 0.5) * 400;
        sp.array[k + 1] = car.position.y + 10 + Math.random() * 140;
        sp.array[k + 2] = car.position.z + (Math.random() - 0.5) * 400;
      }
    }
    sp.needsUpdate = true;
  }

  const cp = clouds.geometry.attributes.position;
  const cloudDrift = weather === "rain" ? 13 : weather === "snow" ? 7 : currentScenario === "desert" ? 10 : 8;
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
  const drag = THREE.MathUtils.lerp(3.3, 8.2, Math.min(Math.abs(speed) / maxForwardSpeed, 1));
  const boostMul = input.boost ? 1.14 : 1;

  speed += accel * boostMul * dt;
  speed -= brake * dt;
  speed -= Math.sign(speed) * drag * dt;

  if (Math.abs(speed) < 0.015) speed = 0;
  speed = THREE.MathUtils.clamp(speed, -MAX_REVERSE_SPEED, maxForwardSpeed);

  const steerInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const laneCenter = roadCenterX(car.position.z);
  const laneOffset = (car.position.x - laneCenter) / (roadWidth * 0.5);
  speed -= THREE.MathUtils.clamp(Math.abs(laneOffset) - 0.9, 0, 1) * 10.8 * dt;

  const steerPower = THREE.MathUtils.lerp(1.38, 0.36, Math.min(Math.abs(speed) / maxForwardSpeed, 1));
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
  const roll = THREE.MathUtils.clamp(-steerVisual * Math.min(Math.abs(speed) / maxForwardSpeed, 1) * 0.16, -0.22, 0.22);

  car.rotation.y = yaw;
  car.rotation.x = pitch;
  car.rotation.z = roll;

  const brakeGlow = input.brake ? 2.2 : 0.7;
  tailLightPaint.emissiveIntensity = THREE.MathUtils.damp(tailLightPaint.emissiveIntensity, brakeGlow, 7, dt);

  for (const w of wheelData) {
    if (w.front) w.pivot.rotation.y = steerVisual;
    w.mesh.rotation.x += speed * dt * 0.95;
  }

  const speedRatio = Math.min(Math.abs(speed) / maxForwardSpeed, 1);
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
  statusEl.textContent = `Speed ${kmh.toFixed(0)} km/h | Weather ${capitalizeWord(weather)} | Scenario ${capitalizeWord(currentScenario)} | Time ${(clockTime * 24).toFixed(1)}h | Quality ${currentQuality}`;
}

function applyQuality(preset) {
  currentQuality = preset;
  const dprBase = window.devicePixelRatio || 1;

  if (preset === "low") {
    renderer.setPixelRatio(Math.min(0.95, dprBase));
    activeChunkRadius = 1;
    densityFactor = 0.5;
    bloomPass.enabled = false;
    cloudMaterial.size = 26;
  } else if (preset === "medium") {
    renderer.setPixelRatio(Math.min(1.15, dprBase));
    activeChunkRadius = 2;
    densityFactor = 0.72;
    bloomPass.enabled = true;
    cloudMaterial.size = 30;
  } else {
    renderer.setPixelRatio(Math.min(1.35, dprBase));
    activeChunkRadius = 2;
    densityFactor = 0.95;
    bloomPass.enabled = true;
    cloudMaterial.size = 33;
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
scenarioSelect.addEventListener("change", () => applyScenario(scenarioSelect.value));

bindTouchControls();
resetCar();
updateDistantBackdrop();
if (!SCENARIO_PRESETS[scenarioSelect.value]) {
  scenarioSelect.value = "sunny";
}
applyScenario(scenarioSelect.value, false);
applyQuality(qualitySelect.value || "high");
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

