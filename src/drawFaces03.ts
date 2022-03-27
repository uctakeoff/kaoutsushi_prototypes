import * as face_mesh from '@mediapipe/face_mesh';
import * as THREE from "three";

/**
 * FaceGeometry から取得した UV がよくわからなかったため, 
 * drawConnectors()実装を参考に FaceLandmarks からテクスチャ座標を算出してみる.
 */
export const drawFaces = (faceMesh: face_mesh.FaceMesh, canvas: HTMLCanvasElement) => {
  faceMesh.setOptions({
    maxNumFaces: 1,
    selfieMode: true,
    refineLandmarks: false,
    enableFaceGeometry: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  const { width, height } = canvas;
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 1, 3500);
  camera.position.z = 64;

  faceMesh.onResults(results => {
    if (results.multiFaceGeometry.length <= 0) return;

    const face = results.multiFaceGeometry[0];
    const landmarks = results.multiFaceLandmarks[0];
    const position = new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(face.getMesh().getVertexBufferList(), 5), 3, 0);
    const uv = new THREE.BufferAttribute(new Float32Array(landmarks.flatMap(v => [v.x, v.y, v.z])), 3, true);
    const texture = new THREE.Texture(results.image as HTMLCanvasElement);
    // y座標だけ逆転する. 上のmap() で [v.x, 1-v.y, v.z] とするのと同じ効果.
    texture.matrix.set(1, 0, 0, 0, -1, 1, 0, 0, 1);
    texture.matrixAutoUpdate = false;
    texture.needsUpdate = true;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', position);
    geometry.setAttribute('uv', uv);
    geometry.setIndex(new THREE.BufferAttribute(face.getMesh().getIndexBufferList(), 1));

    const material = new THREE.MeshBasicMaterial({ map: texture, wireframe: true });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.matrix.elements = face.getPoseTransformMatrix().getPackedDataList();
    // mesh.matrixAutoUpdate = false;

    scene.add(mesh);

    faceMesh.onResults(results => {
      if (results.multiFaceGeometry.length > 0) {
        const face = results.multiFaceGeometry[0];
        const landmarks = results.multiFaceLandmarks[0];
        // mesh.matrix.elements = face.getPoseTransformMatrix().getPackedDataList();
        // mesh.matrixAutoUpdate = false;
        mesh.rotation.y += 0.01;
        position.data.array = face.getMesh().getVertexBufferList();
        position.data.needsUpdate = true;
        (uv.array as Float32Array).set(landmarks.flatMap(v => [v.x, v.y, v.z]));
        uv.needsUpdate = true;
        texture.image = results.image as HTMLCanvasElement;
        texture.needsUpdate = true;
      }
      renderer.render(scene, camera);
    });
  });
}
