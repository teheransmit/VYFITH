if (typeof window !== 'undefined') {
  try {
    var desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (desc && !desc.set) {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: window.fetch
      });
    }
  } catch (e) {
    console.error('Fetch patch error:', e);
  }
}
