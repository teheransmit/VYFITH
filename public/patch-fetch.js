if (typeof window !== 'undefined') {
  try {
    var origFetch = window.fetch;
    try {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        enumerable: true,
        get: function () {
          return origFetch;
        },
        set: function (newFetch) {
          origFetch = newFetch;
        },
      });
    } catch (e1) {
      try {
        var proto = Object.getPrototypeOf(window);
        if (proto) {
          Object.defineProperty(proto, 'fetch', {
            configurable: true,
            enumerable: true,
            get: function () {
              return origFetch;
            },
            set: function (newFetch) {
              origFetch = newFetch;
            },
          });
        }
      } catch (e2) {}
    }
  } catch (e) {
    console.error('Fetch patch error:', e);
  }
}
