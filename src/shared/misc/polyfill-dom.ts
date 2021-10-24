let POLYFILL_DOM_PROMISE: Promise<void>;

export function polyfillDOM(): Promise<void> {
  if (POLYFILL_DOM_PROMISE === void 0) {
    // @ts-ignore
    POLYFILL_DOM_PROMISE = import('jsdom')
      .then((result: any) => {
        const JSDOM: any = result.default.JSDOM;
        const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
        ['DOMParser', 'Node', 'HTMLElement', 'Element'].forEach((key: string) => {
          if (!(key in globalThis)) {
            // console.log('setting', key);
            globalThis[key] = dom.window[key];
          }
        });
      });
  }
  return POLYFILL_DOM_PROMISE;
}
