[![npm (scoped)](https://img.shields.io/npm/v/@lifaon/rx-dom-aot-plugin.svg)](https://www.npmjs.com/package/@lifaon/rx-dom-aot-plugin)
![npm](https://img.shields.io/npm/dm/@lifaon/rx-dom-aot-plugin.svg)
![NPM](https://img.shields.io/npm/l/@lifaon/rx-dom-aot-plugin.svg)
![npm type definitions](https://img.shields.io/npm/types/@lifaon/rx-dom-aot-plugin.svg)

## ⚙️ rx-dom-aot-plugin ##

This plugin for rollup is intended to optimize the build of [rx-dom](https://github.com/lifaon74/rx-dom) components.
It removes the JIT compiler, and converts every *reactive-html* into pure javascript.

This result in very small bundle, optimized code and faster performances.

## 📦 Installation

```bash
yarn add @lifaon/rx-dom-aot-plugin
# or
npm install @lifaon/rx-dom-aot-plugin --save
```

### Example of a vite.config.js file


```ts
import { aotPlugin } from '@lifaon/rx-dom-aot-plugin';

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  build: {
    target: 'es2015',
    terserOptions: {
      toplevel: true,
      ecma: 2020,
      compress: {
        pure_getters: true,
        passes: 5,
        ecma: 2020,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_undefined: true,
      },
      mangle: {
        eval: true,
      }
    },
  },
  plugins: [
    aotPlugin(),
  ],
  server: {
    https: false,
  }
};

export default config;

```


### Details

Currently, this plugin can only optimize the functions `compileReactiveHTMLAsComponentTemplate` and `loadReactiveHTMLAsComponentTemplate`
with some constraints:


#### loadReactiveHTMLAsComponentTemplate

```ts
await loadReactiveHTMLAsComponentTemplate({
  url: new URL(/* string => relative path to your reactive html */, import.meta.url)/* .href (optional) */,
  /* ...other options */
});
```

Valid examples:

```ts
await loadReactiveHTMLAsComponentTemplate({
  url: new URL('./hello-world-component.html', import.meta.url),
  customElements: [ // optional
    // put your custom elements here
  ],
  modifiers: [ // optional
    // put your modifiers here
  ],
});
```

```ts
await loadReactiveHTMLAsComponentTemplate({ url: new URL('./hello-world-component.html', import.meta.url) });
```

Invalid examples:

```ts
const url = new URL('./hello-world-component.html', import.meta.url);
await loadReactiveHTMLAsComponentTemplate({ url });
```

```ts
import { loadReactiveHTMLAsComponentTemplate as reactiveHTML } from '@lifaon/rx-dom';
await reactiveHTML({ url: new URL('./hello-world-component.html', import.meta.url) });
```

#### compileReactiveHTMLAsComponentTemplate

```ts
compileReactiveHTMLAsComponentTemplate({
  html: /* string, template string (without interpolated content) or variable (the variabe must be a default import) */,
  /* ...other options */
});
```

Valid examples:

```ts
compileReactiveHTMLAsComponentTemplate({ html: 'abc' });
```

```ts
compileReactiveHTMLAsComponentTemplate({
  html: `
    <div class="my-div">
      abc
    </div>
  `
});
```

```ts
import html from './hello-world-component.html?raw'; // vite js
compileReactiveHTMLAsComponentTemplate({ html });
```

Invalid examples:

```ts
const html = 'abc';
compileReactiveHTMLAsComponentTemplate({ html });
```

```ts
const content = 'abc';
compileReactiveHTMLAsComponentTemplate({
  html: `
    <div class="my-div">
      ${content}
    </div>
  `
});
```

```ts
import html from './hello-world-component.ts'; // './hello-world-component.ts' MUST contain only reactive-html
compileReactiveHTMLAsComponentTemplate({ html });
```

```ts
import { compileReactiveHTMLAsComponentTemplate as reactiveHTML } from '@lifaon/rx-dom';
reactiveHTML({ html: 'abc' });
```
