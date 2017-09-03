import React from 'react';
import { bound } from '../lib/utils';
import Sampler2DNode from '../lib/renderer/nodes/Sampler2DNode';
import NodeView from './NodeView';

export default class Sampler2DNodeView extends NodeView {
  static modelNode = Sampler2DNode;

  constructor(props) {
    super(props);

    this.state.previewUrl = props.node.image
      ? props.node.image.src
      : '/assets/placeholder.svg';
  }

  @bound
  uploadImage(event) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target.result;
      const node = this.props.node;
      await node.loadFromUrl(url);
      this.setState({ previewUrl: url });
    };
    reader.readAsDataURL(event.target.files[0]);
  }

  renderContents() {
    const previewStyle = {
      backgroundColor: 'black',
      backgroundImage: `url(${this.state.previewUrl})`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      width: 128,
      height: 128,
    };

    return <div>
      <div
        style={previewStyle}
        title='Click to upload an image'
        onClick={() => this.input.click()}/>
      <input
        type='file'
        accept='image/*'
        style={{ display: 'none' }}
        ref={(input) => this.input = input}
        onChange={this.uploadImage}/>
    </div>;
  }
}
