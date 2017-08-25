import React from 'react';
import { bound, dragHelper } from '../lib/utils';
import { align } from '../lib/math';

export default class NodeView extends React.Component {
  state = {
    posX: 0,
    posY: 0,
  };

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

  updateAllPins(firstRun) {
    const node = this.props.node;
    const bodyRect = this.nodeBody.getBoundingClientRect();
    const pins = this.nodeBody.querySelectorAll('.node-view-pin');
    for (let i = 0, len = pins.length; i < len; i += 1) {
      const pin = pins[i];
      const pinName = pin.dataset.pinName;
      const isOutput = pin.dataset.isOutput;
      const rect = pin.getBoundingClientRect();
      this.props.pins.updatePin(node, pinName, {
        x: isOutput ? bodyRect.left + bodyRect.width : bodyRect.left,
        y: rect.top + rect.height / 2,
      });
    }
    this.props.onUpdate(node, firstRun);
  }

  renderPins(pins, outputs) {
    const result = [];

    for (let key in pins) {
      const pin = pins[key];
      result.push(<li
        className='node-view-pin'
        key={key}
        data-pin-name={key}
        data-is-output={outputs}>
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
    this.updateAllPins(true);
  }

  componentDidUpdate() {
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
          ref={(body) => {this.nodeBody = body}}>
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
