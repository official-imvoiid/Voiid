import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * engine.js - loads and shows 3D models: the 3D & Editing viewer, the card
 * pictures, and the admin's "make thumbnail".
 *
 *   vrm            VRoid Studio (pixiv) avatars - with hair/cloth physics
 *   glb / gltf     Blender's web export (File > Export > glTF 2.0)
 *   fbx obj stl ply dae   the common exchange formats
 *
 * A .blend file can't be opened in a browser - export it as .glb.
 * Each format's loader is fetched the first time that format is opened.
 */

export const FORMATS = ["vrm", "glb", "gltf", "fbx", "obj", "stl", "ply", "dae"];
export const formatOf = (url) => String(url || "").split("?")[0].split(".").pop().toLowerCase();

const plain = () => new THREE.MeshStandardMaterial({ color: 0xb8b8c0, roughness: 0.55, metalness: 0.05 });

// VRMUtils is needed again to dispose a VRM, so keep it once it's loaded
let vrmUtils = null;

/* load any supported model -> { object, vrm, clips } */
export async function loadModel(url, format = formatOf(url), onProgress) {
  const progress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };

  if (format === "vrm" || format === "glb" || format === "gltf") {
    const [{ GLTFLoader }, { VRMLoaderPlugin, VRMUtils }] = await Promise.all([
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("@pixiv/three-vrm"),
    ]);
    vrmUtils = VRMUtils;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await loader.loadAsync(url, progress);
    const vrm = gltf.userData.vrm || null;
    if (vrm) {
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons?.(gltf.scene);
      VRMUtils.rotateVRM0(vrm);                  // old VRoid models face backwards
      vrm.scene.traverse((o) => { o.frustumCulled = false; });
      restPose(vrm);
      return { object: vrm.scene, vrm, clips: [] };
    }
    return { object: gltf.scene, vrm: null, clips: gltf.animations || [] };
  }
  if (format === "fbx") {
    const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
    const obj = await new FBXLoader().loadAsync(url, progress);
    return { object: obj, vrm: null, clips: obj.animations || [] };
  }
  if (format === "obj") {
    const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
    const obj = await new OBJLoader().loadAsync(url, progress);
    obj.traverse((o) => { if (o.isMesh && !o.material?.map) o.material = plain(); });
    return { object: obj, vrm: null, clips: [] };
  }
  if (format === "stl" || format === "ply") {
    const loader = format === "stl"
      ? new (await import("three/examples/jsm/loaders/STLLoader.js")).STLLoader()
      : new (await import("three/examples/jsm/loaders/PLYLoader.js")).PLYLoader();
    const geometry = await loader.loadAsync(url, progress);
    geometry.computeVertexNormals();
    const material = geometry.hasAttribute("color")
      ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })
      : plain();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;                // these are usually Z-up
    const group = new THREE.Group();
    group.add(mesh);
    return { object: group, vrm: null, clips: [] };
  }
  if (format === "dae") {
    const { ColladaLoader } = await import("three/examples/jsm/loaders/ColladaLoader.js");
    const dae = await new ColladaLoader().loadAsync(url, progress);
    return { object: dae.scene, vrm: null, clips: dae.scene.animations || [] };
  }
  throw new Error(`.${format} files can't be shown - use ${FORMATS.join(", ")}.`);
}

/* free everything a model holds on the GPU: geometry, materials and their textures */
function disposeObject(result) {
  if (!result) return;
  if (result.vrm && vrmUtils) { vrmUtils.deepDispose(result.object); return; }
  result.object.traverse((o) => {
    o.geometry?.dispose();
    const materials = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    materials.forEach((m) => {
      Object.values(m).forEach((v) => { if (v?.isTexture) v.dispose(); });
      m.dispose();
    });
  });
}

/* VRoid models load in a T-pose: bring the arms down to a relaxed stand */
function restPose(vrm) {
  const bone = (name) => vrm.humanoid?.getNormalizedBoneNode(name);
  const set = (name, x, y, z) => { const b = bone(name); if (b) b.rotation.set(x, y, z); };
  set("leftUpperArm", 0, 0, 1.2);
  set("rightUpperArm", 0, 0, -1.2);
  set("leftLowerArm", 0, 0, 0.12);
  set("rightLowerArm", 0, 0, -0.12);
  vrm.humanoid?.update();
}

/* the model's box, for framing */
function bounds(object) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return { box, size, center, radius: Math.max(size.x, size.y, size.z) / 2 || 1 };
}

/* stand the model on the floor, centred, at a sensible scale */
function place(object) {
  const { size, center, box } = bounds(object);
  const tallest = Math.max(size.x, size.y, size.z) || 1;
  // normalise wildly scaled exports (e.g. FBX in centimetres) to ~2 units
  if (tallest > 20 || tallest < 0.05) object.scale.multiplyScalar(2 / tallest);
  object.updateMatrixWorld(true);
  const b = bounds(object);
  object.position.x -= b.center.x;
  object.position.z -= b.center.z;
  object.position.y -= b.box.min.y;
  return { size, center, box };
}

function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a44, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(1.5, 3, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfd4ff, 1.1);
  rim.position.set(-2, 2, -2.5);
  scene.add(rim);
}

/**
 * A live viewer on a canvas, Blender-style:
 *   left drag orbit · right drag (or shift + drag) pan · wheel zoom
 *   views: 1 front, 3 right, 7 top (Ctrl = the opposite side), F / Home frame
 * A frame is only drawn when something changed: the camera moved, a setting
 * flipped, or the model itself moves (VRM physics, an animation, turntable).
 */
export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
  lights(scene);

  // Blender's floor: a grid with a red X and a green Y (here: depth) axis
  const grid = new THREE.GridHelper(20, 40, 0x555560, 0x3a3a42);
  grid.material.transparent = true;
  grid.material.opacity = 0.6;
  scene.add(grid);
  const axis = (color, a, b) => {
    const g = new THREE.BufferGeometry().setFromPoints([a, b]);
    return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
  };
  const axes = [
    axis(0xd9534f, new THREE.Vector3(-10, 0.001, 0), new THREE.Vector3(10, 0.001, 0)),
    axis(0x7cb342, new THREE.Vector3(0, 0.001, -10), new THREE.Vector3(0, 0.001, 10)),
  ];
  axes.forEach((a) => scene.add(a));

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.PAN };

  let model = null;
  let fit = { center: new THREE.Vector3(0, 1, 0), radius: 1 };
  let mixer = null;
  let wire = false;
  let dirty = true;          // something changed since the last frame
  const clock = new THREE.Clock();
  let raf = 0;
  let t = 0;
  const touch = () => { dirty = true; };
  controls.addEventListener("change", touch);

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    touch();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // look at the model from a direction (a unit vector)
  const view = (dir) => {
    const dist = (fit.radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.1;
    controls.target.copy(fit.center);
    camera.position.copy(fit.center).addScaledVector(dir.clone().normalize(), dist);
    camera.near = dist / 100;
    camera.far = dist * 100;
    camera.updateProjectionMatrix();
    controls.update();
    touch();
  };
  const VIEWS = {
    front: new THREE.Vector3(0, 0, 1), back: new THREE.Vector3(0, 0, -1),
    right: new THREE.Vector3(1, 0, 0), left: new THREE.Vector3(-1, 0, 0),
    top: new THREE.Vector3(0, 1, 0.0001), bottom: new THREE.Vector3(0, -1, 0.0001),
    home: new THREE.Vector3(0.45, 0.15, 1),
  };

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    t += dt;
    const alive = Boolean(model?.vrm || mixer || controls.autoRotate);   // the picture moves on its own
    if (model?.vrm) {
      const { vrm } = model;
      // a little life: breathing and blinking
      const chest = vrm.humanoid?.getNormalizedBoneNode("chest");
      if (chest) chest.rotation.x = Math.sin(t * 1.6) * 0.02;
      const blink = Math.max(0, Math.sin(t * 1.3) ** 64);
      vrm.expressionManager?.setValue("blink", blink);
      vrm.update(dt);                              // hair / cloth physics
    }
    mixer?.update(dt);
    const moved = controls.update();               // true while orbiting or still damping
    if (alive || moved || dirty) {
      dirty = false;
      renderer.render(scene, camera);
    }
  };
  loop();

  return {
    camera,
    controls,
    setModel(result) {
      if (model) { scene.remove(model.object); disposeObject(model); }
      mixer?.stopAllAction();
      mixer = null;
      model = result;
      place(result.object);
      scene.add(result.object);
      const b = bounds(result.object);
      fit = { center: b.center, radius: b.radius };
      if (result.clips?.length) {
        mixer = new THREE.AnimationMixer(result.object);
        mixer.clipAction(result.clips[0]).play();
      }
      view(VIEWS.home);
    },
    view: (name) => view(VIEWS[name] || VIEWS.home),
    setWireframe(on) {
      wire = on;
      model?.object.traverse((o) => {
        if (!o.isMesh) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m) m.wireframe = wire; });
      });
      touch();
    },
    setAutoRotate(on) { controls.autoRotate = on; controls.autoRotateSpeed = 1.2; touch(); },
    setGrid(on) { grid.visible = on; axes.forEach((a) => { a.visible = on; }); touch(); },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.removeEventListener("change", touch);
      controls.dispose();
      mixer?.stopAllAction();
      disposeObject(model);
      grid.geometry.dispose();
      grid.material.dispose();
      axes.forEach((a) => { a.geometry.dispose(); a.material.dispose(); });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

/* a still picture of a model (for its card), as a WebP blob with a clear background */
export async function snapshot(url, format = formatOf(url), width = 600, height = 800) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  let result = null;
  try {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(width, height, false);
    const scene = new THREE.Scene();
    lights(scene);
    result = await loadModel(url, format);
    place(result.object);
    scene.add(result.object);
    if (result.vrm) result.vrm.update(0);
    const b = bounds(result.object);
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.01, 1000);
    const tall = b.size.y > Math.max(b.size.x, b.size.z) * 1.4;
    // full figures: framed head to toe; everything else: its bounding sphere
    const dist = tall ? (b.size.y / 2) / Math.tan((camera.fov * Math.PI) / 360) * 1.08
      : (b.radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.05;
    camera.position.set(b.center.x + dist * 0.28, b.center.y + b.size.y * 0.04, b.center.z + dist * 0.96);
    camera.lookAt(b.center);
    renderer.render(scene, camera);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  } finally {
    // the WebGL context is freed whether or not the model could be loaded
    disposeObject(result);
    renderer.dispose();
    renderer.forceContextLoss();
  }
}
