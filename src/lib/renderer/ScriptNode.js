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
    this.func = new Function('input', code);
    this.code = code;
  }

  run(inputs) {
    return { output: this.func(inputs.input) };
  }
}
