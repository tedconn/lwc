import { isVoidElement } from '../serialize';

// @see https://html.spec.whatwg.org/multipage/syntax.html#elements-2
const VOID_ELEMENTS = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];

const NON_VOID_ELEMENTS = [
    'button',
    'select',
    'textarea'
];

describe('isVoidElement', () => {
    it(`should return 'true' for void elements by 'nodeName'`, () => {
        VOID_ELEMENTS.forEach(nodeName => {
            expect(isVoidElement(nodeName)).toBe(true);
        });
    });

    it(`should return 'true' for void elements by 'Node' reference`, () => {
        VOID_ELEMENTS.forEach(nodeName => {
            const el = document.createElement(nodeName);
            expect(isVoidElement(el)).toBe(true);
        });
    });

    it(`should return 'false' for non-void elements by 'nodeName'`, () => {
        NON_VOID_ELEMENTS.forEach(nodeName => {
            expect(isVoidElement(nodeName)).toBe(false);
        });
    });

    it(`should return 'false' for non-void elements by 'Node' reference`, () => {
        NON_VOID_ELEMENTS.forEach(nodeName => {
            const el = document.createElement(nodeName);
            expect(isVoidElement(el)).toBe(false);
        });
    });
});
