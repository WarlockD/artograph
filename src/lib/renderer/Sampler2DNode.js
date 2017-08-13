import SceneNode from './SceneNode';
import { toPowerOfTwo } from '../math';
import { gl, createTexture } from './offscreenCanvas';

function loadImageFromUrl(sourceUrl) {
  const image = new Image();
  const result = new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(e);
  });
  image.src = sourceUrl;
  return result;
}

export default class SamplerNode extends SceneNode {
  constructor(imageUrl) {
    super({
      outputs: {
        texture: { type: 'sampler2D', name: 'Texture' },
      },
    });
    this.texture = null;
    if (imageUrl) this.loadFromUrl(imageUrl);
  }

  async loadFromUrl(url) {
    this.image = await loadImageFromUrl(url);
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = createTexture(this.image);
  }

  getSize() {
    return toPowerOfTwo(Math.max(this.image.width, this.image.height));
  }

  run() {
    return { texture: this.texture };
  }
}
