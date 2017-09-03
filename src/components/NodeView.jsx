import React from 'react';
import { bound, dragHelper } from '../lib/utils';
import NodeEditor from './NodeEditor';

export default class NodeView extends React.Component {
  constructor(props) {
    super(props);
    const node = props.node;
    this.state = {
      posX: node.meta.posX || 0,
      posY: node.meta.posY || 0,
    };
    this.pins = null;
  }

  startNodeMove = dragHelper({
    onStart: (event) => {
      return {
        px: this.state.posX,
        py: this.state.posY,
        x0: event.pageX,
        y0: event.pageY,
      };
    },
    onMove: (start, event) => {
      const [dx, dy] = this.props.viewport.vectorToWorld(
        event.clientX - start.x0,
        event.clientY - start.y0);
      this.setState({
        posX: start.px + dx,
        posY: start.py + dy,
      });
    }
  });

  updateAllPins() {
    const pins = this.initPinPositions();
    const node = this.props.node;
    for (let pinName in pins) {
      const pin = pins[pinName];
      pin.x = pin.x0 + this.state.posX;
      pin.y = pin.y0 + this.state.posY;
    }
    this.props.onPinsUpdate(node, pins);
  }

  initPinPositions() {
    if (!this.pins) {
      this.pins = {};
      const nodeBody = this.nodeBody;
      const bodyRect = nodeBody.getBoundingClientRect();
      const pins = nodeBody.querySelectorAll('.node-view-pin');

      for (let i = 0, len = pins.length; i < len; i += 1) {
        const pin = pins[i];
        const pinRect = pin.getBoundingClientRect();
        const pinName = pin.dataset.pinName;
        const pos = this.props.viewport.vectorToWorld(
          (pinRect.left + pinRect.width / 2) - bodyRect.left,
          (pinRect.top + pinRect.height / 2) - bodyRect.top);
        this.pins[pinName] = {
          x0: pos[0],
          y0: pos[1],
        };
      }
    }

    return this.pins;
  }

  @bound
  onRemoveRequest() {
    this.props.onRemoveRequest(this.props.node);
  }

  @bound
  handleEditorRequest() {
    this.props.onEditorRequest(this.renderEditor());
  }

  handleSchemaUpdate = () => {
    this.pins = null;
    this.forceUpdate();
  }

  componentDidMount() {
    requestAnimationFrame(() => {
      this.updateAllPins();
    });
    this.props.node.on('schema.updated', this.handleSchemaUpdate);
  }

  componentDidUpdate() {
    const node = this.props.node;
    node.meta.posX = this.state.posX;
    node.meta.posY = this.state.posY;
    this.updateAllPins();
  }

  componentWillUnmount() {
    this.props.node.off('schema.updated', this.handleSchemaUpdate);
  }

  renderContents() {
    return null;
  }

  renderEditor() {
    return <NodeEditor
      node={this.props.node}
      nodeView={this}/>
  }

  renderPins(pins) {
    const result = [];

    for (let key in pins) {
      const pin = pins[key];
      result.push(<li key={key}>
        <div
          className='node-view-pin'
          onMouseDown={(event) => {
            event.stopPropagation();
            this.props.onConnectionRequest(this.props.node, key)
          }}
          data-pin-name={key}/>
        {pin.name}
      </li>);
    }

    return result;
  }

  render() {
    const node = this.props.node;

    return (
      <div
        className='node-view'
        onClick={this.handleEditorRequest}
        ref={(body) => this.nodeBody = body}
        style={{
          transform: `translate(${this.state.posX + 'px'},${this.state.posY + 'px'})`,
        }}>
        <div
          className='node-view-header'
          onMouseDown={this.startNodeMove}>
          {node.name}
          <div className='node-view-actions'>
            <span onClick={this.onRemoveRequest}>X</span>
          </div>
        </div>
        <div className='node-view-body'>
          {this.renderContents()}
          <div className='node-view-pins'>
            <ul className='node-view-inputs'>
              {this.renderPins(node.inputs)}
            </ul>
            <ul className='node-view-outputs'>
              {this.renderPins(node.outputs, true)}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
