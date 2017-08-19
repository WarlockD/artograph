import React from 'react';
import ReactDOM from 'react-dom';

import mix from './fx/mix';
import SceneGraph from './lib/renderer/SceneGraph';
import Sampler2DNode from './lib/renderer/Sampler2DNode';
import ProgramNode from './lib/renderer/ProgramNode';
import ScreenNode from './lib/renderer/ScreenNode';

import GraphView from './components/GraphView';
// import NodeView from './components/NodeView';

const scene = new SceneGraph();
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
      <div
        style={{
          width: '100%',
          height: '100vh',
        }}>
        <GraphView graph={scene} />
        <canvas ref={(target) => this.target = target} />
      </div>
    );
  }
}

require('./styles/index.scss');

ReactDOM.render(<Page />, document.getElementById('app'));
