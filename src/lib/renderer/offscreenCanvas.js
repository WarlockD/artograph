import { isPowerOfTwo, toPowerOfTwo } from '../math';

const MAX_TEXTURE_RESOLUTION = 2048;

export const canvas = document.createElement('canvas');
export const gl = initGL(canvas);

setSize(512, 512);

function initGL(canvas) {
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    throw new Error('WebGL is not supported');
  }

  return gl;
}

export function setSize(width, height) {
  if (canvas.width === width && canvas.height === height) return;

  const aligned = toPowerOfTwo(Math.max(width, height));

  if (aligned > MAX_TEXTURE_RESOLUTION) {
    throw new Error(`Rendering of images larger than ${MAX_TEXTURE_RESOLUTION} is not supported yet.`);
  }

  canvas.width = aligned;
  canvas.height = aligned;
  gl.viewport(0, 0, aligned, aligned);
}

export function resizeToPowerOfTwo(image) {
  const size = Math.max(image.width, image.height);
  const alignedSize = toPowerOfTwo(Math.min(MAX_TEXTURE_RESOLUTION, size));
  const canvas = document.createElement('canvas');
  canvas.width = alignedSize;
  canvas.height = alignedSize;
  canvas.getContext('2d').drawImage(image, 0, alignedSize - image.height);
  return canvas;
}

export function createTexture(source) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  if (source) updateTexture(texture, source);
  return texture;
}

export function updateTexture(texture, source) {
  const image = source.width === source.height && isPowerOfTwo(source.width)
    ? source
    : resizeToPowerOfTwo(source);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

const passthroughVS = `
  attribute vec4 aPosition;
  attribute vec2 aTexCoord;

  varying vec2 vUv;

  void main() {
    vUv = aTexCoord;
    gl_Position = aPosition;
  }
`;

export function createProgram(fragmentShaderSource, vertexShaderSource = passthroughVS) {
  const program = gl.createProgram();

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw 'Could not compile vertex shader:\n' + gl.getShaderInfoLog(vertexShader);
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    throw 'Could not compile vertex shader:\n' + gl.getShaderInfoLog(fragmentShader);
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw 'Could not compile WebGL program:\n' + gl.getProgramInfoLog(program);
  }

  return program;
}

export function getSize() {
  return {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    // Useful for comparison
    toString: () => `${gl.drawingBufferWidth}x${gl.drawingBufferHeight}`,
  };
}
