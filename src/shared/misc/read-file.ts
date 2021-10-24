import { promises as $fs } from 'fs';

export function readFile(
  path: string,
): Promise<string> {
  return $fs.readFile(path, { encoding: 'utf8' });
  // return import('fs')
  //   .then(({ promises }) => {
  //     return promises.readFile(path, { encoding: 'utf8' });
  //   });
  // if ('require' in globalThis) {
  //   return globalThis.require('fs').promises.readFile(path, { encoding: 'utf8' });
  // } else if ('fetch' in globalThis) {
  //   return fetch(path)
  //     .then((response: Response) => {
  //       if (response.ok) {
  //         return response.text();
  //       } else {
  //         throw createNetworkErrorFromResponse(response);
  //       }
  //     });
  // } else {
  //   return import('fs')
  //     .then(() => {
  //
  //     });
  //   return Promise.reject(new Error(`no function to read a file`));
  // }
}

