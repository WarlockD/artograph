import React from 'react';
import { bound } from '../lib/utils';
import debounce from 'lodash/debounce';
import ScriptNode from '../lib/renderer/ScriptNode';
import GenericNodeView from './GenericNodeView';

export default class ScriptNodeView extends GenericNodeView {
  static modelNode = ScriptNode;

  constructor(props) {
    super(props);

    this.code = props.node.code;

    this.compile = debounce((code) => {
      this.props.node.compile(code);
    }, 1000);
  }

  @bound
  handleCodeChange(event) {
    this.compile(event.target.value);
  }

  renderContents() {
    return <div className='script-node-view'>
      <textarea
        onChange={this.handleCodeChange}
        rows='10'>{this.props.node.code}</textarea>
    </div>;
  }
}
