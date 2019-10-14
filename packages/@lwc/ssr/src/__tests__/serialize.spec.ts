import * as domino from 'domino';
import { NodeVM } from 'vm2';
import { createElement, LightningElement } from '@lwc/engine';
import { compileTemplate } from '../../scripts/jest/test-utils';
import {
    defaultProcessor,
    DefaultProcessor,
    defaultResolver,
    Processor,
    Resolver,
    serialize,
} from '../serialize';

const dominoImpl = (<any>domino).impl;
const dominoWindow = domino.createWindow();

// const { defineProperty } = Object;
// defineProperty(dominoImpl.DocumentFragment.prototype, 'host', {
//     get: () => null,
//     configurable: true,
//     enumerable: true,
// });
// defineProperty(dominoImpl.Node.prototype, 'parentNode', {
//     get: () => null,
//     configurable: true,
//     enumerable: true,
// });

function runInVm(context: { [key: string]: any }): Promise<string> {
    return new Promise((resolve, reject) => {
        const vm = new NodeVM({
            console: 'inherit',
            sandbox: {
                ...context,
                ...dominoImpl,
                serialize: serialize,
                resolver: context.resolver || defaultResolver,
                window: dominoWindow,
                document: dominoWindow.document,
                KeyboardEvent: dominoImpl.Event,
                ShadowRoot: dominoImpl.DocumentFragment,
                onVmSuccess: (output: string) => resolve(output),
                onVmError: (err: Error) => reject(err),
            },
            require: {
                external: true,
            },
            nesting: true,
        });

        vm.run(
            `
(async () => {
    try {
        const output = await serialize(elm, resolver);
        onVmSuccess(output);
    } catch (e) {
        onVmError(e);
    }
})();`,
            '.'
        );
    });
}

describe('serialize', () => {
    describe('Basic', () => {
        it(`should throw if no 'Node' is passed as root node`, done => {
            serialize(<any>null)
                .then(() => done.fail('TypeError expected'))
                .catch((err: Error) => {
                    expect(err).toBeInstanceOf(TypeError);
                    expect(err.message).toBe(
                        `"serialize" function expects a "Node" as parameter but received "[object Null]".`
                    );
                    done();
                });
        });

        it('should serialize a HTMLDivElement', async done => {
            const elm: HTMLDivElement = document.createElement('div');
            elm.setAttribute('id', 'foo');

            runInVm({ elm })
                .then((output: string) => {
                    expect(output).toBe(`<div id="foo"></div>`);
                    done();
                })
                .catch(done.fail);
        });

        it('should serialize a HTMLDivElement with several child elements', async done => {
            const elm: HTMLDivElement = document.createElement('div');
            const spanEl1: HTMLSpanElement = document.createElement('span');
            const spanEl2: HTMLSpanElement = document.createElement('span');
            elm.appendChild(spanEl1);
            elm.appendChild(spanEl2);
            elm.setAttribute('id', 'foo');
            spanEl1.textContent = 'Hello';
            spanEl2.textContent = 'World!';

            runInVm({ elm })
                .then((output: string) => {
                    expect(output).toBe(
                        `<div id="foo"><span>Hello</span><span>World!</span></div>`
                    );
                    done();
                })
                .catch(done.fail);
        });

        it.skip('should serialize a simple Web Component', async () => {
            class Foo extends HTMLElement {
                connectedCallback() {
                    const divEl: HTMLDivElement = document.createElement('div');
                    divEl.setAttribute('id', 'foo');
                    this.appendChild(divEl);
                }
            }

            customElements.define('x-foo', Foo);
            const fooEl = document.createElement('x-foo');
            const output = await serialize(fooEl);
            expect(output).toBe('<x-foo><div id="foo"></div></x-foo>');
        });

        it.skip('should serialize a Web Component with slots', async () => {
            const BarTemplate = document.createElement('template');
            BarTemplate.innerHTML = `
<x-foo id="bar">
  <p slot="footer">Projected Footer Content</p>
  <p slot="header">Projected Header Content</p>
  <p>Projected Body Content</p>
</x-foo>`.trim();

            class Bar extends HTMLElement {
                connectedCallback() {
                    const clone = document.importNode(BarTemplate.content, true);
                    this.appendChild(clone);
                }
            }

            const FooTemplate = document.createElement('template');
            FooTemplate.innerHTML = `
<div id="foo">
  <div>Above Header</div>
  <slot name="header"></slot>
  <div>Below Header</div>
  <div>Above Content</div>
  <slot></slot>
  <div>Below Content</div>
  <div>Above Footer</div>
  <slot name="footer"></slot>
  <div>Below Footer</div>
</div>`.trim();

            class Foo extends HTMLElement {
                connectedCallback() {
                    const shadowRoot = this.attachShadow({ mode: 'open' });
                    const clone = document.importNode(FooTemplate.content, true);
                    shadowRoot.appendChild(clone);
                }
            }

            customElements.define('x-foo', Foo);
            customElements.define('x-bar', Bar);
            const barEl = document.createElement('x-bar');
            const output = await serialize(barEl);
            expect(output).toBe('<x-foo><div id="foo"></div></x-foo>');
        });
    });

    describe('LWC', () => {
        it('should serialize a simple Lightning Web Component', done => {
            const template = compileTemplate(
                `
<template>
    <div class="foo">Hello World!</div>
    <hr />
</template>`,
                { modules: {} }
            );

            class Foo extends LightningElement {
                render() {
                    return template;
                }
            }

            const elm = createElement('x-foo', { is: Foo });
            document.body.appendChild(elm);

            runInVm({ elm })
                .then((output: string) => {
                    expect(output).toBe(
                        `<x-foo><shadowroot><div class="foo">Hello World!</div><hr></shadowroot></x-foo>`
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('should serialize a Lightning Web Component with slots', async done => {
            const barTemplate = compileTemplate(
                `
<template>
    <slot name="header"></slot>
    <slot></slot>
    <slot name="footer"></slot>
</template>`,
                { modules: {} }
            );

            class Bar extends LightningElement {
                render() {
                    return barTemplate;
                }
            }

            const fooTemplate = compileTemplate(
                `
<template>
    <x-bar>
        <div class="footer" slot="footer">Footer</div>
        <div class="header" slot="header">Header</div>
        <div class="body">Content</div>
    </x-bar>
</template>`,
                { modules: { 'x-bar': Bar } }
            );

            class Foo extends LightningElement {
                render() {
                    return fooTemplate;
                }
            }

            const elm = createElement('x-foo', { is: Foo });
            document.body.appendChild(elm);

            runInVm({ elm })
                .then((output: string) => {
                    expect(output).toBe(
                        `<x-foo><shadowroot><x-bar><shadowroot><slot name="header"></slot><slot></slot><slot name="footer"></slot></shadowroot><div slot="footer" class="footer">Footer</div><div slot="header" class="header">Header</div><div class="body">Content</div></x-bar></shadowroot></x-foo>`
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('should serialize a Lightning Web Component using a specialized pre-processor', done => {
            class FooProcessor extends DefaultProcessor {
                pre({ node }: { node: Node }): Promise<Node> {
                    const el = <HTMLElement>node;
                    el.setAttribute('data-preprocessed', 'true');
                    return super.pre({ node });
                }
            }
            const resolver: Resolver = (node: Node) => (
                resolve: (processor: Processor | PromiseLike<Processor>) => void
            ) => {
                if (node.nodeName.toLowerCase() === 'x-foo') {
                    resolve(new FooProcessor());
                } else {
                    resolve(defaultProcessor);
                }
            };

            const template = compileTemplate(
                `
<template>
    <div class="foo">Hello World!</div>
</template>`,
                { modules: {} }
            );

            class Foo extends LightningElement {
                render() {
                    return template;
                }
            }

            const elm = createElement('x-foo', { is: Foo });
            document.body.appendChild(elm);

            runInVm({ elm, resolver })
                .then((output: string) => {
                    expect(output).toBe(
                        `<x-foo data-preprocessed="true"><shadowroot><div class="foo">Hello World!</div></shadowroot></x-foo>`
                    );
                    done();
                })
                .catch(done.fail);
        });
    });
});
