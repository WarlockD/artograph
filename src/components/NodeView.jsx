import React from 'react';
import { bound, dragHelper } from '../lib/utils';

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
      this.setState({
        posX: start.px + (event.pageX - start.x0),
        posY: start.py + (event.pageY - start.y0),
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
        this.pins[pinName] = {
          x0: (pinRect.left + pinRect.width / 2) - bodyRect.left,
          y0: (pinRect.top + pinRect.height / 2) - bodyRect.top,
        };
      }
    }

    return this.pins;
  }

  @bound
  onRemoveRequest() {
    this.props.onRemoveRequest(this.props.node);
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

  renderPins(pins) {
    const result = [];

    for (let key in pins) {
      const pin = pins[key];
      result.push(<li key={key}>
        <div
          className='node-view-pin'
          onMouseDown={() => this.props.onConnectionRequest(this.props.node, key)}
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
        ref={(body) => this.nodeBody = body}
        style={{
          transform: `translate(${this.state.posX + 'px'},${this.state.posY + 'px'})`,
        }}>
        <div
          className='node-view-header'
          onMouseDown={this.startNodeMove}>
          {node.name}
          <div
            className='node-view-actions'
            onMouseDown={(event) => event.stopPropagation()}>
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
