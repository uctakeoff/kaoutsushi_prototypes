import * as face_mesh from '@mediapipe/face_mesh';
import { drawConnectors } from './drawing_utils';

/**
 * 本家のサンプルコードを移植したもの
 * ソース画像の上に検出した特徴点とポリゴンをワイヤーフレームで描画する.
 */
export const drawFaces = (faceMesh: face_mesh.FaceMesh, canvas: HTMLCanvasElement) => {
  const canvasCtx = canvas.getContext('2d');
  if (!canvasCtx) return;
  faceMesh.setOptions({
    maxNumFaces: 1,
    selfieMode: true,
    refineLandmarks: true,
    enableFaceGeometry: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults(results => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
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
  });
}
