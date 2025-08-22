import * as fs from 'fs';
import * as path from 'path';

describe('Terraform S3 and DynamoDB Stack', () => {
  let tfConfig: string;

  beforeAll(() => {
    // Read the Terraform file
    tfConfig = fs.readFileSync(path.join(__dirname, '../lib/tap_stack.tf'), 'utf8');
  });

  test('projectname variable is defined and used in resource names', () => {
    expect(tfConfig).toMatch(/variable\s+"projectname"/);
    expect(tfConfig).toMatch(/\${var\.projectname}-s3/);
    expect(tfConfig).toMatch(/\${var\.projectname}-dynamodb/);
  });

  test('S3 bucket resource is present with versioning enabled', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
    expect(tfConfig).toMatch(/versioning_configuration\s*{\s*status\s*=\s*"Enabled"/);
  });

  test('S3 bucket public access block is present', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
    expect(tfConfig).toMatch(/block_public_acls\s*=\s*true/);
    expect(tfConfig).toMatch(/block_public_policy\s*=\s*true/);
    expect(tfConfig).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test('DynamoDB table resource is present with correct config', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"/);
    expect(tfConfig).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    expect(tfConfig).toMatch(/hash_key\s*=\s*"id"/);
    expect(tfConfig).toMatch(/attribute\s*{\s*name\s*=\s*"id"/);
  });

  test('Outputs for S3 bucket and DynamoDB table are present', () => {
    expect(tfConfig).toMatch(/output\s+"s3_bucket_name"/);
    expect(tfConfig).toMatch(/output\s+"dynamodb_table_name"/);
  });

  test('Documentation and comments are present', () => {
    expect(tfConfig).toMatch(/Documentation/);
    expect(tfConfig).toMatch(/All resource names follow 'projectname-resource' pattern/);
  });

  test('Tags are set for both resources', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_s3_bucket"\s+"main"[\s\S]*?tags\s*=\s*{[\s\S]*?Name[\s\S]*?Project[\s\S]*?ManagedBy[\s\S]*?}/);
    expect(tfConfig).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"[\s\S]*?tags\s*=\s*{[\s\S]*?Name[\s\S]*?Project[\s\S]*?ManagedBy[\s\S]*?}/);
  });
});

