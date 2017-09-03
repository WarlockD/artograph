import React from 'react';
import { bound } from '../lib/utils';
import ScriptNode from '../lib/renderer/nodes/ScriptNode';
import NodeView from './NodeView';
import ScriptNodeEditor from './ScriptNodeEditor';

export default class ScriptNodeView extends NodeView {
  static modelNode = ScriptNode;

  constructor(props) {
    super(props);
  }

  renderEditor() {
    return <ScriptNodeEditor
      node={this.props.node}
      nodeView={this}/>
  }
}
