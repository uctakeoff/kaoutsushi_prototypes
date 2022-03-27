import * as face_mesh from '@mediapipe/face_mesh';
import * as THREE from "three";

/**
 * 2Dカメラ画像上で検出した2つの顔を入れ替える
 * オブジェクト座標も landmarks から算出してみる
 */
export const drawFaces = (faceMesh: face_mesh.FaceMesh, canvas: HTMLCanvasElement) => {
  const maxCount = 2;
  faceMesh.setOptions({
    maxNumFaces: maxCount,
    // selfieMode: true,
    refineLandmarks: false,
    enableFaceGeometry: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  const { width, height } = canvas;
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  // 背景透明にしてvideoの上にオーバーレイ表示する
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -100, 100);

  faceMesh.onResults(results => {
    // 顔が2つ以上見つかるまで保留
    if (results.multiFaceGeometry.length < maxCount) return;

    const meshes: {
      mesh: THREE.Mesh,
      position: THREE.BufferAttribute,
      uv: THREE.BufferAttribute,
    }[] = [];

    const texture = new THREE.Texture(results.image as HTMLCanvasElement);
    texture.matrix.set(1, 0, 0, 0, -1, 1, 0, 0, 1);
    texture.matrixAutoUpdate = false;
    texture.needsUpdate = true;

    // position, uv あとからすげ替えられるなら 最初の results を待たずに初期化してもいいかも. 最大検出数はわかってるし.
    for (let i = 0; i < maxCount; ++i) {
      const face = results.multiFaceGeometry[i];
      const landmarks = results.multiFaceLandmarks[i];
      const position = new THREE.BufferAttribute(new Float32Array(landmarks.flatMap(v => [v.x, v.y, 0])), 3);
      const uv = new THREE.BufferAttribute(new Float32Array(landmarks.flatMap(v => [v.x, v.y])), 2);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', position);
      geometry.setAttribute('uv', uv);
      // multiFaceGeometry は index list 取得にしか使わないが index list は実質定数のはずなのであまり意味ない.
      geometry.setIndex(new THREE.BufferAttribute(face.getMesh().getIndexBufferList(), 1));

      const material = new THREE.MeshBasicMaterial({ map: texture, wireframe: false });
      const mesh = new THREE.Mesh(geometry, material);
      meshes.push({ mesh, position, uv });
    }


    faceMesh.onResults(results => {
      meshes.forEach(m => scene.remove(m.mesh));
      if (results.multiFaceGeometry.length >= maxCount) {
        texture.image = results.image as HTMLCanvasElement;
        texture.needsUpdate = true;
        for (let i = 0; i < maxCount; ++i) {
          const { mesh, position, uv } = meshes[i];
          const j = (i + 1) % results.multiFaceLandmarks.length;
          const landmarks = results.multiFaceLandmarks[i];
          const landmarks1 = results.multiFaceLandmarks[j];
          (position.array as Float32Array).set(landmarks.flatMap(v => [v.x, v.y, 0]));
          position.needsUpdate = true;
          (uv.array as Float32Array).set(landmarks1.flatMap(v => [v.x, v.y]));
          uv.needsUpdate = true;
          scene.add(mesh);
        }
      }
      renderer.render(scene, camera);
    });
  });
}
