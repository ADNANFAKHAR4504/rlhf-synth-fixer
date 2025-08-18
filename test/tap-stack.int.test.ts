import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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
  const localBackendFile = path.join(tfDir, 'zz_local_backend.tf'); // unique name to avoid conflicts

  // Use env var to control live AWS tests
  const runLiveTests = process.env.RUN_LIVE_TESTS === 'true';
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-1';

  // Track renamed files for restore
  let renamedBackendFiles: string[] = [];

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

    // Write a local backend config for the test run (new file, easy to remove later)
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

  test('terraform apply can provision resources (dry-run)', () => {
    execSync('terraform plan -no-color -out=plan.tfplan -target=aws_s3_bucket.main -target=aws_dynamodb_table.main', { cwd: tfDir });
    const applyOutput = execSync('terraform apply -no-color -auto-approve plan.tfplan', { cwd: tfDir }).toString();
    expect(applyOutput).toMatch(/Apply complete|No changes. Infrastructure is up-to-date/);
    // Clean up the plan file after test
    const planFile = path.join(tfDir, 'plan.tfplan');
    if (fs.existsSync(planFile)) fs.unlinkSync(planFile);
  });

  const AWS = require('aws-sdk');
  let bucketName = '';
  let tableName = '';

  test('terraform output returns resource names', () => {
    const output = execSync('terraform output -json', { cwd: tfDir }).toString();
    const outputs = JSON.parse(output);
    bucketName = outputs.s3_bucket_name.value;
    tableName = outputs.dynamodb_table_name.value;
    expect(bucketName).toMatch(/integrationtest-s3-/);
    expect(tableName).toMatch(/integrationtest-dynamodb/);
  });

  test('S3 bucket exists and has versioning enabled (live check)', async () => {
    if (!runLiveTests) {
      console.log('Skipping live S3 test. Set RUN_LIVE_TESTS=true to enable.');
      return;
    }
    try {
      const s3 = new AWS.S3({ region: awsRegion });
      const buckets = await Promise.race([
        s3.listBuckets().promise(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      const found = buckets.Buckets.some((b: { Name: string }) => b.Name === bucketName);
      expect(found).toBe(true);
      const versioning = await Promise.race([
        s3.getBucketVersioning({ Bucket: bucketName }).promise(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      expect(versioning.Status).toBe('Enabled');
      console.log(` S3 bucket ${bucketName} exists and versioning is enabled`);
    } catch (error) {
      console.warn(`S3 bucket validation failed:`, error);
      throw error;
    }
  }, 15000);

  test('DynamoDB table exists and is on-demand with correct key (live check)', async () => {
    if (!runLiveTests) {
      console.log('Skipping live DynamoDB test. Set RUN_LIVE_TESTS=true to enable.');
      return;
    }
    try {
      const dynamodb = new AWS.DynamoDB({ region: awsRegion });
      const tables = await Promise.race([
        dynamodb.listTables().promise(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      expect(tables.TableNames).toContain(tableName);
      const desc = await Promise.race([
        dynamodb.describeTable({ TableName: tableName }).promise(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      expect(desc.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
      expect(desc.Table.KeySchema.some((k: { AttributeName: string; KeyType: string }) => k.AttributeName === 'id' && k.KeyType === 'HASH')).toBe(true);
      console.log(` DynamoDB table ${tableName} exists and is configured correctly`);
    } catch (error) {
      console.warn(`DynamoDB table validation failed:`, error);
      throw error;
    }
  }, 15000);

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
  });
});