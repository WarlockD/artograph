import SceneNode from './SceneNode';
import {
  canvas,
  gl,
  createTexture,
  createProgram,
  setSize
} from './offscreenCanvas';

const textureBuffer = gl.createBuffer();
const textureData = new Float32Array([
  1, 1,
  0, 1,
  1, 0,
  0, 0,
]);
gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
gl.bufferData(gl.ARRAY_BUFFER, textureData.buffer, gl.STATIC_DRAW);

const vertexBuffer = gl.createBuffer();
const vertexData = new Float32Array([
  1.0, 1.0, 0.0,
  -1.0, 1.0, 0.0,
  1.0, -1.0, 0.0,
  -1.0, -1.0, 0.0,
]);
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexData.buffer, gl.STATIC_DRAW);

export default class ScreenNode extends SceneNode {
  constructor(targetCanvas) {
    super({
      name: 'Screen',
      inputs: {
        uImage: {
          type: 'sampler2D',
          name: 'Image',
        },
        width: {
          name: 'Width',
          type: 'float',
          value: 512,
        },
        height: {
          name: 'Height',
          type: 'float',
          value: 512,
        },
      },
    });
    if (targetCanvas) this.setTarget(targetCanvas);
    this.program = createProgram(`
      precision lowp float;

      varying vec2 vUv;
      uniform sampler2D uImage;

      void main() {
        gl_FragColor = texture2D(uImage, vUv, 0.0);
      }
    `);
    this.uImage = gl.getUniformLocation(this.program, 'uImage');
    this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
    this.aTexCoord = gl.getAttribLocation(this.program, 'aTexCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
  }

  setTarget(target) {
    this.target = target;
  }

  run(inputs) {
    gl.useProgram(this.program);
    gl.enableVertexAttribArray(this.aPosition);
    gl.enableVertexAttribArray(this.aTexCoord);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputs.uImage);
    gl.uniform1i(this.uImage, inputs.uImage);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.target.width = canvas.width;
    this.target.height = canvas.height;
    const ctx = this.target.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
  }
}
