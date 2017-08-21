import React from 'react';
import ReactDOM from 'react-dom';

import mixFx from './fx/mix';
import mblurFx from './fx/motionBlur';
import SceneGraph from './lib/renderer/SceneGraph';
import Sampler2DNode from './lib/renderer/Sampler2DNode';
import ProgramNode from './lib/renderer/ProgramNode';
import ScreenNode from './lib/renderer/ScreenNode';
import SceneNode from './lib/renderer/SceneNode';

import ImageContainer from './components/ImageContainer';
import GraphView from './components/GraphView';

class TimeNode extends SceneNode {
  constructor() {
    super({
      name: 'Time',
      outputs: {
        milliseconds: {
          name: 'msec',
          type: 'float',
        },
        seconds: {
          name: 'sec',
          type: 'float',
        },
      },
    });
  }

  run() {
    const ms = Date.now();
    return {
      milliseconds: ms,
      seconds: ms / 1000.0,
    };
  }
}

class SinNode extends SceneNode {
  constructor() {
    super({
      name: 'Sin',
      inputs: {
        in: {
          name: 'x',
          type: 'float',
        }
      },
      outputs: {
        sin: {
          name: 'sin(x)',
          type: 'float',
        },
        cos: {
          name: 'cos(x)',
          type: 'float',
        },
        tan: {
          name: 'tan(x)',
          type: 'float',
        },
        ctg: {
          name: 'ctg(x)',
          type: 'float',
        },
      },
    });
  }

  run(inputs) {
    const sin = Math.sin(inputs.in);
    const cos = Math.cos(inputs.in);
    return {
      sin: sin,
      cos: cos,
      tan: sin / cos,
      ctg: cos / sin,
    };
  }
}

const scene = new SceneGraph();
// benchmark(100);
const spice = new Sampler2DNode();
const testImage = new Sampler2DNode();
const mix = new ProgramNode(mixFx);
const screen = new ScreenNode();
const timer = new TimeNode();
const sinus = new SinNode();

for (let i = 0; i < 20; i += 1) {
  scene.attachNode(new ProgramNode(mblurFx));
}

scene.attachNode(spice);
scene.attachNode(testImage);
scene.attachNode(mix);
scene.attachNode(screen);
scene.attachNode(timer);
scene.attachNode(sinus);


class Page extends React.Component {
  async componentDidMount() {
    screen.setTarget(this.target);
    await spice.loadFromUrl('./assets/spice.jpg');
    await testImage.loadFromUrl('./assets/jelly-beans.png');
    this.updateScreen();
  }

  updateScreen = () => {
    // console.time('screen update');
    scene.run(screen);
    // console.timeEnd('screen update');
    requestAnimationFrame(this.updateScreen);
  }

  render() {
    return (
      <div className='l-photospice'>
        <ImageContainer toggleCompactMode={this.toggleCompactMode}>
          <canvas ref={(target) => this.target = target} />
        </ImageContainer>
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
