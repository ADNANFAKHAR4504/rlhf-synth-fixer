const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Production build optimization script for Lambda assets
 * Handles dependency optimization, security checks, and asset preparation
 */

class LambdaBuildOptimizer {
  constructor(sourceDir, buildDir, options = {}) {
    this.sourceDir = sourceDir;
    this.buildDir = buildDir;
    this.options = {
      stripDevDependencies: options.stripDevDependencies ?? true,
      minify: options.minify ?? false,
      enableSourceMaps: options.enableSourceMaps ?? false,
      compressionLevel: options.compressionLevel ?? 6,
      securityAudit: options.securityAudit ?? true,
      ...options
    };
  }

  async optimizeBuild() {
    console.log('🔧 Starting Lambda build optimization...');
    
    try {
      // Clean and prepare build directory
      await this.prepareBuildDirectory();
      
      // Copy source files
      await this.copySourceFiles();
      
      // Optimize dependencies
      if (this.options.stripDevDependencies) {
        await this.optimizeDependencies();
      }
      
      // Run security audit
      if (this.options.securityAudit) {
        await this.runSecurityAudit();
      }
      
      // Minify if requested
      if (this.options.minify) {
        await this.minifyCode();
      }
      
      // Generate build manifest
      await this.generateBuildManifest();
      
      console.log('✅ Lambda build optimization completed successfully');
      return this.buildDir;
      
    } catch (error) {
      console.error('❌ Build optimization failed:', error.message);
      throw error;
    }
  }

  async prepareBuildDirectory() {
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.buildDir, { recursive: true });
  }

  async copySourceFiles() {
    console.log('📁 Copying source files...');
    
    const filesToCopy = ['index.js', 'package.json'];
    
    for (const file of filesToCopy) {
      const sourcePath = path.join(this.sourceDir, file);
      const destPath = path.join(this.buildDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      } else {
        throw new Error(`Required file not found: ${sourcePath}`);
      }
    }
  }

  async optimizeDependencies() {
    console.log('📦 Optimizing dependencies...');
    
    const packageJsonPath = path.join(this.buildDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Remove dev dependencies for production builds
    if (packageJson.devDependencies) {
      const devDepCount = Object.keys(packageJson.devDependencies).length;
      console.log(`🗑️  Removing ${devDepCount} development dependencies`);
      delete packageJson.devDependencies;
    }
    
    // Remove unnecessary scripts
    if (packageJson.scripts) {
      const essentialScripts = ['start', 'test'];
      const originalScripts = Object.keys(packageJson.scripts);
      packageJson.scripts = Object.fromEntries(
        Object.entries(packageJson.scripts).filter(([key]) => 
          essentialScripts.includes(key)
        )
      );
      console.log(`🧹 Cleaned scripts: ${originalScripts.length} → ${Object.keys(packageJson.scripts).length}`);
    }
    
    // Write optimized package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    // Install production dependencies only
    console.log('⬇️  Installing production dependencies...');
    try {
      execSync('npm ci --only=production --silent', {
        cwd: this.buildDir,
        stdio: 'pipe'
      });
    } catch (error) {
      console.warn('⚠️  npm ci failed, falling back to npm install');
      execSync('npm install --only=production --silent', {
        cwd: this.buildDir,
        stdio: 'pipe'
      });
    }
  }

  async runSecurityAudit() {
    console.log('🔒 Running security audit...');
    
    try {
      const auditResult = execSync('npm audit --json --only=production', {
        cwd: this.buildDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const audit = JSON.parse(auditResult);
      
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        const totalVulns = vulns.high + vulns.critical;
        
        if (totalVulns > 0) {
          console.warn(`⚠️  Found ${totalVulns} high/critical security vulnerabilities`);
          
          // For production builds, consider failing on critical vulnerabilities
          if (vulns.critical > 0 && this.options.failOnCriticalVulns) {
            throw new Error(`Build failed: ${vulns.critical} critical security vulnerabilities found`);
          }
        } else {
          console.log('✅ No high/critical security vulnerabilities found');
        }
      }
    } catch (error) {
      if (error.status === 1) {
        // npm audit returns exit code 1 when vulnerabilities are found
        console.warn('⚠️  Security vulnerabilities detected, check npm audit output');
      } else {
        console.warn('⚠️  Security audit failed:', error.message);
      }
    }
  }

  async minifyCode() {
    console.log('🗜️  Minifying JavaScript code...');
    
    const indexPath = path.join(this.buildDir, 'index.js');
    const code = fs.readFileSync(indexPath, 'utf8');
    
    // Simple minification - remove comments and extra whitespace
    // For production use, consider using terser or similar tools
    const minified = code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
    
    fs.writeFileSync(indexPath, minified);
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log(`📉 Code size reduced by ${savings}% (${originalSize} → ${minifiedSize} bytes)`);
  }

  async generateBuildManifest() {
    console.log('📋 Generating build manifest...');
    
    const manifest = {
      buildTimestamp: new Date().toISOString(),
      sourceDir: this.sourceDir,
      buildDir: this.buildDir,
      optimizations: this.options,
      files: {},
      dependencies: {}
    };
    
    // Analyze built files
    const files = fs.readdirSync(this.buildDir);
    for (const file of files) {
      if (file !== 'node_modules' && file !== 'build-manifest.json') {
        const filePath = path.join(this.buildDir, file);
        const stats = fs.statSync(filePath);
        manifest.files[file] = {
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      }
    }
    
    // Analyze dependencies
    const packageJsonPath = path.join(this.buildDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      manifest.dependencies = packageJson.dependencies || {};
    }
    
    // Write manifest
    fs.writeFileSync(
      path.join(this.buildDir, 'build-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }
}

module.exports = { LambdaBuildOptimizer };

// CLI usage
if (require.main === module) {
  const sourceDir = process.argv[2] || '.';
  const buildDir = process.argv[3] || './build';
  const isProduction = process.env.NODE_ENV === 'production';
  
  const optimizer = new LambdaBuildOptimizer(sourceDir, buildDir, {
    stripDevDependencies: true,
    minify: isProduction,
    enableSourceMaps: !isProduction,
    securityAudit: true,
    failOnCriticalVulns: isProduction
  });
  
  optimizer.optimizeBuild()
    .then(buildPath => {
      console.log(`🎉 Build optimization completed: ${buildPath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Build optimization failed:', error.message);
      process.exit(1);
    });
}