import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform Multi-Environment S3 + DynamoDB - Unit Tests', () => {
  const libDir = path.join(__dirname, '../lib');
  const mainTfPath = path.join(libDir, 'main.tf');
  const providerTfPath = path.join(libDir, 'provider.tf');

  let mainTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    mainTfContent = fs.readFileSync(mainTfPath, 'utf-8');
    providerTfContent = fs.readFileSync(providerTfPath, 'utf-8');
  });

  describe('File Structure Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
      expect(mainTfContent.length).toBeGreaterThan(0);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
      expect(providerTfContent.length).toBeGreaterThan(0);
    });
  });

  describe('Terraform Syntax Validation', () => {
    test('should pass terraform fmt check', () => {
      try {
        execSync('terraform fmt -check -recursive', { cwd: libDir, stdio: 'pipe' });
        expect(true).toBe(true);
      } catch (error) {
        fail('Terraform formatting check failed');
      }
    });

    test('should pass terraform validate', () => {
      try {
        execSync('terraform init -backend=false', { cwd: libDir, stdio: 'pipe' });
        execSync('terraform validate', { cwd: libDir, stdio: 'pipe' });
        expect(true).toBe(true);
      } catch (error) {
        fail('Terraform validation failed');
      }
    });

    test('should have valid HCL syntax in main.tf', () => {
      const openBraces = (mainTfContent.match(/{/g) || []).length;
      const closeBraces = (mainTfContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should have valid HCL syntax in provider.tf', () => {
      const openBraces = (providerTfContent.match(/{/g) || []).length;
      const closeBraces = (providerTfContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe('Provider Configuration', () => {
    test('should specify AWS provider version ~> 5.0', () => {
      expect(providerTfContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('should require Terraform version >= 1.0', () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test('should define environmentSuffix variable', () => {
      expect(providerTfContent).toMatch(/variable\s+"environmentSuffix"/);
    });

    test('should define project variable', () => {
      expect(providerTfContent).toMatch(/variable\s+"project"/);
    });

    test('should define costCenter variable', () => {
      expect(providerTfContent).toMatch(/variable\s+"costCenter"/);
    });

    test('should configure default tags', () => {
      expect(providerTfContent).toMatch(/default_tags/);
      expect(providerTfContent).toMatch(/ManagedBy/);
      expect(providerTfContent).toMatch(/Environment/);
    });
  });

  describe('Data Sources', () => {
    test('should have aws_caller_identity data source', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should have aws_region data source', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  describe('Locals Configuration', () => {
    test('should define environment from environmentSuffix', () => {
      expect(mainTfContent).toMatch(/environment\s*=\s*var\.environmentSuffix/);
    });

    test('should define common_tags', () => {
      expect(mainTfContent).toMatch(/common_tags\s*=/);
      expect(mainTfContent).toMatch(/Environment\s*=\s*local\.environment/);
    });

    test('should define env_config with dev, staging, prod', () => {
      expect(mainTfContent).toMatch(/env_config\s*=\s*{/);
      expect(mainTfContent).toMatch(/dev\s*=\s*{/);
      expect(mainTfContent).toMatch(/staging\s*=\s*{/);
      expect(mainTfContent).toMatch(/prod\s*=\s*{/);
    });

    test('should define s3_lifecycle_days lookup', () => {
      expect(mainTfContent).toMatch(/s3_lifecycle_days\s*=\s*lookup/);
    });

    test('should define dynamodb_billing_mode lookup', () => {
      expect(mainTfContent).toMatch(/dynamodb_billing_mode\s*=\s*lookup/);
    });

    test('should define enable_pitr lookup', () => {
      expect(mainTfContent).toMatch(/enable_pitr\s*=\s*lookup/);
    });

    test('should define enable_monitoring lookup', () => {
      expect(mainTfContent).toMatch(/enable_monitoring\s*=\s*lookup/);
    });
  });

  describe('Random String Resource', () => {
    test('should define random_string for unique naming', () => {
      expect(mainTfContent).toMatch(/resource\s+"random_string"\s+"unique_suffix"/);
    });

    test('should configure random_string with length 8', () => {
      expect(mainTfContent).toMatch(/length\s*=\s*8/);
    });

    test('should disable special characters in random_string', () => {
      expect(mainTfContent).toMatch(/special\s*=\s*false/);
    });
  });

  describe('KMS Key Configuration', () => {
    test('should define aws_kms_key resource', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"data_key"/);
    });

    test('should enable key rotation', () => {
      expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should use local.kms_deletion_window', () => {
      expect(mainTfContent).toMatch(/deletion_window_in_days\s*=\s*local\.kms_deletion_window/);
    });

    test('should use local.kms_multi_region', () => {
      expect(mainTfContent).toMatch(/multi_region\s*=\s*local\.kms_multi_region/);
    });

    test('should define KMS key policy', () => {
      expect(mainTfContent).toMatch(/policy\s*=\s*jsonencode/);
    });

    test('should define aws_kms_alias resource', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_alias"\s+"data_key_alias"/);
    });

    test('should use common_tags on KMS key', () => {
      const kmsKeyBlock = mainTfContent.match(/resource\s+"aws_kms_key"\s+"data_key"\s*{[\s\S]*?^}/m);
      expect(kmsKeyBlock).toBeTruthy();
      expect(kmsKeyBlock![0]).toMatch(/local\.common_tags/);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should define aws_s3_bucket resource', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data_bucket"/);
    });

    test('should use environmentSuffix in bucket naming', () => {
      expect(mainTfContent).toMatch(/local\.s3_bucket_name/);
      expect(mainTfContent).toMatch(/company_name.*data.*environment.*aws_region/);
    });

    test('should define bucket versioning', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(mainTfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should configure KMS encryption', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(mainTfContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.data_key\.arn/);
    });

    test('should block all public access', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('should configure lifecycle with filter', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(mainTfContent).toMatch(/filter\s*{}/);
    });

    test('should use local.s3_lifecycle_days for transition', () => {
      expect(mainTfContent).toMatch(/days\s*=\s*local\.s3_lifecycle_days/);
    });

    test('should transition to GLACIER storage class', () => {
      expect(mainTfContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test('should enforce SSL/TLS in bucket policy', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_policy"/);
      expect(mainTfContent).toMatch(/aws:SecureTransport/);
    });

    test('should use common_tags on S3 bucket', () => {
      const s3Block = mainTfContent.match(/resource\s+"aws_s3_bucket"\s+"data_bucket"\s*{[\s\S]*?^}/m);
      expect(s3Block).toBeTruthy();
      expect(s3Block![0]).toMatch(/local\.common_tags/);
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('should define aws_dynamodb_table resource', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"transactions_table"/);
    });

    test('should use local.dynamodb_billing_mode', () => {
      expect(mainTfContent).toMatch(/billing_mode\s*=\s*local\.dynamodb_billing_mode/);
    });

    test('should configure hash_key as transaction_id', () => {
      expect(mainTfContent).toMatch(/hash_key\s*=\s*"transaction_id"/);
    });

    test('should configure range_key as timestamp', () => {
      expect(mainTfContent).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test('should define transaction_id attribute', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"transaction_id"/);
      expect(mainTfContent).toMatch(/type\s*=\s*"S"/);
    });

    test('should define timestamp attribute', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"timestamp"/);
      expect(mainTfContent).toMatch(/type\s*=\s*"N"/);
    });

    test('should define account_id attribute', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"account_id"/);
    });

    test('should configure global_secondary_index', () => {
      expect(mainTfContent).toMatch(/global_secondary_index\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"account-index"/);
    });

    test('should use conditional read_capacity', () => {
      expect(mainTfContent).toMatch(/read_capacity\s*=\s*local\.dynamodb_billing_mode\s*==\s*"PROVISIONED"/);
    });

    test('should configure point_in_time_recovery with local.enable_pitr', () => {
      expect(mainTfContent).toMatch(/point_in_time_recovery\s*{/);
      expect(mainTfContent).toMatch(/enabled\s*=\s*local\.enable_pitr/);
    });

    test('should configure KMS encryption', () => {
      expect(mainTfContent).toMatch(/server_side_encryption\s*{/);
      expect(mainTfContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.data_key\.arn/);
    });

    test('should use common_tags on DynamoDB table', () => {
      // FIXED: Match the full pattern including local.common_tags
      const dynamoBlock = mainTfContent.match(/resource\s+"aws_dynamodb_table"\s+"transactions_table"[\s\S]*?tags\s*=\s*merge\s*\(\s*local\.common_tags/);
      expect(dynamoBlock).toBeTruthy();
      console.log('DynamoDB uses common_tags');
    });
  });

  describe('IAM Role Configuration', () => {
    test('should define aws_iam_role resource', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"data_access_role"/);
    });

    test('should configure assume_role_policy with external ID', () => {
      expect(mainTfContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(mainTfContent).toMatch(/sts:ExternalId.*var\.external_id/);
    });

    test('should define aws_iam_role_policy', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"data_access_policy"/);
    });

    test('should grant S3 permissions', () => {
      expect(mainTfContent).toMatch(/S3BucketAccess/);
      expect(mainTfContent).toMatch(/s3:GetObject/);
      expect(mainTfContent).toMatch(/s3:PutObject/);
    });

    test('should grant DynamoDB permissions', () => {
      expect(mainTfContent).toMatch(/DynamoDBTableAccess/);
      expect(mainTfContent).toMatch(/dynamodb:GetItem/);
      expect(mainTfContent).toMatch(/dynamodb:PutItem/);
    });

    test('should grant KMS permissions', () => {
      expect(mainTfContent).toMatch(/KMSKeyAccess/);
      expect(mainTfContent).toMatch(/kms:Decrypt/);
      expect(mainTfContent).toMatch(/kms:GenerateDataKey/);
    });

    test('should use common_tags on IAM role', () => {
      // FIXED: Match the full pattern including local.common_tags
      const iamBlock = mainTfContent.match(/resource\s+"aws_iam_role"\s+"data_access_role"[\s\S]*?tags\s*=\s*merge\s*\(\s*local\.common_tags/);
      expect(iamBlock).toBeTruthy();
      console.log('IAM role uses common_tags');
    });
  });

  describe('SNS and CloudWatch Configuration', () => {
    test('should define SNS topic with count', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alert_topic"/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.enable_monitoring\s*\?\s*1\s*:\s*0/);
    });

    test('should define SNS topic policy with count', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic_policy"/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.enable_monitoring/);
    });

    test('should define CloudWatch alarm for read throttle', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_read_throttle"/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.enable_monitoring/);
    });

    test('should define CloudWatch alarm for write throttle', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_write_throttle"/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.enable_monitoring/);
    });
  });

  describe('Outputs Configuration', () => {
    test('should output environment', () => {
      expect(mainTfContent).toMatch(/output\s+"environment"/);
      expect(mainTfContent).toMatch(/value\s*=\s*local\.environment/);
    });

    test('should output s3_bucket_name', () => {
      expect(mainTfContent).toMatch(/output\s+"s3_bucket_name"/);
    });

    test('should output s3_bucket_arn', () => {
      expect(mainTfContent).toMatch(/output\s+"s3_bucket_arn"/);
    });

    test('should output dynamodb_table_name', () => {
      expect(mainTfContent).toMatch(/output\s+"dynamodb_table_name"/);
    });

    test('should output dynamodb_table_arn', () => {
      expect(mainTfContent).toMatch(/output\s+"dynamodb_table_arn"/);
    });

    test('should output kms_key_id', () => {
      expect(mainTfContent).toMatch(/output\s+"kms_key_id"/);
    });

    test('should output kms_key_arn', () => {
      expect(mainTfContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test('should output iam_role_arn', () => {
      expect(mainTfContent).toMatch(/output\s+"iam_role_arn"/);
    });

    test('should output sns_topic_arn with conditional', () => {
      expect(mainTfContent).toMatch(/output\s+"sns_topic_arn"/);
      expect(mainTfContent).toMatch(/local\.enable_monitoring/);
    });

    test('should output config_summary', () => {
      expect(mainTfContent).toMatch(/output\s+"config_summary"/);
    });
  });

  describe('Security Best Practices', () => {
    test('should not contain hardcoded AWS credentials', () => {
      expect(mainTfContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(providerTfContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    test('should not contain hardcoded AWS secret keys', () => {
      expect(mainTfContent).not.toMatch(/aws_secret_access_key\s*=\s*"/);
      expect(providerTfContent).not.toMatch(/aws_secret_access_key\s*=\s*"/);
    });

    test('should enforce encryption for S3', () => {
      expect(mainTfContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    });

    test('should enforce encryption for DynamoDB', () => {
      expect(mainTfContent).toMatch(/server_side_encryption[\s\S]*?kms_key_arn/);
    });

    test('should block S3 public access', () => {
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });
});
