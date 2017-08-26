import { assert } from '../utils';
import cloneDeep from 'lodash/cloneDeep';

export default class SceneNode {
  constructor(schema) {
    this.locked = 0;
    if (schema) this.updateSchema(schema);
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

  onBeforeRun() {
    // Do nothing by default
  }

  onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin) {
    // Do nothing by default
  }

  onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin) {
    // Do nothing by default
  }
}
