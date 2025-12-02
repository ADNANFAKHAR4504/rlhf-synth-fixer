import * as fs from 'fs';
import * as path from 'path';

// File paths - dynamically resolved
const LIB_PATH = path.resolve(__dirname, '../lib');
const STACK_PATH = path.join(LIB_PATH, 'tap_stack.tf');
const VARIABLES_PATH = path.join(LIB_PATH, 'variables.tf');
const OUTPUTS_PATH = path.join(LIB_PATH, 'outputs.tf');
const PROVIDER_PATH = path.join(LIB_PATH, 'provider.tf');
const VALIDATION_PATH = path.join(LIB_PATH, 'validation.tf');

// Helper functions
const readFileContent = (filePath: string): string => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
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

describe('Payment Processing Infrastructure Terraform Stack - Unit Tests', () => {
  let stackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;
  let validationContent: string;

  beforeAll(() => {
    stackContent = readFileContent(STACK_PATH);
    variablesContent = readFileContent(VARIABLES_PATH);
    outputsContent = readFileContent(OUTPUTS_PATH);
    providerContent = readFileContent(PROVIDER_PATH);
    validationContent = readFileContent(VALIDATION_PATH);
  });

  describe('File Structure and Existence', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(fs.existsSync(VALIDATION_PATH)).toBe(true);
    });

    test('tap_stack.tf contains comprehensive infrastructure definition', () => {
      expect(stackContent.length).toBeGreaterThan(20000);
    });

    test('variables.tf contains variable definitions', () => {
      expect(variablesContent.length).toBeGreaterThan(500);
    });

    test('outputs.tf contains output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(1000);
    });

    test('validation.tf contains validation logic', () => {
      expect(validationContent.length).toBeGreaterThan(1000);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version >= 1.4.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4/);
    });

    test('configures AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*version\s*=\s*">=\s*5\.0/);
    });

    test('uses variable for AWS region (region-agnostic)', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configures S3 backend', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('includes default tags configuration', () => {
      expect(providerContent).toMatch(/default_tags\s*{[\s\S]*tags\s*=/s);
    });
  });

  describe('Required Variables Declaration', () => {
    const requiredVariables = [
      'aws_region',
      'environment_suffix',
      'repository',
      'commit_author',
      'pr_number',
      'team',
      'project_name',
      'cost_center'
    ];

    test.each(requiredVariables)('declares variable %s', (variableName) => {
      expect(hasVariable(variablesContent, variableName)).toBe(true);
    });

    test('environment_suffix variable has validation', () => {
      expect(variablesContent).toMatch(/validation\s*{[\s\S]*condition[\s\S]*contains.*dev.*staging.*prod/s);
    });

    test('variables use appropriate defaults', () => {
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
      expect(variablesContent).toMatch(/default\s*=\s*"payment-processing"/);
    });
  });

  describe('Data Sources', () => {
    test('declares aws_caller_identity data source', () => {
      expect(hasDataSource(stackContent, 'aws_caller_identity', 'current')).toBe(true);
    });

    test('declares aws_region data source', () => {
      expect(hasDataSource(stackContent, 'aws_region', 'current')).toBe(true);
    });

    test('declares aws_availability_zones data source', () => {
      expect(hasDataSource(stackContent, 'aws_availability_zones', 'available')).toBe(true);
    });

    test('availability zones data source filters available zones', () => {
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('declares locals block with environment_config', () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*environment_config\s*=/s);
    });

    test('defines environment-specific Lambda memory configurations', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*validation_memory\s*=\s*512/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*validation_memory\s*=\s*1024/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*validation_memory\s*=\s*2048/s);
    });

    test('defines environment-specific API throttling', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*api_throttle_rate\s*=\s*100/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*api_throttle_rate\s*=\s*500/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*api_throttle_rate\s*=\s*2000/s);
    });

    test('defines environment-specific S3 retention policies', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*s3_retention_days\s*=\s*30/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*s3_retention_days\s*=\s*90/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*s3_retention_days\s*=\s*365/s);
    });

    test('defines environment-specific CloudWatch logs retention', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*logs_retention_days\s*=\s*30/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*logs_retention_days\s*=\s*90/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*logs_retention_days\s*=\s*365/s);
    });

    test('defines environment-specific regions', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*region\s*=\s*"eu-west-1"/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*region\s*=\s*"us-west-2"/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*region\s*=\s*"us-east-1"/s);
    });

    test('uses current_config to reference environment settings', () => {
      expect(stackContent).toMatch(/current_config\s*=\s*local\.environment_config\[var\.environment_suffix\]/);
    });

    test('defines common_tags for resource tagging', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*Environment[\s\S]*Repository[\s\S]*Team/s);
    });
  });

  describe('KMS Key Configuration', () => {
    test('declares KMS key resource', () => {
      expect(hasResource(stackContent, 'aws_kms_key', 'payment_key')).toBe(true);
    });

    test('KMS key has proper configuration', () => {
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'payment_key', 'deletion_window_in_days')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'payment_key', 'enable_key_rotation')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'payment_key', 'policy')).toBe(true);
    });

    test('KMS key policy includes CloudWatch Logs permissions', () => {
      expect(stackContent).toMatch(/"Allow CloudWatch Logs"/);
      expect(stackContent).toMatch(/logs\..*\.amazonaws\.com/);
    });

    test('declares KMS alias resource', () => {
      expect(hasResource(stackContent, 'aws_kms_alias', 'payment_key')).toBe(true);
    });

    test('KMS resources have proper tagging', () => {
      expect(hasTagging(stackContent, 'aws_kms_key', 'payment_key')).toBe(true);
    });
  });

  describe('VPC and Networking', () => {
    test('declares VPC resource', () => {
      expect(hasResource(stackContent, 'aws_vpc', 'payment_vpc')).toBe(true);
    });

    test('VPC has DNS support enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'payment_vpc', 'enable_dns_hostnames')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'payment_vpc', 'enable_dns_support')).toBe(true);
    });

    test('declares private subnets', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'private_subnet_a')).toBe(true);
      expect(hasResource(stackContent, 'aws_subnet', 'private_subnet_b')).toBe(true);
    });

    test('private subnets use availability zones dynamically', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
    });

    test('declares VPC endpoint for DynamoDB', () => {
      expect(hasResource(stackContent, 'aws_vpc_endpoint', 'dynamodb')).toBe(true);
    });

    test('VPC endpoint uses dynamic region reference', () => {
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.dynamodb"/);
    });

    test('networking resources have proper tagging', () => {
      expect(hasTagging(stackContent, 'aws_vpc', 'payment_vpc')).toBe(true);
      expect(hasTagging(stackContent, 'aws_subnet', 'private_subnet_a')).toBe(true);
    });
  });

  describe('DynamoDB Tables', () => {
    test('declares transactions table', () => {
      expect(hasResource(stackContent, 'aws_dynamodb_table', 'transactions')).toBe(true);
    });

    test('declares audit_logs table', () => {
      expect(hasResource(stackContent, 'aws_dynamodb_table', 'audit_logs')).toBe(true);
    });

    test('tables use PROVISIONED billing mode', () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PROVISIONED"/);
    });

    test('transactions table has proper schema', () => {
      expect(hasResourceAttribute(stackContent, 'aws_dynamodb_table', 'transactions', 'hash_key')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_dynamodb_table', 'transactions', 'range_key')).toBe(true);
      expect(stackContent).toMatch(/hash_key\s*=\s*"transaction_id"/);
      expect(stackContent).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test('tables have DynamoDB streams enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_dynamodb_table', 'transactions', 'stream_enabled')).toBe(true);
      expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
    });

    test('tables have Global Secondary Indexes', () => {
      expect(stackContent).toMatch(/global_secondary_index\s*{[\s\S]*name\s*=\s*"CustomerIndex"/s);
      expect(stackContent).toMatch(/global_secondary_index\s*{[\s\S]*name\s*=\s*"ActionTypeIndex"/s);
    });

    test('tables have server-side encryption enabled', () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/s);
      expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*enabled\s*=\s*true/s);
    });

    test('tables have point-in-time recovery enabled', () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/s);
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*enabled\s*=\s*true/s);
    });

    test('DynamoDB resources have proper tagging', () => {
      expect(hasTagging(stackContent, 'aws_dynamodb_table', 'transactions')).toBe(true);
      expect(hasTagging(stackContent, 'aws_dynamodb_table', 'audit_logs')).toBe(true);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('declares S3 bucket', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket', 'payment_logs')).toBe(true);
    });

    test('S3 bucket name uses dynamic account ID', () => {
      expect(stackContent).toMatch(/bucket\s*=\s*"\${local\.name_prefix}-payment-logs-\${data\.aws_caller_identity\.current\.account_id}"/);
    });

    test('declares S3 bucket versioning', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_versioning', 'payment_logs')).toBe(true);
    });

    test('declares S3 bucket encryption', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_server_side_encryption_configuration', 'payment_logs')).toBe(true);
    });

    test('S3 bucket encryption uses KMS key', () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.payment_key\.arn/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('declares S3 lifecycle configuration', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_lifecycle_configuration', 'payment_logs')).toBe(true);
    });

    test('S3 lifecycle uses environment-specific retention', () => {
      expect(stackContent).toMatch(/days\s*=\s*local\.current_config\.s3_retention_days/);
    });

    test('declares S3 public access block', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_public_access_block', 'payment_logs')).toBe(true);
    });

    test('S3 public access block restricts all public access', () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('S3 resources have proper tagging', () => {
      expect(hasTagging(stackContent, 'aws_s3_bucket', 'payment_logs')).toBe(true);
    });
  });

  describe('IAM Configuration', () => {
    test('declares Lambda execution role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'lambda_execution_role')).toBe(true);
    });

    test('Lambda execution role has proper assume role policy', () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode\({[\s\S]*lambda\.amazonaws\.com/s);
    });

    test('declares Lambda execution policy', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'lambda_execution_policy')).toBe(true);
    });

    test('IAM policy includes necessary permissions', () => {
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/dynamodb:GetItem/);
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/ec2:CreateNetworkInterface/);
    });

    test('IAM resources reference other resources dynamically', () => {
      expect(stackContent).toMatch(/aws_dynamodb_table\.transactions\.arn/);
      expect(stackContent).toMatch(/aws_s3_bucket\.payment_logs\.arn/);
      expect(stackContent).toMatch(/aws_kms_key\.payment_key\.arn/);
    });

    test('IAM resources have proper tagging', () => {
      expect(hasTagging(stackContent, 'aws_iam_role', 'lambda_execution_role')).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = ['payment_validation', 'payment_processing', 'payment_notification'];

    test.each(lambdaFunctions)('declares Lambda function %s', (functionName) => {
      expect(hasResource(stackContent, 'aws_lambda_function', functionName)).toBe(true);
    });

    test('Lambda functions use environment-specific memory allocation', () => {
      expect(stackContent).toMatch(/memory_size\s*=\s*local\.current_config\.validation_memory/);
      expect(stackContent).toMatch(/memory_size\s*=\s*local\.current_config\.processing_memory/);
      expect(stackContent).toMatch(/memory_size\s*=\s*local\.current_config\.notification_memory/);
    });

    test('Lambda functions have VPC configuration', () => {
      expect(stackContent).toMatch(/vpc_config\s*{[\s\S]*?subnet_ids/s);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*\[aws_subnet\.private_subnet_a\.id,\s*aws_subnet\.private_subnet_b\.id\]/);
    });

    test('Lambda functions have environment variables', () => {
      expect(hasResourceAttribute(stackContent, 'aws_lambda_function', 'payment_validation', 'environment')).toBe(true);
      expect(stackContent).toMatch(/ENVIRONMENT\s*=\s*var\.environment_suffix/);
      expect(stackContent).toMatch(/TRANSACTIONS_TABLE\s*=\s*aws_dynamodb_table\.transactions\.name/);
    });

    test('Lambda functions use IAM execution role', () => {
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_execution_role\.arn/);
    });

    test.each(lambdaFunctions)('Lambda function %s has proper tagging', (functionName) => {
      expect(hasTagging(stackContent, 'aws_lambda_function', functionName)).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('declares Lambda security group', () => {
      expect(hasResource(stackContent, 'aws_security_group', 'lambda_sg')).toBe(true);
    });

    test('declares API Gateway security group', () => {
      expect(hasResource(stackContent, 'aws_security_group', 'api_gateway_sg')).toBe(true);
    });

    test('Lambda security group has proper egress rules', () => {
      expect(stackContent).toMatch(/egress\s*{[\s\S]*from_port\s*=\s*443[\s\S]*to_port\s*=\s*443/s);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('API Gateway security group has proper ingress rules', () => {
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*443[\s\S]*to_port\s*=\s*443/s);
    });

    test('security groups have proper tagging', () => {
      expect(hasTagging(stackContent, 'aws_security_group', 'lambda_sg')).toBe(true);
      expect(hasTagging(stackContent, 'aws_security_group', 'api_gateway_sg')).toBe(true);
    });
  });

  describe('API Gateway Configuration', () => {
    test('declares REST API', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_rest_api', 'payment_api')).toBe(true);
    });

    test('declares request validator', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_request_validator', 'payment_validator')).toBe(true);
    });

    test('declares required API resources', () => {
      const requiredResources = ['process', 'validate', 'status'];
      requiredResources.forEach(resource => {
        expect(hasResource(stackContent, 'aws_api_gateway_resource', resource)).toBe(true);
      });
    });

    test('declares required API methods', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_method', 'process_post')).toBe(true);
      expect(hasResource(stackContent, 'aws_api_gateway_method', 'validate_post')).toBe(true);
      expect(hasResource(stackContent, 'aws_api_gateway_method', 'status_get')).toBe(true);
    });

    test('declares API integrations', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_integration', 'process_integration')).toBe(true);
      expect(hasResource(stackContent, 'aws_api_gateway_integration', 'validate_integration')).toBe(true);
      expect(hasResource(stackContent, 'aws_api_gateway_integration', 'status_integration')).toBe(true);
    });

    test('declares API deployment', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_deployment', 'payment_deployment')).toBe(true);
    });

    test('declares API stage', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_stage', 'payment_stage')).toBe(true);
    });

    test('API stage uses environment variable', () => {
      expect(stackContent).toMatch(/stage_name\s*=\s*var\.environment_suffix/);
    });

    test('declares method settings with throttling', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_method_settings', 'payment_settings')).toBe(true);
    });

    test('method settings use environment-specific throttling', () => {
      expect(stackContent).toMatch(/throttling_rate_limit\s*=\s*local\.current_config\.api_throttle_rate/);
      expect(stackContent).toMatch(/throttling_burst_limit\s*=\s*local\.current_config\.api_throttle_burst/);
    });

    test('declares Lambda permissions for API Gateway', () => {
      expect(hasResource(stackContent, 'aws_lambda_permission', 'api_gateway_process')).toBe(true);
      expect(hasResource(stackContent, 'aws_lambda_permission', 'api_gateway_validate')).toBe(true);
      expect(hasResource(stackContent, 'aws_lambda_permission', 'api_gateway_status')).toBe(true);
    });

    test('API Gateway resources have proper tagging', () => {
      expect(hasTagging(stackContent, 'aws_api_gateway_rest_api', 'payment_api')).toBe(true);
      expect(hasTagging(stackContent, 'aws_api_gateway_stage', 'payment_stage')).toBe(true);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('declares CloudWatch log groups', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'lambda_validation_logs')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'lambda_processing_logs')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'lambda_notification_logs')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'api_gateway_logs')).toBe(true);
    });

    test('CloudWatch log groups use environment-specific retention', () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*local\.current_config\.logs_retention_days/);
    });

    test('CloudWatch log groups use KMS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.payment_key\.arn/);
    });

    test('declares CloudWatch alarms', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'lambda_validation_errors')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'lambda_processing_errors')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'dynamodb_throttling')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'api_gateway_4xx')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'api_gateway_5xx')).toBe(true);
    });

    test('CloudWatch alarms use environment-specific thresholds', () => {
      expect(stackContent).toMatch(/threshold\s*=\s*var\.environment_suffix\s*==\s*"prod"/);
    });

    test('declares CloudWatch dashboard', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_dashboard', 'payment_dashboard')).toBe(true);
    });

    test('CloudWatch dashboard uses dynamic region reference', () => {
      expect(stackContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('CloudWatch resources have proper tagging', () => {
      expect(hasTagging(stackContent, 'aws_cloudwatch_log_group', 'lambda_validation_logs')).toBe(true);
      expect(hasTagging(stackContent, 'aws_cloudwatch_metric_alarm', 'lambda_validation_errors')).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    test('declares configuration manifest local file', () => {
      expect(hasResource(stackContent, 'local_file', 'configuration_manifest')).toBe(true);
    });

    test('configuration manifest includes environment and region', () => {
      expect(stackContent).toMatch(/environment\s*=\s*var\.environment_suffix/);
      expect(stackContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configuration manifest includes resource information', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.payment_vpc\.id/);
      expect(stackContent).toMatch(/transactions\s*=\s*aws_dynamodb_table\.transactions\.name/);
    });

    test('validation.tf contains configuration validation', () => {
      expect(hasResource(validationContent, 'null_resource', 'configuration_validation')).toBe(true);
    });

    test('validation.tf contains drift detection', () => {
      expect(hasResource(validationContent, 'null_resource', 'drift_detection')).toBe(true);
    });

    test('validation.tf contains compliance report', () => {
      expect(hasResource(validationContent, 'local_file', 'compliance_report')).toBe(true);
    });
  });

  describe('Output Configuration', () => {
    const requiredOutputs = [
      'vpc_id',
      'api_gateway_url',
      'api_gateway_endpoints',
      'dynamodb_tables',
      'lambda_functions',
      's3_bucket',
      'kms_key',
      'cloudwatch_dashboard_url',
      'environment_configuration',
      'configuration_manifest_file'
    ];

    test.each(requiredOutputs)('declares output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('API Gateway URL output uses dynamic references', () => {
      expect(outputsContent).toMatch(/aws_api_gateway_rest_api\.payment_api\.id/);
      expect(outputsContent).toMatch(/var\.aws_region/);
      expect(outputsContent).toMatch(/var\.environment_suffix/);
    });

    test('outputs include proper resource references', () => {
      expect(outputsContent).toMatch(/aws_vpc\.payment_vpc\.id/);
      expect(outputsContent).toMatch(/aws_dynamodb_table\.transactions\.name/);
      expect(outputsContent).toMatch(/aws_lambda_function\.payment_validation\.function_name/);
    });

    test('outputs include environment configuration', () => {
      expect(outputsContent).toMatch(/local\.current_config/);
    });
  });

  describe('Resource Naming and Consistency', () => {
    test('uses consistent naming prefix', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"payment-\${var\.environment_suffix}"/);
    });

    test('resource names use dynamic prefix', () => {
      expect(stackContent).toMatch(/\${local\.name_prefix}/);
    });

    test('no hardcoded resource names exist', () => {
      expect(stackContent).not.toMatch(/"payment-dev-/);
      expect(stackContent).not.toMatch(/"payment-staging-/);
      expect(stackContent).not.toMatch(/"payment-prod-/);
    });

    test('uses merge for consistent tagging', () => {
      expect(stackContent).toMatch(/merge\(local\.common_tags/);
    });

    test('all major resources are tagged', () => {
      const taggedResourceTypes = [
        'aws_kms_key',
        'aws_vpc',
        'aws_subnet',
        'aws_dynamodb_table',
        'aws_s3_bucket',
        'aws_iam_role',
        'aws_lambda_function',
        'aws_security_group',
        'aws_api_gateway_rest_api',
        'aws_cloudwatch_log_group',
        'aws_cloudwatch_metric_alarm'
      ];

      taggedResourceTypes.forEach(resourceType => {
        const resourceCount = countResourceOccurrences(stackContent, resourceType);
        if (resourceCount > 0) {
          expect(stackContent).toMatch(new RegExp(`resource\\s+"${resourceType}"[\\s\\S]*?tags\\s*=`, 's'));
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('ensures no hardcoded secrets or sensitive data', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"/i);
      expect(stackContent).not.toMatch(/key\s*=\s*"[A-Za-z0-9+/=]{20,}"/);
    });

    test('ensures encryption is enabled for data at rest', () => {
      expect(stackContent).toMatch(/server_side_encryption/);
      expect(stackContent).toMatch(/kms_key_id/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('ensures least privilege IAM policies', () => {
      expect(stackContent).toMatch(/Resource\s*=\s*\[[\s\S]*aws_dynamodb_table/s);
      expect(stackContent).toMatch(/Resource\s*=\s*"\${aws_s3_bucket[\s\S]*}/);
    });

    test('ensures VPC isolation for compute resources', () => {
      expect(stackContent).toMatch(/vpc_config\s*{[\s\S]*subnet_ids/s);
    });

    test('ensures S3 bucket public access is blocked', () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });
});
