import React from 'react';
import debounce from 'lodash/debounce';
import { bound } from '../lib/utils';
import NodeEditor from './NodeEditor';

export default class ScriptNodeEditor extends NodeEditor {
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

  render() {
    return <div className='script-node-editor'>
      <textarea
        onChange={this.handleCodeChange}
        value={this.state.code}/>
    </div>;
  }
}
