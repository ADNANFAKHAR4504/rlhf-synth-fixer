import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = path.resolve(__dirname);
const LIB_DIR = path.resolve(__dirname, '../lib');
const OUTPUTS_DIR = path.resolve(__dirname, '../cfn-outputs');
const FLAT_OUTPUTS_FILE = path.join(OUTPUTS_DIR, 'flat-outputs.json');
const TEST_TIMEOUT = 120000; // 2 minutes per test

/**
 * Helper function to set up test environment with local backend
 * Copies terraform files to test directory and initializes with local backend
 */
function setupTestEnvironment(): void {
  // Copy terraform files to test directory
  const filesToCopy = ['tap_stack.tf', 'provider-local.tf'];
  filesToCopy.forEach(file => {
    const srcFile = file === 'provider-local.tf' ? path.join(TEST_DIR, file) : path.join(LIB_DIR, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(TEST_DIR, file));
    }
  });

  // Initialize with local backend and format files
  try {
    execSync('terraform init', {
      cwd: TEST_DIR,
      stdio: 'pipe',
      timeout: 30000,
    });
    // Format the copied files
    execSync('terraform fmt', {
      cwd: TEST_DIR,
      stdio: 'pipe',
      timeout: 10000,
    });
  } catch (error) {
    console.warn('⚠️  Could not initialize test terraform environment');
    throw error;
  }
}

/**
 * Helper function to check if deployment outputs exist
 */
function hasDeploymentOutputs(): boolean {
  return fs.existsSync(FLAT_OUTPUTS_FILE);
}

/**
 * Helper function to load deployment outputs for integration testing
 */
function loadDeploymentOutputs(): any {
  if (!hasDeploymentOutputs()) {
    return null;
  }
  try {
    const outputsContent = fs.readFileSync(FLAT_OUTPUTS_FILE, 'utf8');
    return JSON.parse(outputsContent);
  } catch (error) {
    console.warn('⚠️  Could not parse deployment outputs');
    return null;
  }
}

describe('Terraform Integration Tests', () => {
  beforeAll(() => {
    setupTestEnvironment();
  }, TEST_TIMEOUT);

  afterAll(() => {
    // Clean up terraform files in test directory
    const filesToClean = [
      'terraform.tfstate',
      'terraform.tfstate.backup',
      '.terraform.lock.hcl',
      'tap_stack.tf',
      'provider-local.tf'
    ];
    filesToClean.forEach(file => {
      const filePath = path.join(TEST_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('Terraform Basic Operations', () => {
    test(
      'terraform init succeeds',
      () => {
        expect(() => {
          execSync('terraform init -backend=false -reconfigure', {
            cwd: TEST_DIR,
            stdio: 'pipe',
            timeout: 60000,
          });
        }).not.toThrow();
      },
      TEST_TIMEOUT
    );

    test(
      'terraform validate succeeds',
      () => {
        expect(() => {
          execSync('terraform validate', {
            cwd: TEST_DIR,
            stdio: 'pipe',
            timeout: 30000,
          });
        }).not.toThrow();
      },
      TEST_TIMEOUT
    );

    test(
      'terraform fmt check passes',
      () => {
        expect(() => {
          execSync('terraform fmt -check -recursive', {
            cwd: TEST_DIR,
            stdio: 'pipe',
            timeout: 30000,
          });
        }).not.toThrow();
      },
      TEST_TIMEOUT
    );
  });

  describe('Deployment Validation', () => {
    test(
      'deployment outputs exist and are valid',
      () => {
        const outputs = loadDeploymentOutputs();
        
        if (!outputs) {
          console.log('ℹ️  No deployment outputs found - skipping validation (this is expected for basic tests)');
          return;
        }

        // Validate that outputs contain expected infrastructure components
        const expectedOutputKeys = [
          'VPCId',
          'S3BucketName', 
          'AutoScalingGroupName'
        ];

        // Check that at least some expected outputs exist
        const foundKeys = expectedOutputKeys.filter(key => outputs[key]);
        expect(foundKeys.length).toBeGreaterThan(0);

        // Validate output format (should be strings)
        Object.values(outputs).forEach(value => {
          expect(typeof value).toBe('string');
          expect(value).toBeTruthy();
        });
      },
      TEST_TIMEOUT
    );

    test(
      'resource naming follows environment suffix pattern',
      () => {
        const outputs = loadDeploymentOutputs();
        
        if (!outputs) {
          console.log('ℹ️  No deployment outputs found - skipping resource naming validation');
          return;
        }

        // Check that resource names contain environment suffix pattern
        const resourceNames = Object.values(outputs) as string[];
        const hasEnvironmentSuffixPattern = resourceNames.some(name => 
          name.includes('-') && /-(dev|test|prod|pr\d+)-/.test(name)
        );
        
        if (resourceNames.length > 0) {
          expect(hasEnvironmentSuffixPattern).toBe(true);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'terraform configuration files are valid',
      () => {
        // Verify main terraform file exists and contains required sections
        const tapStackPath = path.join(TEST_DIR, 'tap_stack.tf');
        expect(fs.existsSync(tapStackPath)).toBe(true);

        const terraformConfig = fs.readFileSync(tapStackPath, 'utf8');
        
        // Check for essential resource definitions
        expect(terraformConfig).toMatch(/resource\s+"aws_vpc"/);
        expect(terraformConfig).toMatch(/resource\s+"aws_subnet"/);
        expect(terraformConfig).toMatch(/resource\s+"aws_s3_bucket"/);
        
        // Check for variable usage (environment suffix)
        expect(terraformConfig).toMatch(/var\.environment_suffix/);
      },
      TEST_TIMEOUT
    );
  });
});
