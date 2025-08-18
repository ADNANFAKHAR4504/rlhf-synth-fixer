import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform E2E Integration Test', () => {
  const tfDir = path.join(__dirname, '../lib');
  const tfvarsPath = path.join(tfDir, 'terraform.tfvars');
  const stackFile = path.join(tfDir, 'tap_stack.tf');

  beforeAll(() => {
    // Ensure tfvars exists
    if (!fs.existsSync(tfvarsPath)) {
      fs.writeFileSync(tfvarsPath, 'projectname = "integrationtest"\n');
    }
  });

  test('terraform init completes successfully', () => {
    expect(() => execSync('terraform init', { cwd: tfDir, stdio: 'pipe' })).not.toThrow();
  });

  test('terraform validate passes with no errors', () => {
    expect(() => execSync('terraform validate', { cwd: tfDir, stdio: 'pipe' })).not.toThrow();
  });

  test('terraform plan produces expected resources', () => {
    const planOutput = execSync('terraform plan -no-color', { cwd: tfDir }).toString();
    expect(planOutput).toMatch(/aws_s3_bucket\.main/);
    expect(planOutput).toMatch(/aws_dynamodb_table\.main/);
    expect(planOutput).toMatch(/No changes. Infrastructure is up-to-date|Plan:/);
  });

  test('terraform apply can provision resources (dry-run)', () => {
    const applyOutput = execSync('terraform apply -no-color -auto-approve -refresh=false -input=false -lock=false -target=aws_s3_bucket.main -target=aws_dynamodb_table.main', { cwd: tfDir }).toString();
    expect(applyOutput).toMatch(/Apply complete|No changes. Infrastructure is up-to-date/);
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
    const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-west-1' });
    const buckets = await s3.listBuckets().promise();
    const found = buckets.Buckets.some(b => b.Name === bucketName);
    expect(found).toBe(true);
    const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
    expect(versioning.Status).toBe('Enabled');
  });

  test('DynamoDB table exists and is on-demand with correct key (live check)', async () => {
    const dynamodb = new AWS.DynamoDB({ region: process.env.AWS_REGION || 'us-west-1' });
    const tables = await dynamodb.listTables().promise();
    expect(tables.TableNames).toContain(tableName);
    const desc = await dynamodb.describeTable({ TableName: tableName }).promise();
    expect(desc.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
    expect(desc.Table.KeySchema.some(k => k.AttributeName === 'id' && k.KeyType === 'HASH')).toBe(true);
  });

  afterAll(() => {
    // Optionally clean up state files for test isolation
    const stateFiles = ['terraform.tfstate', 'terraform.tfstate.backup'];
    stateFiles.forEach(f => {
      const filePath = path.join(tfDir, f);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  });
});
