import SceneNode from './SceneNode';
import { isPowerOfTwo, toPowerOfTwo } from '../math';

// Exports are at the bottom

const passthroughVS = `
  attribute vec4 aPosition;
  attribute vec2 aTexCoord;

  varying vec2 vUv;

  void main() {
    vUv = aTexCoord;
    gl_Position = aPosition;
  }
`;

const textureData = new Float32Array([
  1, 1,
  0, 1,
  1, 0,
  0, 0,
]);

const vertexData = new Float32Array([
  1.0, 1.0, 0.0,
  -1.0, 1.0, 0.0,
  1.0, -1.0, 0.0,
  -1.0, -1.0, 0.0,
]);

class ScreenNode extends SceneNode {
  constructor() {
    super({
      name: 'Screen',
      inputs: {
        uImage: {
          type: 'sampler2D',
          name: 'Image',
        },
        sound: {
          type: 'sound',
          name: 'Sound',
        },
      },
    });

    this.canvas = document.createElement('canvas');
    this.canvas.style.backgroundColor = 'transparent';

    this.initGL(this.canvas);
    this.initAudio();

    this.setRendererSize(1024, 1024);

    window.addEventListener('focus', () => {
      this.audioNode.gain.value = 1.0;
    });

    window.addEventListener('blur', () => {
      this.audioNode.gain.value = 0.0;
    });
  }

  initGL(canvas) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      throw new Error('WebGL is not supported');
    }

    this.gl = gl;

    this.program = this.createProgram(`
      precision lowp float;

      varying vec2 vUv;
      uniform sampler2D uImage;

      void main() {
        gl_FragColor = texture2D(uImage, vUv, 0.0);
      }
    `);

    this.uImage = gl.getUniformLocation(this.program, 'uImage');

    this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData.buffer, gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

    this.aTexCoord = gl.getAttribLocation(this.program, 'aTexCoord');
    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureData.buffer, gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);

    this.MAX_TEXTURE_RESOLUTION = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    return gl;
  }

  initAudio() {
    if (!window.AudioContext) {
      throw new Error('WebAudio is not supported');
    }

    this.audio = new window.AudioContext();

    this.audioNode = this.audio.createGain();
    this.audioNode.gain.value = 1.0;
    this.audioNode.connect(this.audio.destination);
  }

  createProgram(fragmentShaderSource, vertexShaderSource = passthroughVS) {
    const gl = this.gl;
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

  createTexture(source) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (source) this.updateTexture(texture, source);
    return texture;
  }

  updateTexture(texture, source) {
    const gl = this.gl;
    const image = source.width === source.height && isPowerOfTwo(source.width)
      ? source
      : this.resizeToPowerOfTwo(source);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  setRendererSize(width, height) {
    const canvas = this.canvas;
    const gl = this.gl;

    if (canvas.width === width && canvas.height === height) return;

    const aWidth = toPowerOfTwo(width);
    const aHeight = toPowerOfTwo(height);

    if (aWidth > this.MAX_TEXTURE_RESOLUTION || aHeight > this.MAX_TEXTURE_RESOLUTION) {
      throw new Error(`Rendering of images larger than ${this.MAX_TEXTURE_RESOLUTION} is not supported yet.`);
    }

    canvas.width = aWidth;
    canvas.height = aHeight;
    gl.viewport(0, 0, aWidth, aHeight);

    this.rendererSize = Object.freeze({
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
    });
  }

  getRendererSize() {
    return this.rendererSize;
  }

  resizeToPowerOfTwo(image) {
    const size = Math.max(image.width, image.height);
    const alignedSize = toPowerOfTwo(Math.min(this.MAX_TEXTURE_RESOLUTION, size));
    const factor = alignedSize / size;
    const canvas = document.createElement('canvas');
    canvas.width = alignedSize;
    canvas.height = alignedSize;
    canvas.getContext('2d').drawImage(
      image,
      (alignedSize - image.width * factor) / 2,
      (alignedSize - image.height * factor) / 2,
      image.width * factor,
      image.height * factor);
    return canvas;
  }

  requestFullscreen() {
    const canvas = this.canvas;

    if (canvas.requestFullscreen) {
      canvas.requestFullscreen();
    } else if (canvas.mozRequestFullScreen) {
      canvas.mozRequestFullScreen();
    } else if (canvas.webkitRequestFullscreen) {
      canvas.webkitRequestFullscreen();
    }
  }

  update(inputs) {
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.enableVertexAttribArray(this.aPosition);
    gl.enableVertexAttribArray(this.aTexCoord);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputs.uImage);
    gl.uniform1i(this.uImage, inputs.uImage);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

const screenNode = new ScreenNode();
const gl = screenNode.gl;
const audio = screenNode.audio;

export {
  gl,
  audio,
  screenNode as ScreenNode,
};
