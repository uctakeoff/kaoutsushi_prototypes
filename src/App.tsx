import { useEffect, useRef } from 'react';
import './App.css';
import * as face_mesh from '@mediapipe/face_mesh';
import { drawFaces } from './drawFaces04';

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

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    // const video = document.createElement('video');
    const video = videoRef.current;
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
      <video ref={videoRef} style={{position: 'absolute', left: 0, top: 0}}/>
      <canvas ref={canvasRef} width={`${width}px`} height={`${height}px`} style={{position: 'absolute', left: 0, top: 0}}></canvas>
    </div>
  );
}
