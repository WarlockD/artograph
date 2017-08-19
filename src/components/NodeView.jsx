import React from 'react';
import { bound, dragHelper } from '../lib/utils';

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

  updatePin(node, pinName, pinElement) {
    const rect = pinElement.getBoundingClientRect();
    this.props.pins.updatePin(this.props.node, pinName, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }

  updateAllPins() {
    const node = this.props.node;
    const pins = this.nodeBody.querySelectorAll('.node-view-pin');
    for (let i = 0, len = pins.length; i < len; i += 1) {
      const pin = pins[i];
      this.updatePin(node, pin.dataset.pinName, pin);
    }
    this.props.onNodeUpdate(node);
  }

  renderPins(pins) {
    const result = [];

    for (let key in pins) {
      const pin = pins[key];
      result.push(<li key={key}>
        <div className='node-view-pin' data-pin-name={key} />
        {pin.name}
      </li>);
    }

    return result;
  }

  componentDidUpdate() {
    this.updateAllPins();
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
        </div>
        <div
          className='node-view-body'
          ref={(body) => {this.nodeBody = body}}>
          <ul className='node-view-pins node-view-inputs'>
            {this.renderPins(node.inputs)}
          </ul>
          <ul className='node-view-pins node-view-outputs'>
            {this.renderPins(node.outputs)}
          </ul>
        </div>
      </div>
    );
  }
}
