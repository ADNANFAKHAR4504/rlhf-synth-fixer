import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Helper: Read output value (supports { value } or flat)
function getOutputValue(obj: any, key: string): string | undefined {
  if (!obj) return undefined;
  if (obj[key] && typeof obj[key] === 'object' && 'value' in obj[key]) return obj[key].value;
  if (obj[key] && typeof obj[key] === 'string') return obj[key];
  return undefined;
}

// Utility: Search for all .tf files that contain a backend block
function findBackendFiles(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.tf'))
    .filter(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      return /backend\s*"/.test(content);
    });
}

describe('Terraform E2E Integration Test', () => {
  const tfDir = path.join(__dirname, '../lib');
  const tfvarsPath = path.join(tfDir, 'terraform.tfvars');
  const localBackendFile = path.join(tfDir, 'zz_local_backend.tf');

  // Output artifact locations (try several common locations)
  const outputsJsonPaths = [
    path.join(__dirname, '../cfn-outputs.json'),
    path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
    path.join(__dirname, '../lib/flat-outputs.json')
  ];

  let renamedBackendFiles: string[] = [];
  let deploymentOutputs: any = null;

  beforeAll(() => {
    // Ensure tfvars exists
    if (!fs.existsSync(tfvarsPath)) {
      fs.writeFileSync(tfvarsPath, 'projectname = "integrationtest"\n');
    }

    // Find and rename all backend config files
    renamedBackendFiles = findBackendFiles(tfDir);
    renamedBackendFiles.forEach(f => {
      const fullPath = path.join(tfDir, f);
      fs.renameSync(fullPath, fullPath + '.bak');
    });

    // Write a local backend config for the test run
    fs.writeFileSync(
      localBackendFile,
      `
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
`
    );

    // Always run terraform init before other commands
    try {
      execSync('terraform init -no-color', { cwd: tfDir, stdio: 'pipe' });
    } catch (err) {
      console.error('Terraform init failed:', err);
      throw err;
    }

    // Read outputs from first existing output file
    for (const outputsPath of outputsJsonPaths) {
      if (fs.existsSync(outputsPath)) {
        try {
          const raw = fs.readFileSync(outputsPath, 'utf8');
          if (raw.trim() !== '') {
            deploymentOutputs = JSON.parse(raw);
            break;
          }
        } catch (err) {
          continue;
        }
      }
    }
  });

  test('terraform init completes successfully', () => {
    expect(() => execSync('terraform init -no-color', { cwd: tfDir, stdio: 'pipe' })).not.toThrow();
  });

  test('terraform validate passes with no errors', () => {
    expect(() => execSync('terraform validate -no-color', { cwd: tfDir, stdio: 'pipe' })).not.toThrow();
  });

  test('terraform plan produces expected resources', () => {
    const planOutput = execSync('terraform plan -no-color', { cwd: tfDir }).toString();
    expect(planOutput).toMatch(/aws_s3_bucket\.main/);
    expect(planOutput).toMatch(/aws_dynamodb_table\.main/);
    expect(planOutput).toMatch(/No changes. Infrastructure is up-to-date|Plan:/);
  });

  // --- USE DEPLOYMENT OUTPUTS FOR RESOURCE NAME CHECKS ---
  let bucketName: string | undefined = undefined;
  let tableName: string | undefined = undefined;

  test('deployment output returns resource names', () => {
    expect(deploymentOutputs).toBeTruthy();
    bucketName = getOutputValue(deploymentOutputs, 's3_bucket_name');
    tableName = getOutputValue(deploymentOutputs, 'dynamodb_table_name');
    expect(typeof bucketName).toBe('string');
    expect(typeof tableName).toBe('string');
    expect(bucketName).toMatch(/example-s3-/);
    expect(tableName).toMatch(/example-dynamodb/);
    // If you have AWS access, you can add live AWS SDK checks here.
  });

  afterAll(() => {
    // Optionally clean up state files for test isolation
    const stateFiles = ['terraform.tfstate', 'terraform.tfstate.backup'];
    stateFiles.forEach(f => {
      const filePath = path.join(tfDir, f);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    // Remove local backend config
    if (fs.existsSync(localBackendFile)) {
      fs.unlinkSync(localBackendFile);
    }
    // Restore original backend config files
    renamedBackendFiles.forEach(f => {
      const orig = path.join(tfDir, f);
      const bak = orig + '.bak';
      if (fs.existsSync(bak)) {
        fs.renameSync(bak, orig);
      }
    });
    // Optionally clean up deployment output files
    outputsJsonPaths.forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  });
});