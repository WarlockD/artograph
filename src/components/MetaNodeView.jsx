import React from 'react';

import NodeView from './NodeView';
import ScriptNodeView from './ScriptNodeView';
import OscNodeView from './OscNodeView';

const nodes = [
  ScriptNodeView,
  OscNodeView,
];

export default class MetaNodeView extends React.Component {
  render() {
    const View = nodes.find((View) => {
      return this.props.node instanceof View.modelNode;
    }) || NodeView;

    return <View {...this.props} />
  }
}
