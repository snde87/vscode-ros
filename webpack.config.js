//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const baseConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: process.env.NODE_ENV === 'production' ? 'hidden-source-map' : 'source-map',
  infrastructureLogging: {
    level: "log",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [{ loader: "ts-loader" }],
      },
    ],
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 5,
      minSize: 30_000,
      cacheGroups: {
        babylon: {
          test: /[\\/]node_modules[\\/](babylonjs|babylonjs-materials|@polyhobbyist)[\\/]/,
          name: 'vendor-babylon',
          chunks: 'all',
          priority: 10,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: -10,
        },
      },
    },
    concatenateModules: true,
    usedExports: true,
    sideEffects: true,
  },
  experiments: { topLevelAwait: true },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ],
};

// Config for extension source code (to be run in a Node-based context)
/** @type WebpackConfig */
const extensionConfig = {
  ...baseConfig,
  target: "node",
  entry: "./src/extension.ts",
  externals: {
    vscode: 'commonjs vscode',
    'applicationinsights-native-metrics': 'commonjs applicationinsights-native-metrics'
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  // Do not split the extension context to preserve single file main bundle for VS Code
  optimization: { ...baseConfig.optimization, splitChunks: false },
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
    chunkFilename: "ros1.[name].[contenthash:8].js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
  optimization: { ...baseConfig.optimization, splitChunks: false },
  plugins: [
    ...baseConfig.plugins,
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/babylonjs/babylon.js', to: 'vendor/babylon.js' },
        { from: 'node_modules/babylonjs-gui/babylon.gui.min.js', to: 'vendor/babylon.gui.min.js' }
      ]
    })
  ],
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
    chunkFilename: "ros2.[name].[contenthash:8].js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
  optimization: { ...baseConfig.optimization, splitChunks: false },
};

// Config for webview source code (to be run in a web-based context)
/** @type WebpackConfig */
const webviewURDFConfig = {
  ...baseConfig,
  target: ["web", "es2022"],
  entry: "./src/urdfPreview/URDFPreviewPanel.ts",
  experiments: { outputModule: true, topLevelAwait: true },
  externals: {
    babylonjs: 'BABYLON',
    'babylonjs-gui': 'BABYLON.GUI',
    'babylonjs-materials': 'BABYLON',
    '@polyhobbyist/babylon_ros': 'babylon_ros',
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "webview.js",
    chunkFilename: "webview.[name].[contenthash:8].js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
  optimization: { ...baseConfig.optimization, splitChunks: false },
  plugins: [
    ...baseConfig.plugins,
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/babylonjs/babylon.js', to: 'vendor/babylon.js' },
        { from: 'node_modules/babylonjs-gui/babylon.gui.min.js', to: 'vendor/babylon.gui.min.js' },
        { from: 'node_modules/babylonjs-materials/babylonjs.materials.min.js', to: 'vendor/babylonjs.materials.min.js' },
        { from: 'node_modules/@polyhobbyist/babylon_ros/dist/ros.js', to: 'vendor/babylon_ros.js' }
      ]
    })
  ],
};

module.exports = [extensionConfig, ros1_webview_config, ros2_webview_config, webviewURDFConfig];
