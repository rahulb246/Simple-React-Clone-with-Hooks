let globalId = 0;
let globalParent;

// global state for all hooks for each component
const componentState = new Map();

export function useState(initialState) {
  const id = globalId;
  const parent = globalParent;
  globalId++;

  return (() => {
    const { cache } = componentState.get(parent);
    if (cache[id] == null) {
      cache[id] = {
        value:
          typeof initialState === "function" ? initialState() : initialState
      };
    }

    const setSate = (state) => {
      const { props, component } = componentState.get(parent);

      // useState can accept function or value
      if (typeof state === "function") {
        cache[id].value = state(cache[id].value);
      } else {
        cache[id].value = state;
      }

      render(component, props, parent);
    };
    return [cache[id].value, setSate];
  })();
}

export function useEffect(callback, dependencies) {
  const id = globalId;
  const parent = globalParent;
  globalId++;

  return (() => {
    const { cache } = componentState.get(parent);
    if (cache[id] == null) {
      cache[id] = { dependencies: undefined };
    }

    const dependenciesChanged =
      dependencies == null ||
      dependencies.some((dependency, i) => {
        return (
          cache[id].dependencies == null ||
          cache[id].dependencies[i] !== dependency
        );
      });

    if (dependenciesChanged) {
      if (cache[id].cleanup) cache[id].cleanup();
      cache[id].cleanup = callback();
      cache[id].dependencies = dependencies;
    }
  })();
}

export function useMemo(callback, dependencies) {
  const id = globalId;
  const parent = globalParent;
  globalId++;

  return (() => {
    const { cache } = componentState.get(parent);
    if (cache[id] == null) {
      cache[id] = { dependencies: undefined };
    }

    const dependenciesChanged =
      dependencies == null ||
      dependencies.some((dependency, i) => {
        return (
          cache[id].dependencies == null ||
          cache[id].dependencies[i] !== dependency
        );
      });

    if (dependenciesChanged) {
      cache[id].value = callback();
      cache[id].dependencies = dependencies;
    }

    return cache[id].value;
  })();
}

export function render(component, props, parent) {
  // hooks use the state of the component from cache
  const state = componentState.get(parent) || { cache: [] };
  componentState.set(parent, { ...state, component, props });
  globalParent = parent;

  const output = component(props);
  // reset to 0 after rendering in completed
  globalId = 0;
  parent.textContent = output;
}
