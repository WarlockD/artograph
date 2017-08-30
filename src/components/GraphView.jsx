import React from 'react';
import { bound } from '../lib/utils';
import MetaNodeView from './MetaNodeView';

class PinsRegistry {
  constructor() {
    this.index = new Map();
    this.pins = [];
  }

  updateNodePin(node, pinName, position) {
    const nodePins = this.getNodePins(node) || {};

    if (nodePins[pinName]) {
      nodePins[pinName].x = position.x;
      nodePins[pinName].y = position.y;
    } else {
      nodePins[pinName] = {
        node: node,
        pinName: pinName,
        output: node.outputs && pinName in node.outputs,
        x: position.x,
        y: position.y,
      };
      this.pins.push(nodePins[pinName]);
    }

    this.index.set(node, nodePins);
  }

  updateNodePins(node, pins) {
    const nodePins = this.getNodePins(node);

    // Unregister removed pins
    for (let pinName in nodePins) {
      if (!pins[pinName]) this.unregisterNodePin(node, pinName);
    }

    // Add/update existing pins
    for (let pinName in pins) {
      this.updateNodePin(node, pinName, pins[pinName]);
    }
  }

  getNodePins(node) {
    return this.index.get(node);
  }

  getNodePin(node, pinName) {
    const nodePins = this.getNodePins(node);
    if (!nodePins) return;
    const element = nodePins[pinName];
    return element;
  }

  getPinsNear(px, py, radius) {
    return this.pins
      .reduce((acc, pin) => {
        const dx = pin.x - px;
        const dy = pin.y - py;
        const distance =  Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          acc.push({ ...pin, distance });
        }
        return acc;
      }, [])
      .sort((a, b) => {
        return a.distance - b.distance;
      });
  }

  getPinNear(px, py, radius) {
    const pins = this.getPinsNear(px, py, radius);
    if (pins.length > 0) return pins[0];
  }

  unregisterNodePins(node) {
    this.index.delete(node);
    this.pins = this.pins.filter((pin) => {
      return pin.node !== node;
    });
  }

  unregisterNodePin(node, pinName) {
    const nodePins = this.index.get(node);
    if (nodePins && nodePins[pinName]) delete nodePins[pinName];
    this.pins = this.pins.filter((pin) => {
      return !(pin.node === node && pin.pinName === pinName);
    });
  }
}

// TODO: Calculate this dynamically or read from SCSS vars
const CONNECTION_PIN_RADIUS = 8;

class Connection extends React.Component {
  update() {
    this.forceUpdate();
  }

  render() {
    const connection = this.props.connection;
    const pins = this.props.pins;

    // Output pin position
    const o = pins.getNodePin(connection.sourceNode, connection.sourcePin);
    if (!o) return null;

    // Input pin position
    const i = pins.getNodePin(connection.targetNode, connection.targetPin);
    if (!i) return null;

    const center = o.x + (i.x - o.x) / 2;
    const pathPoints = `M ${o.x} ${o.y} C ${center} ${o.y} ${center} ${i.y} ${i.x} ${i.y}`;
    return <g className='graph-view-connection'>
      <path d={pathPoints} />
      <circle
        onMouseDown={() => this.props.onDragStart(connection, true)}
        cx={o.x}
        cy={o.y}
        r={CONNECTION_PIN_RADIUS}/>
      <circle
        onMouseDown={() => this.props.onDragStart(connection, false)}
        cx={i.x}
        cy={i.y}
        r={CONNECTION_PIN_RADIUS}/>
    </g>;
  }
}

class CandidateConnection extends React.Component {
  state = {
    posX: 0,
    posY: 0,
  };

  componentDidMount() {
    const onMove = (event) => {
      this.setState({
        posX: event.clientX,
        posY: event.clientY,
      });
    }

    const onEnd = (event) => {
      document.removeEventListener('mousemove', onMove, { capture: true });
      document.removeEventListener('mouseup', onEnd);
      const pin = this.props.pins.getPinNear(event.clientX, event.clientY, 10);

      if (!pin) return this.props.onDragEnd(null);

      const candidate = this.props.candidate;

      if (candidate.sourceNode) {
        this.props.onDragEnd({
          sourceNode: candidate.sourceNode,
          sourcePin: candidate.sourcePin,
          targetNode: pin.node,
          targetPin: pin.pinName,
        });
      } else {
        this.props.onDragEnd({
          sourceNode: pin.node,
          sourcePin: pin.pinName,
          targetNode: candidate.targetNode,
          targetPin: candidate.targetPin,
        });
      }
    }

    document.addEventListener('mousemove', onMove, { capture: true });
    document.addEventListener('mouseup', onEnd);

    this.setState({
      posX: event.clientX,
      posY: event.clientY,
    });
  }

  render() {
    const candidate = this.props.candidate;
    const o = candidate.pinPosition;
    const i = { x: this.state.posX, y: this.state.posY };
    const center = o.x + (i.x - o.x) / 2;
    const pathPoints = `M ${o.x} ${o.y} C ${center} ${o.y} ${center} ${i.y} ${i.x} ${i.y}`;
    return <g className='graph-view-connection'>
      <path d={pathPoints} />
      <circle cx={o.x} cy={o.y} r={CONNECTION_PIN_RADIUS}/>
      <circle cx={i.x} cy={i.y} r={CONNECTION_PIN_RADIUS}/>
    </g>
  }
}

class WiringOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pins: props.pins,
      connections: props.connections,
      // Incomplete connection
      candidateConnection: null,
      // Connection being edited
      currentConnection: null,
    };
  }

  updateRelatedWiring(node) {
    const connections = this.state.connections;

    for (let i = 0, len = connections.length; i < len; i += 1) {
      const connection = connections[i];

      // Skip stale connections
      if (connection.uiElement === null) continue;

      if (connection.sourceNode === node || connection.targetNode === node) {
        // If node has not rendered connections, we're out of sync
        // and need to re-render
        if (!connection.uiElement) return this.forceUpdate();

        connection.uiElement.forceUpdate();
      }
    }
  }

  @bound
  handleConnectionDragStart(connection, editOutput) {
    const pins = this.state.pins;
    let candidateConnection;

    if (editOutput) {
      candidateConnection = {
        targetNode: connection.targetNode,
        targetPin: connection.targetPin,
        pinPosition: pins.getNodePin(connection.targetNode, connection.targetPin),
      };
    } else {
      candidateConnection = {
        sourceNode: connection.sourceNode,
        sourcePin: connection.sourcePin,
        pinPosition: pins.getNodePin(connection.sourceNode, connection.sourcePin),
      };
    }

    this.setState({
      currentConnection: connection,
      candidateConnection,
    });
  }

  @bound
  handleConnectionDragEnd(connection) {
    if (this.state.currentConnection) {
      this.props.onDisconnect(this.state.currentConnection);
    }

    if (connection) {
      this.props.onConnect(connection);
    }

    this.setState({
      currentConnection: null,
      candidateConnection: null,
    });
  }

  @bound
  setCandidate(candidateConnection) {
    this.setState({ candidateConnection });
  }

  render() {
    const connections = this.state.connections;
    const currentConnection = this.state.currentConnection;

    let candidate = null;

    if (this.state.candidateConnection) {
      candidate = <CandidateConnection
        candidate={this.state.candidateConnection}
        onDragEnd={this.handleConnectionDragEnd}
        pins={this.state.pins}/>
    }

    return <svg className='graph-view-connections'>
      {connections.map((connection, index) => {
        // Hide connection that is being edited currently
        if (connection === currentConnection) return null;

        return <Connection
          key={index}
          ref={(element) => connection.uiElement = element}
          onDragStart={this.handleConnectionDragStart}
          connection={connection}
          pins={this.state.pins}/>
      })}
      {candidate}
    </svg>
  }
}

export default class GraphView extends React.Component {
  constructor(props) {
    super(props);

    this.pins = new PinsRegistry();
    this.state = {};
  }

  @bound
  detachNode(node) {
    try {
      this.props.graph.detachNode(node);
      this.pins.unregisterNodePins(node);
      this.wiring.updateRelatedWiring(node);
    } catch(e) {
      console.error(e);
    }
  }

  @bound
  handlePinsUpdate(node, pins) {
    this.pins.updateNodePins(node, pins);
    this.wiring.updateRelatedWiring(node);
  }

  @bound
  handleConnect(connection) {
    try {
      this.props.graph.connect(connection);
    } catch (error) {
      console.error(error);
    }
  }

  @bound
  handleDisconnect(connection) {
    try {
      this.props.graph.disconnect(connection);
    } catch (error) {
      console.error(error);
    }
  }

  @bound
  handleConnectionRequest(node, pinName) {
    const pin = this.pins.getNodePin(node, pinName);
    const candidateConnection = pin.output
      ? { sourceNode: pin.node, sourcePin: pin.pinName, pinPosition: pin }
      : { targetNode: pin.node, targetPin: pin.pinName, pinPosition: pin };
    this.wiring.setCandidate(candidateConnection);
  }

  renderNodes(nodes) {
    return nodes.map((node) => {
      return <MetaNodeView
        key={node.id}
        node={node}
        onPinsUpdate={this.handlePinsUpdate}
        onConnectionRequest={this.handleConnectionRequest}
        onRemoveRequest={this.detachNode}/>
    });
  }

  refWiring = (wiring) => { this.wiring = wiring };

  render() {
    const graph = this.props.graph;

    return <div className='graph-view'>
      {this.renderNodes(graph.nodes)}
      <WiringOverlay
        ref={this.refWiring}
        connections={graph.connections}
        pins={this.pins}
        onConnect={this.handleConnect}
        onDisconnect={this.handleDisconnect}/>
    </div>
  }
}
