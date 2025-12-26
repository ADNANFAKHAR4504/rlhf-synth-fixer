import * as fs from 'fs';
import * as path from 'path';

const libPath = path.join(__dirname, '..', 'lib');

// Helper to read file content
function readTerraformFile(filename: string): string {
  return fs.readFileSync(path.join(libPath, filename), 'utf-8');
}

// Helper to count occurrences of a pattern
function countOccurrences(content: string, pattern: string | RegExp): number {
  if (typeof pattern === 'string') {
    return (content.match(new RegExp(pattern, 'g')) || []).length;
  }
  return (content.match(pattern) || []).length;
}

describe('Terraform Configuration Unit Tests', () => {
  describe('Provider Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('provider.tf');
    });

    test('should configure AWS provider version ~> 5.0', () => {
      expect(content).toContain('aws');
      expect(content).toContain('~> 5.0');
    });

    test('should configure Archive provider version ~> 2.4', () => {
      expect(content).toContain('archive');
      expect(content).toContain('~> 2.4');
    });

    test('should configure S3 backend', () => {
      expect(content).toMatch(/backend\s+"s3"/);
    });

    test('should configure AWS provider with region variable', () => {
      expect(content).toContain('region = var.aws_region');
    });

    test('should configure default tags with local.tags', () => {
      expect(content).toContain('default_tags');
      expect(content).toContain('tags = local.tags');
    });
  });

  describe('Variables Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('variables.tf');
    });

    test('should define environment_suffix variable', () => {
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toContain('type        = string');
    });

    test('should define aws_region variable with us-east-1 default', () => {
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toContain('default     = "us-east-1"');
    });

    test('should define lambda_runtime variable with python3.9 default', () => {
      expect(content).toMatch(/variable\s+"lambda_runtime"/);
      expect(content).toContain('default     = "python3.9"');
    });

    test('should define lambda_memory_size variable with 1024 default', () => {
      expect(content).toMatch(/variable\s+"lambda_memory_size"/);
      expect(content).toContain('default     = 1024');
    });

    test('should define log_retention_days variable with 30 default', () => {
      expect(content).toMatch(/variable\s+"log_retention_days"/);
      expect(content).toContain('default     = 30');
    });

    test('should define environment variable with production default', () => {
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toContain('default     = "production"');
    });

    test('should define project_name variable with reconciliation default', () => {
      expect(content).toMatch(/variable\s+"project_name"/);
      expect(content).toContain('default     = "reconciliation"');
    });

    test('should define locals with merged tags', () => {
      expect(content).toMatch(/locals\s+\{/);
      expect(content).toContain('tags = merge');
      expect(content).toContain('Environment = var.environment');
      expect(content).toContain('Project     = var.project_name');
    });
  });

  describe('S3 Bucket Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('s3.tf');
    });

    test('should create S3 bucket with environment suffix', () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"reconciliation_data"/);
      expect(content).toContain('bucket = "reconciliation-data-${var.environment_suffix}"');
    });

    test('should enable versioning on S3 bucket', () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toContain('status = "Enabled"');
    });

    test('should configure lifecycle policy with Glacier transition after 90 days', () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(content).toContain('days          = 90');
      expect(content).toContain('storage_class = "GLACIER"');
    });

    test('should configure S3 notification for CSV files', () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_notification"/);
      expect(content).toContain('filter_suffix       = ".csv"');
      expect(content).toContain('events              = ["s3:ObjectCreated:*"]');
    });

    test('should include Name tag with environment suffix', () => {
      expect(content).toContain('Name = "reconciliation-data-${var.environment_suffix}"');
    });

    test('should add filter to lifecycle rule', () => {
      expect(content).toMatch(/filter\s+\{/);
    });
  });

  describe('DynamoDB Tables Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('dynamodb.tf');
    });

    test('should create 2 DynamoDB tables', () => {
      const count = countOccurrences(content, /resource\s+"aws_dynamodb_table"/g);
      expect(count).toBe(2);
    });

    test('should create transaction_records table with on-demand billing', () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"transaction_records"/);
      expect(content).toContain('billing_mode = "PAY_PER_REQUEST"');
      expect(content).toContain('hash_key     = "transaction_id"');
    });

    test('should create reconciliation_results table with composite key', () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"reconciliation_results"/);
      expect(content).toContain('hash_key     = "reconciliation_id"');
      expect(content).toContain('range_key    = "timestamp"');
    });

    test('should enable point-in-time recovery on both tables', () => {
      const pitrCount = countOccurrences(content, /point_in_time_recovery\s+\{/g);
      expect(pitrCount).toBe(2);
      const enabledCount = countOccurrences(content, /enabled = true/g);
      expect(enabledCount).toBe(2);
    });

    test('should include environment suffix in table names', () => {
      expect(content).toContain('name         = "transaction-records-${var.environment_suffix}"');
      expect(content).toContain('name         = "reconciliation-results-${var.environment_suffix}"');
    });
  });

  describe('Lambda Functions Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('lambda.tf');
    });

    test('should create 4 Lambda functions', () => {
      const count = countOccurrences(content, /resource\s+"aws_lambda_function"/g);
      expect(count).toBe(4);
    });

    test('should define data sources for 4 Lambda ZIP files', () => {
      const count = countOccurrences(content, /data\s+"archive_file"/g);
      expect(count).toBe(4);
    });

    test('should create trigger_reconciliation function', () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"trigger_reconciliation"/);
      expect(content).toContain('function_name    = "trigger-reconciliation-${var.environment_suffix}"');
    });

    test('should create file_parser function', () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"file_parser"/);
      expect(content).toContain('function_name    = "file-parser-${var.environment_suffix}"');
    });

    test('should create transaction_validator function', () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"transaction_validator"/);
      expect(content).toContain('function_name    = "transaction-validator-${var.environment_suffix}"');
    });

    test('should create report_generator function', () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"report_generator"/);
      expect(content).toContain('function_name    = "report-generator-${var.environment_suffix}"');
    });

    test('should configure Lambda functions with runtime variable', () => {
      const count = countOccurrences(content, /runtime\s+=\s+var\.lambda_runtime/g);
      expect(count).toBe(4);
    });

    test('should configure Lambda functions with memory_size variable', () => {
      const count = countOccurrences(content, /memory_size\s+=\s+var\.lambda_memory_size/g);
      expect(count).toBe(4);
    });

    test('should configure Lambda functions with 300s timeout', () => {
      const count = countOccurrences(content, /timeout\s+=\s+300/g);
      expect(count).toBe(4);
    });

    test('should create 4 CloudWatch Log Groups', () => {
      const count = countOccurrences(content, /resource\s+"aws_cloudwatch_log_group"/g);
      expect(count).toBe(4);
    });

    test('should configure log retention with variable', () => {
      const count = countOccurrences(content, /retention_in_days\s+=\s+var\.log_retention_days/g);
      expect(count).toBe(4);
    });

    test('should grant S3 permission to invoke trigger Lambda', () => {
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_s3_invoke"/);
      expect(content).toContain('principal     = "s3.amazonaws.com"');
    });

    test('should reference Lambda source files from lib/lambda directory', () => {
      expect(content).toContain('${path.module}/lambda/trigger_reconciliation.py');
      expect(content).toContain('${path.module}/lambda/file_parser.py');
      expect(content).toContain('${path.module}/lambda/transaction_validator.py');
      expect(content).toContain('${path.module}/lambda/report_generator.py');
    });
  });

  describe('Step Functions State Machine Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('step_functions.tf');
    });

    test('should create Step Functions state machine', () => {
      expect(content).toMatch(/resource\s+"aws_sfn_state_machine"\s+"reconciliation_workflow"/);
    });

    test('should include environment suffix in state machine name', () => {
      expect(content).toContain('name     = "reconciliation-workflow-${var.environment_suffix}"');
    });

    test('should define state machine with jsonencode definition', () => {
      expect(content).toContain('definition = jsonencode');
    });

    test('should implement exponential backoff retry logic with max 3 attempts', () => {
      expect(content).toContain('MaxAttempts     = 3');
      expect(content).toContain('BackoffRate     = 2.0');
    });

    test('should configure error handling with Catch blocks', () => {
      const catchCount = countOccurrences(content, /Catch\s*=/g);
      expect(catchCount).toBeGreaterThanOrEqual(3);
    });

    test('should integrate with all three Lambda functions', () => {
      expect(content).toContain('aws_lambda_function.file_parser.arn');
      expect(content).toContain('aws_lambda_function.transaction_validator.arn');
      expect(content).toContain('aws_lambda_function.report_generator.arn');
    });

    test('should integrate with SNS for notifications', () => {
      expect(content).toContain('aws_sns_topic.reconciliation_notifications.arn');
    });
  });

  describe('SNS Topic Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('sns.tf');
    });

    test('should create SNS topic for notifications', () => {
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"reconciliation_notifications"/);
    });

    test('should include environment suffix in topic name', () => {
      expect(content).toContain('name = "reconciliation-notifications-${var.environment_suffix}"');
    });

    test('should create email subscription', () => {
      expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"/);
      expect(content).toContain('protocol  = "email"');
      expect(content).toContain('endpoint  = "finance-team@example.com"');
    });
  });

  describe('IAM Roles and Policies Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('iam.tf');
    });

    test('should create 3 IAM roles', () => {
      const count = countOccurrences(content, /resource\s+"aws_iam_role"/g);
      expect(count).toBe(3);
    });

    test('should create trigger_lambda_role', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"trigger_lambda_role"/);
      expect(content).toContain('name = "trigger-lambda-role-${var.environment_suffix}"');
    });

    test('should create processing_lambda_role', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"processing_lambda_role"/);
      expect(content).toContain('name = "processing-lambda-role-${var.environment_suffix}"');
    });

    test('should create step_functions_role', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"step_functions_role"/);
      expect(content).toContain('name = "step-functions-role-${var.environment_suffix}"');
    });

    test('should create 3 IAM role policies', () => {
      const count = countOccurrences(content, /resource\s+"aws_iam_role_policy"/g);
      expect(count).toBe(3);
    });

    test('should configure Lambda assume role policy', () => {
      const count = countOccurrences(content, /"lambda\.amazonaws\.com"/g);
      expect(count).toBe(2); // trigger_lambda_role and processing_lambda_role
    });

    test('should configure Step Functions assume role policy', () => {
      expect(content).toContain('"states.amazonaws.com"');
    });

    test('should grant specific permissions to trigger Lambda', () => {
      expect(content).toContain('"states:StartExecution"');
      expect(content).toContain('"s3:GetObject"');
    });

    test('should grant DynamoDB permissions to processing Lambdas', () => {
      expect(content).toContain('"dynamodb:PutItem"');
      expect(content).toContain('"dynamodb:GetItem"');
      expect(content).toContain('"dynamodb:UpdateItem"');
    });

    test('should grant SNS publish permissions', () => {
      const count = countOccurrences(content, /"sns:Publish"/g);
      expect(count).toBe(2); // processing_lambda_policy and step_functions_policy
    });

    test('should use specific resource ARNs (no wildcards)', () => {
      expect(content).toContain('aws_sfn_state_machine.reconciliation_workflow.arn');
      expect(content).toContain('aws_s3_bucket.reconciliation_data.arn');
      expect(content).toContain('aws_dynamodb_table.transaction_records.arn');
      expect(content).toContain('aws_dynamodb_table.reconciliation_results.arn');
      expect(content).toContain('aws_sns_topic.reconciliation_notifications.arn');
    });
  });

  describe('CloudWatch Dashboard Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('cloudwatch.tf');
    });

    test('should create CloudWatch dashboard', () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"reconciliation_dashboard"/);
    });

    test('should include environment suffix in dashboard name', () => {
      expect(content).toContain('dashboard_name = "reconciliation-dashboard-${var.environment_suffix}"');
    });

    test('should define dashboard body with widgets', () => {
      expect(content).toContain('dashboard_body = jsonencode');
      expect(content).toContain('widgets');
    });

    test('should include Step Functions metrics', () => {
      expect(content).toContain('AWS/States');
      expect(content).toContain('ExecutionTime');
      expect(content).toContain('ExecutionsFailed');
      expect(content).toContain('ExecutionsSucceeded');
    });

    test('should include Lambda metrics', () => {
      expect(content).toContain('AWS/Lambda');
      expect(content).toContain('Duration');
      expect(content).toContain('Errors');
    });

    test('should include DynamoDB metrics', () => {
      expect(content).toContain('AWS/DynamoDB');
      expect(content).toContain('ConsumedReadCapacityUnits');
      expect(content).toContain('ConsumedWriteCapacityUnits');
    });
  });

  describe('Outputs Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('outputs.tf');
    });

    test('should define S3 bucket outputs', () => {
      expect(content).toMatch(/output\s+"s3_bucket_name"/);
      expect(content).toMatch(/output\s+"s3_bucket_arn"/);
    });

    test('should define Step Functions outputs', () => {
      expect(content).toMatch(/output\s+"state_machine_arn"/);
      expect(content).toMatch(/output\s+"state_machine_name"/);
    });

    test('should define DynamoDB table outputs', () => {
      expect(content).toMatch(/output\s+"transaction_table_name"/);
      expect(content).toMatch(/output\s+"results_table_name"/);
    });

    test('should define SNS topic output', () => {
      expect(content).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('should define Lambda function outputs', () => {
      expect(content).toMatch(/output\s+"file_parser_function_name"/);
      expect(content).toMatch(/output\s+"transaction_validator_function_name"/);
      expect(content).toMatch(/output\s+"report_generator_function_name"/);
    });

    test('should define CloudWatch dashboard output', () => {
      expect(content).toMatch(/output\s+"dashboard_name"/);
    });
  });

  describe('Resource Naming Convention', () => {
    const files = ['s3.tf', 'dynamodb.tf', 'lambda.tf', 'step_functions.tf', 'sns.tf', 'iam.tf', 'cloudwatch.tf'];

    test.each(files)('should include environment_suffix in resource names in %s', (file) => {
      const content = readTerraformFile(file);
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe('Resource Tagging', () => {
    const files = ['s3.tf', 'dynamodb.tf', 'lambda.tf', 'step_functions.tf', 'sns.tf', 'iam.tf'];

    test.each(files)('should have tags defined in %s', (file) => {
      const content = readTerraformFile(file);
      expect(content).toMatch(/tags\s*=\s*\{/);
    });
  });

  describe('Infrastructure Requirements Compliance', () => {
    test('should not use Retain policies', () => {
      const files = ['s3.tf', 'dynamodb.tf'];
      files.forEach((file) => {
        const content = readTerraformFile(file).toLowerCase();
        expect(content).not.toContain('prevent_destroy');
        expect(content).not.toContain('deletion_protection');
      });
    });

    test('should use on-demand billing for DynamoDB', () => {
      const content = readTerraformFile('dynamodb.tf');
      const count = countOccurrences(content, /billing_mode\s+=\s+"PAY_PER_REQUEST"/g);
      expect(count).toBe(2);
    });

    test('should enable PITR on DynamoDB tables', () => {
      const content = readTerraformFile('dynamodb.tf');
      const pitrCount = countOccurrences(content, /point_in_time_recovery/g);
      expect(pitrCount).toBe(2);
      const enabledCount = countOccurrences(content, /enabled\s+=\s+true/g);
      expect(enabledCount).toBe(2);
    });

    test('should configure 30-day log retention', () => {
      const content = readTerraformFile('lambda.tf');
      const count = countOccurrences(content, /retention_in_days\s+=\s+var\.log_retention_days/g);
      expect(count).toBe(4);
    });
  });

  describe('Lambda Function Files Exist', () => {
    test('should have trigger_reconciliation.py file', () => {
      const filePath = path.join(libPath, 'lambda', 'trigger_reconciliation.py');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have file_parser.py file', () => {
      const filePath = path.join(libPath, 'lambda', 'file_parser.py');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have transaction_validator.py file', () => {
      const filePath = path.join(libPath, 'lambda', 'transaction_validator.py');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have report_generator.py file', () => {
      const filePath = path.join(libPath, 'lambda', 'report_generator.py');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('AWS Region Configuration', () => {
    test('should have AWS_REGION file', () => {
      const filePath = path.join(libPath, 'AWS_REGION');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should specify us-east-1 region', () => {
      const filePath = path.join(libPath, 'AWS_REGION');
      const region = fs.readFileSync(filePath, 'utf-8').trim();
      expect(region).toBe('us-east-1');
    });
  });
});
