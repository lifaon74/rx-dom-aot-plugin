import { readFile } from 'fs/promises';

export function readFileAsString(
  path: string,
): Promise<string> {
  return readFile(path, { encoding: 'utf8' });
}

