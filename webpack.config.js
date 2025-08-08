//@ts-check

'use strict';

const path = require('path');

/** @typedef {import('webpack').Configuration} WebpackConfig **/

// Base optimization settings
const optimizationSettings = {
  usedExports: true,
  sideEffects: false,
  providedExports: true,
  minimize: true
};

// Config for extension source code (to be run in a Node-based context)
/** @type WebpackConfig */
const extensionConfig = {
  mode: "none",
  target: "node",
  entry: "./src/extension.ts",
  externals: {
    vscode: 'commonjs vscode',
    'applicationinsights-native-metrics': 'commonjs applicationinsights-native-metrics'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: "source-map",
  infrastructureLogging: {
    level: "log",
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
            compilerOptions: {
              target: "es2020",
              module: "commonjs",
              moduleResolution: "node"
            }
          }
        }],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  optimization: {
    ...optimizationSettings,
    splitChunks: false // Disable completely to avoid conflicts
  }
};

/** @type WebpackConfig */
const ros1_webview_config = {
  mode: "none",
  target: ["web", "es2022"],
  entry: "./src/ros/ros1/webview/ros1_webview_main.ts",
  experiments: { outputModule: true, topLevelAwait: true },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: "source-map",
  infrastructureLogging: {
    level: "log",
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
            compilerOptions: {
              target: "es2020",
              module: "esnext",
              moduleResolution: "node"
            }
          }
        }],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "ros1_webview_main.js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
  optimization: optimizationSettings
};

/** @type WebpackConfig */
const ros2_webview_config = {
  mode: "none",
  target: ["web", "es2022"],
  entry: "./src/ros/ros2/webview/ros2_webview_main.ts",
  experiments: { outputModule: true, topLevelAwait: true },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: "source-map",
  infrastructureLogging: {
    level: "log",
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
            compilerOptions: {
              target: "es2020",
              module: "esnext",
              moduleResolution: "node"
            }
          }
        }],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "ros2_webview_main.js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
  optimization: optimizationSettings
};

// Config for webview source code (to be run in a web-based context)
/** @type WebpackConfig */
const webviewURDFConfig = {
  mode: "none",
  target: ["web", "es2022"],
  entry: "./src/urdfPreview/URDFPreviewPanel.ts",
  experiments: { outputModule: true, topLevelAwait: true },
  externals: {
    // Don't bundle large libraries - load them externally
    'babylonjs': 'BABYLON',
    'babylonjs-materials': 'BABYLON.MaterialsLibrary', 
    'babylonjs-gui': 'BABYLON.GUI'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: "source-map",
  infrastructureLogging: {
    level: "log",
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
            compilerOptions: {
              target: "es2020",
              module: "esnext",
              moduleResolution: "node"
            }
          }
        }],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "urdf-webview.js",
    libraryTarget: "module",
    chunkFormat: "module",
  },
  optimization: optimizationSettings
};

module.exports = [extensionConfig, ros1_webview_config, ros2_webview_config, webviewURDFConfig];
