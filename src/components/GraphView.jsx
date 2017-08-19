import React from 'react';
import { bound } from '../lib/utils';
import NodeView from './NodeView';

class PinsRegistry {
  constructor() {
    this.pins = new Map();
  }

  updatePin(node, pin, position) {
    if (!this.pins.has(node)) {
      this.pins.set(node, { [pin]: position });
    } else {
      this.pins.get(node)[pin] = position;
    }
  }

  getPin(node, pin) {
    const nodePins = this.pins.get(node);
    if (!nodePins) return;
    const element = nodePins[pin];
    return element;
  }

  unregisterPins(node) {
    this.pins.delete(node);
  }
}

class Connection extends React.Component {
  render() {
    const connection = this.props.connection;
    const pins = this.props.pins;

    // Output pin position
    const o = pins.getPin(connection.sourceNode, connection.sourceOut);
    if (!o) return null;

    // Input pin position
    const i = pins.getPin(connection.targetNode, connection.targetIn);
    if (!i) return null;

    const center = o.x + (i.x - o.x) / 2;
    const pathPoints = `M ${o.x} ${o.y} C ${center} ${o.y} ${center} ${i.y} ${i.x} ${i.y}`;
    return <g>
      <path d={pathPoints} />
    </g>;
  }
}

export default class GraphView extends React.Component {
  pins = new PinsRegistry();

  componentDidMount() {
    // FIXME: This is one solution to problem I have with connections rendering:
    // To properly render node connections I need an information about pins
    // location which is not available until first render of nodes is done.
    // So after component did mount I force the update to render connections
    // with information about pins. Too lame, I know, but I dont have better
    // solution for now.
    this.forceUpdate();
  }

  handleNodeUpdate(node) {
    const connections = this.props.graph.connections;

    for (let i = 0, len = connections.length; i < len; i += 1) {
      const connection = connections[i];
      if (connection.sourceNode === node || connection.targetNode === node) {
        connection.uiElement.forceUpdate();
      }
    }
  }

  renderConnections(connections) {
    const result = [];

    for (let i = 0, len = connections.length; i < len; i += 1) {
      result[i] = <Connection
        key={i}
        ref={(element) => connections[i].uiElement = element}
        connection={connections[i]}
        pins={this.pins}/>
    }

    return <svg className='graph-view-connections'>
      {result}
    </svg>
  }

  renderNodes(nodes) {
    return nodes.map((node, index) => {
      return <NodeView
        key={index}
        node={node}
        onNodeUpdate={() => this.handleNodeUpdate(node)}
        pins={this.pins}/>
    });
  }

  render() {
    const graph = this.props.graph;

    return <div className='graph-view'>
      {this.renderConnections(graph.connections)}
      {this.renderNodes(graph.nodes)}
    </div>
  }
}
