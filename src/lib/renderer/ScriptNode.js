import SceneNode from './SceneNode';
import {
  audio,
} from './audioEngine';

export default class ScriptNode extends SceneNode {
  constructor() {
    super({
      name: 'Script',
      inputs: {
        input: {
          name: 'Input',
          type: 'float',
          value: 0.5,
        },
      },
      outputs: {
        output: {
          type: 'float',
          name: 'Output',
        },
      }
    });

    this.compile('return 0;')
  }

  compile(code) {
    try {
      this.func = new Function('input', code);
      this.code = code;
    } catch (e) {
      console.error(e);
    }
  }

  run(inputs) {
    try {
      return { output: this.func(inputs.input) };
    } catch (e) {
      console.error(e);
    }
  }
}
