if (!window.AudioContext) {
  throw new Error('WebAudio is not supported');
}

export const audio = new window.AudioContext();
