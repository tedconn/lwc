import { childNodesGetter, textContentGetter } from './env';

/**
 * `register()` is a means to patch several `Object` methods, so that 3rd parties can't make any
 * unconfigurable props. Therefore `register()` is required to run before any other imports.
 * The method also takes care of patching the `Node.prototype` with properties that ensure expected
 * behavior of `childNodesGetter` and `textContentGetter` as defined in the `./env.ts`.
 */
export default function register(): { create: any; defineProperty: any; defineProperties: any } {
    // We patch these methods, so 3rd parties can't make any unconfigurable props
    const { create, defineProperty, defineProperties } = Object;

    function prepareDef(key: any, def: PropertyDescriptor): PropertyDescriptor {
        def.configurable = true;

        if (!def.get && !def.get) {
            def.writable = true;
        }

        return def;
    }

    Object.create = (obj: object | null, def?: PropertyDescriptorMap & ThisType<any>): any => {
        if (def) {
            const props = Object.keys(def).reduce(
                (acc: { [key: string]: PropertyDescriptor }, key) => {
                    acc[key] = prepareDef(key, def[key]);
                    return acc;
                },
                {}
            );
            return create.call(Object, obj, props);
        }
        return create.call(Object, obj, {});
    };

    Object.defineProperty = (obj, key, def) => {
        prepareDef(key, def);
        return defineProperty.call(Object, obj, key, def);
    };

    Object.defineProperties = (obj, def) => {
        Object.keys(def).forEach(key => prepareDef(key, def[key]));
        return defineProperties.call(Object, obj, def);
    };

    // Patch the `Node.prototype`
    if (Node && Node.prototype) {
        defineProperty(Node.prototype, '$$childNodes$$', {
            get(this: Node): NodeListOf<ChildNode> {
                return childNodesGetter.call(this);
            },
            configurable: false,
            enumerable: false,
        });

        defineProperty(Node.prototype, '$$textContent$$', {
            get(this: Node): string {
                return textContentGetter.call(this);
            },
            configurable: false,
            enumerable: false,
        });
    }

    return { create, defineProperty, defineProperties };
}
