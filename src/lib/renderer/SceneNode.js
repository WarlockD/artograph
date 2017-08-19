export default class SceneNode {
  constructor(schema) {
    this.name = schema.name || 'Node';
    this.inputs = schema.inputs;
    this.outputs = schema.outputs;
  }
}
