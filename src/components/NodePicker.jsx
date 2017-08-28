import React from 'react';
import { bound, classes, keyboardHelper } from '../lib/utils';
import nodes from '../lib/renderer/nodes';

export default class NodePicker extends React.Component {
  state = {
    results: nodes,
    selected: nodes[0],
    searchQuery: '',
  };

  @bound
  closePicker() {
    this.props.onClose();
  }

  searchNodes(query) {
    if (!query) return nodes;

    const terms = query.match(/(([^\x00-\x7F]|[&']|\w)+)/g);
    const re = new RegExp(terms.join('\\s+'), 'i');

    return nodes.filter((node) => {
      return re.test(node.nodeName);
    });
  }

  @bound
  changeQuery(event) {
    const query = event.target.value
    const results = this.searchNodes(query);

    this.setState({
      searchQuery: query,
      results: results,
      selected: results[0],
    });
  }

  pickNode(node) {
    this.props.onPick(node);
    this.closePicker();
  }

  renderResults(results) {
    return results.map((node, index) => {
      const itemClass = classes({
        selected: this.state.selected === node,
      });

      return <li
        className={itemClass}
        key={index}
        onClick={() => this.pickNode(node)}>
        {node.nodeName}
      </li>
    });
  }

  componentDidMount() {
    keyboardHelper(this.body, {
      'Enter': () => {
        this.pickNode(this.state.selected);
      },
      'ArrowUp': () => {
        const index = this.state.results.findIndex((node) => {
          return node === this.state.selected;
        });
        const newIndex = index !== 0
          ? index - 1
          : this.state.results.length - 1;
        this.setState({ selected: this.state.results[newIndex] });
      },
      'ArrowDown': () => {
        const index = this.state.results.findIndex((node) => {
          return node === this.state.selected;
        });
        const lastIndex = this.state.results.length -1;
        const newIndex = index !== lastIndex
          ? index + 1
          : 0;
        this.setState({ selected: this.state.results[newIndex] });
      },
    });
  }

  componentDidUpdate() {
    this.body
      .querySelector('.selected')
      .scrollIntoView(false);
  }

  render() {
    const pickerClass = classes('node-picker', {
      active: this.props.isOpened,
    });

    return <div
      ref={(body) => this.body = body}
      className={pickerClass}>
      <input
        className='input node-picker-search'
        ref={(input) => this.searchInput = input }
        onChange={this.changeQuery}
        onKeyUp={this.handleKeyboard}
        placeholder='Search node...'
        value={this.state.searchQuery}/>
      <ul className='node-picker-list'>
        {this.renderResults(this.state.results)}
      </ul>
    </div>
  }
}
