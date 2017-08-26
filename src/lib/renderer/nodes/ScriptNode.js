import SceneNode from '../SceneNode';

export default class ScriptNode extends SceneNode {
  static nodeName = 'Script';

  constructor() {
    super({
      name: 'Script',
      inputs: {
        input: {name: 'Input',
          type: 'float',
          value: 0.5,
        },
      },
      outputs: {
        a: { type: 'float', name: 'a' },
        b: { type: 'float', name: 'b' },
        c: { type: 'float', name: 'c' },
        d: { type: 'float', name: 'd' },
      }
    });

    this.compile('')
  }

  compile(code) {
    'use strict';

    const allowedGlobals = ['Math', 'Date'];
    const globals = Object.keys(window).reduce((acc, global) => {
      const overrideNeeded = allowedGlobals.indexOf(global) === -1 && /^\w+$/.test(global);
      if (overrideNeeded) {
        acc += `let ${global};\n`;
      }
      return acc;
    }, '');
    const script = `
      'use strict';

      ${globals}

      (function(input) {
        let a = 0, b = 0, c = 0, d = 0;
        ${code}
        return { a: a, b: b, c: c, d: d };
      })
    `;

    try {
      this.func = eval(script);
      this.code = code;
    } catch (e) {
      console.error(e);
    }
  }

  update(inputs) {
    try {
      const outputs = this.func(inputs.input);
      this.set('a', outputs.a);
      this.set('b', outputs.b);
      this.set('c', outputs.c);
      this.set('d', outputs.d);
    } catch (e) {
      console.error(e);
    }
  }
}
