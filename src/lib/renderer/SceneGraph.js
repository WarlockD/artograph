import { assert } from '../utils';
import SceneNode from './SceneNode';
import ScreenNode from './ScreenNode';

export default class SceneGraph {
  constructor() {
    this.nodes = [];
    this.connections = [];
    this.screenNode = null;
  }

  isPresent(node) {
    return this.nodes.indexOf(node) !== -1;
  }

  attachNode(node) {
    assert(!(node instanceof SceneNode), 'Invalid node');
    assert(this.isPresent(node), 'Node is already attached');
    this.nodes.push(node);
    if (node instanceof ScreenNode) {
      this.screenNode = ScreenNode;
    }
  }

  detachNode(node) {
    assert(!(node instanceof SceneNode), 'Invalid node');
    assert(!this.isPresent(node), 'Node is not attached');
    for (let inputId in node.inputs) {
      const input = node.inputs[inputId];
      assert(input.link, 'Node is still connected');
    }
    this.nodes = this.nodes.filter((value) => value !== node);
    if (node instanceof ScreenNode) {
      this.screenNode = null;
    }
  }

  connect(sourceNode, sourceOut, targetNode, targetIn) {
    if (arguments.length === 1) {
      const connection = sourceNode;
      sourceNode = connection.sourceNode;
      sourceOut = connection.sourceOut;
      targetNode = connection.targetNode;
      targetIn = connection.targetIn;
    }

    assert(!this.isPresent(sourceNode), 'Source node is not attached to the scene graph');
    assert(!this.isPresent(targetNode), 'Target node is not attached to the scene graph');
    assert(sourceNode === targetNode, 'Can\'t connect node to itself');

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

    this.connections.push({ sourceNode, sourceOut, targetNode, targetIn });
  }

  disconnect(sourceNode, sourceOut, targetNode, targetIn) {
    if (arguments.length === 1) {
      const connection = sourceNode;
      sourceNode = connection.sourceNode;
      sourceOut = connection.sourceOut;
      targetNode = connection.targetNode;
      targetIn = connection.targetIn;
    }

    const input = targetNode.inputs[targetIn];

    assert(!input, `Invalid input "${targetIn}"`);
    assert(!input.link, `Connection ${sourceOut}=>${targetIn} doesn't exist`);

    delete input.link;

    this.connections = this.connections.filter((connection) => {
      return !(connection.sourceNode === sourceNode &&
        connection.sourceOut === sourceOut &&
        connection.targetNode === targetNode &&
        connection.targetIn === targetIn);
    });
  }

  run(node, traversedNodes = []) {
    assert(traversedNodes.indexOf(node) !== -1, 'Infinite loop detected. Bailing out.');

    if (node.inputs) {
      const inputs = {};
      let isDirty = false;

      if (typeof node.forwardRun === 'function') {
        node.forwardRun();
      }

      for (let inputId in node.inputs) {
        const input = node.inputs[inputId];
        const link = input.link;

        if (link !== input.prevLink) {
          isDirty = true;
          input.prevLink = link;
        }

        if (link) {
          traversedNodes.push(node);
          const outputs = this.run(link.source, traversedNodes);
          link.value = outputs[link.sourceOut] || input.value;
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

  renderScreen() {
    this.run(this.screenNode);
  }
}
