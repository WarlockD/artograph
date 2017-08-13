import React from 'react';
import ReactDOM from 'react-dom';

import mix from './fx/mix';
import SceneGraph from './lib/renderer/SceneGraph';
import Sampler2DNode from './lib/renderer/Sampler2DNode';
import ProgramNode from './lib/renderer/ProgramNode';
import TargetNode from './lib/renderer/TargetNode';

class Page extends React.Component {
  async componentDidMount() {
    const scene = new SceneGraph();
    const spice = new Sampler2DNode();
    const testImage = new Sampler2DNode();
    const mixer = new ProgramNode(mix);
    const target = new TargetNode(this.target);
    await spice.loadFromUrl('./assets/spice.jpg');
    await testImage.loadFromUrl('./assets/jelly-beans.png');
    scene.attachNode(spice);
    scene.attachNode(testImage);
    scene.attachNode(mixer);
    scene.attachNode(target);
    scene.connect(spice, 'texture', mixer, 'image1');
    scene.connect(testImage, 'texture', mixer, 'image2');
    scene.connect(mixer, 'result', target, 'uImage');
    scene.run(target);
  }

  render() {
    return (
      <div>
        <canvas ref={(target) => this.target = target} />
      </div>
    );
  }
}

require('./styles/index.scss');

ReactDOM.render(<Page />, document.getElementById('app'));
