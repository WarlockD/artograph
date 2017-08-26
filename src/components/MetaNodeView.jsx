import React from 'react';

import NodeView from './NodeView';
import ScriptNodeView from './ScriptNodeView';
import OscNodeView from './OscNodeView';
import Sampler2DNodeView from './Sampler2DNodeView';

const nodes = [
  ScriptNodeView,
  OscNodeView,
  Sampler2DNodeView,
];

export default class MetaNodeView extends React.Component {
  render() {
    const View = nodes.find((View) => {
      return this.props.node instanceof View.modelNode;
    }) || NodeView;

    return <View {...this.props} />
  }
}
