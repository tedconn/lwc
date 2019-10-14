import { ArrayFrom, isFunction, toString } from '@lwc/shared';
import { childNodesGetter, textContentGetter, useSyntheticShadow } from './env';

export interface Processor {
    /**
     * A pre-processor is a way for server-side rendered components to pre-process the returned
     * markup, for instance to return placeholder content, or DOM markers that are required for
     * later rehydration, etc.
     */
    pre({ node }: { node: Node }): Promise<Node>;

    /**
     * A post-processor is a way for server-side rendered components to execute actions after the
     * actual stringification process. This can be useful in order to also execute certain teardown
     * logic.
     */
    post({ result, node }: { result: string; node: Node }): Promise<string>;
}

/**
 * The default processor is suited for Web Components and simply invokes a component's `connectedCallback` lifecycle hook during
 * pre-process phase, and the `disconnectedCallback` lifecycle hook during post-process phase.
 */
export class DefaultProcessor implements Processor {
    pre({ node }: { node: Node }): Promise<Node> {
        // TODO(seckardt): Cater this method for the HTMLBridgeElement
        const n = <any>node;
        n && isFunction(n.connectedCallback) && n.connectedCallback();
        return Promise.resolve(node);
    }

    post({ result, node }: { result: string; node: Node }): Promise<string> {
        // TODO(seckardt): Cater this method for the HTMLBridgeElement
        const n = <any>node;
        n && isFunction(n.disconnectedCallback) && n.disconnectedCallback();
        return Promise.resolve(result);
    }
}

/**
 * A `DefaultProcessor` instance.
 */
export const defaultProcessor = new DefaultProcessor();

/**
 * A resolver is a specialized Promise resolver that based on a given `Node` returns a `Processor` instance that can be used to pre- and
 * post-process a node's serialization.
 */
export type Resolver = (
    node: Node
) => (
    resolve: (value?: Processor | PromiseLike<Processor>) => void,
    reject: (reason?: any) => void
) => void;

// const shadowRootScript = `<script>function ɵssr() {var pn='parentNode',rc='removeChild',fc='firstChild',r,s=document.currentScript,f=s[pn];h=f[pn];f[rc](s);h[rc](f);r=h.attachShadow({mode:h.getAttribute('mode')||'open'});while(f&&f[fc])r.appendChild(f[fc]);}</script>`;
// const shadowRootScriptCall = `<script>ɵssr()</script>`;

/**
 * Implementation of a `Resolver` that simply returns the `defaultProcessor` instance.
 */
export const defaultResolver: Resolver = (_node: Node) => (
    resolve: (processor: Processor | PromiseLike<Processor>) => void
) => resolve(defaultProcessor);

/**
 * Void elements can't have any contents (since there's no end tag, no content can be put between the start tag and the end tag).
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#elements-2
 */
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

function serializeStartTag(nodeName: string, element: Element): string {
    return `<${nodeName}${(ArrayFrom(element.attributes) || [])
        .map(a => ` ${a.name}="${a.value}"`)
        .join('')}>`;
}

async function ɵserialize(node: Node, resolver: Resolver): Promise<string> {
    const _useSyntheticShadow = useSyntheticShadow();

    function serializeChildNodes(childNodes: NodeListOf<ChildNode>): Promise<string[]> {
        const promises = ArrayFrom(childNodes).map((_n: Node) => ɵserialize(_n, resolver));
        return Promise.all(promises);
    }

    // Wait for the resolver to return and optionally use its response for the actual rendering
    const processor: Processor = (await new Promise(resolver(node))) || defaultProcessor;
    const n = await processor.pre({ node });
    if (n !== node && n instanceof Node) {
        node = n;
    }

    // Start stringification
    const nodeName = node.nodeName.toLowerCase();
    if (isVoidElement(nodeName)) {
        return serializeStartTag(nodeName, <Element>node);
    }

    if (nodeName === '#text') {
        return textContentGetter.call(node);
    }

    const buffer: string[] = [];
    if (nodeName === '#document') {
        node = (<Document>node).documentElement;
        buffer.push('<!doctype html>');
    }

    const element = <Element>node;
    buffer.push(serializeStartTag(nodeName, element));

    // if (nodeName === 'body') {
    //     str += shadowRootScript;
    // }

    if (element.shadowRoot) {
        const shadowRootChildNodes = _useSyntheticShadow
            ? element.shadowRoot.childNodes
            : childNodesGetter.call(element.shadowRoot);
        if (shadowRootChildNodes.length > 0) {
            const children = await serializeChildNodes(shadowRootChildNodes);
            buffer.push(`<shadowroot>${children.join('')}</shadowroot>`);
        }
    }

    const childNodes = _useSyntheticShadow ? node.childNodes : childNodesGetter.call(node);
    if (childNodes.length > 0) {
        const children = await serializeChildNodes(childNodes);
        buffer.push(children.join(''));
    }

    buffer.push(`</${nodeName}>`);

    const result = buffer.join('');
    return processor.post({ result, node });
}

export async function serialize(
    node: Node = document,
    resolver: Resolver = defaultResolver
): Promise<string> {
    if (!(node instanceof Node)) {
        throw new TypeError(
            `"serialize" function expects a "Node" as parameter but received "${toString(node)}".`
        );
    }
    return ɵserialize(node, resolver);
}

export function isVoidElement(nodeOrNodeName: Node | string): boolean {
    let nodeName = '';
    if (typeof nodeOrNodeName === 'string') {
        nodeName = nodeOrNodeName;
    } else if (nodeOrNodeName instanceof Node) {
        nodeName = nodeOrNodeName.nodeName;
    }
    return VOID_ELEMENTS.includes(nodeName.toLowerCase());
}
