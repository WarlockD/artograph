export default class SceneNode {
  constructor(schema) {
    this.inputs = schema.inputs || {};
    this.outputs = schema.outputs || {};
  }
}
