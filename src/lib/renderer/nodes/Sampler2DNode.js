import SceneNode from '../SceneNode';
import { toPowerOfTwo } from '../../math';
import { gl, ScreenNode } from '../ScreenNode';

function loadImageFromUrl(sourceUrl) {
  const image = new Image();
  const result = new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(e);
  });
  image.src = sourceUrl;
  return result;
}

export default class Sampler2DNode extends SceneNode {
  static nodeName = 'Image';

  constructor() {
    super({
      name: Sampler2DNode.nodeName,
      outputs: {
        texture: { type: 'sampler2D', name: 'Texture' },
      },
    });
    this.texture = null;
  }

  async loadFromUrl(url) {
    this.image = await loadImageFromUrl(url);
    this.url = url;
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = ScreenNode.createTexture(this.image);
    this.set('texture', this.texture);
  }

  getSize() {
    return toPowerOfTwo(Math.max(this.image.width, this.image.height));
  }

  toJSON() {
    const result = super.toJSON();
    result.url = this.url;
    return result;
  }

  async fromJSON(json) {
    super.fromJSON(json);
    await this.loadFromUrl(json.url);
  }
}
