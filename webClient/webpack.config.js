

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var baseConfig = require(path.resolve(process.env.MVD_DESKTOP_DIR, 'plugin-config/webpack.react.base.js'));

if (process.env.MVD_DESKTOP_DIR == null) {
  throw new Error('You must specify MVD_DESKTOP_DIR in your environment');
}

var config = {
  'entry': [
    path.resolve(__dirname, './src/index.tsx')
  ],
  'output': {
    'path': path.resolve(__dirname, '../web'),
    'filename': 'main.js',
  },
  'plugins': [
    new CopyWebpackPlugin({ 
      patterns: [
        {
          from: path.resolve(__dirname, './src/assets'),
          to: path.resolve('../web/assets')
        }
      ]}
    )
  ],
  'module': {
    'rules': [
      {
        /* Javascript source map loader */
        'enforce': 'pre',
        'test': /\.js$/,
        'loader': 'source-map-loader',
        'exclude': [
          /\/node_modules\//
        ]
      },
      {
        /* JSON inline loader */
        'test': /\.json$/,
        'loader': 'json-loader'
      },
      {
        /* HTML URL resolution loader */
        'test': /\.html$/,
        'loader': 'html-loader'
      },
      {
        'test': /\.svg$/,
        'loader': 'svg-sprite-loader'
      },
      {
        /* External file loader */
        'test': /\.eot$/,
        'loader': 'file-loader',
        'options': {
          'name': '[name].[hash:20].[ext]'
        }
      },
      {
        /* External (or inline) file loader */
        'test': /\.(jpg|png|gif|otf|ttf|woff|woff2|cur|ani)$/,
        'loader': 'url-loader',
        'options': {
          'name':'[name].[hash:20].[ext]', 
          'limit': '10000'
        }
      },
      {
        /* CSS URL loader, TODO: reconsider */
        'test': /\.css$/,
        'use': [
          'exports-loader?module.exports.toString()',
          {
            'loader': 'css-loader',
            'options': {
              'sourceMap': false
            }
          }
        ]
      },
      {
        /* TS and angular loader */
        'test': /\.(ts|tsx)$/,
        'loader': 'ts-loader',
      }      
    ]
  }
};

function deepMerge(base, extension) {
  if (isObject(base) && isObject(extension)) {
    for (const key in extension) {
      if (isObject(extension[key])) {
        if (!base[key]) base[key] = {};
        deepMerge(base[key], extension[key]);
      } else {
        Object.assign(base, {[key]: extension[key]});
      }
    }
  }
  return base;
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

module.exports = deepMerge(baseConfig, config);


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

