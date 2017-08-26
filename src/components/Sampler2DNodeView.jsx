import React from 'react';
import { bound } from '../lib/utils';
import Sampler2DNode from '../lib/renderer/nodes/Sampler2DNode';
import NodeView from './NodeView';

export default class Sampler2DNodeView extends NodeView {
  static modelNode = Sampler2DNode;

  constructor(props) {
    super(props);

    this.state = {};
  }

  @bound
  uploadImage(event) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target.result;
      const node = this.props.node;
      node.loadFromUrl(url);
    };
    reader.readAsDataURL(event.target.files[0]);
  }

  renderContents() {
    return <div>
      <input
        type='file'
        style={{ display: 'none' }}
        ref={(input) => this.input = input}
        onChange={this.uploadImage}/>
      <button
        className='button'
        onClick={() => this.input.click()}>
        Upload
      </button>
    </div>;
  }
}
