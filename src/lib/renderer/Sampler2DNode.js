import { isPowerOfTwo, toPowerOfTwo } from '../math';
import SceneNode from './SceneNode';
import { gl } from './offscreenCanvas';

const MAX_TEXTURE_RESOLUTION = 2048;

function loadImageFromUrl(sourceUrl) {
  const image = new Image();
  const result = new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(e);
  });
  image.src = sourceUrl;
  return result;
}

function resizeToPowerOfTwo(image) {
  const size = Math.max(image.width, image.height);
  const alignedSize = toPowerOfTwo(Math.min(MAX_TEXTURE_RESOLUTION, size));
  const canvas = document.createElement('canvas');
  canvas.width = alignedSize;
  canvas.height = alignedSize;
  canvas.getContext('2d').drawImage(image, 0, alignedSize - image.height);
  return canvas;
}

function createTexture(source) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  if (source) updateTexture(texture, source);
  return texture;
}

function updateTexture(texture, source) {
  const image = source.width === source.height && isPowerOfTwo(source.width)
    ? source
    : resizeToPowerOfTwo(source);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

export default class SamplerNode extends SceneNode {
  constructor(imageUrl) {
    super({
      outputs: {
        texture: { type: 'sampler2D', name: 'Texture' },
      },
    });
    this.texture = null;
    this.loadFromUrl(imageUrl);
  }

  async loadFromUrl(url) {
    const image = await loadImageFromUrl(url);
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = createTexture(image);
  }

  run() {
    return { texture: this.texture };
  }
}
