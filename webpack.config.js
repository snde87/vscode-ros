//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const baseConfig = {
  mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      // Ensure we use a single instance of BabylonJS
      'babylonjs': path.resolve(__dirname, 'node_modules/babylonjs/babylon.js'),
      'babylonjs-gui': path.resolve(__dirname, 'node_modules/babylonjs-gui/babylon.gui.js'),
      'babylonjs-materials': path.resolve(__dirname, 'node_modules/babylonjs-materials/babylonjs.materials.js')
    }
  },
  devtool: "source-map",
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [{ 
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            experimentalWatchApi: true
          }
        }],
      },
    ],
  },
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
          },
          mangle: true,
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    })
  ]
};

// Config for extension source code (to be run in a Node-based context)
/** @type WebpackConfig */
const extensionConfig = {
  ...baseConfig,
  target: "node",
  entry: "./src/extension.ts",
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    'applicationinsights-native-metrics': 'commonjs applicationinsights-native-metrics' // ignored because we don't ship native module
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
};

/** @type WebpackConfig */
const ros1_webview_config = {
  ...baseConfig,
  target: ["web", "es2022"],
  entry: "./src/ros/ros1/webview/ros1_webview_main.ts",
  experiments: { outputModule: true, topLevelAwait: true },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "ros1_webview_main.js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
};

    /** @type WebpackConfig */
const ros2_webview_config = {
  ...baseConfig,
  target: ["web", "es2022"],
  entry: "./src/ros/ros2/webview/ros2_webview_main.ts",
  experiments: { outputModule: true, topLevelAwait: true },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "ros2_webview_main.js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
};

// Config for webview source code (to be run in a web-based context)
/** @type WebpackConfig */
const webviewURDFConfig = {
  ...baseConfig,
  target: ["web", "es2022"],
  entry: "./src/urdfPreview/URDFPreviewPanel.ts",
  experiments: { outputModule: true, topLevelAwait: true },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "webview.js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
  optimization: {
    ...baseConfig.optimization,
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  }
};


module.exports = [extensionConfig, ros1_webview_config, ros2_webview_config, webviewURDFConfig];
