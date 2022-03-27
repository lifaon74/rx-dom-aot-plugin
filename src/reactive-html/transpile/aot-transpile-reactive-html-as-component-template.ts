import { ILines, transpileReactiveHTMLAsRawComponentTemplateModuleToReactiveDOMJSLines } from '@lifaon/rx-dom';

export interface IAOTTranspileReactiveHTMLAsComponentTemplateOptions {
  html: string;
  customElements?: ILines;
  modifiers?: ILines;
}

export type IAOTTranspileReactiveHTMLAsComponentTemplateResult = [
  lines: ILines,
  constantsToImport: Map<string, string>,
];

// function mapConstantsToImport(
//   constantsToImport: Set<string>,
// ): Map<string, string> { // [imported, local]
//   return new Map<string, string>(
//     Array.from(constantsToImport, (constantName: string): [string, string] => {
//       return [
//         (constantName in DEFAULT_CONSTANTS_TO_IMPORT)
//           ? DEFAULT_CONSTANTS_TO_IMPORT[constantName].name
//           : constantName,
//         constantName,
//       ];
//     }),
//   );
// }

export function aotTranspileReactiveHTMLAsComponentTemplate(
  {
    html,
    customElements = [],
    modifiers = [],
  }: IAOTTranspileReactiveHTMLAsComponentTemplateOptions,
): ILines {

  /** TRANSPILE HTML **/

  const reactiveHTMLLines: ILines = transpileReactiveHTMLAsRawComponentTemplateModuleToReactiveDOMJSLines(html);

  // convertRawComponentTemplateToComponentTemplate

  if (reactiveHTMLLines.length === 0) {
    return [
      `_ => _`,
    ];
  } else {

    return reactiveHTMLLines;
    // const variablesToImport: Set<string> = new Set<string>();
    //
    // /** ANALYSE CONSTANTS TO IMPORT **/
    //
    // const ast: Node = parseEcmaScript(linesToString(reactiveHTMLLines));
    //
    // full(ast, (node: Node) => {
    //   if (
    //     isIdentifier(node)
    //   ) {
    //     if (OPTIONAL_VARIABLES_TO_IMPORT.has(node.name)) {
    //       variablesToImport.add(node.name);
    //     } else if (OPTIONAL_CONSTANTS_TO_IMPORT.has(node.name)) {
    //       constantsToImport.add(node.name);
    //     }
    //   }
    // });
    //
    // /** ADD CUSTOM ELEMENTS **/
    //
    // let customElementsLines: ILines;
    // if (
    //   (customElements.length > 0)
    //   && constantsToImport.has('createElement')
    // ) {
    //   constantsToImport.delete('createElement');
    //   constantsToImport.add('generateCreateElementFunctionWithCustomElements');
    //   customElementsLines = [
    //     `const createElement = generateCreateElementFunctionWithCustomElements(`,
    //     ...indentLines(customElements),
    //     `);`,
    //   ];
    // } else {
    //   // constantsToImport.add('createElement');
    //   customElementsLines = [];
    // }
    //
    // /** ADD MODIFIERS **/
    //
    // let modifiersLines: ILines;
    // if (
    //   (modifiers.length > 0)
    //   && constantsToImport.has('getNodeModifier')
    // ) {
    //   constantsToImport.delete('getNodeModifier');
    //   constantsToImport.add('generateGetNodeModifierFunctionFromArray');
    //   modifiersLines = [
    //     `const getNodeModifier = generateGetNodeModifierFunctionFromArray(`,
    //     ...indentLines(modifiers),
    //     `);`,
    //   ];
    // } else {
    //   // constantsToImport.add('getNodeModifier');
    //   modifiersLines = [];
    // }
    //
    // /** ADD RX TEMPLATE CONSTANTS TO IMPORT **/
    //
    // const rxTemplateConstantsToImport: IObjectProperties = [];
    //
    // if (variablesToImport.has(DEFAULT_DATA_NAME)) {
    //   rxTemplateConstantsToImport.push(['data', DEFAULT_DATA_NAME]);
    // }
    //
    // if (variablesToImport.has(DEFAULT_CONTENT_NAME)) {
    //   rxTemplateConstantsToImport.push(['content', DEFAULT_CONTENT_NAME]);
    // }
    //
    // /** GENERATE CODE **/
    //
    // const reactiveDOMJSLines: ILines = generateReactiveDOMJSLinesForRXTemplate(
    //   [
    //     ...customElementsLines,
    //     ...modifiersLines,
    //     ...reactiveHTMLLines,
    //   ],
    //   rxTemplateConstantsToImport,
    // );
    //
    // return [
    //   reactiveDOMJSLines,
    //   mapConstantsToImport(constantsToImport),
    // ];
  }
}

// export function aotTranspileReactiveHTMLAsComponentTemplate(
//   {
//     html,
//     customElements = [],
//     modifiers = [],
//   }: IAOTTranspileReactiveHTMLAsComponentTemplateOptions,
// ): ILines {
//
//
//   /** TRANSPILE HTML **/
//
//   const reactiveHTMLLines: ILines = transpileReactiveHTMLAsRawComponentTemplateModuleToReactiveDOMJSLines(html);
//
//   if (reactiveHTMLLines.length === 0) {
//     return [
//       `_ => _`,
//     ];
//   } else {
//     const variablesToImport: Set<string> = new Set<string>();
//
//     /** ANALYSE CONSTANTS TO IMPORT **/
//
//     const ast: Node = parseEcmaScript(linesToString(reactiveHTMLLines));
//
//     full(ast, (node: Node) => {
//       if (
//         isIdentifier(node)
//       ) {
//         if (OPTIONAL_VARIABLES_TO_IMPORT.has(node.name)) {
//           variablesToImport.add(node.name);
//         } else if (OPTIONAL_CONSTANTS_TO_IMPORT.has(node.name)) {
//           constantsToImport.add(node.name);
//         }
//       }
//     });
//
//     /** ADD CUSTOM ELEMENTS **/
//
//     let customElementsLines: ILines;
//     if (
//       (customElements.length > 0)
//       && constantsToImport.has('createElement')
//     ) {
//       constantsToImport.delete('createElement');
//       constantsToImport.add('generateCreateElementFunctionWithCustomElements');
//       customElementsLines = [
//         `const createElement = generateCreateElementFunctionWithCustomElements(`,
//         ...indentLines(customElements),
//         `);`,
//       ];
//     } else {
//       // constantsToImport.add('createElement');
//       customElementsLines = [];
//     }
//
//     /** ADD MODIFIERS **/
//
//     let modifiersLines: ILines;
//     if (
//       (modifiers.length > 0)
//       && constantsToImport.has('getNodeModifier')
//     ) {
//       constantsToImport.delete('getNodeModifier');
//       constantsToImport.add('generateGetNodeModifierFunctionFromArray');
//       modifiersLines = [
//         `const getNodeModifier = generateGetNodeModifierFunctionFromArray(`,
//         ...indentLines(modifiers),
//         `);`,
//       ];
//     } else {
//       // constantsToImport.add('getNodeModifier');
//       modifiersLines = [];
//     }
//
//     /** ADD RX TEMPLATE CONSTANTS TO IMPORT **/
//
//     const rxTemplateConstantsToImport: IObjectProperties = [];
//
//     if (variablesToImport.has(DEFAULT_DATA_NAME)) {
//       rxTemplateConstantsToImport.push(['data', DEFAULT_DATA_NAME]);
//     }
//
//     if (variablesToImport.has(DEFAULT_CONTENT_NAME)) {
//       rxTemplateConstantsToImport.push(['content', DEFAULT_CONTENT_NAME]);
//     }
//
//     /** GENERATE CODE **/
//
//     const reactiveDOMJSLines: ILines = generateReactiveDOMJSLinesForRXTemplate(
//       [
//         ...customElementsLines,
//         ...modifiersLines,
//         ...reactiveHTMLLines,
//       ],
//       rxTemplateConstantsToImport,
//     );
//
//     return [
//       reactiveDOMJSLines,
//       mapConstantsToImport(constantsToImport),
//     ];
//   }
// }


