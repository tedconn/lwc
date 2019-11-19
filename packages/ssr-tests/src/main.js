import { renderToString } from './node/node-ssr';

import HelloWorld from './ssr/helloworld/helloworld';
import HelloWorldContainer from './ssr/helloworldcontainer/helloworldcontainer';

// Test HelloWorld
export default {
    HelloWorld: () => {
        return renderToString('ssr-helloworld', { is: HelloWorld });
    },
    HelloWorldContainer: () => {
        return renderToString('ssr-helloworldcontainer', { is: HelloWorldContainer });
    },
};
