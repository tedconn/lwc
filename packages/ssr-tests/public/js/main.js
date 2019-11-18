'use strict';

var jsdom = require('jsdom');

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
//global.Element = domino.impl.Element;
//global.HTMLElement = domino.impl.HTMLElement;
// Very temporary for now to make the lWC initialization work

const window$1 = global.window = new jsdom.JSDOM('').window;
global.document = window$1.document;
global.Element = window$1.Element;
global.HTMLElement = window$1.HTMLElement;
global.ShadowRoot = window$1.ShadowRoot;
global.EventTarget = window$1.EventTarget;
global.Event = window$1.Event;
global.Node = window$1.Node;
const MAX_ASYNC_LOOPS = 4; //
// Context for a SSR request
// As of now, we do *not* execute in a VM, as it executes synchronously so we can setup the context on demand
// Note that this code do not depend on Node APIs, so it can be executed on a JVM as well, with a recent JS
// interpreter like GraalVM
//

const Talon = {
  isServer: true
}; // function extractQuery(s) {
//     const idx = s.indexOf('?')
//     return idx>=0 ? s.substring(idx) : "";
// }

class SSRContext {
  constructor(options) {// const serverContext = options.context;
    // const req = serverContext.req;
    // if(req) {
    //     const query = extractQuery(req.originalUrl)
    //     const url = (req && nodeUrl.format({
    //         protocol: req.protocol,
    //         host: req.get('host'),
    //         pathname: req.path
    //       })) + query;
    //       this.window = createBrowserWindow(url);
    // } else {
    //     this.window = createBrowserWindow("http://locahost");
    // }
  }

  install() {
    // No URL handling for now
    const dom = new jsdom.JSDOM('');
    global.window = dom.window;
    global.document = dom.window.document;
    global.Talon = Talon;
  }

  uninstall() {
    delete global.window;
    delete global.document;
    delete global.Talon;
  }

} //
// Main Rendering function
//


async function renderToString(sel, options) {
  const ssrContext = new SSRContext(options); // We could handle asyncData so we have to catch the exceptions send by the rendering engine
  // We a bound to maximum tries, by default 4
  // Note that the timeout apply for each pass -> should we make it total?

  let preventAsyncData = false;
  const asyncTry = options.prefetch ? 1 : Math.min(MAX_ASYNC_LOOPS, Math.max(2, options.asyncLoops || 0));

  for (let i = 0; i < asyncTry; i++) {
    let dataPromise = null;
    ssrContext.install();

    try {
      // As exported by the LWC engine
      const lwcRenderToString = global.__lwc.renderToString;
      const asyncData = !preventAsyncData && i < asyncTry - 1;
      const result = lwcRenderToString(sel, _objectSpread({}, options, {
        asyncData
      }));
      return result;
    } catch (e) {
      // If the exception was a Promise, the wait for it to be completed
      // Else propagate the exception
      if (e.then) {
        dataPromise = e;
      } else {
        throw e;
      }
    } finally {
      ssrContext.uninstall();
    } // Await for the data promise.


    const timeout = await dataPromise;

    if (timeout) {
      // If it timed out, then we should not request asyncData anymore.
      preventAsyncData = true;
    }
  }
}

/* proxy-compat-disable */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function detect() {
  // Don't apply polyfill when ProxyCompat is enabled.
  if ('getKey' in Proxy) {
    return false;
  }

  const proxy = new Proxy([3, 4], {});
  const res = [1, 2].concat(proxy);
  return res.length !== 4;
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const {
  isConcatSpreadable
} = Symbol;
const {
  isArray
} = Array;
const {
  slice: ArraySlice,
  unshift: ArrayUnshift,
  shift: ArrayShift
} = Array.prototype;

function isObject(O) {
  return typeof O === 'object' ? O !== null : typeof O === 'function';
} // https://www.ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable


function isSpreadable(O) {
  if (!isObject(O)) {
    return false;
  }

  const spreadable = O[isConcatSpreadable];
  return spreadable !== undefined ? Boolean(spreadable) : isArray(O);
} // https://www.ecma-international.org/ecma-262/6.0/#sec-array.prototype.concat


function ArrayConcatPolyfill(..._args) {
  const O = Object(this);
  const A = [];
  let N = 0;
  const items = ArraySlice.call(arguments);
  ArrayUnshift.call(items, O);

  while (items.length) {
    const E = ArrayShift.call(items);

    if (isSpreadable(E)) {
      let k = 0;
      const length = E.length;

      for (k; k < length; k += 1, N += 1) {
        if (k in E) {
          const subElement = E[k];
          A[N] = subElement;
        }
      }
    } else {
      A[N] = E;
      N += 1;
    }
  }

  return A;
}

function apply() {
  Array.prototype.concat = ArrayConcatPolyfill;
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


if (detect()) {
  apply();
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


function detect$1(propName) {
  return Object.getOwnPropertyDescriptor(Element.prototype, propName) === undefined;
}
/**
 * Copyright (C) 2018 salesforce.com, inc.
 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


function invariant(value, msg) {
  if (!value) {
    throw new Error(`Invariant Violation: ${msg}`);
  }
}

function isTrue(value, msg) {
  if (!value) {
    throw new Error(`Assert Violation: ${msg}`);
  }
}

function isFalse(value, msg) {
  if (value) {
    throw new Error(`Assert Violation: ${msg}`);
  }
}

function fail(msg) {
  throw new Error(msg);
}

var assert =
/*#__PURE__*/
Object.freeze({
  invariant: invariant,
  isTrue: isTrue,
  isFalse: isFalse,
  fail: fail
});
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const {
  assign,
  create,
  defineProperties,
  defineProperty,
  freeze,
  getOwnPropertyDescriptor,
  getOwnPropertyNames,
  getPrototypeOf,
  hasOwnProperty,
  keys,
  seal,
  setPrototypeOf
} = Object;
const {
  isArray: isArray$1,
  from: ArrayFrom
} = Array;
const {
  constructor: ArrayConstructor,
  filter: ArrayFilter,
  find: ArrayFind,
  forEach,
  indexOf: ArrayIndexOf,
  join: ArrayJoin,
  map: ArrayMap,
  push: ArrayPush,
  reduce: ArrayReduce,
  reverse: ArrayReverse,
  slice: ArraySlice$1,
  splice: ArraySplice,
  unshift: ArrayUnshift$1
} = Array.prototype;
const {
  charCodeAt: StringCharCodeAt,
  replace: StringReplace,
  slice: StringSlice,
  toLowerCase: StringToLowerCase
} = String.prototype;

function isUndefined(obj) {
  return obj === undefined;
}

function isNull(obj) {
  return obj === null;
}

function isTrue$1(obj) {
  return obj === true;
}

function isFalse$1(obj) {
  return obj === false;
}

function isFunction(obj) {
  return typeof obj === 'function';
}

function isObject$1(obj) {
  return typeof obj === 'object';
}

function isString(obj) {
  return typeof obj === 'string';
}

function isNumber(obj) {
  return typeof obj === 'number';
}

const OtS = {}.toString;

function toString(obj) {
  if (obj && obj.toString) {
    // Arrays might hold objects with "null" prototype So using
    // Array.prototype.toString directly will cause an error Iterate through
    // all the items and handle individually.
    if (isArray$1(obj)) {
      return ArrayJoin.call(ArrayMap.call(obj, toString), ',');
    }

    return obj.toString();
  } else if (typeof obj === 'object') {
    return OtS.call(obj);
  } else {
    return obj + emptyString;
  }
}

function getPropertyDescriptor(o, p) {
  do {
    const d = getOwnPropertyDescriptor(o, p);

    if (!isUndefined(d)) {
      return d;
    }

    o = getPrototypeOf(o);
  } while (o !== null);
}

const emptyString = '';
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * In IE11, symbols are expensive.
 * Due to the nature of the symbol polyfill. This method abstract the
 * creation of symbols, so we can fallback to string when native symbols
 * are not supported. Note that we can't use typeof since it will fail when transpiling.
 */

const hasNativeSymbolsSupport = Symbol('x').toString() === 'Symbol(x)';

function createFieldName(key, namespace) {
  // @ts-ignore: using a string as a symbol for perf reasons
  return hasNativeSymbolsSupport ? Symbol(key) : `$$lwc-${namespace}-${key}$$`;
}

const hiddenFieldsMap = new WeakMap();

function setHiddenField(o, fieldName, value) {
  let valuesByField = hiddenFieldsMap.get(o);

  if (isUndefined(valuesByField)) {
    valuesByField = create(null);
    hiddenFieldsMap.set(o, valuesByField);
  } // @ts-ignore https://github.com/microsoft/TypeScript/issues/1863


  valuesByField[fieldName] = value;
}

function getHiddenField(o, fieldName) {
  const valuesByField = hiddenFieldsMap.get(o);

  if (!isUndefined(valuesByField)) {
    // @ts-ignore https://github.com/microsoft/TypeScript/issues/1863
    return valuesByField[fieldName];
  }
}

var fields =
/*#__PURE__*/
Object.freeze({
  createFieldName: createFieldName,
  setHiddenField: setHiddenField,
  getHiddenField: getHiddenField
});
/** version: 1.1.8 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const {
  hasAttribute,
  getAttribute,
  setAttribute,
  setAttributeNS,
  removeAttribute,
  removeAttributeNS
} = Element.prototype;
const tagNameGetter = getOwnPropertyDescriptor(Element.prototype, 'tagName').get;
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// that doesn't follow the regular transformation process. e.g.: `aria-labeledby` <=> `ariaLabelBy`

const ARIA_REGEX = /^aria/;
const nodeToAriaPropertyValuesMap = new WeakMap();
const {
  hasOwnProperty: hasOwnProperty$1
} = Object.prototype;
const {
  replace: StringReplace$1,
  toLowerCase: StringToLowerCase$1
} = String.prototype;

function getAriaPropertyMap(elm) {
  let map = nodeToAriaPropertyValuesMap.get(elm);

  if (map === undefined) {
    map = {};
    nodeToAriaPropertyValuesMap.set(elm, map);
  }

  return map;
}

function getNormalizedAriaPropertyValue(value) {
  return value == null ? null : value + '';
}

function createAriaPropertyPropertyDescriptor(propName, attrName) {
  return {
    get() {
      const map = getAriaPropertyMap(this);

      if (hasOwnProperty$1.call(map, propName)) {
        return map[propName];
      } // otherwise just reflect what's in the attribute


      return hasAttribute.call(this, attrName) ? getAttribute.call(this, attrName) : null;
    },

    set(newValue) {
      const normalizedValue = getNormalizedAriaPropertyValue(newValue);
      const map = getAriaPropertyMap(this);
      map[propName] = normalizedValue; // reflect into the corresponding attribute

      if (newValue === null) {
        removeAttribute.call(this, attrName);
      } else {
        setAttribute.call(this, attrName, newValue);
      }
    },

    configurable: true,
    enumerable: true
  };
}

function patch(propName) {
  // Typescript is inferring the wrong function type for this particular
  // overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
  // @ts-ignore type-mismatch
  const replaced = StringReplace$1.call(propName, ARIA_REGEX, 'aria-');
  const attrName = StringToLowerCase$1.call(replaced);
  const descriptor = createAriaPropertyPropertyDescriptor(propName, attrName);
  Object.defineProperty(Element.prototype, propName, descriptor);
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// https://wicg.github.io/aom/spec/aria-reflection.html


const ElementPrototypeAriaPropertyNames = ['ariaAutoComplete', 'ariaChecked', 'ariaCurrent', 'ariaDisabled', 'ariaExpanded', 'ariaHasPopup', 'ariaHidden', 'ariaInvalid', 'ariaLabel', 'ariaLevel', 'ariaMultiLine', 'ariaMultiSelectable', 'ariaOrientation', 'ariaPressed', 'ariaReadOnly', 'ariaRequired', 'ariaSelected', 'ariaSort', 'ariaValueMax', 'ariaValueMin', 'ariaValueNow', 'ariaValueText', 'ariaLive', 'ariaRelevant', 'ariaAtomic', 'ariaBusy', 'ariaActiveDescendant', 'ariaControls', 'ariaDescribedBy', 'ariaFlowTo', 'ariaLabelledBy', 'ariaOwns', 'ariaPosInSet', 'ariaSetSize', 'ariaColCount', 'ariaColIndex', 'ariaDetails', 'ariaErrorMessage', 'ariaKeyShortcuts', 'ariaModal', 'ariaPlaceholder', 'ariaRoleDescription', 'ariaRowCount', 'ariaRowIndex', 'ariaRowSpan', 'ariaColSpan', 'role'];
/**
 * Note: Attributes aria-dropeffect and aria-grabbed were deprecated in
 * ARIA 1.1 and do not have corresponding IDL attributes.
 */

for (let i = 0, len = ElementPrototypeAriaPropertyNames.length; i < len; i += 1) {
  const propName = ElementPrototypeAriaPropertyNames[i];

  if (detect$1(propName)) {
    patch(propName);
  }
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const defaultDefHTMLPropertyNames = ['accessKey', 'dir', 'draggable', 'hidden', 'id', 'lang', 'tabIndex', 'title']; // Few more exceptions that are using the attribute name to match the property in lowercase.
// this list was compiled from https://msdn.microsoft.com/en-us/library/ms533062(v=vs.85).aspx
// and https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
// Note: this list most be in sync with the compiler as well.

const HTMLPropertyNamesWithLowercasedReflectiveAttributes = ['accessKey', 'readOnly', 'tabIndex', 'bgColor', 'colSpan', 'rowSpan', 'contentEditable', 'dateTime', 'formAction', 'isMap', 'maxLength', 'useMap'];

function offsetPropertyErrorMessage(name) {
  return `Using the \`${name}\` property is an anti-pattern because it rounds the value to an integer. Instead, use the \`getBoundingClientRect\` method to obtain fractional values for the size of an element and its position relative to the viewport.`;
} // Global HTML Attributes & Properties
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement


const globalHTMLProperties = assign(create(null), {
  accessKey: {
    attribute: 'accesskey'
  },
  accessKeyLabel: {
    readOnly: true
  },
  className: {
    attribute: 'class',
    error: 'Using the `className` property is an anti-pattern because of slow runtime behavior and potential conflicts with classes provided by the owner element. Use the `classList` API instead.'
  },
  contentEditable: {
    attribute: 'contenteditable'
  },
  dataset: {
    readOnly: true,
    error: "Using the `dataset` property is an anti-pattern because it can't be statically analyzed. Expose each property individually using the `@api` decorator instead."
  },
  dir: {
    attribute: 'dir'
  },
  draggable: {
    attribute: 'draggable'
  },
  dropzone: {
    attribute: 'dropzone',
    readOnly: true
  },
  hidden: {
    attribute: 'hidden'
  },
  id: {
    attribute: 'id'
  },
  inputMode: {
    attribute: 'inputmode'
  },
  lang: {
    attribute: 'lang'
  },
  slot: {
    attribute: 'slot',
    error: 'Using the `slot` property is an anti-pattern.'
  },
  spellcheck: {
    attribute: 'spellcheck'
  },
  style: {
    attribute: 'style'
  },
  tabIndex: {
    attribute: 'tabindex'
  },
  title: {
    attribute: 'title'
  },
  translate: {
    attribute: 'translate'
  },
  // additional "global attributes" that are not present in the link above.
  isContentEditable: {
    readOnly: true
  },
  offsetHeight: {
    readOnly: true,
    error: offsetPropertyErrorMessage('offsetHeight')
  },
  offsetLeft: {
    readOnly: true,
    error: offsetPropertyErrorMessage('offsetLeft')
  },
  offsetParent: {
    readOnly: true
  },
  offsetTop: {
    readOnly: true,
    error: offsetPropertyErrorMessage('offsetTop')
  },
  offsetWidth: {
    readOnly: true,
    error: offsetPropertyErrorMessage('offsetWidth')
  },
  role: {
    attribute: 'role'
  }
});
const AttrNameToPropNameMap = create(null);
const PropNameToAttrNameMap = create(null); // Synthetic creation of all AOM property descriptors for Custom Elements

forEach.call(ElementPrototypeAriaPropertyNames, propName => {
  // Typescript is inferring the wrong function type for this particular
  // overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
  // @ts-ignore type-mismatch
  const attrName = StringToLowerCase.call(StringReplace.call(propName, /^aria/, 'aria-'));
  AttrNameToPropNameMap[attrName] = propName;
  PropNameToAttrNameMap[propName] = attrName;
});
forEach.call(defaultDefHTMLPropertyNames, propName => {
  const attrName = StringToLowerCase.call(propName);
  AttrNameToPropNameMap[attrName] = propName;
  PropNameToAttrNameMap[propName] = attrName;
});
forEach.call(HTMLPropertyNamesWithLowercasedReflectiveAttributes, propName => {
  const attrName = StringToLowerCase.call(propName);
  AttrNameToPropNameMap[attrName] = propName;
  PropNameToAttrNameMap[propName] = attrName;
});

const CAPS_REGEX = /[A-Z]/g;
/**
 * This method maps between property names
 * and the corresponding attribute name.
 */

function getAttrNameFromPropName(propName) {
  if (isUndefined(PropNameToAttrNameMap[propName])) {
    PropNameToAttrNameMap[propName] = StringReplace.call(propName, CAPS_REGEX, match => '-' + match.toLowerCase());
  }

  return PropNameToAttrNameMap[propName];
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const {
  createFieldName: createFieldName$1
} = fields;
let nextTickCallbackQueue = [];
const SPACE_CHAR = 32;
const EmptyObject = seal(create(null));
const EmptyArray = seal([]);
const ViewModelReflection = createFieldName$1('ViewModel', 'engine');

function flushCallbackQueue() {
  {
    if (nextTickCallbackQueue.length === 0) {
      throw new Error(`Internal Error: If callbackQueue is scheduled, it is because there must be at least one callback on this pending queue.`);
    }
  }

  const callbacks = nextTickCallbackQueue;
  nextTickCallbackQueue = []; // reset to a new queue

  for (let i = 0, len = callbacks.length; i < len; i += 1) {
    callbacks[i]();
  }
}

function addCallbackToNextTick(callback) {
  {
    if (!isFunction(callback)) {
      throw new Error(`Internal Error: addCallbackToNextTick() can only accept a function callback`);
    }
  }

  if (nextTickCallbackQueue.length === 0) {
    Promise.resolve().then(flushCallbackQueue);
  }

  ArrayPush.call(nextTickCallbackQueue, callback);
}

function isCircularModuleDependency(value) {
  return hasOwnProperty.call(value, '__circular__');
}
/**
 * When LWC is used in the context of an Aura application, the compiler produces AMD
 * modules, that doesn't resolve properly circular dependencies between modules. In order
 * to circumvent this issue, the module loader returns a factory with a symbol attached
 * to it.
 *
 * This method returns the resolved value if it received a factory as argument. Otherwise
 * it returns the original value.
 */


function resolveCircularModuleDependency(fn) {
  {
    if (!isFunction(fn)) {
      throw new TypeError(`Circular module dependency must be a function.`);
    }
  }

  return fn();
}

const useSyntheticShadow = hasOwnProperty.call(Element.prototype, '$shadowToken$');
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function getFormattedComponentStack(elm) {
  const componentStack = [];
  const indentationChar = '\t';
  let indentation = '';
  let currentNode = elm; // traversing up via getRootNode logic to find the component stack

  do {
    ArrayPush.call(componentStack, `${indentation}<${StringToLowerCase.call(tagNameGetter.call(currentNode))}>`);
    indentation = indentation + indentationChar;
    const newRootNode = currentNode.getRootNode();

    if (newRootNode === currentNode || newRootNode === document) {
      currentNode = null; // quitting
    } else if (newRootNode instanceof ShadowRoot) {
      currentNode = newRootNode.host;
    } else {
      // When the element is part of a tree that is not connected,
      // the root node will be the top element of that tree, e.g.:
      // `<div><p /></div>`, when calling p.getRootNode() it returns
      // the div reference. This branch covers that case.
      currentNode = newRootNode;
    }
  } while (!isNull(currentNode));

  return ArrayJoin.call(componentStack, '\n');
}

function logError(message, elm) {
  let msg = `[LWC error]: ${message}`;

  if (elm) {
    msg = `${msg}\n${getFormattedComponentStack(elm)}`;
  }

  try {
    throw new Error(msg);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.error(e);
  }
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


function handleEvent(event, vnode) {
  const {
    type
  } = event;
  const {
    data: {
      on
    }
  } = vnode;
  const handler = on && on[type]; // call event handler if exists

  if (handler) {
    handler.call(undefined, event);
  }
}

function createListener() {
  return function handler(event) {
    handleEvent(event, handler.vnode);
  };
}

function updateAllEventListeners(oldVnode, vnode) {
  if (isUndefined(oldVnode.listener)) {
    createAllEventListeners(vnode);
  } else {
    vnode.listener = oldVnode.listener;
    vnode.listener.vnode = vnode;
  }
}

function createAllEventListeners(vnode) {
  const {
    data: {
      on
    }
  } = vnode;

  if (isUndefined(on)) {
    return;
  }

  const elm = vnode.elm;
  const listener = vnode.listener = createListener();
  listener.vnode = vnode;
  let name;

  for (name in on) {
    elm.addEventListener(name, listener);
  }
}

var modEvents = {
  update: updateAllEventListeners,
  create: createAllEventListeners
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const ColonCharCode = 58;

function updateAttrs(oldVnode, vnode) {
  const {
    data: {
      attrs
    }
  } = vnode;

  if (isUndefined(attrs)) {
    return;
  }

  let {
    data: {
      attrs: oldAttrs
    }
  } = oldVnode;

  if (oldAttrs === attrs) {
    return;
  }

  {
    assert.invariant(isUndefined(oldAttrs) || keys(oldAttrs).join(',') === keys(attrs).join(','), `vnode.data.attrs cannot change shape.`);
  }

  const elm = vnode.elm;
  let key;
  oldAttrs = isUndefined(oldAttrs) ? EmptyObject : oldAttrs; // update modified attributes, add new attributes
  // this routine is only useful for data-* attributes in all kind of elements
  // and aria-* in standard elements (custom elements will use props for these)

  for (key in attrs) {
    const cur = attrs[key];
    const old = oldAttrs[key];

    if (old !== cur) {

      if (StringCharCodeAt.call(key, 3) === ColonCharCode) {
        // Assume xml namespace
        elm.setAttributeNS(xmlNS, key, cur);
      } else if (StringCharCodeAt.call(key, 5) === ColonCharCode) {
        // Assume xlink namespace
        elm.setAttributeNS(xlinkNS, key, cur);
      } else if (isNull(cur)) {
        elm.removeAttribute(key);
      } else {
        elm.setAttribute(key, cur);
      }
    }
  }
}

const emptyVNode = {
  data: {}
};
var modAttrs = {
  create: vnode => updateAttrs(emptyVNode, vnode),
  update: updateAttrs
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * This is a descriptor map that contains
 * all standard properties that a Custom Element can support (including AOM properties), which
 * determines what kind of capabilities the Base HTML Element and
 * Base Lightning Element should support.
 */

const HTMLElementOriginalDescriptors = create(null);
forEach.call(ElementPrototypeAriaPropertyNames, propName => {
  // Note: intentionally using our in-house getPropertyDescriptor instead of getOwnPropertyDescriptor here because
  // in IE11, some properties are on Element.prototype instead of HTMLElement, just to be sure.
  const descriptor = getPropertyDescriptor(HTMLElement.prototype, propName);

  if (!isUndefined(descriptor)) {
    HTMLElementOriginalDescriptors[propName] = descriptor;
  }
});
forEach.call(defaultDefHTMLPropertyNames, propName => {
  // Note: intentionally using our in-house getPropertyDescriptor instead of getOwnPropertyDescriptor here because
  // in IE11, id property is on Element.prototype instead of HTMLElement, and we suspect that more will fall into
  // this category, so, better to be sure.
  const descriptor = getPropertyDescriptor(HTMLElement.prototype, propName);

  if (!isUndefined(descriptor)) {
    HTMLElementOriginalDescriptors[propName] = descriptor;
  }
});
/**
 * Copyright (C) 2017 salesforce.com, inc.
 */

const {
  isArray: isArray$2
} = Array;
const {
  getPrototypeOf: getPrototypeOf$1,
  create: ObjectCreate,
  defineProperty: ObjectDefineProperty,
  defineProperties: ObjectDefineProperties,
  isExtensible,
  getOwnPropertyDescriptor: getOwnPropertyDescriptor$1,
  getOwnPropertyNames: getOwnPropertyNames$1,
  getOwnPropertySymbols,
  preventExtensions,
  hasOwnProperty: hasOwnProperty$2
} = Object;
const {
  push: ArrayPush$1,
  concat: ArrayConcat,
  map: ArrayMap$1
} = Array.prototype;
const OtS$1 = {}.toString;

function toString$1(obj) {
  if (obj && obj.toString) {
    return obj.toString();
  } else if (typeof obj === 'object') {
    return OtS$1.call(obj);
  } else {
    return obj + '';
  }
}

function isUndefined$1(obj) {
  return obj === undefined;
}

function isFunction$1(obj) {
  return typeof obj === 'function';
}

function isObject$2(obj) {
  return typeof obj === 'object';
}

const proxyToValueMap = new WeakMap();

function registerProxy(proxy, value) {
  proxyToValueMap.set(proxy, value);
}

const unwrap = replicaOrAny => proxyToValueMap.get(replicaOrAny) || replicaOrAny;

function wrapValue(membrane, value) {
  return membrane.valueIsObservable(value) ? membrane.getProxy(value) : value;
}
/**
 * Unwrap property descriptors will set value on original descriptor
 * We only need to unwrap if value is specified
 * @param descriptor external descrpitor provided to define new property on original value
 */


function unwrapDescriptor(descriptor) {
  if (hasOwnProperty$2.call(descriptor, 'value')) {
    descriptor.value = unwrap(descriptor.value);
  }

  return descriptor;
}

function lockShadowTarget(membrane, shadowTarget, originalTarget) {
  const targetKeys = ArrayConcat.call(getOwnPropertyNames$1(originalTarget), getOwnPropertySymbols(originalTarget));
  targetKeys.forEach(key => {
    let descriptor = getOwnPropertyDescriptor$1(originalTarget, key); // We do not need to wrap the descriptor if configurable
    // Because we can deal with wrapping it when user goes through
    // Get own property descriptor. There is also a chance that this descriptor
    // could change sometime in the future, so we can defer wrapping
    // until we need to

    if (!descriptor.configurable) {
      descriptor = wrapDescriptor(membrane, descriptor, wrapValue);
    }

    ObjectDefineProperty(shadowTarget, key, descriptor);
  });
  preventExtensions(shadowTarget);
}

class ReactiveProxyHandler {
  constructor(membrane, value) {
    this.originalTarget = value;
    this.membrane = membrane;
  }

  get(shadowTarget, key) {
    const {
      originalTarget,
      membrane
    } = this;
    const value = originalTarget[key];
    const {
      valueObserved
    } = membrane;
    valueObserved(originalTarget, key);
    return membrane.getProxy(value);
  }

  set(shadowTarget, key, value) {
    const {
      originalTarget,
      membrane: {
        valueMutated
      }
    } = this;
    const oldValue = originalTarget[key];

    if (oldValue !== value) {
      originalTarget[key] = value;
      valueMutated(originalTarget, key);
    } else if (key === 'length' && isArray$2(originalTarget)) {
      // fix for issue #236: push will add the new index, and by the time length
      // is updated, the internal length is already equal to the new length value
      // therefore, the oldValue is equal to the value. This is the forking logic
      // to support this use case.
      valueMutated(originalTarget, key);
    }

    return true;
  }

  deleteProperty(shadowTarget, key) {
    const {
      originalTarget,
      membrane: {
        valueMutated
      }
    } = this;
    delete originalTarget[key];
    valueMutated(originalTarget, key);
    return true;
  }

  apply(shadowTarget, thisArg, argArray) {
    /* No op */
  }

  construct(target, argArray, newTarget) {
    /* No op */
  }

  has(shadowTarget, key) {
    const {
      originalTarget,
      membrane: {
        valueObserved
      }
    } = this;
    valueObserved(originalTarget, key);
    return key in originalTarget;
  }

  ownKeys(shadowTarget) {
    const {
      originalTarget
    } = this;
    return ArrayConcat.call(getOwnPropertyNames$1(originalTarget), getOwnPropertySymbols(originalTarget));
  }

  isExtensible(shadowTarget) {
    const shadowIsExtensible = isExtensible(shadowTarget);

    if (!shadowIsExtensible) {
      return shadowIsExtensible;
    }

    const {
      originalTarget,
      membrane
    } = this;
    const targetIsExtensible = isExtensible(originalTarget);

    if (!targetIsExtensible) {
      lockShadowTarget(membrane, shadowTarget, originalTarget);
    }

    return targetIsExtensible;
  }

  setPrototypeOf(shadowTarget, prototype) {
    {
      throw new Error(`Invalid setPrototypeOf invocation for reactive proxy ${toString$1(this.originalTarget)}. Prototype of reactive objects cannot be changed.`);
    }
  }

  getPrototypeOf(shadowTarget) {
    const {
      originalTarget
    } = this;
    return getPrototypeOf$1(originalTarget);
  }

  getOwnPropertyDescriptor(shadowTarget, key) {
    const {
      originalTarget,
      membrane
    } = this;
    const {
      valueObserved
    } = this.membrane; // keys looked up via hasOwnProperty need to be reactive

    valueObserved(originalTarget, key);
    let desc = getOwnPropertyDescriptor$1(originalTarget, key);

    if (isUndefined$1(desc)) {
      return desc;
    }

    const shadowDescriptor = getOwnPropertyDescriptor$1(shadowTarget, key);

    if (!isUndefined$1(shadowDescriptor)) {
      return shadowDescriptor;
    } // Note: by accessing the descriptor, the key is marked as observed
    // but access to the value, setter or getter (if available) cannot observe
    // mutations, just like regular methods, in which case we just do nothing.


    desc = wrapDescriptor(membrane, desc, wrapValue);

    if (!desc.configurable) {
      // If descriptor from original target is not configurable,
      // We must copy the wrapped descriptor over to the shadow target.
      // Otherwise, proxy will throw an invariant error.
      // This is our last chance to lock the value.
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor#Invariants
      ObjectDefineProperty(shadowTarget, key, desc);
    }

    return desc;
  }

  preventExtensions(shadowTarget) {
    const {
      originalTarget,
      membrane
    } = this;
    lockShadowTarget(membrane, shadowTarget, originalTarget);
    preventExtensions(originalTarget);
    return true;
  }

  defineProperty(shadowTarget, key, descriptor) {
    const {
      originalTarget,
      membrane
    } = this;
    const {
      valueMutated
    } = membrane;
    const {
      configurable
    } = descriptor; // We have to check for value in descriptor
    // because Object.freeze(proxy) calls this method
    // with only { configurable: false, writeable: false }
    // Additionally, method will only be called with writeable:false
    // if the descriptor has a value, as opposed to getter/setter
    // So we can just check if writable is present and then see if
    // value is present. This eliminates getter and setter descriptors

    if (hasOwnProperty$2.call(descriptor, 'writable') && !hasOwnProperty$2.call(descriptor, 'value')) {
      const originalDescriptor = getOwnPropertyDescriptor$1(originalTarget, key);
      descriptor.value = originalDescriptor.value;
    }

    ObjectDefineProperty(originalTarget, key, unwrapDescriptor(descriptor));

    if (configurable === false) {
      ObjectDefineProperty(shadowTarget, key, wrapDescriptor(membrane, descriptor, wrapValue));
    }

    valueMutated(originalTarget, key);
    return true;
  }

}

function wrapReadOnlyValue(membrane, value) {
  return membrane.valueIsObservable(value) ? membrane.getReadOnlyProxy(value) : value;
}

class ReadOnlyHandler {
  constructor(membrane, value) {
    this.originalTarget = value;
    this.membrane = membrane;
  }

  get(shadowTarget, key) {
    const {
      membrane,
      originalTarget
    } = this;
    const value = originalTarget[key];
    const {
      valueObserved
    } = membrane;
    valueObserved(originalTarget, key);
    return membrane.getReadOnlyProxy(value);
  }

  set(shadowTarget, key, value) {
    {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid mutation: Cannot set "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`);
    }
  }

  deleteProperty(shadowTarget, key) {
    {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid mutation: Cannot delete "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`);
    }
  }

  apply(shadowTarget, thisArg, argArray) {
    /* No op */
  }

  construct(target, argArray, newTarget) {
    /* No op */
  }

  has(shadowTarget, key) {
    const {
      originalTarget,
      membrane: {
        valueObserved
      }
    } = this;
    valueObserved(originalTarget, key);
    return key in originalTarget;
  }

  ownKeys(shadowTarget) {
    const {
      originalTarget
    } = this;
    return ArrayConcat.call(getOwnPropertyNames$1(originalTarget), getOwnPropertySymbols(originalTarget));
  }

  setPrototypeOf(shadowTarget, prototype) {
    {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid prototype mutation: Cannot set prototype on "${originalTarget}". "${originalTarget}" prototype is read-only.`);
    }
  }

  getOwnPropertyDescriptor(shadowTarget, key) {
    const {
      originalTarget,
      membrane
    } = this;
    const {
      valueObserved
    } = membrane; // keys looked up via hasOwnProperty need to be reactive

    valueObserved(originalTarget, key);
    let desc = getOwnPropertyDescriptor$1(originalTarget, key);

    if (isUndefined$1(desc)) {
      return desc;
    }

    const shadowDescriptor = getOwnPropertyDescriptor$1(shadowTarget, key);

    if (!isUndefined$1(shadowDescriptor)) {
      return shadowDescriptor;
    } // Note: by accessing the descriptor, the key is marked as observed
    // but access to the value or getter (if available) cannot be observed,
    // just like regular methods, in which case we just do nothing.


    desc = wrapDescriptor(membrane, desc, wrapReadOnlyValue);

    if (hasOwnProperty$2.call(desc, 'set')) {
      desc.set = undefined; // readOnly membrane does not allow setters
    }

    if (!desc.configurable) {
      // If descriptor from original target is not configurable,
      // We must copy the wrapped descriptor over to the shadow target.
      // Otherwise, proxy will throw an invariant error.
      // This is our last chance to lock the value.
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor#Invariants
      ObjectDefineProperty(shadowTarget, key, desc);
    }

    return desc;
  }

  preventExtensions(shadowTarget) {
    {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid mutation: Cannot preventExtensions on ${originalTarget}". "${originalTarget} is read-only.`);
    }
  }

  defineProperty(shadowTarget, key, descriptor) {
    {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid mutation: Cannot defineProperty "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`);
    }
  }

}

function extract(objectOrArray) {
  if (isArray$2(objectOrArray)) {
    return objectOrArray.map(item => {
      const original = unwrap(item);

      if (original !== item) {
        return extract(original);
      }

      return item;
    });
  }

  const obj = ObjectCreate(getPrototypeOf$1(objectOrArray));
  const names = getOwnPropertyNames$1(objectOrArray);
  return ArrayConcat.call(names, getOwnPropertySymbols(objectOrArray)).reduce((seed, key) => {
    const item = objectOrArray[key];
    const original = unwrap(item);

    if (original !== item) {
      seed[key] = extract(original);
    } else {
      seed[key] = item;
    }

    return seed;
  }, obj);
}

const formatter = {
  header: plainOrProxy => {
    const originalTarget = unwrap(plainOrProxy); // if originalTarget is falsy or not unwrappable, exit

    if (!originalTarget || originalTarget === plainOrProxy) {
      return null;
    }

    const obj = extract(plainOrProxy);
    return ['object', {
      object: obj
    }];
  },
  hasBody: () => {
    return false;
  },
  body: () => {
    return null;
  }
}; // Inspired from paulmillr/es6-shim
// https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js#L176-L185

function getGlobal() {
  // the only reliable means to get the global object is `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }

  if (typeof self !== 'undefined') {
    return self;
  }

  if (typeof window !== 'undefined') {
    return window;
  }

  if (typeof global !== 'undefined') {
    return global;
  } // Gracefully degrade if not able to locate the global object


  return {};
}

function init() {

  const global = getGlobal(); // Custom Formatter for Dev Tools. To enable this, open Chrome Dev Tools
  //  - Go to Settings,
  //  - Under console, select "Enable custom formatters"
  // For more information, https://docs.google.com/document/d/1FTascZXT9cxfetuPRT2eXPQKXui4nWFivUnS_335T3U/preview

  const devtoolsFormatters = global.devtoolsFormatters || [];
  ArrayPush$1.call(devtoolsFormatters, formatter);
  global.devtoolsFormatters = devtoolsFormatters;
}

{
  init();
}

function createShadowTarget(value) {
  let shadowTarget = undefined;

  if (isArray$2(value)) {
    shadowTarget = [];
  } else if (isObject$2(value)) {
    shadowTarget = {};
  }

  return shadowTarget;
}

const ObjectDotPrototype = Object.prototype;

function defaultValueIsObservable(value) {
  // intentionally checking for null
  if (value === null) {
    return false;
  } // treat all non-object types, including undefined, as non-observable values


  if (typeof value !== 'object') {
    return false;
  }

  if (isArray$2(value)) {
    return true;
  }

  const proto = getPrototypeOf$1(value);
  return proto === ObjectDotPrototype || proto === null || getPrototypeOf$1(proto) === null;
}

const defaultValueObserved = (obj, key) => {
  /* do nothing */
};

const defaultValueMutated = (obj, key) => {
  /* do nothing */
};

const defaultValueDistortion = value => value;

function wrapDescriptor(membrane, descriptor, getValue) {
  const {
    set,
    get
  } = descriptor;

  if (hasOwnProperty$2.call(descriptor, 'value')) {
    descriptor.value = getValue(membrane, descriptor.value);
  } else {
    if (!isUndefined$1(get)) {
      descriptor.get = function () {
        // invoking the original getter with the original target
        return getValue(membrane, get.call(unwrap(this)));
      };
    }

    if (!isUndefined$1(set)) {
      descriptor.set = function (value) {
        // At this point we don't have a clear indication of whether
        // or not a valid mutation will occur, we don't have the key,
        // and we are not sure why and how they are invoking this setter.
        // Nevertheless we preserve the original semantics by invoking the
        // original setter with the original target and the unwrapped value
        set.call(unwrap(this), membrane.unwrapProxy(value));
      };
    }
  }

  return descriptor;
}

class ReactiveMembrane {
  constructor(options) {
    this.valueDistortion = defaultValueDistortion;
    this.valueMutated = defaultValueMutated;
    this.valueObserved = defaultValueObserved;
    this.valueIsObservable = defaultValueIsObservable;
    this.objectGraph = new WeakMap();

    if (!isUndefined$1(options)) {
      const {
        valueDistortion,
        valueMutated,
        valueObserved,
        valueIsObservable
      } = options;
      this.valueDistortion = isFunction$1(valueDistortion) ? valueDistortion : defaultValueDistortion;
      this.valueMutated = isFunction$1(valueMutated) ? valueMutated : defaultValueMutated;
      this.valueObserved = isFunction$1(valueObserved) ? valueObserved : defaultValueObserved;
      this.valueIsObservable = isFunction$1(valueIsObservable) ? valueIsObservable : defaultValueIsObservable;
    }
  }

  getProxy(value) {
    const unwrappedValue = unwrap(value);
    const distorted = this.valueDistortion(unwrappedValue);

    if (this.valueIsObservable(distorted)) {
      const o = this.getReactiveState(unwrappedValue, distorted); // when trying to extract the writable version of a readonly
      // we return the readonly.

      return o.readOnly === value ? value : o.reactive;
    }

    return distorted;
  }

  getReadOnlyProxy(value) {
    value = unwrap(value);
    const distorted = this.valueDistortion(value);

    if (this.valueIsObservable(distorted)) {
      return this.getReactiveState(value, distorted).readOnly;
    }

    return distorted;
  }

  unwrapProxy(p) {
    return unwrap(p);
  }

  getReactiveState(value, distortedValue) {
    const {
      objectGraph
    } = this;
    let reactiveState = objectGraph.get(distortedValue);

    if (reactiveState) {
      return reactiveState;
    }

    const membrane = this;
    reactiveState = {
      get reactive() {
        const reactiveHandler = new ReactiveProxyHandler(membrane, distortedValue); // caching the reactive proxy after the first time it is accessed

        const proxy = new Proxy(createShadowTarget(distortedValue), reactiveHandler);
        registerProxy(proxy, value);
        ObjectDefineProperty(this, 'reactive', {
          value: proxy
        });
        return proxy;
      },

      get readOnly() {
        const readOnlyHandler = new ReadOnlyHandler(membrane, distortedValue); // caching the readOnly proxy after the first time it is accessed

        const proxy = new Proxy(createShadowTarget(distortedValue), readOnlyHandler);
        registerProxy(proxy, value);
        ObjectDefineProperty(this, 'readOnly', {
          value: proxy
        });
        return proxy;
      }

    };
    objectGraph.set(distortedValue, reactiveState);
    return reactiveState;
  }

}
/** version: 0.26.0 */

/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const {
  create: create$1
} = Object;
const {
  splice: ArraySplice$1,
  indexOf: ArrayIndexOf$1,
  push: ArrayPush$2
} = Array.prototype;
const TargetToReactiveRecordMap = new WeakMap();

function isUndefined$2(obj) {
  return obj === undefined;
}

function getReactiveRecord(target) {
  let reactiveRecord = TargetToReactiveRecordMap.get(target);

  if (isUndefined$2(reactiveRecord)) {
    const newRecord = create$1(null);
    reactiveRecord = newRecord;
    TargetToReactiveRecordMap.set(target, newRecord);
  }

  return reactiveRecord;
}

let currentReactiveObserver = null;

function valueMutated(target, key) {
  const reactiveRecord = TargetToReactiveRecordMap.get(target);

  if (!isUndefined$2(reactiveRecord)) {
    const reactiveObservers = reactiveRecord[key];

    if (!isUndefined$2(reactiveObservers)) {
      for (let i = 0, len = reactiveObservers.length; i < len; i += 1) {
        const ro = reactiveObservers[i];
        ro.notify();
      }
    }
  }
}

function valueObserved(target, key) {
  // We should determine if an active Observing Record is present to track mutations.
  if (currentReactiveObserver === null) {
    return;
  }

  const ro = currentReactiveObserver;
  const reactiveRecord = getReactiveRecord(target);
  let reactiveObservers = reactiveRecord[key];

  if (isUndefined$2(reactiveObservers)) {
    reactiveObservers = [];
    reactiveRecord[key] = reactiveObservers;
  } else if (reactiveObservers[0] === ro) {
    return; // perf optimization considering that most subscriptions will come from the same record
  }

  if (ArrayIndexOf$1.call(reactiveObservers, ro) === -1) {
    ro.link(reactiveObservers);
  }
}

class ReactiveObserver {
  constructor(callback) {
    this.listeners = [];
    this.callback = callback;
  }

  observe(job) {
    const inceptionReactiveRecord = currentReactiveObserver;
    currentReactiveObserver = this;
    let error;

    try {
      job();
    } catch (e) {
      error = Object(e);
    } finally {
      currentReactiveObserver = inceptionReactiveRecord;

      if (error !== undefined) {
        throw error; // eslint-disable-line no-unsafe-finally
      }
    }
  }
  /**
   * This method is responsible for disconnecting the Reactive Observer
   * from any Reactive Record that has a reference to it, to prevent future
   * notifications about previously recorded access.
   */


  reset() {
    const {
      listeners
    } = this;
    const len = listeners.length;

    if (len > 0) {
      for (let i = 0; i < len; i += 1) {
        const set = listeners[i];
        const pos = ArrayIndexOf$1.call(listeners[i], this);
        ArraySplice$1.call(set, pos, 1);
      }

      listeners.length = 0;
    }
  } // friend methods


  notify() {
    this.callback.call(undefined, this);
  }

  link(reactiveObservers) {
    ArrayPush$2.call(reactiveObservers, this); // we keep track of observing records where the observing record was added to so we can do some clean up later on

    ArrayPush$2.call(this.listeners, reactiveObservers);
  }

}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


function valueDistortion(value) {
  return value;
}

const reactiveMembrane = new ReactiveMembrane({
  valueObserved,
  valueMutated,
  valueDistortion
});
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


function prepareForPropUpdate(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }
} // A bridge descriptor is a descriptor whose job is just to get the component instance
// from the element instance, and get the value or set a new value on the component.
// This means that across different elements, similar names can get the exact same
// descriptor, so we can cache them:


const cachedGetterByKey = create(null);
const cachedSetterByKey = create(null);

function createGetter(key) {
  let fn = cachedGetterByKey[key];

  if (isUndefined(fn)) {
    fn = cachedGetterByKey[key] = function () {
      const vm = getCustomElementVM(this);
      const {
        getHook
      } = vm;
      return getHook(vm.component, key);
    };
  }

  return fn;
}

function createSetter(key) {
  let fn = cachedSetterByKey[key];

  if (isUndefined(fn)) {
    fn = cachedSetterByKey[key] = function (newValue) {
      const vm = getCustomElementVM(this);
      const {
        setHook
      } = vm;
      newValue = reactiveMembrane.getReadOnlyProxy(newValue);
      setHook(vm.component, key, newValue);
    };
  }

  return fn;
}

function createMethodCaller(methodName) {
  return function () {
    const vm = getCustomElementVM(this);
    const {
      callHook,
      component
    } = vm;
    const fn = component[methodName];
    return callHook(vm.component, fn, ArraySlice$1.call(arguments));
  };
}

function HTMLBridgeElementFactory(SuperClass, props, methods) {
  let HTMLBridgeElement;
  /**
   * Modern browsers will have all Native Constructors as regular Classes
   * and must be instantiated with the new keyword. In older browsers,
   * specifically IE11, those are objects with a prototype property defined,
   * since they are not supposed to be extended or instantiated with the
   * new keyword. This forking logic supports both cases, specifically because
   * wc.ts relies on the construction path of the bridges to create new
   * fully qualifying web components.
   */

  if (isFunction(SuperClass)) {
    HTMLBridgeElement = class extends SuperClass {};
  } else {
    HTMLBridgeElement = function () {
      // Bridge classes are not supposed to be instantiated directly in
      // browsers that do not support web components.
      throw new TypeError('Illegal constructor');
    }; // prototype inheritance dance


    setPrototypeOf(HTMLBridgeElement, SuperClass);
    setPrototypeOf(HTMLBridgeElement.prototype, SuperClass.prototype);
    defineProperty(HTMLBridgeElement.prototype, 'constructor', {
      writable: true,
      configurable: true,
      value: HTMLBridgeElement
    });
  }

  const descriptors = create(null); // expose getters and setters for each public props on the new Element Bridge

  for (let i = 0, len = props.length; i < len; i += 1) {
    const propName = props[i];
    descriptors[propName] = {
      get: createGetter(propName),
      set: createSetter(propName),
      enumerable: true,
      configurable: true
    };
  } // expose public methods as props on the new Element Bridge


  for (let i = 0, len = methods.length; i < len; i += 1) {
    const methodName = methods[i];
    descriptors[methodName] = {
      value: createMethodCaller(methodName),
      writable: true,
      configurable: true
    };
  }

  defineProperties(HTMLBridgeElement.prototype, descriptors);
  return HTMLBridgeElement;
}

const BaseBridgeElement = HTMLBridgeElementFactory(HTMLElement, getOwnPropertyNames(HTMLElementOriginalDescriptors), []);
freeze(BaseBridgeElement);
seal(BaseBridgeElement.prototype);
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const {
  getHiddenField: getHiddenField$1
} = fields;

function isLiveBindingProp(sel, key) {
  // For special whitelisted properties, we check against the actual property value on the DOM element instead of
  // relying on tracked property values.
  return sel === 'input' && (key === 'value' || key === 'checked');
}

function update(oldVnode, vnode) {
  const props = vnode.data.props;

  if (isUndefined(props)) {
    return;
  }

  const oldProps = oldVnode.data.props;

  if (oldProps === props) {
    return;
  }

  {
    assert.invariant(isUndefined(oldProps) || keys(oldProps).join(',') === keys(props).join(','), 'vnode.data.props cannot change shape.');
  }

  const elm = vnode.elm;
  const vm = getHiddenField$1(elm, ViewModelReflection);
  const isFirstPatch = isUndefined(oldProps);
  const isCustomElement = !isUndefined(vm);
  const {
    sel
  } = vnode;

  for (const key in props) {
    const cur = props[key];

    {
      if (!(key in elm)) {
        // TODO: #1297 - Move this validation to the compiler
        assert.fail(`Unknown public property "${key}" of element <${sel}>. This is likely a typo on the corresponding attribute "${getAttrNameFromPropName(key)}".`);
      }
    } // if it is the first time this element is patched, or the current value is different to the previous value...


    if (isFirstPatch || cur !== (isLiveBindingProp(sel, key) ? elm[key] : oldProps[key])) {
      if (isCustomElement) {
        prepareForPropUpdate(vm); // this is just in case the vnode is actually a custom element
      }

      elm[key] = cur;
    }
  }
}

const emptyVNode$1 = {
  data: {}
};
var modProps = {
  create: vnode => update(emptyVNode$1, vnode),
  update
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const classNameToClassMap = create(null);

function getMapFromClassName(className) {
  // Intentionally using == to match undefined and null values from computed style attribute
  if (className == null) {
    return EmptyObject;
  } // computed class names must be string


  className = isString(className) ? className : className + '';
  let map = classNameToClassMap[className];

  if (map) {
    return map;
  }

  map = create(null);
  let start = 0;
  let o;
  const len = className.length;

  for (o = 0; o < len; o++) {
    if (StringCharCodeAt.call(className, o) === SPACE_CHAR) {
      if (o > start) {
        map[StringSlice.call(className, start, o)] = true;
      }

      start = o + 1;
    }
  }

  if (o > start) {
    map[StringSlice.call(className, start, o)] = true;
  }

  classNameToClassMap[className] = map;

  {
    // just to make sure that this object never changes as part of the diffing algo
    freeze(map);
  }

  return map;
}

function updateClassAttribute(oldVnode, vnode) {
  const {
    elm,
    data: {
      className: newClass
    }
  } = vnode;
  const {
    data: {
      className: oldClass
    }
  } = oldVnode;

  if (oldClass === newClass) {
    return;
  }

  const {
    classList
  } = elm;
  const newClassMap = getMapFromClassName(newClass);
  const oldClassMap = getMapFromClassName(oldClass);
  let name;

  for (name in oldClassMap) {
    // remove only if it is not in the new class collection and it is not set from within the instance
    if (isUndefined(newClassMap[name])) {
      classList.remove(name);
    }
  }

  for (name in newClassMap) {
    if (isUndefined(oldClassMap[name])) {
      classList.add(name);
    }
  }
}

const emptyVNode$2 = {
  data: {}
};
var modComputedClassName = {
  create: vnode => updateClassAttribute(emptyVNode$2, vnode),
  update: updateClassAttribute
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function updateStyleAttribute(oldVnode, vnode) {
  const {
    style: newStyle
  } = vnode.data;

  if (oldVnode.data.style === newStyle) {
    return;
  }

  const elm = vnode.elm;
  const {
    style
  } = elm;

  if (!isString(newStyle) || newStyle === '') {
    removeAttribute.call(elm, 'style');
  } else {
    style.cssText = newStyle;
  }
}

const emptyVNode$3 = {
  data: {}
};
var modComputedStyle = {
  create: vnode => updateStyleAttribute(emptyVNode$3, vnode),
  update: updateStyleAttribute
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// The compiler takes care of transforming the inline classnames into an object. It's faster to set the
// different classnames properties individually instead of via a string.

function createClassAttribute(vnode) {
  const {
    elm,
    data: {
      classMap
    }
  } = vnode;

  if (isUndefined(classMap)) {
    return;
  }

  const {
    classList
  } = elm;

  for (const name in classMap) {
    classList.add(name);
  }
}

var modStaticClassName = {
  create: createClassAttribute
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// The compiler takes care of transforming the inline style into an object. It's faster to set the
// different style properties individually instead of via a string.

function createStyleAttribute(vnode) {
  const {
    elm,
    data: {
      styleMap
    }
  } = vnode;

  if (isUndefined(styleMap)) {
    return;
  }

  const {
    style
  } = elm;

  for (const name in styleMap) {
    style[name] = styleMap[name];
  }
}

var modStaticStyle = {
  create: createStyleAttribute
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const {
  getHiddenField: getHiddenField$2
} = fields;

function createContext(vnode) {
  const {
    data: {
      context
    }
  } = vnode;

  if (isUndefined(context)) {
    return;
  }

  const elm = vnode.elm;
  const vm = getHiddenField$2(elm, ViewModelReflection);

  if (!isUndefined(vm)) {
    assign(vm.context, context);
  }
}

const contextModule = {
  create: createContext
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
@license
Copyright (c) 2015 Simon Friis Vindum.
This code may only be used under the MIT License found at
https://github.com/snabbdom/snabbdom/blob/master/LICENSE
Code distributed by Snabbdom as part of the Snabbdom project at
https://github.com/snabbdom/snabbdom/
*/

function isUndef(s) {
  return s === undefined;
}

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function isVNode(vnode) {
  return vnode != null;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  const map = {};
  let j, key, ch; // TODO: simplify this by assuming that all vnodes has keys

  for (j = beginIdx; j <= endIdx; ++j) {
    ch = children[j];

    if (isVNode(ch)) {
      key = ch.key;

      if (key !== undefined) {
        map[key] = j;
      }
    }
  }

  return map;
}

function addVnodes(parentElm, before, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];

    if (isVNode(ch)) {
      ch.hook.create(ch);
      ch.hook.insert(ch, parentElm, before);
    }
  }
}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx]; // text nodes do not have logic associated to them

    if (isVNode(ch)) {
      ch.hook.remove(ch, parentElm);
    }
  }
}

function updateDynamicChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx;
  let idxInOld;
  let elmToMove;
  let before;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (!isVNode(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
    } else if (!isVNode(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (!isVNode(newStartVnode)) {
      newStartVnode = newCh[++newStartIdx];
    } else if (!isVNode(newEndVnode)) {
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode);
      newEndVnode.hook.move(oldStartVnode, parentElm, // TODO: resolve this, but using dot notation for nextSibling for now
      oldEndVnode.elm.nextSibling);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode);
      newStartVnode.hook.move(oldEndVnode, parentElm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }

      idxInOld = oldKeyToIdx[newStartVnode.key];

      if (isUndef(idxInOld)) {
        // New element
        newStartVnode.hook.create(newStartVnode);
        newStartVnode.hook.insert(newStartVnode, parentElm, oldStartVnode.elm);
        newStartVnode = newCh[++newStartIdx];
      } else {
        elmToMove = oldCh[idxInOld];

        if (isVNode(elmToMove)) {
          if (elmToMove.sel !== newStartVnode.sel) {
            // New element
            newStartVnode.hook.create(newStartVnode);
            newStartVnode.hook.insert(newStartVnode, parentElm, oldStartVnode.elm);
          } else {
            patchVnode(elmToMove, newStartVnode);
            oldCh[idxInOld] = undefined;
            newStartVnode.hook.move(elmToMove, parentElm, oldStartVnode.elm);
          }
        }

        newStartVnode = newCh[++newStartIdx];
      }
    }
  }

  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      const n = newCh[newEndIdx + 1];
      before = isVNode(n) ? n.elm : null;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx);
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }
}

function updateStaticChildren(parentElm, oldCh, newCh) {
  const {
    length
  } = newCh;

  if (oldCh.length === 0) {
    // the old list is empty, we can directly insert anything new
    addVnodes(parentElm, null, newCh, 0, length);
    return;
  } // if the old list is not empty, the new list MUST have the same
  // amount of nodes, that's why we call this static children


  let referenceElm = null;

  for (let i = length - 1; i >= 0; i -= 1) {
    const vnode = newCh[i];
    const oldVNode = oldCh[i];

    if (vnode !== oldVNode) {
      if (isVNode(oldVNode)) {
        if (isVNode(vnode)) {
          // both vnodes must be equivalent, and se just need to patch them
          patchVnode(oldVNode, vnode);
          referenceElm = vnode.elm;
        } else {
          // removing the old vnode since the new one is null
          oldVNode.hook.remove(oldVNode, parentElm);
        }
      } else if (isVNode(vnode)) {
        // this condition is unnecessary
        vnode.hook.create(vnode); // insert the new node one since the old one is null

        vnode.hook.insert(vnode, parentElm, referenceElm);
        referenceElm = vnode.elm;
      }
    }
  }
}

function patchVnode(oldVnode, vnode) {
  if (oldVnode !== vnode) {
    vnode.elm = oldVnode.elm;
    vnode.hook.update(oldVnode, vnode);
  }
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


function generateDataDescriptor(options) {
  return assign({
    configurable: true,
    enumerable: true,
    writable: true
  }, options);
}

function generateAccessorDescriptor(options) {
  return assign({
    configurable: true,
    enumerable: true
  }, options);
}

let isDomMutationAllowed = false;

function unlockDomMutation() {

  isDomMutationAllowed = true;
}

function lockDomMutation() {

  isDomMutationAllowed = false;
}

function portalRestrictionErrorMessage(name, type) {
  return `The \`${name}\` ${type} is available only on elements that use the \`lwc:dom="manual"\` directive.`;
}

function getNodeRestrictionsDescriptors(node, options) {
  // and returns the first descriptor for the property


  const originalTextContentDescriptor = getPropertyDescriptor(node, 'textContent');
  const originalNodeValueDescriptor = getPropertyDescriptor(node, 'nodeValue');
  const {
    appendChild,
    insertBefore,
    removeChild,
    replaceChild
  } = node;
  return {
    appendChild: generateDataDescriptor({
      value(aChild) {
        if (this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('appendChild', 'method'), this);
        }

        return appendChild.call(this, aChild);
      }

    }),
    insertBefore: generateDataDescriptor({
      value(newNode, referenceNode) {
        if (!isDomMutationAllowed && this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('insertBefore', 'method'), this);
        }

        return insertBefore.call(this, newNode, referenceNode);
      }

    }),
    removeChild: generateDataDescriptor({
      value(aChild) {
        if (!isDomMutationAllowed && this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('removeChild', 'method'), this);
        }

        return removeChild.call(this, aChild);
      }

    }),
    replaceChild: generateDataDescriptor({
      value(newChild, oldChild) {
        if (this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('replaceChild', 'method'), this);
        }

        return replaceChild.call(this, newChild, oldChild);
      }

    }),
    nodeValue: generateAccessorDescriptor({
      get() {
        return originalNodeValueDescriptor.get.call(this);
      },

      set(value) {
        if (!isDomMutationAllowed && this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('nodeValue', 'property'), this);
        }

        originalNodeValueDescriptor.set.call(this, value);
      }

    }),
    textContent: generateAccessorDescriptor({
      get() {
        return originalTextContentDescriptor.get.call(this);
      },

      set(value) {
        if (this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('textContent', 'property'), this);
        }

        originalTextContentDescriptor.set.call(this, value);
      }

    })
  };
}

function getElementRestrictionsDescriptors(elm, options) {

  const descriptors = getNodeRestrictionsDescriptors(elm, options);
  const originalInnerHTMLDescriptor = getPropertyDescriptor(elm, 'innerHTML');
  const originalOuterHTMLDescriptor = getPropertyDescriptor(elm, 'outerHTML');
  assign(descriptors, {
    innerHTML: generateAccessorDescriptor({
      get() {
        return originalInnerHTMLDescriptor.get.call(this);
      },

      set(value) {
        if (isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('innerHTML', 'property'), this);
        }

        return originalInnerHTMLDescriptor.set.call(this, value);
      }

    }),
    outerHTML: generateAccessorDescriptor({
      get() {
        return originalOuterHTMLDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set outerHTML on Element.`);
      }

    })
  });
  return descriptors;
}

function getShadowRootRestrictionsDescriptors(sr, options) {
  // thing when using the real shadow root, because if that's the case,
  // the component will not work when running with synthetic shadow.


  const originalQuerySelector = sr.querySelector;
  const originalQuerySelectorAll = sr.querySelectorAll;
  const originalAddEventListener = sr.addEventListener;
  const descriptors = getNodeRestrictionsDescriptors(sr, options);
  const originalInnerHTMLDescriptor = getPropertyDescriptor(sr, 'innerHTML');
  const originalTextContentDescriptor = getPropertyDescriptor(sr, 'textContent');
  assign(descriptors, {
    innerHTML: generateAccessorDescriptor({
      get() {
        return originalInnerHTMLDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set innerHTML on ShadowRoot.`);
      }

    }),
    textContent: generateAccessorDescriptor({
      get() {
        return originalTextContentDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set textContent on ShadowRoot.`);
      }

    }),
    addEventListener: generateDataDescriptor({
      value(type, listener, options) {
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${toString(sr)} by adding an event listener for "${type}".`);
        assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${toString(sr)} by adding an event listener for "${type}".`); // TODO: #420 - this is triggered when the component author attempts to add a listener
        // programmatically into its Component's shadow root

        if (!isUndefined(options)) {
          logError('The `addEventListener` method in `LightningElement` does not support any options.', this.host);
        } // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch


        return originalAddEventListener.apply(this, arguments);
      }

    }),
    querySelector: generateDataDescriptor({
      value() {
        const vm = getShadowRootVM(this);
        assert.isFalse(isBeingConstructed(vm), `this.template.querySelector() cannot be called during the construction of the custom element for ${vm} because no content has been rendered yet.`); // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch

        return originalQuerySelector.apply(this, arguments);
      }

    }),
    querySelectorAll: generateDataDescriptor({
      value() {
        const vm = getShadowRootVM(this);
        assert.isFalse(isBeingConstructed(vm), `this.template.querySelectorAll() cannot be called during the construction of the custom element for ${vm} because no content has been rendered yet.`); // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch

        return originalQuerySelectorAll.apply(this, arguments);
      }

    })
  });
  const BlackListedShadowRootMethods = {
    cloneNode: 0,
    getElementById: 0,
    getSelection: 0,
    elementsFromPoint: 0,
    dispatchEvent: 0
  };
  forEach.call(getOwnPropertyNames(BlackListedShadowRootMethods), methodName => {
    const descriptor = generateAccessorDescriptor({
      get() {
        throw new Error(`Disallowed method "${methodName}" in ShadowRoot.`);
      }

    });
    descriptors[methodName] = descriptor;
  });
  return descriptors;
} // Custom Elements Restrictions:
// -----------------------------


function getCustomElementRestrictionsDescriptors(elm, options) {

  const descriptors = getNodeRestrictionsDescriptors(elm, options);
  const originalAddEventListener = elm.addEventListener;
  const originalInnerHTMLDescriptor = getPropertyDescriptor(elm, 'innerHTML');
  const originalOuterHTMLDescriptor = getPropertyDescriptor(elm, 'outerHTML');
  const originalTextContentDescriptor = getPropertyDescriptor(elm, 'textContent');
  return assign(descriptors, {
    innerHTML: generateAccessorDescriptor({
      get() {
        return originalInnerHTMLDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set innerHTML on HTMLElement.`);
      }

    }),
    outerHTML: generateAccessorDescriptor({
      get() {
        return originalOuterHTMLDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set outerHTML on HTMLElement.`);
      }

    }),
    textContent: generateAccessorDescriptor({
      get() {
        return originalTextContentDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set textContent on HTMLElement.`);
      }

    }),
    addEventListener: generateDataDescriptor({
      value(type, listener, options) {
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${toString(this)} by adding an event listener for "${type}".`);
        assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${toString(elm)} by adding an event listener for "${type}".`); // TODO: #420 - this is triggered when the component author attempts to add a listener
        // programmatically into a lighting element node

        if (!isUndefined(options)) {
          logError('The `addEventListener` method in `LightningElement` does not support any options.', this);
        } // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch


        return originalAddEventListener.apply(this, arguments);
      }

    })
  });
}

function getComponentRestrictionsDescriptors() {

  return {
    tagName: generateAccessorDescriptor({
      get() {
        throw new Error(`Usage of property \`tagName\` is disallowed because the component itself does not know which tagName will be used to create the element, therefore writing code that check for that value is error prone.`);
      },

      configurable: true,
      enumerable: false
    })
  };
}

function getLightningElementPrototypeRestrictionsDescriptors(proto) {

  const descriptors = {};
  forEach.call(getOwnPropertyNames(globalHTMLProperties), propName => {
    if (propName in proto) {
      return; // no need to redefine something that we are already exposing
    }

    descriptors[propName] = generateAccessorDescriptor({
      get() {
        const {
          error,
          attribute
        } = globalHTMLProperties[propName];
        const msg = [];
        msg.push(`Accessing the global HTML property "${propName}" is disabled.`);

        if (error) {
          msg.push(error);
        } else if (attribute) {
          msg.push(`Instead access it via \`this.getAttribute("${attribute}")\`.`);
        }

        logError(msg.join('\n'), getComponentVM(this).elm);
      },

      set() {
        const {
          readOnly
        } = globalHTMLProperties[propName];

        if (readOnly) {
          logError(`The global HTML property \`${propName}\` is read-only.`);
        }
      }

    });
  });
  return descriptors;
}

function markNodeFromVNode(node) {

  node.$fromTemplate$ = true;
}

function patchElementWithRestrictions(elm, options) {
  defineProperties(elm, getElementRestrictionsDescriptors(elm, options));
} // This routine will prevent access to certain properties on a shadow root instance to guarantee
// that all components will work fine in IE11 and other browsers without shadow dom support.


function patchShadowRootWithRestrictions(sr, options) {
  defineProperties(sr, getShadowRootRestrictionsDescriptors(sr, options));
}

function patchCustomElementWithRestrictions(elm, options) {
  const restrictionsDescriptors = getCustomElementRestrictionsDescriptors(elm, options);
  const elmProto = getPrototypeOf(elm);
  setPrototypeOf(elm, create(elmProto, restrictionsDescriptors));
}

function patchComponentWithRestrictions(cmp) {
  defineProperties(cmp, getComponentRestrictionsDescriptors());
}

function patchLightningElementPrototypeWithRestrictions(proto) {
  defineProperties(proto, getLightningElementPrototypeRestrictionsDescriptors(proto));
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const noop = () => void 0;

const {
  getHiddenField: getHiddenField$3
} = fields;

function observeElementChildNodes(elm) {
  elm.$domManual$ = true;
}

function setElementShadowToken(elm, token) {
  elm.$shadowToken$ = token;
}

function updateNodeHook(oldVnode, vnode) {
  const {
    text
  } = vnode;

  if (oldVnode.text !== text) {
    {
      unlockDomMutation();
    }
    /**
     * Compiler will never produce a text property that is not string
     */


    vnode.elm.nodeValue = text;

    {
      lockDomMutation();
    }
  }
}

function insertNodeHook(vnode, parentNode, referenceNode) {
  {
    unlockDomMutation();
  }

  parentNode.insertBefore(vnode.elm, referenceNode);

  {
    lockDomMutation();
  }
}

function removeNodeHook(vnode, parentNode) {
  {
    unlockDomMutation();
  }

  parentNode.removeChild(vnode.elm);

  {
    lockDomMutation();
  }
}

function createElmHook(vnode) {
  modEvents.create(vnode); // Attrs need to be applied to element before props
  // IE11 will wipe out value on radio inputs if value
  // is set before type=radio.

  modAttrs.create(vnode);
  modProps.create(vnode);
  modStaticClassName.create(vnode);
  modStaticStyle.create(vnode);
  modComputedClassName.create(vnode);
  modComputedStyle.create(vnode);
  contextModule.create(vnode);
}

var LWCDOMMode;

(function (LWCDOMMode) {
  LWCDOMMode["manual"] = "manual";
})(LWCDOMMode || (LWCDOMMode = {}));

function fallbackElmHook(vnode) {
  const {
    owner
  } = vnode;
  const elm = vnode.elm;

  if (isTrue$1(useSyntheticShadow)) {
    const {
      data: {
        context
      }
    } = vnode;
    const {
      shadowAttribute
    } = owner.context;

    if (!isUndefined(context) && !isUndefined(context.lwc) && context.lwc.dom === LWCDOMMode.manual) {
      // this element will now accept any manual content inserted into it
      observeElementChildNodes(elm);
    } // when running in synthetic shadow mode, we need to set the shadowToken value
    // into each element from the template, so they can be styled accordingly.


    setElementShadowToken(elm, shadowAttribute);
  }

  {
    const {
      data: {
        context
      }
    } = vnode;
    const isPortal = !isUndefined(context) && !isUndefined(context.lwc) && context.lwc.dom === LWCDOMMode.manual;
    patchElementWithRestrictions(elm, {
      isPortal
    });
  }
}

function updateElmHook(oldVnode, vnode) {
  // Attrs need to be applied to element before props
  // IE11 will wipe out value on radio inputs if value
  // is set before type=radio.
  modAttrs.update(oldVnode, vnode);
  modProps.update(oldVnode, vnode);
  modComputedClassName.update(oldVnode, vnode);
  modComputedStyle.update(oldVnode, vnode);
}

function insertCustomElmHook(vnode) {
  const vm = getCustomElementVM(vnode.elm);
  appendVM(vm);
}

function updateChildrenHook(oldVnode, vnode) {
  const {
    children,
    owner
  } = vnode;
  const fn = hasDynamicChildren(children) ? updateDynamicChildren : updateStaticChildren;
  runWithBoundaryProtection(owner, owner.owner, noop, () => {
    fn(vnode.elm, oldVnode.children, children);
  }, noop);
}

function allocateChildrenHook(vnode) {
  const elm = vnode.elm;
  const vm = getCustomElementVM(elm);
  const {
    children
  } = vnode;
  vm.aChildren = children;

  if (isTrue$1(useSyntheticShadow)) {
    // slow path
    allocateInSlot(vm, children); // every child vnode is now allocated, and the host should receive none directly, it receives them via the shadow!

    vnode.children = EmptyArray;
  }
}

function createViewModelHook(vnode) {
  const elm = vnode.elm;

  if (!isUndefined(getHiddenField$3(elm, ViewModelReflection))) {
    // There is a possibility that a custom element is registered under tagName,
    // in which case, the initialization is already carry on, and there is nothing else
    // to do here since this hook is called right after invoking `document.createElement`.
    return;
  }

  const {
    mode,
    ctor,
    owner
  } = vnode;
  const def = getComponentDef(ctor);
  setElementProto(elm, def);

  if (isTrue$1(useSyntheticShadow)) {
    const {
      shadowAttribute
    } = owner.context; // when running in synthetic shadow mode, we need to set the shadowToken value
    // into each element from the template, so they can be styled accordingly.

    setElementShadowToken(elm, shadowAttribute);
  }

  createVM(elm, ctor, {
    mode,
    owner
  });
  const vm = getCustomElementVM(elm);

  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(isArray$1(vnode.children), `Invalid vnode for a custom element, it must have children defined.`);
  }

  {
    patchCustomElementWithRestrictions(elm, EmptyObject);
  }
}

function createCustomElmHook(vnode) {
  modEvents.create(vnode); // Attrs need to be applied to element before props
  // IE11 will wipe out value on radio inputs if value
  // is set before type=radio.

  modAttrs.create(vnode);
  modProps.create(vnode);
  modStaticClassName.create(vnode);
  modStaticStyle.create(vnode);
  modComputedClassName.create(vnode);
  modComputedStyle.create(vnode);
  contextModule.create(vnode);
}

function createChildrenHook(vnode) {
  const {
    elm,
    children
  } = vnode;

  for (let j = 0; j < children.length; ++j) {
    const ch = children[j];

    if (ch != null) {
      ch.hook.create(ch);
      ch.hook.insert(ch, elm, null);
    }
  }
}

function rerenderCustomElmHook(vnode) {
  const vm = getCustomElementVM(vnode.elm);

  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(isArray$1(vnode.children), `Invalid vnode for a custom element, it must have children defined.`);
  }

  rerenderVM(vm);
}

function updateCustomElmHook(oldVnode, vnode) {
  // Attrs need to be applied to element before props
  // IE11 will wipe out value on radio inputs if value
  // is set before type=radio.
  modAttrs.update(oldVnode, vnode);
  modProps.update(oldVnode, vnode);
  modComputedClassName.update(oldVnode, vnode);
  modComputedStyle.update(oldVnode, vnode);
}

function removeElmHook(vnode) {
  // this method only needs to search on child vnodes from template
  // to trigger the remove hook just in case some of those children
  // are custom elements.
  const {
    children,
    elm
  } = vnode;

  for (let j = 0, len = children.length; j < len; ++j) {
    const ch = children[j];

    if (!isNull(ch)) {
      ch.hook.remove(ch, elm);
    }
  }
}

function removeCustomElmHook(vnode) {
  // for custom elements we don't have to go recursively because the removeVM routine
  // will take care of disconnecting any child VM attached to its shadow as well.
  removeVM(getCustomElementVM(vnode.elm));
} // Using a WeakMap instead of a WeakSet because this one works in IE11 :(


const FromIteration = new WeakMap(); // dynamic children means it was generated by an iteration
// in a template, and will require a more complex diffing algo.

function markAsDynamicChildren(children) {
  FromIteration.set(children, 1);
}

function hasDynamicChildren(children) {
  return FromIteration.has(children);
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const Services = create(null);

function invokeServiceHook(vm, cbs) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(isArray$1(cbs) && cbs.length > 0, `Optimize invokeServiceHook() to be invoked only when needed`);
  }

  const {
    component,
    data,
    def,
    context
  } = vm;

  for (let i = 0, len = cbs.length; i < len; ++i) {
    cbs[i].call(undefined, component, data, def, context);
  }
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const CHAR_S = 115;
const CHAR_V = 118;
const CHAR_G = 103;
const NamespaceAttributeForSVG = 'http://www.w3.org/2000/svg';
const SymbolIterator = Symbol.iterator;
const TextHook = {
  create: vnode => {
    vnode.elm = document.createTextNode(vnode.text);
    linkNodeToShadow(vnode);

    {
      markNodeFromVNode(vnode.elm);
    }
  },
  update: updateNodeHook,
  insert: insertNodeHook,
  move: insertNodeHook,
  remove: removeNodeHook
};
const CommentHook = {
  create: vnode => {
    vnode.elm = document.createComment(vnode.text);
    linkNodeToShadow(vnode);

    {
      markNodeFromVNode(vnode.elm);
    }
  },
  update: updateNodeHook,
  insert: insertNodeHook,
  move: insertNodeHook,
  remove: removeNodeHook
}; // insert is called after update, which is used somewhere else (via a module)
// to mark the vm as inserted, that means we cannot use update as the main channel
// to rehydrate when dirty, because sometimes the element is not inserted just yet,
// which breaks some invariants. For that reason, we have the following for any
// Custom Element that is inserted via a template.

const ElementHook = {
  create: vnode => {
    const {
      data,
      sel,
      clonedElement
    } = vnode;
    const {
      ns
    } = data; // TODO: issue #1364 - supporting the ability to inject a cloned StyleElement
    // via a vnode this is used for style tags for native shadow

    if (isUndefined(clonedElement)) {
      vnode.elm = isUndefined(ns) ? document.createElement(sel) : document.createElementNS(ns, sel);
    } else {
      vnode.elm = clonedElement;
    }

    linkNodeToShadow(vnode);

    {
      markNodeFromVNode(vnode.elm);
    }

    fallbackElmHook(vnode);
    createElmHook(vnode);
  },
  update: (oldVnode, vnode) => {
    updateElmHook(oldVnode, vnode);
    updateChildrenHook(oldVnode, vnode);
  },
  insert: (vnode, parentNode, referenceNode) => {
    insertNodeHook(vnode, parentNode, referenceNode);
    createChildrenHook(vnode);
  },
  move: (vnode, parentNode, referenceNode) => {
    insertNodeHook(vnode, parentNode, referenceNode);
  },
  remove: (vnode, parentNode) => {
    removeNodeHook(vnode, parentNode);
    removeElmHook(vnode);
  }
};
const CustomElementHook = {
  create: vnode => {
    const {
      sel
    } = vnode;
    vnode.elm = document.createElement(sel);
    linkNodeToShadow(vnode);

    {
      markNodeFromVNode(vnode.elm);
    }

    createViewModelHook(vnode);
    allocateChildrenHook(vnode);
    createCustomElmHook(vnode);
  },
  update: (oldVnode, vnode) => {
    updateCustomElmHook(oldVnode, vnode); // in fallback mode, the allocation will always set children to
    // empty and delegate the real allocation to the slot elements

    allocateChildrenHook(vnode); // in fallback mode, the children will be always empty, so, nothing
    // will happen, but in native, it does allocate the light dom

    updateChildrenHook(oldVnode, vnode); // this will update the shadowRoot

    rerenderCustomElmHook(vnode);
  },
  insert: (vnode, parentNode, referenceNode) => {
    insertNodeHook(vnode, parentNode, referenceNode);
    createChildrenHook(vnode);
    insertCustomElmHook(vnode);
  },
  move: (vnode, parentNode, referenceNode) => {
    insertNodeHook(vnode, parentNode, referenceNode);
  },
  remove: (vnode, parentNode) => {
    removeNodeHook(vnode, parentNode);
    removeCustomElmHook(vnode);
  }
};

function linkNodeToShadow(vnode) {
  // TODO: #1164 - this should eventually be done by the polyfill directly
  vnode.elm.$shadowResolver$ = vnode.owner.cmpRoot.$shadowResolver$;
} // TODO: #1136 - this should be done by the compiler, adding ns to every sub-element


function addNS(vnode) {
  const {
    data,
    children,
    sel
  } = vnode;
  data.ns = NamespaceAttributeForSVG; // TODO: #1275 - review why `sel` equal `foreignObject` should get this `ns`

  if (isArray$1(children) && sel !== 'foreignObject') {
    for (let j = 0, n = children.length; j < n; ++j) {
      const childNode = children[j];

      if (childNode != null && childNode.hook === ElementHook) {
        addNS(childNode);
      }
    }
  }
}

function addVNodeToChildLWC(vnode) {
  ArrayPush.call(getVMBeingRendered().velements, vnode);
} // [h]tml node


function h(sel, data, children) {
  const vmBeingRendered = getVMBeingRendered();

  {
    assert.isTrue(isString(sel), `h() 1st argument sel must be a string.`);
    assert.isTrue(isObject$1(data), `h() 2nd argument data must be an object.`);
    assert.isTrue(isArray$1(children), `h() 3rd argument children must be an array.`);
    assert.isTrue('key' in data, ` <${sel}> "key" attribute is invalid or missing for ${vmBeingRendered}. Key inside iterator is either undefined or null.`); // checking reserved internal data properties

    assert.isFalse(data.className && data.classMap, `vnode.data.className and vnode.data.classMap ambiguous declaration.`);
    assert.isFalse(data.styleMap && data.style, `vnode.data.styleMap and vnode.data.style ambiguous declaration.`);

    if (data.style && !isString(data.style)) {
      logError(`Invalid 'style' attribute passed to <${sel}> is ignored. This attribute must be a string value.`, vmBeingRendered.elm);
    }

    forEach.call(children, childVnode => {
      if (childVnode != null) {
        assert.isTrue(childVnode && 'sel' in childVnode && 'data' in childVnode && 'children' in childVnode && 'text' in childVnode && 'elm' in childVnode && 'key' in childVnode, `${childVnode} is not a vnode.`);
      }
    });
  }

  const {
    key
  } = data;
  let text, elm;
  const vnode = {
    sel,
    data,
    children,
    text,
    elm,
    key,
    hook: ElementHook,
    owner: vmBeingRendered
  };

  if (sel.length === 3 && StringCharCodeAt.call(sel, 0) === CHAR_S && StringCharCodeAt.call(sel, 1) === CHAR_V && StringCharCodeAt.call(sel, 2) === CHAR_G) {
    addNS(vnode);
  }

  return vnode;
} // [t]ab[i]ndex function


function ti(value) {
  // if value is greater than 0, we normalize to 0
  // If value is an invalid tabIndex value (null, undefined, string, etc), we let that value pass through
  // If value is less than -1, we don't care
  const shouldNormalize = value > 0 && !(isTrue$1(value) || isFalse$1(value));

  {
    const vmBeingRendered = getVMBeingRendered();

    if (shouldNormalize) {
      logError(`Invalid tabindex value \`${toString(value)}\` in template for ${vmBeingRendered}. This attribute must be set to 0 or -1.`, vmBeingRendered.elm);
    }
  }

  return shouldNormalize ? 0 : value;
} // [s]lot element node


function s(slotName, data, children, slotset) {
  {
    assert.isTrue(isString(slotName), `s() 1st argument slotName must be a string.`);
    assert.isTrue(isObject$1(data), `s() 2nd argument data must be an object.`);
    assert.isTrue(isArray$1(children), `h() 3rd argument children must be an array.`);
  }

  if (!isUndefined(slotset) && !isUndefined(slotset[slotName]) && slotset[slotName].length !== 0) {
    children = slotset[slotName];
  }

  const vnode = h('slot', data, children);

  if (useSyntheticShadow) {
    // TODO: #1276 - compiler should give us some sort of indicator when a vnodes collection is dynamic
    sc(children);
  }

  return vnode;
} // [c]ustom element node


function c(sel, Ctor, data, children) {
  if (isCircularModuleDependency(Ctor)) {
    Ctor = resolveCircularModuleDependency(Ctor);
  }

  const vmBeingRendered = getVMBeingRendered();

  {
    assert.isTrue(isString(sel), `c() 1st argument sel must be a string.`);
    assert.isTrue(isFunction(Ctor), `c() 2nd argument Ctor must be a function.`);
    assert.isTrue(isObject$1(data), `c() 3nd argument data must be an object.`);
    assert.isTrue(arguments.length === 3 || isArray$1(children), `c() 4nd argument data must be an array.`); // checking reserved internal data properties

    assert.isFalse(data.className && data.classMap, `vnode.data.className and vnode.data.classMap ambiguous declaration.`);
    assert.isFalse(data.styleMap && data.style, `vnode.data.styleMap and vnode.data.style ambiguous declaration.`);

    if (data.style && !isString(data.style)) {
      logError(`Invalid 'style' attribute passed to <${sel}> is ignored. This attribute must be a string value.`, vmBeingRendered.elm);
    }

    if (arguments.length === 4) {
      forEach.call(children, childVnode => {
        if (childVnode != null) {
          assert.isTrue(childVnode && 'sel' in childVnode && 'data' in childVnode && 'children' in childVnode && 'text' in childVnode && 'elm' in childVnode && 'key' in childVnode, `${childVnode} is not a vnode.`);
        }
      });
    }
  }

  const {
    key
  } = data;
  let text, elm;
  children = arguments.length === 3 ? EmptyArray : children;
  const vnode = {
    sel,
    data,
    children,
    text,
    elm,
    key,
    hook: CustomElementHook,
    ctor: Ctor,
    owner: vmBeingRendered,
    mode: 'open'
  };
  addVNodeToChildLWC(vnode);
  return vnode;
} // [i]terable node


function i(iterable, factory) {
  const list = []; // TODO: #1276 - compiler should give us some sort of indicator when a vnodes collection is dynamic

  sc(list);
  const vmBeingRendered = getVMBeingRendered();

  if (isUndefined(iterable) || iterable === null) {
    {
      logError(`Invalid template iteration for value "${toString(iterable)}" in ${vmBeingRendered}. It must be an Array or an iterable Object.`, vmBeingRendered.elm);
    }

    return list;
  }

  {
    assert.isFalse(isUndefined(iterable[SymbolIterator]), `Invalid template iteration for value \`${toString(iterable)}\` in ${vmBeingRendered}. It must be an array-like object and not \`null\` nor \`undefined\`.`);
  }

  const iterator = iterable[SymbolIterator]();

  {
    assert.isTrue(iterator && isFunction(iterator.next), `Invalid iterator function for "${toString(iterable)}" in ${vmBeingRendered}.`);
  }

  let next = iterator.next();
  let j = 0;
  let {
    value,
    done: last
  } = next;
  let keyMap;
  let iterationError;

  {
    keyMap = create(null);
  }

  while (last === false) {
    // implementing a look-back-approach because we need to know if the element is the last
    next = iterator.next();
    last = next.done; // template factory logic based on the previous collected value

    const vnode = factory(value, j, j === 0, last);

    if (isArray$1(vnode)) {
      ArrayPush.apply(list, vnode);
    } else {
      ArrayPush.call(list, vnode);
    }

    {
      const vnodes = isArray$1(vnode) ? vnode : [vnode];
      forEach.call(vnodes, childVnode => {
        if (!isNull(childVnode) && isObject$1(childVnode) && !isUndefined(childVnode.sel)) {
          const {
            key
          } = childVnode;

          if (isString(key) || isNumber(key)) {
            if (keyMap[key] === 1 && isUndefined(iterationError)) {
              iterationError = `Duplicated "key" attribute value for "<${childVnode.sel}>" in ${vmBeingRendered} for item number ${j}. A key with value "${childVnode.key}" appears more than once in the iteration. Key values must be unique numbers or strings.`;
            }

            keyMap[key] = 1;
          } else if (isUndefined(iterationError)) {
            iterationError = `Invalid "key" attribute value in "<${childVnode.sel}>" in ${vmBeingRendered} for item number ${j}. Set a unique "key" value on all iterated child elements.`;
          }
        }
      });
    } // preparing next value


    j += 1;
    value = next.value;
  }

  {
    if (!isUndefined(iterationError)) {
      logError(iterationError, vmBeingRendered.elm);
    }
  }

  return list;
}
/**
 * [f]lattening
 */


function f(items) {
  {
    assert.isTrue(isArray$1(items), 'flattening api can only work with arrays.');
  }

  const len = items.length;
  const flattened = []; // TODO: #1276 - compiler should give us some sort of indicator when a vnodes collection is dynamic

  sc(flattened);

  for (let j = 0; j < len; j += 1) {
    const item = items[j];

    if (isArray$1(item)) {
      ArrayPush.apply(flattened, item);
    } else {
      ArrayPush.call(flattened, item);
    }
  }

  return flattened;
} // [t]ext node


function t(text) {
  const data = EmptyObject;
  let sel, children, key, elm;
  return {
    sel,
    data,
    children,
    text,
    elm,
    key,
    hook: TextHook,
    owner: getVMBeingRendered()
  };
} // comment node


function p(text) {
  const data = EmptyObject;
  const sel = '!';
  let children, key, elm;
  return {
    sel,
    data,
    children,
    text,
    elm,
    key,
    hook: CommentHook,
    owner: getVMBeingRendered()
  };
} // [d]ynamic value to produce a text vnode


function d(value) {
  if (value == null) {
    return null;
  }

  return t(value);
} // [b]ind function


function b(fn) {
  const vmBeingRendered = getVMBeingRendered();

  if (isNull(vmBeingRendered)) {
    throw new Error();
  }

  const vm = vmBeingRendered;
  return function (event) {
    invokeEventListener(vm, fn, vm.component, event);
  };
} // [f]unction_[b]ind


function fb(fn) {
  const vmBeingRendered = getVMBeingRendered();

  if (isNull(vmBeingRendered)) {
    throw new Error();
  }

  const vm = vmBeingRendered;
  return function () {
    return invokeComponentCallback(vm, fn, ArraySlice$1.call(arguments));
  };
} // [l]ocator_[l]istener function


function ll(originalHandler, id, context) {
  const vm = getVMBeingRendered();

  if (isNull(vm)) {
    throw new Error();
  } // bind the original handler with b() so we can call it
  // after resolving the locator


  const eventListener = b(originalHandler); // create a wrapping handler to resolve locator, and
  // then invoke the original handler.

  return function (event) {
    // located service for the locator metadata
    const {
      context: {
        locator
      }
    } = vm;

    if (!isUndefined(locator)) {
      const {
        locator: locatorService
      } = Services;

      if (locatorService) {
        locator.resolved = {
          target: id,
          host: locator.id,
          targetContext: isFunction(context) && context(),
          hostContext: isFunction(locator.context) && locator.context()
        }; // a registered `locator` service will be invoked with
        // access to the context.locator.resolved, which will contain:
        // outer id, outer context, inner id, and inner context

        invokeServiceHook(vm, locatorService);
      }
    } // invoke original event listener via b()


    eventListener(event);
  };
} // [k]ey function


function k(compilerKey, obj) {
  switch (typeof obj) {
    case 'number':
    case 'string':
      return compilerKey + ':' + obj;

    case 'object':
      {
        assert.fail(`Invalid key value "${obj}" in ${getVMBeingRendered()}. Key must be a string or number.`);
      }

  }
} // [g]lobal [id] function


function gid(id) {
  const vmBeingRendered = getVMBeingRendered();

  if (isUndefined(id) || id === '') {
    {
      logError(`Invalid id value "${id}". The id attribute must contain a non-empty string.`, vmBeingRendered.elm);
    }

    return id;
  } // We remove attributes when they are assigned a value of null


  if (isNull(id)) {
    return null;
  }

  return `${id}-${vmBeingRendered.idx}`;
} // [f]ragment [id] function


function fid(url) {
  const vmBeingRendered = getVMBeingRendered();

  if (isUndefined(url) || url === '') {
    {
      if (isUndefined(url)) {
        logError(`Undefined url value for "href" or "xlink:href" attribute. Expected a non-empty string.`, vmBeingRendered.elm);
      }
    }

    return url;
  } // We remove attributes when they are assigned a value of null


  if (isNull(url)) {
    return null;
  } // Apply transformation only for fragment-only-urls


  if (/^#/.test(url)) {
    return `${url}-${vmBeingRendered.idx}`;
  }

  return url;
}
/**
 * Map to store an index value assigned to any dynamic component reference ingested
 * by dc() api. This allows us to generate a unique unique per template per dynamic
 * component reference to avoid diffing algo mismatches.
 */


const DynamicImportedComponentMap = new Map();
let dynamicImportedComponentCounter = 0;
/**
 * create a dynamic component via `<x-foo lwc:dynamic={Ctor}>`
 */

function dc(sel, Ctor, data, children) {
  {
    assert.isTrue(isString(sel), `dc() 1st argument sel must be a string.`);
    assert.isTrue(isObject$1(data), `dc() 3nd argument data must be an object.`);
    assert.isTrue(arguments.length === 3 || isArray$1(children), `dc() 4nd argument data must be an array.`);
  } // null or undefined values should produce a null value in the VNodes


  if (Ctor == null) {
    return null;
  }

  if (!isComponentConstructor(Ctor)) {
    throw new Error(`Invalid LWC Constructor ${toString(Ctor)} for custom element <${sel}>.`);
  }

  let idx = DynamicImportedComponentMap.get(Ctor);

  if (isUndefined(idx)) {
    idx = dynamicImportedComponentCounter++;
    DynamicImportedComponentMap.set(Ctor, idx);
  } // the new vnode key is a mix of idx and compiler key, this is required by the diffing algo
  // to identify different constructors as vnodes with different keys to avoid reusing the
  // element used for previous constructors.


  data.key = `dc:${idx}:${data.key}`;
  return c(sel, Ctor, data, children);
}
/**
 * slow children collection marking mechanism. this API allows the compiler to signal
 * to the engine that a particular collection of children must be diffed using the slow
 * algo based on keys due to the nature of the list. E.g.:
 *
 *   - slot element's children: the content of the slot has to be dynamic when in synthetic
 *                              shadow mode because the `vnode.children` might be the slotted
 *                              content vs default content, in which case the size and the
 *                              keys are not matching.
 *   - children that contain dynamic components
 *   - children that are produced by iteration
 *
 */


function sc(vnodes) {
  {
    assert.isTrue(isArray$1(vnodes), 'sc() api can only work with arrays.');
  } // We have to mark the vnodes collection as dynamic so we can later on
  // choose to use the snabbdom virtual dom diffing algo instead of our
  // static dummy algo.


  markAsDynamicChildren(vnodes);
  return vnodes;
}

var api =
/*#__PURE__*/
Object.freeze({
  h: h,
  ti: ti,
  s: s,
  c: c,
  i: i,
  f: f,
  t: t,
  p: p,
  d: d,
  b: b,
  fb: fb,
  ll: ll,
  k: k,
  gid: gid,
  fid: fid,
  dc: dc,
  sc: sc
});
const signedTemplateSet = new Set();

function defaultEmptyTemplate() {
  return [];
}

signedTemplateSet.add(defaultEmptyTemplate);

function isTemplateRegistered(tpl) {
  return signedTemplateSet.has(tpl);
}
/**
 * INTERNAL: This function can only be invoked by compiled code. The compiler
 * will prevent this function from being imported by userland code.
 */


function registerTemplate(tpl) {
  signedTemplateSet.add(tpl); // chaining this method as a way to wrap existing
  // assignment of templates easily, without too much transformation

  return tpl;
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const CachedStyleFragments = create(null);

function createStyleElement(styleContent) {
  const elm = document.createElement('style');
  elm.type = 'text/css';
  elm.textContent = styleContent;
  return elm;
}

function getCachedStyleElement(styleContent) {
  let fragment = CachedStyleFragments[styleContent];

  if (isUndefined(fragment)) {
    fragment = document.createDocumentFragment();
    const styleElm = createStyleElement(styleContent);
    fragment.appendChild(styleElm);
    CachedStyleFragments[styleContent] = fragment;
  }

  return fragment.cloneNode(true).firstChild;
} // PHIL: moved parent access down to the function that uses it


const InsertedGlobalStyleContent = create(null);

function insertGlobalStyle(styleContent) {
  // PHIL: access the parent when needed
  const globalStyleParent = document.head || document.body || document; // inserts the global style when needed, otherwise does nothing

  if (isUndefined(InsertedGlobalStyleContent[styleContent])) {
    InsertedGlobalStyleContent[styleContent] = true;
    const elm = createStyleElement(styleContent);
    globalStyleParent.appendChild(elm);
  }
}

function createStyleVNode(elm) {
  const vnode = h('style', {
    key: 'style'
  }, EmptyArray); // TODO: issue #1364 - supporting the ability to inject a cloned StyleElement
  // forcing the diffing algo to use the cloned style for native shadow

  vnode.clonedElement = elm;
  return vnode;
}
/**
 * Reset the styling token applied to the host element.
 */


function resetStyleAttributes(vm) {
  const {
    context,
    elm
  } = vm; // Remove the style attribute currently applied to the host element.

  const oldHostAttribute = context.hostAttribute;

  if (!isUndefined(oldHostAttribute)) {
    removeAttribute.call(elm, oldHostAttribute);
  } // Reset the scoping attributes associated to the context.


  context.hostAttribute = context.shadowAttribute = undefined;
}
/**
 * Apply/Update the styling token applied to the host element.
 */


function applyStyleAttributes(vm, hostAttribute, shadowAttribute) {
  const {
    context,
    elm
  } = vm; // Remove the style attribute currently applied to the host element.

  setAttribute.call(elm, hostAttribute, '');
  context.hostAttribute = hostAttribute;
  context.shadowAttribute = shadowAttribute;
}

function collectStylesheets(stylesheets, hostSelector, shadowSelector, isNative, aggregatorFn) {
  forEach.call(stylesheets, sheet => {
    if (isArray$1(sheet)) {
      collectStylesheets(sheet, hostSelector, shadowSelector, isNative, aggregatorFn);
    } else {
      aggregatorFn(sheet(hostSelector, shadowSelector, isNative));
    }
  });
}

function evaluateCSS(vm, stylesheets, hostAttribute, shadowAttribute) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(isArray$1(stylesheets), `Invalid stylesheets.`);
  }

  if (useSyntheticShadow) {
    const hostSelector = `[${hostAttribute}]`;
    const shadowSelector = `[${shadowAttribute}]`;
    collectStylesheets(stylesheets, hostSelector, shadowSelector, false, textContent => {
      insertGlobalStyle(textContent);
    });
    return null;
  } else {
    // Native shadow in place, we need to act accordingly by using the `:host` selector, and an
    // empty shadow selector since it is not really needed.
    let buffer = '';
    collectStylesheets(stylesheets, emptyString, emptyString, true, textContent => {
      buffer += textContent;
    });
    return createStyleVNode(getCachedStyleElement(buffer));
  }
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


var GlobalMeasurementPhase;

(function (GlobalMeasurementPhase) {
  GlobalMeasurementPhase["REHYDRATE"] = "lwc-rehydrate";
  GlobalMeasurementPhase["HYDRATE"] = "lwc-hydrate";
})(GlobalMeasurementPhase || (GlobalMeasurementPhase = {})); // Even if all the browser the engine supports implements the UserTiming API, we need to guard the measure APIs.
// JSDom (used in Jest) for example doesn't implement the UserTiming APIs.


const isUserTimingSupported = typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.clearMarks === 'function' && typeof performance.measure === 'function' && typeof performance.clearMeasures === 'function';

function getMarkName(phase, vm) {
  return `<${StringToLowerCase.call(tagNameGetter.call(vm.elm))} (${vm.idx})> - ${phase}`;
}

function start(markName) {
  performance.mark(markName);
}

function end(measureName, markName) {
  performance.measure(measureName, markName); // Clear the created marks and measure to avoid filling the performance entries buffer.
  // Note: Even if the entries get deleted, existing PerformanceObservers preserve a copy of those entries.

  performance.clearMarks(markName);
  performance.clearMarks(measureName);
}

function noop$1() {
  /* do nothing */
}

const startMeasure = !isUserTimingSupported ? noop$1 : function (phase, vm) {
  const markName = getMarkName(phase, vm);
  start(markName);
};
const endMeasure = !isUserTimingSupported ? noop$1 : function (phase, vm) {
  const markName = getMarkName(phase, vm);
  end(markName, markName);
}; // Global measurements can be nested into each others (e.g. nested component creation via createElement). In those cases
// the VM is used to create unique mark names at each level.

const startGlobalMeasure = !isUserTimingSupported ? noop$1 : function (phase, vm) {
  const markName = isUndefined(vm) ? phase : getMarkName(phase, vm);
  start(markName);
};
const endGlobalMeasure = !isUserTimingSupported ? noop$1 : function (phase, vm) {
  const markName = isUndefined(vm) ? phase : getMarkName(phase, vm);
  end(phase, markName);
};
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

let isUpdatingTemplate = false;
let vmBeingRendered = null;

function getVMBeingRendered() {
  return vmBeingRendered;
}

function setVMBeingRendered(vm) {
  vmBeingRendered = vm;
}

const EmptySlots = create(null);

function validateSlots(vm, html) {

  const {
    cmpSlots = EmptySlots
  } = vm;
  const {
    slots = EmptyArray
  } = html;

  for (const slotName in cmpSlots) {
    // eslint-disable-next-line no-production-assert
    assert.isTrue(isArray$1(cmpSlots[slotName]), `Slots can only be set to an array, instead received ${toString(cmpSlots[slotName])} for slot "${slotName}" in ${vm}.`);

    if (slotName !== '' && ArrayIndexOf.call(slots, slotName) === -1) {
      // TODO: #1297 - this should never really happen because the compiler should always validate
      // eslint-disable-next-line no-production-assert
      logError(`Ignoring unknown provided slot name "${slotName}" in ${vm}. Check for a typo on the slot attribute.`, vm.elm);
    }
  }
}

function validateFields(vm, html) {

  const {
    component
  } = vm; // validating identifiers used by template that should be provided by the component

  const {
    ids = []
  } = html;
  forEach.call(ids, propName => {
    if (!(propName in component)) {
      // eslint-disable-next-line no-production-assert
      logError(`The template rendered by ${vm} references \`this.${propName}\`, which is not declared. Check for a typo in the template.`, vm.elm);
    }
  });
}

function evaluateTemplate(vm, html) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(isFunction(html), `evaluateTemplate() second argument must be an imported template instead of ${toString(html)}`);
  }

  const isUpdatingTemplateInception = isUpdatingTemplate;
  const vmOfTemplateBeingUpdatedInception = vmBeingRendered;
  let vnodes = [];
  runWithBoundaryProtection(vm, vm.owner, () => {
    // pre
    vmBeingRendered = vm;

    {
      startMeasure('render', vm);
    }
  }, () => {
    // job
    const {
      component,
      context,
      cmpSlots,
      cmpTemplate,
      tro
    } = vm;
    tro.observe(() => {
      // reset the cache memoizer for template when needed
      if (html !== cmpTemplate) {
        // perf opt: do not reset the shadow root during the first rendering (there is nothing to reset)
        if (!isUndefined(cmpTemplate)) {
          // It is important to reset the content to avoid reusing similar elements generated from a different
          // template, because they could have similar IDs, and snabbdom just rely on the IDs.
          resetShadowRoot(vm);
        } // Check that the template was built by the compiler


        if (isUndefined(html) || !isTemplateRegistered(html)) {
          throw new TypeError(`Invalid template returned by the render() method on ${vm}. It must return an imported template (e.g.: \`import html from "./${vm.def.name}.html"\`), instead, it has returned: ${toString(html)}.`);
        }

        vm.cmpTemplate = html; // Populate context with template information

        context.tplCache = create(null);
        resetStyleAttributes(vm);
        const {
          stylesheets,
          stylesheetTokens
        } = html;

        if (isUndefined(stylesheets) || stylesheets.length === 0) {
          context.styleVNode = null;
        } else if (!isUndefined(stylesheetTokens)) {
          const {
            hostAttribute,
            shadowAttribute
          } = stylesheetTokens;
          applyStyleAttributes(vm, hostAttribute, shadowAttribute); // Caching style vnode so it can be reused on every render

          context.styleVNode = evaluateCSS(vm, stylesheets, hostAttribute, shadowAttribute);
        }

        if ("development" !== 'production') {
          // one time operation for any new template returned by render()
          // so we can warn if the template is attempting to use a binding
          // that is not provided by the component instance.
          validateFields(vm, html);
        }
      }

      if ("development" !== 'production') {
        assert.isTrue(isObject$1(context.tplCache), `vm.context.tplCache must be an object associated to ${cmpTemplate}.`); // validating slots in every rendering since the allocated content might change over time

        validateSlots(vm, html);
      } // right before producing the vnodes, we clear up all internal references
      // to custom elements from the template.


      vm.velements = []; // Set the global flag that template is being updated

      isUpdatingTemplate = true;
      vnodes = html.call(undefined, api, component, cmpSlots, context.tplCache);
      const {
        styleVNode
      } = context;

      if (!isNull(styleVNode)) {
        ArrayUnshift$1.call(vnodes, styleVNode);
      }
    });
  }, () => {
    // post
    isUpdatingTemplate = isUpdatingTemplateInception;
    vmBeingRendered = vmOfTemplateBeingUpdatedInception;

    {
      endMeasure('render', vm);
    }
  });

  {
    assert.invariant(isArray$1(vnodes), `Compiler should produce html functions that always return an array.`);
  }

  return vnodes;
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


let isInvokingRender = false;
let vmBeingConstructed = null;

function isBeingConstructed(vm) {
  {
    assert.isTrue(vm && 'cmpProps' in vm, `${vm} is not a vm.`);
  }

  return vmBeingConstructed === vm;
}

function invokeComponentCallback(vm, fn, args) {
  const {
    component,
    callHook,
    context,
    owner
  } = vm;
  let result;
  runWithBoundaryProtection(vm, owner, () => {}, () => {
    // job
    result = callHook(component, fn, args);
  }, () => {});
  return result;
}

function invokeComponentConstructor(vm, Ctor) {
  const vmBeingConstructedInception = vmBeingConstructed;

  {
    assert.isTrue(vm && 'cmpProps' in vm, `${vm} is not a vm.`);
  }

  let error;

  {
    startMeasure('constructor', vm);
  }

  vmBeingConstructed = vm;
  /**
   * Constructors don't need to be wrapped with a boundary because for root elements
   * it should throw, while elements from template are already wrapped by a boundary
   * associated to the diffing algo.
   */

  try {
    // job
    const result = new Ctor(); // Check indirectly if the constructor result is an instance of LightningElement. Using
    // the "instanceof" operator would not work here since Locker Service provides its own
    // implementation of LightningElement, so we indirectly check if the base constructor is
    // invoked by accessing the component on the vm.

    if (vmBeingConstructed.component !== result) {
      throw new TypeError('Invalid component constructor, the class should extend LightningElement.');
    }
  } catch (e) {
    error = Object(e);
  } finally {
    {
      endMeasure('constructor', vm);
    }

    vmBeingConstructed = vmBeingConstructedInception;

    if (!isUndefined(error)) {
      error.wcStack = getErrorComponentStack(vm.elm); // re-throwing the original error annotated after restoring the context

      throw error; // eslint-disable-line no-unsafe-finally
    }
  }
}

function invokeComponentRenderMethod(vm) {
  const {
    def: {
      render
    },
    callHook,
    component,
    context,
    owner
  } = vm;
  const isRenderBeingInvokedInception = isInvokingRender;
  const vmBeingRenderedInception = getVMBeingRendered();
  let html;
  let renderInvocationSuccessful = false;
  runWithBoundaryProtection(vm, owner, () => {
    isInvokingRender = true;
    setVMBeingRendered(vm);
  }, () => {
    // job
    vm.tro.observe(() => {
      html = callHook(component, render);
      renderInvocationSuccessful = true;
    });
  }, () => {
    isInvokingRender = isRenderBeingInvokedInception;
    setVMBeingRendered(vmBeingRenderedInception);
  }); // If render() invocation failed, process errorCallback in boundary and return an empty template

  return renderInvocationSuccessful ? evaluateTemplate(vm, html) : [];
}

function invokeEventListener(vm, fn, thisValue, event) {
  const {
    callHook,
    owner,
    context
  } = vm;
  runWithBoundaryProtection(vm, owner, () => {}, () => {
    // job
    if ("development" !== 'production') {
      assert.isTrue(isFunction(fn), `Invalid event handler for event '${event.type}' on ${vm}.`);
    }

    callHook(thisValue, fn, [event]);
  }, () => {});
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const signedComponentToMetaMap = new Map();
/**
 * INTERNAL: This function can only be invoked by compiled code. The compiler
 * will prevent this function from being imported by userland code.
 */

function registerComponent(Ctor, {
  name,
  tmpl: template
}) {
  signedComponentToMetaMap.set(Ctor, {
    name,
    template
  }); // chaining this method as a way to wrap existing
  // assignment of component constructor easily, without too much transformation

  return Ctor;
}

function getComponentRegisteredMeta(Ctor) {
  return signedComponentToMetaMap.get(Ctor);
}

function createComponent(uninitializedVm, Ctor) {
  {
    assert.isTrue(uninitializedVm && 'cmpProps' in uninitializedVm, `${uninitializedVm} is not a vm.`);
  } // create the component instance


  invokeComponentConstructor(uninitializedVm, Ctor);
  const initializedVm = uninitializedVm;

  if (isUndefined(initializedVm.component)) {
    throw new ReferenceError(`Invalid construction for ${Ctor}, you must extend LightningElement.`);
  }
}

function linkComponent(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  } // wiring service


  const {
    def: {
      wire
    }
  } = vm;

  if (wire) {
    const {
      wiring
    } = Services;

    if (wiring) {
      invokeServiceHook(vm, wiring);
    }
  }
}

function getTemplateReactiveObserver(vm) {
  return new ReactiveObserver(() => {
    {
      assert.invariant(!isInvokingRender, `Mutating property is not allowed during the rendering life-cycle of ${getVMBeingRendered()}.`);
      assert.invariant(!isUpdatingTemplate, `Mutating property is not allowed while updating template of ${getVMBeingRendered()}.`);
    }

    const {
      isDirty
    } = vm;

    if (isFalse$1(isDirty)) {
      markComponentAsDirty(vm);
      scheduleRehydration(vm);
    }
  });
}

function renderComponent(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.invariant(vm.isDirty, `${vm} is not dirty.`);
  }

  vm.tro.reset();
  const vnodes = invokeComponentRenderMethod(vm);
  vm.isDirty = false;
  vm.isScheduled = false;

  {
    assert.invariant(isArray$1(vnodes), `${vm}.render() should always return an array of vnodes instead of ${vnodes}`);
  }

  return vnodes;
}

function markComponentAsDirty(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    const vmBeingRendered = getVMBeingRendered();
    assert.isFalse(vm.isDirty, `markComponentAsDirty() for ${vm} should not be called when the component is already dirty.`);
    assert.isFalse(isInvokingRender, `markComponentAsDirty() for ${vm} cannot be called during rendering of ${vmBeingRendered}.`);
    assert.isFalse(isUpdatingTemplate, `markComponentAsDirty() for ${vm} cannot be called while updating template of ${vmBeingRendered}.`);
  }

  vm.isDirty = true;
}

const cmpEventListenerMap = new WeakMap();

function getWrappedComponentsListener(vm, listener) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  if (!isFunction(listener)) {
    throw new TypeError(); // avoiding problems with non-valid listeners
  }

  let wrappedListener = cmpEventListenerMap.get(listener);

  if (isUndefined(wrappedListener)) {
    wrappedListener = function (event) {
      invokeEventListener(vm, listener, undefined, event);
    };

    cmpEventListenerMap.set(listener, wrappedListener);
  }

  return wrappedListener;
}

function getComponentAsString(component) {

  const vm = getComponentVM(component);
  return `<${StringToLowerCase.call(tagNameGetter.call(vm.elm))}>`;
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


function createObservedFieldsDescriptorMap(fields) {
  return ArrayReduce.call(fields, (acc, field) => {
    acc[field] = createObservedFieldPropertyDescriptor(field);
    return acc;
  }, {});
}

function createObservedFieldPropertyDescriptor(key) {
  return {
    get() {
      const vm = getComponentVM(this);

      {
        assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a valid vm.`);
      }

      valueObserved(this, key);
      return vm.cmpTrack[key];
    },

    set(newValue) {
      const vm = getComponentVM(this);

      {
        assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a valid vm.`);
      }

      if (newValue !== vm.cmpTrack[key]) {
        vm.cmpTrack[key] = newValue;

        if (isFalse$1(vm.isDirty)) {
          valueMutated(this, key);
        }
      }
    },

    enumerable: true,
    configurable: true
  };
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const ShadowRootHostGetter = getOwnPropertyDescriptor(ShadowRoot.prototype, 'host').get;
const ShadowRootInnerHTMLSetter = getOwnPropertyDescriptor(ShadowRoot.prototype, 'innerHTML').set;
const dispatchEvent = 'EventTarget' in window ? EventTarget.prototype.dispatchEvent : Node.prototype.dispatchEvent; // IE11

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const GlobalEvent = Event; // caching global reference to avoid poisoning

const {
  setHiddenField: setHiddenField$1
} = fields;
/**
 * This operation is called with a descriptor of an standard html property
 * that a Custom Element can support (including AOM properties), which
 * determines what kind of capabilities the Base Lightning Element should support. When producing the new descriptors
 * for the Base Lightning Element, it also include the reactivity bit, so the standard property is reactive.
 */

function createBridgeToElementDescriptor(propName, descriptor) {
  const {
    get,
    set,
    enumerable,
    configurable
  } = descriptor;

  if (!isFunction(get)) {
    {
      assert.fail(`Detected invalid public property descriptor for HTMLElement.prototype.${propName} definition. Missing the standard getter.`);
    }

    throw new TypeError();
  }

  if (!isFunction(set)) {
    {
      assert.fail(`Detected invalid public property descriptor for HTMLElement.prototype.${propName} definition. Missing the standard setter.`);
    }

    throw new TypeError();
  }

  return {
    enumerable,
    configurable,

    get() {
      const vm = getComponentVM(this);

      {
        assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
      }

      if (isBeingConstructed(vm)) {
        {
          const name = vm.elm.constructor.name;
          logError(`\`${name}\` constructor can't read the value of property \`${propName}\` because the owner component hasn't set the value yet. Instead, use the \`${name}\` constructor to set a default value for the property.`, vm.elm);
        }

        return;
      }

      valueObserved(this, propName);
      return get.call(vm.elm);
    },

    set(newValue) {
      const vm = getComponentVM(this);

      {
        assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${vm}.${propName}`);
        assert.invariant(!isUpdatingTemplate, `When updating the template of ${vmBeingRendered}, one of the accessors used by the template has side effects on the state of ${vm}.${propName}`);
        assert.isFalse(isBeingConstructed(vm), `Failed to construct '${getComponentAsString(this)}': The result must not have attributes.`);
        assert.invariant(!isObject$1(newValue) || isNull(newValue), `Invalid value "${newValue}" for "${propName}" of ${vm}. Value cannot be an object, must be a primitive value.`);
      }

      if (newValue !== vm.cmpProps[propName]) {
        vm.cmpProps[propName] = newValue;

        if (isFalse$1(vm.isDirty)) {
          // perf optimization to skip this step if not in the DOM
          valueMutated(this, propName);
        }
      }

      return set.call(vm.elm, newValue);
    }

  };
}

function getLinkedElement(cmp) {
  return getComponentVM(cmp).elm;
}
/**
 * This class is the base class for any LWC element.
 * Some elements directly extends this class, others implement it via inheritance.
 **/


function BaseLightningElementConstructor() {
  // This should be as performant as possible, while any initialization should be done lazily
  if (isNull(vmBeingConstructed)) {
    throw new ReferenceError();
  }

  {
    assert.isTrue('cmpProps' in vmBeingConstructed, `${vmBeingConstructed} is not a vm.`);
    assert.invariant(vmBeingConstructed.elm instanceof HTMLElement, `Component creation requires a DOM element to be associated to ${vmBeingConstructed}.`);
  }

  const vm = vmBeingConstructed;
  const {
    elm,
    mode,
    def: {
      ctor
    }
  } = vm;
  const component = this;
  vm.component = component;
  vm.tro = getTemplateReactiveObserver(vm);
  vm.oar = create(null); // interaction hooks
  // We are intentionally hiding this argument from the formal API of LWCElement because
  // we don't want folks to know about it just yet.

  if (arguments.length === 1) {
    const {
      callHook,
      setHook,
      getHook
    } = arguments[0];
    vm.callHook = callHook;
    vm.setHook = setHook;
    vm.getHook = getHook;
  } // attaching the shadowRoot


  const shadowRootOptions = {
    mode,
    delegatesFocus: !!ctor.delegatesFocus
  };
  const cmpRoot = elm.attachShadow(shadowRootOptions); // linking elm, shadow root and component with the VM

  setHiddenField$1(component, ViewModelReflection, vm);
  setHiddenField$1(cmpRoot, ViewModelReflection, vm);
  setHiddenField$1(elm, ViewModelReflection, vm); // VM is now initialized

  vm.cmpRoot = cmpRoot;

  {
    patchComponentWithRestrictions(component);
    patchShadowRootWithRestrictions(cmpRoot, EmptyObject);
  }

  return this;
} // HTML Element - The Good Parts


BaseLightningElementConstructor.prototype = {
  constructor: BaseLightningElementConstructor,

  dispatchEvent(event) {
    const elm = getLinkedElement(this);
    const vm = getComponentVM(this);

    {
      if (arguments.length === 0) {
        throw new Error(`Failed to execute 'dispatchEvent' on ${getComponentAsString(this)}: 1 argument required, but only 0 present.`);
      }

      if (!(event instanceof GlobalEvent)) {
        throw new Error(`Failed to execute 'dispatchEvent' on ${getComponentAsString(this)}: parameter 1 is not of type 'Event'.`);
      }

      const {
        type: evtName
      } = event;
      assert.isFalse(isBeingConstructed(vm), `this.dispatchEvent() should not be called during the construction of the custom element for ${getComponentAsString(this)} because no one is listening for the event "${evtName}" just yet.`);

      if (!/^[a-z][a-z0-9_]*$/.test(evtName)) {
        logError(`Invalid event type "${evtName}" dispatched in element ${getComponentAsString(this)}. Event name must ${['1) Start with a lowercase letter', '2) Contain only lowercase letters, numbers, and underscores'].join(' ')}`, elm);
      }
    }

    return dispatchEvent.call(elm, event);
  },

  addEventListener(type, listener, options) {
    const vm = getComponentVM(this);

    {
      const vmBeingRendered = getVMBeingRendered();
      assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
      assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${vm} by adding an event listener for "${type}".`);
      assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${vm} by adding an event listener for "${type}".`);
      assert.invariant(isFunction(listener), `Invalid second argument for this.addEventListener() in ${vm} for event "${type}". Expected an EventListener but received ${listener}.`);
    }

    const wrappedListener = getWrappedComponentsListener(vm, listener);
    vm.elm.addEventListener(type, wrappedListener, options);
  },

  removeEventListener(type, listener, options) {
    const vm = getComponentVM(this);

    {
      assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }

    const wrappedListener = getWrappedComponentsListener(vm, listener);
    vm.elm.removeEventListener(type, wrappedListener, options);
  },

  setAttributeNS(ns, attrName, _value) {
    const elm = getLinkedElement(this);

    {
      assert.isFalse(isBeingConstructed(getComponentVM(this)), `Failed to construct '${getComponentAsString(this)}': The result must not have attributes.`);
    }
    // @ts-ignore type-mismatch

    elm.setAttributeNS.apply(elm, arguments);
  },

  removeAttributeNS(ns, attrName) {
    const elm = getLinkedElement(this);
    // @ts-ignore type-mismatch

    elm.removeAttributeNS.apply(elm, arguments);
  },

  removeAttribute(attrName) {
    const elm = getLinkedElement(this);
    // @ts-ignore type-mismatch

    elm.removeAttribute.apply(elm, arguments);
  },

  setAttribute(attrName, _value) {
    const elm = getLinkedElement(this);

    {
      assert.isFalse(isBeingConstructed(getComponentVM(this)), `Failed to construct '${getComponentAsString(this)}': The result must not have attributes.`);
    }
    // @ts-ignore type-mismatch

    elm.setAttribute.apply(elm, arguments);
  },

  getAttribute(attrName) {
    const elm = getLinkedElement(this);
    // @ts-ignore type-mismatch

    const value = elm.getAttribute.apply(elm, arguments);
    return value;
  },

  getAttributeNS(ns, attrName) {
    const elm = getLinkedElement(this);
    // @ts-ignore type-mismatch

    const value = elm.getAttributeNS.apply(elm, arguments);
    return value;
  },

  getBoundingClientRect() {
    const elm = getLinkedElement(this);

    {
      const vm = getComponentVM(this);
      assert.isFalse(isBeingConstructed(vm), `this.getBoundingClientRect() should not be called during the construction of the custom element for ${getComponentAsString(this)} because the element is not yet in the DOM, instead, you can use it in one of the available life-cycle hooks.`);
    }

    return elm.getBoundingClientRect();
  },

  /**
   * Returns the first element that is a descendant of node that
   * matches selectors.
   */
  // querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
  // querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
  querySelector(selectors) {
    const vm = getComponentVM(this);

    {
      assert.isFalse(isBeingConstructed(vm), `this.querySelector() cannot be called during the construction of the custom element for ${getComponentAsString(this)} because no children has been added to this element yet.`);
    }

    const {
      elm
    } = vm;
    return elm.querySelector(selectors);
  },

  /**
   * Returns all element descendants of node that
   * match selectors.
   */
  // querySelectorAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>,
  // querySelectorAll<K extends keyof SVGElementTagNameMap>(selectors: K): NodeListOf<SVGElementTagNameMap[K]>,
  querySelectorAll(selectors) {
    const vm = getComponentVM(this);

    {
      assert.isFalse(isBeingConstructed(vm), `this.querySelectorAll() cannot be called during the construction of the custom element for ${getComponentAsString(this)} because no children has been added to this element yet.`);
    }

    const {
      elm
    } = vm;
    return elm.querySelectorAll(selectors);
  },

  /**
   * Returns all element descendants of node that
   * match the provided tagName.
   */
  getElementsByTagName(tagNameOrWildCard) {
    const vm = getComponentVM(this);

    {
      assert.isFalse(isBeingConstructed(vm), `this.getElementsByTagName() cannot be called during the construction of the custom element for ${getComponentAsString(this)} because no children has been added to this element yet.`);
    }

    const {
      elm
    } = vm;
    return elm.getElementsByTagName(tagNameOrWildCard);
  },

  /**
   * Returns all element descendants of node that
   * match the provide classnames.
   */
  getElementsByClassName(names) {
    const vm = getComponentVM(this);

    {
      assert.isFalse(isBeingConstructed(vm), `this.getElementsByClassName() cannot be called during the construction of the custom element for ${getComponentAsString(this)} because no children has been added to this element yet.`);
    }

    const {
      elm
    } = vm;
    return elm.getElementsByClassName(names);
  },

  get classList() {
    {
      const vm = getComponentVM(this); // TODO: #1290 - this still fails in dev but works in production, eventually, we should just throw in all modes

      assert.isFalse(isBeingConstructed(vm), `Failed to construct ${vm}: The result must not have attributes. Adding or tampering with classname in constructor is not allowed in a web component, use connectedCallback() instead.`);
    }

    return getLinkedElement(this).classList;
  },

  get template() {
    const vm = getComponentVM(this);

    {
      assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }

    return vm.cmpRoot;
  },

  get shadowRoot() {
    // From within the component instance, the shadowRoot is always
    // reported as "closed". Authors should rely on this.template instead.
    return null;
  },

  render() {
    const vm = getComponentVM(this);
    return vm.def.template;
  },

  toString() {
    const vm = getComponentVM(this);

    {
      assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    }

    return `[object ${vm.def.name}]`;
  }

}; // Typescript is inferring the wrong function type for this particular
// overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
// @ts-ignore type-mismatch

const baseDescriptors = ArrayReduce.call(getOwnPropertyNames(HTMLElementOriginalDescriptors), (descriptors, propName) => {
  descriptors[propName] = createBridgeToElementDescriptor(propName, HTMLElementOriginalDescriptors[propName]);
  return descriptors;
}, create(null));
defineProperties(BaseLightningElementConstructor.prototype, baseDescriptors);

{
  patchLightningElementPrototypeWithRestrictions(BaseLightningElementConstructor.prototype);
}

freeze(BaseLightningElementConstructor);
seal(BaseLightningElementConstructor.prototype); // @ts-ignore

const BaseLightningElement = BaseLightningElementConstructor;
/**
 * Copyright (C) 2018 salesforce.com, inc.
 */

/**
 * Copyright (C) 2018 salesforce.com, inc.
 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const {
  assign: assign$1,
  create: create$2,
  defineProperties: defineProperties$1,
  defineProperty: defineProperty$1,
  freeze: freeze$1,
  getOwnPropertyDescriptor: getOwnPropertyDescriptor$2,
  getOwnPropertyNames: getOwnPropertyNames$2,
  getPrototypeOf: getPrototypeOf$2,
  hasOwnProperty: hasOwnProperty$3,
  keys: keys$1,
  seal: seal$1,
  setPrototypeOf: setPrototypeOf$1
} = Object;
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * In IE11, symbols are expensive.
 * Due to the nature of the symbol polyfill. This method abstract the
 * creation of symbols, so we can fallback to string when native symbols
 * are not supported. Note that we can't use typeof since it will fail when transpiling.
 */


const hasNativeSymbolsSupport$1 = Symbol('x').toString() === 'Symbol(x)';
/** version: 1.1.8 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const runtimeFlags = create$2(null); // This function is not whitelisted for use within components and is meant for
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const signedDecoratorToMetaMap = new Map();

function getDecoratorsRegisteredMeta(Ctor) {
  return signedDecoratorToMetaMap.get(Ctor);
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const CtorToDefMap = new WeakMap();

function getCtorProto(Ctor, subclassComponentName) {
  let proto = getPrototypeOf(Ctor);

  if (isNull(proto)) {
    throw new ReferenceError(`Invalid prototype chain for ${subclassComponentName}, you must extend LightningElement.`);
  } // covering the cases where the ref is circular in AMD


  if (isCircularModuleDependency(proto)) {
    const p = resolveCircularModuleDependency(proto);

    {
      if (isNull(p)) {
        throw new ReferenceError(`Circular module dependency for ${subclassComponentName}, must resolve to a constructor that extends LightningElement.`);
      }
    } // escape hatch for Locker and other abstractions to provide their own base class instead
    // of our Base class without having to leak it to user-land. If the circular function returns
    // itself, that's the signal that we have hit the end of the proto chain, which must always
    // be base.


    proto = p === proto ? BaseLightningElement : p;
  }

  return proto;
}

function createComponentDef(Ctor, meta, subclassComponentName) {
  {
    // local to dev block
    const ctorName = Ctor.name; // Removing the following assert until https://bugs.webkit.org/show_bug.cgi?id=190140 is fixed.
    // assert.isTrue(ctorName && isString(ctorName), `${toString(Ctor)} should have a "name" property with string value, but found ${ctorName}.`);

    assert.isTrue(Ctor.constructor, `Missing ${ctorName}.constructor, ${ctorName} should have a "constructor" property.`);
  }

  const {
    name
  } = meta;
  let {
    template
  } = meta;
  const decoratorsMeta = getDecoratorsRegisteredMeta(Ctor);
  let props = {};
  let methods = {};
  let wire;
  let track = {};
  let fields;

  if (!isUndefined(decoratorsMeta)) {
    props = decoratorsMeta.props;
    methods = decoratorsMeta.methods;
    wire = decoratorsMeta.wire;
    track = decoratorsMeta.track;
    fields = decoratorsMeta.fields;
  }

  const proto = Ctor.prototype;
  let {
    connectedCallback,
    disconnectedCallback,
    renderedCallback,
    errorCallback,
    render
  } = proto;
  const superProto = getCtorProto(Ctor, subclassComponentName);
  const superDef = superProto !== BaseLightningElement ? getComponentDef(superProto, subclassComponentName) : null;
  const SuperBridge = isNull(superDef) ? BaseBridgeElement : superDef.bridge;
  const bridge = HTMLBridgeElementFactory(SuperBridge, getOwnPropertyNames(props), getOwnPropertyNames(methods));

  if (!isNull(superDef)) {
    props = assign(create(null), superDef.props, props);
    methods = assign(create(null), superDef.methods, methods);
    wire = superDef.wire || wire ? assign(create(null), superDef.wire, wire) : undefined;
    track = assign(create(null), superDef.track, track);
    connectedCallback = connectedCallback || superDef.connectedCallback;
    disconnectedCallback = disconnectedCallback || superDef.disconnectedCallback;
    renderedCallback = renderedCallback || superDef.renderedCallback;
    errorCallback = errorCallback || superDef.errorCallback;
    render = render || superDef.render;
    template = template || superDef.template;
  }

  props = assign(create(null), HTML_PROPS, props);

  if (!isUndefined(fields)) {
    defineProperties(proto, createObservedFieldsDescriptorMap(fields));
  }

  if (isUndefined(template)) {
    // default template
    template = defaultEmptyTemplate;
  }

  const def = {
    ctor: Ctor,
    name,
    wire,
    track,
    props,
    methods,
    bridge,
    template,
    connectedCallback,
    disconnectedCallback,
    renderedCallback,
    errorCallback,
    render
  };

  {
    freeze(Ctor.prototype);
  }

  return def;
}
/**
 * EXPERIMENTAL: This function allows for the identification of LWC
 * constructors. This API is subject to change or being removed.
 */


function isComponentConstructor(ctor) {
  if (!isFunction(ctor)) {
    return false;
  } // Fast path: LightningElement is part of the prototype chain of the constructor.


  if (ctor.prototype instanceof BaseLightningElement) {
    return true;
  } // Slow path: LightningElement is not part of the prototype chain of the constructor, we need
  // climb up the constructor prototype chain to check in case there are circular dependencies
  // to resolve.


  let current = ctor;

  do {
    if (isCircularModuleDependency(current)) {
      const circularResolved = resolveCircularModuleDependency(current); // If the circular function returns itself, that's the signal that we have hit the end of the proto chain,
      // which must always be a valid base constructor.

      if (circularResolved === current) {
        return true;
      }

      current = circularResolved;
    }

    if (current === BaseLightningElement) {
      return true;
    }
  } while (!isNull(current) && (current = getPrototypeOf(current))); // Finally return false if the LightningElement is not part of the prototype chain.


  return false;
}
/**
 * EXPERIMENTAL: This function allows for the collection of internal
 * component metadata. This API is subject to change or being removed.
 */


function getComponentDef(Ctor, subclassComponentName) {
  let def = CtorToDefMap.get(Ctor);

  if (isUndefined(def)) {
    if (!isComponentConstructor(Ctor)) {
      throw new TypeError(`${Ctor} is not a valid component, or does not extends LightningElement from "lwc". You probably forgot to add the extend clause on the class declaration.`);
    }

    let meta = getComponentRegisteredMeta(Ctor);

    if (isUndefined(meta)) {
      // TODO: #1295 - remove this workaround after refactoring tests
      meta = {
        template: undefined,
        name: Ctor.name
      };
    }

    def = createComponentDef(Ctor, meta, subclassComponentName || Ctor.name);
    CtorToDefMap.set(Ctor, def);
  }

  return def;
}
// No DOM Patching occurs here


function setElementProto(elm, def) {
  setPrototypeOf(elm, def.bridge.prototype);
} // overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
// @ts-ignore type-mismatch


const HTML_PROPS = ArrayReduce.call(getOwnPropertyNames(HTMLElementOriginalDescriptors), (props, propName) => {
  const attrName = getAttrNameFromPropName(propName);
  props[propName] = {
    config: 3,
    type: 'any',
    attr: attrName
  };
  return props;
}, create(null));
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const {
  appendChild,
  insertBefore,
  removeChild,
  replaceChild
} = Node.prototype;
const parentNodeGetter = getOwnPropertyDescriptor(Node.prototype, 'parentNode').get;
const parentElementGetter = hasOwnProperty.call(Node.prototype, 'parentElement') ? getOwnPropertyDescriptor(Node.prototype, 'parentElement').get : getOwnPropertyDescriptor(HTMLElement.prototype, 'parentElement').get; // IE11

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

var VMState;

(function (VMState) {
  VMState[VMState["created"] = 0] = "created";
  VMState[VMState["connected"] = 1] = "connected";
  VMState[VMState["disconnected"] = 2] = "disconnected";
})(VMState || (VMState = {}));

let idx = 0;

function callHook(cmp, fn, args = []) {
  return fn.apply(cmp, args);
}

function setHook(cmp, prop, newValue) {
  cmp[prop] = newValue;
}

function getHook(cmp, prop) {
  return cmp[prop];
}

function rerenderVM(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  rehydrate(vm);
}

function appendRootVM(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  runConnectedCallback(vm);
  rehydrate(vm);
}

function appendVM(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(vm.state === VMState.created, `${vm} cannot be recycled.`);
  }

  runConnectedCallback(vm);
  rehydrate(vm);
} // just in case the component comes back, with this we guarantee re-rendering it
// while preventing any attempt to rehydration until after reinsertion.


function resetComponentStateWhenRemoved(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  const {
    state
  } = vm;

  if (state !== VMState.disconnected) {
    const {
      oar,
      tro
    } = vm; // Making sure that any observing record will not trigger the rehydrated on this vm

    tro.reset(); // Making sure that any observing accessor record will not trigger the setter to be reinvoked

    for (const key in oar) {
      oar[key].reset();
    }

    runDisconnectedCallback(vm); // Spec: https://dom.spec.whatwg.org/#concept-node-remove (step 14-15)

    runShadowChildNodesDisconnectedCallback(vm);
    runLightChildNodesDisconnectedCallback(vm);
  }
} // this method is triggered by the diffing algo only when a vnode from the
// old vnode.children is removed from the DOM.


function removeVM(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(vm.state === VMState.connected || vm.state === VMState.disconnected, `${vm} must have been connected.`);
  }

  resetComponentStateWhenRemoved(vm);
} // this method is triggered by the removal of a root element from the DOM.


function removeRootVM(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  resetComponentStateWhenRemoved(vm);
}

function createVM(elm, Ctor, options) {
  {
    assert.invariant(elm instanceof HTMLElement, `VM creation requires a DOM element instead of ${elm}.`);
  }

  const def = getComponentDef(Ctor);
  const {
    isRoot,
    mode,
    owner
  } = options;
  idx += 1;
  const uninitializedVm = {
    // component creation index is defined once, and never reset, it can
    // be preserved from one insertion to another without any issue
    idx,
    state: VMState.created,
    isScheduled: false,
    isDirty: true,
    isRoot: isTrue$1(isRoot),
    mode,
    def,
    owner,
    elm,
    data: EmptyObject,
    context: create(null),
    cmpProps: create(null),
    cmpTrack: create(null),
    cmpSlots: useSyntheticShadow ? create(null) : undefined,
    callHook,
    setHook,
    getHook,
    children: EmptyArray,
    aChildren: EmptyArray,
    velements: EmptyArray,
    // Perf optimization to preserve the shape of this obj
    cmpTemplate: undefined,
    component: undefined,
    cmpRoot: undefined,
    tro: undefined,
    oar: undefined
  };

  {
    uninitializedVm.toString = () => {
      return `[object:vm ${def.name} (${uninitializedVm.idx})]`;
    };
  } // create component instance associated to the vm and the element


  createComponent(uninitializedVm, Ctor); // link component to the wire service

  const initializedVm = uninitializedVm;
  linkComponent(initializedVm);
}

function rehydrate(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(vm.elm instanceof HTMLElement, `rehydration can only happen after ${vm} was patched the first time.`);
  }

  if (isTrue$1(vm.isDirty)) {
    const children = renderComponent(vm);
    patchShadowRoot(vm, children);
  }
}

function patchShadowRoot(vm, newCh) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  const {
    cmpRoot,
    children: oldCh
  } = vm;
  vm.children = newCh; // caching the new children collection

  if ((newCh.length > 0 || oldCh.length > 0) && oldCh !== newCh) {
    // patch function mutates vnodes by adding the element reference,
    // however, if patching fails it contains partial changes.
    const fn = hasDynamicChildren(newCh) ? updateDynamicChildren : updateStaticChildren;
    runWithBoundaryProtection(vm, vm, () => {
      // pre
      {
        startMeasure('patch', vm);
      }
    }, () => {
      // job
      fn(cmpRoot, oldCh, newCh);
    }, () => {
      // post
      {
        endMeasure('patch', vm);
      }
    });
  }

  if (vm.state === VMState.connected) {
    // If the element is connected, that means connectedCallback was already issued, and
    // any successive rendering should finish with the call to renderedCallback, otherwise
    // the connectedCallback will take care of calling it in the right order at the end of
    // the current rehydration process.
    runRenderedCallback(vm);
  }
}

function runRenderedCallback(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  const {
    rendered
  } = Services;

  if (rendered) {
    invokeServiceHook(vm, rendered);
  }

  const {
    renderedCallback
  } = vm.def;

  if (!isUndefined(renderedCallback)) {
    {
      startMeasure('renderedCallback', vm);
    }

    invokeComponentCallback(vm, renderedCallback);

    {
      endMeasure('renderedCallback', vm);
    }
  }
}

let rehydrateQueue = [];

function flushRehydrationQueue() {
  startGlobalMeasure(GlobalMeasurementPhase.REHYDRATE);

  {
    assert.invariant(rehydrateQueue.length, `If rehydrateQueue was scheduled, it is because there must be at least one VM on this pending queue instead of ${rehydrateQueue}.`);
  }

  const vms = rehydrateQueue.sort((a, b) => a.idx - b.idx);
  rehydrateQueue = []; // reset to a new queue

  for (let i = 0, len = vms.length; i < len; i += 1) {
    const vm = vms[i];

    try {
      rehydrate(vm);
    } catch (error) {
      if (i + 1 < len) {
        // pieces of the queue are still pending to be rehydrated, those should have priority
        if (rehydrateQueue.length === 0) {
          addCallbackToNextTick(flushRehydrationQueue);
        }

        ArrayUnshift$1.apply(rehydrateQueue, ArraySlice$1.call(vms, i + 1));
      } // we need to end the measure before throwing.


      endGlobalMeasure(GlobalMeasurementPhase.REHYDRATE); // re-throwing the original error will break the current tick, but since the next tick is
      // already scheduled, it should continue patching the rest.

      throw error; // eslint-disable-line no-unsafe-finally
    }
  }

  endGlobalMeasure(GlobalMeasurementPhase.REHYDRATE);
}

function runConnectedCallback(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  const {
    state
  } = vm;

  if (state === VMState.connected) {
    return; // nothing to do since it was already connected
  }

  vm.state = VMState.connected; // reporting connection

  const {
    connected
  } = Services;

  if (connected) {
    invokeServiceHook(vm, connected);
  }

  const {
    connectedCallback
  } = vm.def;

  if (!isUndefined(connectedCallback)) {
    {
      startMeasure('connectedCallback', vm);
    }

    invokeComponentCallback(vm, connectedCallback);

    {
      endMeasure('connectedCallback', vm);
    }
  }
}

function runDisconnectedCallback(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.isTrue(vm.state !== VMState.disconnected, `${vm} must be inserted.`);
  }

  if (isFalse$1(vm.isDirty)) {
    // this guarantees that if the component is reused/reinserted,
    // it will be re-rendered because we are disconnecting the reactivity
    // linking, so mutations are not automatically reflected on the state
    // of disconnected components.
    vm.isDirty = true;
  }

  vm.state = VMState.disconnected; // reporting disconnection

  const {
    disconnected
  } = Services;

  if (disconnected) {
    invokeServiceHook(vm, disconnected);
  }

  const {
    disconnectedCallback
  } = vm.def;

  if (!isUndefined(disconnectedCallback)) {
    {
      startMeasure('disconnectedCallback', vm);
    }

    invokeComponentCallback(vm, disconnectedCallback);

    {
      endMeasure('disconnectedCallback', vm);
    }
  }
}

function runShadowChildNodesDisconnectedCallback(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  const {
    velements: vCustomElementCollection
  } = vm; // reporting disconnection for every child in inverse order since they are inserted in reserved order

  for (let i = vCustomElementCollection.length - 1; i >= 0; i -= 1) {
    const elm = vCustomElementCollection[i].elm; // There are two cases where the element could be undefined:
    // * when there is an error during the construction phase, and an
    //   error boundary picks it, there is a possibility that the VCustomElement
    //   is not properly initialized, and therefore is should be ignored.
    // * when slotted custom element is not used by the element where it is slotted
    //   into it, as a result, the custom element was never initialized.

    if (!isUndefined(elm)) {
      const childVM = getCustomElementVM(elm);
      resetComponentStateWhenRemoved(childVM);
    }
  }
}

function runLightChildNodesDisconnectedCallback(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  const {
    aChildren: adoptedChildren
  } = vm;
  recursivelyDisconnectChildren(adoptedChildren);
}
/**
 * The recursion doesn't need to be a complete traversal of the vnode graph,
 * instead it can be partial, when a custom element vnode is found, we don't
 * need to continue into its children because by attempting to disconnect the
 * custom element itself will trigger the removal of anything slotted or anything
 * defined on its shadow.
 */


function recursivelyDisconnectChildren(vnodes) {
  for (let i = 0, len = vnodes.length; i < len; i += 1) {
    const vnode = vnodes[i];

    if (!isNull(vnode) && isArray$1(vnode.children) && !isUndefined(vnode.elm)) {
      // vnode is a VElement with children
      if (isUndefined(vnode.ctor)) {
        // it is a VElement, just keep looking (recursively)
        recursivelyDisconnectChildren(vnode.children);
      } else {
        // it is a VCustomElement, disconnect it and ignore its children
        resetComponentStateWhenRemoved(getCustomElementVM(vnode.elm));
      }
    }
  }
} // This is a super optimized mechanism to remove the content of the shadowRoot
// without having to go into snabbdom. Especially useful when the reset is a consequence
// of an error, in which case the children VNodes might not be representing the current
// state of the DOM


function resetShadowRoot(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  vm.children = EmptyArray;
  ShadowRootInnerHTMLSetter.call(vm.cmpRoot, ''); // disconnecting any known custom element inside the shadow of the this vm

  runShadowChildNodesDisconnectedCallback(vm);
}

function scheduleRehydration(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  if (!vm.isScheduled) {
    vm.isScheduled = true;

    if (rehydrateQueue.length === 0) {
      addCallbackToNextTick(flushRehydrationQueue);
    }

    ArrayPush.call(rehydrateQueue, vm);
  }
}

function getErrorBoundaryVMFromOwnElement(vm) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  const {
    elm
  } = vm;
  return getErrorBoundaryVM(elm);
}

const {
  getHiddenField: getHiddenField$5
} = fields;

function getErrorBoundaryVM(startingElement) {
  let elm = startingElement;
  let vm;

  while (!isNull(elm)) {
    vm = getHiddenField$5(elm, ViewModelReflection);

    if (!isUndefined(vm) && !isUndefined(vm.def.errorCallback)) {
      return vm;
    }

    elm = getParentOrHostElement(elm);
  }
}
/**
 * Returns the component stack. Used for errors messages only.
 *
 * @param {Element} startingElement
 *
 * @return {string} The component stack for errors.
 */


function getErrorComponentStack(startingElement) {
  const wcStack = [];
  let elm = startingElement;

  do {
    const currentVm = getHiddenField$5(elm, ViewModelReflection);

    if (!isUndefined(currentVm)) {
      const tagName = tagNameGetter.call(elm);
      const is = elm.getAttribute('is');
      ArrayPush.call(wcStack, `<${StringToLowerCase.call(tagName)}${is ? ' is="${is}' : ''}>`);
    }

    elm = getParentOrHostElement(elm);
  } while (!isNull(elm));

  return wcStack.reverse().join('\n\t');
}
/**
 * Finds the parent of the specified element. If shadow DOM is enabled, finds
 * the host of the shadow root to escape the shadow boundary.
 */


function getParentOrHostElement(elm) {
  const parentElement = parentElementGetter.call(elm); // If parentElement is a shadow root, find the host instead

  return isNull(parentElement) ? getHostElement(elm) : parentElement;
}
/**
 * Finds the host element, if it exists.
 */


function getHostElement(elm) {
  {
    assert.isTrue(isNull(parentElementGetter.call(elm)), `getHostElement should only be called if the parent element of ${elm} is null`);
  }

  const parentNode = parentNodeGetter.call(elm);
  return parentNode instanceof ShadowRoot ? ShadowRootHostGetter.call(parentNode) : null;
}

function getCustomElementVM(elm) {
  {
    const vm = getHiddenField$5(elm, ViewModelReflection);
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  return getHiddenField$5(elm, ViewModelReflection);
}

function getComponentVM(component) {
  {
    const vm = getHiddenField$5(component, ViewModelReflection);
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  return getHiddenField$5(component, ViewModelReflection);
}

function getShadowRootVM(root) {
  // TODO: #1299 - use a weak map instead of an internal field
  {
    const vm = getHiddenField$5(root, ViewModelReflection);
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  return getHiddenField$5(root, ViewModelReflection);
} // slow path routine
// NOTE: we should probably more this routine to the synthetic shadow folder
// and get the allocation to be cached by in the elm instead of in the VM


function allocateInSlot(vm, children) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
    assert.invariant(isObject$1(vm.cmpSlots), `When doing manual allocation, there must be a cmpSlots object available.`);
  }

  const {
    cmpSlots: oldSlots
  } = vm;
  const cmpSlots = vm.cmpSlots = create(null);

  for (let i = 0, len = children.length; i < len; i += 1) {
    const vnode = children[i];

    if (isNull(vnode)) {
      continue;
    }

    const {
      data
    } = vnode;
    const slotName = data.attrs && data.attrs.slot || '';
    const vnodes = cmpSlots[slotName] = cmpSlots[slotName] || []; // re-keying the vnodes is necessary to avoid conflicts with default content for the slot
    // which might have similar keys. Each vnode will always have a key that
    // starts with a numeric character from compiler. In this case, we add a unique
    // notation for slotted vnodes keys, e.g.: `@foo:1:1`

    vnode.key = `@${slotName}:${vnode.key}`;
    ArrayPush.call(vnodes, vnode);
  }

  if (isFalse$1(vm.isDirty)) {
    // We need to determine if the old allocation is really different from the new one
    // and mark the vm as dirty
    const oldKeys = keys(oldSlots);

    if (oldKeys.length !== keys(cmpSlots).length) {
      markComponentAsDirty(vm);
      return;
    }

    for (let i = 0, len = oldKeys.length; i < len; i += 1) {
      const key = oldKeys[i];

      if (isUndefined(cmpSlots[key]) || oldSlots[key].length !== cmpSlots[key].length) {
        markComponentAsDirty(vm);
        return;
      }

      const oldVNodes = oldSlots[key];
      const vnodes = cmpSlots[key];

      for (let j = 0, a = cmpSlots[key].length; j < a; j += 1) {
        if (oldVNodes[j] !== vnodes[j]) {
          markComponentAsDirty(vm);
          return;
        }
      }
    }
  }
}

function runWithBoundaryProtection(vm, owner, pre, job, post) {
  {
    assert.isTrue(vm && 'cmpRoot' in vm, `${vm} is not a vm.`);
  }

  let error;
  pre();

  try {
    job();
  } catch (e) {
    error = Object(e);
  } finally {
    post();

    if (!isUndefined(error)) {
      error.wcStack = error.wcStack || getErrorComponentStack(vm.elm);
      const errorBoundaryVm = isNull(owner) ? undefined : getErrorBoundaryVMFromOwnElement(owner);

      if (isUndefined(errorBoundaryVm)) {
        throw error; // eslint-disable-line no-unsafe-finally
      }

      resetShadowRoot(vm); // remove offenders

      {
        startMeasure('errorCallback', errorBoundaryVm);
      } // error boundaries must have an ErrorCallback


      const errorCallback = errorBoundaryVm.def.errorCallback;
      invokeComponentCallback(errorBoundaryVm, errorCallback, [error, error.wcStack]);

      {
        endMeasure('errorCallback', errorBoundaryVm);
      }
    }
  }
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const {
  createFieldName: createFieldName$2,
  getHiddenField: getHiddenField$6,
  setHiddenField: setHiddenField$2
} = fields;
const ConnectingSlot = createFieldName$2('connecting', 'engine');
const DisconnectingSlot = createFieldName$2('disconnecting', 'engine');

function callNodeSlot(node, slot) {
  {
    assert.isTrue(node, `callNodeSlot() should not be called for a non-object`);
  }

  const fn = getHiddenField$6(node, slot);

  if (!isUndefined(fn)) {
    fn();
  }

  return node; // for convenience
} // monkey patching Node methods to be able to detect the insertions and removal of
// root elements created via createElement.


assign(Node.prototype, {
  appendChild(newChild) {
    const appendedNode = appendChild.call(this, newChild);
    return callNodeSlot(appendedNode, ConnectingSlot);
  },

  insertBefore(newChild, referenceNode) {
    const insertedNode = insertBefore.call(this, newChild, referenceNode);
    return callNodeSlot(insertedNode, ConnectingSlot);
  },

  removeChild(oldChild) {
    const removedNode = removeChild.call(this, oldChild);
    return callNodeSlot(removedNode, DisconnectingSlot);
  },

  replaceChild(newChild, oldChild) {
    const replacedNode = replaceChild.call(this, newChild, oldChild);
    callNodeSlot(replacedNode, DisconnectingSlot);
    callNodeSlot(newChild, ConnectingSlot);
    return replacedNode;
  }

});
/**
 * EXPERIMENTAL: This function is almost identical to document.createElement
 * (https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement)
 * with the slightly difference that in the options, you can pass the `is`
 * property set to a Constructor instead of just a string value. The intent
 * is to allow the creation of an element controlled by LWC without having
 * to register the element as a custom element. E.g.:
 *
 * const el = createElement('x-foo', { is: FooCtor });
 *
 * If the value of `is` attribute is not a constructor,
 * then it throws a TypeError.
 */

function createElement(sel, options) {
  if (!isObject$1(options) || isNull(options)) {
    throw new TypeError(`"createElement" function expects an object as second parameter but received "${toString(options)}".`);
  }

  let Ctor = options.is;

  if (!isFunction(Ctor)) {
    throw new TypeError(`"createElement" function expects a "is" option with a valid component constructor.`);
  }

  const mode = options.mode !== 'closed' ? 'open' : 'closed'; // Create element with correct tagName

  const element = document.createElement(sel);

  if (!isUndefined(getHiddenField$6(element, ViewModelReflection))) {
    // There is a possibility that a custom element is registered under tagName,
    // in which case, the initialization is already carry on, and there is nothing else
    // to do here.
    return element;
  }

  if (isCircularModuleDependency(Ctor)) {
    Ctor = resolveCircularModuleDependency(Ctor);
  }

  const def = getComponentDef(Ctor);
  setElementProto(element, def);

  {
    patchCustomElementWithRestrictions(element, EmptyObject);
  } // In case the element is not initialized already, we need to carry on the manual creation


  createVM(element, Ctor, {
    mode,
    isRoot: true,
    owner: null
  }); // Handle insertion and removal from the DOM manually

  setHiddenField$2(element, ConnectingSlot, () => {
    const vm = getCustomElementVM(element);
    startGlobalMeasure(GlobalMeasurementPhase.HYDRATE, vm);

    if (vm.state === VMState.connected) {
      // usually means moving the element from one place to another, which is observable via life-cycle hooks
      removeRootVM(vm);
    }

    appendRootVM(vm);
    endGlobalMeasure(GlobalMeasurementPhase.HYDRATE, vm);
  });
  setHiddenField$2(element, DisconnectingSlot, () => {
    const vm = getCustomElementVM(element);
    removeRootVM(vm);
  });
  return element;
}
// Adapted from loadash 3.0
// https://github.com/lodash/lodash/tree/3.0.0-npm-packages/lodash.escape
// MIT license
//

/** Used to match HTML entities and HTML characters. */


const reUnescapedHtml = /[&<>"'`]/g,
      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
/** Used to map characters to HTML entities. */

const htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

function escapeHtmlChar(chr) {
  return htmlEscapes[chr];
}

function escape(s) {
  // Reset `lastIndex` because in IE < 9 `String#replace` does not.
  return s && reHasUnescapedHtml.test(s) ? s.replace(reUnescapedHtml, escapeHtmlChar) : s;
}

function serializeStartTag(nodeName, element) {
  const attrs = element.data.attrs || {};
  const keys = Object.keys(attrs).sort(); // Sort only matters during tests

  return `<${nodeName}${keys.map(a => ` ${a}="${attrs[a]}"`).join('')}>`;
}

function serializeEndTag(nodeName) {
  return `</${nodeName}>`;
}

function ɵserialize(vnode) {
  //const _useSyntheticShadow = useSyntheticShadow();
  function serializeChildNodes(childNodes) {
    const strings = childNodes.map(_n => _n ? ɵserialize(_n) : null);
    return strings;
  }

  if (isText(vnode)) {
    return escape(vnode.text || "");
  }

  if (isComment(vnode)) {
    return '<!--' + vnode.text + '-->';
  }

  if (!isElement(vnode)) {
    throw new Error("Internal error: unknown node type, " + JSON.stringify(vnode));
  }

  const element = vnode;
  const nodeName = (element.sel || "").toLowerCase();

  if (isVoidElement(nodeName)) {
    const nodeName = (vnode.sel || "").toLowerCase();
    return serializeStartTag(nodeName, vnode);
  }

  const buffer = [];
  buffer.push(serializeStartTag(nodeName, element)); // if (element.shadowRoot) {
  //     const shadowRootChildNodes = _useSyntheticShadow
  //         ? element.shadowRoot.childNodes
  //         : childNodesGetter.call(element.shadowRoot);
  //     if (shadowRootChildNodes.length > 0) {
  //         const children = serializeChildNodes(shadowRootChildNodes);
  //         buffer.push(`<shadowroot>${children.join('')}</shadowroot>`);
  //     }
  // }
  //const childNodes = _useSyntheticShadow ? element.children : childNodesGetter.call(node);

  const childNodes = element.children;

  if (childNodes.length > 0) {
    const children = serializeChildNodes(childNodes);
    buffer.push(children.join(''));
  }

  buffer.push(serializeEndTag(nodeName));
  const result = buffer.join('');
  return result;
}

function serializeVNode(node) {
  return node ? ɵserialize(node) : "";
}

function serializeVNodes(nodes) {
  return nodes.reduce((value, vnode) => {
    const s = serializeVNode(vnode);
    return value + s;
  }, "");
}
/**
 * Void elements can't have any contents (since there's no end tag, no content can be put between the start tag and the end tag).
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#elements-2
 */


const VOID_ELEMENTS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

function isVoidElement(nodeName) {
  return VOID_ELEMENTS.includes(nodeName);
}

function isElement(node) {
  return !!node.sel;
}

function isComment(node) {
  return node.sel === '!';
}

function isText(node) {
  return node.sel === undefined;
}
/**
 * This class carries the ssr context while rendering the components, as well as
 * the promises that need to be resolved before the final rendering takes place.
 */


class SSRContext$1 {
  constructor(options) {
    this.promises = [];
    this.options = options;
    this.timeout = options && options.timeout || 8 * 1000;
  }

  add(p) {
    if (p) {
      this.promises.push(p);
    }
  }

  getPromise() {
    if (this.promises) {
      return Promise.all(this.promises);
    }

    return null;
  }

} //
// SSR Rendering engine
//


function ssrRenderComponent(context, ce, vm) {
  // Mark the component as connected
  // Should happen before 'prefetchAsyncData', because this is the first time when the
  // component gets access to its properties so it can for example fetch() data.
  // prefetchAsyncData can get a hold on the Promise and return it for async rendering
  if (ce.connectedCallback) {
    ce.connectedCallback.call(ce);
  } //------
  // PHIL: Here is how async rendering can happen
  //------


  if (context.options.asyncData && ce.constructor.prefetchAsyncData) {
    // The component properties are added to the context
    const ctx = Object.assign(Object.assign({}, context.options.asyncContext), {
      props: ce
    });
    const p = ce.constructor.prefetchAsyncData.call(ce, ctx);

    if (p && p.then) {
      //console.log("Async rendering detected for component: "+ce.Ctor);
      context.add(p); // We stop here and we don't render the children
      // But the peers will be rendered in case there are rendered simultaneously

      return [];
    }
  }

  const v = renderComponent(vm);
  return v;
}

function renderToString$1(sel, options) {
  const context = new SSRContext$1(options);
  const is = options.is;

  if (!is) {
    throw new Error("Missing component type (options.is)");
  } // Create the component to render
  // Ths use of a DOM element is temporary here


  const comp = createElement(sel, {
    is: options.is
  });
  const vnodes = ssrRenderComponent(context, comp, getComponentVM(comp)); // Ok, in case there are some pending promises (async data), we throw an exception

  if (options.asyncData) {
    const p = context.getPromise();

    if (p) {
      throw p;
    }
  } // Serialize the result to HTML


  const html = serializeVNodes(vnodes);
  return html;
} // Temp export to the runtime


(global || window).__lwc = {
  renderToString: renderToString$1
};
/** version: 1.1.8 */

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    h: api_element
  } = $api;
  return [api_element("h1", {
    key: 0
  }, [api_text("My first SSR component")]), api_element("div", {
    key: 1
  }, [api_text("Hello World!")])];
}

var _tmpl = registerTemplate(tmpl);
tmpl.stylesheets = [];
tmpl.stylesheetTokens = {
  hostAttribute: "ssr-helloworld_helloworld-host",
  shadowAttribute: "ssr-helloworld_helloworld"
};

class HelloWorld extends BaseLightningElement {
  constructor() {
    super();
  }

}

var HelloWorld$1 = registerComponent(HelloWorld, {
  tmpl: _tmpl
});

var main = {
  HelloWorld: () => {
    return renderToString('hello-world', {
      is: HelloWorld$1
    });
  }
};

module.exports = main;
