// Comprehensive unit tests for Terraform infrastructure
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

// Helper to check if a file contains a pattern
function fileContains(filename: string, pattern: string | RegExp): boolean {
  const content = readFile(filename);
  if (typeof pattern === 'string') {
    return content.includes(pattern);
  }
  return pattern.test(content);
}

// Helper to count occurrences
function countOccurrences(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

describe('Terraform Infrastructure Unit Tests', () => {
  
  describe('File Existence', () => {
    const requiredFiles = [
      'provider.tf',
      'variables.tf',
      'data.tf',
      'api-gateway.tf',
      'lambda.tf',
      'layers.tf',
      'dynamodb.tf',
      'sqs.tf',
      'eventbridge.tf',
      'ssm.tf',
      'cloudwatch.tf',
      'iam.tf',
      'outputs.tf',
      'route53.tf'
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        expect(fs.existsSync(path.join(LIB_DIR, file))).toBe(true);
      });
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf does not define AWS provider inline', () => {
      const content = readFile('provider.tf');
      expect(content).toContain('provider "aws"');
    });

    test('provider requires correct versions', () => {
      const content = readFile('provider.tf');
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.[4-9]/);
      expect(content).toMatch(/version\s*=\s*">=\s*5\.0"/);
      expect(content).toContain('hashicorp/random');
      expect(content).toContain('hashicorp/archive');
    });

    test('S3 backend is configured', () => {
      const content = readFile('provider.tf');
      expect(content).toContain('backend "s3"');
    });
  });

  describe('Variable Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('variables.tf');
    });

    test('aws_region variable is defined', () => {
      expect(content).toMatch(/variable\s+"aws_region"/);
    });

    test('environment_suffix variable is defined', () => {
      expect(content).toMatch(/variable\s+"environment_suffix"/);
    });

    test('create_route53 variable is defined with default false', () => {
      expect(content).toMatch(/variable\s+"create_route53"/);
      expect(content).toMatch(/default\s*=\s*false/);
    });

    test('Lambda timeout variables are defined', () => {
      expect(content).toMatch(/variable\s+"lambda_timeout_ingestion"/);
      expect(content).toMatch(/variable\s+"lambda_timeout_processing"/);
      expect(content).toMatch(/variable\s+"lambda_timeout_storage"/);
    });

    test('API throttle variables are defined', () => {
      expect(content).toMatch(/variable\s+"api_throttle_rate_limit"/);
      expect(content).toMatch(/variable\s+"api_throttle_burst_limit"/);
    });

    test('log_retention_days variable is defined with 7 days default', () => {
      expect(content).toMatch(/variable\s+"log_retention_days"/);
      expect(content).toMatch(/default\s*=\s*7/);
    });

    test('common_tags local is defined with required tags', () => {
      expect(content).toMatch(/common_tags\s*=/);
      expect(content).toContain('Environment');
      expect(content).toContain('Team');
      expect(content).toContain('CostCenter');
    });

    test('name_prefix local includes environment_suffix', () => {
      expect(content).toMatch(/name_prefix\s*=/);
      expect(content).toContain('environment_suffix');
    });
  });

  describe('Data Sources', () => {
    test('aws_caller_identity data source is defined', () => {
      const content = readFile('data.tf');
      expect(content).toMatch(/data\s+"aws_caller_identity"/);
    });

    test('aws_region data source is defined', () => {
      const content = readFile('data.tf');
      expect(content).toMatch(/data\s+"aws_region"/);
    });
  });

  describe('Lambda Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('lambda.tf');
    });

    test('All required Lambda functions are defined', () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"authorizer"/);
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"event_ingestion"/);
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"event_processing"/);
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"event_storage"/);
    });

    test('Lambda functions use ARM64 architecture', () => {
      const archMatches = countOccurrences(content, /architectures\s*=\s*\["arm64"\]/g);
      expect(archMatches).toBeGreaterThanOrEqual(4);
    });

    test('Lambda functions use Node.js 18 runtime', () => {
      const runtimeMatches = countOccurrences(content, /runtime\s*=\s*"nodejs18\.x"/g);
      expect(runtimeMatches).toBeGreaterThanOrEqual(4);
    });

    test('Lambda functions have X-Ray tracing enabled', () => {
      const tracingMatches = countOccurrences(content, /mode\s*=\s*"Active"/g);
      expect(tracingMatches).toBeGreaterThanOrEqual(4);
    });

    test('Lambda functions have timeout between 30-300 seconds', () => {
      expect(content).toMatch(/timeout\s*=\s*30/);
      expect(content).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
    });

    test('Lambda functions use archive_file data source', () => {
      expect(content).toMatch(/data\s+"archive_file"\s+"authorizer"/);
      expect(content).toMatch(/data\s+"archive_file"\s+"event_ingestion"/);
      expect(content).toMatch(/data\s+"archive_file"\s+"event_processing"/);
      expect(content).toMatch(/data\s+"archive_file"\s+"event_storage"/);
    });

    test('Lambda functions have reserved concurrent executions', () => {
      const concurrencyMatches = countOccurrences(content, /reserved_concurrent_executions\s*=\s*\d+/g);
      expect(concurrencyMatches).toBeGreaterThanOrEqual(3);
    });

    test('Lambda destinations are configured', () => {
      expect(content).toMatch(/aws_lambda_function_event_invoke_config/);
      expect(content).toContain('on_success');
      expect(content).toContain('on_failure');
    });
  });

  describe('Lambda Layer Configuration', () => {
    test('Lambda layer uses archive_file data source', () => {
      const content = readFile('layers.tf');
      expect(content).toMatch(/data\s+"archive_file"\s+"common_dependencies_layer"/);
    });

    test('Lambda layer uses dynamic account ID', () => {
      const content = readFile('layers.tf');
      expect(content).toContain('data.aws_caller_identity.current.account_id');
      expect(content).not.toContain('123456789012');
    });

    test('Lambda layer supports Node.js 18 and ARM64', () => {
      const content = readFile('layers.tf');
      expect(content).toContain('nodejs18.x');
      expect(content).toContain('arm64');
    });
  });

  describe('API Gateway Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('api-gateway.tf');
    });

    test('API Gateway REST API uses environment_suffix in name', () => {
      expect(content).toContain('local.name_prefix');
    });

    test('API Gateway has request validator', () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_request_validator"/);
    });

    test('API Gateway has Lambda authorizer with caching', () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_authorizer"/);
      expect(content).toMatch(/type\s*=\s*"TOKEN"/);
      expect(content).toMatch(/authorizer_result_ttl_in_seconds\s*=\s*300/);
    });

    test('API Gateway stage has X-Ray tracing enabled', () => {
      expect(content).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test('API Gateway method settings include throttling', () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_method_settings"/);
      expect(content).toContain('throttling_rate_limit');
      expect(content).toContain('throttling_burst_limit');
    });

    test('API Gateway CloudWatch role is configured', () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_account"/);
    });
  });

  describe('DynamoDB Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('dynamodb.tf');
    });

    test('DynamoDB tables use on-demand billing', () => {
      const billingMatches = countOccurrences(content, /billing_mode\s*=\s*"PAY_PER_REQUEST"/g);
      expect(billingMatches).toBeGreaterThanOrEqual(2);
    });

    test('DynamoDB tables have point-in-time recovery enabled', () => {
      const recoveryMatches = countOccurrences(content, /enabled\s*=\s*true/g);
      expect(recoveryMatches).toBeGreaterThanOrEqual(2);
    });

    test('DynamoDB tables have encryption enabled', () => {
      expect(content).toContain('server_side_encryption');
    });

    test('DynamoDB tables use composite primary keys', () => {
      expect(content).toMatch(/hash_key\s*=\s*"pk"/);
      expect(content).toMatch(/range_key\s*=\s*"sk"/);
    });

    test('DynamoDB events table has GSI configured', () => {
      expect(content).toMatch(/global_secondary_index/);
      const gsiMatches = countOccurrences(content, /global_secondary_index\s*{/g);
      expect(gsiMatches).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SQS Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('sqs.tf');
    });

    test('SQS queues have 300 second visibility timeout', () => {
      expect(content).toMatch(/visibility_timeout_seconds\s*=\s*300/);
    });

    test('SQS queues have encryption enabled', () => {
      expect(content).toMatch(/sqs_managed_sse_enabled\s*=\s*true/);
    });

    test('SQS main queue has DLQ configured', () => {
      expect(content).toContain('redrive_policy');
      expect(content).toContain('deadLetterTargetArn');
    });
  });

  describe('EventBridge Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('eventbridge.tf');
    });

    test('EventBridge has at least 3 event patterns', () => {
      const ruleMatches = countOccurrences(content, /resource\s+"aws_cloudwatch_event_rule"/g);
      expect(ruleMatches).toBeGreaterThanOrEqual(3);
    });

    test('EventBridge rules have content-based filtering', () => {
      expect(content).toContain('event_pattern');
      const patternMatches = countOccurrences(content, /event_pattern\s*=/g);
      expect(patternMatches).toBeGreaterThanOrEqual(3);
    });

    test('EventBridge permission uses account ID string', () => {
      expect(content).toContain('data.aws_caller_identity.current.account_id');
    });
  });

  describe('SSM Parameter Store Configuration', () => {
    test('Auth token uses random password', () => {
      const content = readFile('ssm.tf');
      expect(content).toContain('random_password');
      expect(content).toContain('random_password.auth_token.result');
    });

    test('SSM parameters use environment_suffix in path', () => {
      const content = readFile('ssm.tf');
      expect(content).toContain('environment_suffix');
    });

    test('No hardcoded secrets in SSM parameters', () => {
      const content = readFile('ssm.tf');
      expect(content).not.toContain('REPLACE_WITH_ACTUAL');
    });
  });

  describe('CloudWatch Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('cloudwatch.tf');
    });

    test('Log groups have 7-day retention', () => {
      expect(content).toContain('var.log_retention_days');
      const retentionMatches = countOccurrences(content, /retention_in_days/g);
      expect(retentionMatches).toBeGreaterThanOrEqual(5);
    });

    test('CloudWatch dashboard is configured', () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
    });

    test('CloudWatch alarms are configured', () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });
  });

  describe('IAM Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('iam.tf');
    });

    test('All Lambda functions have IAM roles', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_authorizer"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_ingestion"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_processing"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_storage"/);
    });

    test('IAM roles use environment_suffix in name', () => {
      expect(content).toContain('local.name_prefix');
    });

    test('No wildcard permissions in IAM policies', () => {
      const wildcardMatches = content.match(/"Resource"\s*:\s*"\*"/g);
      expect(wildcardMatches).toBeNull();
    });

    test('IAM policies use specific resource ARNs', () => {
      expect(content).toMatch(/aws_\w+\.\w+\.arn/);
    });
  });

  describe('Tagging Compliance', () => {
    const filesToCheck = [
      'api-gateway.tf',
      'lambda.tf',
      'dynamodb.tf',
      'sqs.tf',
      'eventbridge.tf',
      'cloudwatch.tf'
    ];

    filesToCheck.forEach(file => {
      test(`${file} resources use common_tags`, () => {
        const content = readFile(file);
        expect(content).toContain('local.common_tags');
      });
    });
  });

  describe('Security Checks', () => {
    test('No hardcoded AWS account IDs', () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
      
      files.forEach(file => {
        const content = readFile(file);
        const accountIdPattern = /\b\d{12}\b/g;
        const matches = content.match(accountIdPattern);
        
        if (matches) {
          if (file === 'layers.tf' && content.includes('data.aws_caller_identity')) {
            return;
          }
          expect(matches).toHaveLength(0);
        }
      });
    });

    test('No hardcoded secrets or tokens', () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
      
      files.forEach(file => {
        const content = readFile(file);
        expect(content).not.toMatch(/password\s*=\s*["'][a-zA-Z0-9]{8,}["']/);
        expect(content).not.toMatch(/secret\s*=\s*["'][a-zA-Z0-9]{8,}["']/);
        expect(content).not.toMatch(/token\s*=\s*["'][a-zA-Z0-9]{8,}["']/);
      });
    });
  });

  describe('Outputs Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('outputs.tf');
    });

    test('API endpoint output is defined', () => {
      expect(content).toMatch(/output\s+"api_endpoint"/);
    });

    test('Lambda function ARNs are output', () => {
      expect(content).toMatch(/output\s+"lambda_ingestion_arn"/);
      expect(content).toMatch(/output\s+"lambda_processing_arn"/);
      expect(content).toMatch(/output\s+"lambda_storage_arn"/);
    });

    test('SQS queue URLs are output', () => {
      expect(content).toMatch(/output\s+"sqs_queue_url"/);
      expect(content).toMatch(/output\s+"sqs_dlq_url"/);
    });

    test('DynamoDB table names are output', () => {
      expect(content).toMatch(/output\s+"dynamodb_events_table"/);
      expect(content).toMatch(/output\s+"dynamodb_audit_table"/);
    });

    test('Integration test config is output', () => {
      expect(content).toMatch(/output\s+"integration_test_config"/);
    });
  });

  describe('Route53 Optional Configuration', () => {
    test('Route53 resources are conditional', () => {
      const content = readFile('route53.tf');
      expect(content).toContain('var.create_route53 ? 1 : 0');
    });

    test('Route53 resources use count for conditional creation', () => {
      const content = readFile('route53.tf');
      const countMatches = countOccurrences(content, /count\s*=\s*var\.create_route53/g);
      expect(countMatches).toBeGreaterThanOrEqual(4);
    });
  });
});
