import React from 'react';
import debounce from 'lodash/debounce';
import { bound } from '../lib/utils';
import NodeEditor from './NodeEditor';
import CodeMirror from './CodeMirror';

export default class ScriptNodeEditor extends NodeEditor {
  constructor(props) {
    super(props);

    this.state = {
      code: props.node.code,
    };

    this.compile = debounce((node, code) => {
      node.compile(code);
    }, 1000);
  }

  @bound
  handleCodeChange(code) {
    this.compile(this.props.node, code);
    this.setState({ code });
  }

  componentDidMount() {
    this.editor.getCodeMirror().setSize('100%', '100%');
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.node !== nextProps.node) {
      this.setState({ code: nextProps.node.code });
    }
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
