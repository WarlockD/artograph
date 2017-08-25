import React from 'react';
import ReactDOM from 'react-dom';

import mixFx from './fx/mix';
import mblurFx from './fx/motionBlur';
import SceneGraph from './lib/renderer/SceneGraph';
import Sampler2DNode from './lib/renderer/Sampler2DNode';
import ProgramNode from './lib/renderer/ProgramNode';
import ScreenNode from './lib/renderer/ScreenNode';
import SceneNode from './lib/renderer/SceneNode';
import SinOscNode from './lib/renderer/SinOscNode';
import ScriptNode from './lib/renderer/ScriptNode';

import ImageContainer from './components/ImageContainer';
import GraphView from './components/GraphView';

const scene = new SceneGraph();
// benchmark(100);

class Page extends React.Component {
  async componentDidMount() {
    screen.setTarget(this.target);
    this.updateScreen();
  }

  updateScreen = () => {
    scene.run(screen);
    requestAnimationFrame(this.updateScreen);
  }

  render() {
    return (
      <div className='l-photospice'>
        <div className='result-image'>
          <canvas ref={(target) => this.target = target} />
        </div>
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
