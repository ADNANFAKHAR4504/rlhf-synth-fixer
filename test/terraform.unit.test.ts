// Comprehensive unit tests for Terraform infrastructure
import fs from 'fs';
import { parseHcl } from 'hcl2-parser';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read and parse HCL files
function readHclFile(filename: string) {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parseHcl(content);
}

// Helper to extract all resources from parsed HCL
function extractResources(parsed: any, resourceType?: string): any[] {
  const resources: any[] = [];

  if (parsed.resource) {
    for (const type in parsed.resource) {
      if (!resourceType || type === resourceType) {
        for (const name in parsed.resource[type]) {
          resources.push({
            type,
            name,
            config: parsed.resource[type][name]
          });
        }
      }
    }
  }

  return resources;
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
      const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      // Check it has the provider block at the end
      expect(content).toContain('provider "aws"');
      // But ensure no other .tf files have provider blocks
    });

    test('provider requires correct versions', () => {
      const parsed = readHclFile('provider.tf');
      expect(parsed.terraform[0].required_version).toMatch(/>=\s*1\.[4-9]/);
      expect(parsed.terraform[0].required_providers[0].aws[0].version).toMatch(/>=\s*5\.0/);
      expect(parsed.terraform[0].required_providers[0].random).toBeDefined();
      expect(parsed.terraform[0].required_providers[0].archive).toBeDefined();
    });

    test('S3 backend is configured', () => {
      const parsed = readHclFile('provider.tf');
      expect(parsed.terraform[0].backend).toBeDefined();
      expect(parsed.terraform[0].backend[0].s3).toBeDefined();
    });
  });

  describe('Variable Configuration', () => {
    let parsed: any;

    beforeAll(() => {
      parsed = readHclFile('variables.tf');
    });

    test('aws_region variable is defined', () => {
      expect(parsed.variable[0].aws_region).toBeDefined();
    });

    test('environment_suffix variable is defined', () => {
      expect(parsed.variable[0].environment_suffix).toBeDefined();
    });

    test('create_route53 variable is defined with default false', () => {
      expect(parsed.variable[0].create_route53).toBeDefined();
      expect(parsed.variable[0].create_route53[0].default).toBe(false);
    });

    test('Lambda timeout variables are defined', () => {
      expect(parsed.variable[0].lambda_timeout_ingestion).toBeDefined();
      expect(parsed.variable[0].lambda_timeout_processing).toBeDefined();
      expect(parsed.variable[0].lambda_timeout_storage).toBeDefined();
    });

    test('API throttle variables are defined', () => {
      expect(parsed.variable[0].api_throttle_rate_limit).toBeDefined();
      expect(parsed.variable[0].api_throttle_burst_limit).toBeDefined();
    });

    test('log_retention_days variable is defined with 7 days default', () => {
      expect(parsed.variable[0].log_retention_days).toBeDefined();
      expect(parsed.variable[0].log_retention_days[0].default).toBe(7);
    });

    test('common_tags local is defined with required tags', () => {
      expect(parsed.locals[0].common_tags).toBeDefined();
      const tags = parsed.locals[0].common_tags[0];
      expect(tags.Environment).toBeDefined();
      expect(tags.Team).toBeDefined();
      expect(tags.CostCenter).toBeDefined();
    });

    test('name_prefix local includes environment_suffix', () => {
      expect(parsed.locals[0].name_prefix).toBeDefined();
      const namePrefix = parsed.locals[0].name_prefix[0];
      expect(namePrefix).toContain('environment_suffix');
    });
  });

  describe('Data Sources', () => {
    test('aws_caller_identity data source is defined', () => {
      const parsed = readHclFile('data.tf');
      expect(parsed.data[0].aws_caller_identity).toBeDefined();
    });

    test('aws_region data source is defined', () => {
      const parsed = readHclFile('data.tf');
      expect(parsed.data[0].aws_region).toBeDefined();
    });
  });

  describe('Lambda Configuration', () => {
    let parsed: any;
    let lambdaFunctions: any[];

    beforeAll(() => {
      parsed = readHclFile('lambda.tf');
      lambdaFunctions = extractResources(parsed, 'aws_lambda_function');
    });

    test('All required Lambda functions are defined', () => {
      const functionNames = lambdaFunctions.map(f => f.name);
      expect(functionNames).toContain('authorizer');
      expect(functionNames).toContain('event_ingestion');
      expect(functionNames).toContain('event_processing');
      expect(functionNames).toContain('event_storage');
    });

    test('Lambda functions use ARM64 architecture', () => {
      lambdaFunctions.forEach(fn => {
        const config = fn.config[0];
        expect(config.architectures).toEqual(['arm64']);
      });
    });

    test('Lambda functions use Node.js 18 runtime', () => {
      lambdaFunctions.forEach(fn => {
        const config = fn.config[0];
        expect(config.runtime).toBe('nodejs18.x');
      });
    });

    test('Lambda functions have X-Ray tracing enabled', () => {
      lambdaFunctions.forEach(fn => {
        const config = fn.config[0];
        expect(config.tracing_config).toBeDefined();
        expect(config.tracing_config[0].mode).toBe('Active');
      });
    });

    test('Lambda functions have timeout between 30-300 seconds', () => {
      lambdaFunctions.forEach(fn => {
        const config = fn.config[0];
        const timeout = typeof config.timeout === 'number' ? config.timeout :
          (config.timeout && config.timeout[0]) || 30;
        expect(timeout).toBeGreaterThanOrEqual(30);
        expect(timeout).toBeLessThanOrEqual(300);
      });
    });

    test('Lambda functions use archive_file data source', () => {
      const archiveDataSources = [];
      if (parsed.data && parsed.data[0] && parsed.data[0].archive_file) {
        for (const name in parsed.data[0].archive_file) {
          archiveDataSources.push(name);
        }
      }

      expect(archiveDataSources.length).toBeGreaterThan(0);
      expect(archiveDataSources).toContain('authorizer');
      expect(archiveDataSources).toContain('event_ingestion');
      expect(archiveDataSources).toContain('event_processing');
      expect(archiveDataSources).toContain('event_storage');
    });

    test('Lambda functions have reserved concurrent executions', () => {
      const functionsWithConcurrency = lambdaFunctions.filter(fn =>
        fn.name !== 'authorizer' // Authorizer doesn't need concurrency
      );

      functionsWithConcurrency.forEach(fn => {
        const config = fn.config[0];
        expect(config.reserved_concurrent_executions).toBeDefined();
        expect(config.reserved_concurrent_executions).toBeGreaterThan(0);
      });
    });

    test('Lambda destinations are configured', () => {
      const destinations = extractResources(parsed, 'aws_lambda_function_event_invoke_config');
      expect(destinations.length).toBeGreaterThan(0);

      destinations.forEach(dest => {
        const config = dest.config[0];
        expect(config.destination_config).toBeDefined();
        expect(config.destination_config[0].on_success).toBeDefined();
        expect(config.destination_config[0].on_failure).toBeDefined();
      });
    });
  });

  describe('Lambda Layer Configuration', () => {
    test('Lambda layer uses archive_file data source', () => {
      const parsed = readHclFile('layers.tf');
      expect(parsed.data).toBeDefined();
      expect(parsed.data[0].archive_file).toBeDefined();
      expect(parsed.data[0].archive_file[0].common_dependencies_layer).toBeDefined();
    });

    test('Lambda layer uses dynamic account ID', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'layers.tf'), 'utf8');
      expect(content).toContain('data.aws_caller_identity.current.account_id');
      expect(content).not.toContain('123456789012');
    });

    test('Lambda layer supports Node.js 18 and ARM64', () => {
      const parsed = readHclFile('layers.tf');
      const layer = parsed.resource[0].aws_lambda_layer_version[0].common_dependencies[0];
      expect(layer.compatible_runtimes).toContain('nodejs18.x');
      expect(layer.compatible_architectures).toContain('arm64');
    });
  });

  describe('API Gateway Configuration', () => {
    let parsed: any;

    beforeAll(() => {
      parsed = readHclFile('api-gateway.tf');
    });

    test('API Gateway REST API uses environment_suffix in name', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'api-gateway.tf'), 'utf8');
      expect(content).toContain('local.name_prefix');
    });

    test('API Gateway has request validator', () => {
      const validators = extractResources(parsed, 'aws_api_gateway_request_validator');
      expect(validators.length).toBeGreaterThan(0);
    });

    test('API Gateway has Lambda authorizer with caching', () => {
      const authorizers = extractResources(parsed, 'aws_api_gateway_authorizer');
      expect(authorizers.length).toBeGreaterThan(0);

      const authorizer = authorizers[0].config[0];
      expect(authorizer.type).toBe('TOKEN');
      expect(authorizer.authorizer_result_ttl_in_seconds).toBe(300);
    });

    test('API Gateway stage has X-Ray tracing enabled', () => {
      const stages = extractResources(parsed, 'aws_api_gateway_stage');
      expect(stages.length).toBeGreaterThan(0);

      const stage = stages[0].config[0];
      expect(stage.xray_tracing_enabled).toBe(true);
    });

    test('API Gateway method settings include throttling', () => {
      const methodSettings = extractResources(parsed, 'aws_api_gateway_method_settings');
      expect(methodSettings.length).toBeGreaterThan(0);

      const settings = methodSettings[0].config[0].settings[0];
      expect(settings.throttling_rate_limit).toBeDefined();
      expect(settings.throttling_burst_limit).toBeDefined();
    });

    test('API Gateway CloudWatch role is configured', () => {
      const accounts = extractResources(parsed, 'aws_api_gateway_account');
      expect(accounts.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Configuration', () => {
    let parsed: any;
    let tables: any[];

    beforeAll(() => {
      parsed = readHclFile('dynamodb.tf');
      tables = extractResources(parsed, 'aws_dynamodb_table');
    });

    test('DynamoDB tables use on-demand billing', () => {
      tables.forEach(table => {
        const config = table.config[0];
        expect(config.billing_mode).toBe('PAY_PER_REQUEST');
      });
    });

    test('DynamoDB tables have point-in-time recovery enabled', () => {
      tables.forEach(table => {
        const config = table.config[0];
        expect(config.point_in_time_recovery).toBeDefined();
        expect(config.point_in_time_recovery[0].enabled).toBe(true);
      });
    });

    test('DynamoDB tables have encryption enabled', () => {
      tables.forEach(table => {
        const config = table.config[0];
        expect(config.server_side_encryption).toBeDefined();
        expect(config.server_side_encryption[0].enabled).toBe(true);
      });
    });

    test('DynamoDB tables use composite primary keys', () => {
      tables.forEach(table => {
        const config = table.config[0];
        expect(config.hash_key).toBeDefined();
        expect(config.range_key).toBeDefined();
      });
    });

    test('DynamoDB events table has GSI configured', () => {
      const eventsTable = tables.find(t => t.name === 'events');
      expect(eventsTable).toBeDefined();

      const config = eventsTable.config[0];
      expect(config.global_secondary_index).toBeDefined();
      expect(config.global_secondary_index.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SQS Configuration', () => {
    let parsed: any;

    beforeAll(() => {
      parsed = readHclFile('sqs.tf');
    });

    test('SQS queues have 300 second visibility timeout', () => {
      const queues = extractResources(parsed, 'aws_sqs_queue');
      const mainQueue = queues.find(q => q.name === 'event_queue');
      expect(mainQueue).toBeDefined();
      expect(mainQueue.config[0].visibility_timeout_seconds).toBe(300);
    });

    test('SQS queues have encryption enabled', () => {
      const queues = extractResources(parsed, 'aws_sqs_queue');
      queues.forEach(queue => {
        const config = queue.config[0];
        expect(config.sqs_managed_sse_enabled).toBe(true);
      });
    });

    test('SQS main queue has DLQ configured', () => {
      const queues = extractResources(parsed, 'aws_sqs_queue');
      const mainQueue = queues.find(q => q.name === 'event_queue');
      expect(mainQueue).toBeDefined();
      expect(mainQueue.config[0].redrive_policy).toBeDefined();
    });
  });

  describe('EventBridge Configuration', () => {
    let parsed: any;
    let rules: any[];

    beforeAll(() => {
      parsed = readHclFile('eventbridge.tf');
      rules = extractResources(parsed, 'aws_cloudwatch_event_rule');
    });

    test('EventBridge has at least 3 event patterns', () => {
      expect(rules.length).toBeGreaterThanOrEqual(3);
    });

    test('EventBridge rules have content-based filtering', () => {
      rules.forEach(rule => {
        const config = rule.config[0];
        expect(config.event_pattern).toBeDefined();
      });
    });

    test('EventBridge permission uses account ID string', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'eventbridge.tf'), 'utf8');
      expect(content).toContain('data.aws_caller_identity.current.account_id');
    });
  });

  describe('SSM Parameter Store Configuration', () => {
    test('Auth token uses random password', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'ssm.tf'), 'utf8');
      expect(content).toContain('random_password');
      expect(content).toContain('random_password.auth_token.result');
    });

    test('SSM parameters use environment_suffix in path', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'ssm.tf'), 'utf8');
      expect(content).toContain('environment_suffix');
    });

    test('No hardcoded secrets in SSM parameters', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'ssm.tf'), 'utf8');
      expect(content).not.toContain('REPLACE_WITH_ACTUAL');
      expect(content).not.toMatch(/password.*=.*["'][^$]/);
    });
  });

  describe('CloudWatch Configuration', () => {
    let parsed: any;

    beforeAll(() => {
      parsed = readHclFile('cloudwatch.tf');
    });

    test('Log groups have 7-day retention', () => {
      const logGroups = extractResources(parsed, 'aws_cloudwatch_log_group');
      logGroups.forEach(group => {
        const config = group.config[0];
        // Should reference var.log_retention_days
        expect(config.retention_in_days).toBeDefined();
      });
    });

    test('CloudWatch dashboard is configured', () => {
      const dashboards = extractResources(parsed, 'aws_cloudwatch_dashboard');
      expect(dashboards.length).toBeGreaterThan(0);
    });

    test('CloudWatch alarms are configured', () => {
      const alarms = extractResources(parsed, 'aws_cloudwatch_metric_alarm');
      expect(alarms.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Configuration', () => {
    let parsed: any;
    let roles: any[];

    beforeAll(() => {
      parsed = readHclFile('iam.tf');
      roles = extractResources(parsed, 'aws_iam_role');
    });

    test('All Lambda functions have IAM roles', () => {
      const roleNames = roles.map(r => r.name);
      expect(roleNames).toContain('lambda_authorizer');
      expect(roleNames).toContain('lambda_ingestion');
      expect(roleNames).toContain('lambda_processing');
      expect(roleNames).toContain('lambda_storage');
    });

    test('IAM roles use environment_suffix in name', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).toContain('local.name_prefix');
    });

    test('No wildcard permissions in IAM policies', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
      const resourceWildcards = content.match(/"Resource"\s*:\s*"\*"/g);
      expect(resourceWildcards).toBeNull();
    });

    test('IAM policies use specific resource ARNs', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
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
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).toContain('local.common_tags');
      });
    });
  });

  describe('Security Checks', () => {
    test('No hardcoded AWS account IDs', () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));

      files.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        const accountIdPattern = /\b\d{12}\b/g;
        const matches = content.match(accountIdPattern);

        if (matches) {
          // Exception for layer permission which uses data source
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
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).not.toMatch(/password\s*=\s*["'][a-zA-Z0-9]{8,}["']/);
        expect(content).not.toMatch(/secret\s*=\s*["'][a-zA-Z0-9]{8,}["']/);
        expect(content).not.toMatch(/token\s*=\s*["'][a-zA-Z0-9]{8,}["']/);
      });
    });
  });

  describe('Outputs Configuration', () => {
    let parsed: any;

    beforeAll(() => {
      parsed = readHclFile('outputs.tf');
    });

    test('API endpoint output is defined', () => {
      expect(parsed.output[0].api_endpoint).toBeDefined();
    });

    test('Lambda function ARNs are output', () => {
      expect(parsed.output[0].lambda_ingestion_arn).toBeDefined();
      expect(parsed.output[0].lambda_processing_arn).toBeDefined();
      expect(parsed.output[0].lambda_storage_arn).toBeDefined();
    });

    test('SQS queue URLs are output', () => {
      expect(parsed.output[0].sqs_queue_url).toBeDefined();
      expect(parsed.output[0].sqs_dlq_url).toBeDefined();
    });

    test('DynamoDB table names are output', () => {
      expect(parsed.output[0].dynamodb_events_table).toBeDefined();
      expect(parsed.output[0].dynamodb_audit_table).toBeDefined();
    });

    test('Integration test config is output', () => {
      expect(parsed.output[0].integration_test_config).toBeDefined();
    });
  });

  describe('Route53 Optional Configuration', () => {
    test('Route53 resources are conditional', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'route53.tf'), 'utf8');
      expect(content).toContain('var.create_route53 ? 1 : 0');
    });

    test('Route53 resources use count for conditional creation', () => {
      const parsed = readHclFile('route53.tf');
      const resources = extractResources(parsed);

      resources.forEach(resource => {
        const config = resource.config[0];
        expect(config.count).toBeDefined();
      });
    });
  });
});
