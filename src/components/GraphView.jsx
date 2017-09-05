import React from 'react';
import {
  bound,
  classes,
  dragHelper,
  keyboardHelper,
} from '../lib/utils';
import { clamp } from '../lib/math';
import MetaNodeView from './MetaNodeView';
import Viewport from './Viewport';

// TODO: Calculate this dynamically or read from SCSS vars
const CONNECTION_PIN_RADIUS = 8;

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

class Connection extends React.Component {
  handleOutputDragStart = (event) => {
    event.stopPropagation();
    const connection = this.props.connection;
    this.props.onDragStart(connection, true);
  }

  handleInputDragStart = (event) => {
    event.stopPropagation();
    const connection = this.props.connection;
    this.props.onDragStart(connection, false);
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
        onMouseDown={this.handleOutputDragStart}
        cx={o.x}
        cy={o.y}
        r={CONNECTION_PIN_RADIUS}/>
      <circle
        onMouseDown={this.handleInputDragStart}
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
      const [px, py] = this.props.viewport.pointToWorld(event.clientX, event.clientY);
      this.setState({
        posX: px,
        posY: py,
      });
    }

    const onEnd = (event) => {
      document.removeEventListener('mousemove', onMove, { capture: true });
      document.removeEventListener('mouseup', onEnd);
      const [px, py] = this.props.viewport.pointToWorld(event.clientX, event.clientY);
      const pin = this.props.pins.getPinNear(px, py, 10);

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
      // Incomplete connection
      candidateConnection: null,
      // Connection being edited
      currentConnection: null,
    };
  }

  updateRelatedWiring(node) {
    const connections = this.props.connections;

    for (let i = 0, len = connections.length; i < len; i += 1) {
      const connection = connections[i];

      // Skip stale connections
      if (connection.uiElement === null) continue;

      if (connection.sourceNode === node || connection.targetNode === node) {
        connection.uiElement.forceUpdate();
      }
    }
  }

  @bound
  handleConnectionDragStart(connection, editOutput) {
    const pins = this.props.pins;
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
    let candidate = null;

    if (this.state.candidateConnection) {
      candidate = <CandidateConnection
        viewport={this.props.viewport}
        candidate={this.state.candidateConnection}
        onDragEnd={this.handleConnectionDragEnd}
        pins={this.props.pins}/>
    }

    return <g>
      {this.props.connections.map((connection, index) => {
        // Hide connection that is being edited currently
        if (connection === this.state.currentConnection) return null;

        return <Connection
          key={index}
          ref={(element) => connection.uiElement = element}
          onDragStart={this.handleConnectionDragStart}
          connection={connection}
          pins={this.props.pins}/>
      })}
      {candidate}
    </g>
  }
}

export default class GraphView extends React.Component {
  constructor(props) {
    super(props);

    const graph = props.graph;

    this.pins = new PinsRegistry();
    this.viewport = new Viewport();
    this.viewport.setPosition(graph.meta.posX, graph.meta.posY);

    this.state = {
      isEditorOpen: false,
    };
  }

  // NOTE: graph view position is not stored in nor updated via react
  // state because re-rendering of a whole graph just to shift
  // nodes a bit is way too much.
  startGraphMove = dragHelper({
    onStart: (event) => {
      return {
        px: this.viewport.posX,
        py: this.viewport.posY,
        x0: event.clientX,
        y0: event.clientY,
      };
    },
    onMove: (start, event) => {
      // Update viewport
      const meta = this.props.graph.meta;
      const [dx, dy] = this.viewport.vectorToWorld(
        start.x0 - event.clientX,
        start.y0 - event.clientY);
      meta.posX = start.px + dx;
      meta.posY = start.py + dy;
      this.viewport.setPosition(meta.posX, meta.posY);
      this.updateGraphTransform();
    }
  });

  updateGraphTransform() {
    const scale = this.viewport.scale;
    const posX = this.viewport.translateX;
    const posY = this.viewport.translateY;
    const cssTransform = `
      translate3d(${posX}px, ${posY}px, 0)
      scale(${scale})
      translate3d(50%, 50%, 0)`;
    this.nodesWrapper.style.transform = cssTransform;
    const transform = this.wiringWrapper.transform.baseVal;
    transform.getItem(1).setScale(scale, scale);
    transform.getItem(0).setTranslate(
      posX + this.viewport.width / 2,
      posY + this.viewport.height / 2);
  }

  @bound
  detachNode(node) {
    try {
      this.props.graph.detachNode(node);
      this.pins.unregisterNodePins(node);
      this.forceUpdate();
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

  @bound
  handleMouseWheel(event) {
    event.preventDefault();
    const step = 1.4;
    const factor = event.deltaY < 0 ? step : 1 / step;
    const newScale = clamp(this.viewport.scale * factor, 0.1, 1);
    this.viewport.setScale(newScale);
    this.updateGraphTransform();
  }

  @bound
  handleDoubleClick(event) {
    event.stopPropagation();
    this.viewport.setScale(1);
    this.viewport.setPosition(0, 0);
    this.updateGraphTransform();
  }

  @bound
  handleWindowResize() {
    this.viewport.setSize(this.root.clientWidth, this.root.clientHeight);
    this.updateGraphTransform();
  }

  componentDidMount() {
    // TODO: Better shortcut system needed
    keyboardHelper(document, {
      'F2': () => this.setState({ isEditorOpen: !this.state.isEditorOpen }),
    });

    this.handleWindowResize();
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentDidUpdate() {
    this.updateGraphTransform();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  refWiring = (wiring) => { this.wiring = wiring };

  renderNodes(nodes) {
    return nodes.map((node) => {
      return <MetaNodeView
        key={node.id}
        viewport={this.viewport}
        node={node}
        onEditorRequest={(editor) => this.setState({ editor: editor })}
        onPinsUpdate={this.handlePinsUpdate}
        onConnectionRequest={this.handleConnectionRequest}
        onRemoveRequest={this.detachNode}/>
    });
  }

  render() {
    const graph = this.props.graph;
    const editor = this.state.editor;
    const editorClasses = classes('graph-view-node-editor', {
      hidden: !this.state.isEditorOpen,
    });

    return <div
      className='graph-view'
      ref={(root) => this.root = root}>
      <div
        className='graph-view-viewport'
        onDoubleClick={this.handleDoubleClick}
        onMouseDown={this.startGraphMove}
        onWheel={this.handleMouseWheel}>
        <div
          className='graph-view-nodes-wrapper'
          ref={(nodesWrapper) => this.nodesWrapper = nodesWrapper}>
          {this.renderNodes(graph.nodes)}
        </div>
        <svg className='graph-view-wiring'>
          <g
            ref={(wiringWrapper) => this.wiringWrapper = wiringWrapper}
            transform='translate(0, 0) scale(1)'>
            <WiringOverlay
              ref={this.refWiring}
              viewport={this.viewport}
              connections={graph.connections}
              pins={this.pins}
              onConnect={this.handleConnect}
              onDisconnect={this.handleDisconnect}/>
          </g>
        </svg>
      </div>
      <div className={editorClasses}>
        {editor}
      </div>
    </div>
  }
}
