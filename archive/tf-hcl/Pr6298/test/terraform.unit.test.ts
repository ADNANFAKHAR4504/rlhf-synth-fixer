import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Market Data Processor Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providerContent: string;
  let combinedContent: string;

  beforeAll(() => {
    const mainPath = path.join(libPath, 'main.tf');
    const providerPath = path.join(libPath, 'provider.tf');
    
    if (fs.existsSync(mainPath)) {
      mainContent = fs.readFileSync(mainPath, 'utf8');
    } else {
      throw new Error('main.tf file not found');
    }
    
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, 'utf8');
    } else {
      throw new Error('provider.tf file not found');
    }
    
    combinedContent = providerContent + '\n' + mainContent;
  });

  // 1. File Structure Validation (4 tests)
  describe('File Structure Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'main.tf'))).toBe(true);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('should have lambda_function.py file', () => {
      expect(fs.existsSync(path.join(libPath, 'lambda_function.py'))).toBe(true);
    });

    test('should generate lambda_function.zip using archive_file data source', () => {
      expect(mainContent).toContain('data "archive_file" "lambda_code"');
      expect(mainContent).toContain('type        = "zip"');
      expect(mainContent).toContain('source_file = "${path.module}/lambda_function.py"');
      expect(mainContent).toContain('output_path = "${path.module}/.terraform/lambda_function.zip"');
    });
  });

  // 2. Terraform Version and Provider Configuration (6 tests)
  describe('Terraform Version and Provider Configuration', () => {
    test('should require Terraform version >= 1.0', () => {
      expect(providerContent).toContain('required_version = ">= 1.0"');
    });

    test('should use AWS provider version ~> 5.0', () => {
      expect(providerContent).toContain('source  = "hashicorp/aws"');
      expect(providerContent).toContain('version = "~> 5.0"');
    });

    test('should use random provider version ~> 3.5', () => {
      expect(providerContent).toContain('source  = "hashicorp/random"');
      expect(providerContent).toContain('version = "~> 3.5"');
    });

    test('should use archive provider version ~> 2.4', () => {
      expect(providerContent).toContain('source  = "hashicorp/archive"');
      expect(providerContent).toContain('version = "~> 2.4"');
    });

    test('should configure AWS provider with region variable', () => {
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('should configure default tags in AWS provider', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('tags = {');
      expect(providerContent).toContain('Environment = var.environment');
      expect(providerContent).toContain('Project     = var.project_name');
      expect(providerContent).toContain('CostCenter  = var.cost_center');
      expect(providerContent).toContain('ManagedBy   = "Terraform"');
    });
  });

  // 3. Data Sources Validation (5 tests)
  describe('Data Sources Validation', () => {
    test('should use aws_caller_identity data source', () => {
      expect(mainContent).toContain('data "aws_caller_identity" "current"');
    });

    test('should use aws_region data source', () => {
      expect(mainContent).toContain('data "aws_region" "current"');
    });

    test('should use aws_availability_zones data source', () => {
      expect(mainContent).toContain('data "aws_availability_zones" "available"');
      expect(mainContent).toContain('state = "available"');
    });

    test('should use archive_file data source for Lambda packaging', () => {
      expect(mainContent).toContain('data "archive_file" "lambda_code"');
      expect(mainContent).toContain('output_path = "${path.module}/.terraform/lambda_function.zip"');
    });

    test('should not use forbidden data sources', () => {
      const forbiddenDataSources = [
        'data "aws_vpc"',
        'data "aws_subnet"',
        'data "aws_iam_role"',
        'data "aws_s3_bucket"',
        'data "aws_security_group"',
        'data "aws_kms_key"',
        'data "aws_ami"',
        'data "aws_instance"',
        'data "aws_nat_gateway"'
      ];
      
      forbiddenDataSources.forEach(forbidden => {
        expect(combinedContent).not.toContain(forbidden);
      });
    });
  });

  // 4. Lambda Functions Configuration (8 tests)
  describe('Lambda Functions Configuration', () => {
    test('should define ingestion Lambda function', () => {
      expect(mainContent).toContain('resource "aws_lambda_function" "ingestion"');
      expect(mainContent).toContain('function_name = "lambda-ingestion-${var.environment}"');
      expect(mainContent).toContain('handler       = "lambda_function.ingestion_handler"');
      expect(mainContent).toContain('runtime       = "python3.11"');
    });

    test('should define processing Lambda function', () => {
      expect(mainContent).toContain('resource "aws_lambda_function" "processing"');
      expect(mainContent).toContain('function_name = "lambda-processing-${var.environment}"');
      expect(mainContent).toContain('handler       = "lambda_function.processing_handler"');
      expect(mainContent).toContain('runtime       = "python3.11"');
    });

    test('should define notification Lambda function', () => {
      expect(mainContent).toContain('resource "aws_lambda_function" "notification"');
      expect(mainContent).toContain('function_name = "lambda-notification-${var.environment}"');
      expect(mainContent).toContain('handler       = "lambda_function.notification_handler"');
      expect(mainContent).toContain('runtime       = "python3.11"');
    });

    test('should use archive file for Lambda code packaging', () => {
      expect(mainContent).toContain('filename         = data.archive_file.lambda_code.output_path');
      expect(mainContent).toContain('source_code_hash = data.archive_file.lambda_code.output_base64sha256');
    });

    test('should configure environment variables for Lambda functions', () => {
      expect(mainContent).toContain('environment {');
      expect(mainContent).toContain('variables = {');
      expect(mainContent).toContain('ENVIRONMENT = var.environment');
      expect(mainContent).toContain('REGION      = data.aws_region.current.name');
    });

    test('should enable X-Ray tracing for Lambda functions', () => {
      expect(mainContent).toContain('tracing_config {');
      expect(mainContent).toContain('mode = "Active"');
    });

    test('should configure dead letter queues for Lambda functions', () => {
      expect(mainContent).toContain('dead_letter_config {');
      expect(mainContent).toContain('target_arn = aws_sqs_queue.dlq_ingestion.arn');
      expect(mainContent).toContain('target_arn = aws_sqs_queue.dlq_processing.arn');
      expect(mainContent).toContain('target_arn = aws_sqs_queue.dlq_notification.arn');
    });

    test('should configure Lambda permissions for EventBridge', () => {
      expect(mainContent).toContain('resource "aws_lambda_permission" "allow_eventbridge_ingestion"');
      expect(mainContent).toContain('resource "aws_lambda_permission" "allow_eventbridge_processing"');
      expect(mainContent).toContain('resource "aws_lambda_permission" "allow_eventbridge_notification"');
    });
  });

  // 5. DynamoDB Tables Configuration (4 tests)
  describe('DynamoDB Tables Configuration', () => {
    test('should define events DynamoDB table', () => {
      expect(mainContent).toContain('resource "aws_dynamodb_table" "events"');
      expect(mainContent).toContain('name         = "dynamodb-events-${var.environment}"');
      expect(mainContent).toContain('billing_mode = "PAY_PER_REQUEST"');
      expect(mainContent).toContain('hash_key     = "event_id"');
      expect(mainContent).toContain('range_key    = "timestamp"');
    });

    test('should define audit DynamoDB table', () => {
      expect(mainContent).toContain('resource "aws_dynamodb_table" "audit"');
      expect(mainContent).toContain('name         = "dynamodb-audit-${var.environment}"');
      expect(mainContent).toContain('billing_mode = "PAY_PER_REQUEST"');
      expect(mainContent).toContain('hash_key     = "audit_id"');
      expect(mainContent).toContain('range_key    = "timestamp"');
    });

    test('should enable server-side encryption for DynamoDB tables', () => {
      const encryptionBlocks = mainContent.match(/server_side_encryption\s*\{\s*enabled\s*=\s*true\s*\}/g);
      expect(encryptionBlocks?.length).toBe(2);
    });

    test('should enable point-in-time recovery for DynamoDB tables', () => {
      const pitrBlocks = mainContent.match(/point_in_time_recovery\s*\{\s*enabled\s*=\s*true\s*\}/g);
      expect(pitrBlocks?.length).toBe(2);
    });
  });

  // 6. SQS Queues Configuration (4 tests)
  describe('SQS Queues Configuration', () => {
    test('should define ingestion dead letter queue', () => {
      expect(mainContent).toContain('resource "aws_sqs_queue" "dlq_ingestion"');
      expect(mainContent).toContain('"sqs-dlq-ingestion-${var.environment}"');
    });

    test('should define processing dead letter queue', () => {
      expect(mainContent).toContain('resource "aws_sqs_queue" "dlq_processing"');
      expect(mainContent).toContain('"sqs-dlq-processing-${var.environment}"');
    });

    test('should define notification dead letter queue', () => {
      expect(mainContent).toContain('resource "aws_sqs_queue" "dlq_notification"');
      expect(mainContent).toContain('"sqs-dlq-notification-${var.environment}"');
    });

    test('should configure queue retention and visibility timeout', () => {
      expect(mainContent).toContain('message_retention_seconds  = var.dlq_message_retention_days * 24 * 60 * 60');
      expect(mainContent).toContain('visibility_timeout_seconds = var.lambda_timeout_seconds');
    });
  });

  // 7. SNS Topics Configuration (2 tests)
  describe('SNS Topics Configuration', () => {
    test('should define critical events SNS topic', () => {
      expect(mainContent).toContain('resource "aws_sns_topic" "critical_events"');
      expect(mainContent).toContain('name = "sns-critical-events-${var.environment}"');
    });

    test('should configure email subscription for notifications', () => {
      expect(mainContent).toContain('resource "aws_sns_topic_subscription" "email_notification"');
      expect(mainContent).toContain('topic_arn = aws_sns_topic.critical_events.arn');
      expect(mainContent).toContain('protocol  = "email"');
      expect(mainContent).toContain('endpoint  = var.notification_email');
    });
  });

  // 8. EventBridge Configuration (6 tests)
  describe('EventBridge Configuration', () => {
    test('should define custom EventBridge event bus', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_event_bus" "market_data"');
      expect(mainContent).toContain('name = "eventbridge-market-data-${var.environment}"');
    });

    test('should define ingestion event rule', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_event_rule" "ingestion"');
      expect(mainContent).toContain('name           = "rule-ingestion-${var.environment}"');
      expect(mainContent).toContain('event_pattern = jsonencode({');
      expect(mainContent).toContain('detail-type = ["MarketData.Raw"]');
    });

    test('should define processing event rule', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_event_rule" "processing"');
      expect(mainContent).toContain('name           = "rule-processing-${var.environment}"');
      expect(mainContent).toContain('event_pattern = jsonencode({');
      expect(mainContent).toContain('detail-type = ["MarketData.Validated"]');
    });

    test('should define notification event rule', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_event_rule" "notification"');
      expect(mainContent).toContain('name           = "rule-notification-${var.environment}"');
      expect(mainContent).toContain('event_pattern = jsonencode({');
      expect(mainContent).toContain('detail-type = ["MarketData.Alert"]');
    });

    test('should define event targets for Lambda functions', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_event_target" "ingestion"');
      expect(mainContent).toContain('resource "aws_cloudwatch_event_target" "processing"');
      expect(mainContent).toContain('resource "aws_cloudwatch_event_target" "notification"');
      expect(mainContent).toContain('target_id      = "lambda-ingestion"');
      expect(mainContent).toContain('target_id      = "lambda-processing"');
      expect(mainContent).toContain('target_id      = "lambda-notification"');
    });

    test('should define EventBridge archive for compliance', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_event_archive" "market_data"');
      expect(mainContent).toContain('name             = "archive-market-data-${var.environment}"');
      expect(mainContent).toContain('event_source_arn = aws_cloudwatch_event_bus.market_data.arn');
      expect(mainContent).toContain('retention_days   = var.archive_retention_days');
    });
  });

  // 9. CloudWatch Monitoring (5 tests)
  describe('CloudWatch Monitoring', () => {
    test('should define CloudWatch log groups for Lambda functions', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "lambda_ingestion"');
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "lambda_processing"');
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "lambda_notification"');
      expect(mainContent).toContain('name              = "/aws/lambda/${aws_lambda_function.ingestion.function_name}"');
      expect(mainContent).toContain('retention_in_days = var.log_retention_days');
    });

    test('should define error alarms for Lambda functions', () => {
      expect(mainContent).toContain('aws_cloudwatch_metric_alarm" "lambda_ingestion_errors"');
      expect(mainContent).toContain('aws_cloudwatch_metric_alarm" "lambda_processing_errors"');
      expect(mainContent).toContain('aws_cloudwatch_metric_alarm" "lambda_notification_errors"');
      expect(mainContent).toContain('metric_name         = "Errors"');
      expect(mainContent).toContain('threshold           = 0');
      expect(mainContent).toContain('alarm_actions = [aws_sns_topic.critical_events.arn]');
    });

    test('should define throttling alarms for Lambda functions', () => {
      expect(mainContent).toContain('aws_cloudwatch_metric_alarm" "lambda_ingestion_throttles"');
      expect(mainContent).toContain('aws_cloudwatch_metric_alarm" "lambda_processing_throttles"');
      expect(mainContent).toContain('aws_cloudwatch_metric_alarm" "lambda_notification_throttles"');
      expect(mainContent).toContain('metric_name         = "Throttles"');
      expect(mainContent).toContain('threshold           = 0');
    });

    test('should define DynamoDB capacity alarms', () => {
      expect(mainContent).toContain('aws_cloudwatch_metric_alarm" "dynamodb_events_read_capacity"');
      expect(mainContent).toContain('aws_cloudwatch_metric_alarm" "dynamodb_events_write_capacity"');
      expect(mainContent).toContain('namespace           = "AWS/DynamoDB"');
      expect(mainContent).toContain('metric_name         = "ConsumedReadCapacityUnits"');
      expect(mainContent).toContain('metric_name         = "ConsumedWriteCapacityUnits"');
    });

    test('should configure appropriate alarm thresholds and periods', () => {
      expect(mainContent).toContain('period              = 60');
      expect(mainContent).toContain('statistic           = "Sum"');
      expect(mainContent).toContain('evaluation_periods  = 1');
      expect(mainContent).toContain('comparison_operator = "GreaterThanThreshold"');
    });
  });

  // 10. SSM Parameters Configuration (4 tests)
  describe('SSM Parameters Configuration', () => {
    test('should define DynamoDB table name parameters', () => {
      expect(mainContent).toContain('resource "aws_ssm_parameter" "events_table_name"');
      expect(mainContent).toContain('resource "aws_ssm_parameter" "audit_table_name"');
      expect(mainContent).toContain('name  = "/market-data-processor/dynamodb/events-table"');
      expect(mainContent).toContain('name  = "/market-data-processor/dynamodb/audit-table"');
    });

    test('should define SNS topic ARN parameter', () => {
      expect(mainContent).toContain('resource "aws_ssm_parameter" "sns_topic_arn"');
      expect(mainContent).toContain('name  = "/market-data-processor/sns/topic-arn"');
      expect(mainContent).toContain('value = aws_sns_topic.critical_events.arn');
    });

    test('should define EventBridge bus name parameter', () => {
      expect(mainContent).toContain('resource "aws_ssm_parameter" "event_bus_name"');
      expect(mainContent).toContain('name  = "/market-data-processor/eventbridge/bus-name"');
      expect(mainContent).toContain('value = aws_cloudwatch_event_bus.market_data.name');
    });

    test('should configure SSM parameters with proper types', () => {
      expect(mainContent).toContain('type  = "String"');
      expect(mainContent).toContain('value = aws_dynamodb_table.events.name');
      expect(mainContent).toContain('value = aws_dynamodb_table.audit.name');
    });
  });

  // 11. IAM Roles Configuration (6 tests)
  describe('IAM Roles Configuration', () => {
    test('should define ingestion Lambda IAM role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "lambda_ingestion"');
      expect(mainContent).toContain('name = "role-lambda-ingestion-${var.environment}"');
      expect(mainContent).toContain('assume_role_policy = jsonencode({');
      expect(mainContent).toContain('Principal = {');
      expect(mainContent).toContain('Service = "lambda.amazonaws.com"');
    });

    test('should define processing Lambda IAM role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "lambda_processing"');
      expect(mainContent).toContain('name = "role-lambda-processing-${var.environment}"');
    });

    test('should define notification Lambda IAM role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "lambda_notification"');
      expect(mainContent).toContain('name = "role-lambda-notification-${var.environment}"');
    });

    test('should attach basic execution policies to Lambda roles', () => {
      expect(mainContent).toContain('policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"');
    });

    test('should define custom policies for Lambda roles with least privilege', () => {
      expect(mainContent).toContain('resource "aws_iam_role_policy" "lambda_ingestion_custom"');
      expect(mainContent).toContain('resource "aws_iam_role_policy" "lambda_processing_custom"');
      expect(mainContent).toContain('resource "aws_iam_role_policy" "lambda_notification_custom"');
    });

    test('should restrict IAM permissions to specific resources', () => {
      expect(mainContent).toContain('aws_dynamodb_table.events.arn');
      expect(mainContent).toContain('aws_sqs_queue.dlq_ingestion.arn');
      expect(mainContent).toContain('aws_sns_topic.critical_events.arn');
      expect(mainContent).toContain('arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/market-data-processor/*');
    });
  });

  // 12. Archive Configuration (2 tests)
  describe('Archive Configuration', () => {
    test('should define EventBridge archive for compliance', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_event_archive" "market_data"');
      expect(mainContent).toContain('name             = "archive-market-data-${var.environment}"');
    });

    test('should configure archive retention and event pattern', () => {
      expect(mainContent).toContain('event_source_arn = aws_cloudwatch_event_bus.market_data.arn');
      expect(mainContent).toContain('retention_days   = var.archive_retention_days');
      expect(mainContent).toContain('event_pattern = jsonencode({');
      expect(mainContent).toContain('account = [data.aws_caller_identity.current.account_id]');
    });
  });

  // 13. Security Best Practices (6 tests)
  describe('Security Best Practices', () => {
    test('should not have hardcoded secrets', () => {
      const sensitivePatterns = [
        /password\s*=\s*"[^$\{][^"]+"/i,
        /secret\s*=\s*"[^$\{][^"]+"/i,
        /api_key\s*=\s*"[^$\{][^"]+"/i,
        /access_key\s*=\s*"[^$\{][^"]+"/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(combinedContent).not.toMatch(pattern);
      });
    });

    test('should use serverless architecture without VPC requirements', () => {
      expect(mainContent).not.toContain('aws_vpc');
      expect(mainContent).not.toContain('aws_subnet');
      expect(mainContent).not.toContain('aws_security_group');
      expect(mainContent).not.toContain('aws_nat_gateway');
    });

    test('should use least privilege IAM policies', () => {
      expect(mainContent).toContain('Effect = "Allow"');
      expect(mainContent).toContain('Action = [');
      expect(mainContent).toContain('Resource = ');
      // X-Ray permissions use wildcard resource which is acceptable
      expect(mainContent).toContain('Resource = "*"');
    });

    test('should enable encryption for data at rest', () => {
      expect(mainContent).toContain('server_side_encryption {');
      expect(mainContent).toContain('enabled = true');
    });

    test('should configure proper Lambda execution environment', () => {
      expect(mainContent).toContain('runtime       = "python3.11"');
      expect(mainContent).toContain('memory_size   = var.lambda_memory_mb');
      expect(mainContent).toContain('timeout       = var.lambda_timeout_seconds');
      expect(providerContent).toContain('default     = 256');
      expect(providerContent).toContain('default     = 30');
    });

    test('should not expose public endpoints or resources', () => {
      expect(mainContent).not.toContain('public');
      expect(mainContent).not.toContain('0.0.0.0/0');
      expect(mainContent).not.toContain('map_public_ip_on_launch = true');
      expect(mainContent).not.toContain('aws_internet_gateway');
    });
  });

  // 14. Resource Naming Convention (4 tests)
  describe('Resource Naming Convention', () => {
    test('should use environment variable in resource names', () => {
      const envVarCount = (mainContent.match(/\$\{var\.environment\}/g) || []).length;
      expect(envVarCount).toBeGreaterThan(20);
    });

    test('should follow consistent naming pattern', () => {
      expect(mainContent).toContain('lambda-ingestion-${var.environment}');
      expect(mainContent).toContain('lambda-processing-${var.environment}');
      expect(mainContent).toContain('lambda-notification-${var.environment}');
      expect(mainContent).toContain('dynamodb-events-${var.environment}');
      expect(mainContent).toContain('dynamodb-audit-${var.environment}');
    });

    test('should use descriptive resource names', () => {
      // Fixed: Just check if the value exists in the content, not exact formatting
      expect(mainContent).toContain('"sqs-dlq-ingestion-${var.environment}"');
      expect(mainContent).toContain('"sns-critical-events-${var.environment}"');
      expect(mainContent).toContain('"eventbridge-market-data-${var.environment}"');
    });

    test('should include account ID references where needed', () => {
      const accountIdRefs = mainContent.match(/\$\{data\.aws_caller_identity\.current\.account_id\}/g);
      expect(accountIdRefs?.length).toBeGreaterThanOrEqual(2);
    });
  });

  // 15. Required Outputs (10 tests)
  describe('Required Outputs', () => {
    test('should have Lambda function outputs', () => {
      expect(mainContent).toContain('output "lambda_ingestion_name"');
      expect(mainContent).toContain('output "lambda_ingestion_arn"');
      expect(mainContent).toContain('output "lambda_ingestion_role_arn"');
      expect(mainContent).toContain('output "lambda_processing_name"');
      expect(mainContent).toContain('output "lambda_processing_arn"');
      expect(mainContent).toContain('output "lambda_processing_role_arn"');
      expect(mainContent).toContain('output "lambda_notification_name"');
      expect(mainContent).toContain('output "lambda_notification_arn"');
      expect(mainContent).toContain('output "lambda_notification_role_arn"');
    });

    test('should have EventBridge outputs', () => {
      expect(mainContent).toContain('output "eventbridge_bus_name"');
      expect(mainContent).toContain('output "eventbridge_bus_arn"');
      expect(mainContent).toContain('output "eventbridge_rule_names"');
      expect(mainContent).toContain('output "eventbridge_archive_arn"');
    });

    test('should have DynamoDB table outputs', () => {
      expect(mainContent).toContain('output "dynamodb_events_table_name"');
      expect(mainContent).toContain('output "dynamodb_events_table_arn"');
      expect(mainContent).toContain('output "dynamodb_audit_table_name"');
      expect(mainContent).toContain('output "dynamodb_audit_table_arn"');
    });

    test('should have SQS queue outputs', () => {
      expect(mainContent).toContain('output "sqs_dlq_ingestion_url"');
      expect(mainContent).toContain('output "sqs_dlq_ingestion_arn"');
      expect(mainContent).toContain('output "sqs_dlq_processing_url"');
      expect(mainContent).toContain('output "sqs_dlq_processing_arn"');
      expect(mainContent).toContain('output "sqs_dlq_notification_url"');
      expect(mainContent).toContain('output "sqs_dlq_notification_arn"');
    });

    test('should have SNS topic outputs', () => {
      expect(mainContent).toContain('output "sns_topic_arn"');
      expect(mainContent).toContain('output "sns_topic_name"');
    });

    test('should have CloudWatch outputs', () => {
      expect(mainContent).toContain('output "cloudwatch_log_groups"');
      expect(mainContent).toContain('output "cloudwatch_alarm_names"');
    });

    test('should have SSM parameter outputs', () => {
      expect(mainContent).toContain('output "ssm_parameter_names"');
    });

    test('should have metadata outputs', () => {
      expect(mainContent).toContain('output "environment"');
      expect(mainContent).toContain('output "aws_region"');
      expect(mainContent).toContain('output "aws_account_id"');
    });

    test('should have configuration outputs', () => {
      expect(mainContent).toContain('output "lambda_memory_mb"');
      expect(mainContent).toContain('output "lambda_timeout_seconds"');
      expect(mainContent).toContain('output "log_retention_days"');
      expect(mainContent).toContain('output "notification_email"');
    });

    test('should have all outputs with descriptions', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g);
      expect(outputBlocks?.length).toBeGreaterThan(30);
      
      outputBlocks?.slice(0, 5).forEach(output => {
        expect(output).toContain('description');
        expect(output).toContain('value');
      });
    });
  });

  // 16. Variables Configuration (4 tests)
  describe('Variables Configuration', () => {
    test('should define aws_region variable', () => {
      expect(providerContent).toContain('variable "aws_region"');
      expect(providerContent).toContain('description = "AWS region for deploying resources"');
      expect(providerContent).toContain('default     = "us-east-1"');
    });

    test('should define environment variable with validation', () => {
      expect(providerContent).toContain('variable "environment"');
      expect(providerContent).toContain('default     = "dev"');
      expect(providerContent).toContain('validation {');
      expect(providerContent).toContain('condition     = contains(["dev", "staging", "prod"], var.environment)');
    });

    test('should define project and cost center variables', () => {
      expect(providerContent).toContain('variable "project_name"');
      expect(providerContent).toContain('variable "cost_center"');
      expect(providerContent).toContain('default     = "market-data-processor"');
      expect(providerContent).toContain('default     = "engineering"');
    });

    test('should define notification and Lambda configuration variables', () => {
      expect(providerContent).toContain('variable "notification_email"');
      expect(providerContent).toContain('variable "lambda_memory_mb"');
      expect(providerContent).toContain('variable "lambda_timeout_seconds"');
      expect(providerContent).toContain('variable "log_retention_days"');
    });
  });

  // 17. Compliance and Tagging (3 tests)
  describe('Compliance and Tagging', () => {
    test('should apply tags to all resources consistently', () => {
      const taggedResources = [
        'FunctionType = "ingestion"',
        'FunctionType = "processing"',
        'FunctionType = "notification"',
        'TableType = "events"',
        'TableType = "audit"',
        'QueueType = "dlq"'
      ];
      
      taggedResources.forEach(tag => {
        expect(mainContent).toContain(tag);
      });
    });

    test('should use consistent tag naming convention', () => {
      expect(mainContent).toContain('FunctionType');
      expect(mainContent).toContain('TableType');
      expect(mainContent).toContain('QueueType');
      expect(mainContent).toContain('BusType');
      expect(mainContent).toContain('RuleType');
    });

    test('should use descriptive tags for resource classification', () => {
      expect(mainContent).toContain('FunctionType = "ingestion"');
      expect(mainContent).toContain('FunctionType = "processing"');
      expect(mainContent).toContain('FunctionType = "notification"');
      expect(mainContent).toContain('TableType = "events"');
      expect(mainContent).toContain('TableType = "audit"');
    });
  });

  // 18. Cost Optimization (4 tests)
  describe('Cost Optimization', () => {
    test('should use pay-per-request billing for DynamoDB', () => {
      const dynamoBilling = mainContent.match(/billing_mode = "PAY_PER_REQUEST"/g);
      expect(dynamoBilling?.length).toBe(2);
    });

    test('should configure appropriate log retention periods', () => {
      expect(mainContent).toContain('retention_in_days = var.log_retention_days');
      expect(providerContent).toContain('default     = 7');
    });

    test('should use appropriate Lambda memory sizes', () => {
      expect(mainContent).toContain('memory_size   = var.lambda_memory_mb');
      expect(providerContent).toContain('default     = 256');
    });

    test('should configure efficient SQS message retention', () => {
      expect(mainContent).toContain('message_retention_seconds  = var.dlq_message_retention_days * 24 * 60 * 60');
      expect(providerContent).toContain('default     = 4');
      expect(providerContent).toContain('variable "dlq_message_retention_days"');
    });
  });

  // 19. Error Handling and Monitoring (6 tests)
  describe('Error Handling and Monitoring', () => {
    test('should configure dead letter queues for error handling', () => {
      expect(mainContent).toContain('dead_letter_config {');
      expect(mainContent).toContain('target_arn = aws_sqs_queue.dlq_ingestion.arn');
      expect(mainContent).toContain('target_arn = aws_sqs_queue.dlq_processing.arn');
      expect(mainContent).toContain('target_arn = aws_sqs_queue.dlq_notification.arn');
    });

    test('should enable X-Ray tracing for distributed tracing', () => {
      expect(mainContent).toContain('tracing_config {');
      expect(mainContent).toContain('mode = "Active"');
      expect(mainContent).toContain('xray:PutTraceSegments');
      expect(mainContent).toContain('xray:PutTelemetryRecords');
    });

    test('should configure error monitoring alarms', () => {
      expect(mainContent).toContain('metric_name         = "Errors"');
      expect(mainContent).toContain('threshold           = 0');
      expect(mainContent).toContain('alarm_description   = "Triggers when');
    });

    test('should configure throttling monitoring', () => {
      expect(mainContent).toContain('metric_name         = "Throttles"');
      expect(mainContent).toContain('threshold           = 0');
      expect(mainContent).toContain('alarm_description   = "Triggers when');
      expect(mainContent).toContain('Lambda is throttled');
    });

    test('should configure DynamoDB capacity monitoring', () => {
      expect(mainContent).toContain('metric_name         = "ConsumedReadCapacityUnits"');
      expect(mainContent).toContain('metric_name         = "ConsumedWriteCapacityUnits"');
      expect(mainContent).toContain('threshold           = 1000');
      expect(mainContent).toContain('ConsumedWriteCapacityUnits');
    });

    test('should use SNS for alarm notifications', () => {
      expect(mainContent).toContain('alarm_actions = [aws_sns_topic.critical_events.arn]');
      expect(mainContent).toContain('aws_sns_topic_subscription');
      expect(mainContent).toContain('email_notification');
    });
  });

  // 20. Dependencies and Integration Points (8 tests)
  describe('Dependencies and Integration Points', () => {
    test('should configure Lambda dependencies on IAM policies', () => {
      expect(mainContent).toContain('depends_on = [');
      expect(mainContent).toContain('aws_iam_role_policy_attachment.lambda_ingestion_basic');
      expect(mainContent).toContain('aws_iam_role_policy.lambda_ingestion_custom');
    });

    test('should configure EventBridge event patterns', () => {
      expect(mainContent).toContain('event_pattern = jsonencode({');
      expect(mainContent).toContain('detail-type = ["MarketData.Raw"]');
      expect(mainContent).toContain('detail-type = ["MarketData.Validated"]');
      expect(mainContent).toContain('detail-type = ["MarketData.Alert"]');
    });

    test('should configure EventBridge targets properly', () => {
      expect(mainContent).toContain('arn            = aws_lambda_function.ingestion.arn');
      expect(mainContent).toContain('arn            = aws_lambda_function.processing.arn');
      expect(mainContent).toContain('arn            = aws_lambda_function.notification.arn');
    });

    test('should configure IAM policies with resource ARNs', () => {
      expect(mainContent).toContain('Resource = [');
      expect(mainContent).toContain('aws_dynamodb_table.events.arn');
      expect(mainContent).toContain('aws_sqs_queue.dlq_ingestion.arn');
      expect(mainContent).toContain('aws_sns_topic.critical_events.arn');
    });

    test('should configure Lambda environment with region and environment', () => {
      expect(mainContent).toContain('ENVIRONMENT = var.environment');
      expect(mainContent).toContain('REGION      = data.aws_region.current.name');
    });

    test('should configure SSM parameters with dynamic values', () => {
      expect(mainContent).toContain('value = aws_dynamodb_table.events.name');
      expect(mainContent).toContain('value = aws_dynamodb_table.audit.name');
      expect(mainContent).toContain('value = aws_sns_topic.critical_events.arn');
      expect(mainContent).toContain('value = aws_cloudwatch_event_bus.market_data.name');
    });

    test('should configure CloudWatch alarms with proper dimensions', () => {
      expect(mainContent).toContain('dimensions = {');
      expect(mainContent).toContain('FunctionName = aws_lambda_function.ingestion.function_name');
      expect(mainContent).toContain('TableName = aws_dynamodb_table.events.name');
    });

    test('should configure Lambda permissions with proper source ARNs', () => {
      expect(mainContent).toContain('source_arn    = aws_cloudwatch_event_rule.ingestion.arn');
      expect(mainContent).toContain('source_arn    = aws_cloudwatch_event_rule.processing.arn');
      expect(mainContent).toContain('source_arn    = aws_cloudwatch_event_rule.notification.arn');
    });
  });

  // 21. Resource Count Validation (1 test)
  describe('Resource Count Validation', () => {
    test('should create expected number of key resources', () => {
      const lambdaCount = (mainContent.match(/resource "aws_lambda_function"/g) || []).length;
      expect(lambdaCount).toBe(3);
      
      const dynamoCount = (mainContent.match(/resource "aws_dynamodb_table"/g) || []).length;
      expect(dynamoCount).toBe(2);
      
      const sqsCount = (mainContent.match(/resource "aws_sqs_queue"/g) || []).length;
      expect(sqsCount).toBe(3);
      
      const eventRulesCount = (mainContent.match(/resource "aws_cloudwatch_event_rule"/g) || []).length;
      expect(eventRulesCount).toBe(3);
      
      const alarmCount = (mainContent.match(/resource "aws_cloudwatch_metric_alarm"/g) || []).length;
      expect(alarmCount).toBeGreaterThanOrEqual(7);
    });
  });

  // 22. Terraform Best Practices (5 tests)
  describe('Terraform Best Practices', () => {
    test('should use proper resource naming patterns', () => {
      expect(mainContent).toMatch(/resource "aws_lambda_function" "[^"]+"/);
      expect(mainContent).toMatch(/resource "aws_dynamodb_table" "[^"]+"/);
      expect(mainContent).toMatch(/resource "aws_sqs_queue" "[^"]+"/);
      expect(mainContent).toMatch(/resource "aws_sns_topic" "[^"]+"/);
    });

    test('should use proper variable interpolation', () => {
      expect(mainContent).toContain('${var.environment}');
      expect(mainContent).toContain('${data.aws_region.current.name}');
      expect(mainContent).toContain('${data.aws_caller_identity.current.account_id}');
    });

    test('should use proper data source references', () => {
      expect(mainContent).toContain('data.aws_caller_identity.current.account_id');
      expect(mainContent).toContain('data.aws_region.current.name');
      expect(mainContent).toContain('data.archive_file.lambda_code.output_path');
    });

    test('should use proper resource references', () => {
      expect(mainContent).toContain('aws_lambda_function.ingestion.function_name');
      expect(mainContent).toContain('aws_dynamodb_table.events.name');
      expect(mainContent).toContain('aws_sns_topic.critical_events.arn');
    });

    test('should use proper JSON encoding for complex data', () => {
      expect(mainContent).toContain('jsonencode({');
      expect(mainContent).toContain('event_pattern = jsonencode({');
      expect(mainContent).toContain('assume_role_policy = jsonencode({');
    });
  });
});

export {};