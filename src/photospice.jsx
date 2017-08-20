import React from 'react';
import ReactDOM from 'react-dom';

import mix from './fx/mix';
import SceneGraph from './lib/renderer/SceneGraph';
import Sampler2DNode from './lib/renderer/Sampler2DNode';
import ProgramNode from './lib/renderer/ProgramNode';
import ScreenNode from './lib/renderer/ScreenNode';
import SceneNode from './lib/renderer/SceneNode';

import ImageContainer from './components/ImageContainer';
import GraphView from './components/GraphView';

const scene = new SceneGraph();
// benchmark(100);
const spice = new Sampler2DNode();
const testImage = new Sampler2DNode();
const mixer = new ProgramNode(mix);
const screen = new ScreenNode();
scene.attachNode(spice);
scene.attachNode(testImage);
scene.attachNode(mixer);
scene.attachNode(screen);
scene.connect(spice, 'texture', mixer, 'image1');
scene.connect(testImage, 'texture', mixer, 'image2');
scene.connect(mixer, 'result', screen, 'uImage');

class Page extends React.Component {
  async componentDidMount() {
    screen.setTarget(this.target);
    await spice.loadFromUrl('./assets/spice.jpg');
    await testImage.loadFromUrl('./assets/jelly-beans.png');
    scene.run(screen);
  }

  render() {
    return (
      <div className='l-photospice'>
        {/* <ImageContainer toggleCompactMode={this.toggleCompactMode}>
        </ImageContainer> */}
        <canvas style={{display: 'none'}} ref={(target) => this.target = target} />
        <GraphView graph={scene} />
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
      this.value = value;
    }

    run() {
      return { out: this.value };
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

    run(inputs) {
      return -inputs.in;
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
