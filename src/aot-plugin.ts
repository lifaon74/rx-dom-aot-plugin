import { Path } from '@lifaon/path';
import { ILines, linesToString, transpileReactiveHTMLAsRawComponentTemplateModuleToReactiveDOMJSLines } from '@lifaon/rx-dom';
import { Node } from 'acorn';
import { full } from 'acorn-walk';
import { generate } from 'astring';
import { createHash } from 'crypto';
import {
  CallExpression,
  Expression,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  MemberExpression,
  ObjectExpression,
  Pattern,
  Property,
  Super,
} from 'estree';
import { access, mkdir, writeFile } from 'fs/promises';
import { createTemplateUUID } from './shared/misc/create-template-uuid';
import { polyfillDOM } from './shared/misc/polyfill-dom';
import { readFileAsString } from './shared/misc/read-file-as-string';
import { minifyHTML } from './shared/optimize/minify-html';
import {
  ExpressionOrSpreadElement,
  fixPropertyDefinition,
  isCallExpression,
  isIdentifier,
  isImportDeclaration,
  isImportDefaultSpecifier,
  isImportSpecifier,
  isLiteral,
  isMemberExpression,
  isMetaProperty,
  isNewExpression,
  isObjectExpression,
  isProgram,
  isProperty,
  isTemplateElement,
  isTemplateLiteral,
  PropertyOrSpreadElement,
} from './shared/parse/estree';
import { parseEcmaScript } from './shared/parse/parse-ecsmascript';

/*----------------*/

const ROOT_PATH = Path.process();
// os.tmpdir()
const CACHE_PATH = ROOT_PATH.concat('.cache');

async function writeComponentTemplateModule(
  html: string,
  templatePath: string,
): Promise<Path> {
  const id: string = createHash('sha256').update(html).digest('hex');
  const name: string = `${id}.mjs`;
  const path: Path = CACHE_PATH.concat(name);

  try {
    await access(path.toString());
  } catch {
    const minifiedHTML: string = minifyHTML(html);

    const comments: ILines = [
      `/**`,
      ` * Component template generated from: ${templatePath}`,
      ` */`,
    ];

    const reactiveHTMLLines: ILines = transpileReactiveHTMLAsRawComponentTemplateModuleToReactiveDOMJSLines(minifiedHTML, comments);

    const moduleContent: string = linesToString(reactiveHTMLLines);

    await mkdir(path.dirnameOrThrow().toString(), {
      recursive: true,
    });

    await writeFile(path.toString(), moduleContent);
  }

  return path;
}

/*----------------*/

interface IImportSpecifier {
  imported: string;
  local: string;
}

function createImportDeclaration(
  path: string,
  specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier> = [],
): ImportDeclaration {
  return {
    type: 'ImportDeclaration',
    specifiers,
    source: {
      type: 'Literal',
      value: path,
      raw: JSON.stringify(path),
    },
  };
}

// function appendSpecifiersToImportDeclaration(
//   node: ImportDeclaration,
//   specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>,
// ): ImportDeclaration {
//   node.specifiers.push(...specifiers);
//   return node;
// }

function appendSimpleSpecifierToImportDeclaration(
  node: ImportDeclaration,
  importSpecifier: IImportSpecifier,
): ImportDeclaration {
  const alreadyHasSpecifier: boolean = node.specifiers.some((specifier: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier) => {
    if (isImportSpecifier(specifier)) {
      return (specifier.imported.name === importSpecifier.imported)
        && (specifier.local.name === importSpecifier.local);
    } else {
      throw new Error(`Unsupported specifier`);
    }
  });
  if (!alreadyHasSpecifier) {
    node.specifiers.push(createImportSpecifier(importSpecifier));
  }
  return node;
}

function createImportSpecifier(
  {
    imported,
    local,
  }: IImportSpecifier,
): ImportSpecifier {
  return {
    type: 'ImportSpecifier',
    imported: {
      type: 'Identifier',
      name: imported,
    },
    local: {
      type: 'Identifier',
      name: local,
    },
  };
}

function createImportDefaultSpecifier(
  local: string,
): ImportDefaultSpecifier {
  return {
    type: 'ImportDefaultSpecifier',
    local: {
      type: 'Identifier',
      name: local,
    },
  };
}

function addImportToProgram(
  ast: Node,
  path: string,
  importSpecifier: IImportSpecifier,
): void {
  let found: boolean = false;
  full(ast, (node: Node) => {
    if (
      isImportDeclaration(node)
      && (node.source.value === path)
    ) {
      found = true;
      appendSimpleSpecifierToImportDeclaration(node, importSpecifier);
    }
  });

  if (!found) {
    if (isProgram(ast)) {
      ast.body = [
        createImportDeclaration(
          path,
          [createImportSpecifier(importSpecifier)],
        ),
        ...ast.body,
      ];
    } else {
      throw new Error(`Expected Program`);
    }
  }
}

function addDefaultImportToProgram(
  ast: Node,
  path: string,
  name: string,
): void {
  if (isProgram(ast)) {
    ast.body = [
      createImportDeclaration(
        path,
        [createImportDefaultSpecifier(name)],
      ),
      ...ast.body,
    ];
  } else {
    throw new Error(`Expected Program`);
  }
}

/*----------------*/

type StringOrURL = string | URL;

function isImportMetaURLNode(
  node: any,
): node is MemberExpression {
  return isMemberExpression(node)
    && isMetaProperty(node.object)
    && isIdentifier(node.object.meta)
    && (node.object.meta.name === 'import')
    && isIdentifier(node.object.property)
    && (node.object.property.name === 'meta')
    && isIdentifier(node.property)
    && (node.property.name === 'url')
    ;
}

function convertURLNodeToURL(
  node: Expression | Pattern | Super,
  path: string,
): URL | null {
  if (
    isMemberExpression(node)
    && isIdentifier(node.property)
    && (node.property.name === 'href')
  ) {
    return convertURLNodeToURL(node.object, path);
  } else if (
    isNewExpression(node)
    && isIdentifier(node.callee)
    && (node.callee.name === 'URL')
    && (node.arguments.length === 2)
    && isLiteral(node.arguments[0])
    && (typeof node.arguments[0].value === 'string')
    && isImportMetaURLNode(node.arguments[1])
  ) {
    return new URL(node.arguments[0].value, `file:${path}`);
  } else {
    return null;
  }
}

function convertString$TemplateStringOrSimpleImportedConstantNodeToStringOrURL(
  node: Expression | Pattern | Super,
  path: string,
  rootAST: Node,
): StringOrURL | null {
  if (
    isLiteral(node)
    && (typeof node.value === 'string')
  ) {
    return node.value;
  } else if (
    isTemplateLiteral(node)
    && (node.quasis.length === 1)
    && isTemplateElement(node.quasis[0])
    && (typeof node.quasis[0].value.cooked === 'string')
  ) {
    return node.quasis[0].value.cooked;
  } else if (
    isIdentifier(node)
  ) {
    let url!: URL | undefined;
    const name: string = node.name;
    full(rootAST, (node: Node) => {
      if (
        isImportDeclaration(node)
        && (node.specifiers.length === 1)
        && isImportDefaultSpecifier(node.specifiers[0])
        && isIdentifier(node.specifiers[0].local)
        && (node.specifiers[0].local.name === name)
      ) {
        url = new URL(String(node.source.value), `file:${path}`);
      }
    });

    if (url === void 0) {
      throw new Error(`Unable to locale import for '${name}'`);
    } else {
      return url;
    }
  } else {
    return null;
  }
}

/*----------------*/

/** REACTIVE HTML **/

export interface IMutate$CompileReactiveHTMLAsComponentTemplateCallExpressionAST$ToConvertRawComponentTemplateToComponentTemplateCallExpressionASTOptions {
  node: CallExpression;
  path: string;
  rootAST: Node;
  load: boolean;
}

export function mutate$CompileReactiveHTMLAsComponentTemplateCallExpressionAST$ToConvertRawComponentTemplateToComponentTemplateCallExpressionAST(
  {
    node,
    path,
    rootAST,
    load,
  }: IMutate$CompileReactiveHTMLAsComponentTemplateCallExpressionAST$ToConvertRawComponentTemplateToComponentTemplateCallExpressionASTOptions,
): Promise<CallExpression> {

  const generateCallee = (
    callee: Identifier = node.callee as Identifier,
  ): Identifier => {
    const imported: string = 'convertRawComponentTemplateToComponentTemplate';
    const local: string = imported;

    addImportToProgram(
      rootAST,
      '@lifaon/rx-dom',
      {
        imported,
        local,
      },
    );

    return {
      ...callee,
      name: local,
    };
  };

  const convertHTMLProperty$OfCompileReactiveHTMLAsComponentTemplate$ToStringOrURL = (
    node: Property,
    path: string,
    rootAST: Node,
  ): StringOrURL => {
    const result: StringOrURL | null = convertString$TemplateStringOrSimpleImportedConstantNodeToStringOrURL(node.value, path, rootAST);
    if (result === null) {
      console.log(node);
      throw new Error(`Unoptimizable html property`);
    } else {
      return result;
    }
  };

  const convertURLProperty$OfCompileReactiveHTMLAsComponentTemplate$ToURL = (
    node: Property,
    path: string,
  ): URL => {
    const result: URL | null = convertURLNodeToURL(node.value, path);
    if (result === null) {
      console.log(node);
      throw new Error(`Invalid URL format`);
    } else {
      return result;
    }
  };

  const generateTemplateProperty = async (
    property: Property,
  ): Promise<Property> => {
    const html: StringOrURL = load
      ? convertURLProperty$OfCompileReactiveHTMLAsComponentTemplate$ToURL(property, path)
      : convertHTMLProperty$OfCompileReactiveHTMLAsComponentTemplate$ToStringOrURL(property, path, rootAST);

    const _html: string = (typeof html === 'string')
      ? html
      : await readFileAsString(html.pathname);

    const modulePath: Path = await writeComponentTemplateModule(_html, path);

    const templateName: string = createTemplateUUID();

    addDefaultImportToProgram(
      rootAST,
      modulePath.toString(),
      templateName,
    );

    // console.log((parseEcmaScript(`import abc from 'none'`) as any).body[0]);
    // console.log((parseEcmaScript(`const a = { b: c };`) as any).body[0].declarations[0].init.properties[0]);
    // console.log((parseEcmaScript(`const a = { b: c };`) as any).body[0].declarations[0].init.properties[0].key);

    return {
      ...property,
      method: false,
      shorthand: false,
      computed: false,
      kind: 'init',
      key: {
        ...property.key,
        name: 'template',
      } as Identifier,
      value: {
        type: 'Identifier',
        name: templateName,
      },
    };
  };

  const generateObjectProperties = async (
    properties: PropertyOrSpreadElement[],
  ): Promise<PropertyOrSpreadElement[]> => {
    const newProperties: PropertyOrSpreadElement[] = [];

    for (let i = 0, l = properties.length; i < l; i++) {
      const property: PropertyOrSpreadElement = properties[i];
      if (
        isProperty(property)
        && isIdentifier(property.key)
        && (
          ((property.key.name === 'html') && !load)
          || ((property.key.name === 'url') && load)
        )
      ) {
        newProperties.push(await generateTemplateProperty(property));
      } else {
        newProperties.push(property);
      }
    }

    return newProperties;
  };

  const generateArgumentsFromObjectExpression = async (
    objectExpression: ObjectExpression,
  ): Promise<[ObjectExpression]> => {
    return [
      {
        ...objectExpression,
        properties: await generateObjectProperties(objectExpression.properties),
      },
    ];
  };

  const generateArguments = (
    callExpressionArguments: ExpressionOrSpreadElement[],
  ): Promise<[ObjectExpression]> => {
    if (
      (callExpressionArguments.length === 1)
      && isObjectExpression(callExpressionArguments[0])
    ) {
      return generateArgumentsFromObjectExpression(callExpressionArguments[0]);
    } else {
      throw new Error(`Malformed function call. Only one object argument was expected.`);
    }
  };

  const generateCallExpression = async (
    node: CallExpression,
  ): Promise<CallExpression> => {
    return {
      ...node,
      callee: generateCallee(node.callee as Identifier),
      arguments: await generateArguments(node.arguments),
    };
  };

  return generateCallExpression(node);
}

export interface IAnalyseCompileReactiveHTMLAsComponentTemplateCallExpressionOptions extends IMutate$CompileReactiveHTMLAsComponentTemplateCallExpressionAST$ToConvertRawComponentTemplateToComponentTemplateCallExpressionASTOptions {
}

async function analyseCompileReactiveHTMLAsComponentTemplateCallExpression(
  {
    node,
    rootAST,
    ...options
  }: IAnalyseCompileReactiveHTMLAsComponentTemplateCallExpressionOptions,
): Promise<void> {
  const newNode = await mutate$CompileReactiveHTMLAsComponentTemplateCallExpressionAST$ToConvertRawComponentTemplateToComponentTemplateCallExpressionAST({
    node,
    rootAST,
    ...options,
  });

  Object.assign(node, newNode);
}

/*----------------*/

async function runAOT(
  src: string,
  path: string,
): Promise<string> {
  await polyfillDOM();

  const rootAST: Node = parseEcmaScript(src);

  // console.log(rootAST);

  const promises: Promise<void>[] = [];

  fixPropertyDefinition(rootAST);

  full(rootAST, (node: Node) => {
    // if (isImportSpecifier(node)) {
    //   console.log(node);
    // }
    if (
      isCallExpression(node)
      && isIdentifier(node.callee)
    ) {
      const functionName: string = node.callee.name;
      switch (functionName) {
        case 'compileReactiveHTMLAsComponentTemplate':
        case 'loadReactiveHTMLAsComponentTemplate':
          promises.push(
            analyseCompileReactiveHTMLAsComponentTemplateCallExpression({
              node,
              path,
              rootAST,
              load: (functionName === 'loadReactiveHTMLAsComponentTemplate'),
            })
              .catch((error: Error) => {
                // console.log(error);
                console.warn(
                  `Failed to optimize '${functionName}' from file '${path}': ${error.message}`,
                );
              }),
          );
          break;
      }
    }
  });

  await Promise.all(promises);

  // console.log(generate(rootAST));

  // return generate(rootAST);
  try {
    return generate(rootAST);
  } catch (e) {
    console.log('---->', src);
    throw e;
  }
}

export function aotPlugin(): any {
  return {
    name: 'aot',

    transform: async (
      src: string,
      path: string,
    ): Promise<any> => {
      if (path.endsWith('.ts')) {
        return {
          code: await runAOT(src, path),
          map: null,
        };
      }
    },
  };
}

