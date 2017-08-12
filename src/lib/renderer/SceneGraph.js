import { assert } from '../utils';

export default class SceneGraph {
  constructor() {
    this.nodes = [];
  }

  attachNode(node) {
    this.nodes.push(node);
  }

  connect(sourceNode, sourceOut, targetNode, targetIn) {
    const input = targetNode.inputs[targetIn];
    const output = sourceNode.outputs[sourceOut];

    assert(!input, `Invalid input "${targetIn}"`);
    assert(!output, `Invalid output "${sourceOut}"`);
    assert(input.type !== output.type, `Connection ${sourceOut}:${output.type}=>${targetIn}:${input.type} is not possible`);
    assert(input.connection, 'Input is already connected');

    input.connection = {
      source: sourceNode,
      sourceOut: sourceOut,
      value: undefined,
    };
  }

  // TODO: detachNode
  // TODO: disconnect

  // TODO: Do not run node if inputs aren't changed
  run(node) {
    const inputs = {};

    for (let inputId in node.inputs) {
      const input = node.inputs[inputId];
      const conn = input.connection;
      if (conn && typeof conn.value === 'undefined') {
        const outputs = this.run(conn.source);
        input.connection.value = outputs[conn.sourceOut];
      }
      inputs[inputId] = input.connection.value;
    }

    return node.run(inputs);
  }
}
