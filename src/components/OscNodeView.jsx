import React from 'react';
import { bound } from '../lib/utils';
import debounce from 'lodash/debounce';
import OscNode from '../lib/renderer/nodes/OscNode';
import NodeView from './NodeView';

export default class OscNodeView extends NodeView {
  static modelNode = OscNode;

  constructor(props) {
    super(props);

    this.state.type = props.node.osc.type;

    this.compile = debounce((code) => {
      this.props.node.compile(code);
    }, 1000);
  }

  @bound
  handleTypeChange(event) {
    const node = this.props.node;
    const type = event.target.value;
    node.osc.type = type;
    this.setState({ type: type });
  }

  renderContents() {
    return <div className='osc-node-view'>
      <select
        className='input'
        value={this.state.type}
        onChange={this.handleTypeChange}>
        <option value='sine'>sine</option>
        <option value='triangle'>triangle</option>
        <option value='square'>square</option>
      </select>
    </div>;
  }
}
