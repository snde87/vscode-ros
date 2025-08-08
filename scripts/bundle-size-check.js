const fs = require('fs');
const path = require('path');

// Configuration for bundle size limits (in bytes)
const SIZE_LIMITS = {
  'extension.js': 700 * 1024, // 700KB
  'webview.js': 8 * 1024 * 1024, // 8MB
  'ros1_webview_main.js': 5 * 1024, // 5KB
  'ros2_webview_main.js': 5 * 1024, // 5KB
};

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkBundleSizes() {
  const distDir = path.join(__dirname, '..', 'dist');
  let hasViolations = false;
  const results = [];

  console.log('\n📊 Bundle Size Report\n');
  console.log('File'.padEnd(25) + 'Size'.padEnd(12) + 'Limit'.padEnd(12) + 'Status');
  console.log('-'.repeat(60));

  // Check each bundle
  for (const [file, limit] of Object.entries(SIZE_LIMITS)) {
    const filePath = path.join(distDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`${file.padEnd(25)}${colors.yellow}Not found${colors.reset}`);
      continue;
    }

    const stats = fs.statSync(filePath);
    const size = stats.size;
    const isWithinLimit = size <= limit;
    
    if (!isWithinLimit) {
      hasViolations = true;
    }

    const color = isWithinLimit ? colors.green : colors.red;
    const status = isWithinLimit ? '✓ OK' : '✗ EXCEEDS';
    const percentage = ((size / limit) * 100).toFixed(1);

    console.log(
      `${file.padEnd(25)}${formatBytes(size).padEnd(12)}${formatBytes(limit).padEnd(12)}${color}${status} (${percentage}%)${colors.reset}`
    );

    results.push({
      file,
      size,
      limit,
      percentage: parseFloat(percentage)
    });
  }

  // Check for additional JS files not in limits
  console.log('\nOther JS files:');
  const allJsFiles = fs.readdirSync(distDir)
    .filter(f => f.endsWith('.js') && !SIZE_LIMITS.hasOwnProperty(f));
  
  allJsFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${file.padEnd(25)}${formatBytes(stats.size)}`);
  });

  // Calculate total size
  const totalSize = results.reduce((sum, r) => sum + r.size, 0);
  console.log('\n' + '-'.repeat(60));
  console.log(`Total bundle size: ${formatBytes(totalSize)}`);

  // Performance tips
  if (hasViolations) {
    console.log(`\n${colors.yellow}⚠️  Performance Tips:${colors.reset}`);
    console.log('- Consider lazy loading heavy dependencies');
    console.log('- Use code splitting for large modules');
    console.log('- Audit and remove unused dependencies');
    console.log('- Enable tree shaking in webpack config');
  } else {
    console.log(`\n${colors.green}✅ All bundles are within size limits!${colors.reset}`);
  }

  return !hasViolations;
}

// Run the check
const success = checkBundleSizes();
process.exit(success ? 0 : 1);