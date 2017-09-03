import React from 'react';
import { bound } from '../lib/utils';
import ShaderNode from '../lib/renderer/nodes/ShaderNode';
import NodeView from './NodeView';
import ScriptNodeEditor from './ScriptNodeEditor';

export default class ShaderNodeView extends NodeView {
  static modelNode = ShaderNode;

  renderEditor() {
    return <ScriptNodeEditor
      node={this.props.node}
      nodeView={this}/>
  }
}
