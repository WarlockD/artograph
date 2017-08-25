import cloneDeep from 'lodash/cloneDeep';

export default class SceneNode {
  constructor(schema) {
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
