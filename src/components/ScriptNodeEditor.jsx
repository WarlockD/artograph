import React from 'react';
import debounce from 'lodash/debounce';
import { bound } from '../lib/utils';
import NodeEditor from './NodeEditor';
import CodeMirror from 'react-codemirror';

require('codemirror/lib/codemirror.css');
require('codemirror/mode/clike/clike');

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
  handleCodeChange(code) {
    this.compile(code);
    this.setState({ code });
  }

  componentDidMount() {
    this.editor.getCodeMirror().setSize('100%', '100%');
  }

  render() {
    return <CodeMirror
      onChange={this.handleCodeChange}
      value={this.state.code}
      ref={(editor) => this.editor = editor}
      options={{
        mode: 'clike',
        lineNumbers: true,
        tabSize: 2,
      }}/>
  }
}
