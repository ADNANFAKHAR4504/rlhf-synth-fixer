import * as fs from 'fs';
import * as path from 'path';

describe('Secure Env Terraform Stack', () => {
  let tfConfig: string;

  beforeAll(() => {
    // Read the main Terraform variable file
    tfConfig = fs.readFileSync(path.join(__dirname, '../lib/tap_stack.tf'), 'utf8');
  });

  test('name_prefix and environment variables are defined and used in resource names', () => {
    expect(tfConfig).toMatch(/variable\s+"name_prefix"/);
    expect(tfConfig).toMatch(/variable\s+"environment"/);
    expect(tfConfig).toMatch(/\${var\.name_prefix}-\${var\.environment}-s3-bucket/);
  });

  test('S3 bucket resource is present with versioning and public access block', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_s3_bucket"\s+"this"/);
    expect(tfConfig).toMatch(/versioning_configuration\s*{\s*status\s*=\s*"Enabled"/);
    expect(tfConfig).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"this"/);
    expect(tfConfig).toMatch(/block_public_acls\s*=\s*true/);
    expect(tfConfig).toMatch(/block_public_policy\s*=\s*true/);
    expect(tfConfig).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test('Outputs for S3 bucket are present', () => {
    expect(tfConfig).toMatch(/output\s+"bucket_name"/);
    expect(tfConfig).toMatch(/output\s+"bucket_tags"/);
  });

  test('Tags are set for S3 bucket', () => {
    expect(tfConfig).toMatch(/tags\s*=\s*{[\s\S]*?Project[\s\S]*?Environment[\s\S]*?ManagedBy[\s\S]*?}/);
  });

  // Additional tests for other .tf files
  const tfFiles = [
    'vpc.tf',
    'kms.tf',
    'iam.tf',
    'security_groups.tf',
    'lambda.tf',
    'alerting.tf'
  ];

  tfFiles.forEach((file) => {
    let config: string;
    beforeAll(() => {
      config = fs.readFileSync(path.join(__dirname, `../lib/${file}`), 'utf8');
    });

    if (file === 'vpc.tf') {
      test('VPC resources are present and named correctly', () => {
        expect(config).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
        expect(config).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
        expect(config).toMatch(/\${var\.name_prefix}-\${var\.environment}-vpc-primary/);
        expect(config).toMatch(/\${var\.name_prefix}-\${var\.environment}-vpc-secondary/);
      });
    }

    if (file === 'kms.tf') {
      test('KMS keys and aliases are present and named correctly', () => {
        expect(config).toMatch(/resource\s+"aws_kms_key"\s+"primary"/);
        expect(config).toMatch(/resource\s+"aws_kms_key"\s+"secondary"/);
        expect(config).toMatch(/resource\s+"aws_kms_alias"\s+"primary"/);
        expect(config).toMatch(/resource\s+"aws_kms_alias"\s+"secondary"/);
        expect(config).toMatch(/\${var\.name_prefix}-\${var\.environment}-kms-key-primary/);
        expect(config).toMatch(/\${var\.name_prefix}-\${var\.environment}-kms-key-secondary/);
      });
    }

    if (file === 'iam.tf') {
      test('IAM roles and policies are present and least-privilege', () => {
        expect(config).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
        expect(config).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
        expect(config).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"/);
        expect(config).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
        expect(config).toMatch(/logs:CreateLogGroup/);
        expect(config).toMatch(/kms:Encrypt/);
      });
    }

    if (file === 'security_groups.tf') {
      test('Security groups for public/private EC2 and Lambda are present', () => {
        expect(config).toMatch(/resource\s+"aws_security_group"\s+"public_ec2_primary"/);
        expect(config).toMatch(/resource\s+"aws_security_group"\s+"private_ec2_primary"/);
        expect(config).toMatch(/resource\s+"aws_security_group"\s+"lambda_primary"/);
        expect(config).toMatch(/from_port\s*=\s*22/); // SSH
        expect(config).toMatch(/from_port\s*=\s*443/); // HTTPS
      });
    }

    if (file === 'lambda.tf') {
      test('Lambda function and log group resources are present and named correctly', () => {
        expect(config).toMatch(/resource\s+"aws_lambda_function"\s+"primary"/);
        expect(config).toMatch(/resource\s+"aws_lambda_function"\s+"secondary"/);
        expect(config).toMatch(/handler\s*=\s*"lambda_function.lambda_handler"/);
        expect(config).toMatch(/runtime\s*=\s*"python3.12"/);
        expect(config).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs_primary"/);
      });
    }

    if (file === 'alerting.tf') {
      test('CloudWatch metric filters and alarms for unauthorized access are present', () => {
        expect(config).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_access_primary"/);
        expect(config).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_access_alarm_primary"/);
        // FIXED: Now expect the correct HCL pattern:
        expect(config).toMatch(/pattern\s*=\s*"\\"Unauthorized\\" \\"AccessDenied\\" \\"UserNotAuthorized\\""/);
        expect(config).toMatch(/alarm_description/);
      });
    }
  });
}); 