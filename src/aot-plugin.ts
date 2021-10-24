import { ILines, indentLines, linesToString, stringToLinesRaw } from '@lifaon/rx-dom';
import { Node } from 'acorn';
import { full } from 'acorn-walk';
import { generate } from 'astring';
import {
  CallExpression,
  Expression,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  MemberExpression,
  Pattern,
  Property,
  SpreadElement,
  Super,
} from 'estree';
import { polyfillDOM } from './shared/misc/polyfill-dom';
import { readFile } from './shared/misc/read-file';
import {
  fixPropertyDefinition,
  isCallExpression,
  isExpressionStatement,
  isIdentifier,
  isImportDeclaration, isImportDefaultSpecifier,
  isImportSpecifier,
  isLiteral,
  isMemberExpression,
  isMetaProperty,
  isNewExpression,
  isObjectExpression,
  isProgram,
  isProperty, isTemplateElement, isTemplateLiteral,
} from './shared/parse/estree';
import { parseEcmaScript } from './shared/parse/parse-ecsmascript';
import { aotTranspileAndMinifyReactiveHTMLAsGenericComponentTemplate } from './shared/transpile/aot-transpile-and-minify-reactive-html-as-generic-component-template';
import {
  IAOTTranspileReactiveHTMLAsGenericComponentTemplateOptions,
  IAOTTranspileReactiveHTMLAsGenericComponentTemplateResult,
} from './shared/transpile/aot-transpile-reactive-html-as-generic-component-template';

/*----------------*/

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

function appendSpecifiersToImportDeclaration(
  node: ImportDeclaration,
  specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>,
): ImportDeclaration {
  node.specifiers.push(...specifiers);
  return node;
}

function appendSimpleSpecifierToImportDeclaration(
  node: ImportDeclaration,
  identifier: string,
): ImportDeclaration {
  const alreadyHasSpecifier: boolean = node.specifiers.some((specifier: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier) => {
    if (isImportSpecifier(specifier)) {
      return (specifier.imported.name === identifier); // TODO check .local ?
    } else {
      throw new Error(`Unsupported specifier`);
    }
  });
  if (!alreadyHasSpecifier) {
    node.specifiers.push(createSimpleImportSpecifier(identifier));
  }
  return node;
}

function createSimpleImportSpecifier(
  identifier: string,
): ImportSpecifier {
  const _identifier: Identifier = {
    type: 'Identifier',
    name: identifier,
  };

  return {
    type: 'ImportSpecifier',
    imported: _identifier,
    local: _identifier,
  };
}

function addImportToProgram(
  ast: Node,
  path: string,
  identifier: string,
): void {
  let found: boolean = false;
  full(ast, (node: Node) => {
    if (
      isImportDeclaration(node)
      && (node.source.value === path)
    ) {
      found = true;
      appendSimpleSpecifierToImportDeclaration(node, identifier);
    }
  });

  if (!found) {
    if (isProgram(ast)) {
      ast.body = [
        createImportDeclaration(
          path,
          [createSimpleImportSpecifier(identifier)],
        ),
        ...ast.body,
      ];
    } else {
      throw new Error(`Expected Program`);
    }
  }
}

/*----------------*/

/* LOAD */

export interface IAOTLoadTranspileAndMinifyReactiveHTMLAsGenericComponentTemplateOptions extends Omit<IAOTTranspileReactiveHTMLAsGenericComponentTemplateOptions, 'html'> {
  path: string;
}

export function aotLoadTranspileAndMinifyReactiveHTMLAsGenericComponentTemplate(
  {
    path,
    ...options
  }: IAOTLoadTranspileAndMinifyReactiveHTMLAsGenericComponentTemplateOptions,
): Promise<IAOTTranspileReactiveHTMLAsGenericComponentTemplateResult> {
  return readFile(path)
    .then((html: string): IAOTTranspileReactiveHTMLAsGenericComponentTemplateResult => {
      return aotTranspileAndMinifyReactiveHTMLAsGenericComponentTemplate({
        html,
        ...options,
      });
    });
}

/*----------------*/

export function isImportMetaURLNode(
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

function analyseURLPropertyValue(
  node: Expression | Pattern | Super,
  path: string,
): URL {
  if (
    isMemberExpression(node)
    && isIdentifier(node.property)
    && (node.property.name === 'href')
  ) {
    return analyseURLPropertyValue(node.object, path);
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
    throw new Error(`Invalid URL format`);
  }
}

function analyseURLProperty(
  node: Property,
  path: string,
): URL {
  return analyseURLPropertyValue(node.value, path);
}

function analyseHTMLPropertyValue(
  node: Expression | Pattern | Super,
  path: string,
  rootAST: Node,
): string | URL {
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
      throw new Error(`Unable to locale import for '${ name }'`);
    } else {
      return url;
    }
  } else {
    console.log(node);
    throw new Error(`Unoptimizable html property`);
  }
}

function analyseHTMLProperty(
  node: Property,
  path: string,
  rootAST: Node,
): string | URL {
  return analyseHTMLPropertyValue(node.value, path, rootAST);
}

function analyseCustomElementsPropertyValue(
  node: Expression | Pattern,
): ILines {
  return stringToLinesRaw(generate(node));
}

function analyseCustomElementsProperty(
  node: Property,
): ILines {
  return analyseCustomElementsPropertyValue(node.value);
}

function analyseModifiersPropertyValue(
  node: Expression | Pattern,
): ILines {
  return stringToLinesRaw(generate(node));
}

function analyseModifiersProperty(
  node: Property,
): ILines {
  return analyseModifiersPropertyValue(node.value);
}

/*----*/

export interface IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplatePropertiesOptions {
  properties: Array<Property | SpreadElement>;
  path: string;
  rootAST: Node;
}

export interface IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplatePropertiesResult {
  html: string | URL | undefined;
  customElements: ILines | undefined;
  modifiers: ILines | undefined;
}

export function extractCompileOrLoadReactiveHTMLAsGenericComponentTemplateProperties(
  {
    properties,
    path,
    rootAST,
  }: IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplatePropertiesOptions,
): IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplatePropertiesResult {
  let html: string | URL | undefined;
  let customElements: ILines | undefined;
  let modifiers: ILines | undefined;

  for (let i = 0, l = properties.length; i < l; i++) {
    const property: (Property | SpreadElement) = properties[i];
    if (
      isProperty(property)
      && isIdentifier(property.key)
    ) {
      switch (property.key.name) {
        case 'url':
          html = analyseURLProperty(property, path);
          break;
        case 'html':
          html = analyseHTMLProperty(property, path, rootAST);
          break;
        case 'customElements':
          customElements = analyseCustomElementsProperty(property);
          break;
        case 'modifiers':
          modifiers = analyseModifiersProperty(property);
          break;
        default:
          throw new Error(`Unexpected property: ${property.key}`);
      }
    } else {
      throw new Error(`Unsupported spread element`);
    }
  }

  return {
    html,
    customElements,
    modifiers,
  };
}

export interface IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpressionPropertiesOptions extends Omit<IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplatePropertiesOptions, 'properties'> {
  node: CallExpression,
}

export function extractCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpressionProperties(
  {
    node,
    ...options
  }: IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpressionPropertiesOptions,
): IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplatePropertiesResult {
  if (
    (node.arguments.length === 1)
    && isObjectExpression(node.arguments[0])
  ) {
    return extractCompileOrLoadReactiveHTMLAsGenericComponentTemplateProperties({
      properties: node.arguments[0].properties,
      ...options,
    });
  } else {
    throw new Error(`Malformed function call. Only one object argument was expected.`);
  }
}

export interface IAnalyseCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpressionOptions extends IExtractCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpressionPropertiesOptions {
  wrapWithPromise: boolean,
}

async function analyseCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpression(
  {
    node,
    rootAST,
    wrapWithPromise,
    ...options
  }: IAnalyseCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpressionOptions,
): Promise<void> {
  // console.log(node);

  const {
    html,
    ...customElementsAndModifiersOptions
  } = extractCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpressionProperties({
    node,
    rootAST,
    ...options,
  });

  if (html === void 0) {
    throw new Error(`Missing property 'url' or 'html'`);
  } else {
    const transpiled: IAOTTranspileReactiveHTMLAsGenericComponentTemplateResult = (typeof html === 'string')
      ? aotTranspileAndMinifyReactiveHTMLAsGenericComponentTemplate({
        html,
        ...customElementsAndModifiersOptions,
      })
      : await aotLoadTranspileAndMinifyReactiveHTMLAsGenericComponentTemplate({
        path: html.pathname,
        ...customElementsAndModifiersOptions,
      });

    const [lines, constantsToImport] = transpiled;

    const _lines: ILines = wrapWithPromise
      ? [
        `Promise.resolve(`,
        ...indentLines(lines),
        `)`,
      ]
      : lines;

    const childAST: Node = parseEcmaScript(linesToString(_lines));

    if (
      isProgram(childAST)
      && (childAST.body.length === 1)
      && isExpressionStatement(childAST.body[0])
    ) {
      Object.assign(node, childAST.body[0].expression);

      const iterator: Iterator<string> = constantsToImport.values();
      let result: IteratorResult<string>;
      while (!(result = iterator.next()).done) {
        addImportToProgram(
          rootAST,
          '@lifaon/rx-dom',
          result.value,
        );
      }
    } else {
      console.log(childAST);
      throw new Error(`Invalid tree`);
    }
  }
}


/*----------------*/

async function runAOT(
  src: string,
  path: string,
): Promise<string> {
  await polyfillDOM();

  const rootAST: Node = parseEcmaScript(src);

  const promises: Promise<void>[] = [];

  fixPropertyDefinition(rootAST);

  full(rootAST, (node: Node) => {
    if (
      isCallExpression(node)
      && isIdentifier(node.callee)
    ) {
      const functionName: string = node.callee.name;
      switch (functionName) {
        case 'compileReactiveHTMLAsGenericComponentTemplate':
        case 'loadReactiveHTMLAsGenericComponentTemplate':
          promises.push(
            analyseCompileOrLoadReactiveHTMLAsGenericComponentTemplateCallExpression({
              node,
              path,
              rootAST,
              wrapWithPromise: (functionName === 'loadReactiveHTMLAsGenericComponentTemplate'),
            })
              .catch((error: Error) => {
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

  // console.log(generate(ast));

  // return generate(rootAST);
  try {
    return generate(rootAST);
  } catch(e) {
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

