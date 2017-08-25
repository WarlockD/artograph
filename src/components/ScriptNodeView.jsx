import React from 'react';
import { bound } from '../lib/utils';
import debounce from 'lodash/debounce';
import ScriptNode from '../lib/renderer/nodes/ScriptNode';
import NodeView from './NodeView';

export default class ScriptNodeView extends NodeView {
  static modelNode = ScriptNode;

  constructor(props) {
    super(props);

    this.state = {
      code: props.node.code,
    };

    this.compile = debounce((code) => {
      this.props.node.compile(code);
    }, 1000);
  }

  @bound
  handleCodeChange(event) {
    const code = event.target.value;
    this.compile(code);
    this.setState({ code });
  }

  renderContents() {
    return <div className='script-node-view'>
      <textarea
        onChange={this.handleCodeChange}
        value={this.state.code}
        rows='10'/>
    </div>;
  }
}
