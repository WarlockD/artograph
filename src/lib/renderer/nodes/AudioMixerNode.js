import SceneNode from '../SceneNode';
import { audio } from '../ScreenNode';

export default class AudioMixerNode extends SceneNode {
  static nodeName = 'Mixer';
  constructor() {
    super({
      name: AudioMixerNode.nodeName,
      inputs: {
        in1: {
          name: 'In 1',
          type: 'sound',
        },
        in2: {
          name: 'In 2',
          type: 'sound',
        },
        in3: {
          name: 'In 3',
          type: 'sound',
        },
        in4: {
          name: 'In 4',
          type: 'sound',
        },
      },
      outputs: {
        output: {
          type: 'sound',
          name: 'Output',
        },
      }
    });

    this.audioNode = audio.createGain();
    this.audioNode.gain.value = 1.0;
  }

  onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin) {
    super.onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin);
    if (sourceNode === this) {
      this.audioNode.connect(targetNode.audioNode);
    }
  }

  onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin) {
    super.onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin);
    if (sourceNode === this) {
      this.audioNode.disconnect(targetNode.audioNode);
    }
  }

  update(inputs) {
    this.set('output', this.audioNode);
  }
}
