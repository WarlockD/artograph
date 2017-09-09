import React from 'react';
import codemirror from 'codemirror';

require('codemirror/lib/codemirror.css');
require('codemirror/mode/clike/clike');

export default class CodeMirror extends React.Component {
  componentDidMount() {
    this.editor = codemirror(this.self);
    this.editor.setValue(this.props.value);
    this.editor.on('change', () => {
      this.props.onChange(this.editor.getValue())
    });
  }

  getCodeMirror() {
    return this.editor;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.options) {
      Object
        .keys(nextProps.options)
        .forEach(key => this.editor.setOption(key, nextProps.options[key]));
    }

    if (this.editor.getValue() !== nextProps.value) {
      this.editor.setValue(nextProps.value || '');
    }
  }

  render() {
    return <div ref={(self) => this.self = self}/>
  }
}
