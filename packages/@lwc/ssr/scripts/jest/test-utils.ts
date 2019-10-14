/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { compileToFunction } from '@lwc/template-compiler';
const TEMPLATE_CACHE = Object.create(null);
import { registerTemplate } from '@lwc/engine';

export function compileTemplate(source: any, config = { modules: {} }) {
    const { modules = {} } = config;

    // Check if the same template has already been compiled
    if (!(source in TEMPLATE_CACHE)) {
        TEMPLATE_CACHE[source] = compileToFunction(source);
    }

    const templateFactory = TEMPLATE_CACHE[source];
    return registerTemplate(templateFactory(modules));
}
