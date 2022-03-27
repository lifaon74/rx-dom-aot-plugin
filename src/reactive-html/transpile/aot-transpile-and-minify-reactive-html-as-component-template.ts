import { ILines } from '../../../../rx-dom/dist';
import { minifyHTML } from '../../shared/optimize/minify-html';
import {
  aotTranspileReactiveHTMLAsComponentTemplate,
  IAOTTranspileReactiveHTMLAsComponentTemplateOptions,
} from './aot-transpile-reactive-html-as-component-template';

export function aotTranspileAndMinifyReactiveHTMLAsComponentTemplate(
  {
    html,
    ...options
  }: IAOTTranspileReactiveHTMLAsComponentTemplateOptions,
): ILines {
  return aotTranspileReactiveHTMLAsComponentTemplate({
    html: minifyHTML(html),
    ...options,
  });
}
