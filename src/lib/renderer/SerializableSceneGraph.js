import { assert } from '../utils.js';
import SceneGraph from './SceneGraph';
import NodeFactory from './NodeFactory';

const SCENE_SCHEMA_VERSION = 1;

export default class SerializableSceneGraph extends SceneGraph {
  constructor() {
    super();

    this.meta = {};
  }

  async toJSON() {
    return {
      version: SCENE_SCHEMA_VERSION,
      meta: this.meta,
      nodes: this.nodes.map((node) => node.toJSON()),
      connections: this.connections.map((connection) => {
        return [
          connection.sourceNode.id,
          connection.sourcePin,
          connection.targetNode.id,
          connection.targetPin,
        ];
      }),
    };
  }

  async fromJSON(json) {
    assert(
      json.version !== SCENE_SCHEMA_VERSION,
      `Expected scene version ${SCENE_SCHEMA_VERSION}, got ${json.version}`);

    this.clear();

    const nodeMapping = {};
    const nodesLen = json.nodes.length;
    const connectionsLen = json.connections.length;

    for (let i = 0; i < nodesLen; i += 1) {
      const nodeJson = json.nodes[i];
      const node = NodeFactory.createNode(nodeJson.type);
      await node.fromJSON(nodeJson);
      this.attachNode(node);
      nodeMapping[nodeJson.id] = node;
    }

    for (let i = 0; i < connectionsLen; i += 1) {
      const connection = json.connections[i];
      this.connect(
        nodeMapping[connection[0]],
        connection[1],
        nodeMapping[connection[2]],
        connection[3]);
    }

    this.meta = json.meta;
  }
}
