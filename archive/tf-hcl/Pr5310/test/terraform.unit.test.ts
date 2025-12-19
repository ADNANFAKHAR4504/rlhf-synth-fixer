import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const libPath = join(__dirname, '../lib');

// Helper function to read all Terraform files
function readTerraformFiles(): string {
  const tfFiles = [
    'variables.tf',
    'data.tf',
    'random.tf',
    'locals.tf',
    'iam.tf',
    'dynamodb.tf',
    's3.tf',
    'sqs.tf',
    'secrets.tf',
    'lambda-layer.tf',
    'lambda-validators.tf',
    'lambda-processor.tf',
    'lambda-query.tf',
    'api-gateway.tf',
    'cloudwatch.tf',
    'outputs.tf'
  ];

  return tfFiles
    .map(file => {
      const path = join(libPath, file);
      return existsSync(path) ? readFileSync(path, 'utf-8') : '';
    })
    .join('\n');
}

const terraformCode = readTerraformFiles();

describe('Terraform Infrastructure Unit Tests - Serverless Webhook Processing', () => {

  describe('File Structure', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = [
        'provider.tf', 'variables.tf', 'data.tf', 'random.tf', 'locals.tf',
        'iam.tf', 'dynamodb.tf', 's3.tf', 'sqs.tf', 'secrets.tf',
        'lambda-validators.tf', 'lambda-processor.tf',
        'lambda-query.tf', 'api-gateway.tf', 'cloudwatch.tf', 'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        const path = join(libPath, file);
        expect(existsSync(path)).toBe(true);
      });
    });

    test('should have provider.tf without provider block in other files', () => {
      const otherFiles = terraformCode;
      const providerCount = (otherFiles.match(/provider\s+"aws"\s*{/g) || []).length;
      expect(providerCount).toBe(0);
    });
  });

  describe('Variables Configuration', () => {
    test('should define aws_region variable', () => {
      expect(terraformCode).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('should define environment variable with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"environment"\s*{/);
      expect(terraformCode).toMatch(/validation\s*{[\s\S]*?environment/);
    });

    test('should define environment_suffix variable', () => {
      expect(terraformCode).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('should define lambda_architecture variable with arm64 validation', () => {
      expect(terraformCode).toMatch(/variable\s+"lambda_architecture"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*"arm64"/);
      expect(terraformCode).toMatch(/validation\s*{[\s\S]*?arm64/);
    });

    test('should define dynamodb_billing_mode variable with PAY_PER_REQUEST validation', () => {
      expect(terraformCode).toMatch(/variable\s+"dynamodb_billing_mode"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('should define dynamodb_point_in_time_recovery variable as required true', () => {
      expect(terraformCode).toMatch(/variable\s+"dynamodb_point_in_time_recovery"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*true/);
    });

    test('should define s3_encryption_type variable with AES256', () => {
      expect(terraformCode).toMatch(/variable\s+"s3_encryption_type"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*"AES256"/);
    });

    test('should define xray_tracing_enabled variable as required true', () => {
      expect(terraformCode).toMatch(/variable\s+"xray_tracing_enabled"\s*{/);
      expect(terraformCode).toMatch(/default\s*=\s*true/);
    });

    test('should define API throttle limit variables', () => {
      expect(terraformCode).toMatch(/variable\s+"api_throttle_burst_limit"/);
      expect(terraformCode).toMatch(/variable\s+"api_throttle_rate_limit"/);
      expect(terraformCode).toMatch(/variable\s+"stripe_throttle_limit"/);
      expect(terraformCode).toMatch(/variable\s+"paypal_throttle_limit"/);
      expect(terraformCode).toMatch(/variable\s+"square_throttle_limit"/);
    });

    test('should define Lambda configuration variables', () => {
      expect(terraformCode).toMatch(/variable\s+"validator_memory_size"/);
      expect(terraformCode).toMatch(/variable\s+"processor_memory_size"/);
      expect(terraformCode).toMatch(/variable\s+"query_memory_size"/);
      expect(terraformCode).toMatch(/variable\s+"processor_reserved_concurrency"/);
    });

    test('should define CloudWatch retention variables', () => {
      expect(terraformCode).toMatch(/variable\s+"log_retention_validators"/);
      expect(terraformCode).toMatch(/variable\s+"log_retention_processor"/);
      expect(terraformCode).toMatch(/variable\s+"log_retention_api_gateway"/);
    });
  });

  describe('Data Sources', () => {
    test('should define aws_caller_identity data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should define aws_region data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test('should define aws_availability_zones data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
  });

  describe('Random Resources', () => {
    test('should define random_string resource for environment suffix', () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"/);
    });

    test('random_string should use conditional creation', () => {
      expect(terraformCode).toMatch(/count\s*=\s*var\.environment_suffix\s*==\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('random_string should have proper configuration', () => {
      expect(terraformCode).toMatch(/length\s*=\s*8/);
      expect(terraformCode).toMatch(/special\s*=\s*false/);
      expect(terraformCode).toMatch(/upper\s*=\s*false/);
    });
  });

  describe('Locals Configuration', () => {
    test('should define env_suffix in locals', () => {
      expect(terraformCode).toMatch(/locals\s*{[\s\S]*?env_suffix\s*=/);
    });

    test('should define common_tags in locals', () => {
      expect(terraformCode).toMatch(/common_tags\s*=\s*merge\(/);
    });

    test('should use environment_suffix pattern in locals', () => {
      expect(terraformCode).toMatch(/env_suffix\s*=\s*var\.environment_suffix\s*!=\s*""\s*\?/);
    });
  });

  describe('DynamoDB Table', () => {
    test('should define DynamoDB transactions table', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_dynamodb_table"\s+"transactions"/);
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(terraformCode).toMatch(/billing_mode\s*=\s*var\.dynamodb_billing_mode/);
    });

    test('should have transaction_id as hash key', () => {
      expect(terraformCode).toMatch(/hash_key\s*=\s*"transaction_id"/);
    });

    test('should have timestamp as range key', () => {
      expect(terraformCode).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test('should define ProviderTimestampIndex GSI', () => {
      expect(terraformCode).toMatch(/name\s*=\s*"ProviderTimestampIndex"/);
    });

    test('should define CustomerIndex GSI', () => {
      expect(terraformCode).toMatch(/name\s*=\s*"CustomerIndex"/);
    });

    test('should have point-in-time recovery enabled', () => {
      expect(terraformCode).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*var\.dynamodb_point_in_time_recovery/);
    });

    test('should have server-side encryption enabled', () => {
      expect(terraformCode).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('should have DynamoDB streams enabled', () => {
      expect(terraformCode).toMatch(/stream_enabled\s*=\s*var\.dynamodb_stream_enabled/);
    });

    test('should use unique table name with suffix', () => {
      expect(terraformCode).toMatch(/name\s*=\s*local\.dynamodb_table_name/);
    });
  });

  describe('S3 Buckets', () => {
    test('should define raw payloads S3 bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"raw_payloads"/);
    });

    test('should define processed logs S3 bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"processed_logs"/);
    });

    test('should block public access for raw payloads bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"raw_payloads"/);
      expect(terraformCode).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformCode).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('should use AES256 encryption for S3 buckets', () => {
      expect(terraformCode).toMatch(/sse_algorithm\s*=\s*var\.s3_encryption_type/);
    });

    test('should have lifecycle policies for both buckets', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"raw_payloads"/);
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"processed_logs"/);
    });

    test('should transition to Glacier storage class', () => {
      expect(terraformCode).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test('should use intelligent tiering', () => {
      expect(terraformCode).toMatch(/storage_class\s*=\s*"INTELLIGENT_TIERING"/);
    });

    test('should have versioning enabled for processed logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"processed_logs"[\s\S]*?status\s*=\s*"Enabled"/);
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('should define DLQ', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
    });

    test('should have message retention configuration', () => {
      expect(terraformCode).toMatch(/message_retention_seconds\s*=\s*var\.dlq_message_retention_seconds/);
    });

    test('should have SQS managed SSE enabled', () => {
      expect(terraformCode).toMatch(/sqs_managed_sse_enabled\s*=\s*true/);
    });

    test('should use unique DLQ name with suffix', () => {
      expect(terraformCode).toMatch(/name\s*=\s*local\.dlq_name/);
    });
  });

  describe('Secrets Manager', () => {
    test('should define Stripe secret', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"stripe_secret"/);
    });

    test('should define PayPal secret', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"paypal_secret"/);
    });

    test('should define Square secret', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"square_secret"/);
    });

    test('should have secret versions with lifecycle ignore', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"stripe_secret"/);
      expect(terraformCode).toMatch(/lifecycle\s*{[\s\S]*?ignore_changes\s*=\s*\[secret_string\]/);
    });
  });

  describe('IAM Roles', () => {
    test('should define validator Lambda role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"validator_lambda_role"/);
    });

    test('should define processor Lambda role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"processor_lambda_role"/);
    });

    test('should define query Lambda role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"query_lambda_role"/);
    });

    test('should define API Gateway role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_role"/);
    });

    test('validator role should have X-Ray permissions', () => {
      expect(terraformCode).toMatch(/xray:PutTraceSegments/);
      expect(terraformCode).toMatch(/xray:PutTelemetryRecords/);
    });

    test('validator role should have S3 PutObject permissions', () => {
      expect(terraformCode).toMatch(/s3:PutObject/);
    });

    test('validator role should have Secrets Manager permissions', () => {
      expect(terraformCode).toMatch(/secretsmanager:GetSecretValue/);
    });

    test('processor role should have DynamoDB PutItem permissions', () => {
      expect(terraformCode).toMatch(/dynamodb:PutItem/);
      expect(terraformCode).toMatch(/dynamodb:UpdateItem/);
    });

    test('query role should have DynamoDB read-only permissions', () => {
      expect(terraformCode).toMatch(/dynamodb:GetItem/);
      expect(terraformCode).toMatch(/dynamodb:Query/);
    });
  });

  describe('Lambda Validator Functions', () => {
    test('should define Stripe validator function', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"stripe_validator"/);
    });

    test('should define PayPal validator function', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"paypal_validator"/);
    });

    test('should define Square validator function', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"square_validator"/);
    });

    test('all validator functions should use ARM64 architecture', () => {
      const arm64Count = (terraformCode.match(/architectures\s*=\s*\[var\.lambda_architecture\]/g) || []).length;
      expect(arm64Count).toBeGreaterThanOrEqual(5);
    });

    test('validator functions should have X-Ray tracing enabled', () => {
      expect(terraformCode).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*var\.xray_tracing_enabled\s*\?\s*"Active"/);
    });

    test('validator functions should have proper environment variables', () => {
      expect(terraformCode).toMatch(/PROVIDER_NAME/);
      expect(terraformCode).toMatch(/PROVIDER_SECRET_ARN/);
      expect(terraformCode).toMatch(/S3_BUCKET/);
      expect(terraformCode).toMatch(/PROCESSOR_FUNCTION_ARN/);
    });

    test('validator functions should have API Gateway invoke permissions', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_permission"\s+"stripe_validator_api_gateway"/);
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_permission"\s+"paypal_validator_api_gateway"/);
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_permission"\s+"square_validator_api_gateway"/);
    });
  });

  describe('Lambda Processor Function', () => {
    test('should define processor function', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"processor"/);
    });

    test('should use ARM64 architecture', () => {
      expect(terraformCode).toMatch(/architectures\s*=\s*\[var\.lambda_architecture\]/);
    });

    test('should have reserved concurrent executions', () => {
      expect(terraformCode).toMatch(/reserved_concurrent_executions\s*=\s*var\.processor_reserved_concurrency/);
    });

    test('should have dead letter config', () => {
      expect(terraformCode).toMatch(/dead_letter_config\s*{[\s\S]*?target_arn\s*=\s*aws_sqs_queue\.dlq\.arn/);
    });

    test('should have X-Ray tracing enabled', () => {
      expect(terraformCode).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*var\.xray_tracing_enabled/);
    });
  });

  describe('Lambda Query Function', () => {
    test('should define query function', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"query"/);
    });

    test('should use ARM64 architecture', () => {
      expect(terraformCode).toMatch(/architectures\s*=\s*\[var\.lambda_architecture\]/);
    });

    test('should have API Gateway invoke permission', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_permission"\s+"query_api_gateway"/);
    });
  });

  describe('API Gateway', () => {
    test('should define REST API', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"webhook_api"/);
    });

    test('should define webhook resources for all providers', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_resource"\s+"stripe"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_resource"\s+"paypal"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_resource"\s+"square"/);
    });

    test('should define transactions query resources', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_resource"\s+"transactions"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_resource"\s+"transaction_by_id"/);
    });

    test('should have request validators for all providers', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_request_validator"\s+"stripe_validator"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_request_validator"\s+"paypal_validator"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_request_validator"\s+"square_validator"/);
    });

    test('should have JSON schema models for all providers', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_model"\s+"stripe_webhook"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_model"\s+"paypal_webhook"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_model"\s+"square_webhook"/);
    });

    test('should have POST methods with API key required', () => {
      expect(terraformCode).toMatch(/api_key_required\s*=\s*true/);
    });

    test('should have AWS_PROXY integrations', () => {
      expect(terraformCode).toMatch(/type\s*=\s*"AWS_PROXY"/);
    });

    test('should have deployment with triggers', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"main"/);
      expect(terraformCode).toMatch(/triggers\s*=\s*{/);
    });

    test('should have stage with X-Ray tracing', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"/);
      expect(terraformCode).toMatch(/xray_tracing_enabled\s*=\s*var\.xray_tracing_enabled/);
    });

    test('should have usage plans for all providers', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_usage_plan"\s+"stripe"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_usage_plan"\s+"paypal"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_usage_plan"\s+"square"/);
    });

    test('should have API keys for all providers', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_api_key"\s+"stripe"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_api_key"\s+"paypal"/);
      expect(terraformCode).toMatch(/resource\s+"aws_api_gateway_api_key"\s+"square"/);
    });

    test('should have throttling settings', () => {
      expect(terraformCode).toMatch(/throttle_settings\s*{/);
      expect(terraformCode).toMatch(/burst_limit/);
      expect(terraformCode).toMatch(/rate_limit/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should define log groups for all Lambda functions', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"stripe_validator"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"paypal_validator"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"square_validator"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"processor"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"query"/);
    });

    test('should define log group for API Gateway', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"/);
    });

    test('should define SNS topic for alarms', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
    });

    test('should define SNS topic subscription', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarms_email"/);
    });

    test('should define Lambda error alarms', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"stripe_validator_errors"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"processor_errors"/);
    });

    test('should define Lambda throttle alarms', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"stripe_validator_throttles"/);
      expect(terraformCode).toMatch(/metric_name\s*=\s*"Throttles"/);
    });

    test('should define API Gateway error rate alarms', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_4xx_error_rate"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_5xx_error_rate"/);
    });

    test('should define API Gateway latency alarm', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_p99_latency"/);
    });

    test('should define DLQ message count alarm', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_message_count"/);
    });

    test('should define DynamoDB alarms', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_user_errors"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_system_errors"/);
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttles"/);
    });
  });

  describe('Outputs', () => {
    test('should output API Gateway endpoint URLs', () => {
      expect(terraformCode).toMatch(/output\s+"api_gateway_endpoint"/);
      expect(terraformCode).toMatch(/output\s+"stripe_webhook_endpoint"/);
      expect(terraformCode).toMatch(/output\s+"paypal_webhook_endpoint"/);
      expect(terraformCode).toMatch(/output\s+"square_webhook_endpoint"/);
    });

    test('should output Lambda function ARNs', () => {
      expect(terraformCode).toMatch(/output\s+"stripe_validator_function_arn"/);
      expect(terraformCode).toMatch(/output\s+"processor_function_arn"/);
      expect(terraformCode).toMatch(/output\s+"query_function_arn"/);
    });

    test('should output DynamoDB table details', () => {
      expect(terraformCode).toMatch(/output\s+"dynamodb_table_name"/);
      expect(terraformCode).toMatch(/output\s+"dynamodb_table_arn"/);
    });

    test('should output S3 bucket names', () => {
      expect(terraformCode).toMatch(/output\s+"raw_payloads_bucket_name"/);
      expect(terraformCode).toMatch(/output\s+"processed_logs_bucket_name"/);
    });

    test('should mark sensitive outputs', () => {
      expect(terraformCode).toMatch(/output\s+"stripe_api_key_id"[\s\S]*?sensitive\s*=\s*true/);
      expect(terraformCode).toMatch(/output\s+"stripe_secret_arn"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('should output environment suffix', () => {
      expect(terraformCode).toMatch(/output\s+"environment_suffix"/);
    });
  });

  describe('Resource Naming with Suffix', () => {
    test('should use env_suffix in DynamoDB table name', () => {
      expect(terraformCode).toMatch(/dynamodb_table_name\s*=\s*"webhook-transactions-\$\{local\.env_suffix\}"/);
    });

    test('should use env_suffix in S3 bucket names', () => {
      expect(terraformCode).toMatch(/\$\{var\.environment\}-\$\{local\.env_suffix\}"/);
    });

    test('should use env_suffix in Lambda function names', () => {
      expect(terraformCode).toMatch(/lambda_.*_name\s*=\s*"\$\{local\.name_prefix\}-.*-\$\{local\.env_suffix\}"/);
    });

    test('should use env_suffix in IAM role names', () => {
      expect(terraformCode).toMatch(/iam_.*_role_name\s*=\s*"\$\{local\.name_prefix\}-.*-role-\$\{local\.env_suffix\}"/);
    });
  });

  describe('Tags', () => {
    test('should apply common_tags to resources', () => {
      const tagsCount = (terraformCode.match(/tags\s*=\s*(local\.common_tags|merge\([\s\S]*?local\.common_tags)/g) || []).length;
      expect(tagsCount).toBeGreaterThan(20);
    });
  });
});
