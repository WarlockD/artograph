export const canvas = document.createElement('canvas');
export const gl = initGL(canvas);

function initGL(canvas) {
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    throw new Error('WebGL is not supported');
  }

  return gl;
}

export function setSize(width, height) {
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
}
