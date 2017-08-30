import React from 'react';
import { bound, dragHelper } from '../lib/utils';
import { align } from '../lib/math';

export default class NodeView extends React.Component {
  constructor(props) {
    super(props);
    const node = props.node;
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
    // TODO: Calc relative positions on schema change once and
    // update using only node position.
    const node = this.props.node;
    const pins = this.nodeBody.querySelectorAll('.node-view-pin');
    const result = {};

    for (let i = 0, len = pins.length; i < len; i += 1) {
      const pin = pins[i];
      const pinRect = pin.getBoundingClientRect();
      const pinName = pin.dataset.pinName;
      result[pinName] = {
        x: pinRect.left + pinRect.width / 2,
        y: pinRect.top + pinRect.height / 2,
      };
    }

    this.props.onPinsUpdate(node, result);
  }

  @bound
  onRemoveRequest() {
    this.props.onRemoveRequest(this.props.node);
  }

  handleSchemaUpdate = () => {
    this.forceUpdate();
  }

  componentDidMount() {
    this.handleSchemaUpdate();
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

  renderPins(pins, isOutput) {
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
            <span onClick={this.onRemoveRequest}>X</span>
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
