import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "stats.js";

/* SECTION: Performance Monitoring */
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom);
/* !SECTION */

/**
 * SECTION Scene Setup
 */

/* Canvas */
const canvas = document.querySelector("canvas.webgl");

/* Scene */
const scene = new THREE.Scene();

/* Sizes */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/* ANCHOR Fog */
const fogColor = new THREE.Color(0x000000); // Black color
const fogNear = 1;
const fogFar = 12;
scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

/* ANCHOR Camera */

const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 3;
scene.add(camera);

/* Controls */
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

/* ANCHOR Renderer */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
// renderer.setClearColor(0x000000, 0); // Set background to transparent

/* ANCHOR Lights */
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5);
directionalLight.position.set(3, 10, 7);
directionalLight.castShadow = true;
scene.add(ambientLight, directionalLight);

/* !SECTION */

/**
 * SECTION Objects
 */

let directionVector = new THREE.Vector3(0, 0, -1);

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("textures/dice.png");
texture.colorSpace = THREE.SRGBColorSpace;
const alphaTextureDice = textureLoader.load("textures/dice-alpha.png");
const alphaTextureBlur = textureLoader.load("textures/blur.png");
const concentricTexture = textureLoader.load("textures/cube-concentric.png");
concentricTexture.colorSpace = THREE.SRGBColorSpace;

const video = document.getElementById("videoElement");
const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;

// const scalingFactor = 1 / Math.sqrt(2);
const scalingFactor = Math.sqrt(3) / 3;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
	// color: "coral",
	map: videoTexture,
	// alphaMap: alphaTextureDice,
	transparent: true,
	side: THREE.DoubleSide,
	// opacity: 0.8,
	// wireframe: true,
});
const mesh = new THREE.Mesh(geometry, material);
// mesh.scale.set(scalingFactor, scalingFactor, scalingFactor);
const meshScale = 1;
mesh.scale.set(meshScale, meshScale, meshScale);
mesh.castShadow = true;
mesh.receiveShadow = true;
// const mesh2 = new THREE.Mesh(geometry, material);
scene.add(mesh);

const sphereMaterial = new THREE.MeshStandardMaterial({
	color: "yellow",
	// wireframe: true,
});
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
const sphereScale = meshScale * scalingFactor;
sphere.scale.set(sphereScale, sphereScale, sphereScale);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

/* const pointerSphereMaterial = new THREE.MeshStandardMaterial({
	color: "red",
});
const pointerSphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const pointerSphere = new THREE.Mesh(
	pointerSphereGeometry,
	pointerSphereMaterial
);
scene.add(pointerSphere); */

const isohedrons = [];
let isohedronRings = [];
const ringCount = 10;
const ringRadius = 2.5;
const isohedronsPerRing = 16;
// let ringRadiusIncrement = 1;
const isohedronMaterial = new THREE.MeshStandardMaterial({
	color: "green",
	// wireframe: true,
});

let lastRingPosition = directionVector.clone();
for (let i = 0; i < ringCount; i++) {
	// const radius = (ring + 1) * ringRadiusIncrement;
	// const count = isohedronsPerRing[ring];
	// const scale = ring + 1.618 / 8;
	// ringRadiusIncrement += 1.618 / 8;
	let ring = new THREE.Group();
	// nextRingZPosition = -i * 2;
	// let currentRing = [];
	for (let i = 0; i < isohedronsPerRing; i++) {
		const angle = (i / isohedronsPerRing) * Math.PI * 2;
		const x = ringRadius * Math.cos(angle);
		const y = ringRadius * Math.sin(angle);
		// const isohedronGeometry = new THREE.IcosahedronGeometry(0.2, 0);
		const isohedronGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);

		const isohedron = new THREE.Mesh(isohedronGeometry, isohedronMaterial);
		isohedron.position.set(x, y, 0);
		isohedrons.push(isohedron);
		ring.add(isohedron);
	}
	ring.position.copy(lastRingPosition);
	lastRingPosition.addScaledVector(directionVector, 2);
	isohedronRings.push(ring);
	scene.add(ring);
}

/* ANCHOR Particles */
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1000;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
	const x = (Math.random() - 0.5) * 20;
	const y = (Math.random() - 0.5) * 20;
	const z = -3;

	positions[i * 3] = x;
	positions[i * 3 + 1] = y;
	positions[i * 3 + 2] = z;
}

particlesGeometry.setAttribute(
	"position",
	new THREE.BufferAttribute(positions, 3)
);

const particlesMaterial = new THREE.PointsMaterial({
	color: 0xffffff,
	size: 0.01,
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/* Bananas */

let bananaGroup = new THREE.Group();

const gltfLoader = new GLTFLoader();
gltfLoader.load(
	"/objects/banana/scene.gltf",
	(gltf) => {
		const model = gltf.scene;
		model.scale.set(0.5, 0.5, 0.5); // Adjust the scale as needed
		model.position.set(0, 1, 0);
		model.traverse((child) => {
			if (child.isMesh) {
				child.material = new THREE.MeshStandardMaterial({
					// map: child.material.map, // Use the original texture map
					color: "yellow",
				});
			}
		});
		for (let i = 0; i < 10; i++) {
			const bananaClone = model.clone();
			const randomRotationX = Math.random() * 2 * Math.PI;
			const randomRotationY = Math.random() * 2 * Math.PI;
			const randomRotationZ = Math.random() * 2 * Math.PI;
			bananaClone.rotation.set(
				randomRotationX,
				randomRotationY,
				randomRotationZ
			);
			const theta = Math.random() * 2 * Math.PI;
			const phi = Math.acos(2 * Math.random() - 1);
			const randomX = Math.sin(phi) * Math.cos(theta);
			const randomY = Math.sin(phi) * Math.sin(theta);
			const randomZ = Math.cos(phi);
			bananaClone.position.set(randomX, randomY, randomZ);
			bananaGroup.add(bananaClone);
		}
		mesh.add(bananaGroup);
		bananaGroup.visible = false;
	},
	(xhr) => {
		console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
	},
	(error) => {
		console.error("An error happened", error);
	}
);

/* !SECTION */

/**
 * SECTION Animate
 */

/* ANCHOR Pointer */

let pointer = {
	x: 0,
	y: 1,
};

let pointerVector = new THREE.Vector3(0, 0, 0);

function onPointerMove(event) {
	let x, y;

	if (event.type === "mousemove") {
		x = (event.clientX / window.innerWidth) * 2 - 1;
		y = -(event.clientY / window.innerHeight) * 2 + 1;
	} else if (event.type === "touchmove") {
		const touch = event.touches[0];
		x = (touch.clientX / window.innerWidth) * 2 - 1;
		y = -(touch.clientY / window.innerHeight) * 2 + 1;
	}

	pointer.x = x;
	pointer.y = y;

	pointerVector = new THREE.Vector3(pointer.x, pointer.y, 0).normalize();

	// directionVector.add(pointerVector).normalize();
}

// window.addEventListener("pointermove", onPointerMove);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("touchmove", onPointerMove);

/* ANCHOR Mouse Click */

const textureData = [
	{
		type: "image",
		path: "textures/cube-concentric.png",
		backgroundColor: "#02101A",
		fogColor: "#02101A",
		shapeColor: "#9FC131",
	},
	{
		type: "image",
		path: "textures/dice.png",
		alphaPath: "textures/dice-alpha.png",
		sphereColor: "#FF7A05",
		backgroundColor: "#202117",
		fogColor: "#3D402C",
		shapeColor: "#F28705",
	},
	{
		type: "video",
		path: "videos/purple.mp4",
		backgroundColor: "#160626", //TODO
		fogColor: "#160626", //TODO
		shapeColor: "#D08BD9", //TODO
	},
	{
		type: "video",
		path: "videos/monku.mp4",
		backgroundColor: "#202117", //TODO
		fogColor: "#8C4E03", //TODO
		shapeColor: "#F2B705", //TODO
		showBananas: true,
	},
];

function onMouseClick(event) {
	let texture = textureData[currentTextureIndex];
	currentTextureIndex = (currentTextureIndex + 1) % textureData.length;
	changeTexture(texture);
	scene.background = new THREE.Color(texture.backgroundColor);
	scene.fog.color = new THREE.Color(texture.fogColor);
	isohedronMaterial.color = new THREE.Color(texture.shapeColor);
	bananaGroup.visible = !!texture.showBananas;
}

window.addEventListener("click", onMouseClick);

let currentTextureIndex = 0;

function changeTexture(texture) {
	material.alphaMap = null;
	sphere.visible = false;
	if (texture.type === "image") {
		material.map = getImageTexture(texture.path);
		if (texture.alphaPath) {
			material.alphaMap = getImageTexture(texture.alphaPath);
			sphere.visible = true;
			sphere.material.color = new THREE.Color(texture.sphereColor);
		}
	} else if (texture.type === "video") {
		material.map = getVideoTexture(texture.path);
	}
}

function getImageTexture(imagePath) {
	let newTexture = textureLoader.load(imagePath);
	newTexture.colorSpace = THREE.SRGBColorSpace;
	return newTexture;
}

function getVideoTexture(videoPath) {
	// Create a video element and video texture
	const video = document.createElement("video");
	video.src = videoPath;
	video.load();
	video.loop = true;
	video.play();
	let newTexture = new THREE.VideoTexture(video);
	newTexture.colorSpace = THREE.SRGBColorSpace;
	return newTexture;
}

/* ANCHOR Tick */
const clock = new THREE.Clock();
let displacement = 0.07;

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// mesh2.rotation.x -= pointer.y / 4;
	// mesh.rotation.y += pointer.x / 4;
	let vector = new THREE.Vector3(pointer.x, pointer.y, 0).normalize();
	let perpendicularVector = new THREE.Vector3(
		-vector.y,
		vector.x,
		0
	).normalize();
	let magnitude = Math.sqrt(pointer.x * pointer.x + pointer.y * pointer.y);
	mesh.rotateOnWorldAxis(perpendicularVector, magnitude / 16);

	/* ANCHOR Sphere */

	const maxMovement = 0.17;
	const movementX = Math.min(maxMovement, Math.max(-maxMovement, pointer.x));
	const movementY = Math.min(maxMovement, Math.max(-maxMovement, pointer.y));

	sphere.position.x = movementX;
	sphere.position.y = movementY;

	// pointerSphere.position.x = pointer.x;
	// pointerSphere.position.y = pointer.y;

	/* ANCHOR Isohedrons */

	isohedrons.forEach((isohedron) => {
		isohedron.rotateOnWorldAxis(perpendicularVector, magnitude / 16);
	});

	displacement = Math.max(magnitude / 20, 0.01);
	sphere.position.addScaledVector(directionVector, displacement);
	mesh.position.addScaledVector(directionVector, displacement);
	camera.position.addScaledVector(directionVector, displacement);
	particles.position.addScaledVector(directionVector, displacement);

	if (isohedronRings[0].position.z > camera.position.z) {
		let removedRing = isohedronRings.shift();
		let lastRing = isohedronRings[isohedronRings.length - 1];
		// nextRingZPosition = lastRing[lastRing.length - 1].position.z;
		isohedronRings.push(removedRing);
		removedRing.position.copy(lastRing.position);
		removedRing.position.addScaledVector(directionVector, 2);
	}

	// Update controls
	// controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);

	// stats.update();
};

tick();

function onMove(faceDetections, handDetections) {
	let liveView = document.getElementById("liveVideoView");

	if (faceDetections.length > 0) {
		const face = faceDetections[0];
		const nose = face.keypoints[4];

		let adjustedX = (nose.x * sizes.width) / liveView.offsetWidth;
		let adjustedY = (nose.y * sizes.height) / liveView.offsetHeight;

		// pointer.x = -worldPoint.x * 2 + 1;
		// pointer.y = -worldPoint.y * 2 + 1;
		// pointer.x = -adjustedX * 2 + 1;
		// pointer.y = -adjustedY * 2 + 1;

		// const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5);
		// vector.unproject(camera);
		// const dir = vector.sub(camera.position).normalize();
		// const distance = -camera.position.z / dir.z;
		// const worldPos = camera.position.clone().add(dir.multiplyScalar(distance));
		// pointerSphere.position.x = worldPos.x;
		// pointerSphere.position.y = worldPos.y;
	}
	if (handDetections.length > 0) {
		const hand = handDetections[0];
		const handPoint = hand[5];
		// let adjustedX = (handPoint.x * sizes.width) / liveView.offsetWidth;
		// let adjustedY = (handPoint.y * sizes.height) / liveView.offsetHeight;
		pointer.x = (-(handPoint.x * liveView.offsetWidth) / sizes.width) * 2 + 1;
		pointer.y = (-(handPoint.y * liveView.offsetHeight) / sizes.height) * 2 + 1;
		// console.log(pointer);
	} /* else {
		pointer.x = 0;
		pointer.y = 1;
	} */
}

export { onMove };
