import SceneNode from '../SceneNode';
import { audio } from '../screen';

export default class ScriptNode extends SceneNode {
  static nodeName = 'Time';

  constructor() {
    super({
      name: 'Time',
      outputs: {
        output: {
          type: 'float',
          name: 'Seconds',
        },
      }
    });
  }

  run() {
    return { output: audio.currentTime };
  }
}
