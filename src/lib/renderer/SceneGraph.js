import { assert } from '../utils';
import SceneNode from './SceneNode';
import ScreenNode from './ScreenNode';

class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(eventName, listener) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(listener);
  }

  off(eventName, listener) {
    const listeners = this.listeners[eventName];

    if (!listeners) throw new Error(`There is no listeners for "${eventName}"`);

    this.listeners[eventName] = listeners.filter((existingListener) => {
      return existingListener !== listener;
    });
  }

  emit(eventName, ...params) {
    const listeners = this.listeners[eventName];

    if (!listeners) return;

    for (let i = 0, len = listeners.length; i < len; i += 1) {
      const listener = listeners[i];
      listener(...params);
    }
  }
}

export default class SceneGraph extends EventEmitter {
  constructor() {
    super();
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

    sourceNode.onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin);
    targetNode.onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin);

    input.prevLink = input.link;
    input.link = {
      source: sourceNode,
      sourcePin: sourcePin,
      value: undefined,
      prevValue: undefined,
    };

    this.connections.push({ sourceNode, sourcePin, targetNode, targetPin });
    this.emit('topology.changed');
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

    sourceNode.onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin);
    targetNode.onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin);

    delete input.link;

    this.connections = this.connections.filter((connection) => {
      return !(connection.sourceNode === sourceNode &&
        connection.sourcePin === sourcePin &&
        connection.targetNode === targetNode &&
        connection.targetPin === targetPin);
    });
  }

  run(node, traversedNodes = []) {
    if (traversedNodes.indexOf(node) !== -1) {
      return node.prevOutputs;
    }

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
          const outputs = this.run(link.source, traversedNodes);
          link.value = outputs[link.sourcePin];
          if (link.value !== link.prevValue) {
            isDirty = true;
            link.prevValue = link.value;
          }
          inputs[inputId] = link.value;
        } else {
          inputs[inputId] = input.value;
        }
      }

      node.prevOutputs = node.run(inputs);

      traversedNodes.push(node);
      // if (isDirty) {
      // }
    } else {
      node.prevOutputs = node.run();
    }

    return node.prevOutputs;
  }

  renderScreen() {
    this.run(this.screenNode);
  }
}
