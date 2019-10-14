/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const path = require('path');
const rollupTypescriptPlugin = require('rollup-plugin-typescript');
const rollupNodeResolvePlugin = require('rollup-plugin-node-resolve');

const { version } = require('../../package.json');
const entry = path.resolve(__dirname, '../../src/index.ts');
const rootDirectory = path.resolve(__dirname, '../..');
const targetDirectory = path.resolve(rootDirectory, 'dist');
const banner = `/**\n * Copyright (C) 2018 salesforce.com, inc.\n */`;
const footer = `/** version: ${version} */`;

function generateTargetName({ format }) {
    return ['index', format === 'cjs' ? '.cjs' : '', '.js'].join('');
}

function rollupConfig({ format }) {
    return {
        input: entry,
        output: {
            file: path.join(targetDirectory, generateTargetName({ format })),
            format,
            banner,
            footer,
        },
        plugins: [
            rollupNodeResolvePlugin({ only: [/^@lwc\//] }),
            rollupTypescriptPlugin({
                target: 'es2017',
                typescript: require('typescript'),
            }),
        ],
    };
}

module.exports = [rollupConfig({ format: 'es' }), rollupConfig({ format: 'cjs' })];
