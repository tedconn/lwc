import { renderToString } from './node/node-ssr';

import HelloWorld from './ssr/helloworld/helloworld';

// Test HelloWorld
export default {
    HelloWorld: () => {
        return renderToString('hello-world', { is: HelloWorld });
    },
};
