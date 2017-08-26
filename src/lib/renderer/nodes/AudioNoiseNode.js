import SceneNode from '../SceneNode';
import { audio } from '../screen';

export default class AudioNoiseNode extends SceneNode {
  static nodeName = 'Noise';
  constructor() {
    super({
      name: AudioNoiseNode.nodeName,
      inputs: {
        gain: {
          name: 'Gain',
          type: 'float',
          value: 0.5,
        },
      },
      outputs: {
        output: {
          type: 'sound',
          name: 'Output',
        },
      }
    });

    const bufferSize = 2 * audio.sampleRate;
    const noiseBuffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.whiteNoise = audio.createBufferSource();
    this.whiteNoise.buffer = noiseBuffer;
    this.whiteNoise.loop = true;
    this.whiteNoise.start(0);

    this.audioNode = audio.createGain();
    this.whiteNoise.connect(this.audioNode);
  }

  onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin) {
    if (sourceNode === this) {
      this.audioNode.connect(targetNode.audioNode);
    }
  }

  onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin) {
    if (sourceNode === this) {
      this.audioNode.disconnect(targetNode.audioNode);
    }
  }

  update(inputs) {
    try {
      this.audioNode.gain.value = inputs.gain;
    } catch (e) {
      console.error(e);
    }
    this.set('output', this.audioNode);
  }
}
