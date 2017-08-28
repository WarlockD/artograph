import React from 'react';
import { bound, dragHelper } from '../lib/utils';
import { align } from '../lib/math';

export default class NodeView extends React.Component {
  constructor(props) {
    super(props);
    const node = props.node;
    this.pins = [];
    this.state = {
      posX: node.meta.posX || 0,
      posY: node.meta.posY || 0,
      outputs: node.outputs,
      inputs: node.inputs,
    };
  }

  startNodeMove = dragHelper({
    onStart: (event) => {
      const container = event.target.getBoundingClientRect();
      return {
        x: event.pageX - container.left,
        y: event.pageY - container.top,
      };
    },
    onMove: (start, event) => {
      this.setState({
        posX: event.pageX - start.x,
        posY: event.pageY - start.y,
      });
    }
  });

  updateAllPins() {
    const node = this.props.node;
    const bodyRect = this.nodeBody.getBoundingClientRect();
    const pins = this.nodeBody.querySelectorAll('.node-view-pin');
    const len = pins.length;
    let i;

    for (i = 0; i < len; i += 1) {
      const pin = pins[i];
      const isOutput = pin.dataset.isOutput;
      const pinRect = pin.getBoundingClientRect();
      this.pins[i] = {
        name: pin.dataset.pinName,
        x: isOutput ? bodyRect.left + bodyRect.width : bodyRect.left,
        y: pinRect.top + pinRect.height / 2,
      };
    }

    if (len < this.pins.length) {
      this.pins.splice(i, this.pins.length - len);
    }

    this.props.updatePins(node, this.pins);
  }

  renderPins(pins, isOutput) {
    const result = [];

    for (let key in pins) {
      const pin = pins[key];
      result.push(<li
        className='node-view-pin'
        key={key}
        data-pin-name={key}
        data-is-output={isOutput}>
        {pin.name}
      </li>);
    }

    return result;
  }

  @bound
  requestRemoval() {
    this.props.onRemoveRequest(this.props.node);
  }

  componentDidMount() {
    this.updateAllPins();
  }

  componentDidUpdate() {
    const node = this.props.node;
    node.meta.posX = this.state.posX;
    node.meta.posY = this.state.posY;
    this.updateAllPins();
  }

  renderContents() {
    return null;
  }

  render() {
    const node = this.props.node;

    return (
      <div
        className='node-view'
        style={{
          left: this.state.posX + 'px',
          top: this.state.posY + 'px',
        }}>
        <div
          className='node-view-header'
          onMouseDown={this.startNodeMove}>
          {node.name}
          <div
            className='node-view-actions'
            onMouseDown={(event) => event.stopPropagation()}>
            <span onClick={this.requestRemoval}>X</span>
          </div>
        </div>
        <div
          className='node-view-body'
          ref={(body) => this.nodeBody = body}>
          {this.renderContents()}
          <div className='node-view-pins'>
            <ul className='node-view-inputs'>
              {this.renderPins(this.state.inputs)}
            </ul>
            <ul className='node-view-outputs'>
              {this.renderPins(this.state.outputs, true)}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
