export default class Viewport {
  constructor() {
    this.posX = 0;
    this.posY = 0;
    this.translateX = 0;
    this.translateY = 0;
    this.scale = 1;

    this.setSize(window.innerWidth, window.innerHeight);
  }

  _updateTranslate(cx, cy, scale) {
    this.translateX = -cx * scale;
    this.translateY = -cy * scale;
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  setPosition(x = 0, y = 0) {
    this.posX = x;
    this.posY = y;
    this._updateTranslate(x, y, this.scale);
  }

  setScale(scale = 1) {
    this.scale = scale;
    this._updateTranslate(this.posX, this.posY, scale);
  }

  vectorToWorld(x, y) {
    return [
      x / this.scale,
      y / this.scale,
    ];
  }

  pointToWorld(x, y) {
    return [
      (x - this.width / 2 - this.translateX) / this.scale,
      (y - this.height / 2 - this.translateY) / this.scale,
    ];
  }

  pointToScreen(x, y) {
    return [
      x * this.scale + this.translateX + this.width / 2,
      y * this.scale + this.translateY + this.height / 2,
    ];
  }
}
