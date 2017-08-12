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
    assert(input.link, 'Input is already connected');

    input.prevLink = input.link;
    input.link = {
      source: sourceNode,
      sourceOut: sourceOut,
      value: undefined,
      prevValue: undefined,
    };
  }

  // TODO: detachNode

  disconnect(sourceNode, sourceOut, targetNode, targetIn) {
    const input = targetNode.inputs[targetIn];
    const output = sourceNode.outputs[sourceOut];

    assert(!input, `Invalid input "${targetIn}"`);
    assert(!input.link, `Connection ${sourceOut}=>${targetIn} doesn't exist`);

    delete input.link;
  }

  run(node) {
    if (node.inputs) {
      const inputs = {};
      let isDirty = false;

      for (let inputId in node.inputs) {
        const input = node.inputs[inputId];
        const link = input.link;

        if (link !== input.prevLink) {
          isDirty = true;
          input.prevLink = link;
        }

        if (link) {
          const outputs = this.run(link.source);
          link.value = outputs[link.sourceOut];
          assert(typeof link.value === 'undefined', `Can't satisfy node input "${inputId}" with "${link.sourceOut}"`);
          if (link.value !== link.prevValue) {
            isDirty = true;
            link.prevValue = link.value;
          }
          inputs[inputId] = link.value;
        }
      }

      if (isDirty) {
        node.prevOutputs = node.run(inputs);
      }
    } else {
      node.prevOutputs = node.run();
    }

    return node.prevOutputs;
  }
}
