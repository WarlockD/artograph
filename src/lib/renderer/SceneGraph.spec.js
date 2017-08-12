import { assert } from '../utils';
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
    assert(!inputs.a, 'Input "a" is missing');
    assert(!inputs.b, 'Input "b" is missing');
    return { c: inputs.a + inputs.b };
  }
}

describe('SceneGraph.attachNode', () => {
  test('Attach valid node', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    scene.attachNode(a);
    expect(scene.nodes.length).toBe(1);
  });

  test('Fail if node is invalid', () => {
    const scene = new SceneGraph();
    expect(() => {
      scene.attachNode({ cr: 'ap' });
    }).toThrowError('Invalid node');
  });

  test('Fail if node is already attached', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    scene.attachNode(a);
    expect(() => {
      scene.attachNode(a);
    }).toThrowError('Node is already attached');
  });
});

describe('SceneGraph.detachNode', () => {
  test('Detach attached node', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    scene.attachNode(a);
    scene.detachNode(a);
    expect(scene.nodes.length).toBe(0);
  });

  test('Fail if node is invalid', () => {
    const scene = new SceneGraph();
    expect(() => {
      scene.detachNode({ cr: 'ap' });
    }).toThrowError('Invalid node');
  });

  test('Fail if node is not attached', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    expect(() => {
      scene.detachNode(a);
    }).toThrowError('Node is not attached');
  });
});

describe('SceneGraph.disconnect', () => {
  test('Fail if input doesn\'t exist', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    expect(() => {
      scene.disconnect(a, 'value', b, 'INVALID_INPUT');
    }).toThrowError('Invalid input "INVALID_INPUT"');
  });

  test('Fail if link doesn\'t exist', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    expect(() => {
      scene.disconnect(a, 'value', b, 'a');
    }).toThrowError('Connection value=>a doesn\'t exist');
  });

  test('Disconnect existing link', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    const c = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.attachNode(c);
    scene.connect(a, 'value', c, 'a');
    scene.connect(b, 'value', c, 'b');
    scene.run(c);
    scene.disconnect(a, 'value', c, 'a');
    expect(() => {
      scene.run(c);
    }).toThrowError('Input "a" is missing');
  });
});

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

  test('Rerun node if links are changed', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    // Note that c is the same as b
    const c = new ValueNode(20);
    const d = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.attachNode(c);
    scene.attachNode(d);
    scene.connect(a, 'value', d, 'a');
    scene.connect(b, 'value', d, 'b');
    d.run = jest.fn();
    scene.run(d);
    scene.disconnect(b, 'value', d, 'b');
    scene.connect(c, 'value', d, 'b');
    scene.run(d);
    expect(d.run).toHaveBeenCalledTimes(2);
  });
});
