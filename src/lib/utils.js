export function bound(target, key, descriptor) {
  const cacheKey = Symbol();

  return {
    configurable: false,
    get: function() {
      if (!this[cacheKey]) {
        this[cacheKey] = descriptor.value.bind(this);
      }

      return this[cacheKey];
    },
  };
}

export function toCssColor(color) {
  return `rgb(${color[0] * 255 | 0}, ${color[1] * 255 | 0}, ${color[2] * 255 | 0})`;
}

export function classes(...classes) {
  return classes.reduce((acc, entry) => {
    let result = acc;

    if (typeof entry === 'string') {
      result = acc + ' ' + entry;
    } else if (entry instanceof Object) {
      for (let key in entry) {
        if (entry[key]) {
          result = result + ' ' + key;
        }
      }
    }

    return result;
  }, '');
}

function copyPositioning(target, event) {
  target.pageX = event.pageX;
  target.pageY = event.pageY;
  target.clientX = event.clientX;
  target.clientY = event.clientY;
}

function mapPointerEvent(event) {
  const result = {};
  result.isTouchEvent = !!event.touches;
  if (result.isTouchEvent) {
    copyPositioning(result, event.touches[0]);
  } else {
    copyPositioning(result, event);
  }
  result.target = event.target;
  result.original = event;
  return result;
}

export function dragHelper(options, event) {
  const onStart = typeof options.onStart === 'function' && options.onStart;
  const onMove = typeof options.onMove === 'function' && options.onMove;
  const onEnd = typeof options.onEnd === 'function' && options.onEnd;

  function onDragStart(event) {
    if (event.currentTarget !== event.target) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.button !== 0) return;

    const mappedEvent = mapPointerEvent(event);
    const init = onStart && onStart(mappedEvent);
    const eventNames = mappedEvent.isTouchEvent
      ? ['touchmove', 'touchend']
      : ['mousemove', 'mouseup'];

    if (!mappedEvent.isTouchEvent) event.preventDefault();

    if (options.moveOnStart) {
      onDragMove(event);
    }

    function onDragMove(event) {
      event.preventDefault();

      if (onMove) {
        const mappedEvent = mapPointerEvent(event);
        onMove(init, mappedEvent);
      }
    }

    function onDragEnd(event) {
      if (onEnd) {
        onEnd(event);
      }

      document.removeEventListener(eventNames[0], onDragMove, {
        capture: true,
        passive: false,
      });
      document.removeEventListener(eventNames[1], onDragEnd);
    }

    document.addEventListener(eventNames[0], onDragMove, {
      capture: true,
      passive: false,
    });
    document.addEventListener(eventNames[1], onDragEnd);
  }

  return !!event
    ? onDragStart(event)
    : onDragStart;
}

export function assert(condition, message) {
  if (condition) throw new Error(message);
}

export function keyboardHelper(element, shortcuts) {
  assert(!element, 'Target element is not defined');
  assert(!shortcuts, 'Shortcuts are not defined');

  element.addEventListener('keydown', handleKeyDown);

  function handleKeyDown(event) {
    for (let shortcut in shortcuts) {
      const modifiers = shortcut.split('+');
      const key = modifiers.pop();

      if (modifiers.length > 0) {
        const modifiersMatch = modifiers.every((mod) => {
          return event.getModifierState(mod);
        });
        if (!modifiersMatch) continue;
      }

      if (key === event.key) {
        event.preventDefault();
        event.stopPropagation();
        shortcuts[shortcut](event);
        return;
      }
    }
  }

  function removeListener() {
    element.removeEventListener('keydown', handleKeyDown);
  }

  return removeListener;
}
