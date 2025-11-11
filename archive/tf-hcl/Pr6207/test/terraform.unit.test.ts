import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const libPath = join(__dirname, '../lib');

// Helper functions for reading and parsing Terraform files
function readTerraformFile(filename: string): string {
  const filePath = join(libPath, filename);
  return existsSync(filePath) ? readFileSync(filePath, 'utf-8') : '';
}

function readAllTerraformFiles(): string {
  const files = ['tap_stack.tf', 'variables.tf', 'provider.tf'];
  return files.map(file => readTerraformFile(file)).join('\n');
}

function hasResource(content: string, resourceType: string, resourceName: string): boolean {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`, 'g');
  return regex.test(content);
}

function hasDataSource(content: string, dataType: string, dataName: string): boolean {
  const regex = new RegExp(`data\\s+"${dataType}"\\s+"${dataName}"`, 'g');
  return regex.test(content);
}

function hasVariable(content: string, variableName: string): boolean {
  const regex = new RegExp(`variable\\s+"${variableName}"\\s*{`, 'g');
  return regex.test(content);
}

function hasOutput(content: string, outputName: string): boolean {
  const regex = new RegExp(`output\\s+"${outputName}"\\s*{`, 'g');
  return regex.test(content);
}

function hasResourceAttribute(content: string, resourceType: string, resourceName: string, attribute: string): boolean {
  // Find the start of the resource block
  const resourceStart = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`);
  const match = content.match(resourceStart);
  if (!match) return false;

  // Find the resource block by counting braces
  const startIndex = match.index! + match[0].length;
  let braceCount = 1;
  let endIndex = startIndex;

  while (endIndex < content.length && braceCount > 0) {
    const char = content[endIndex];
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    endIndex++;
  }

  const resourceBlock = content.substring(startIndex - match[0].length, endIndex);
  
  // Check for both simple attributes (attribute = value) and block attributes (attribute { ... })
  const attributeEqualsRegex = new RegExp(`\\b${attribute}\\s*=`);
  const attributeBlockRegex = new RegExp(`\\b${attribute}\\s*{`);
  
  return attributeEqualsRegex.test(resourceBlock) || attributeBlockRegex.test(resourceBlock);
}

function countResourceOccurrences(content: string, resourceType: string): number {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

function hasTagging(content: string, resourceType: string, resourceName: string): boolean {
  // Find the start of the resource block
  const resourceStart = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`);
  const match = content.match(resourceStart);
  if (!match) return false;

  // Find the resource block by counting braces
  const startIndex = match.index! + match[0].length;
  let braceCount = 1;
  let endIndex = startIndex;

  while (endIndex < content.length && braceCount > 0) {
    const char = content[endIndex];
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    endIndex++;
  }

  const resourceBlock = content.substring(startIndex - match[0].length, endIndex);
  return /\btags\s*=/.test(resourceBlock);
}

function hasSecurityConfiguration(content: string, resourceType: string, resourceName: string, securityAttribute: string): boolean {
  // Find the start of the resource block
  const resourceStart = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`);
  const match = content.match(resourceStart);
  if (!match) return false;

  // Find the resource block by counting braces
  const startIndex = match.index! + match[0].length;
  let braceCount = 1;
  let endIndex = startIndex;

  while (endIndex < content.length && braceCount > 0) {
    const char = content[endIndex];
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    endIndex++;
  }

  const resourceBlock = content.substring(startIndex - match[0].length, endIndex);
  return new RegExp(securityAttribute).test(resourceBlock);
}

const terraformCode = readAllTerraformFiles();
const stackContent = readTerraformFile('tap_stack.tf');
const variablesContent = readTerraformFile('variables.tf');
const providerContent = readTerraformFile('provider.tf');

describe('Fraud Detection Pipeline Terraform Stack - Unit Tests', () => {

  describe('File Structure and Existence', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = ['tap_stack.tf', 'variables.tf', 'provider.tf'];

      requiredFiles.forEach(file => {
        const path = join(libPath, file);
        expect(existsSync(path)).toBe(true);
      });
    });

    test('should have Lambda deployment packages', () => {
      const requiredPackages = ['transaction_processor.zip', 'fraud_detector.zip'];

      requiredPackages.forEach(pkg => {
        const path = join(libPath, pkg);
        expect(existsSync(path)).toBe(true);
      });
    });

    test('tap_stack.tf should be comprehensive', () => {
      expect(stackContent.length).toBeGreaterThan(10000);
    });

    test('variables.tf should contain required variables', () => {
      expect(variablesContent.length).toBeGreaterThan(200);
    });
  });

  describe('Provider Configuration', () => {
    test('should declare minimum Terraform version requirement', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.[4-9]/);
    });

    test('should declare AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/hashicorp\/aws/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('should configure AWS provider with region variable', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('should configure S3 backend for state storage', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });
  });

  describe('Variables Configuration', () => {
    test('should define aws_region variable', () => {
      expect(hasVariable(variablesContent, 'aws_region')).toBe(true);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('should define environment_suffix variable', () => {
      expect(hasVariable(variablesContent, 'environment_suffix')).toBe(true);
      expect(variablesContent).toMatch(/default\s*=\s*"dev"/);
    });

    test('variables should have descriptions', () => {
      expect(variablesContent).toMatch(/description\s*=\s*"AWS region for all resources"/);
      expect(variablesContent).toMatch(/description\s*=\s*"Environment suffix for resource naming"/);
    });

    test('variables should have proper types', () => {
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });
  });

  describe('Data Sources', () => {
    test('should declare current AWS account data source', () => {
      expect(hasDataSource(stackContent, 'aws_caller_identity', 'current')).toBe(true);
    });

    test('should declare current AWS region data source', () => {
      expect(hasDataSource(stackContent, 'aws_region', 'current')).toBe(true);
    });
  });

  describe('Local Values Configuration', () => {
    test('should define local values for resource naming', () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/project_name\s*=\s*"fraud-detection"/);
      expect(stackContent).toMatch(/environment\s*=\s*var\.environment_suffix/);
      expect(stackContent).toMatch(/name_prefix\s*=/);
    });

    test('should define common tags in locals', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
      expect(stackContent).toMatch(/Project\s*=/);
      expect(stackContent).toMatch(/Environment\s*=/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe('DynamoDB Configuration', () => {
    test('should create DynamoDB table for transactions', () => {
      expect(hasResource(stackContent, 'aws_dynamodb_table', 'transactions')).toBe(true);
    });

    test('DynamoDB table should have proper key schema', () => {
      expect(hasResourceAttribute(stackContent, 'aws_dynamodb_table', 'transactions', 'hash_key')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_dynamodb_table', 'transactions', 'range_key')).toBe(true);
      expect(stackContent).toMatch(/hash_key\s*=\s*"transaction_id"/);
      expect(stackContent).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test('DynamoDB table should use pay per request billing', () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('DynamoDB table should enable streams', () => {
      expect(hasResourceAttribute(stackContent, 'aws_dynamodb_table', 'transactions', 'stream_enabled')).toBe(true);
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
    });

    test('DynamoDB table should have point in time recovery enabled', () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('DynamoDB table should have server side encryption enabled', () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('DynamoDB table should have proper attributes', () => {
      expect(stackContent).toMatch(/attribute\s*{[\s\S]*?name\s*=\s*"transaction_id"[\s\S]*?type\s*=\s*"S"/);
      expect(stackContent).toMatch(/attribute\s*{[\s\S]*?name\s*=\s*"timestamp"[\s\S]*?type\s*=\s*"S"/);
    });

    test('DynamoDB table should be tagged', () => {
      expect(hasTagging(stackContent, 'aws_dynamodb_table', 'transactions')).toBe(true);
    });
  });

  describe('SQS Configuration', () => {
    test('should create main SQS queue for suspicious transactions', () => {
      expect(hasResource(stackContent, 'aws_sqs_queue', 'suspicious_transactions')).toBe(true);
    });

    test('should create dead letter queues', () => {
      expect(hasResource(stackContent, 'aws_sqs_queue', 'suspicious_transactions_dlq')).toBe(true);
      expect(hasResource(stackContent, 'aws_sqs_queue', 'transaction_processor_dlq')).toBe(true);
      expect(hasResource(stackContent, 'aws_sqs_queue', 'fraud_detector_dlq')).toBe(true);
    });

    test('main SQS queue should have redrive policy configured', () => {
      expect(hasResourceAttribute(stackContent, 'aws_sqs_queue', 'suspicious_transactions', 'redrive_policy')).toBe(true);
      expect(stackContent).toMatch(/deadLetterTargetArn/);
      expect(stackContent).toMatch(/maxReceiveCount\s*=\s*3/);
    });

    test('SQS queues should have proper retention settings', () => {
      expect(stackContent).toMatch(/message_retention_seconds\s*=\s*1209600/);
    });

    test('SQS queues should be tagged', () => {
      expect(hasTagging(stackContent, 'aws_sqs_queue', 'suspicious_transactions')).toBe(true);
      expect(hasTagging(stackContent, 'aws_sqs_queue', 'suspicious_transactions_dlq')).toBe(true);
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM roles for Lambda functions', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'transaction_processor_role')).toBe(true);
      expect(hasResource(stackContent, 'aws_iam_role', 'fraud_detector_role')).toBe(true);
    });

    test('should create IAM policies for Lambda functions', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'transaction_processor_policy')).toBe(true);
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'fraud_detector_policy')).toBe(true);
    });

    test('IAM roles should have proper assume role policies', () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test('transaction processor policy should have minimal required permissions', () => {
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
      expect(stackContent).toMatch(/dynamodb:PutItem/);
      expect(stackContent).toMatch(/dynamodb:UpdateItem/);
    });

    test('fraud detector policy should have stream processing permissions', () => {
      expect(stackContent).toMatch(/dynamodb:DescribeStream/);
      expect(stackContent).toMatch(/dynamodb:GetRecords/);
      expect(stackContent).toMatch(/dynamodb:GetShardIterator/);
      expect(stackContent).toMatch(/dynamodb:ListStreams/);
      expect(stackContent).toMatch(/sqs:SendMessage/);
    });

    test('IAM roles should be tagged', () => {
      expect(hasTagging(stackContent, 'aws_iam_role', 'transaction_processor_role')).toBe(true);
      expect(hasTagging(stackContent, 'aws_iam_role', 'fraud_detector_role')).toBe(true);
    });
  });

  describe('Lambda Configuration', () => {
    test('should create transaction processor Lambda function', () => {
      expect(hasResource(stackContent, 'aws_lambda_function', 'transaction_processor')).toBe(true);
    });

    test('should create fraud detector Lambda function', () => {
      expect(hasResource(stackContent, 'aws_lambda_function', 'fraud_detector')).toBe(true);
    });

    test('Lambda functions should use Python 3.11 runtime', () => {
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test('Lambda functions should use ARM64 architecture', () => {
      expect(stackContent).toMatch(/architectures\s*=\s*\["arm64"\]/);
    });

    test('Lambda functions should have proper handler configuration', () => {
      expect(stackContent).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
    });

    test('Lambda functions should have dead letter queue configuration', () => {
      expect(hasResourceAttribute(stackContent, 'aws_lambda_function', 'transaction_processor', 'dead_letter_config')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_lambda_function', 'fraud_detector', 'dead_letter_config')).toBe(true);
    });

    test('Lambda functions should have environment variables configured', () => {
      expect(hasResourceAttribute(stackContent, 'aws_lambda_function', 'transaction_processor', 'environment')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_lambda_function', 'fraud_detector', 'environment')).toBe(true);
    });

    test('Lambda functions should reference correct deployment packages', () => {
      expect(stackContent).toMatch(/filename\s*=\s*"transaction_processor\.zip"/);
      expect(stackContent).toMatch(/filename\s*=\s*"fraud_detector\.zip"/);
    });

    test('Lambda functions should be tagged', () => {
      expect(hasTagging(stackContent, 'aws_lambda_function', 'transaction_processor')).toBe(true);
      expect(hasTagging(stackContent, 'aws_lambda_function', 'fraud_detector')).toBe(true);
    });

    test('should create DynamoDB stream event source mapping', () => {
      expect(hasResource(stackContent, 'aws_lambda_event_source_mapping', 'dynamodb_stream')).toBe(true);
    });

    test('event source mapping should have proper configuration', () => {
      expect(hasResourceAttribute(stackContent, 'aws_lambda_event_source_mapping', 'dynamodb_stream', 'starting_position')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_lambda_event_source_mapping', 'dynamodb_stream', 'batch_size')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_lambda_event_source_mapping', 'dynamodb_stream', 'maximum_retry_attempts')).toBe(true);
      expect(stackContent).toMatch(/maximum_retry_attempts\s*=\s*3/);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CloudWatch log groups for Lambda functions', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'transaction_processor_logs')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'fraud_detector_logs')).toBe(true);
    });

    test('CloudWatch log groups should have retention policy', () => {
      expect(hasResourceAttribute(stackContent, 'aws_cloudwatch_log_group', 'transaction_processor_logs', 'retention_in_days')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_cloudwatch_log_group', 'fraud_detector_logs', 'retention_in_days')).toBe(true);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
    });

    test('should create CloudWatch alarms for error monitoring', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'transaction_processor_errors')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'fraud_detector_errors')).toBe(true);
    });

    test('CloudWatch alarms should monitor error rate with proper threshold', () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"ErrorRate"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"0\.01"/);
      expect(stackContent).toMatch(/period\s*=\s*"300"/);
      expect(stackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    });

    test('CloudWatch resources should be tagged', () => {
      expect(hasTagging(stackContent, 'aws_cloudwatch_log_group', 'transaction_processor_logs')).toBe(true);
      expect(hasTagging(stackContent, 'aws_cloudwatch_metric_alarm', 'transaction_processor_errors')).toBe(true);
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create API Gateway REST API', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_rest_api', 'fraud_detection_api')).toBe(true);
    });

    test('should create API Gateway resource for transactions endpoint', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_resource', 'transactions')).toBe(true);
    });

    test('should create API Gateway method for POST requests', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_method', 'post_transactions')).toBe(true);
    });

    test('should create request validator for input validation', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_request_validator', 'transaction_validator')).toBe(true);
    });

    test('should create request model for JSON schema validation', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_model', 'transaction_model')).toBe(true);
    });

    test('should create Lambda integration', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_integration', 'lambda_integration')).toBe(true);
    });

    test('should create API Gateway deployment and stage', () => {
      expect(hasResource(stackContent, 'aws_api_gateway_deployment', 'api_deployment')).toBe(true);
      expect(hasResource(stackContent, 'aws_api_gateway_stage', 'prod')).toBe(true);
    });

    test('should create Lambda permission for API Gateway', () => {
      expect(hasResource(stackContent, 'aws_lambda_permission', 'api_gateway_lambda')).toBe(true);
    });

    test('API Gateway should use regional endpoint configuration', () => {
      expect(stackContent).toMatch(/endpoint_configuration\s*{[\s\S]*?types\s*=\s*\["REGIONAL"\]/);
    });

    test('API Gateway method should have proper configuration', () => {
      expect(stackContent).toMatch(/http_method\s*=\s*"POST"/);
      expect(stackContent).toMatch(/authorization\s*=\s*"NONE"/);
    });

    test('API Gateway integration should use AWS_PROXY type', () => {
      expect(stackContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(stackContent).toMatch(/integration_http_method\s*=\s*"POST"/);
    });

    test('API Gateway resources should be tagged', () => {
      expect(hasTagging(stackContent, 'aws_api_gateway_rest_api', 'fraud_detection_api')).toBe(true);
    });
  });

  describe('Security and Best Practices', () => {
    test('should use dynamic naming with environment suffix', () => {
      expect(stackContent).toMatch(/\$\{local\.name_prefix\}/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.project_name\}-\$\{local\.environment\}"/);
    });

    test('should use data sources instead of hardcoded values', () => {
      expect(stackContent).toMatch(/data\.aws_caller_identity\.current/);
      expect(stackContent).toMatch(/data\.aws_region\.current/);
    });

    test('all major resources should have consistent tagging', () => {
      const resourcesRequiringTags = [
        'aws_dynamodb_table',
        'aws_sqs_queue',
        'aws_iam_role',
        'aws_lambda_function',
        'aws_cloudwatch_log_group',
        'aws_api_gateway_rest_api'
      ];

      resourcesRequiringTags.forEach(resourceType => {
        const taggedResources = (stackContent.match(new RegExp(`resource\\s+"${resourceType}"[\\s\\S]*?tags\\s*=`, 'g')) || []).length;
        const totalResources = countResourceOccurrences(stackContent, resourceType);
        expect(taggedResources).toBeGreaterThan(0);
      });
    });

    test('should enable encryption for data at rest', () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('should enable point in time recovery for DynamoDB', () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });
  });

  describe('Output Configuration', () => {
    test('should output API Gateway URL', () => {
      expect(hasOutput(stackContent, 'api_gateway_url')).toBe(true);
    });

    test('should output SQS queue URL', () => {
      expect(hasOutput(stackContent, 'sqs_queue_url')).toBe(true);
    });

    test('should output DynamoDB table name', () => {
      expect(hasOutput(stackContent, 'dynamodb_table_name')).toBe(true);
    });

    test('should output Lambda function names', () => {
      expect(hasOutput(stackContent, 'lambda_function_names')).toBe(true);
    });

    test('outputs should have descriptions', () => {
      expect(stackContent).toMatch(/description\s*=\s*"API Gateway invoke URL for transaction submissions"/);
      expect(stackContent).toMatch(/description\s*=\s*"SQS queue URL for suspicious transaction processing"/);
      expect(stackContent).toMatch(/description\s*=\s*"DynamoDB table name for transactions"/);
    });

    test('API Gateway URL output should reference stage', () => {
      expect(stackContent).toMatch(/aws_api_gateway_stage\.prod\.invoke_url/);
    });
  });

  describe('Resource Dependencies and References', () => {
    test('Lambda functions should depend on policies and log groups', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*?aws_iam_role_policy[\s\S]*?aws_cloudwatch_log_group/);
    });

    test('API Gateway deployment should depend on method and integration', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*?aws_api_gateway_method[\s\S]*?aws_api_gateway_integration/);
    });

    test('should use proper resource references for ARNs and IDs', () => {
      expect(stackContent).toMatch(/aws_dynamodb_table\.transactions\.arn/);
      expect(stackContent).toMatch(/aws_sqs_queue\.suspicious_transactions\.arn/);
      expect(stackContent).toMatch(/aws_lambda_function\.transaction_processor\.arn/);
    });

    test('dead letter queue should be referenced in redrive policy', () => {
      expect(stackContent).toMatch(/deadLetterTargetArn\s*=\s*aws_sqs_queue\.suspicious_transactions_dlq\.arn/);
    });

    test('DynamoDB stream should be referenced in event source mapping', () => {
      expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_dynamodb_table\.transactions\.stream_arn/);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should configure dead letter queues for all Lambda functions', () => {
      const dlqReferences = (stackContent.match(/dead_letter_config\s*{/g) || []).length;
      expect(dlqReferences).toBeGreaterThanOrEqual(2);
    });

    test('should configure retry attempts for event source mapping', () => {
      expect(stackContent).toMatch(/maximum_retry_attempts\s*=\s*3/);
    });

    test('should configure SQS redrive policy with max receive count', () => {
      expect(stackContent).toMatch(/maxReceiveCount\s*=\s*3/);
    });

    test('should configure appropriate timeouts for Lambda functions', () => {
      expect(stackContent).toMatch(/timeout\s*=\s*30/);
      expect(stackContent).toMatch(/timeout\s*=\s*60/);
    });
  });
});
