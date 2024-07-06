import {
	FilesetResolver,
	HandLandmarker,
	FaceDetector,
	DrawingUtils,
} from "@mediapipe/tasks-vision";
import handLandmarkerModelPath from "/models/hand-landmarker.task?url";
import faceDetectorModelPath from "/models/blaze-face-detection.tflite?url";
import Stats from "stats.js";
import { onMove } from "./script";

/* SECTION: Performance Monitoring */
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

/* SECTION: INITIALIZE DETECTOR */

let handLandmarker;
let faceDetector;

async function initializeHandLandmarker() {
	const vision = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
	);

	handLandmarker = await HandLandmarker.createFromOptions(vision, {
		baseOptions: {
			modelAssetPath: handLandmarkerModelPath,
			delegate: "GPU",
		},
		numHands: 2,
		runningMode: "VIDEO",
	});
}

async function initializeFaceDetector() {
	const vision = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
	);
	faceDetector = await FaceDetector.createFromOptions(vision, {
		baseOptions: {
			modelAssetPath: faceDetectorModelPath,
			delegate: "GPU",
		},
		runningMode: "VIDEO",
	});
}

initializeHandLandmarker();
initializeFaceDetector();

/* SECTION: VIDEO DETECTION */

let video = document.getElementById("webcam");
let enableWebcamButton;
let lastVideoTime = -1;
let liveView = document.getElementById("liveVideoView");
let detectionData = {};
const handLandmarksCanvas = document.querySelector("#hand-landmarks-canvas");

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (hasGetUserMedia()) {
	enableWebcamButton = document.getElementById("startButton");
	enableWebcamButton.addEventListener("click", enableCamForLandmarker);
} else {
	console.warn("getUserMedia() is not supported by your browser");
}

async function enableCamForLandmarker(event) {
	// Hide button
	document.getElementById("startScreen").remove();

	// Set parameters for getUsermedia with mirrored video
	const constraints = {
		video: true,
		// video: { facingMode: "user" },
	};

	// Activate the webcam stream.
	navigator.mediaDevices
		.getUserMedia(constraints)
		.then(function (stream) {
			video.srcObject = stream;
			video.style.transform = "scaleX(-1)"; // Mirror the video feed
			video.addEventListener("loadeddata", prepareAndStartLandmarking);
		})
		.catch((err) => {
			console.error(err);
		});

	// firstRender();
}

function makeVideoFullScreen() {
	/* make video full screen */
	let windowAspectRatio = window.innerWidth / window.innerHeight;
	let videoAspectRatio = video.videoWidth / video.videoHeight;
	let videoHeight = 0;
	let videoWidth = 0;

	if (windowAspectRatio >= videoAspectRatio) {
		//when window width is greater
		videoHeight = window.innerHeight;
		videoWidth = window.innerHeight * videoAspectRatio;
	} else {
		//when window height is greater
		videoWidth = window.innerWidth;
		videoHeight = window.innerWidth / videoAspectRatio;
	}
	liveView.style.height = videoHeight + "px";
	liveView.style.width = videoWidth + "px";
	liveView.style.display = "block";
}

function prepareAndStartLandmarking() {
	handLandmarksCanvas.setAttribute("width", video.videoWidth + "px");
	handLandmarksCanvas.setAttribute("height", video.videoHeight + "px");

	makeVideoFullScreen();
	detectLandmarksInWebcam();
}

async function detectLandmarksInWebcam() {
	let startTimeMs = performance.now();

	if (video.currentTime !== lastVideoTime) {
		lastVideoTime = video.currentTime;

		const handDetections = handLandmarker.detectForVideo(video, startTimeMs);
		const faceDetections = faceDetector.detectForVideo(video, startTimeMs);

		/* if (handDetections.landmarks) {
			const ctx2 = handLandmarksCanvas.getContext("2d");
			ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height); //clear canvas before redrawing
			drawHandLandmarksOnCanvas(handDetections.landmarks, ctx2);
			onMove(handDetections.landmarks);
		} */
		if (faceDetections.detections) {
			// onMove(faceDetections.detections, handDetections.landmarks);
		}
	}

	// Call this function again to keep predicting when the browser is ready
	window.requestAnimationFrame(detectLandmarksInWebcam);
	stats.update();
}

function drawHandLandmarksOnCanvas(handLandmarks, canvasContext) {
	const drawingUtils = new DrawingUtils(canvasContext);
	for (const landmarks of handLandmarks) {
		drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS);
	}
}
