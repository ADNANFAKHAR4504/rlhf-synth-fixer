import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform Infrastructure Unit Tests', () => {
  const tfDir = path.join(__dirname, '../lib');
  let tfPlan: any;

  beforeAll(() => {
    // Initialize terraform and create a plan
    try {
      execSync(`cd ${tfDir} && terraform init -backend=false`, {
        encoding: 'utf-8',
      });
      const planOutput = execSync(
        `cd ${tfDir} && terraform plan -out=test.tfplan`,
        { encoding: 'utf-8' }
      );
      const jsonPlan = execSync(
        `cd ${tfDir} && terraform show -json test.tfplan`,
        { encoding: 'utf-8' }
      );
      tfPlan = JSON.parse(jsonPlan);
    } catch (error) {
      console.error('Failed to initialize Terraform:', error);
      throw error;
    }
  });

  afterAll(() => {
    // Clean up test files
    try {
      if (fs.existsSync(path.join(tfDir, 'test.tfplan'))) {
        fs.unlinkSync(path.join(tfDir, 'test.tfplan'));
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Terraform Configuration Validation', () => {
    test('should have valid Terraform configuration', () => {
      const result = execSync(`cd ${tfDir} && terraform validate -json`, {
        encoding: 'utf-8',
      });
      const validation = JSON.parse(result);
      expect(validation.valid).toBe(true);
    });

    test('should use required Terraform version', () => {
      const providerContent = fs.readFileSync(
        path.join(tfDir, 'provider.tf'),
        'utf-8'
      );
      expect(providerContent).toContain('required_version = ">= 1.4.0"');
    });

    test('should have AWS provider configured', () => {
      const providerContent = fs.readFileSync(
        path.join(tfDir, 'provider.tf'),
        'utf-8'
      );
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('should have archive provider configured', () => {
      const providerContent = fs.readFileSync(
        path.join(tfDir, 'provider.tf'),
        'utf-8'
      );
      expect(providerContent).toContain('archive = {');
      expect(providerContent).toContain('source  = "hashicorp/archive"');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all resources should include environment suffix in naming', () => {
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('${var.environment_suffix}');
      expect(mainContent).toContain(
        'name_prefix = "${local.account_id}-security-${var.environment_suffix}"'
      );
    });

    test('all resources should have proper tags', () => {
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('tags = local.common_tags');
      // Check that the common_tags contains expected keys (ignore spacing)
      expect(mainContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(mainContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(mainContent).toMatch(
        /EnvironmentSuffix\s*=\s*var\.environment_suffix/
      );
    });
  });

  describe('KMS Encryption Configuration', () => {
    test('should have KMS key with proper configuration', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const kmsKey = resources.find(
        (r: any) => r.type === 'aws_kms_key' && r.name === 'security_key'
      );

      expect(kmsKey).toBeDefined();
      expect(kmsKey.values.enable_key_rotation).toBe(true);
      expect(kmsKey.values.deletion_window_in_days).toBe(7);
    });

    test('KMS key should have proper policy for CloudWatch Logs', () => {
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('Sid    = "Allow CloudWatch Logs"');
      expect(mainContent).toContain(
        'Service = "logs.${local.region}.amazonaws.com"'
      );
    });

    test('should have KMS key alias', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const kmsAlias = resources.find((r: any) => r.type === 'aws_kms_alias');

      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.values.name).toContain('alias/');
    });
  });

  describe('S3 Bucket Security Configuration', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      // Verify encryption is configured in the Terraform code
      expect(mainContent).toContain(
        'aws_s3_bucket_server_side_encryption_configuration'
      );
      expect(mainContent).toContain('sse_algorithm     = "aws:kms"');
      expect(mainContent).toContain('bucket_key_enabled = true');
      expect(mainContent).toContain(
        'kms_master_key_id = aws_kms_key.security_key.arn'
      );

      // Count encryption configurations in the code
      const encryptionMatches = mainContent.match(
        /aws_s3_bucket_server_side_encryption_configuration/g
      );
      expect(encryptionMatches?.length).toBe(3); // 3 buckets should have encryption
    });

    test('all S3 buckets should have public access blocked', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const publicAccessBlocks = resources.filter(
        (r: any) => r.type === 'aws_s3_bucket_public_access_block'
      );

      expect(publicAccessBlocks.length).toBeGreaterThan(0);
      publicAccessBlocks.forEach((pab: any) => {
        expect(pab.values.block_public_acls).toBe(true);
        expect(pab.values.block_public_policy).toBe(true);
        expect(pab.values.ignore_public_acls).toBe(true);
        expect(pab.values.restrict_public_buckets).toBe(true);
      });
    });

    test('all S3 buckets should have force_destroy enabled', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const buckets = resources.filter((r: any) => r.type === 'aws_s3_bucket');

      expect(buckets.length).toBeGreaterThan(0);
      buckets.forEach((bucket: any) => {
        expect(bucket.values.force_destroy).toBe(true);
      });
    });

    test('secure bucket should have SSL-only policy', () => {
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('DenyUnSecureCommunications');
      expect(mainContent).toContain('"aws:SecureTransport" = "false"');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have security monitoring role with proper permissions', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const monitoringRole = resources.find(
        (r: any) =>
          r.type === 'aws_iam_role' && r.name === 'security_monitoring_role'
      );

      expect(monitoringRole).toBeDefined();
      expect(monitoringRole.values.name).toContain('monitoring-role');
    });

    test('should have cross-account role with external ID', () => {
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('cross_account_role');
      expect(mainContent).toContain('sts:ExternalId');
    });

    test('Lambda execution role should have necessary permissions', () => {
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('lambda_execution_role');
      expect(mainContent).toContain('logs:CreateLogGroup');
      expect(mainContent).toContain('sns:Publish');
      expect(mainContent).toContain('kms:Decrypt');
    });

    test('Config role should have proper service permissions', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const configRole = resources.find(
        (r: any) => r.type === 'aws_iam_role' && r.name === 'config_role'
      );

      expect(configRole).toBeDefined();
      const assumeRolePolicy = JSON.parse(configRole.values.assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'config.amazonaws.com'
      );
    });
  });

  describe('CloudWatch and SNS Configuration', () => {
    test('should have CloudWatch log group with KMS encryption', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const logGroup = resources.find(
        (r: any) => r.type === 'aws_cloudwatch_log_group'
      );

      expect(logGroup).toBeDefined();
      expect(logGroup.values.retention_in_days).toBe(90);
      // Verify KMS key is configured in the main.tf file
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('kms_key_id');
      expect(mainContent).toContain('aws_kms_key.security_key');
    });

    test('should have CloudWatch metric filter for IAM actions', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const metricFilter = resources.find(
        (r: any) => r.type === 'aws_cloudwatch_log_metric_filter'
      );

      expect(metricFilter).toBeDefined();
      expect(metricFilter.values.pattern).toContain('CreateUser');
      expect(metricFilter.values.pattern).toContain('DeleteRole');
    });

    test('should have CloudWatch alarm for IAM actions', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const alarm = resources.find(
        (r: any) => r.type === 'aws_cloudwatch_metric_alarm'
      );

      expect(alarm).toBeDefined();
      expect(alarm.values.metric_name).toBe('IAMActions');
      expect(alarm.values.threshold).toBe(1);
    });

    test('should have SNS topic with KMS encryption', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const snsTopic = resources.find((r: any) => r.type === 'aws_sns_topic');

      expect(snsTopic).toBeDefined();
      // Verify KMS key is configured in the main.tf file
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain(
        'resource "aws_sns_topic" "security_alerts"'
      );
      expect(mainContent).toMatch(
        /kms_master_key_id\s*=\s*aws_kms_key\.security_key/
      );
    });
  });

  describe('Lambda and Step Functions', () => {
    test('should have Lambda function for security response', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const lambda = resources.find(
        (r: any) => r.type === 'aws_lambda_function'
      );

      expect(lambda).toBeDefined();
      expect(lambda.values.runtime).toBe('python3.9');
      expect(lambda.values.timeout).toBe(300);
      expect(lambda.values.handler).toBe('index.handler');
    });

    test('Lambda function should have environment variables', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const lambda = resources.find(
        (r: any) => r.type === 'aws_lambda_function'
      );

      expect(lambda).toBeDefined();
      // Verify environment variables are configured in the main.tf file
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('environment {');
      expect(mainContent).toContain('SNS_TOPIC_ARN');
      expect(mainContent).toContain('KMS_KEY_ID');
    });

    test('should have Step Function state machine', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const stateMachine = resources.find(
        (r: any) => r.type === 'aws_sfn_state_machine'
      );

      expect(stateMachine).toBeDefined();
      // Verify state machine is configured in the main.tf file
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('resource "aws_sfn_state_machine"');
      expect(mainContent).toContain('ProcessSecurityEvent');
      expect(mainContent).toContain('StartAt');
    });
  });

  describe('AWS Config Configuration', () => {
    test('should have Config recorder with all resources enabled', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const recorder = resources.find(
        (r: any) => r.type === 'aws_config_configuration_recorder'
      );

      expect(recorder).toBeDefined();
      expect(recorder.values.recording_group[0].all_supported).toBe(true);
      expect(
        recorder.values.recording_group[0].include_global_resource_types
      ).toBe(true);
    });

    test('should have Config delivery channel', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const channel = resources.find(
        (r: any) => r.type === 'aws_config_delivery_channel'
      );

      expect(channel).toBeDefined();
      expect(channel.values.s3_key_prefix).toBe('config');
    });

    test('Config bucket should have proper policy', () => {
      const mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('config_bucket_policy');
      expect(mainContent).toContain('AWSConfigBucketPermissionsCheck');
      expect(mainContent).toContain('Service = "config.amazonaws.com"');
    });
  });

  describe('Security Hub and GuardDuty', () => {
    test('should have Security Hub enabled', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const securityHub = resources.find(
        (r: any) => r.type === 'aws_securityhub_account'
      );

      expect(securityHub).toBeDefined();
    });

    test('should have Security Hub standards subscriptions', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const standards = resources.filter(
        (r: any) => r.type === 'aws_securityhub_standards_subscription'
      );

      expect(standards.length).toBe(2);
      const arns = standards.map((s: any) => s.values.standards_arn);
      expect(
        arns.some((arn: string) =>
          arn.includes('aws-foundational-security-best-practices')
        )
      ).toBe(true);
      expect(
        arns.some((arn: string) =>
          arn.includes('cis-aws-foundations-benchmark')
        )
      ).toBe(true);
    });

    test('should have GuardDuty detector enabled', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const detector = resources.find(
        (r: any) => r.type === 'aws_guardduty_detector'
      );

      expect(detector).toBeDefined();
      expect(detector.values.enable).toBe(true);
    });

    test('should have GuardDuty features enabled', () => {
      const resources = tfPlan.planned_values?.root_module?.resources || [];
      const features = resources.filter(
        (r: any) => r.type === 'aws_guardduty_detector_feature'
      );

      expect(features.length).toBe(3);
      const featureNames = features.map((f: any) => f.values.name);
      expect(featureNames).toContain('S3_DATA_EVENTS');
      expect(featureNames).toContain('EKS_AUDIT_LOGS');
      expect(featureNames).toContain('EBS_MALWARE_PROTECTION');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs defined', () => {
      const outputsContent = fs.readFileSync(
        path.join(tfDir, 'outputs.tf'),
        'utf-8'
      );
      const requiredOutputs = [
        'kms_key_id',
        'kms_key_arn',
        'sns_topic_arn',
        'secure_bucket_name',
        'lambda_function_name',
        'step_function_arn',
        'guardduty_detector_id',
        'security_hub_account_id',
        'cloudwatch_log_group_name',
        'security_monitoring_role_arn',
        'cross_account_role_arn',
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toContain(`output "${output}"`);
      });
    });
  });

  describe('Variables', () => {
    test('should have all required variables defined', () => {
      const variablesContent = fs.readFileSync(
        path.join(tfDir, 'variables.tf'),
        'utf-8'
      );
      const requiredVars = [
        'aws_region',
        'environment',
        'project_name',
        'notification_email',
        'environment_suffix',
      ];

      requiredVars.forEach(varName => {
        expect(variablesContent).toContain(`variable "${varName}"`);
      });
    });

    test('environment_suffix variable should have proper default', () => {
      const variablesContent = fs.readFileSync(
        path.join(tfDir, 'variables.tf'),
        'utf-8'
      );
      expect(variablesContent).toContain('variable "environment_suffix"');
      expect(variablesContent).toContain('default     = "dev"');
    });
  });
});
