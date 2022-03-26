import * as face_mesh from '@mediapipe/face_mesh';

export type DrawingOptions = {
  color: string | CanvasGradient | CanvasPattern;
  fillColor: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  radius: number;
  visibilityMin: number;
}
const defaultOptions: DrawingOptions = { color: "white", fillColor: "white", lineWidth: 4, radius: 6, visibilityMin: .5 };

export const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: face_mesh.NormalizedLandmarkList, style?: Partial<DrawingOptions>) => {
  const options: DrawingOptions = { ...defaultOptions, ...style };
  const { width, height } = ctx.canvas;
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

export const drawConnectors = (ctx: CanvasRenderingContext2D, landmarks: face_mesh.NormalizedLandmarkList, connections: face_mesh.LandmarkConnectionArray, style?: Partial<DrawingOptions>) => {
  const options: DrawingOptions = { ...defaultOptions, ...style };
  const { width, height } = ctx.canvas;
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
