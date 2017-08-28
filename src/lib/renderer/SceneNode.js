import { assert } from '../utils';
import cloneDeep from 'lodash/cloneDeep';

let updateCounter = 0;

export default class SceneNode {
  constructor(schema) {
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

    let result = {};

    for (let pinName in newSchema) {
      let pin = currentSchema && pinName in currentSchema
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
    this.inputs = this._updatePins(this.inputs, schema.inputs);
    this.outputs = this._updatePins(this.outputs, schema.outputs);

    this.name = schema.name || 'Node';
  }

  set(pinName, value) {
    const output = this.outputs[pinName];
    output.value = value;
    output.lastUpdate = updateCounter++;
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
