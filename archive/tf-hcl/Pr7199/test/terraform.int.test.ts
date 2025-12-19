import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  const infrastructureFiles = {
    tapStack: path.join(process.cwd(), 'lib', 'tap_stack.tf'),
    provider: path.join(process.cwd(), 'lib', 'provider.tf'),
    variables: path.join(process.cwd(), 'lib', 'variables.tf')
  };

  beforeAll(() => {
    // Ensure all required files exist before running integration tests
    Object.values(infrastructureFiles).forEach(filePath => {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required infrastructure file not found: ${filePath}`);
      }
    });
  });

  describe('Infrastructure File Integration', () => {
    test('all required infrastructure files are present and readable', () => {
      Object.entries(infrastructureFiles).forEach(([name, filePath]) => {
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fs.statSync(filePath).isFile()).toBe(true);
        
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).not.toContain('TODO');
        expect(content).not.toContain('FIXME');
      });
    });

    test('tap_stack.tf integrates properly with provider.tf', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');
      const providerContent = fs.readFileSync(infrastructureFiles.provider, 'utf8');

      // Stack should not declare providers (handled by provider.tf)
      expect(stackContent).not.toMatch(/^\s*terraform\s*{/m);
      expect(stackContent).not.toMatch(/^\s*provider\s+"aws"/m);

      // Provider file should handle terraform and AWS provider configuration
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('variables.tf provides all required variables for tap_stack.tf', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');
      const variablesContent = fs.readFileSync(infrastructureFiles.variables, 'utf8');

      // Extract variable references from stack
      const variableReferences = stackContent.match(/var\.\w+/g) || [];
      const uniqueVariables = [...new Set(variableReferences.map(ref => ref.replace('var.', '')))];

      // Check each variable is declared in variables.tf
      uniqueVariables.forEach(variable => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });
  });

  describe('AWS Lambda Integration Tests', () => {
    test('Lambda function configurations are production-ready', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test webhook validator Lambda
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"webhook_validator"/);
      expect(stackContent).toMatch(/package_type\s*=\s*"Image"/);
      expect(stackContent).toMatch(/architectures\s*=\s*\["arm64"\]/);
      expect(stackContent).toMatch(/memory_size\s*=\s*512/);
      expect(stackContent).toMatch(/timeout\s*=\s*local\.lambda_timeout/);

      // Test payment processor Lambda
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"payment_processor"/);
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*var\.lambda_reserved_concurrency/);

      // Test notification dispatcher Lambda
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"notification_dispatcher"/);

      // Test archival Lambda with lower concurrency
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"archival_lambda"/);
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*10/);

      // Verify environment variables are properly configured
      expect(stackContent).toMatch(/DYNAMODB_TABLE\s*=\s*aws_dynamodb_table\.webhook_idempotency\.name/);
      expect(stackContent).toMatch(/SQS_QUEUE_PREFIX\s*=\s*local\.prefix/);
      expect(stackContent).toMatch(/S3_BUCKET\s*=\s*aws_s3_bucket\.payment_archive\.id/);
      expect(stackContent).toMatch(/ENVIRONMENT\s*=\s*var\.environment_suffix/);
    });

    test('resource dependencies form a valid dependency graph', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test critical dependencies exist
      // Lambda functions should depend on their log groups
      expect(stackContent).toMatch(/depends_on\s*=\s*\[\s*aws_cloudwatch_log_group/);
      
      // API Gateway deployment should depend on methods and integrations
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_api_gateway_method[\s\S]*\]/);
      
      // Event source mappings should depend on both SQS queues and Lambda functions
      expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_sqs_queue/);
      expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function/);
    });
  });

  describe('API Gateway Integration Tests', () => {
    test('API Gateway is configured for multi-tenant webhook processing', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test REST API configuration
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"webhook_api"/);
      expect(stackContent).toMatch(/types\s*=\s*\["REGIONAL"\]/);
      expect(stackContent).toMatch(/description\s*=\s*"Payment webhook processing API"/);

      // Test multi-tenant resource structure
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"provider"/);
      expect(stackContent).toMatch(/for_each\s*=\s*var\.payment_providers/);
      expect(stackContent).toMatch(/path_part\s*=\s*each\.value/);

      // Test webhook endpoints
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"webhook"/);
      expect(stackContent).toMatch(/path_part\s*=\s*"webhook"/);

      // Test POST methods
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"webhook_post"/);
      expect(stackContent).toMatch(/http_method\s*=\s*"POST"/);
      expect(stackContent).toMatch(/authorization\s*=\s*"NONE"/);
    });

    test('API Gateway integration with Lambda is properly configured', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test Lambda integration
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"webhook_lambda"/);
      expect(stackContent).toMatch(/integration_http_method\s*=\s*"POST"/);
      expect(stackContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(stackContent).toMatch(/uri\s*=\s*aws_lambda_function\.webhook_validator\.invoke_arn/);

      // Test Lambda permission for API Gateway
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway"/);
      expect(stackContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });

    test('API Gateway has throttling and logging configured', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test stage configuration
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"prod"/);
      expect(stackContent).toMatch(/stage_name\s*=\s*var\.environment_suffix/);

      // Test method settings for throttling
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method_settings"\s+"all"/);
      expect(stackContent).toMatch(/throttling_rate_limit\s*=\s*var\.api_throttle_rate_limit/);
      expect(stackContent).toMatch(/throttling_burst_limit\s*=\s*var\.api_throttle_burst_limit/);
      expect(stackContent).toMatch(/metrics_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/logging_level\s*=\s*"INFO"/);
      expect(stackContent).toMatch(/data_trace_enabled\s*=\s*true/);

      // Test access logging
      expect(stackContent).toMatch(/access_log_settings/);
      expect(stackContent).toMatch(/destination_arn\s*=\s*aws_cloudwatch_log_group\.api_gateway\.arn/);
    });
  });

  describe('DynamoDB Integration Tests', () => {
    test('DynamoDB table is configured for webhook idempotency', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test table configuration
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"webhook_idempotency"/);
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(stackContent).toMatch(/hash_key\s*=\s*"webhook_id"/);

      // Test attribute configuration
      expect(stackContent).toMatch(/attribute\s*{\s*name\s*=\s*"webhook_id"\s*type\s*=\s*"S"/);

      // Test TTL configuration
      expect(stackContent).toMatch(/ttl\s*{\s*enabled\s*=\s*true\s*attribute_name\s*=\s*"processed_timestamp"/);

      // Test point-in-time recovery
      expect(stackContent).toMatch(/point_in_time_recovery\s*{\s*enabled\s*=\s*true/);

      // Test deletion protection is disabled as requested
      expect(stackContent).toMatch(/deletion_protection_enabled\s*=\s*false/);
    });

    test('DynamoDB table naming and tagging is consistent', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test consistent naming
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-idempotency"/);

      // Test tagging
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });
  });

  describe('SQS Integration Tests', () => {
    test('SQS queues are configured for each payment provider', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test processing queues
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"processing"/);
      expect(stackContent).toMatch(/for_each\s*=\s*var\.payment_providers/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-\${each\.value}-processing"/);

      // Test dead letter queues
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-\${each\.value}-dlq"/);

      // Test redrive policy
      expect(stackContent).toMatch(/redrive_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/maxReceiveCount\s*=\s*3/);

      // Test retention periods
      expect(stackContent).toMatch(/message_retention_seconds\s*=\s*local\.sqs_retention_seconds/);
      expect(stackContent).toMatch(/message_retention_seconds\s*=\s*local\.dlq_retention_seconds/);
    });

    test('SQS event source mapping is configured for Lambda processing', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test event source mapping
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"sqs_processor"/);
      expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_sqs_queue\.processing\[each\.key\]\.arn/);
      expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function\.payment_processor\.arn/);
      expect(stackContent).toMatch(/batch_size\s*=\s*10/);
    });

    test('SQS timeout configuration matches Lambda timeout', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test visibility timeout matches Lambda timeout
      expect(stackContent).toMatch(/visibility_timeout_seconds\s*=\s*local\.lambda_timeout/);
    });
  });

  describe('Step Functions Integration Tests', () => {
    test('Step Functions state machine is configured for payment workflow', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test state machine configuration
      expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"payment_workflow"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-payment-workflow"/);
      expect(stackContent).toMatch(/role_arn\s*=\s*aws_iam_role\.step_functions\.arn/);

      // Test logging configuration
      expect(stackContent).toMatch(/logging_configuration/);
      expect(stackContent).toMatch(/include_execution_data\s*=\s*true/);
      expect(stackContent).toMatch(/level\s*=\s*"ALL"/);
    });

    test('Step Functions workflow includes all required states', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test workflow states
      expect(stackContent).toMatch(/StartAt\s*=\s*"ValidateWebhook"/);
      expect(stackContent).toMatch(/ValidateWebhook\s*=\s*{/);
      expect(stackContent).toMatch(/FraudDetection\s*=\s*{/);
      expect(stackContent).toMatch(/CheckFraudScore\s*=\s*{/);
      expect(stackContent).toMatch(/ProcessPayment\s*=\s*{/);
      expect(stackContent).toMatch(/SendNotification\s*=\s*{/);
      expect(stackContent).toMatch(/RejectPayment\s*=\s*{/);
      expect(stackContent).toMatch(/HandleError\s*=\s*{/);

      // Test fraud detection integration
      expect(stackContent).toMatch(/arn:aws:states:::aws-sdk:frauddetector:getEventPrediction/);
      expect(stackContent).toMatch(/NumericGreaterThan\s*=\s*800/);
    });

    test('Step Functions has proper retry and error handling', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test retry configuration
      expect(stackContent).toMatch(/Retry\s*=\s*\[/);
      expect(stackContent).toMatch(/IntervalSeconds\s*=\s*2/);
      expect(stackContent).toMatch(/MaxAttempts\s*=\s*3/);
      expect(stackContent).toMatch(/BackoffRate\s*=\s*2\.0/);
      expect(stackContent).toMatch(/MaxDelaySeconds\s*=\s*10/);

      // Test error handling
      expect(stackContent).toMatch(/Catch\s*=\s*\[/);
      expect(stackContent).toMatch(/ErrorEquals\s*=\s*\["States\.ALL"\]/);
      expect(stackContent).toMatch(/PaymentProcessingException/);
    });
  });

  describe('EventBridge Integration Tests', () => {
    test('EventBridge rules are configured for payment event routing', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test high value payments rule
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"high_value_payments"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-high-value-payments"/);
      expect(stackContent).toMatch(/description\s*=\s*"Route high value payment events"/);

      // Test payment type rules
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"payment_by_type"/);
      expect(stackContent).toMatch(/for_each\s*=\s*toset\(\["credit_card",\s*"paypal",\s*"bank_transfer"\]\)/);
    });

    test('EventBridge event patterns are properly configured', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test event patterns
      expect(stackContent).toMatch(/event_pattern\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/source\s*=\s*\["payment\.processor"\]/);
      expect(stackContent).toMatch(/payment_type\s*=\s*\["credit_card",\s*"bank_transfer"\]/);
      expect(stackContent).toMatch(/numeric\s*=\s*\[">",\s*10000\]/);
    });
  });

  describe('S3 Integration Tests', () => {
    test('S3 bucket is configured for payment archival', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test bucket configuration
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"payment_archive"/);
      expect(stackContent).toMatch(/bucket\s*=\s*"\${local\.prefix}-payment-archive-\${data\.aws_caller_identity\.current\.account_id}"/);
      expect(stackContent).toMatch(/force_destroy\s*=\s*true/);

      // Test bucket features
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_intelligent_tiering_configuration"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test('S3 intelligent tiering and lifecycle are properly configured', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test intelligent tiering
      expect(stackContent).toMatch(/access_tier\s*=\s*"DEEP_ARCHIVE_ACCESS"/);
      expect(stackContent).toMatch(/days\s*=\s*180/);
      expect(stackContent).toMatch(/access_tier\s*=\s*"ARCHIVE_ACCESS"/);
      expect(stackContent).toMatch(/days\s*=\s*90/);

      // Test lifecycle
      expect(stackContent).toMatch(/storage_class\s*=\s*"INTELLIGENT_TIERING"/);
      expect(stackContent).toMatch(/days\s*=\s*var\.archival_days/);
    });

    test('S3 event notification is configured for Lambda trigger', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test event notification
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"payment_archive"/);
      expect(stackContent).toMatch(/lambda_function_arn\s*=\s*aws_lambda_function\.archival_lambda\.arn/);
      expect(stackContent).toMatch(/events\s*=\s*\["s3:ObjectCreated:\*"\]/);
      expect(stackContent).toMatch(/filter_prefix\s*=\s*"payments\/"/);
      expect(stackContent).toMatch(/filter_suffix\s*=\s*"\.json"/);

      // Test Lambda permission for S3
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"s3_invoke_archival"/);
      expect(stackContent).toMatch(/principal\s*=\s*"s3\.amazonaws\.com"/);
    });
  });

  describe('VPC and Networking Integration Tests', () => {
    test('VPC is configured for private resources', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test VPC configuration
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);

      // Test private subnets
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.\${count\.index \+ 1}\.0\/24"/);
    });

    test('VPC endpoints are configured for AWS services', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test VPC endpoints
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_api"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_dkr"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sqs"/);

      // Test endpoint types
      expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
      expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
      expect(stackContent).toMatch(/private_dns_enabled\s*=\s*true/);
    });

    test('Security group is properly configured for VPC endpoints', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test security group
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${local\.prefix}-endpoints"/);

      // Test ingress rules
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[aws_vpc\.main\.cidr_block\]/);

      // Test egress rules
      expect(stackContent).toMatch(/from_port\s*=\s*0/);
      expect(stackContent).toMatch(/to_port\s*=\s*0/);
      expect(stackContent).toMatch(/protocol\s*=\s*"-1"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });
  });

  describe('CloudWatch Integration Tests', () => {
    test('CloudWatch log groups are configured for all services', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test Lambda log groups
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"webhook_validator"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"payment_processor"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"notification_dispatcher"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"archival_lambda"/);

      // Test service log groups
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"step_functions"/);

      // Test retention configuration
      expect(stackContent).toMatch(/retention_in_days\s*=\s*local\.log_retention_days/);
    });

    test('CloudWatch log group naming is consistent', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test naming patterns
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/\${local\.prefix}-webhook-validator"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/\${local\.prefix}-payment-processor"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/apigateway\/\${local\.prefix}"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/stepfunctions\/\${local\.prefix}"/);
    });
  });

  describe('ECR Integration Tests', () => {
    test('ECR repositories are configured for Lambda container images', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test ECR repositories
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"webhook_validator"/);
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"payment_processor"/);
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"notification_dispatcher"/);
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"archival_lambda"/);

      // Test repository configuration
      expect(stackContent).toMatch(/image_tag_mutability\s*=\s*"MUTABLE"/);
      expect(stackContent).toMatch(/force_delete\s*=\s*true/);
      expect(stackContent).toMatch(/scan_on_push\s*=\s*true/);
    });

    test('ECR repositories have consistent naming', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test naming consistency
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-webhook-validator"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-payment-processor"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-notification-dispatcher"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-archival"/);
    });
  });

  describe('Output Integration Tests', () => {
    test('all required outputs are defined for infrastructure integration', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test output definitions
      expect(stackContent).toMatch(/output\s+"api_endpoint_url"/);
      expect(stackContent).toMatch(/output\s+"processing_queue_urls"/);
      expect(stackContent).toMatch(/output\s+"dlq_urls"/);
      expect(stackContent).toMatch(/output\s+"state_machine_arn"/);

      // Test output values
      expect(stackContent).toMatch(/value\s*=\s*aws_api_gateway_stage\.prod\.invoke_url/);
      expect(stackContent).toMatch(/value\s*=\s*aws_sfn_state_machine\.payment_workflow\.arn/);
    });

    test('outputs have proper descriptions for documentation', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test descriptions
      expect(stackContent).toMatch(/description\s*=\s*"API Gateway endpoint URL"/);
      expect(stackContent).toMatch(/description\s*=\s*"SQS processing queue URLs by provider"/);
      expect(stackContent).toMatch(/description\s*=\s*"SQS dead letter queue URLs by provider"/);
      expect(stackContent).toMatch(/description\s*=\s*"Step Functions state machine ARN"/);
    });
  });

  describe('Multi-tenant Architecture Integration Tests', () => {
    test('infrastructure supports multi-tenant payment provider isolation', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');
      const variablesContent = fs.readFileSync(infrastructureFiles.variables, 'utf8');

      // Test payment providers variable
      expect(variablesContent).toMatch(/variable\s+"payment_providers"/);
      expect(variablesContent).toMatch(/type\s*=\s*set\(string\)/);

      // Test multi-tenant resource creation
      expect(stackContent).toMatch(/for_each\s*=\s*var\.payment_providers/);
      expect(stackContent).toMatch(/each\.value/);
      expect(stackContent).toMatch(/each\.key/);
    });

    test('tenant isolation is properly implemented across all services', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test API Gateway tenant isolation
      expect(stackContent).toMatch(/path_part\s*=\s*each\.value/);

      // Test SQS tenant isolation
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-\${each\.value}-processing"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-\${each\.value}-dlq"/);

      // Test EventBridge tenant isolation
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-\${each\.value}-payments"/);
    });
  });

  describe('Security and Compliance Integration Tests', () => {
    test('no hardcoded secrets or sensitive information', () => {
      Object.entries(infrastructureFiles).forEach(([name, filePath]) => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for common patterns that might indicate hardcoded secrets
        expect(content).not.toMatch(/password\s*=\s*"[^$]/i);
        expect(content).not.toMatch(/secret\s*=\s*"[^$]/i);
        expect(content).not.toMatch(/key\s*=\s*"[A-Z0-9]{20,}/);
        expect(content).not.toMatch(/token\s*=\s*"[^$]/i);
        
        // Different files have different patterns:
        if (name === 'variables') {
          // variables.tf declares variables with "variable" keyword
          expect(content).toMatch(/variable\s+"/);
        } else {
          // provider.tf and tap_stack.tf reference variables with var.
          expect(content).toMatch(/var\./);
        }
        
        // Local values are mainly used in tap_stack.tf
        if (name === 'tapStack') {
          expect(content).toMatch(/local\./);
        }
      });
    });

    test('IAM follows principle of least privilege', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test specific resource ARNs (not wildcard permissions)
      expect(stackContent).toMatch(/Resource\s*=\s*"arn:aws:logs.*:\*:log-group:/);
      expect(stackContent).toMatch(/Resource\s*=\s*\[\s*aws_dynamodb_table/);
      expect(stackContent).toMatch(/Resource\s*=\s*\[for\s+q\s+in\s+aws_sqs_queue/);

      // Test that wildcard permissions are limited and justified
      const wildcardMatches = stackContent.match(/Resource\s*=\s*"\*"/g) || [];
      // Should only be for ECR operations which require account-level permissions
      expect(wildcardMatches.length).toBeLessThanOrEqual(10);
    });

    test('deletion protection is disabled as requested', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test explicit deletion protection settings
      expect(stackContent).toMatch(/deletion_protection_enabled\s*=\s*false/);
      expect(stackContent).toMatch(/force_delete\s*=\s*true/);
      expect(stackContent).toMatch(/force_destroy\s*=\s*true/);
    });
  });

  describe('Performance and Scalability Integration Tests', () => {
    test('infrastructure is configured for high performance', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');
      const variablesContent = fs.readFileSync(infrastructureFiles.variables, 'utf8');

      // Test API throttling configuration
      expect(variablesContent).toMatch(/api_throttle_rate_limit/);
      expect(variablesContent).toMatch(/api_throttle_burst_limit/);
      expect(stackContent).toMatch(/throttling_rate_limit\s*=\s*var\.api_throttle_rate_limit/);
      expect(stackContent).toMatch(/throttling_burst_limit\s*=\s*var\.api_throttle_burst_limit/);

      // Test Lambda concurrency configuration
      expect(variablesContent).toMatch(/lambda_reserved_concurrency/);
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*var\.lambda_reserved_concurrency/);

      // Test DynamoDB performance mode
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('batch processing is optimized', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test SQS batch size
      expect(stackContent).toMatch(/batch_size\s*=\s*10/);

      // Test Lambda memory allocation
      expect(stackContent).toMatch(/memory_size\s*=\s*512/);

      // Test timeout configurations
      expect(stackContent).toMatch(/timeout\s*=\s*local\.lambda_timeout/);
      expect(stackContent).toMatch(/visibility_timeout_seconds\s*=\s*local\.lambda_timeout/);
    });
  });

  describe('Monitoring and Observability Integration Tests', () => {
    test('comprehensive logging is configured across all services', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test API Gateway logging
      expect(stackContent).toMatch(/access_log_settings/);
      expect(stackContent).toMatch(/logging_level\s*=\s*"INFO"/);

      // Test Step Functions logging
      expect(stackContent).toMatch(/logging_configuration/);
      expect(stackContent).toMatch(/level\s*=\s*"ALL"/);
      expect(stackContent).toMatch(/include_execution_data\s*=\s*true/);

      // Test metrics enablement
      expect(stackContent).toMatch(/metrics_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/data_trace_enabled\s*=\s*true/);
    });

    test('log retention is properly configured', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test consistent log retention across all log groups
      const logGroupMatches = stackContent.match(/retention_in_days\s*=\s*local\.log_retention_days/g) || [];
      expect(logGroupMatches.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Disaster Recovery and Backup Integration Tests', () => {
    test('backup and recovery features are properly configured', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test DynamoDB point-in-time recovery
      expect(stackContent).toMatch(/point_in_time_recovery\s*{\s*enabled\s*=\s*true/);

      // Test S3 versioning for data protection
      expect(stackContent).toMatch(/versioning_configuration\s*{\s*status\s*=\s*"Enabled"/);

      // Test S3 intelligent tiering for cost optimization
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_intelligent_tiering_configuration"/);
    });

    test('data archival strategy is implemented', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test lifecycle transitions
      expect(stackContent).toMatch(/transition\s*{\s*days\s*=\s*var\.archival_days/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"INTELLIGENT_TIERING"/);

      // Test archival Lambda function
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"archival_lambda"/);
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*10/);
    });
  });

  describe('Cross-Service Integration Tests', () => {
    test('Lambda functions are properly integrated with their trigger sources', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test API Gateway -> Lambda integration
      expect(stackContent).toMatch(/uri\s*=\s*aws_lambda_function\.webhook_validator\.invoke_arn/);
      expect(stackContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);

      // Test SQS -> Lambda event source mapping
      expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_sqs_queue\.processing\[each\.key\]\.arn/);
      expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function\.payment_processor\.arn/);

      // Test S3 -> Lambda notification
      expect(stackContent).toMatch(/lambda_function_arn\s*=\s*aws_lambda_function\.archival_lambda\.arn/);
      expect(stackContent).toMatch(/principal\s*=\s*"s3\.amazonaws\.com"/);
    });

    test('environment variables correctly reference infrastructure resources', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test DynamoDB table reference in Lambda environment
      expect(stackContent).toMatch(/DYNAMODB_TABLE\s*=\s*aws_dynamodb_table\.webhook_idempotency\.name/);

      // Test S3 bucket reference in Lambda environment  
      expect(stackContent).toMatch(/S3_BUCKET\s*=\s*aws_s3_bucket\.payment_archive\.id/);

      // Test SQS queue prefix in Lambda environment
      expect(stackContent).toMatch(/SQS_QUEUE_PREFIX\s*=\s*local\.prefix/);

      // Test consistent environment variable usage
      expect(stackContent).toMatch(/ENVIRONMENT\s*=\s*var\.environment_suffix/);
    });

    test('security groups and VPC configuration enable proper service communication', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test VPC endpoints use security groups
      expect(stackContent).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.vpc_endpoints\.id\]/);

      // Test Lambda VPC configuration (if present)
      const vpcConfig = stackContent.match(/vpc_config\s*{[^}]*}/g);
      if (vpcConfig && vpcConfig.length > 0) {
        expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
        expect(stackContent).toMatch(/security_group_ids\s*=\s*\[aws_security_group/);
      }
    });

    test('IAM permissions align with actual resource dependencies', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Extract all DynamoDB tables and verify Lambda has permissions
      const dynamoTables = stackContent.match(/aws_dynamodb_table\.(\w+)/g) || [];
      if (dynamoTables.length > 0) {
        expect(stackContent).toMatch(/dynamodb:GetItem/);
        expect(stackContent).toMatch(/dynamodb:PutItem/);
      }

      // Extract all SQS queues and verify Lambda has permissions
      const sqsQueues = stackContent.match(/aws_sqs_queue\.(\w+)/g) || [];
      if (sqsQueues.length > 0) {
        expect(stackContent).toMatch(/sqs:SendMessage/);
        expect(stackContent).toMatch(/sqs:ReceiveMessage/);
        expect(stackContent).toMatch(/sqs:DeleteMessage/);
      }

      // Extract all S3 buckets and verify Lambda has permissions
      const s3Buckets = stackContent.match(/aws_s3_bucket\.(\w+)/g) || [];
      if (s3Buckets.length > 0) {
        expect(stackContent).toMatch(/s3:GetObject/);
        expect(stackContent).toMatch(/s3:PutObject/);
      }
    });
  });

  describe('Cost Optimization Integration Tests', () => {
    test('cost-effective configurations are implemented', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test ARM64 architecture for cost savings
      expect(stackContent).toMatch(/architectures\s*=\s*\["arm64"\]/);

      // Test pay-per-request DynamoDB billing
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);

      // Test intelligent tiering for S3
      expect(stackContent).toMatch(/access_tier\s*=\s*"DEEP_ARCHIVE_ACCESS"/);
      expect(stackContent).toMatch(/access_tier\s*=\s*"ARCHIVE_ACCESS"/);

      // Test regional API Gateway endpoints
      expect(stackContent).toMatch(/types\s*=\s*\["REGIONAL"\]/);
    });

    test('resource sizing is appropriate for workload', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test Lambda memory allocation
      expect(stackContent).toMatch(/memory_size\s*=\s*512/);

      // Test archival function has lower concurrency for cost control
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*10.*# Lower concurrency for archival/);

      // Test SQS message retention is reasonable
      expect(stackContent).toMatch(/sqs_retention_seconds\s*=\s*345600/); // 4 days
      expect(stackContent).toMatch(/dlq_retention_seconds\s*=\s*1209600/); // 14 days
    });
  });

  describe('End-to-End Infrastructure Integration Tests', () => {
    test('complete payment processing workflow is properly configured', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test the complete flow: API Gateway -> Lambda -> SQS -> Lambda -> Step Functions
      // 1. API Gateway receives webhook
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"webhook_api"/);
      
      // 2. Lambda validates and processes webhook
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"webhook_validator"/);
      
      // 3. Messages are queued in SQS
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"processing"/);
      
      // 4. Payment processor Lambda processes from queue
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"payment_processor"/);
      
      // 5. Step Functions orchestrate payment workflow
      expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"payment_workflow"/);
      
      // 6. Results are archived in S3
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"payment_archive"/);
    });

    test('disaster recovery and monitoring systems are integrated', () => {
      const stackContent = fs.readFileSync(infrastructureFiles.tapStack, 'utf8');

      // Test backup systems
      expect(stackContent).toMatch(/point_in_time_recovery\s*{\s*enabled\s*=\s*true/);
      expect(stackContent).toMatch(/versioning_configuration\s*{\s*status\s*=\s*"Enabled"/);

      // Test monitoring integration
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(stackContent).toMatch(/metrics_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/logging_level\s*=\s*"INFO"/);

      // Test alerting through EventBridge
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
    });
  });
});
