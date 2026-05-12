/**
 * Script to help migrate routes to use the new middleware system
 * 
 * This script identifies routes that need to be updated and provides
 * guidance on how to migrate them.
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');

// Dev routes that should be protected
const DEV_ROUTES = [
  'debug-',
  'test-',
  'seed-',
  'clear-seed',
  'apply-indexes',
  'setup-firestore-indexes',
  'update-firebase-rules',
  'current-rules',
  'deploy-rules',
  'dev-utils',
  'fix-',
  'add-',
  'force-',
  'refresh-activities',
  'migrate-',
  'generate-suggestions',
  'rerank-suggestions',
  'reset-voting',
  'finalize-poll',
];

function findRoutes(dir, routes = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findRoutes(filePath, routes);
    } else if (file === 'route.js' || file === 'route.ts') {
      const relativePath = path.relative(API_DIR, filePath);
      routes.push({
        path: relativePath,
        fullPath: filePath,
        isDev: DEV_ROUTES.some(pattern => relativePath.includes(pattern)),
      });
    }
  }

  return routes;
}

function analyzeRoute(routePath) {
  const content = fs.readFileSync(routePath, 'utf8');
  
  const hasAuth = /adminAuth\.verifyIdToken|getUserIdFromRequest/.test(content);
  const hasRateLimit = /withRateLimit|rateLimit/.test(content);
  const hasValidation = /validateRequestBody|validateQueryParams|z\.object/.test(content);
  const hasMiddleware = /withMiddleware|withAuth|withPublic/.test(content);
  const usesOldErrorFormat = /NextResponse\.json\(\s*\{\s*success:\s*(false|true)/.test(content);
  const usesConsoleError = /console\.(error|log|warn)/.test(content);

  return {
    hasAuth,
    hasRateLimit,
    hasValidation,
    hasMiddleware,
    usesOldErrorFormat,
    usesConsoleError,
  };
}

function main() {
  console.log('🔍 Analyzing API routes...\n');

  const routes = findRoutes(API_DIR);
  const analysis = routes.map(route => ({
    ...route,
    ...analyzeRoute(route.fullPath),
  }));

  const needsMigration = analysis.filter(r => 
    !r.hasMiddleware || 
    r.usesOldErrorFormat || 
    r.usesConsoleError ||
    (r.isDev && !r.path.includes('v1'))
  );

  const productionRoutes = analysis.filter(r => !r.isDev);
  const devRoutes = analysis.filter(r => r.isDev);

  console.log('📊 Summary:');
  console.log(`   Total routes: ${routes.length}`);
  console.log(`   Production routes: ${productionRoutes.length}`);
  console.log(`   Dev routes: ${devRoutes.length}`);
  console.log(`   Routes needing migration: ${needsMigration.length}\n`);

  if (needsMigration.length > 0) {
    console.log('⚠️  Routes needing migration:\n');
    needsMigration.forEach(route => {
      const issues = [];
      if (!route.hasMiddleware) issues.push('missing middleware');
      if (route.usesOldErrorFormat) issues.push('old error format');
      if (route.usesConsoleError) issues.push('console.error/log');
      if (route.isDev && !route.path.includes('v1')) issues.push('dev route unprotected');
      
      console.log(`   ${route.path}`);
      console.log(`     Issues: ${issues.join(', ')}\n`);
    });
  }

  console.log('✅ Routes using middleware:');
  analysis.filter(r => r.hasMiddleware).forEach(route => {
    console.log(`   ${route.path}`);
  });

  console.log('\n📝 Next steps:');
  console.log('   1. Update routes to use withMiddleware/withAuth/withPublic');
  console.log('   2. Replace old error responses with createErrorResponse/createSuccessResponse');
  console.log('   3. Replace console.error/log with logger');
  console.log('   4. Protect dev routes with allowDev: false');
  console.log('   5. Add validation schemas where missing');
}

main();


