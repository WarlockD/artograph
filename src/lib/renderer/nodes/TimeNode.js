import SceneNode from '../SceneNode';
import { audio } from '../ScreenNode';

export default class ScriptNode extends SceneNode {
  static nodeName = 'Time';

  constructor() {
    super({
      name: 'Time',
      outputs: {
        seconds: {
          type: 'float',
          name: 'Seconds',
        },
      }
    });
  }

  update() {
    this.set('seconds', audio.currentTime);
  }
}
