import { useEffect, useRef } from 'react';
import './App.css';
import * as face_mesh from '@mediapipe/face_mesh';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

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
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_RIGHT_EYE, {color: '#FF3030'});
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_LEFT_EYE, {color: '#30FF30'});
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_LEFT_IRIS, {color: '#30FF30'});
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
            drawConnectors(canvasCtx, landmarks, face_mesh.FACEMESH_LIPS, {color: '#E0E0E0'});
          }
        }
        canvasCtx.restore();
      }
      const faceMesh = new face_mesh.FaceMesh({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }});
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
              await currentFaceMesh.current?.send({image: video});
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
