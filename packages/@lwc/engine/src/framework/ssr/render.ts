import { VNodes } from '../../3rdparty/snabbdom/types';
import { VM, getComponentVM } from '../vm';
import { createElement } from '../upgrade';
import { LightningElement } from '../base-lightning-element';
import { renderComponent, ComponentConstructor } from '../component';

import { serializeVNodes } from './serialize';

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
        if (this.promises) {
            return Promise.all(this.promises);
        }
        return null;
    }
}

//
// SSR Rendering engine
//

function ssrRenderComponent(context: SSRContext, ce: LightningElement, vm: VM): VNodes {
    // Mark the component as connected
    // Should happen before 'prefetchAsyncData', because this is the first time when the
    // component gets access to its properties so it can for example fetch() data.
    // prefetchAsyncData can get a hold on the Promise and return it for async rendering
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

    const v = renderComponent(vm);
    return v;
}

export function renderToString(sel: string, options: Options): string {
    const context = new SSRContext(options);

    const is = options.is;
    if (!is) {
        throw new Error('Missing component type (options.is)');
    }

    // Create the component to render
    // Ths use of a DOM element is temporary here
    const comp: LightningElement = (createElement(sel, {
        is: options.is,
    }) as unknown) as LightningElement;

    const vnodes = ssrRenderComponent(context, comp, getComponentVM(comp));

    // Ok, in case there are some pending promises (async data), we throw an exception
    if (options.asyncData) {
        const p = context.getPromise();
        if (p) {
            throw p;
        }
    }

    // Serialize the result to HTML
    const html = serializeVNodes(vnodes);
    return html;
}

// Temp export to the runtime
((global || window) as any).__lwc = {
    renderToString,
};
