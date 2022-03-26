import * as face_mesh from '@mediapipe/face_mesh';
import * as THREE from "three";

/**
 * three.js を使い face_mesh の FaceGeometry を 3D描画してみる.
 * オブジェクト座標は良さそうだが, テクスチャ座標はどうも画像上の顔の位置にはなっていない.
 * とはいえ, 表示されたテクスチャ画像は破綻していないため全く的外れというわけでもなさそう.
 */
export const drawFaces = (faceMesh: face_mesh.FaceMesh, canvas: HTMLCanvasElement) => {
  // refineLandmarks と enableFaceGeometry は両方 true にできないっぽい. やるとエラーになる.
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
    const face = results.multiFaceGeometry[0];

    // FaceGeometry の基本情報確認
    {
      // getCols()=4, getRows()=4, getLayout()=0 (COLUMN_MAJOR), getPackedDataList() = array(16) 行列の実体
      const m = face.getPoseTransformMatrix();
      console.log(m, m.getCols(), m.getRows(), m.getLayout(), m.getPackedDataList());

      // getPrimitiveType()=0 (TRIANGLE), g.getVertexType()=0 (VERTEX_PT = Position (XYZ) + Texture (UV))
      // getVertexBufferList().length=2340=468頂点x5属性(XYZUV)
      const g = face.getMesh();
      console.log(g.getPrimitiveType(), g.getVertexType(), g.getVertexBufferList(), g.getIndexBufferList());
    }

    // XYZUV の5属性配列から XYZ だけ, UV だけを BufferAttribute にするテクニック
    const position = new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(face.getMesh().getVertexBufferList(), 5), 3, 0);
    const uv = new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(face.getMesh().getVertexBufferList(), 5), 2, 3, true);
    const texture = new THREE.Texture(results.image as HTMLCanvasElement);
    // テクスチャ座標は思ったものと違った. とりあえず上下逆なのだけは直してみる
    texture.matrix.set(1, 0, 0, 0, -1, 1, 0, 0, 1);
    texture.matrixAutoUpdate = false;
    texture.needsUpdate = true;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', position);
    geometry.setAttribute('uv', uv);
    geometry.setIndex(new THREE.BufferAttribute(face.getMesh().getIndexBufferList(), 1));

    const material = new THREE.MeshBasicMaterial({ map: texture, wireframe: true });
    const mesh = new THREE.Mesh(geometry, material);
    // face_mesh も three.js も行列は column-major で格納しているのでそのまま代入でよさそう.
    // ただし, three.js のドキュメントには matrix.set() で指定しろ, と書いてある. 直接代入すると問題があるのか?
    mesh.matrix.elements = face.getPoseTransformMatrix().getPackedDataList();
    mesh.matrixAutoUpdate = false;

    scene.add(mesh);

    // 最初の onResult 呼び出しで上記の初期化処理を行った後, onResult を上書きする.
    faceMesh.onResults(results => {
      if (results.multiFaceGeometry.length > 0) {
        const face = results.multiFaceGeometry[0];
        mesh.matrix.elements = face.getPoseTransformMatrix().getPackedDataList();
        mesh.matrixAutoUpdate = false;
        position.data.array = face.getMesh().getVertexBufferList();
        position.data.needsUpdate = true;
        uv.data.array = face.getMesh().getVertexBufferList();
        uv.data.needsUpdate = true;
        texture.image = results.image as HTMLCanvasElement;
        texture.needsUpdate = true;
      }
      renderer.render(scene, camera);
    });
  });
}

