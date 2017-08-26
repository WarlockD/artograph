import React from 'react';
import { bound } from '../lib/utils';
import MetaNodeView from './MetaNodeView';

class PinsRegistry {
  constructor() {
    this.index = new Map();
    this.pins = [];
  }

  updatePin(node, pinName, position) {
    let nodePins = this.index.get(node) || {};
    let isNewPin = false;

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
      isNewPin = true;
    }

    this.index.set(node, nodePins);

    return isNewPin;
  }

  getPin(node, pin) {
    const nodePins = this.index.get(node);
    if (!nodePins) return;
    const element = nodePins[pin];
    return element;
  }

  unregisterPins(node) {
    this.index.delete(node);
    this.pins = this.pins.filter((pin) => {
      return pin.node !== node;
    });
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
}

class Pin extends React.Component {
  update() {
    this.forceUpdate();
  }

  render () {
    const pin = this.props.pin;
    const cx = pin.x;
    const cy = pin.y;

    return <g className='graph-view-pin'>
      <circle onMouseDown={this.props.onDragStart} cx={cx} cy={cy} r='7' />
    </g>
  }
}

class Connection extends React.Component {
  update() {
    this.forceUpdate();
  }

  render() {
    const connection = this.props.connection;
    const pins = this.props.pins;

    // Output pin position
    const o = pins.getPin(connection.sourceNode, connection.sourcePin);
    if (!o) return null;

    // Input pin position
    const i = pins.getPin(connection.targetNode, connection.targetPin);
    if (!i) return null;

    const center = o.x + (i.x - o.x) / 2;
    const pathPoints = `M ${o.x} ${o.y} C ${center} ${o.y} ${center} ${i.y} ${i.x} ${i.y}`;
    return <g className='graph-view-connection'>
      <path d={pathPoints} />
      <circle
        onMouseDown={() => this.props.onDragStart(connection, true)}
        cx={o.x}
        cy={o.y}
        r='7'/>
      <circle
        onMouseDown={() => this.props.onDragStart(connection, false)}
        cx={i.x}
        cy={i.y}
        r='7'/>
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
      <circle cx={o.x} cy={o.y} r='7'/>
      <circle cx={i.x} cy={i.y} r='7'/>
    </g>
  }
}

export default class GraphView extends React.Component {
  pinsRegistry = new PinsRegistry();
  state = {
    candidateConnection: null,
  };

  @bound
  handleNodeUpdate(node) {
    const connections = this.props.graph.connections;
    const pins = this.pinsRegistry.pins;

    for (let i = 0, len = connections.length; i < len; i += 1) {
      const connection = connections[i];
      const updateNeeded = (connection.sourceNode === node || connection.targetNode === node) &&
        connection.uiElement;
      if (updateNeeded) {
        connection.uiElement.update();
      }
    }

    for (let i = 0, len = pins.length; i < len; i += 1) {
      const pin = pins[i];

      if (pin.uiElement) {
        pin.uiElement.update();
      }
    }
  }

  @bound
  handleConnectionDragStart(connection, editOutput) {
    this.props.graph.disconnect(connection);
    let candidateConnection;

    if (editOutput) {
      candidateConnection = {
        targetNode: connection.targetNode,
        targetPin: connection.targetPin,
        pinPosition: this.pinsRegistry.getPin(connection.targetNode, connection.targetPin),
      };
    } else {
      candidateConnection = {
        sourceNode: connection.sourceNode,
        sourcePin: connection.sourcePin,
        pinPosition: this.pinsRegistry.getPin(connection.sourceNode, connection.sourcePin),
      };
    }

    this.setState({ candidateConnection });
  }

  @bound
  handleConnectionDragEnd(connection) {
    try {
      if (connection) this.props.graph.connect(connection);
    } catch (e) {
      console.error(e);
    }

    this.setState({ candidateConnection: null });
  }

  handleConnectionAddStart(pin) {
    const candidateConnection = pin.output
      ? { sourceNode: pin.node, sourcePin: pin.pinName, pinPosition: pin }
      : { targetNode: pin.node, targetPin: pin.pinName, pinPosition: pin };
    this.setState({ candidateConnection });
  }

  @bound
  detachNode(node) {
    try {
      this.props.graph.detachNode(node);
      this.pinsRegistry.unregisterPins(node);
      this.forceUpdate();
    } catch(e) {
      console.error(e);
    }
  }

  @bound
  updateNodePins(node, pins) {
    let updateRequired = false;

    for (let i = 0, len = pins.length; i < len; i += 1) {
      const pin = pins[i];
      updateRequired = this.pinsRegistry.updatePin(node, pin.name, pin) || updateRequired;
    }

    // FIXME: update only connections/pins svg overlay
    if (updateRequired) {
      this.forceUpdate();
    } else {
      this.handleNodeUpdate(node);
    }
  }

  renderConnections(connections) {
    const result = [];

    for (let i = 0, len = connections.length; i < len; i += 1) {
      const connection = connections[i];
      result.push(<Connection
        key={i}
        ref={(element) => connection.uiElement = element}
        onDragStart={this.handleConnectionDragStart}
        connection={connection}
        pins={this.pinsRegistry}/>);
    }

    if (this.state.candidateConnection) {
      result.push(<CandidateConnection
        key={result.length}
        candidate={this.state.candidateConnection}
        onDragEnd={this.handleConnectionDragEnd}
        pins={this.pinsRegistry}/>);
    }

    return result;
  }

  renderPins(pins) {
    const result = [];

    for (let i = 0, len = pins.length; i < len; i += 1) {
      const pin = pins[i];

      result.push(<Pin
        key={i}
        ref={(element) => pins[i].uiElement = element}
        onDragStart={() => this.handleConnectionAddStart(pin)}
        pin={pin}/>);
    }

    return result;
  }

  renderNodes(nodes) {
    return nodes.map((node) => {
      return <MetaNodeView
        key={node.id}
        node={node}
        updatePins={this.updateNodePins}
        onRemoveRequest={this.detachNode}/>
    });
  }

  render() {
    const graph = this.props.graph;

    return <div className='graph-view'>
      {this.renderNodes(graph.nodes)}
      <svg className='graph-view-connections'>
        {this.renderPins(this.pinsRegistry.pins)}
        {this.renderConnections(graph.connections)}
      </svg>
    </div>
  }
}
