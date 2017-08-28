import { assert } from '../utils';
import cloneDeep from 'lodash/cloneDeep';

let updateCounter = 0;

export default class SceneNode {
  constructor(schema) {
    this.id = null;
    this.locked = 0;
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

  lockSchema() {
    this.locked += 1;
  }

  unlockSchema() {
    // NOTE: throw an error maybe?
    if (this.locked === 0) return;

    this.locked -= 1;
  }

  updateSchema(schema) {
    // With this I'm trying to ensure that user cannot change schema if
    // node has some connections, since this introduces unneeded complexity.
    // See also SceneGraph.connect and SceneGraph.disconnect
    assert(this.locked > 0, 'Cannot change schema of locked node!');

    this.name = schema.name || 'Node';
    this.inputs = cloneDeep(schema.inputs);
    this.outputs = cloneDeep(schema.outputs);
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
    // Do nothing by default
  }

  onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin) {
    // Do nothing by default
  }

  update() {
    // Do nothing by default
  }
}
