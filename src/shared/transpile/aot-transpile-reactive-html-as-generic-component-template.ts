import { Node } from 'acorn';
import { full } from 'acorn-walk';
import {
  DEFAULT_CONSTANTS_TO_IMPORT,
  DEFAULT_CONTENT_NAME,
  DEFAULT_DATA_NAME,
  generateReactiveDOMJSLinesForRXTemplate,
  ILines,
  indentLines,
  IObjectProperties,
  linesToString,
  optionalLines,
  transpileReactiveHTMLToReactiveDOMJSLines,
} from '@lifaon/rx-dom';
import { isIdentifier } from '../parse/estree';
import { parseEcmaScript } from '../parse/parse-ecsmascript';


export interface IAOTTranspileReactiveHTMLAsGenericComponentTemplateOptions {
  html: string;
  customElements?: ILines;
  modifiers?: ILines;
}

export type IAOTTranspileReactiveHTMLAsGenericComponentTemplateResult = [
  lines: ILines,
  constantsToImport: Set<string>,
];

const OPTIONAL_CONSTANTS_TO_IMPORT: Set<string> = new Set<string>(Object.keys(DEFAULT_CONSTANTS_TO_IMPORT));

const OPTIONAL_VARIABLES_TO_IMPORT: Set<string> = new Set<string>([
  'getNodeReference',
  'setNodeReference',
  'getTemplateReference',
  'setTemplateReference',
  DEFAULT_DATA_NAME,
  DEFAULT_CONTENT_NAME,
]);


export function aotTranspileReactiveHTMLAsGenericComponentTemplate(
  {
    html,
    customElements = [],
    modifiers = [],
  }: IAOTTranspileReactiveHTMLAsGenericComponentTemplateOptions,
): IAOTTranspileReactiveHTMLAsGenericComponentTemplateResult {

  const constantsToImport: Set<string> = new Set<string>(['createDocumentFragment']);

  /** TRANSPILE HTML **/

  const reactiveHTMLLines: ILines = optionalLines(transpileReactiveHTMLToReactiveDOMJSLines(html));

  if (reactiveHTMLLines.length === 0) {
    return [
      [`() => createDocumentFragment()`],
      constantsToImport,
    ];
  } else {
    const variablesToImport: Set<string> = new Set<string>();

    /** ANALYSE CONSTANTS TO IMPORT **/

    const ast: Node = parseEcmaScript(linesToString(reactiveHTMLLines));

    full(ast, (node: Node) => {
      if (
        isIdentifier(node)
      ) {
        if (OPTIONAL_VARIABLES_TO_IMPORT.has(node.name)) {
          variablesToImport.add(node.name);
        } else if (OPTIONAL_CONSTANTS_TO_IMPORT.has(node.name)) {
          constantsToImport.add(node.name);
        }
      }
    });

    /** ADD CUSTOM ELEMENTS **/

    let customElementsLines: ILines;
    if (
      (customElements.length > 0)
      && constantsToImport.has('createElement')
    ) {
      constantsToImport.delete('createElement');
      constantsToImport.add('generateCreateElementFunctionWithCustomElements');
      customElementsLines = [
        `const createElement = generateCreateElementFunctionWithCustomElements(`,
        ...indentLines(customElements),
        `);`,
      ];
    } else {
      // constantsToImport.add('createElement');
      customElementsLines = [];
    }

    /** ADD MODIFIERS **/

    let modifiersLines: ILines;
    if (
      (modifiers.length > 0)
      && constantsToImport.has('getNodeModifier')
    ) {
      constantsToImport.delete('getNodeModifier');
      constantsToImport.add('generateGetNodeModifierFunctionFromArray');
      modifiersLines = [
        `const getNodeModifier = generateGetNodeModifierFunctionFromArray(`,
        ...indentLines(modifiers),
        `);`,
      ];
    } else {
      // constantsToImport.add('getNodeModifier');
      modifiersLines = [];
    }

    /** ADD RX TEMPLATE CONSTANTS TO IMPORT **/

    const rxTemplateConstantsToImport: IObjectProperties = [];

    if (variablesToImport.has('getNodeReference')) {
      rxTemplateConstantsToImport.push(['getNodeReference', '']);
    }

    if (variablesToImport.has('setNodeReference')) {
      rxTemplateConstantsToImport.push(['setNodeReference', '']);
    }

    if (variablesToImport.has('getTemplateReference')) {
      rxTemplateConstantsToImport.push(['getTemplateReference', '']);
    }

    if (variablesToImport.has('setTemplateReference')) {
      rxTemplateConstantsToImport.push(['setTemplateReference', '']);
    }

    if (variablesToImport.has(DEFAULT_DATA_NAME)) {
      rxTemplateConstantsToImport.push(['data', DEFAULT_DATA_NAME]);
    }

    if (variablesToImport.has(DEFAULT_CONTENT_NAME)) {
      rxTemplateConstantsToImport.push(['content', DEFAULT_CONTENT_NAME]);
    }

    /** GENERATE CODE **/

    const reactiveDOMJSLines: ILines = generateReactiveDOMJSLinesForRXTemplate(
      [
        ...customElementsLines,
        ...modifiersLines,
        ...reactiveHTMLLines,
      ],
      rxTemplateConstantsToImport,
    );

    return [
      reactiveDOMJSLines,
      constantsToImport,
    ];
  }
}

