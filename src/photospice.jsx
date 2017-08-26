import React from 'react';
import ReactDOM from 'react-dom';

import { bound, keyboardHelper } from './lib/utils';

import ScreenNode from './lib/renderer/nodes/ScreenNode';
import SceneGraph from './lib/renderer/SceneGraph';
import SceneNode from './lib/renderer/SceneNode';

import GraphView from './components/GraphView';
import NodePicker from './components/NodePicker';

const scene = new SceneGraph();
// benchmark(100);

class Page extends React.Component {
  screen = null;

  state = {
    isPickerOpened: false,
  };

  componentDidMount() {
    keyboardHelper(document, {
      'Escape': () => {
        this.setState({
          isPickerOpened: false,
        });
      },
      'F1': () => {
        this.setState({
          isPickerOpened: true,
        });
      },
    });

    scene.on('node.attached', (node) => {
      if (node instanceof ScreenNode && !this.screen) {
        this.screen = node;
        node.setTarget(this.target);
      }
    });

    this.updateScreen();
  }

  updateScreen = () => {
    if (this.screen) {
      scene.run(this.screen);
    }
    requestAnimationFrame(this.updateScreen);
  }

  @bound
  attachNode(Node) {
    scene.attachNode(new Node());
  }

  render() {
    return (
      <div className='l-photospice'>
        <div className='result-image'>
          <canvas ref={(target) => this.target = target} />
        </div>
        <GraphView graph={scene} />
        <div className='l-photospice-node-picker'>
          <NodePicker
            isOpened={this.state.isPickerOpened}
            onClose={() => this.setState({ isPickerOpened: false })}
            onPick={this.attachNode} />
        </div>
      </div>
    );
  }
}

function benchmark(count = 100) {
  class ValueNode extends SceneNode {
    constructor(value) {
      super({
        outputs: {
          out: { type: 'float', name: 'Value' },
        },
      });
      this.set('value', value);
    }
  }

  class NegateNode extends SceneNode {
    constructor() {
      super({
        inputs: {
          in: { type: 'float', name: 'Input' },
        },
        outputs: {
          out: { type: 'float', name: 'Negated' },
        },
      });
    }

    update(inputs) {
      this.set('out', -inputs.in);
    }
  }

  let prev = new ValueNode(10);
  scene.attachNode(prev);

  for (let i = 0; i < count; i += 1) {
    const negate = new NegateNode();
    scene.attachNode(negate);
    scene.connect(prev, 'out', negate, 'in');
    prev = negate;
  }
}

require('./styles/index.scss');

ReactDOM.render(<Page />, document.getElementById('app'));
