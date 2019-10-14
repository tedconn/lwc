import { getOwnPropertyDescriptor, hasOwnProperty } from '@lwc/shared';

const childNodesGetter: (this: Node) => NodeListOf<Node & Element> = hasOwnProperty.call(
    Node.prototype,
    '$$childNodes$$'
)
    ? getOwnPropertyDescriptor(Node.prototype, '$$childNodes$$')!.get!
    : hasOwnProperty.call(Node.prototype, 'childNodes')
    ? getOwnPropertyDescriptor(Node.prototype, 'childNodes')!.get!
    : getOwnPropertyDescriptor(HTMLElement.prototype, 'childNodes')!.get!; // IE11

const textContentGetter: (this: Node) => string = hasOwnProperty.call(
    Node.prototype,
    '$$textContent$$'
)
    ? getOwnPropertyDescriptor(Node.prototype, '$$textContent$$')!.get!
    : getOwnPropertyDescriptor(Node.prototype, 'textContent')!.get!;

const useSyntheticShadow = () => hasOwnProperty.call(Element.prototype, '$shadowToken$');

export { childNodesGetter, textContentGetter, useSyntheticShadow };
