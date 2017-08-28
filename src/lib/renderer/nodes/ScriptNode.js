import SceneNode from '../SceneNode';

const prelude = `
  function nfreq(note, octave = 2, base = 55) {
    return base * Math.pow(2, (note + (octave * 12)) / 12);
  }

  function seq(time, data) {
    return data[time % data.length | 0];
  }

  function nseq(time, data, octave) {
    const note = data[time % data.length | 0];
    if (typeof note !== 'number') return 0;
    return nfreq(note, octave);
  }
`;

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
      ${prelude}

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

  toJSON() {
    const result = super.toJSON();
    result.code = this.code;
    return result;
  }

  async fromJSON(json) {
    super.fromJSON(json);
    this.compile(json.code);
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
