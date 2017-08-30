import { assert } from '../utils';
import nodes from './nodes';
import { ScreenNode } from './ScreenNode';

class NodeFactory {
  constructor() {
    this.mapping = nodes.reduce((acc, Node) => {
      acc[Node.name] = () => new Node();
      return acc;
    }, {});

    // Since screen node is a singleton it requires special handling
    this.mapping['ScreenNode'] = () => ScreenNode;
  }

  createNode(type) {
    assert(!(type in this.mapping), 'Unknown node type');
    return this.mapping[type]();
  }
}

export default new NodeFactory();
