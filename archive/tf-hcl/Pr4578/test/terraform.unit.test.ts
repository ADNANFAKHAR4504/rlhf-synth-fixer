import fs from 'fs';
import path from 'path';

const libDir = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Existence', () => {
    const requiredFiles = [
      'provider.tf',
      'variables.tf',
      'main.tf',
      'iam.tf',
      'monitoring.tf',
      'outputs.tf',
    ];

    requiredFiles.forEach((file) => {
      test(`${file} should exist`, () => {
        const filePath = path.join(libDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('Lambda functions should exist', () => {
      const apiHandler = path.join(libDir, 'lambda/api_handler.py');
      const metricAggregator = path.join(libDir, 'lambda/metric_aggregator.py');

      expect(fs.existsSync(apiHandler)).toBe(true);
      expect(fs.existsSync(metricAggregator)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    const providerPath = path.join(libDir, 'provider.tf');
    const providerContent = fs.readFileSync(providerPath, 'utf8');

    test('should have AWS provider configured', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('should have required provider version constraint', () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('should have S3 backend configured', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('should use aws_region variable', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe('Variables Configuration', () => {
    const variablesPath = path.join(libDir, 'variables.tf');
    const variablesContent = fs.readFileSync(variablesPath, 'utf8');

    test('should declare aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('should declare environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('should declare project_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test('should declare alert_email_addresses variable', () => {
      expect(variablesContent).toMatch(/variable\s+"alert_email_addresses"\s*{/);
    });

    test('should declare database configuration variables', () => {
      expect(variablesContent).toMatch(/variable\s+"db_username"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"db_password"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"db_instance_class"\s*{/);
    });

    test('should declare threshold variables', () => {
      expect(variablesContent).toMatch(/variable\s+"api_latency_threshold"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"api_error_rate_threshold"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"lambda_error_threshold"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"rds_cpu_threshold"\s*{/);
    });

    test('should have sensitive variables marked as sensitive', () => {
      const dbPasswordMatch = variablesContent.match(
        /variable\s+"db_password"\s*{[^}]*sensitive\s*=\s*true/s
      );
      expect(dbPasswordMatch).toBeTruthy();
    });
  });

  describe('Main Infrastructure Resources', () => {
    const mainPath = path.join(libDir, 'main.tf');
    const mainContent = fs.readFileSync(mainPath, 'utf8');

    test('should not declare provider blocks', () => {
      expect(mainContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test('should create KMS key with encryption', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"monitoring"/);
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should create SNS topic with KMS encryption', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"cloudwatch_alerts"/);
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.monitoring\.id/);
    });

    test('should create DynamoDB table with encryption', () => {
      expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"aggregated_logs"/);
      expect(mainContent).toMatch(/server_side_encryption\s*{/);
      expect(mainContent).toMatch(/enabled\s*=\s*true/);
    });

    test('should enable point-in-time recovery for DynamoDB', () => {
      expect(mainContent).toMatch(/point_in_time_recovery\s*{/);
      expect(mainContent).toMatch(/enabled\s*=\s*true/);
    });

    test('should create VPC resources', () => {
      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should create RDS instance with encryption', () => {
      expect(mainContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.monitoring\.arn/);
    });

    test('should configure RDS backup retention', () => {
      expect(mainContent).toMatch(/backup_retention_period\s*=\s*\d+/);
    });

    test('should disable RDS deletion protection for testing', () => {
      expect(mainContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('should skip final snapshot for RDS', () => {
      expect(mainContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('should create API Gateway', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"/);
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"main"/);
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"/);
    });

    test('should create Lambda functions', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"api_handler"/);
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"metric_aggregator"/);
    });

    test('should configure Lambda with Python 3.12 runtime', () => {
      expect(mainContent).toMatch(/runtime\s*=\s*"python3\.12"/);
    });

    test('should create EventBridge rule', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"metric_aggregation"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_target"/);
    });

    test('should use environment_suffix in resource names', () => {
      const envSuffixMatches = mainContent.match(/\$\{var\.environment_suffix\}/g);
      expect(envSuffixMatches).toBeTruthy();
      expect(envSuffixMatches!.length).toBeGreaterThan(10);
    });

    test('should configure CloudWatch log groups with KMS', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.monitoring\.arn/);
    });
  });

  describe('IAM Configuration', () => {
    const iamPath = path.join(libDir, 'iam.tf');
    const iamContent = fs.readFileSync(iamPath, 'utf8');

    test('should not declare provider blocks', () => {
      expect(iamContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test('should create IAM roles for Lambda functions', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_api_handler"/);
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"metric_aggregator"/);
    });

    test('should create IAM policies with specific resources', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_api_handler"/);
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"metric_aggregator"/);
    });

    test('should attach policies to roles', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
    });

    test('should create API Gateway CloudWatch role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch"/);
    });

    test('should create SNS topic policy for CloudWatch', () => {
      expect(iamContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"cloudwatch_alerts"/);
    });

    test('should use specific resource ARNs instead of wildcards where possible', () => {
      const specificArnCount = (iamContent.match(/aws_\w+\.\w+\.arn/g) || []).length;
      expect(specificArnCount).toBeGreaterThan(5);
    });

    test('should configure KMS key policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_kms_key_policy"\s+"monitoring"/);
    });

    test('should use environment_suffix in IAM resource names', () => {
      const envSuffixMatches = iamContent.match(/\$\{var\.environment_suffix\}/g);
      expect(envSuffixMatches).toBeTruthy();
      expect(envSuffixMatches!.length).toBeGreaterThan(5);
    });
  });

  describe('Monitoring Configuration', () => {
    const monitoringPath = path.join(libDir, 'monitoring.tf');
    const monitoringContent = fs.readFileSync(monitoringPath, 'utf8');

    test('should not declare provider blocks', () => {
      expect(monitoringContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test('should create CloudWatch dashboard', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });

    test('should create API Gateway alarms', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_latency"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_errors"/);
    });

    test('should create Lambda alarms', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_api_handler_errors"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_api_handler_duration"/);
    });

    test('should create RDS alarms', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_connections"/);
    });

    test('should configure alarms with SNS actions', () => {
      expect(monitoringContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.cloudwatch_alerts\.arn\]/);
    });

    test('should create metric filters', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"/);
    });

    test('should have depends_on for alarms on SNS topic', () => {
      expect(monitoringContent).toMatch(/depends_on\s*=\s*\[aws_sns_topic\.cloudwatch_alerts\]/);
    });

    test('should use environment_suffix in monitoring resource names', () => {
      const envSuffixMatches = monitoringContent.match(/\$\{var\.environment_suffix\}/g);
      expect(envSuffixMatches).toBeTruthy();
      expect(envSuffixMatches!.length).toBeGreaterThan(10);
    });
  });

  describe('Outputs Configuration', () => {
    const outputsPath = path.join(libDir, 'outputs.tf');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');

    test('should not declare provider blocks', () => {
      expect(outputsContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test('should output API Gateway invoke URL', () => {
      expect(outputsContent).toMatch(/output\s+"api_gateway_invoke_url"/);
    });

    test('should output API Gateway name and ID', () => {
      expect(outputsContent).toMatch(/output\s+"api_gateway_name"/);
      expect(outputsContent).toMatch(/output\s+"api_gateway_id"/);
    });

    test('should output Lambda function names', () => {
      expect(outputsContent).toMatch(/output\s+"lambda_api_handler_name"/);
      expect(outputsContent).toMatch(/output\s+"lambda_aggregator_name"/);
    });

    test('should output RDS endpoint and instance ID', () => {
      expect(outputsContent).toMatch(/output\s+"rds_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"rds_instance_id"/);
    });

    test('should output DynamoDB table name', () => {
      expect(outputsContent).toMatch(/output\s+"dynamodb_table_name"/);
    });

    test('should output CloudWatch dashboard URL', () => {
      expect(outputsContent).toMatch(/output\s+"cloudwatch_dashboard_url"/);
    });

    test('should output SNS topic ARN', () => {
      expect(outputsContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('should output alarm ARNs', () => {
      expect(outputsContent).toMatch(/output\s+"alarm_arns"/);
    });

    test('should output EventBridge rule ARN', () => {
      expect(outputsContent).toMatch(/output\s+"eventbridge_rule_arn"/);
    });

    test('should output KMS key ID', () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_id"/);
    });

    test('should output log group names', () => {
      expect(outputsContent).toMatch(/output\s+"log_group_names"/);
    });

    test('should output VPC ID', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });
  });

  describe('Resource Tags', () => {
    const mainPath = path.join(libDir, 'main.tf');
    const mainContent = fs.readFileSync(mainPath, 'utf8');

    test('should use common_tags variable', () => {
      expect(mainContent).toMatch(/var\.common_tags/);
    });

    test('should merge tags with resource-specific tags', () => {
      expect(mainContent).toMatch(/merge\(var\.common_tags/);
    });

    test('should include Name tags in resources', () => {
      const nameTagMatches = mainContent.match(/Name\s*=/g);
      expect(nameTagMatches).toBeTruthy();
      expect(nameTagMatches!.length).toBeGreaterThan(10);
    });
  });

  describe('Security Best Practices', () => {
    const mainPath = path.join(libDir, 'main.tf');
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    const iamPath = path.join(libDir, 'iam.tf');
    const iamContent = fs.readFileSync(iamPath, 'utf8');

    test('should enable encryption for storage resources', () => {
      expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(mainContent).toMatch(/server_side_encryption/);
    });

    test('should use security groups for network access control', () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"/);
    });

    test('should not configure API handler Lambda in VPC', () => {
      // API handler Lambda is not in VPC to allow access to AWS services
      // Only RDS needs VPC isolation
      const apiHandlerSection = mainContent.match(/resource "aws_lambda_function" "api_handler"[\s\S]*?^}/m);
      expect(apiHandlerSection).toBeDefined();
      expect(apiHandlerSection![0]).not.toMatch(/vpc_config\s*{/);
    });

    test('should not expose RDS publicly', () => {
      expect(mainContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('should use conditions in IAM policies', () => {
      expect(iamContent).toMatch(/Condition\s*=/);
    });
  });

  describe('Lambda Functions', () => {
    const apiHandlerPath = path.join(libDir, 'lambda/api_handler.py');
    const apiHandlerContent = fs.readFileSync(apiHandlerPath, 'utf8');
    const metricAggregatorPath = path.join(libDir, 'lambda/metric_aggregator.py');
    const metricAggregatorContent = fs.readFileSync(metricAggregatorPath, 'utf8');

    test('API handler should have handler function', () => {
      expect(apiHandlerContent).toMatch(/def handler\(event, context\):/);
    });

    test('API handler should handle health check', () => {
      expect(apiHandlerContent).toMatch(/def handle_health_check/);
      expect(apiHandlerContent).toMatch(/\/health/);
    });

    test('API handler should handle metrics endpoint', () => {
      expect(apiHandlerContent).toMatch(/def handle_metrics_request/);
      expect(apiHandlerContent).toMatch(/\/metrics/);
    });

    test('API handler should use environment variables', () => {
      expect(apiHandlerContent).toMatch(/os\.environ\.get/);
    });

    test('Metric aggregator should have handler function', () => {
      expect(metricAggregatorContent).toMatch(/def handler\(event, context\):/);
    });

    test('Metric aggregator should interact with CloudWatch', () => {
      expect(metricAggregatorContent).toMatch(/cloudwatch/);
      expect(metricAggregatorContent).toMatch(/get_metric_statistics/);
    });

    test('Metric aggregator should interact with DynamoDB', () => {
      expect(metricAggregatorContent).toMatch(/dynamodb/);
      expect(metricAggregatorContent).toMatch(/put_item/);
    });

    test('Metric aggregator should have logging', () => {
      expect(metricAggregatorContent).toMatch(/logging/);
      expect(metricAggregatorContent).toMatch(/logger/);
    });
  });
});
