import React from 'react';

export default class NodeEditor extends React.Component {
  componentDidUpdate() {
    this.props.nodeView.forceUpdate();
  }

  render() {
    return <span>This node doesn't have any special properties to edit</span>
  }
}
