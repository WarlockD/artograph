import React from 'react';
import { load } from 'js-yaml';
import { bound } from '../lib/utils';
import ProgramNode from '../lib/renderer/nodes/ProgramNode';
import NodeView from './NodeView';

export default class ProgramNodeView extends NodeView {
  static modelNode = ProgramNode;

  @bound
  uploadProgram(event) {
    const node = this.props.node;
    const reader = new FileReader();

    reader.onload = async (event) => {
      const source = event.target.result;

      node.loadDefinition(load(source));

      this.setState({
        inputs: node.inputs,
        outputs: node.outputs,
      });
    };

    reader.readAsText(event.target.files[0]);
  }

  renderContents() {
    return <div>
      <input
        type='file'
        accept='.yml,.yaml'
        style={{ display: 'none' }}
        ref={(input) => this.fileInput = input}
        onChange={this.uploadProgram}/>
      <button
        className='button'
        onClick={() => this.fileInput.click()}>
        Upload
      </button>
    </div>;
  }
}
