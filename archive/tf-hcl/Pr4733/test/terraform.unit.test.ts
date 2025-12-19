// Unit tests for Terraform HCL infrastructure
// Tests validate configuration without executing terraform commands

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read file content
function readFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// Helper function to check if content contains pattern
function contains(content: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    return content.includes(pattern);
  }
  return pattern.test(content);
}

describe('Terraform Infrastructure - File Existence', () => {
  test('main.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'main.tf'))).toBe(true);
  });

  test('provider.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
  });

  test('variables.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
  });

  test('security.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'security.tf'))).toBe(true);
  });

  test('monitoring.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'monitoring.tf'))).toBe(true);
  });

  test('outputs.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
  });

  test('lambda_authorizer.py exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'lambda_authorizer.py'))).toBe(true);
  });

  test('lambda_transaction.py exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'lambda_transaction.py'))).toBe(true);
  });
});

describe('Terraform Infrastructure - Provider Configuration', () => {
  const providerContent = readFile('provider.tf');
  const mainContent = readFile('main.tf');

  test('provider.tf contains terraform block', () => {
    expect(contains(providerContent, /terraform\s*{/)).toBe(true);
  });

  test('provider.tf contains S3 backend', () => {
    expect(contains(providerContent, 'backend "s3"')).toBe(true);
  });

  test('provider.tf has primary region provider', () => {
    expect(contains(providerContent, 'alias  = "primary"')).toBe(true);
  });

  test('provider.tf has secondary region provider', () => {
    expect(contains(providerContent, 'alias  = "secondary"')).toBe(true);
  });

  test('provider.tf has global provider for CloudFront/Route53', () => {
    expect(contains(providerContent, 'alias  = "global"')).toBe(true);
  });

  test('main.tf does NOT contain provider block', () => {
    expect(contains(mainContent, /^provider\s+"aws"\s*{/m)).toBe(false);
  });

  test('main.tf does NOT contain terraform block', () => {
    expect(contains(mainContent, /^terraform\s*{/m)).toBe(false);
  });
});

describe('Terraform Infrastructure - Required Variables', () => {
  const variablesContent = readFile('variables.tf');

  test('has project_name variable', () => {
    expect(contains(variablesContent, 'variable "project_name"')).toBe(true);
  });

  test('has primary_region variable', () => {
    expect(contains(variablesContent, 'variable "primary_region"')).toBe(true);
  });

  test('has secondary_region variable', () => {
    expect(contains(variablesContent, 'variable "secondary_region"')).toBe(true);
  });

  test('has enable_route53 variable with default false', () => {
    expect(contains(variablesContent, 'variable "enable_route53"')).toBe(true);
    expect(contains(variablesContent, /enable_route53"[\s\S]*?default\s*=\s*false/)).toBe(true);
  });

  test('has domain_name variable', () => {
    expect(contains(variablesContent, 'variable "domain_name"')).toBe(true);
  });

  test('has master_api_key variable marked as sensitive', () => {
    expect(contains(variablesContent, 'variable "master_api_key"')).toBe(true);
    expect(contains(variablesContent, /master_api_key"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
  });

  test('has jwt_secret variable marked as sensitive', () => {
    expect(contains(variablesContent, 'variable "jwt_secret"')).toBe(true);
    expect(contains(variablesContent, /jwt_secret"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
  });

  test('has alarm_email variable', () => {
    expect(contains(variablesContent, 'variable "alarm_email"')).toBe(true);
  });

  test('has enable_vpc variable', () => {
    expect(contains(variablesContent, 'variable "enable_vpc"')).toBe(true);
  });

  test('has xray_sampling_rate variable', () => {
    expect(contains(variablesContent, 'variable "xray_sampling_rate"')).toBe(true);
  });
});

describe('Terraform Infrastructure - Core Resources', () => {
  const mainContent = readFile('main.tf');

  test('has DynamoDB table resource', () => {
    expect(contains(mainContent, 'resource "aws_dynamodb_table" "transactions"')).toBe(true);
  });

  test('has DynamoDB Global Table v2 with replica configuration', () => {
    // Global Table v2 uses replica block within the table resource
    expect(contains(mainContent, /resource "aws_dynamodb_table" "transactions"[\s\S]*?replica\s*{/)).toBe(true);
  });

  test('has API Gateway REST API resources for both regions', () => {
    expect(contains(mainContent, 'resource "aws_api_gateway_rest_api" "main_primary"')).toBe(true);
    expect(contains(mainContent, 'resource "aws_api_gateway_rest_api" "main_secondary"')).toBe(true);
  });

  test('has Lambda authorizer functions', () => {
    expect(contains(mainContent, 'resource "aws_lambda_function" "authorizer_primary"')).toBe(true);
    expect(contains(mainContent, 'resource "aws_lambda_function" "authorizer_secondary"')).toBe(true);
  });

  test('has Lambda transaction functions', () => {
    expect(contains(mainContent, 'resource "aws_lambda_function" "transaction_primary"')).toBe(true);
    expect(contains(mainContent, 'resource "aws_lambda_function" "transaction_secondary"')).toBe(true);
  });

  test('has CloudFront distribution', () => {
    expect(contains(mainContent, 'resource "aws_cloudfront_distribution" "api"')).toBe(true);
  });

  test('has Secrets Manager secret', () => {
    expect(contains(mainContent, 'resource "aws_secretsmanager_secret" "api_keys"')).toBe(true);
  });

  test('has encryption configuration (AWS-managed keys)', () => {
    // Using AWS-managed encryption for Global Table v2 compatibility
    expect(contains(mainContent, /server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/)).toBe(true);
  });
});

describe('Terraform Infrastructure - Security Resources', () => {
  const securityContent = readFile('security.tf');

  test('has WAF Web ACL', () => {
    expect(contains(securityContent, 'resource "aws_wafv2_web_acl" "api_protection"')).toBe(true);
  });

  test('WAF has rate limiting rule', () => {
    expect(contains(securityContent, /name\s*=\s*"RateLimitRule"/)).toBe(true);
  });

  test('WAF has SQL injection protection', () => {
    expect(contains(securityContent, /name\s*=\s*"SQLInjectionRule"/)).toBe(true);
  });

  test('WAF has XSS protection', () => {
    expect(contains(securityContent, /name\s*=\s*"XSSRule"/)).toBe(true);
  });

  test('has S3 bucket for WAF logs', () => {
    expect(contains(securityContent, 'resource "aws_s3_bucket" "waf_logs"')).toBe(true);
  });

  test('S3 bucket has versioning enabled', () => {
    expect(contains(securityContent, 'resource "aws_s3_bucket_versioning" "waf_logs"')).toBe(true);
  });

  test('S3 bucket has encryption enabled', () => {
    expect(contains(securityContent, 'resource "aws_s3_bucket_server_side_encryption_configuration" "waf_logs"')).toBe(true);
  });

  test('S3 bucket has public access block', () => {
    expect(contains(securityContent, 'resource "aws_s3_bucket_public_access_block" "waf_logs"')).toBe(true);
  });

  test('VPC resources are conditional (use count)', () => {
    expect(contains(securityContent, /resource "aws_vpc" "main"[\s\S]*?count\s*=\s*var\.enable_vpc/)).toBe(true);
  });
});

describe('Terraform Infrastructure - Monitoring Resources', () => {
  const monitoringContent = readFile('monitoring.tf');

  test('has SNS topic for alarms', () => {
    expect(contains(monitoringContent, 'resource "aws_sns_topic" "alarms"')).toBe(true);
  });

  test('has X-Ray sampling rule', () => {
    expect(contains(monitoringContent, 'resource "aws_xray_sampling_rule" "api"')).toBe(true);
  });

  test('has CloudWatch dashboard', () => {
    expect(contains(monitoringContent, 'resource "aws_cloudwatch_dashboard" "main"')).toBe(true);
  });

  test('has API Gateway error alarms', () => {
    expect(contains(monitoringContent, 'resource "aws_cloudwatch_metric_alarm" "high_4xx_errors"')).toBe(true);
    expect(contains(monitoringContent, 'resource "aws_cloudwatch_metric_alarm" "high_5xx_errors"')).toBe(true);
  });

  test('has Lambda error alarms', () => {
    expect(contains(monitoringContent, 'resource "aws_cloudwatch_metric_alarm" "lambda_errors"')).toBe(true);
  });

  test('has DynamoDB throttling alarm', () => {
    expect(contains(monitoringContent, 'resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles"')).toBe(true);
  });

  test('has composite alarm for critical health', () => {
    expect(contains(monitoringContent, 'resource "aws_cloudwatch_composite_alarm" "critical_system_health"')).toBe(true);
  });
});

describe('Terraform Infrastructure - Security Compliance', () => {
  const mainContent = readFile('main.tf');

  test('DynamoDB has encryption enabled', () => {
    expect(contains(mainContent, /server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/)).toBe(true);
  });

  test('DynamoDB has point-in-time recovery enabled', () => {
    expect(contains(mainContent, /point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/)).toBe(true);
  });

  test('Lambda functions have X-Ray tracing enabled', () => {
    expect(contains(mainContent, /tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/)).toBe(true);
  });

  test('CloudWatch log groups have retention period', () => {
    expect(contains(mainContent, /retention_in_days\s*=\s*90/)).toBe(true);
  });

  test('IAM policy does not use wildcard for CloudWatch Logs', () => {
    // Check that logs resources are specific, not wildcards
    const iamPolicyMatch = mainContent.match(/lambda_execution[\s\S]*?Resource\s*=\s*\[[\s\S]*?logs/);
    if (iamPolicyMatch) {
      expect(iamPolicyMatch[0]).toMatch(/cloudwatch_log_group/);
    }
  });
});

describe('Terraform Infrastructure - Multi-Region Setup', () => {
  const mainContent = readFile('main.tf');

  test('resources use primary provider alias', () => {
    expect(contains(mainContent, 'provider = aws.primary')).toBe(true);
  });

  test('resources use secondary provider alias', () => {
    expect(contains(mainContent, 'provider = aws.secondary')).toBe(true);
  });

  test('CloudFront uses global provider alias', () => {
    expect(contains(mainContent, /cloudfront_distribution[\s\S]*?provider = aws\.global/)).toBe(true);
  });

  test('DynamoDB Global Table v2 has replica in secondary region', () => {
    // Global Table v2 uses replica block within the table resource
    const tableWithReplica = /resource "aws_dynamodb_table" "transactions"[\s\S]*?replica\s*{[\s\S]*?region_name\s*=\s*var\.secondary_region/;
    expect(contains(mainContent, tableWithReplica)).toBe(true);
  });
});

describe('Terraform Infrastructure - Route 53 Optional Configuration', () => {
  const mainContent = readFile('main.tf');

  test('Route 53 health checks are conditional', () => {
    expect(contains(mainContent, /resource "aws_route53_health_check" "primary"[\s\S]*?count\s*=\s*var\.enable_route53/)).toBe(true);
  });

  test('Route 53 records are conditional', () => {
    expect(contains(mainContent, /resource "aws_route53_record"[\s\S]*?count\s*=\s*var\.enable_route53/)).toBe(true);
  });

  test('CloudFront origin uses conditional domain', () => {
    expect(contains(mainContent, /domain_name\s*=\s*var\.enable_route53\s*\?/)).toBe(true);
  });
});

describe('Terraform Infrastructure - Outputs', () => {
  const outputsContent = readFile('outputs.tf');

  test('has API Gateway URL outputs', () => {
    expect(contains(outputsContent, 'output "api_gateway_url_primary"')).toBe(true);
    expect(contains(outputsContent, 'output "api_gateway_url_secondary"')).toBe(true);
  });

  test('has CloudFront domain output', () => {
    expect(contains(outputsContent, 'output "cloudfront_domain_name"')).toBe(true);
  });

  test('has DynamoDB table name output', () => {
    expect(contains(outputsContent, 'output "dynamodb_table_name"')).toBe(true);
  });

  test('has Lambda function name outputs', () => {
    expect(contains(outputsContent, 'output "lambda_authorizer_name_primary"')).toBe(true);
    expect(contains(outputsContent, 'output "lambda_transaction_name_primary"')).toBe(true);
  });

  test('has WAF Web ACL ARN output', () => {
    expect(contains(outputsContent, 'output "waf_web_acl_arn"')).toBe(true);
  });

  test('has CloudWatch dashboard output', () => {
    expect(contains(outputsContent, 'output "cloudwatch_dashboard_name"')).toBe(true);
  });
});

describe('Terraform Infrastructure - Lambda Functions', () => {
  const authorizerContent = readFile('lambda_authorizer.py');
  const transactionContent = readFile('lambda_transaction.py');

  test('authorizer Lambda has JWT validation', () => {
    expect(contains(authorizerContent, 'import jwt')).toBe(true);
    expect(contains(authorizerContent, 'jwt.decode')).toBe(true);
  });

  test('authorizer Lambda uses X-Ray', () => {
    expect(contains(authorizerContent, 'from aws_xray_sdk')).toBe(true);
    expect(contains(authorizerContent, '@xray_recorder.capture')).toBe(true);
  });

  test('transaction Lambda has DynamoDB operations', () => {
    expect(contains(transactionContent, 'import boto3')).toBe(true);
    expect(contains(transactionContent, 'dynamodb')).toBe(true);
  });

  test('transaction Lambda uses X-Ray', () => {
    expect(contains(transactionContent, 'from aws_xray_sdk')).toBe(true);
    expect(contains(transactionContent, '@xray_recorder.capture')).toBe(true);
  });

  test('transaction Lambda has error handling', () => {
    expect(contains(transactionContent, 'try:')).toBe(true);
    expect(contains(transactionContent, 'except')).toBe(true);
  });
});

describe('Terraform Infrastructure - Dependencies', () => {
  const mainContent = readFile('main.tf');
  const securityContent = readFile('security.tf');

  test('API Gateway deployment has depends_on', () => {
    expect(contains(mainContent, /resource "aws_api_gateway_deployment"[\s\S]*?depends_on/)).toBe(true);
  });

  test('DynamoDB Global Table v2 has proper replication configuration', () => {
    // Global Table v2 doesn't need depends_on for regional tables
    // Replica is configured directly within the table resource
    const replicaConfig = /replica\s*{[\s\S]*?region_name\s*=\s*var\.secondary_region[\s\S]*?point_in_time_recovery\s*=/;
    expect(contains(mainContent, replicaConfig)).toBe(true);
  });

  test('WAF logging has depends_on for S3 bucket', () => {
    expect(contains(securityContent, /wafv2_web_acl_logging_configuration[\s\S]*?depends_on/)).toBe(true);
  });
});
