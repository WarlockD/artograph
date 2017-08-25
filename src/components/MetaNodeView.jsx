import React from 'react';

import NodeView from './NodeView';
import ScriptNodeView from './ScriptNodeView';

const nodes = [
  ScriptNodeView,
];

export default class MetaNodeView extends React.Component {
  render() {
    const View = nodes.find((View) => {
      return this.props.node instanceof View.modelNode;
    }) || NodeView;

    return <View {...this.props} />
  }
}
