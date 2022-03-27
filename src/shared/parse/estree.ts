import { Node } from 'acorn';
import { full } from 'acorn-walk';
import {
  CallExpression,
  ClassBody,
  EmptyStatement,
  Expression,
  ExpressionStatement,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  Literal,
  MemberExpression,
  MetaProperty,
  MethodDefinition,
  NewExpression,
  ObjectExpression,
  Program,
  Property,
  PropertyDefinition,
  SpreadElement,
  TemplateElement,
  TemplateLiteral,
} from 'estree';

export type PropertyOrSpreadElement = Property | SpreadElement;
export type ExpressionOrSpreadElement = Expression | SpreadElement;

export function fixPropertyDefinition(
  ast: Node,
): Node {
  full(ast, (node: Node) => {
    switch (node.type) {
      case 'ClassBody': {
        const classBody: ClassBody = node as unknown as ClassBody;
        for (let i = 0; i < classBody.body.length; i++) {
          const childNode: MethodDefinition | PropertyDefinition = classBody.body[i];
          if (childNode.type === 'PropertyDefinition') {
            classBody.body.splice(i, 1);
            i--;
          }
        }
        break;
      }
    }
  });
  return ast;
}

/** IS **/

export function isCallExpression(
  node: any,
): node is CallExpression {
  return node.type === 'CallExpression';
}

export function isIdentifier(
  node: any,
): node is Identifier {
  return node.type === 'Identifier';
}

export function isLiteral(
  node: any,
): node is Literal {
  return node.type === 'Literal';
}

export function isTemplateLiteral(
  node: any,
): node is TemplateLiteral {
  return node.type === 'TemplateLiteral';
}

export function isTemplateElement(
  node: any,
): node is TemplateElement {
  return node.type === 'TemplateElement';
}

export function isObjectExpression(
  node: any,
): node is ObjectExpression {
  return node.type === 'ObjectExpression';
}

export function isProperty(
  node: any,
): node is Property {
  return node.type === 'Property';
}

export function isProgram(
  node: any,
): node is Program {
  return node.type === 'Program';
}

export function isImportDeclaration(
  node: any,
): node is ImportDeclaration {
  return node.type === 'ImportDeclaration';
}

export function isImportSpecifier(
  node: any,
): node is ImportSpecifier {
  return node.type === 'ImportSpecifier';
}

export function isExpressionStatement(
  node: any,
): node is ExpressionStatement {
  return node.type === 'ExpressionStatement';
}

export function isImportDefaultSpecifier(
  node: any,
): node is ImportDefaultSpecifier {
  return node.type === 'ImportDefaultSpecifier';
}

export function isEmptyStatement(
  node: any,
): node is EmptyStatement {
  return node.type === 'EmptyStatement';
}

export function isMemberExpression(
  node: any,
): node is MemberExpression {
  return node.type === 'MemberExpression';
}

export function isNewExpression(
  node: any,
): node is NewExpression {
  return node.type === 'NewExpression';
}

export function isMetaProperty(
  node: any,
): node is MetaProperty {
  return node.type === 'MetaProperty';
}

export function isSpreadElement(
  node: any,
): node is SpreadElement {
  return node.type === 'SpreadElement';
}

/** CREATE **/

export function createEmptyStatement(): EmptyStatement {
  return {
    type: 'EmptyStatement',
  };
}
