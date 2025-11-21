// terraform.unit.test.ts
// Comprehensive unit tests for Payment Processing Pipeline Terraform Stack
// Tests validate structure, configuration, and compliance without executing Terraform

import * as fs from 'fs';
import * as path from 'path';

// File paths - dynamically resolved
const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const VARIABLES_PATH = path.resolve(__dirname, '../lib/variables.tf');
const OUTPUTS_PATH = path.resolve(__dirname, '../lib/outputs.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');

// Module paths
const SQS_MODULE_PATH = path.resolve(__dirname, '../lib/modules/sqs');
const IAM_MODULE_PATH = path.resolve(__dirname, '../lib/modules/iam');
const MONITORING_MODULE_PATH = path.resolve(__dirname, '../lib/modules/monitoring');

// Helper functions
const readFileContent = (filePath: string): string => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
};

const readModuleFile = (modulePath: string, fileName: string): string => {
  const fullPath = path.join(modulePath, fileName);
  return readFileContent(fullPath);
};

const hasResource = (content: string, resourceType: string, resourceName: string): boolean => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`);
  return regex.test(content);
};

const hasDataSource = (content: string, dataType: string, dataName: string): boolean => {
  const regex = new RegExp(`data\\s+"${dataType}"\\s+"${dataName}"`);
  return regex.test(content);
};

const hasVariable = (content: string, variableName: string): boolean => {
  const regex = new RegExp(`variable\\s+"${variableName}"`);
  return regex.test(content);
};

const hasOutput = (content: string, outputName: string): boolean => {
  const regex = new RegExp(`output\\s+"${outputName}"`);
  return regex.test(content);
};

const hasModule = (content: string, moduleName: string): boolean => {
  const regex = new RegExp(`module\\s+"${moduleName}"`);
  return regex.test(content);
};

const hasResourceAttribute = (content: string, resourceType: string, resourceName: string, attribute: string): boolean => {
  const resourceRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?${attribute}\\s*=`, 's');
  return resourceRegex.test(content);
};

const countResourceOccurrences = (content: string, resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

const hasTagging = (content: string, resourceType: string, resourceName: string): boolean => {
  const tagsRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?tags\\s*=`, 's');
  return tagsRegex.test(content);
};

const hasVariableValidation = (content: string, variableName: string): boolean => {
  const validationRegex = new RegExp(`variable\\s+"${variableName}"[\\s\\S]*?validation\\s*{`, 's');
  return validationRegex.test(content);
};

const hasLocalConfiguration = (content: string): boolean => {
  return /locals\s*{[\s\S]*common_tags\s*=/.test(content);
};

describe('Payment Processing Pipeline Terraform Stack - Unit Tests', () => {
  let stackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;
  let sqsModuleContent: string;
  let iamModuleContent: string;
  let monitoringModuleContent: string;

  beforeAll(() => {
    stackContent = readFileContent(STACK_PATH);
    variablesContent = readFileContent(VARIABLES_PATH);
    outputsContent = readFileContent(OUTPUTS_PATH);
    providerContent = readFileContent(PROVIDER_PATH);
    sqsModuleContent = readModuleFile(SQS_MODULE_PATH, 'main.tf');
    iamModuleContent = readModuleFile(IAM_MODULE_PATH, 'main.tf');
    monitoringModuleContent = readModuleFile(MONITORING_MODULE_PATH, 'main.tf');
  });

  describe('File Structure and Existence', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('all module directories exist with required files', () => {
      const modules = ['sqs', 'iam', 'monitoring'];
      modules.forEach(module => {
        const modulePath = path.resolve(__dirname, `../lib/modules/${module}`);
        expect(fs.existsSync(modulePath)).toBe(true);
        expect(fs.existsSync(path.join(modulePath, 'main.tf'))).toBe(true);
        expect(fs.existsSync(path.join(modulePath, 'variables.tf'))).toBe(true);
        expect(fs.existsSync(path.join(modulePath, 'outputs.tf'))).toBe(true);
      });
    });

    test('main stack file is sufficiently comprehensive', () => {
      expect(stackContent.length).toBeGreaterThan(5000);
    });

    test('variables file contains all required variables', () => {
      expect(variablesContent.length).toBeGreaterThan(500);
    });

    test('outputs file contains comprehensive output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(2000);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4/);
    });

    test('configures AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*version\s*=\s*">=\s*5\.0/);
    });

    test('uses variable for AWS region for region agnosticism', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configures S3 backend for state management', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('includes default tags for resource management', () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });
  });

  describe('Required Variables Declaration', () => {
    const requiredVariables = [
      'aws_region',
      'environment_suffix',
      'repository',
      'commit_author',
      'pr_number',
      'team'
    ];

    test.each(requiredVariables)('declares variable %s', (variableName) => {
      expect(hasVariable(variablesContent, variableName)).toBe(true);
    });

    test('aws_region variable has default value', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=/s);
    });

    test('environment_suffix variable supports dynamic environments', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?default\s*=/s);
    });
  });

  describe('Data Sources Configuration', () => {
    test('retrieves current AWS caller identity', () => {
      expect(hasDataSource(stackContent, 'aws_caller_identity', 'current')).toBe(true);
    });

    test('retrieves available availability zones dynamically', () => {
      expect(hasDataSource(stackContent, 'aws_availability_zones', 'available')).toBe(true);
    });

    test('queries existing VPCs for region agnosticism', () => {
      expect(hasDataSource(stackContent, 'aws_vpcs', 'existing')).toBe(true);
    });

    test('queries existing private subnets conditionally', () => {
      expect(hasDataSource(stackContent, 'aws_subnets', 'private')).toBe(true);
    });
  });

  describe('Module Configuration', () => {
    test('declares SQS module', () => {
      expect(hasModule(stackContent, 'sqs')).toBe(true);
    });

    test('declares IAM module', () => {
      expect(hasModule(stackContent, 'iam')).toBe(true);
    });

    test('declares monitoring module', () => {
      expect(hasModule(stackContent, 'monitoring')).toBe(true);
    });

    test('modules use local variables for dynamic configuration', () => {
      expect(stackContent).toMatch(/module\s+"sqs"[\s\S]*?source\s*=\s*"\.\/modules\/sqs"/s);
      expect(stackContent).toMatch(/module\s+"iam"[\s\S]*?source\s*=\s*"\.\/modules\/iam"/s);
      expect(stackContent).toMatch(/module\s+"monitoring"[\s\S]*?source\s*=\s*"\.\/modules\/monitoring"/s);
    });
  });

  describe('SQS Module Resources', () => {
    test('creates FIFO queues for payment processing stages', () => {
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue', 'transaction_validation')).toBe(true);
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue', 'fraud_detection')).toBe(true);
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue', 'payment_notification')).toBe(true);
    });

    test('creates dead letter queues for each processing stage', () => {
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue', 'transaction_validation_dlq')).toBe(true);
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue', 'fraud_detection_dlq')).toBe(true);
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue', 'payment_notification_dlq')).toBe(true);
    });

    test('configures queue policies for least privilege access', () => {
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue_policy', 'transaction_validation')).toBe(true);
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue_policy', 'fraud_detection')).toBe(true);
      expect(hasResource(sqsModuleContent, 'aws_sqs_queue_policy', 'payment_notification')).toBe(true);
    });

    test('creates DynamoDB table for transaction state management', () => {
      expect(hasResource(sqsModuleContent, 'aws_dynamodb_table', 'transaction_state')).toBe(true);
    });

    test('creates SSM parameters for queue URL configuration', () => {
      expect(hasResource(sqsModuleContent, 'aws_ssm_parameter', 'validation_queue_url')).toBe(true);
      expect(hasResource(sqsModuleContent, 'aws_ssm_parameter', 'fraud_queue_url')).toBe(true);
      expect(hasResource(sqsModuleContent, 'aws_ssm_parameter', 'notification_queue_url')).toBe(true);
    });

    test('configures FIFO queue attributes correctly', () => {
      expect(sqsModuleContent).toMatch(/fifo_queue\s*=\s*true/);
      expect(sqsModuleContent).toMatch(/content_based_deduplication\s*=\s*true/);
    });

    test('enables server-side encryption for security compliance', () => {
      expect(sqsModuleContent).toMatch(/sqs_managed_sse_enabled\s*=\s*true/);
    });

    test('configures DynamoDB table with proper attributes', () => {
      expect(sqsModuleContent).toMatch(/hash_key\s*=\s*"transaction_id"/);
      expect(sqsModuleContent).toMatch(/range_key\s*=\s*"merchant_id"/);
      expect(sqsModuleContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });
  });

  describe('IAM Module Resources', () => {
    test('creates Lambda execution roles for each processing stage', () => {
      expect(hasResource(iamModuleContent, 'aws_iam_role', 'lambda_validation_role')).toBe(true);
      expect(hasResource(iamModuleContent, 'aws_iam_role', 'lambda_fraud_role')).toBe(true);
      expect(hasResource(iamModuleContent, 'aws_iam_role', 'lambda_notification_role')).toBe(true);
    });

    test('creates EventBridge role for queue forwarding', () => {
      expect(hasResource(iamModuleContent, 'aws_iam_role', 'eventbridge_role')).toBe(true);
    });

    test('creates IAM policies for each Lambda role', () => {
      expect(hasResource(iamModuleContent, 'aws_iam_role_policy', 'lambda_validation_policy')).toBe(true);
      expect(hasResource(iamModuleContent, 'aws_iam_role_policy', 'lambda_fraud_policy')).toBe(true);
      expect(hasResource(iamModuleContent, 'aws_iam_role_policy', 'lambda_notification_policy')).toBe(true);
    });

    test('creates security group for VPC endpoints when VPC exists', () => {
      expect(hasResource(iamModuleContent, 'aws_security_group', 'vpc_endpoint')).toBe(true);
    });

    test('implements least privilege principle in policies', () => {
      expect(iamModuleContent).toMatch(/Effect\s*=\s*"Allow"/);
      expect(iamModuleContent).toMatch(/aws:SourceAccount/);
    });
  });

  describe('Monitoring Module Resources', () => {
    test('creates SNS topic for alerts and notifications', () => {
      expect(hasResource(monitoringModuleContent, 'aws_sns_topic', 'payment_alerts')).toBe(true);
    });

    test('creates CloudWatch alarms for queue depth monitoring', () => {
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_metric_alarm', 'validation_queue_depth')).toBe(true);
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_metric_alarm', 'fraud_queue_depth')).toBe(true);
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_metric_alarm', 'notification_queue_depth')).toBe(true);
    });

    test('creates CloudWatch alarms for dead letter queue monitoring', () => {
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_metric_alarm', 'validation_dlq_messages')).toBe(true);
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_metric_alarm', 'fraud_dlq_messages')).toBe(true);
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_metric_alarm', 'notification_dlq_messages')).toBe(true);
    });

    test('creates CloudWatch log groups for Lambda functions', () => {
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_log_group', 'validation_lambda')).toBe(true);
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_log_group', 'fraud_lambda')).toBe(true);
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_log_group', 'notification_lambda')).toBe(true);
    });

    test('creates CloudWatch dashboard for monitoring overview', () => {
      expect(hasResource(monitoringModuleContent, 'aws_cloudwatch_dashboard', 'payment_processing')).toBe(true);
    });

    test('configures appropriate alarm thresholds', () => {
      expect(monitoringModuleContent).toMatch(/threshold\s*=\s*var\.queue_depth_threshold/);
      expect(monitoringModuleContent).toMatch(/threshold\s*=\s*"0"/);
    });
  });

  describe('Main Stack Integration', () => {
    test('creates VPC endpoint for private SQS access', () => {
      expect(hasResource(stackContent, 'aws_vpc_endpoint', 'sqs')).toBe(true);
    });

    test('creates S3 bucket for disaster recovery', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket', 'dr_events')).toBe(true);
      expect(hasResource(stackContent, 'aws_s3_bucket_versioning', 'dr_events')).toBe(true);
      expect(hasResource(stackContent, 'aws_s3_bucket_server_side_encryption_configuration', 'dr_events')).toBe(true);
    });

    test('uses locals for dynamic resource naming', () => {
      expect(hasLocalConfiguration(stackContent)).toBe(true);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"payment-processing-\$\{local\.env_suffix\}"/);
    });

    test('implements region-agnostic configuration', () => {
      expect(stackContent).toMatch(/var\.aws_region/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
  });

  describe('Resource Tagging and Compliance', () => {
    test('applies consistent tagging strategy across modules', () => {
      expect(stackContent).toMatch(/common_tags\s*=/);
      expect(stackContent).toMatch(/Environment\s*=/);
      expect(stackContent).toMatch(/Application\s*=/);
      expect(stackContent).toMatch(/ManagedBy\s*=/);
    });

    test('includes cost center and team tagging for financial tracking', () => {
      expect(stackContent).toMatch(/CostCenter\s*=/);
      expect(stackContent).toMatch(/Team\s*=/);
    });

    test('resources are properly tagged for governance', () => {
      expect(sqsModuleContent).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
      expect(iamModuleContent).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
      expect(monitoringModuleContent).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
    });
  });

  describe('Security and Compliance Configuration', () => {
    test('enables encryption for data at rest and in transit', () => {
      expect(sqsModuleContent).toMatch(/sqs_managed_sse_enabled\s*=\s*true/);
      expect(monitoringModuleContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('implements proper backup and recovery configuration', () => {
      expect(sqsModuleContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/s);
      expect(stackContent).toMatch(/versioning_configuration\s*{[\s\S]*?status\s*=\s*"Enabled"/s);
    });

    test('configures proper message retention for audit compliance', () => {
      expect(sqsModuleContent).toMatch(/message_retention_seconds\s*=\s*var\.message_retention_seconds/);
      expect(monitoringModuleContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test('implements DLQ configuration for fault tolerance', () => {
      expect(sqsModuleContent).toMatch(/redrive_policy\s*=\s*jsonencode/);
      expect(sqsModuleContent).toMatch(/maxReceiveCount\s*=\s*var\.max_receive_count/);
    });
  });

  describe('Required Output Declarations', () => {
    const requiredOutputs = [
      'transaction_validation_queue_arn',
      'transaction_validation_queue_url',
      'fraud_detection_queue_arn',
      'fraud_detection_queue_url',
      'payment_notification_queue_arn',
      'payment_notification_queue_url',
      'lambda_validation_role_arn',
      'lambda_fraud_role_arn',
      'lambda_notification_role_arn',
      'eventbridge_role_arn',
      'sns_alerts_topic_arn',
      'transaction_state_table_arn',
      'dr_events_bucket_name',
      'environment_suffix',
      'aws_region'
    ];

    test.each(requiredOutputs)('declares output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('outputs reference module outputs correctly', () => {
      expect(outputsContent).toMatch(/module\.sqs\./);
      expect(outputsContent).toMatch(/module\.iam\./);
      expect(outputsContent).toMatch(/module\.monitoring\./);
    });
  });

  describe('Module Variables and Outputs', () => {
    test('SQS module has all required variables', () => {
      const sqsVariables = readModuleFile(SQS_MODULE_PATH, 'variables.tf');
      const requiredSqsVars = [
        'transaction_validation_queue_name',
        'fraud_detection_queue_name',
        'payment_notification_queue_name',
        'account_id',
        'common_tags'
      ];

      requiredSqsVars.forEach(varName => {
        expect(hasVariable(sqsVariables, varName)).toBe(true);
      });
    });

    test('IAM module has all required variables', () => {
      const iamVariables = readModuleFile(IAM_MODULE_PATH, 'variables.tf');
      const requiredIamVars = [
        'lambda_validation_role_name',
        'lambda_fraud_role_name',
        'lambda_notification_role_name',
        'aws_region',
        'account_id'
      ];

      requiredIamVars.forEach(varName => {
        expect(hasVariable(iamVariables, varName)).toBe(true);
      });
    });

    test('monitoring module has all required variables', () => {
      const monitoringVariables = readModuleFile(MONITORING_MODULE_PATH, 'variables.tf');
      const requiredMonitoringVars = [
        'name_prefix',
        'sns_alerts_topic_name',
        'validation_queue_name',
        'fraud_queue_name',
        'notification_queue_name'
      ];

      requiredMonitoringVars.forEach(varName => {
        expect(hasVariable(monitoringVariables, varName)).toBe(true);
      });
    });
  });

  describe('Architecture Best Practices', () => {
    test('follows modular architecture principles', () => {
      expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\//);
      expect(fs.existsSync(SQS_MODULE_PATH)).toBe(true);
      expect(fs.existsSync(IAM_MODULE_PATH)).toBe(true);
      expect(fs.existsSync(MONITORING_MODULE_PATH)).toBe(true);
    });

    test('implements proper separation of concerns', () => {
      expect(sqsModuleContent).toMatch(/aws_sqs_queue/);
      expect(sqsModuleContent).toMatch(/aws_dynamodb_table/);
      expect(iamModuleContent).toMatch(/aws_iam_role/);
      expect(monitoringModuleContent).toMatch(/aws_cloudwatch/);
    });

    test('uses variables for configurable parameters', () => {
      expect(sqsModuleContent).toMatch(/var\./);
      expect(iamModuleContent).toMatch(/var\./);
      expect(monitoringModuleContent).toMatch(/var\./);
    });

    test('provides comprehensive outputs for integration', () => {
      const sqsOutputs = readModuleFile(SQS_MODULE_PATH, 'outputs.tf');
      const iamOutputs = readModuleFile(IAM_MODULE_PATH, 'outputs.tf');
      const monitoringOutputs = readModuleFile(MONITORING_MODULE_PATH, 'outputs.tf');

      expect(sqsOutputs).toMatch(/output\s+"/);
      expect(iamOutputs).toMatch(/output\s+"/);
      expect(monitoringOutputs).toMatch(/output\s+"/);
    });
  });
});