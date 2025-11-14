// Unit tests for Terraform Webhook Processing System
// Tests infrastructure configuration without deploying to AWS

import fs from 'fs';
import path from 'path';

const libDir = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Structure', () => {
    test('main.tf exists', () => {
      const mainPath = path.join(libDir, 'main.tf');
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    test('provider.tf exists', () => {
      const providerPath = path.join(libDir, 'provider.tf');
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('variables.tf exists', () => {
      const variablesPath = path.join(libDir, 'variables.tf');
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test('outputs.tf exists', () => {
      const outputsPath = path.join(libDir, 'outputs.tf');
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('Lambda validation.py exists', () => {
      const lambdaPath = path.join(libDir, 'lambda', 'validation.py');
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });

    test('Lambda processing.py exists', () => {
      const lambdaPath = path.join(libDir, 'lambda', 'processing.py');
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });

    test('Lambda zip files exist', () => {
      const validationZip = path.join(libDir, 'lambda', 'validation.zip');
      const processingZip = path.join(libDir, 'lambda', 'processing.zip');
      expect(fs.existsSync(validationZip)).toBe(true);
      expect(fs.existsSync(processingZip)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
    });

    test('declares required Terraform version', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('declares AWS provider with correct version', () => {
      expect(providerContent).toMatch(/hashicorp\/aws/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('configures S3 backend', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('uses aws_region variable for provider region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('sets default tags with environment_suffix', () => {
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
      expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    });

    test('declares environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('declares acm_certificate_arn variable', () => {
      expect(variablesContent).toMatch(/variable\s+"acm_certificate_arn"/);
    });

    test('declares custom_domain_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"custom_domain_name"/);
    });

    test('declares aws_region variable with us-east-1 default', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });
  });

  describe('Main Infrastructure - KMS', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('declares KMS key resource', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"webhook_kms"/);
    });

    test('KMS key enables key rotation', () => {
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS key sets 7-day deletion window', () => {
      expect(mainContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test('KMS key includes environment_suffix in name tag', () => {
      const kmsSection = mainContent.match(/resource\s+"aws_kms_key"\s+"webhook_kms"[\s\S]*?(?=resource|$)/);
      expect(kmsSection).toBeTruthy();
      expect(kmsSection![0]).toMatch(/Name\s*=\s*"webhook-kms-\$\{var\.environment_suffix\}"/);
    });

    test('declares KMS alias resource', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"webhook_kms_alias"/);
    });

    test('KMS alias includes environment_suffix', () => {
      expect(mainContent).toMatch(/name\s*=\s*"alias\/webhook-kms-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Main Infrastructure - DynamoDB', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('declares DynamoDB table resource', () => {
      expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"webhooks"/);
    });

    test('DynamoDB table uses PAY_PER_REQUEST billing', () => {
      expect(mainContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('DynamoDB table has webhook_id as hash key', () => {
      expect(mainContent).toMatch(/hash_key\s*=\s*"webhook_id"/);
    });

    test('DynamoDB table includes environment_suffix in name', () => {
      expect(mainContent).toMatch(/name\s*=\s*"webhooks-\$\{var\.environment_suffix\}"/);
    });

    test('DynamoDB table enables TTL on expiry_time', () => {
      expect(mainContent).toMatch(/attribute_name\s*=\s*"expiry_time"/);
      expect(mainContent).toMatch(/enabled\s*=\s*true/);
    });

    test('DynamoDB table enables server-side encryption with KMS', () => {
      const dynamoSection = mainContent.match(/resource\s+"aws_dynamodb_table"\s+"webhooks"[\s\S]*?(?=resource|^#)/);
      expect(dynamoSection).toBeTruthy();
      expect(dynamoSection![0]).toMatch(/server_side_encryption/);
      expect(dynamoSection![0]).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.webhook_kms\.arn/);
    });

    test('DynamoDB table enables point-in-time recovery', () => {
      expect(mainContent).toMatch(/point_in_time_recovery/);
    });
  });

  describe('Main Infrastructure - SQS', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('declares SQS dead letter queue', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sqs_queue"\s+"webhook_dlq"/);
    });

    test('DLQ is FIFO queue', () => {
      const dlqSection = mainContent.match(/resource\s+"aws_sqs_queue"\s+"webhook_dlq"[\s\S]*?(?=resource|^#)/);
      expect(dlqSection).toBeTruthy();
      expect(dlqSection![0]).toMatch(/fifo_queue\s*=\s*true/);
      expect(dlqSection![0]).toMatch(/name\s*=\s*"webhook-dlq-\$\{var\.environment_suffix\}\.fifo"/);
    });

    test('declares main SQS FIFO queue', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sqs_queue"\s+"webhook_queue"/);
    });

    test('main queue is FIFO with 5-minute visibility timeout', () => {
      const queueSection = mainContent.match(/resource\s+"aws_sqs_queue"\s+"webhook_queue"[\s\S]*?(?=resource|^#)/);
      expect(queueSection).toBeTruthy();
      expect(queueSection![0]).toMatch(/fifo_queue\s*=\s*true/);
      expect(queueSection![0]).toMatch(/visibility_timeout_seconds\s*=\s*300/);
    });

    test('main queue has redrive policy with max_receive_count 3', () => {
      const queueSection = mainContent.match(/resource\s+"aws_sqs_queue"\s+"webhook_queue"[\s\S]*?(?=resource|^#)/);
      expect(queueSection).toBeTruthy();
      expect(queueSection![0]).toMatch(/redrive_policy/);
      expect(queueSection![0]).toMatch(/maxReceiveCount\s*=\s*3/);
    });

    test('SQS queues use KMS encryption', () => {
      const dlqSection = mainContent.match(/resource\s+"aws_sqs_queue"\s+"webhook_dlq"[\s\S]*?(?=resource|^#)/);
      const queueSection = mainContent.match(/resource\s+"aws_sqs_queue"\s+"webhook_queue"[\s\S]*?(?=resource|^#)/);
      expect(dlqSection![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.webhook_kms\.id/);
      expect(queueSection![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.webhook_kms\.id/);
    });

    test('processing Lambda DLQ exists', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sqs_queue"\s+"processing_lambda_dlq"/);
    });
  });

  describe('Main Infrastructure - SNS', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('declares SNS topic', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"webhook_notifications"/);
    });

    test('SNS topic includes environment_suffix in name', () => {
      expect(mainContent).toMatch(/name\s*=\s*"webhook-notifications-\$\{var\.environment_suffix\}"/);
    });

    test('SNS topic uses KMS encryption', () => {
      const snsSection = mainContent.match(/resource\s+"aws_sns_topic"\s+"webhook_notifications"[\s\S]*?(?=resource|^#)/);
      expect(snsSection).toBeTruthy();
      expect(snsSection![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.webhook_kms\.id/);
    });
  });

  describe('Main Infrastructure - Lambda Functions', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('declares validation Lambda function', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"webhook_validation"/);
    });

    test('validation Lambda uses Python 3.9 runtime', () => {
      const validationSection = mainContent.match(/resource\s+"aws_lambda_function"\s+"webhook_validation"[\s\S]*?(?=resource|^#)/);
      expect(validationSection).toBeTruthy();
      expect(validationSection![0]).toMatch(/runtime\s*=\s*"python3\.9"/);
    });

    test('validation Lambda has 512MB memory', () => {
      const validationSection = mainContent.match(/resource\s+"aws_lambda_function"\s+"webhook_validation"[\s\S]*?(?=resource|^#)/);
      expect(validationSection![0]).toMatch(/memory_size\s*=\s*512/);
    });

    test('validation Lambda has max 100 concurrent executions', () => {
      const validationSection = mainContent.match(/resource\s+"aws_lambda_function"\s+"webhook_validation"[\s\S]*?(?=resource|^#)/);
      expect(validationSection![0]).toMatch(/reserved_concurrent_executions\s*=\s*100/);
    });

    test('validation Lambda enables X-Ray tracing', () => {
      const validationSection = mainContent.match(/resource\s+"aws_lambda_function"\s+"webhook_validation"[\s\S]*?(?=resource|^#)/);
      expect(validationSection![0]).toMatch(/tracing_config/);
      expect(validationSection![0]).toMatch(/mode\s*=\s*"Active"/);
    });

    test('validation Lambda includes environment_suffix in name', () => {
      expect(mainContent).toMatch(/function_name\s*=\s*"webhook-validation-\$\{var\.environment_suffix\}"/);
    });

    test('declares processing Lambda function', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"webhook_processing"/);
    });

    test('processing Lambda uses Python 3.9 runtime', () => {
      const processingSection = mainContent.match(/resource\s+"aws_lambda_function"\s+"webhook_processing"[\s\S]*?(?=resource|^#)/);
      expect(processingSection).toBeTruthy();
      expect(processingSection![0]).toMatch(/runtime\s*=\s*"python3\.9"/);
    });

    test('processing Lambda has 512MB memory', () => {
      const processingSection = mainContent.match(/resource\s+"aws_lambda_function"\s+"webhook_processing"[\s\S]*?(?=resource|^#)/);
      expect(processingSection![0]).toMatch(/memory_size\s*=\s*512/);
    });

    test('processing Lambda has dead letter config', () => {
      const processingSection = mainContent.match(/resource\s+"aws_lambda_function"\s+"webhook_processing"[\s\S]*?(?=resource|^#)/);
      expect(processingSection![0]).toMatch(/dead_letter_config/);
    });

    test('processing Lambda enables X-Ray tracing', () => {
      const processingSection = mainContent.match(/resource\s+"aws_lambda_function"\s+"webhook_processing"[\s\S]*?(?=resource|^#)/);
      expect(processingSection![0]).toMatch(/tracing_config/);
      expect(processingSection![0]).toMatch(/mode\s*=\s*"Active"/);
    });

    test('Lambda event source mapping with batch size 10', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"sqs_to_lambda"/);
      expect(mainContent).toMatch(/batch_size\s*=\s*10/);
    });
  });

  describe('Main Infrastructure - IAM', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('declares validation Lambda IAM role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"validation_lambda_role"/);
    });

    test('validation Lambda role includes environment_suffix', () => {
      expect(mainContent).toMatch(/name\s*=\s*"webhook-validation-lambda-\$\{var\.environment_suffix\}"/);
    });

    test('validation Lambda has IAM policy', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"validation_lambda_policy"/);
    });

    test('validation Lambda policy grants DynamoDB PutItem', () => {
      const policySection = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"validation_lambda_policy"[\s\S]*?(?=resource|^#)/);
      expect(policySection).toBeTruthy();
      expect(policySection![0]).toMatch(/dynamodb:PutItem/);
    });

    test('validation Lambda policy grants SQS SendMessage', () => {
      const policySection = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"validation_lambda_policy"[\s\S]*?(?=resource|^#)/);
      expect(policySection![0]).toMatch(/sqs:SendMessage/);
    });

    test('validation Lambda policy grants KMS operations', () => {
      const policySection = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"validation_lambda_policy"[\s\S]*?(?=resource|^#)/);
      expect(policySection![0]).toMatch(/kms:Decrypt/);
      expect(policySection![0]).toMatch(/kms:GenerateDataKey/);
    });

    test('validation Lambda policy grants CloudWatch Logs', () => {
      const policySection = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"validation_lambda_policy"[\s\S]*?(?=resource|^#)/);
      expect(policySection![0]).toMatch(/logs:CreateLogStream/);
      expect(policySection![0]).toMatch(/logs:PutLogEvents/);
    });

    test('validation Lambda policy grants X-Ray operations', () => {
      const policySection = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"validation_lambda_policy"[\s\S]*?(?=resource|^#)/);
      expect(policySection![0]).toMatch(/xray:PutTraceSegments/);
      expect(policySection![0]).toMatch(/xray:PutTelemetryRecords/);
    });

    test('declares processing Lambda IAM role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"processing_lambda_role"/);
    });

    test('processing Lambda has IAM policy', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"processing_lambda_policy"/);
    });

    test('processing Lambda policy grants SQS operations', () => {
      const policySection = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"processing_lambda_policy"[\s\S]*?(?=resource|^#)/);
      expect(policySection).toBeTruthy();
      expect(policySection![0]).toMatch(/sqs:ReceiveMessage/);
      expect(policySection![0]).toMatch(/sqs:DeleteMessage/);
    });

    test('processing Lambda policy grants SNS Publish', () => {
      const policySection = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"processing_lambda_policy"[\s\S]*?(?=resource|^#)/);
      expect(policySection![0]).toMatch(/sns:Publish/);
    });
  });

  describe('Main Infrastructure - CloudWatch', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('declares CloudWatch Log Group for validation Lambda', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"validation_lambda_logs"/);
    });

    test('validation Lambda log group has 7-day retention', () => {
      const logGroupSection = mainContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"validation_lambda_logs"[\s\S]*?(?=resource|^#)/);
      expect(logGroupSection).toBeTruthy();
      expect(logGroupSection![0]).toMatch(/retention_in_days\s*=\s*7/);
    });

    test('declares CloudWatch Log Group for processing Lambda', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"processing_lambda_logs"/);
    });

    test('processing Lambda log group has 7-day retention', () => {
      const logGroupSection = mainContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"processing_lambda_logs"[\s\S]*?(?=resource|^#)/);
      expect(logGroupSection).toBeTruthy();
      expect(logGroupSection![0]).toMatch(/retention_in_days\s*=\s*7/);
    });

    test('declares CloudWatch Log Group for API Gateway', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs"/);
    });

    test('API Gateway log group has 7-day retention', () => {
      const logGroupSection = mainContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs"[\s\S]*?(?=resource|^#)/);
      expect(logGroupSection).toBeTruthy();
      expect(logGroupSection![0]).toMatch(/retention_in_days\s*=\s*7/);
    });

    test('declares CloudWatch alarm for DLQ', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_alarm"/);
    });

    test('DLQ alarm monitors ApproximateNumberOfMessagesVisible', () => {
      const alarmSection = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_alarm"[\s\S]*?(?=resource|$)/);
      expect(alarmSection).toBeTruthy();
      expect(alarmSection![0]).toMatch(/metric_name\s*=\s*"ApproximateNumberOfMessagesVisible"/);
    });

    test('DLQ alarm includes environment_suffix in name', () => {
      expect(mainContent).toMatch(/alarm_name\s*=\s*"webhook-dlq-messages-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Main Infrastructure - API Gateway', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('declares API Gateway REST API', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"webhook_api"/);
    });

    test('API Gateway includes environment_suffix in name', () => {
      expect(mainContent).toMatch(/name\s*=\s*"webhook-api-\$\{var\.environment_suffix\}"/);
    });

    test('API Gateway uses REGIONAL endpoint', () => {
      const apiSection = mainContent.match(/resource\s+"aws_api_gateway_rest_api"\s+"webhook_api"[\s\S]*?(?=resource|^#)/);
      expect(apiSection).toBeTruthy();
      expect(apiSection![0]).toMatch(/types\s*=\s*\["REGIONAL"\]/);
    });

    test('declares /webhooks resource', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"webhooks"/);
      expect(mainContent).toMatch(/path_part\s*=\s*"webhooks"/);
    });

    test('declares POST method', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"post_webhook"/);
      expect(mainContent).toMatch(/http_method\s*=\s*"POST"/);
    });

    test('declares Lambda integration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"lambda_integration"/);
      expect(mainContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
    });

    test('declares Lambda permission for API Gateway', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_invoke"/);
    });

    test('declares API Gateway deployment', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"webhook_deployment"/);
    });

    test('declares API Gateway stage', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"webhook_stage"/);
      expect(mainContent).toMatch(/stage_name\s*=\s*"prod"/);
    });

    test('API Gateway stage enables X-Ray tracing', () => {
      const stageSection = mainContent.match(/resource\s+"aws_api_gateway_stage"\s+"webhook_stage"[\s\S]*?(?=resource|^#)/);
      expect(stageSection).toBeTruthy();
      expect(stageSection![0]).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test('API Gateway stage has access logging configured', () => {
      const stageSection = mainContent.match(/resource\s+"aws_api_gateway_stage"\s+"webhook_stage"[\s\S]*?(?=resource|^#)/);
      expect(stageSection![0]).toMatch(/access_log_settings/);
    });

    test('declares custom domain name', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_domain_name"\s+"webhook_domain"/);
    });

    test('custom domain uses regional certificate', () => {
      const domainSection = mainContent.match(/resource\s+"aws_api_gateway_domain_name"\s+"webhook_domain"[\s\S]*?(?=resource|^#)/);
      expect(domainSection).toBeTruthy();
      expect(domainSection![0]).toMatch(/regional_certificate_arn\s*=\s*var\.acm_certificate_arn/);
    });

    test('declares base path mapping', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_base_path_mapping"\s+"webhook_mapping"/);
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
    });

    test('outputs api_gateway_url', () => {
      expect(outputsContent).toMatch(/output\s+"api_gateway_url"/);
    });

    test('outputs custom_domain_url', () => {
      expect(outputsContent).toMatch(/output\s+"custom_domain_url"/);
    });

    test('outputs dynamodb_table_name', () => {
      expect(outputsContent).toMatch(/output\s+"dynamodb_table_name"/);
    });

    test('outputs sqs_queue_url', () => {
      expect(outputsContent).toMatch(/output\s+"sqs_queue_url"/);
    });

    test('outputs sns_topic_arn', () => {
      expect(outputsContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('outputs validation_lambda_arn', () => {
      expect(outputsContent).toMatch(/output\s+"validation_lambda_arn"/);
    });

    test('outputs processing_lambda_arn', () => {
      expect(outputsContent).toMatch(/output\s+"processing_lambda_arn"/);
    });

    test('outputs kms_key_id', () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_id"/);
    });

    test('outputs dlq_url', () => {
      expect(outputsContent).toMatch(/output\s+"dlq_url"/);
    });

    test('outputs regional_domain_name', () => {
      expect(outputsContent).toMatch(/output\s+"regional_domain_name"/);
    });

    test('outputs regional_zone_id', () => {
      expect(outputsContent).toMatch(/output\s+"regional_zone_id"/);
    });
  });

  describe('Lambda Function Code - Validation', () => {
    let validationContent: string;

    beforeAll(() => {
      validationContent = fs.readFileSync(path.join(libDir, 'lambda', 'validation.py'), 'utf8');
    });

    test('imports required modules', () => {
      expect(validationContent).toMatch(/import json/);
      expect(validationContent).toMatch(/import boto3/);
      expect(validationContent).toMatch(/import hashlib/);
      expect(validationContent).toMatch(/import hmac/);
    });

    test('defines lambda_handler function', () => {
      expect(validationContent).toMatch(/def lambda_handler\(event, context\):/);
    });

    test('validates webhook signature', () => {
      expect(validationContent).toMatch(/def validate_signature/);
      expect(validationContent).toMatch(/hmac\.new/);
      expect(validationContent).toMatch(/hashlib\.sha256/);
    });

    test('stores webhook in DynamoDB', () => {
      expect(validationContent).toMatch(/table\.put_item/);
      expect(validationContent).toMatch(/webhook_id/);
      expect(validationContent).toMatch(/expiry_time/);
    });

    test('sends message to SQS', () => {
      expect(validationContent).toMatch(/sqs\.send_message/);
      expect(validationContent).toMatch(/MessageGroupId/);
      expect(validationContent).toMatch(/MessageDeduplicationId/);
    });

    test('uses environment variables', () => {
      expect(validationContent).toMatch(/os\.environ\['DYNAMODB_TABLE'\]/);
      expect(validationContent).toMatch(/os\.environ\['SQS_QUEUE_URL'\]/);
    });

    test('handles errors gracefully', () => {
      expect(validationContent).toMatch(/except Exception/);
      expect(validationContent).toMatch(/statusCode.*500/);
    });
  });

  describe('Lambda Function Code - Processing', () => {
    let processingContent: string;

    beforeAll(() => {
      processingContent = fs.readFileSync(path.join(libDir, 'lambda', 'processing.py'), 'utf8');
    });

    test('imports required modules', () => {
      expect(processingContent).toMatch(/import json/);
      expect(processingContent).toMatch(/import boto3/);
    });

    test('defines lambda_handler function', () => {
      expect(processingContent).toMatch(/def lambda_handler\(event, context\):/);
    });

    test('processes records from SQS batch', () => {
      expect(processingContent).toMatch(/for record in event\['Records'\]:/);
    });

    test('publishes to SNS', () => {
      expect(processingContent).toMatch(/sns\.publish/);
      expect(processingContent).toMatch(/TopicArn=SNS_TOPIC_ARN/);
    });

    test('defines process_webhook function', () => {
      expect(processingContent).toMatch(/def process_webhook/);
    });

    test('uses SNS_TOPIC_ARN environment variable', () => {
      expect(processingContent).toMatch(/os\.environ\['SNS_TOPIC_ARN'\]/);
    });

    test('tracks processing counts', () => {
      expect(processingContent).toMatch(/processed_count/);
      expect(processingContent).toMatch(/failed_count/);
    });

    test('handles errors and re-raises for DLQ', () => {
      expect(processingContent).toMatch(/except Exception/);
      expect(processingContent).toMatch(/raise/);
    });
  });

  describe('Resource Naming - environmentSuffix Coverage', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('all resource names include environment_suffix', () => {
      const resourceNames = [
        'webhook-kms',
        'webhooks',
        'webhook-dlq',
        'webhook-queue',
        'webhook-notifications',
        'webhook-validation-logs',
        'webhook-processing-logs',
        'webhook-api-logs',
        'webhook-validation-lambda',
        'webhook-processing-lambda',
        'processing-lambda-dlq',
        'webhook-api',
        'webhook-api-stage',
        'webhook-domain',
        'webhook-dlq-messages',
        'webhook-dlq-alarm',
      ];

      resourceNames.forEach((name) => {
        const pattern = new RegExp(`${name}-\\$\\{var\\.environment_suffix\\}`);
        expect(mainContent).toMatch(pattern);
      });
    });

    test('no hardcoded environment values in resource names', () => {
      const hardcodedPatterns = [
        /name\s*=\s*"[^"]*-prod[^"]*"/,
        /name\s*=\s*"[^"]*-dev[^"]*"/,
        /name\s*=\s*"[^"]*-staging[^"]*"/,
        /name\s*=\s*"[^"]*-test[^"]*"/,
      ];

      hardcodedPatterns.forEach((pattern) => {
        // Exclude comments and descriptions
        const codeWithoutComments = mainContent.replace(/#.*$/gm, '').replace(/description\s*=\s*"[^"]*"/g, '');
        expect(codeWithoutComments).not.toMatch(pattern);
      });
    });
  });

  describe('Security and Compliance', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('no Retain policies or DeletionProtection', () => {
      expect(mainContent).not.toMatch(/prevent_destroy\s*=\s*true/);
      expect(mainContent).not.toMatch(/deletion_protection\s*=\s*true/);
      expect(mainContent).not.toMatch(/DeletionPolicy.*Retain/);
    });

    test('all encryption uses customer-managed KMS keys', () => {
      const encryptionReferences = mainContent.match(/kms_(key_arn|master_key_id)/g);
      expect(encryptionReferences).toBeTruthy();
      expect(encryptionReferences!.length).toBeGreaterThan(4);
    });

    test('X-Ray tracing enabled on all Lambda functions', () => {
      const tracingConfigs = mainContent.match(/tracing_config\s*{\s*mode\s*=\s*"Active"\s*}/g);
      expect(tracingConfigs).toBeTruthy();
      expect(tracingConfigs!.length).toBe(2); // validation and processing
    });

    test('CloudWatch logging configured for all services', () => {
      const logGroups = mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g);
      expect(logGroups).toBeTruthy();
      expect(logGroups!.length).toBe(3); // validation, processing, api gateway
    });
  });
});
