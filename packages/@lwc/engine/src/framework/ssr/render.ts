import { VCustomElement, VNode, VNodeData, VElement, Hooks } from '../../3rdparty/snabbdom/types';
import { getComponentVM, getCustomElementVM, VM } from '../vm';
import { createElement } from '../upgrade';
import { LightningElement } from '../base-lightning-element';
import { renderComponent, ComponentConstructor } from '../component';

import { serializeVNode } from './serialize';
import { isCustomElement } from './snabdom-utils';

/**
 * Rendering engine for SSR.
 */

export interface Options {
    is: ComponentConstructor;
    timeout?: number;
    asyncData?: boolean;
    asyncContext?: object;
}

/**
 * This class carries the ssr context while rendering the components, as well as
 * the promises that need to be resolved before the final rendering takes place.
 */
class SSRContext {
    promises: Promise<any>[] = [];
    options: Options;
    timeout: number;

    constructor(options: Options) {
        this.options = options;
        this.timeout = (options && options.timeout) || 8 * 1000;
    }
    add(p: Promise<any>) {
        if (p) {
            this.promises.push(p);
        }
    }

    getPromise(): Promise<any> | null {
        if (this.promises.length > 0) {
            return Promise.all(this.promises);
        }
        return null;
    }
}

//
// SSR Rendering engine
//

function createComponent(sel: string, Ctor: ComponentConstructor): LightningElement {
    const comp: LightningElement = (createElement(sel, {
        is: Ctor,
    }) as unknown) as LightningElement;
    return comp;
}

function createCustomElement(vnode: VCustomElement) {
    const element = document.createElement(vnode.sel);
    vnode.elm = element;
    vnode.hook.create(vnode);
}

// Recursively render the embedded components
function renderRecursively(context: SSRContext, nodes: (VNode | null)[]) {
    nodes.forEach(vnode => {
        if (vnode && isCustomElement(vnode)) {
            const cv = vnode as VCustomElement;
            // Is this currently the only way to create the component?
            // Can we use a create hook instead?
            //           cv.hook.create(vnode);
            createCustomElement(cv);
            const vm = getCustomElementVM(cv.elm as HTMLElement);
            ssrRenderComponent(context, cv, vm);
        }
    });
}

function ssrRenderComponent(context: SSRContext, parent: VNode, vm: VM) {
    // Mark the component as connected
    // Should happen before 'prefetchAsyncData', because this is the first time when the
    // component gets access to its properties so it can for example fetch() data.
    // prefetchAsyncData can get a hold on the Promise and return it for async rendering
    const ce: LightningElement = vm.component as LightningElement;
    if (ce.connectedCallback) {
        ce.connectedCallback.call(ce);
    }

    //------
    // PHIL: Here is how async rendering can happen
    //------
    if (context.options.asyncData && (ce.constructor as any).prefetchAsyncData) {
        // The component properties are added to the context
        const ctx = { ...context.options.asyncContext, props: ce };
        const p = (ce.constructor as any).prefetchAsyncData.call(ce, ctx);
        if (p && p.then) {
            //console.log("Async rendering detected for component: "+ce.Ctor);
            context.add(p);
            // We stop here and we don't render the children
            // But the peers will be rendered in case there are rendered simultaneously
            return [];
        }
    }

    // Make the VM dirty to force the rendering
    // A check in debug mode will throw an error if it is false (renderComponent)
    vm.isDirty = true; // Make it dirty to force
    const children = renderComponent(vm);

    if (children) {
        renderRecursively(context, children);
    }

    parent.children = children;
}

export function renderToString(sel: string, options: Options): string {
    const context = new SSRContext(options);

    const is = options.is;
    if (!is) {
        throw new Error('Missing component type (options.is)');
    }

    // Create the component to render
    // Ths use of a DOM element is temporary here
    const comp = createComponent(sel, options.is);

    // Create the main element
    const data: VNodeData = {
        attrs: {},
    };
    const parent: VElement = {
        sel,
        data,
        children: [],
        text: undefined,
        elm: undefined,
        key: 0,
        hook: (null as any) as Hooks,
        owner: (null as any) as VM,
    };

    ssrRenderComponent(context, parent, getComponentVM(comp));

    // Ok, in case there are some pending promises (async data), we throw an exception
    if (options.asyncData) {
        const p = context.getPromise();
        if (p) {
            throw p;
        }
    }

    // Serialize the result to HTML
    const html = serializeVNode(parent);
    return html;
}

// Temp export to the runtime
((global || window) as any).__lwc = {
    renderToString,
};
