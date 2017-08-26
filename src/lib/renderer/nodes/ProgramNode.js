import SceneNode from '../SceneNode';
import {
  gl,
  createTexture,
  createProgram,
  getSize,
} from '../screen';

const uniformTypeMapping = {
  float: 'uniform1f',
  int: 'uniform1i',
  vec2: 'uniform2fv',
  vec3: 'uniform3fv',
  color: 'uniform3fv',
  sampler2D: 'uniform1i',
};

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

export default class ProgramNode extends SceneNode {
  static nodeName = 'Shader';

  constructor(definition) {
    super({
      name: ProgramNode.nodeName,
      inputs: [],
      outputs: {
        result: { type: 'sampler2D', name: 'Result' },
      },
    });

    this.program = null;

    this.rendererSize = getSize();
    this.initFramebuffer(this.rendererSize.width, this.rendererSize.height);

    if (definition) this.loadDefinition(definition);
  }

  loadDefinition(definition) {
    this.updateSchema({
      name: definition.name || 'Shader',
      inputs: definition.uniforms,
      outputs: {
        result: { type: 'sampler2D', name: 'Result' },
      },
    });

    this.program = createProgram(definition.shader);

    this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.aPosition);

    this.aTexCoord = gl.getAttribLocation(this.program, 'aTexCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.aTexCoord);
  }

  initFramebuffer(width, height) {
    if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
    if (this.result) gl.deleteFramebuffer(this.result);

    this.result = createTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.result, 0);
  }

  update(inputs) {
    if (!this.program) return;

    const currentSize = getSize();

    if (currentSize.toString() !== this.rendererSize.toString()) {
      this.initFramebuffer(currentSize.width, currentSize.height);
      this.rendererSize = currentSize;
    }

    gl.useProgram(this.program);
    gl.enableVertexAttribArray(this.aPosition);
    gl.enableVertexAttribArray(this.aTexCoord);

    let activeTexture = 0;
    for (let inputId in this.inputs) {
      const location = gl.getUniformLocation(this.program, inputId);
      const input = this.inputs[inputId];
      let value = inputs[inputId] || input.default;

      if (input.type === 'sampler2D') {
        gl.activeTexture(gl.TEXTURE0 + activeTexture);
        gl.bindTexture(gl.TEXTURE_2D, value);
        value = activeTexture;
        activeTexture += 1;
      }

      gl[uniformTypeMapping[input.type]](location, value);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.set('result', this.result);
  }
}
