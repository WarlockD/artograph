import cloneDeep from 'lodash/cloneDeep';

export default class SceneNode {
  constructor(schema) {
    this.name = schema.name || 'Node';
    this.inputs = cloneDeep(schema.inputs);
    this.outputs = cloneDeep(schema.outputs);
  }
}
