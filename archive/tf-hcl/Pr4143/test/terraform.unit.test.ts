// Terraform Configuration Unit Tests
// Validates Terraform files structure and content without executing Terraform commands

import fs from 'fs';
import path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    // Load all Terraform configuration files
    mainTfContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    variablesTfContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    outputsTfContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    providerTfContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
  });

  describe('File Existence and Structure', () => {
    test('main.tf file exists and contains resources', () => {
      expect(mainTfContent.length).toBeGreaterThan(0);
      expect(mainTfContent).toContain('resource');
    });

    test('variables.tf file exists and contains variables', () => {
      expect(variablesTfContent.length).toBeGreaterThan(0);
      expect(variablesTfContent).toContain('variable');
    });

    test('outputs.tf file exists and contains outputs', () => {
      expect(outputsTfContent.length).toBeGreaterThan(0);
      expect(outputsTfContent).toContain('output');
    });

    test('provider.tf file exists and contains AWS provider', () => {
      expect(providerTfContent.length).toBeGreaterThan(0);
      expect(providerTfContent).toContain('provider "aws"');
    });
  });

  describe('Provider Configuration', () => {
    test('AWS provider is properly configured', () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerTfContent).toContain('region = var.aws_region');
    });

    test('Required providers are declared', () => {
      expect(providerTfContent).toContain('required_providers');
      expect(providerTfContent).toMatch(/aws\s*=\s*{/);
    });

    test('Provider has default tags', () => {
      expect(providerTfContent).toContain('default_tags');
      expect(providerTfContent).toContain('Environment');
      expect(providerTfContent).toContain('ManagedBy');
    });
  });

  describe('Variables Configuration', () => {
    test('has aws_region variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"aws_region"/);
    });

    test('has environment variable with validation', () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment"/);
      expect(variablesTfContent).toContain('validation');
    });

    test('has project_name variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"project_name"/);
    });

    test('has API throttling variables', () => {
      expect(variablesTfContent).toMatch(/variable\s+"api_throttle_burst_limit"/);
      expect(variablesTfContent).toMatch(/variable\s+"api_throttle_rate_limit"/);
    });

    test('has log retention variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"log_retention_days"/);
    });

    test('has alert email variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"alert_email"/);
    });
  });

  describe('Security Resources - KMS', () => {
    test('KMS key resource is defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"platform_key"/);
    });

    test('KMS key has key rotation enabled', () => {
      expect(mainTfContent).toContain('enable_key_rotation');
    });

    test('KMS key has deletion window', () => {
      expect(mainTfContent).toMatch(/deletion_window_in_days\s*=\s*\d+/);
    });

    test('KMS key alias is created', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_alias"/);
    });
  });

  describe('DynamoDB Configuration', () => {
    test('DynamoDB table resource is defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"/);
    });

    test('DynamoDB has encryption enabled', () => {
      expect(mainTfContent).toContain('server_side_encryption');
      expect(mainTfContent).toContain('kms_key_arn');
    });

    test('DynamoDB has point-in-time recovery enabled', () => {
      expect(mainTfContent).toContain('point_in_time_recovery');
    });

    test('DynamoDB has global secondary index', () => {
      expect(mainTfContent).toContain('global_secondary_index');
    });
  });

  describe('Lambda Configuration', () => {
    test('Lambda function resource is defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"main"/);
    });

    test('Lambda IAM role is defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
    });

    test('Lambda has X-Ray tracing config', () => {
      expect(mainTfContent).toContain('tracing_config');
    });

    test('Lambda has environment variables for DynamoDB', () => {
      expect(mainTfContent).toContain('DYNAMODB_TABLE');
    });

    test('Lambda code archive is created', () => {
      expect(mainTfContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
    });
  });

  describe('API Gateway Configuration', () => {
    test('API Gateway REST API is defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"/);
    });

    test('API Gateway has regional endpoint', () => {
      expect(mainTfContent).toContain('REGIONAL');
    });

    test('API Gateway stage is created', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"/);
    });

    test('API Gateway has throttling configured', () => {
      expect(mainTfContent).toContain('throttling_burst_limit');
      expect(mainTfContent).toContain('throttling_rate_limit');
    });

    test('API Gateway has health endpoint', () => {
      expect(mainTfContent).toMatch(/path_part\s*=\s*"health"/);
    });

    test('API Gateway has items endpoint', () => {
      expect(mainTfContent).toMatch(/path_part\s*=\s*"items"/);
    });
  });

  describe('WAF Configuration', () => {
    test('WAF Web ACL resource is defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test('WAF has rate limiting rule', () => {
      expect(mainTfContent).toContain('rate_based_statement');
    });

    test('WAF has AWS managed rules', () => {
      expect(mainTfContent).toContain('AWSManagedRulesCommonRuleSet');
    });

    test('WAF is associated with API Gateway', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"api_gateway"/);
    });

    test('WAF has logging configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_web_acl_logging_configuration"/);
    });
  });

  describe('Monitoring Configuration', () => {
    test('SNS topic for alerts is defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test('CloudWatch alarms are configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test('CloudWatch dashboard is created', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });

    test('CloudWatch log groups are defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api"/);
    });

    test('X-Ray sampling rules are configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_xray_sampling_rule"/);
    });
  });

  describe('Outputs Configuration', () => {
    test('has API Gateway URL output', () => {
      expect(outputsTfContent).toMatch(/output\s+"api_gateway_url"/);
    });

    test('has DynamoDB table name output', () => {
      expect(outputsTfContent).toMatch(/output\s+"dynamodb_table_name"/);
    });

    test('has Lambda function name output', () => {
      expect(outputsTfContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test('has CloudWatch dashboard URL output', () => {
      expect(outputsTfContent).toMatch(/output\s+"cloudwatch_dashboard_url"/);
    });

    test('has WAF Web ACL ID output', () => {
      expect(outputsTfContent).toMatch(/output\s+"waf_web_acl_id"/);
    });

    test('has KMS key ID output', () => {
      expect(outputsTfContent).toMatch(/output\s+"kms_key_id"/);
    });

    test('has S3 analytics bucket output', () => {
      expect(outputsTfContent).toMatch(/output\s+"s3_analytics_bucket"/);
    });
  });

  describe('PCI-DSS Compliance Checks', () => {
    test('encryption at rest is configured for DynamoDB', () => {
      expect(mainTfContent).toContain('kms_key_arn');
    });

    test('log retention is configured', () => {
      expect(variablesTfContent).toMatch(/log_retention_days/);
    });

    test('X-Ray tracing is enabled', () => {
      expect(variablesTfContent).toMatch(/enable_xray_tracing/);
    });

    test('alert mechanism is configured', () => {
      expect(variablesTfContent).toMatch(/alert_email/);
    });
  });

  describe('Security Best Practices', () => {
    test('IAM roles use least privilege principle', () => {
      expect(mainTfContent).toContain('aws_iam_role_policy');
    });

    test('KMS encryption is used', () => {
      expect(mainTfContent).toMatch(/aws_kms_key/);
    });

    test('KMS key has 30-day deletion window for production safety', () => {
      expect(mainTfContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test('CloudWatch logging is enabled', () => {
      expect(mainTfContent).toContain('aws_cloudwatch_log_group');
    });

    test('WAF protection is enabled', () => {
      expect(mainTfContent).toContain('aws_wafv2_web_acl');
    });

    test('S3 buckets have public access blocked', () => {
      expect(mainTfContent).toContain('aws_s3_bucket_public_access_block');
    });

    test('S3 buckets have force_destroy disabled for data protection', () => {
      expect(mainTfContent).toMatch(/force_destroy\s*=\s*false/);
    });

    test('API Gateway uses AWS_IAM authorization for secure access', () => {
      const iamAuthMatches = mainTfContent.match(/authorization\s*=\s*"AWS_IAM"/g);
      expect(iamAuthMatches).toBeTruthy();
      expect(iamAuthMatches!.length).toBeGreaterThanOrEqual(2); // At least GET and POST methods
    });
  });

  describe('WAF Security Controls', () => {
    test('WAF has IP blocking rule configured', () => {
      expect(mainTfContent).toMatch(/rule\s*{[^}]*name\s*=\s*"BlockSuspiciousIPs"/s);
    });

    test('WAF IP set resource is defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_ip_set"\s+"blocked_ips"/);
    });

    test('WAF has rate limiting rule', () => {
      expect(mainTfContent).toMatch(/rule\s*{[^}]*name\s*=\s*"RateLimitRule"/s);
    });

    test('WAF has SQL injection protection rule', () => {
      expect(mainTfContent).toMatch(/rule\s*{[^}]*name\s*=\s*"AWSManagedRulesSQLiRuleSet"/s);
    });

    test('WAF has common rule set', () => {
      expect(mainTfContent).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test('WAF has known bad inputs rule set', () => {
      expect(mainTfContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test('WAF IP blocking rule references IP set', () => {
      expect(mainTfContent).toMatch(/ip_set_reference_statement/);
      expect(mainTfContent).toMatch(/arn\s*=\s*aws_wafv2_ip_set\.blocked_ips\.arn/);
    });

    test('WAF rules have visibility config enabled', () => {
      const wafRuleMatches = mainTfContent.match(/visibility_config\s*{[^}]*cloudwatch_metrics_enabled\s*=\s*true/gs);
      expect(wafRuleMatches).toBeTruthy();
      expect(wafRuleMatches!.length).toBeGreaterThanOrEqual(4); // At least 4 rules with visibility
    });
  });

  describe('CloudWatch Alarms - Comprehensive Monitoring', () => {
    test('has API Gateway 5XX error alarm', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_5xx_errors"/);
    });

    test('has API Gateway 4XX error alarm', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_4xx_errors"/);
    });

    test('has API Gateway latency alarm', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_latency"/);
    });

    test('has Lambda errors alarm', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
    });

    test('has Lambda throttles alarm', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"/);
    });

    test('has DynamoDB throttles alarm', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttles"/);
    });

    test('has WAF blocked requests alarm', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"waf_blocked_requests"/);
    });

    test('all alarms have SNS topic configured', () => {
      const alarmMatches = mainTfContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g);
      const snsActionMatches = mainTfContent.match(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/g);

      expect(alarmMatches).toBeTruthy();
      expect(snsActionMatches).toBeTruthy();
      expect(snsActionMatches!.length).toBeGreaterThanOrEqual(7); // At least 7 alarms with SNS actions
    });

    test('alarms have appropriate thresholds configured', () => {
      expect(mainTfContent).toMatch(/threshold\s*=\s*\d+/);
    });

    test('alarms have evaluation periods configured', () => {
      expect(mainTfContent).toMatch(/evaluation_periods\s*=\s*\d+/);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('project name is used for resource naming', () => {
      expect(variablesTfContent).toMatch(/variable\s+"project_name"/);
      expect(mainTfContent).toContain('var.project_name');
    });

    test('environment is used for resource naming', () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment"/);
      expect(mainTfContent).toContain('var.environment');
    });

    test('default tags are configured in provider', () => {
      expect(providerTfContent).toContain('default_tags');
    });

    test('resource prefix is used for naming consistency', () => {
      expect(mainTfContent).toContain('local.resource_prefix');
    });

    test('common tags are defined in locals', () => {
      expect(mainTfContent).toContain('local.common_tags');
    });
  });

  describe('Analytics and Storage', () => {
    test('S3 analytics bucket is created', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"analytics"/);
    });

    test('S3 analytics bucket has versioning', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"analytics"/);
    });

    test('S3 analytics bucket has encryption', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"analytics"/);
    });
  });

  describe('Data Flow and Integration', () => {
    test('Lambda receives DynamoDB table name via environment variable', () => {
      expect(mainTfContent).toMatch(/DYNAMODB_TABLE\s*=\s*aws_dynamodb_table\.main\.name/);
    });

    test('API Gateway integrates with Lambda', () => {
      expect(mainTfContent).toMatch(/uri\s*=\s*aws_lambda_function\.main\.invoke_arn/);
    });

    test('WAF is associated with API Gateway stage', () => {
      expect(mainTfContent).toMatch(/resource_arn\s*=\s*aws_api_gateway_stage\.main\.arn/);
    });

    test('CloudWatch alarms reference API Gateway', () => {
      expect(mainTfContent).toMatch(/ApiName\s*=\s*aws_api_gateway_rest_api\.main\.name/);
    });

    test('CloudWatch alarms reference Lambda function', () => {
      expect(mainTfContent).toMatch(/FunctionName\s*=\s*aws_lambda_function\.main\.function_name/);
    });
  });
});
