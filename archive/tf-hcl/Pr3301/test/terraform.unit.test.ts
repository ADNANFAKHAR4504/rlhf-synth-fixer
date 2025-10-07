// Unit tests for Terraform Order Processing Infrastructure
// Tests validate Terraform configuration syntax, resource definitions, and infrastructure patterns

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');
const VARIABLES_TF = path.join(LIB_DIR, 'variables.tf');
const OUTPUTS_TF = path.join(LIB_DIR, 'outputs.tf');
const PROVIDER_TF = path.join(LIB_DIR, 'provider.tf');
const LAMBDA_PY = path.join(LIB_DIR, 'lambda_function.py');

describe('Terraform Order Processing Stack Unit Tests', () => {

  describe('Infrastructure Files Validation', () => {
    test('should have all required Terraform files', () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
      expect(fs.existsSync(VARIABLES_TF)).toBe(true);
      expect(fs.existsSync(OUTPUTS_TF)).toBe(true);
      expect(fs.existsSync(PROVIDER_TF)).toBe(true);
    });

    test('should have Lambda function source code', () => {
      expect(fs.existsSync(LAMBDA_PY)).toBe(true);
    });

    test('should have valid Terraform syntax in main.tf', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');

      // Basic syntax validation
      expect(content).toMatch(/resource\s+"aws_/);
      expect(content).toMatch(/locals\s*{/);
      expect(content).not.toMatch(/\${.*\${/); // No nested interpolations
    });
  });

  describe('Resource Configuration Validation', () => {
    let mainContent: string;
    let variablesContent: string;
    let outputsContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf8');
      variablesContent = fs.readFileSync(VARIABLES_TF, 'utf8');
      outputsContent = fs.readFileSync(OUTPUTS_TF, 'utf8');
    });

    test('should define DynamoDB table with correct configuration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"order_status"/);
      expect(mainContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(mainContent).toMatch(/hash_key\s*=\s*"order_id"/);
      expect(mainContent).toMatch(/point_in_time_recovery\s*{[\s\S]*enabled\s*=\s*true/);
    });

    test('should define SQS queues with proper configuration', () => {
      // Main queue
      expect(mainContent).toMatch(/resource\s+"aws_sqs_queue"\s+"order_queue"/);
      expect(mainContent).toMatch(/visibility_timeout_seconds\s*=\s*var\.sqs_visibility_timeout/);

      // Dead letter queue
      expect(mainContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
      expect(mainContent).toMatch(/message_retention_seconds\s*=\s*var\.dlq_message_retention_days/);

      // Redrive policy
      expect(mainContent).toMatch(/redrive_policy\s*=\s*jsonencode/);
      expect(mainContent).toMatch(/deadLetterTargetArn/);
      expect(mainContent).toMatch(/maxReceiveCount/);
    });

    test('should define Lambda function with proper configuration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"order_processor"/);
      expect(mainContent).toMatch(/runtime\s*=\s*"python3\.10"/);
      expect(mainContent).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
      expect(mainContent).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
      expect(mainContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
    });

    test('should define IAM role and policies for Lambda', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(mainContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_policy"/);
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
      expect(mainContent).toMatch(/"lambda\.amazonaws\.com"/);
    });

    test('should configure CloudWatch resources', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_alarm"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"order_processing"/);
    });

    test('should configure Lambda event source mapping', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"sqs_lambda_trigger"/);
      expect(mainContent).toMatch(/event_source_arn\s*=\s*aws_sqs_queue\.order_queue\.arn/);
      expect(mainContent).toMatch(/function_name\s*=\s*aws_lambda_function\.order_processor\.arn/);
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(VARIABLES_TF, 'utf8');
    });

    test('should define all required variables', () => {
      const requiredVars = [
        'aws_region',
        'environment',
        'environment_suffix',
        'service_name',
        'lambda_memory_size',
        'lambda_timeout',
        'sqs_visibility_timeout',
        'sqs_message_retention_days',
        'dlq_message_retention_days',
        'max_receive_count',
        'lambda_reserved_concurrent_executions',
        'sqs_batch_size',
        'log_retention_days',
        'dlq_alarm_threshold'
      ];

      requiredVars.forEach(varName => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test('should have appropriate default values', () => {
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/); // aws_region
      expect(variablesContent).toMatch(/default\s*=\s*"Production"/); // environment
      expect(variablesContent).toMatch(/default\s*=\s*512/); // lambda_memory_size
      expect(variablesContent).toMatch(/default\s*=\s*55/); // lambda_timeout
      expect(variablesContent).toMatch(/default\s*=\s*60/); // sqs_visibility_timeout
    });

    test('should include descriptions for all variables', () => {
      const varBlocks = variablesContent.match(/variable\s+"[^"]+"\s*{[^}]*}/g) || [];

      varBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=\s*"/);
      });
    });

    test('should specify types for all variables', () => {
      const varBlocks = variablesContent.match(/variable\s+"[^"]+"\s*{[^}]*}/g) || [];

      varBlocks.forEach(block => {
        expect(block).toMatch(/type\s*=\s*(string|number|bool)/);
      });
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(OUTPUTS_TF, 'utf8');
    });

    test('should define all essential outputs', () => {
      const requiredOutputs = [
        'order_queue_url',
        'order_queue_arn',
        'dlq_url',
        'dlq_arn',
        'lambda_function_arn',
        'lambda_function_name',
        'dynamodb_table_name',
        'dynamodb_table_arn',
        'cloudwatch_log_group',
        'dashboard_url'
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${outputName}"\\s*{`));
      });
    });

    test('should include descriptions for all outputs', () => {
      const outputBlocks = outputsContent.match(/output\s+"[^"]+"\s*{[^}]*}/g) || [];

      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=\s*"/);
      });
    });

    test('should reference correct resource attributes', () => {
      expect(outputsContent).toMatch(/aws_sqs_queue\.order_queue\.url/);
      expect(outputsContent).toMatch(/aws_sqs_queue\.dlq\.arn/);
      expect(outputsContent).toMatch(/aws_lambda_function\.order_processor\.arn/);
      expect(outputsContent).toMatch(/aws_dynamodb_table\.order_status\.name/);
    });
  });

  describe('Security and Best Practices', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf8');
    });

    test('should apply consistent tagging strategy', () => {
      expect(mainContent).toMatch(/locals\s*{[\s\S]*common_tags\s*=/);
      expect(mainContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(mainContent).toMatch(/Service\s*=\s*var\.service_name/);
      expect(mainContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test('should use proper resource naming with suffixes', () => {
      expect(mainContent).toMatch(/locals\s*{[\s\S]*suffix\s*=/);
      expect(mainContent).toMatch(/environment_suffix.*!=.*""/);
      expect(mainContent).toMatch(/name.*=.*".*\$\{local\.suffix\}"/);
    });

    test('should configure least privilege IAM policies', () => {
      // Check for specific permissions rather than wildcards
      expect(mainContent).toMatch(/"sqs:ReceiveMessage"/);
      expect(mainContent).toMatch(/"sqs:DeleteMessage"/);
      expect(mainContent).toMatch(/"dynamodb:PutItem"/);
      expect(mainContent).toMatch(/"dynamodb:UpdateItem"/);
      expect(mainContent).toMatch(/"logs:CreateLogGroup"/);

      // Should not have overly broad permissions
      expect(mainContent).not.toMatch(/"sqs:\*"/);
      expect(mainContent).not.toMatch(/"dynamodb:\*"/);
    });

    test('should enable point-in-time recovery for DynamoDB', () => {
      expect(mainContent).toMatch(/point_in_time_recovery\s*{[\s\S]*enabled\s*=\s*true/);
    });

    test('should configure proper log retention', () => {
      expect(mainContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });
  });

  describe('Resource Dependencies and References', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf8');
    });

    test('should have proper resource dependencies', () => {
      expect(mainContent).toMatch(/depends_on\s*=\s*\[/);
      expect(mainContent).toMatch(/aws_iam_role_policy_attachment/);
      expect(mainContent).toMatch(/aws_cloudwatch_log_group/);
    });

    test('should reference resources correctly in policies', () => {
      expect(mainContent).toMatch(/Resource.*aws_sqs_queue\.order_queue\.arn/);
      expect(mainContent).toMatch(/Resource.*aws_dynamodb_table\.order_status\.arn/);
    });

    test('should use data sources appropriately', () => {
      expect(mainContent).toMatch(/data\s+"archive_file"\s+"lambda_package"/);
      expect(mainContent).toMatch(/source_file\s*=\s*"\$\{path\.module\}\/lambda_function\.py"/);
    });
  });

  describe('Lambda Function Validation', () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(LAMBDA_PY, 'utf8');
    });

    test('should have proper Lambda handler function', () => {
      expect(lambdaContent).toMatch(/def\s+lambda_handler\s*\(/);
      expect(lambdaContent).toMatch(/event.*context/);
    });

    test('should use AWS SDK properly', () => {
      expect(lambdaContent).toMatch(/import\s+boto3/);
      expect(lambdaContent).toMatch(/dynamodb\s*=\s*boto3\.resource/);
    });

    test('should have proper error handling', () => {
      expect(lambdaContent).toMatch(/try:/);
      expect(lambdaContent).toMatch(/except/);
      expect(lambdaContent).toMatch(/ClientError/);
    });

    test('should use environment variables', () => {
      expect(lambdaContent).toMatch(/os\.environ/);
      expect(lambdaContent).toMatch(/DYNAMODB_TABLE_NAME/);
      expect(lambdaContent).toMatch(/DLQ_URL/);
    });

    test('should have logging configured', () => {
      expect(lambdaContent).toMatch(/import\s+logging/);
      expect(lambdaContent).toMatch(/logger\s*=\s*logging\.getLogger/);
      expect(lambdaContent).toMatch(/logger\.(info|error|debug|warning)/);
    });

    test('should handle SQS records properly', () => {
      expect(lambdaContent).toMatch(/Records/);
      expect(lambdaContent).toMatch(/messageId/);
      expect(lambdaContent).toMatch(/receiptHandle/);
    });
  });

  describe('Monitoring and Observability', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf8');
    });

    test('should configure CloudWatch alarms', () => {
      expect(mainContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(mainContent).toMatch(/metric_name\s*=\s*"ApproximateNumberOfMessagesVisible"/);
      expect(mainContent).toMatch(/namespace\s*=\s*"AWS\/SQS"/);
    });

    test('should create comprehensive dashboard', () => {
      expect(mainContent).toMatch(/dashboard_body\s*=\s*jsonencode/);
      expect(mainContent).toMatch(/widgets/);
      expect(mainContent).toMatch(/AWS\/SQS/);
      expect(mainContent).toMatch(/AWS\/Lambda/);
    });

    test('should configure CloudWatch Insights', () => {
      expect(mainContent).toMatch(/aws_cloudwatch_query_definition/);
      expect(mainContent).toMatch(/query_string/);
    });
  });

  describe('Infrastructure Validation Rules', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf8');
    });

    test('should not hardcode sensitive values', () => {
      // Should not contain hardcoded account IDs, regions in ARNs, etc.
      expect(mainContent).not.toMatch(/arn:aws:.*:123456789012:/);
      expect(mainContent).not.toMatch(/us-east-1.*us-west-2/); // Mixed regions
    });

    test('should use variables for configurable values', () => {
      expect(mainContent).toMatch(/var\.(lambda_memory_size|lambda_timeout|sqs_visibility_timeout)/);
      expect(mainContent).not.toMatch(/memory_size\s*=\s*512/); // Should use variable
    });

    test('should have proper JSON encoding for complex values', () => {
      expect(mainContent).toMatch(/jsonencode\s*\(/);
      expect(mainContent).not.toMatch(/"\{.*\}"/); // Avoid string interpolation for JSON
    });
  });

  describe('Performance and Scalability Configuration', () => {
    let mainContent: string;
    let variablesContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf8');
      variablesContent = fs.readFileSync(VARIABLES_TF, 'utf8');
    });

    test('should configure appropriate Lambda concurrency limits', () => {
      expect(mainContent).toMatch(/reserved_concurrent_executions\s*=\s*var\.lambda_reserved_concurrent_executions/);
    });

    test('should configure SQS batch processing', () => {
      expect(mainContent).toMatch(/batch_size\s*=\s*var\.sqs_batch_size/);
    });

    test('should have reasonable default values for performance', () => {
      expect(variablesContent).toMatch(/default\s*=\s*10/); // concurrent executions
      expect(variablesContent).toMatch(/default\s*=\s*5/); // batch size
    });
  });

  describe('Cost Optimization', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf8');
    });

    test('should use PAY_PER_REQUEST for DynamoDB', () => {
      expect(mainContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('should configure appropriate log retention', () => {
      expect(mainContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test('should not over-provision Lambda memory', () => {
      // Should use variable, not hardcoded high value
      expect(mainContent).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
      expect(mainContent).not.toMatch(/memory_size\s*=\s*3008/); // Max memory
    });
  });
});
