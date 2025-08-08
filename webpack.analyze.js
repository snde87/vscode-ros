const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const configs = require('./webpack.config.js');

// Add bundle analyzer to each configuration
const analyzedConfigs = configs.map((config, index) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    new BundleAnalyzerPlugin({
      analyzerPort: 8888 + index,
      reportFilename: `bundle-report-${index}.html`,
      openAnalyzer: index === 0, // Only open the first one automatically
      generateStatsFile: true,
      statsFilename: `bundle-stats-${index}.json`
    })
  ]
}));

module.exports = analyzedConfigs;