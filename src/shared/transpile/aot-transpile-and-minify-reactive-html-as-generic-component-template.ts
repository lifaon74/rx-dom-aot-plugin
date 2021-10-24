import { minifyHTML } from '../optimize/minify-html';
import {
  aotTranspileReactiveHTMLAsGenericComponentTemplate,
  IAOTTranspileReactiveHTMLAsGenericComponentTemplateOptions,
  IAOTTranspileReactiveHTMLAsGenericComponentTemplateResult,
} from './aot-transpile-reactive-html-as-generic-component-template';

export function aotTranspileAndMinifyReactiveHTMLAsGenericComponentTemplate(
  {
    html,
    ...options
  }: IAOTTranspileReactiveHTMLAsGenericComponentTemplateOptions,
): IAOTTranspileReactiveHTMLAsGenericComponentTemplateResult {
  return aotTranspileReactiveHTMLAsGenericComponentTemplate({
    html: minifyHTML(html),
    ...options,
  });
}
