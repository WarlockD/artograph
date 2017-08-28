import { assert } from '../utils';
import SceneNode from './SceneNode';
import EventEmitter from './EventEmitter';

let idCounter = 0;
let iterationCounter = 0;

export default class SceneGraph extends EventEmitter {
  constructor() {
    super();
    this.clear();
  }

  clear() {
    if (this.connections && this.connections.length > 0) {
      this.connections.slice().forEach((connection) => {
        this.disconnect(connection);
      });
    }

    this.nodes = [];
    this.connections = [];
  }

  isPresent(node) {
    return this.nodes.indexOf(node) !== -1;
  }

  attachNode(node) {
    assert(!(node instanceof SceneNode), 'Invalid node');
    assert(this.isPresent(node), 'Node is already attached');
    node.id = idCounter++;
    this.nodes.push(node);
    this.emit('node.attached', node);
    return node.id;
  }

  detachNode(node) {
    assert(!(node instanceof SceneNode), 'Invalid node');
    assert(!this.isPresent(node), 'Node is not attached');
    const isConnected = this.connections.some((connection) => {
      return connection.sourceNode === node || connection.targetNode === node;
    });
    assert(isConnected, 'Node is still connected');
    this.nodes = this.nodes.filter((value) => value !== node);
    this.emit('node.detached', node);
    node.id = null;
  }

  connect(sourceNode, sourcePin, targetNode, targetPin) {
    if (arguments.length === 1) {
      const connection = sourceNode;
      sourceNode = connection.sourceNode;
      sourcePin = connection.sourcePin;
      targetNode = connection.targetNode;
      targetPin = connection.targetPin;
    }

    assert(!this.isPresent(sourceNode), 'Source node is not attached to the scene graph');
    assert(!this.isPresent(targetNode), 'Target node is not attached to the scene graph');
    assert(sourceNode === targetNode, 'Can\'t connect node to itself');

    const input = targetNode.inputs[targetPin];
    const output = sourceNode.outputs[sourcePin];

    assert(!input, `Invalid input "${targetPin}"`);
    assert(!output, `Invalid output "${sourcePin}"`);
    assert(input.type !== output.type, `Connection ${sourcePin}:${output.type}=>${targetPin}:${input.type} is not possible`);
    assert(input.link, 'Input is already connected');

    sourceNode.lockSchema();
    sourceNode.onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin);
    targetNode.lockSchema();
    targetNode.onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin);

    input.prevLink = input.link;
    input.link = {
      sourceNode: sourceNode,
      output: sourceNode.outputs[sourcePin],
      lastUpdate: null,
    };

    const connection = { sourceNode, sourcePin, targetNode, targetPin };
    this.connections.push(connection);
    this.emit('node.connected', connection);
  }

  disconnect(sourceNode, sourcePin, targetNode, targetPin) {
    if (arguments.length === 1) {
      const connection = sourceNode;
      sourceNode = connection.sourceNode;
      sourcePin = connection.sourcePin;
      targetNode = connection.targetNode;
      targetPin = connection.targetPin;
    }

    const input = targetNode.inputs[targetPin];

    assert(!input, `Invalid input "${targetPin}"`);
    assert(!input.link, `Connection ${sourcePin}=>${targetPin} doesn't exist`);

    sourceNode.unlockSchema();
    sourceNode.onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin);
    targetNode.unlockSchema();
    targetNode.onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin);

    delete input.link;

    const connectionIndex = this.connections.findIndex((connection) => {
      return (connection.sourceNode === sourceNode &&
        connection.sourcePin === sourcePin &&
        connection.targetNode === targetNode &&
        connection.targetPin === targetPin);
    });
    const connection = this.connections[connectionIndex];
    this.connections.splice(connectionIndex, 1);
    this.emit('node.disconnected', connection);
  }

  run(node, traversedNodes = []) {
    if (traversedNodes.indexOf(node) !== -1) {
      return node.outputs;
    }

    traversedNodes.push(node);
    node.onEnter();

    if (node.inputs) {
      const inputs = {};
      let isDirty = false;

      for (let inputPin in node.inputs) {
        const input = node.inputs[inputPin];
        const link = input.link;

        if (link !== input.prevLink) {
          isDirty = true;
          input.prevLink = link;
        }

        if (link) {
          this.run(link.sourceNode, traversedNodes);
          inputs[inputPin] = link.output.value;
          if (link.lastUpdate !== link.output.lastUpdate) {
            isDirty = true;
            link.lastUpdate = link.output.lastUpdate;
          }
        } else {
          inputs[inputPin] = input.value;
        }
      }

      if (isDirty) {
        node.update(inputs);
      }
    } else {
      node.update();
    }

    return node.outputs;
  }
}
