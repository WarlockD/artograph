import { assert } from '../utils';
import SceneNode from './SceneNode';
import SceneGraph from './SceneGraph';

class TextNode extends SceneNode {
  constructor(text) {
    super({
      outputs: {
        text: { type: 'string', name: 'Text' },
      },
    });
    this.text = text;
  }

  run() {
    return { text: this.text };
  }
}

class ValueNode extends SceneNode {
  constructor(value) {
    super({
      outputs: {
        value: { type: 'float', name: 'Value' },
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

class NegateNode extends SceneNode {
  constructor() {
    super({
      inputs: {
        in: { type: 'float', name: 'Input' },
      },
      outputs: {
        out: { type: 'float', name: 'Negated' },
      },
    });
  }

  run(inputs) {
    assert(!inputs.in, 'Input "in" is missing');
    return -inputs.in;
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

  test('Detach first attached node', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    scene.attachNode(a);
    scene.attachNode(b);
    scene.detachNode(a);
    expect(scene.nodes[0].value).toBe(20);
  });

  test('Detach last attached node', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new ValueNode(20);
    scene.attachNode(a);
    scene.attachNode(b);
    scene.detachNode(b);
    expect(scene.nodes[0].value).toBe(10);
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

describe('SceneGraph.connect', () => {
  test('Fail if source node is not in graph', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(b);
    expect(() => {
      scene.connect(a, 'value', b, 'a');
    }).toThrowError('Source node is not attached to the scene graph');
  });

  test('Fail if target node is not in graph', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    expect(() => {
      scene.connect(a, 'value', b, 'a');
    }).toThrowError('Target node is not attached to the scene graph');
  });

  test('Fail if output is missing', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    expect(() => {
      scene.connect(a, 'INVALID_OUTPUT', b, 'a');
    }).toThrowError('Invalid output "INVALID_OUTPUT"');
  });

  test('Fail if input is missing', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    expect(() => {
      scene.connect(a, 'value', b, 'INVALID_INPUT');
    }).toThrowError('Invalid input "INVALID_INPUT"');
  });

  test('Fail if input is already connected', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.connect(a, 'value', b, 'a');
    expect(() => {
      scene.connect(a, 'value', b, 'a');
    }).toThrowError('Input is already connected');
  });

  test('Fail if types do not match', () => {
    const scene = new SceneGraph();
    const a = new TextNode('Text');
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    expect(() => {
      scene.connect(a, 'text', b, 'a');
    }).toThrowError('Connection text:string=>a:float is not possible');
  });

  test('Expose connection', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.connect(a, 'value', b, 'a');
    expect(scene.connections).toEqual([
      {
        sourceNode: a,
        sourcePin: 'value',
        targetNode: b,
        targetPin: 'a',
      }
    ]);
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

  test('Remove existing connection', () => {
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

  test('Remove exposed connection', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    const b = new SummatorNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.connect(a, 'value', b, 'a');
    // Ensure connection does exist
    expect(scene.connections).toEqual([
      {
        sourceNode: a,
        sourcePin: 'value',
        targetNode: b,
        targetPin: 'a',
      }
    ]);
    scene.disconnect(a, 'value', b, 'a');
    expect(scene.connections).toEqual([]);
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

  test('Always rerun node without inputs', () => {
    const scene = new SceneGraph();
    const a = new ValueNode(10);
    scene.attachNode(a);
    a.run = jest.fn();
    scene.run(a);
    scene.run(a);
    expect(a.run).toHaveBeenCalledTimes(2);
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

  test('Fail on 1 level deep infinite loop', () => {
    const scene = new SceneGraph();
    const a = new NegateNode();
    const b = new NegateNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.connect(a, 'out', b, 'in');
    scene.connect(b, 'out', a, 'in');
    // Since it's a loop "in" will never be defined.
    // So we expect run to throw such exception.
    expect(() => {
      scene.run(b);
    }).toThrowError('Input "in" is missing');
  });

  test('Fail on 2 level deep infinite loop', () => {
    const scene = new SceneGraph();
    const a = new NegateNode();
    const b = new NegateNode();
    const c = new NegateNode();
    scene.attachNode(a);
    scene.attachNode(b);
    scene.attachNode(c);
    scene.connect(a, 'out', b, 'in');
    scene.connect(b, 'out', c, 'in');
    scene.connect(c, 'out', a, 'in');
    expect(() => {
      scene.run(c);
    }).toThrowError('Input "in" is missing');
  });
});
