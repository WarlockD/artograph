import React from 'react';
import { bound } from '../lib/utils';
import ProgramNode from '../lib/renderer/nodes/ProgramNode';
import NodeView from './NodeView';
import ScriptNodeEditor from './ScriptNodeEditor';

export default class ProgramNodeView extends NodeView {
  static modelNode = ProgramNode;

  renderEditor() {
    return <ScriptNodeEditor
      node={this.props.node}
      nodeView={this}/>
  }
}
