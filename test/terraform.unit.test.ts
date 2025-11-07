import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');

  describe('Terraform Files Validation', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = [
        'compute.tf',
        'data.tf',
        'monitoring.tf',
        'networking.tf',
        'secrets.tf',
        'security.tf',
        'storage.tf',
        'variables.tf',
        'outputs.tf'
      ];
      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBeTruthy();
      });
    });

    test('should have all .tf files present', () => {
      const tfFiles = fs.readdirSync(libPath).filter(f => f.endsWith('.tf'));
      expect(tfFiles.length).toBeGreaterThanOrEqual(9);
      tfFiles.forEach(file => {
        expect(file).toMatch(/\.tf$/);
      });
    });
  });

  // Per-file content validation
  describe('Variables Validation', () => {
    const variablesPath = path.join(libPath, 'variables.tf');
    let content: string;
    beforeAll(() => {
      content = fs.readFileSync(variablesPath, 'utf8');
    });

    test('defines environment_suffix variable', () => {
      expect(content).toMatch(/variable\s+"environment_suffix"/);
    });

    test('defines aws_region variable with default us-east-1', () => {
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/default\s+=\s+"us-east-1"/);
    });

    test('defines vpc_cidr and availability_zones variables', () => {
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/variable\s+"availability_zones"/);
    });

    test('common_tags variable includes DataClassification and ComplianceScope', () => {
      expect(content).toMatch(/DataClassification\s*=\s*"Sensitive"/);
      expect(content).toMatch(/ComplianceScope\s*=\s*"PCI-DSS"/);
    });
  });

  describe('Compute Resources', () => {
    const pathFile = path.join(libPath, 'compute.tf');
    let content: string;
    beforeAll(() => {
      content = fs.readFileSync(pathFile, 'utf8');
    });

    test('defines aws_lambda_function processor with python3.11 runtime', () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"processor"/);
      expect(content).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test('lambda has environment variables including DATA_BUCKET and SECRET_ARN', () => {
      expect(content).toMatch(/variables\s*=\s*{[^}]*DATA_BUCKET[^}]*SECRET_ARN[^}]*}/);
    });

    test('cloudwatch log group for lambda with KMS key and 90 day retention', () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(content).toMatch(/retention_in_days\s*=\s*90/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cloudwatch\.arn/);
    });
  });

  describe('Network Resources', () => {
    const pathFile = path.join(libPath, 'networking.tf');
    let content: string;
    beforeAll(() => {
      content = fs.readFileSync(pathFile, 'utf8');
    });

    test('defines main VPC with correct CIDR and dns support', () => {
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/cidr_block\s*=\s*var.vpc_cidr/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('defines 3 private subnets across availability zones', () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*3/);
    });

    test('private route table and associations exist', () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });

    test('vpc endpoints for s3 and dynamodb configured with correct policies', () => {
      expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
      expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
    });

    test('network acl has ingress deny rules for ports 20-21, 23, 3389, etc.', () => {
      expect(content).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
      expect(content).toMatch(/rule_no\s+=\s*100/);
      expect(content).toMatch(/action\s+=\s*"deny"/);
    });
  });

  describe('Secrets Resources', () => {
    const pathFile = path.join(libPath, 'secrets.tf');
    let content: string;
    beforeAll(() => {
      content = fs.readFileSync(pathFile, 'utf8');
    });

    test('secretsmanager secret db_credentials with rotation via lambda', () => {
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/);
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_rotation"\s+"db_credentials"/);
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"secrets_rotation"/);
    });

    test('IAM roles and policies for secrets rotation lambda exist with assume role policy', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"secrets_rotation"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"secrets_rotation"/);
      expect(content).toMatch(/sts:AssumeRole/);
    });
  });

  describe('Security Resources', () => {
    const pathFile = path.join(libPath, 'security.tf');
    let content: string;
    beforeAll(() => {
      content = fs.readFileSync(pathFile, 'utf8');
    });

    test('KMS keys for s3 and cloudwatch with key rotation enabled', () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"cloudwatch"/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('security group for lambda with correct egress rules', () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
      expect(content).toMatch(/egress\s*{/);
      expect(content).toMatch(/from_port\s*=\s*443/);
      expect(content).toMatch(/from_port\s*=\s*5432/);
    });

    test('IAM role and policy for lambda execution with explicit denies', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda"/);
      expect(content).toMatch(/Effect\s*=\s*"Deny"/);
    });
  });

  describe('Storage Resources', () => {
    const pathFile = path.join(libPath, 'storage.tf');
    let content: string;
    beforeAll(() => {
      content = fs.readFileSync(pathFile, 'utf8');
    });

    test('S3 buckets data and logs with versioning, encryption, and public access block', () => {
      ['data', 'logs'].forEach(bucket => {
        expect(content).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`));
        expect(content).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_versioning"\\s+"${bucket}"`));
        expect(content).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${bucket}"`));
        expect(content).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${bucket}"`));
      });
    });

    test('DynamoDB metadata table with server-side encryption and point-in-time recovery', () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"metadata"/);
      expect(content).toMatch(/server_side_encryption\s*{/);
      expect(content).toMatch(/point_in_time_recovery\s*{/);
    });
  });

  describe('Monitoring Resources', () => {
    const pathFile = path.join(libPath, 'monitoring.tf');
    let content: string;
    beforeAll(() => {
      content = fs.readFileSync(pathFile, 'utf8');
    });

    test('GuardDuty SNS topic and eventbridge rule for high severity findings', () => {
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"guardduty_alerts"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"guardduty_findings"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"guardduty_sns"/);
    });

    test('CloudWatch log group for VPC flow logs', () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
      expect(content).toMatch(/retention_in_days\s*=\s*90/);
    });

    test('IAM role and policy for VPC flow logs with assume role policy', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/);
    });

    test('VPC flow logs resource associated to VPC and CloudWatch log group', () => {
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(content).toMatch(/log_destination\s*=\s*aws_cloudwatch_log_group\.vpc_flow_logs\.arn/);
    });
  });

  describe('Outputs Validation', () => {
    const outputsPath = path.join(libPath, 'outputs.tf');
    let content: string;
    beforeAll(() => {
      content = fs.readFileSync(outputsPath, 'utf8');
    });

    const expectedOutputs = [
      'vpc_id',
      'vpc_cidr_block',
      'private_subnet_ids',
      'private_subnet_cidr_blocks',
      'private_route_table_id',
      's3_vpc_endpoint_id',
      's3_vpc_endpoint_dns_entry',
      'dynamodb_vpc_endpoint_id',
      'dynamodb_vpc_endpoint_dns_entry',
      'private_network_acl_id',
      'lambda_security_group_id',
      'lambda_security_group_name',
      'lambda_execution_role_arn',
      'vpc_flow_logs_role_arn',
      'secrets_rotation_role_arn',
      'lambda_log_group_arn',
      'vpc_flow_logs_log_group_arn',
      'data_bucket_name',
      'data_bucket_arn',
      'logs_bucket_name',
      'logs_bucket_arn',
      'dynamodb_table_name',
      'dynamodb_table_arn',
      'kms_s3_key_id',
      'kms_s3_key_arn',
      'kms_cloudwatch_key_id',
      'kms_cloudwatch_key_arn',
      'guardduty_detector_id',
      'guardduty_alerts_topic_arn',
      'guardduty_findings_rule_arn',
      'vpc_flow_logs_id',
      'db_credentials_secret_arn',
      'db_credentials_secret_version_id',
      'processor_lambda_arn',
      'secrets_rotation_lambda_arn'
    ];

    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(content).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

