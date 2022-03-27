let TEMPLATE_COUNT: number = 0;

export function createTemplateUUID(): string {
  return `template_${TEMPLATE_COUNT++}`;
}

