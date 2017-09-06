import React from 'react';
import ReactDOM from 'react-dom';

import { bound, keyboardHelper } from './lib/utils';

import SceneGraph from './lib/renderer/SerializableSceneGraph';
import SceneNode from './lib/renderer/SceneNode';
import NodeFactory from './lib/renderer/NodeFactory';

import GraphView from './components/GraphView';
import NodePicker from './components/NodePicker';

import { loadObject, saveObject } from './lib/bigObjectStore';

const ScreenNode = NodeFactory.createNode('ScreenNode');
const scene = new SceneGraph();
// benchmark(100);
scene.attachNode(ScreenNode);

function updateScreen() {
  scene.run(ScreenNode);
  requestAnimationFrame(updateScreen);
}

class Page extends React.Component {
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
      'F6': async () => {
        saveObject('quicksave', await scene.toJSON());
      },
      'F7': async () => {
        const json = await scene.toJSON();
        const string = JSON.stringify(json);
        const file = new Blob([ string ], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = 'scene.json';
        link.click();
        URL.revokeObjectURL(link.href);
      },
      'F9': async () => {
        await scene.fromJSON(await loadObject('quicksave'));
        this.forceUpdate();
      },
      'F10': async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const string = event.target.result;
            const json = JSON.parse(string);
            await scene.fromJSON(json);
            this.forceUpdate();
          };
          reader.readAsText(event.target.files[0]);
        };
        input.click();
      },
      'Alt+Enter': () => {
        ScreenNode.requestFullscreen();
      },
    });

    this.imageContainer.appendChild(ScreenNode.canvas);

    updateScreen();
  }

  @bound
  attachNode(Node) {
    scene.attachNode(new Node());
  }

  render() {
    return (
      <div
        className='l-artograph'
        tabIndex='0'
        onKeyDown={this.handleKeyDown}>
        <div
          className='result-image'
          ref={(container) => this.imageContainer = container}>
        </div>
        <GraphView graph={scene} />
        <div className='l-artograph-node-picker'>
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
      this.set('out', value);
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
      this.meta = {
        posX: Math.random() * 10000 - 5000,
        posY: Math.random() * 10000 - 5000,
      }
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
