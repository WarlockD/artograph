import SceneNode from './SceneNode';
import SceneGraph from './SceneGraph';

class ValueNode extends SceneNode {
  constructor(value) {
    super({
      outputs: {
        value: { type: 'float', name: 'Constant' },
      },
    });
    this.value = value;
  }

  run() {
    return { value: this.value };
  }
}

class SummatorNode extends SceneNode {
  constructor() {
    super({
      inputs: {
        a: { type: 'float', name: 'Value 1' },
        b: { type: 'float', name: 'Value 2' },
      },
      outputs: {
        c: { type: 'float', name: 'Result' },
      },
    });
  }

  run(inputs) {
    return { c: inputs.a + inputs.b };
  }
}

describe('SceneGraph.run', () => {
  test('Trivial graph', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    const c = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.attachNode(c);
    scene.connect(a, 'value', c, 'a');
    scene.connect(b, 'value', c, 'b');
    const outputs = scene.run(c);
    expect(outputs.c).toBe(30);
  });

  test('2 levels deep graph', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    const c = new ValueNode(30);
    const d = new SummatorNode();
    const e = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.attachNode(c);
    scene.attachNode(d);
    scene.attachNode(e);
    scene.connect(a, 'value', d, 'a');
    scene.connect(b, 'value', d, 'b');
    scene.connect(c, 'value', e, 'a');
    scene.connect(d, 'c', e, 'b');
    const outputs = scene.run(e);
    expect(outputs.c).toBe(60);
  });

  test('Output reuse', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    const c = new SummatorNode();
    const d = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.attachNode(c);
    scene.attachNode(d);
    scene.connect(a, 'value', c, 'a');
    scene.connect(a, 'value', d, 'a');
    scene.connect(b, 'value', c, 'b');
    scene.connect(c, 'c', d, 'b');
    const outputs = scene.run(d);
    expect(outputs.c).toBe(40);
  });

  test('Single input', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.connect(a, 'value', b, 'a');
    scene.connect(a, 'value', b, 'b');
    const outputs = scene.run(b);
    expect(outputs.c).toBe(20);
  });

  test('Do not rerun node if inputs are not changed', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    const c = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.attachNode(c);
    scene.connect(a, 'value', c, 'a');
    scene.connect(b, 'value', c, 'b');
    c.run = jest.fn();
    scene.run(c);
    scene.run(c);
    expect(c.run).toHaveBeenCalledTimes(1);
  });

  test('Rerun node if inputs are changed', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    const c = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.attachNode(c);
    scene.connect(a, 'value', c, 'a');
    scene.connect(b, 'value', c, 'b');
    c.run = jest.fn();
    scene.run(c);
    a.value = 20;
    scene.run(c);
    expect(c.run).toHaveBeenCalledTimes(2);
  });
});
