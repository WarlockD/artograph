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
      },
      outputs: {
        output: {
          type: 'sound',
          name: 'Output',
        },
      }
    });

    this.inputsCount = 1;
    this.audioNode = audio.createGain();
    this.audioNode.gain.value = 1.0;
  }

  addInput() {
    this.inputsCount += 1;
    this.inputs['in' + this.inputsCount] = {
      name: 'In ' + this.inputsCount,
      type: 'sound',
    };

    this.updateSchema({ inputs: this.inputs });
  }

  removeUnusedInputs() {
    let lastUsedInput = 0;

    for (let pinName in this.inputs) {
      const input = this.inputs[pinName];
      const inputNumber = parseInt(pinName.slice(2), 10);

      if (input.connections) {
        lastUsedInput = lastUsedInput < inputNumber
          ? inputNumber
          : lastUsedInput;
      }
    }

    for (let pinName in this.inputs) {
      const inputNumber = parseInt(pinName.slice(2), 10);

      if (inputNumber > lastUsedInput + 1) {
        delete this.inputs[pinName];
        this.inputsCount -= 1;
      }
    }

    this.updateSchema({ inputs: this.inputs });
  }

  onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin) {
    super.onBeforeConnect(sourceNode, sourcePin, targetNode, targetPin);

    if (sourceNode === this) {
      this.audioNode.connect(targetNode.audioNode);
    } else if (targetPin === 'in' + this.inputsCount) {
      this.addInput();
    }
  }

  onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin) {
    super.onBeforeDisconnect(sourceNode, sourcePin, targetNode, targetPin);

    if (sourceNode === this) {
      this.audioNode.disconnect(targetNode.audioNode);
    } else if (targetPin.slice(0, 2) === 'in') {
      this.removeUnusedInputs();
    }
  }

  update(inputs) {
    this.set('output', this.audioNode);
  }
}
