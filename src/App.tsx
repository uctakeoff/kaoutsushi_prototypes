import { useEffect, useRef } from 'react';
import './App.css';
import * as face_mesh from '@mediapipe/face_mesh';
import { drawFaces } from './drawFaces02';

export const App = () => {
  // const width = 1280;
  // const height = 720;
  const width = 512;
  const height = 512;
  const currentFaceMesh = useRef<face_mesh.FaceMesh>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const faceMesh = new face_mesh.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      drawFaces(faceMesh, canvas);
      currentFaceMesh.current = faceMesh;
      return () => {
        faceMesh.close();
      }
    }
  }, [canvasRef]);

  useEffect(() => {
    const video = document.createElement('video');
    if (video) {
      navigator.mediaDevices.getUserMedia({ video: { width, height } }).then(stream => {
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
      <canvas ref={canvasRef} width={`${width}px`} height={`${height}px`}></canvas>
    </div>
  );
}
