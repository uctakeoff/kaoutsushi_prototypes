import { useEffect, useRef } from 'react';
import './App.css';
import * as face_mesh from '@mediapipe/face_mesh';

type DrawingOptions = {
  color: string | CanvasGradient | CanvasPattern;
  fillColor: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  radius: number;
  visibilityMin: number;
}
var defaultOptions: DrawingOptions = { color: "white", fillColor: "white", lineWidth: 4, radius: 6, visibilityMin: .5 };

const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: face_mesh.NormalizedLandmarkList, style?: Partial<DrawingOptions>) => {
  const options: DrawingOptions = { ...defaultOptions, ...style };
  const {width, height} = ctx.canvas;
  const pi2 = 2 * Math.PI;
  ctx.save();
  for (const f of landmarks) {
    if ((f.visibility ?? 1) > options.visibilityMin) {
      ctx.fillStyle = options.fillColor;
      ctx.strokeStyle = options.color;
      ctx.lineWidth = options.lineWidth;
      var g = new Path2D;
      g.arc(f.x * width, f.y * height, options.radius, 0, pi2);
      ctx.fill(g);
      ctx.stroke(g);
    }
  }
  ctx.restore();
}

const drawConnectors = (ctx: CanvasRenderingContext2D, landmarks: face_mesh.NormalizedLandmarkList, connections: face_mesh.LandmarkConnectionArray, style?: Partial<DrawingOptions>) => {
  const options: DrawingOptions = { ...defaultOptions, ...style };
  const {width, height} = ctx.canvas;
  ctx.save();
  for (const k of connections) {
    const g = landmarks[k[0]];
    const h = landmarks[k[1]];
    if (g && h && ((g.visibility ?? 1) > options.visibilityMin) && ((h.visibility ?? 1) > options.visibilityMin)) {
      ctx.strokeStyle = options.color;
      ctx.lineWidth = options.lineWidth;
      ctx.beginPath();
      ctx.moveTo(g.x * width, g.y * height);
      ctx.lineTo(h.x * width, h.y * height);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function App() {
  const currentFaceMesh = useRef<face_mesh.FaceMesh>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement?.getContext('2d');
    if (canvasElement && canvasCtx) {
      const onResults = (results: face_mesh.Results) => {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        if (results.multiFaceLandmarks) {
          for (const landmarks of results.multiFaceLandmarks) {
            // drawLandmarks(canvasCtx, landmarks);
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_RIGHT_EYE, { color: '#ff0000' });
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_RIGHT_EYEBROW, { color: '#ff0000' });
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_RIGHT_IRIS, { color: '#ff8888' });
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_LEFT_EYE, { color: '#00ff00' });
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_LEFT_EYEBROW, { color: '#00ff00' });
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_LEFT_IRIS, { color: '#88ff88' });
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_FACE_OVAL, { color: '#888800' });
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_LIPS, { color: '#8888ff' });
          }
        }
        canvasCtx.restore();
      }
      const faceMesh = new face_mesh.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      faceMesh.onResults(onResults);
      currentFaceMesh.current = faceMesh;
      return () => {
        faceMesh.close();
      }
    }
  }, [canvasRef]);

  useEffect(() => {
    const video = document.createElement('video');
    if (video) {
      navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } }).then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = (e) => {
          video.play();
          const onFrame = async () => {
            if (!video.paused && (video as any).i !== video.currentTime) {
              (video as any).i = video.currentTime;
              await currentFaceMesh.current?.send({ image: video });
            }
            requestAnimationFrame(onFrame);
          };
          requestAnimationFrame(onFrame);
        };
      })
    }
  }, []);

  return (
    <div className="App">
      <canvas ref={canvasRef} width="1280px" height="720px"></canvas>
    </div>
  );
}

export default App;
