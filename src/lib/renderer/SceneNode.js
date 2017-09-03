import { assert } from '../utils';
import EventEmitter from './EventEmitter';

let updateCounter = 0;

export default class SceneNode extends EventEmitter {
  constructor(schema) {
    super();
    this.name = 'Node';
    this.id = null;
    this.meta = {};
    if (schema) this.updateSchema(schema);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.constructor.name,
      meta: this.meta,
    };
  }

  async fromJSON(json) {
    this.meta = json.meta || {};
  }

  _updatePins(currentSchema, newSchema) {
    if (!newSchema) return newSchema;

    if (currentSchema) {
      for (let pinName in currentSchema) {
        const isConnected = currentSchema[pinName] &&
          currentSchema[pinName].connections > 0;
        assert(
          isConnected && !newSchema[pinName],
          'Removal of connected pins is not allowed');
        assert(
          isConnected && newSchema[pinName].type !== currentSchema[pinName].type,
          'Changing schema of connected pins is not allowed');
      }
    }

    // All additional pins are allowed

    const result = {};

    for (let pinName in newSchema) {
      const pin = currentSchema && pinName in currentSchema
        ? currentSchema[pinName]
        : {};
      pin.name = newSchema[pinName].name;
      pin.type = newSchema[pinName].type;
      pin.value = newSchema[pinName].value;
      result[pinName] = pin;
    }

    return result;
  }

  updateSchema(schema) {
    if (schema.inputs) {
      this.inputs = this._updatePins(this.inputs, schema.inputs);
    }

    if (schema.outputs) {
      this.outputs = this._updatePins(this.outputs, schema.outputs);
    }

    if (schema.name) {
      this.name = schema.name;
    }

    this.emit('schema.updated');
  }

  set(pinName, value) {
    const output = this.outputs[pinName];
    output.value = value;
    output.lastUpdate = updateCounter++;
  }

  invalidate() {
    this._updateRequired = true;
  }

  onEnter() {
    // Do nothing by default
  }

  onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin) {
    // Count connections to pin
    const pin = this === sourceNode
      ? this.outputs[sourcePin]
      : this.inputs[targetPin];
    pin.connections = (pin.connections || 0) + 1;
  }

  onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin) {
    // Count connections to pin
    const pin = this === sourceNode
      ? this.outputs[sourcePin]
      : this.inputs[targetPin];
    pin.connections = (pin.connections || 0) - 1;
  }

  update() {
    // Do nothing by default
  }
}
