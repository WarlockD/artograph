import React from 'react';


import GenericNodeView from './GenericNodeView';
import ScriptNodeView from './ScriptNodeView';

const nodes = [
  ScriptNodeView,
];

export default class NodeView extends React.Component {
  render() {
    const View = nodes.find((View) => {
      return this.props.node instanceof View.modelNode;
    }) || GenericNodeView;

    return <View
      node={this.props.node}
      pins={this.props.pins}
      onNodeUpdate={this.props.onNodeUpdate}/>
  }
}
