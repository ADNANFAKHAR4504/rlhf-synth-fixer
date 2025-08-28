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
        expect(config).toMatch(/pattern\s*=\s*"\\"Unauthorized\\" \\"AccessDenied\\" \\"UserNotAuthorized\\""/);
        expect(config).toMatch(/alarm_description/);
      });
    }
  });
});

describe('Additional Coverage for Secure Env Terraform Stack', () => {
  // BACKEND
  test('Backend S3 configuration is present', () => {
    const config = fs.readFileSync(path.join(__dirname, '../lib/backend.tf'), 'utf8');
    expect(config).toMatch(/terraform\s*{\s*backend\s*"s3"\s*{/);
    expect(config).toMatch(/region\s*=\s*"(us|us-[a-z]+-\d+)"/);
  });

  // PROVIDER
  test('AWS providers are defined for both regions with required version', () => {
    const config = fs.readFileSync(path.join(__dirname, '../lib/provider.tf'), 'utf8');
    expect(config).toMatch(/required_providers\s*{[\s\S]*aws[\s\S]*version\s*=\s*">=/);
    expect(config).toMatch(/provider\s*"aws"\s*{[\s\S]*alias\s*=\s*"primary"/);
    expect(config).toMatch(/provider\s*"aws"\s*{[\s\S]*alias\s*=\s*"secondary"/);
    expect(config).toMatch(/default_tags\s*{[\s\S]*Project[\s\S]*Environment/);
  });

  // CLOUDTRAIL (updated for your resource names and attributes)
  test('CloudTrail resources and log integration are present and named correctly', () => {
    const config = fs.readFileSync(path.join(__dirname, '../lib/cloudtrail.tf'), 'utf8');
    // Resource block
    expect(config).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    // Required attributes
    expect(config).toMatch(/is_multi_region_trail\s*=\s*true/);
    expect(config).toMatch(/enable_log_file_validation\s*=\s*true/);
    expect(config).toMatch(/cloud_watch_logs_group_arn\s*=\s*"\${?aws_cloudwatch_log_group\.cloudtrail\.arn:?}(:\*)?"/);
    expect(config).toMatch(/cloud_watch_logs_role_arn\s*=\s*aws_iam_role\.cloudtrail_logs\.arn/);
    expect(config).toMatch(/kms_key_id\s*=\s*aws_kms_key\.s3\.arn/);
    // Log group and IAM role/policy for CloudTrail
    expect(config).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
    expect(config).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail_logs"/);
    expect(config).toMatch(/resource\s+"aws_iam_role_policy"\s+"cloudtrail_logs"/);
    // S3 bucket policy for CloudTrail
    expect(config).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
    // KMS key policy for CloudTrail
    expect(config).toMatch(/resource\s+"aws_kms_key_policy"\s+"cloudtrail_s3"/);
    // Output
    expect(config).toMatch(/output\s+"cloudtrail_arn"/);
  });

  // S3 ENCRYPTION
  test('S3 bucket server-side encryption configuration is present for all buckets', () => {
    const config = fs.readFileSync(path.join(__dirname, '../lib/s3_encryption.tf'), 'utf8');
    expect(config).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/);
    expect(config).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary"/);
    expect(config).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    expect(config).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.arn/);
  });

  // EC2 (updated for "bastion_primary"/"bastion_secondary" resources and attributes)
  test('EC2 bastion instance resources are present with correct tags and SG', () => {
    const config = fs.readFileSync(path.join(__dirname, '../lib/ec2.tf'), 'utf8');
    // Primary Bastion
    expect(config).toMatch(/resource\s+"aws_instance"\s+"bastion_primary"/);
    expect(config).toMatch(/ami\s*=\s*data\.aws_ami\.bastion_primary\.id/);
    expect(config).toMatch(/instance_type\s*=\s*var\.bastion_instance_type/);
    expect(config).toMatch(/subnet_id\s*=\s*aws_subnet\.public_primary_1\.id/);
    expect(config).toMatch(/vpc_security_group_ids\s*=\s*\[.*aws_security_group\.bastion_primary\.id.*\]/);
    expect(config).toMatch(/associate_public_ip_address\s*=\s*true/);
    expect(config).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    expect(config).toMatch(/tags\s*=\s*{[\s\S]*Name[\s\S]*Role[\s\S]*Environment[\s\S]*ManagedBy[\s\S]*Project[\s\S]*}/);
    // Secondary Bastion
    expect(config).toMatch(/resource\s+"aws_instance"\s+"bastion_secondary"/);
    expect(config).toMatch(/ami\s*=\s*data\.aws_ami\.bastion_secondary\.id/);
    expect(config).toMatch(/instance_type\s*=\s*var\.bastion_instance_type/);
    expect(config).toMatch(/subnet_id\s*=\s*aws_subnet\.public_secondary_1\.id/);
    expect(config).toMatch(/vpc_security_group_ids\s*=\s*\[.*aws_security_group\.bastion_secondary\.id.*\]/);
    expect(config).toMatch(/associate_public_ip_address\s*=\s*true/);
    expect(config).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    expect(config).toMatch(/tags\s*=\s*{[\s\S]*Name[\s\S]*Role[\s\S]*Environment[\s\S]*ManagedBy[\s\S]*Project[\s\S]*}/);
    // Outputs
    expect(config).toMatch(/output\s+"bastion_primary_id"/);
    expect(config).toMatch(/output\s+"bastion_secondary_id"/);
    // Flow logs and log groups
    expect(config).toMatch(/resource\s+"aws_flow_log"\s+"bastion_primary_subnet"/);
    expect(config).toMatch(/resource\s+"aws_flow_log"\s+"bastion_secondary_subnet"/);
    expect(config).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"bastion_primary_subnet"/);
    expect(config).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"bastion_secondary_subnet"/);
  });

  // LAMBDA PYTHON HANDLER
  test('Lambda Python handler file is present and returns correct response', () => {
    const handlerPath = path.join(__dirname, '../lib/lambda_function.py');
    expect(fs.existsSync(handlerPath)).toBe(true);
    const pyCode = fs.readFileSync(handlerPath, 'utf8');
    expect(pyCode).toMatch(/def\s+lambda_handler\(event,\s*context\)/);
    expect(pyCode).toMatch(/'statusCode'\s*:\s*200/);
    expect(pyCode).toMatch(/'message':\s*'Hello from secure-env Lambda!'/);
    expect(pyCode).toMatch(/logger\.info/);
  });

  // GENERAL OUTPUTS
  const outputFiles = [
    'tap_stack.tf',
    'cloudtrail.tf',
    'ec2.tf',
    'kms.tf',
    'iam.tf',
    'lambda.tf'
  ];
  outputFiles.forEach((file) => {
    test(`.tf file ${file} defines outputs`, () => {
      const config = fs.readFileSync(path.join(__dirname, `../lib/${file}`), 'utf8');
      // Checks for at least one output block
      expect(config).toMatch(/output\s+"/);
    });
  });
}); 