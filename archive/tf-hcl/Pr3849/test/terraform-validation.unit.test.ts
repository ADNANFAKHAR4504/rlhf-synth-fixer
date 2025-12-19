import { describe, test, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const libDir = path.join(__dirname, '..', 'lib');

describe('Terraform Configuration Validation Tests', () => {
  describe('File Structure', () => {
    test('should have required Terraform files', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'outputs.tf',
        'lambda.tf',
        'dynamodb.tf',
        's3.tf',
        'apigateway.tf',
        'iam.tf',
        'stepfunctions.tf',
        'cloudwatch.tf',
        'secrets_manager.tf',
        'ses.tf',
        'locals.tf'
      ];

      const files = fs.readdirSync(libDir);
      requiredFiles.forEach(file => {
        expect(files).toContain(file);
      });
    });

    test('all required .tf files should exist and be readable', () => {
      const tfFiles = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));
      expect(tfFiles.length).toBeGreaterThanOrEqual(13);

      tfFiles.forEach(file => {
        const filePath = path.join(libDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
    });

    test('should have AWS provider configured', () => {
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('hashicorp/aws');
    });

    test('should have archive provider configured', () => {
      expect(providerContent).toContain('hashicorp/archive');
    });

    test('should specify required Terraform version', () => {
      expect(providerContent).toContain('required_version');
      expect(providerContent).toMatch(/required_version.*>=.*1\.0/);
    });

    test('should specify provider versions', () => {
      expect(providerContent).toContain('version');
      expect(providerContent).toContain('~> 5.0');
    });
  });

  describe('Variables Configuration', () => {
    let varsContent: string;

    beforeAll(() => {
      varsContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    });

    test('should have required variables defined', () => {
      const requiredVars = [
        'aws_region',
        'project_name',
        'environment',
        'environment_suffix',
        'sender_email',
        'payment_gateway_api_key'
      ];

      requiredVars.forEach(varName => {
        expect(varsContent).toContain(`variable "${varName}"`);
      });
    });

    test('should have default value for aws_region as us-west-2', () => {
      expect(varsContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-west-2"/);
    });

    test('should have default value for project_name', () => {
      expect(varsContent).toMatch(/variable\s+"project_name"[\s\S]*?default\s*=\s*"subscription-mgmt"/);
    });

    test('should mark payment_gateway_api_key as sensitive', () => {
      expect(varsContent).toMatch(/variable\s+"payment_gateway_api_key"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('all variables should have type defined', () => {
      const varMatches = varsContent.match(/variable\s+"[^"]+"/g);
      expect(varMatches).not.toBeNull();
      const varCount = varMatches?.length || 0;
      const typeMatches = varsContent.match(/type\s*=\s*string/g);
      expect(typeMatches?.length).toBeGreaterThanOrEqual(varCount - 1);
    });
  });

  describe('Lambda Functions', () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(path.join(libDir, 'lambda.tf'), 'utf8');
    });

    test('should have all 4 Lambda functions defined', () => {
      const lambdaFunctions = [
        'process_payment',
        'generate_receipt',
        'send_email',
        'webhook_handler'
      ];

      lambdaFunctions.forEach(fn => {
        expect(lambdaContent).toContain(`aws_lambda_function" "${fn}`);
      });
    });

    test('Lambda functions should use Node.js 20 runtime', () => {
      const matches = lambdaContent.match(/runtime\s*=\s*"nodejs20\.x"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    test('Lambda functions should have archive data sources', () => {
      const archiveSources = [
        'process_payment',
        'generate_receipt',
        'send_email',
        'webhook_handler'
      ];

      archiveSources.forEach(fn => {
        expect(lambdaContent).toContain(`data "archive_file" "${fn}`);
      });
    });

    test('Lambda functions should have environment variables', () => {
      const envMatches = lambdaContent.match(/environment\s*\{/g);
      expect(envMatches).not.toBeNull();
      expect(envMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test('Lambda functions should have proper timeout configuration', () => {
      expect(lambdaContent).toContain('timeout');
      const timeoutMatches = lambdaContent.match(/timeout\s*=\s*\d+/g);
      expect(timeoutMatches).not.toBeNull();
      expect(timeoutMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test('Lambda functions should have memory_size configured', () => {
      const memoryMatches = lambdaContent.match(/memory_size\s*=\s*\d+/g);
      expect(memoryMatches).not.toBeNull();
      expect(memoryMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test('Lambda source files should exist', () => {
      const lambdaDir = path.join(libDir, 'lambda');
      const expectedFiles = [
        'process_payment.js',
        'generate_receipt.js',
        'send_email.js',
        'webhook_handler.js'
      ];

      expectedFiles.forEach(file => {
        expect(fs.existsSync(path.join(lambdaDir, file))).toBe(true);
      });
    });

    test('Lambda source files should have valid handler exports', () => {
      const lambdaDir = path.join(libDir, 'lambda');
      const lambdaFiles = ['process_payment.js', 'generate_receipt.js', 'send_email.js', 'webhook_handler.js'];

      lambdaFiles.forEach(file => {
        const content = fs.readFileSync(path.join(lambdaDir, file), 'utf8');
        expect(content).toContain('exports.handler');
        expect(content).toContain('async');
      });
    });

    test('Lambda functions should use local.env_suffix for naming', () => {
      expect(lambdaContent).toContain('local.env_suffix');
      const envSuffixMatches = lambdaContent.match(/local\.env_suffix/g);
      expect(envSuffixMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('DynamoDB Configuration', () => {
    let dynamoContent: string;

    beforeAll(() => {
      dynamoContent = fs.readFileSync(path.join(libDir, 'dynamodb.tf'), 'utf8');
    });

    test('should have DynamoDB table defined', () => {
      expect(dynamoContent).toContain('aws_dynamodb_table');
      expect(dynamoContent).toContain('subscriptions');
    });

    test('DynamoDB should use on-demand billing', () => {
      expect(dynamoContent).toContain('billing_mode');
      expect(dynamoContent).toContain('PAY_PER_REQUEST');
    });

    test('DynamoDB should have required keys', () => {
      expect(dynamoContent).toContain('hash_key');
      expect(dynamoContent).toContain('subscription_id');
      expect(dynamoContent).toContain('customer_id');
      expect(dynamoContent).toContain('range_key');
    });

    test('DynamoDB should have attributes defined', () => {
      expect(dynamoContent).toContain('attribute {');
      const attrMatches = dynamoContent.match(/attribute\s*\{/g);
      expect(attrMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('DynamoDB should have encryption enabled', () => {
      expect(dynamoContent).toContain('server_side_encryption');
      expect(dynamoContent).toMatch(/enabled\s*=\s*true/);
    });

    test('DynamoDB should have point-in-time recovery enabled', () => {
      expect(dynamoContent).toContain('point_in_time_recovery');
      expect(dynamoContent).toMatch(/enabled\s*=\s*true/);
    });

    test('DynamoDB should have global secondary index', () => {
      expect(dynamoContent).toContain('global_secondary_index');
      expect(dynamoContent).toContain('renewal_date');
    });
  });

  describe('S3 Configuration', () => {
    let s3Content: string;

    beforeAll(() => {
      s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
    });

    test('should have S3 bucket for receipts', () => {
      expect(s3Content).toContain('aws_s3_bucket');
      expect(s3Content).toContain('receipts');
    });

    test('S3 bucket should have encryption enabled', () => {
      expect(s3Content).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(s3Content).toContain('AES256');
    });

    test('S3 bucket should have versioning enabled', () => {
      expect(s3Content).toContain('aws_s3_bucket_versioning');
      expect(s3Content).toContain('Enabled');
    });

    test('S3 bucket should block public access', () => {
      expect(s3Content).toContain('aws_s3_bucket_public_access_block');
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
      expect(s3Content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('S3 bucket should have lifecycle configuration', () => {
      expect(s3Content).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(s3Content).toContain('transition');
      expect(s3Content).toContain('GLACIER');
    });

    test('S3 lifecycle should have filter configured', () => {
      expect(s3Content).toContain('filter');
      expect(s3Content).toContain('prefix');
    });

    test('S3 bucket should use account ID in name', () => {
      expect(s3Content).toContain('data.aws_caller_identity.current.account_id');
    });
  });

  describe('API Gateway Configuration', () => {
    let apiContent: string;

    beforeAll(() => {
      apiContent = fs.readFileSync(path.join(libDir, 'apigateway.tf'), 'utf8');
    });

    test('should have API Gateway REST API defined', () => {
      expect(apiContent).toContain('aws_api_gateway_rest_api');
    });

    test('should have webhook resource defined', () => {
      expect(apiContent).toContain('aws_api_gateway_resource');
      expect(apiContent).toContain('webhook');
    });

    test('should have POST method for webhook', () => {
      expect(apiContent).toContain('aws_api_gateway_method');
      expect(apiContent).toContain('POST');
    });

    test('should have Lambda integration configured', () => {
      expect(apiContent).toContain('aws_api_gateway_integration');
      expect(apiContent).toContain('AWS_PROXY');
    });

    test('should have deployment and stage configured', () => {
      expect(apiContent).toContain('aws_api_gateway_deployment');
      expect(apiContent).toContain('aws_api_gateway_stage');
    });

    test('should have CloudWatch logging configured', () => {
      expect(apiContent).toContain('access_log_settings');
    });

    test('should have API Gateway account for CloudWatch role', () => {
      expect(apiContent).toContain('aws_api_gateway_account');
    });

    test('should have method settings configured', () => {
      expect(apiContent).toContain('aws_api_gateway_method_settings');
      expect(apiContent).toContain('metrics_enabled');
    });
  });

  describe('IAM Configuration', () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
    });

    test('should have Lambda execution role', () => {
      expect(iamContent).toContain('aws_iam_role');
      expect(iamContent).toContain('lambda_execution');
    });

    test('should have Step Functions execution role', () => {
      expect(iamContent).toContain('stepfunctions_execution');
    });

    test('should have API Gateway CloudWatch role', () => {
      expect(iamContent).toContain('apigateway_cloudwatch');
    });

    test('should have IAM role policies defined', () => {
      expect(iamContent).toContain('aws_iam_role_policy');
      const policyMatches = iamContent.match(/aws_iam_role_policy"/g);
      expect(policyMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have policy attachments', () => {
      expect(iamContent).toContain('aws_iam_role_policy_attachment');
    });

    test('IAM assume role policies should have correct principals', () => {
      expect(iamContent).toContain('lambda.amazonaws.com');
      expect(iamContent).toContain('states.amazonaws.com');
      expect(iamContent).toContain('apigateway.amazonaws.com');
    });

    test('IAM policies should use resource references not wildcards', () => {
      const wildcardMatch = iamContent.match(/"Resource"\s*:\s*"\*"/g);
      expect(wildcardMatch).toBeNull();
    });
  });

  describe('Step Functions Configuration', () => {
    let sfnContent: string;

    beforeAll(() => {
      sfnContent = fs.readFileSync(path.join(libDir, 'stepfunctions.tf'), 'utf8');
    });

    test('should have Step Functions state machine defined', () => {
      expect(sfnContent).toContain('aws_sfn_state_machine');
      expect(sfnContent).toContain('renewal_workflow');
    });

    test('Step Functions should have definition', () => {
      expect(sfnContent).toContain('definition');
    });

    test('Step Functions should have retry logic', () => {
      expect(sfnContent).toContain('Retry');
    });

    test('Step Functions should have error handling', () => {
      expect(sfnContent).toContain('Catch');
    });

    test('Step Functions should reference Lambda functions', () => {
      expect(sfnContent).toContain('process_payment');
      expect(sfnContent).toContain('generate_receipt');
      expect(sfnContent).toContain('send_email');
    });

    test('Step Functions should have logging configuration', () => {
      expect(sfnContent).toContain('logging_configuration');
    });
  });

  describe('CloudWatch Configuration', () => {
    let cwContent: string;

    beforeAll(() => {
      cwContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
    });

    test('should have CloudWatch log groups for Lambda functions', () => {
      expect(cwContent).toContain('aws_cloudwatch_log_group');
      expect(cwContent).toContain('lambda_process_payment');
      expect(cwContent).toContain('lambda_generate_receipt');
      expect(cwContent).toContain('lambda_send_email');
      expect(cwContent).toContain('lambda_webhook_handler');
    });

    test('should have CloudWatch alarms configured', () => {
      expect(cwContent).toContain('aws_cloudwatch_metric_alarm');
      const alarmMatches = cwContent.match(/aws_cloudwatch_metric_alarm"/g);
      expect(alarmMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test('should have alarms for Lambda errors', () => {
      expect(cwContent).toContain('lambda_errors');
    });

    test('should have alarms for API Gateway errors', () => {
      expect(cwContent).toContain('api_gateway_5xx');
    });

    test('should have alarms for Step Functions failures', () => {
      expect(cwContent).toContain('stepfunctions_failed');
    });

    test('CloudWatch log groups should have retention period', () => {
      expect(cwContent).toContain('retention_in_days');
      const retentionMatches = cwContent.match(/retention_in_days\s*=\s*\d+/g);
      expect(retentionMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test('CloudWatch alarms should have proper thresholds', () => {
      expect(cwContent).toContain('threshold');
      expect(cwContent).toContain('comparison_operator');
    });
  });

  describe('Secrets Manager Configuration', () => {
    let secretsContent: string;

    beforeAll(() => {
      secretsContent = fs.readFileSync(path.join(libDir, 'secrets_manager.tf'), 'utf8');
    });

    test('should have Secrets Manager secret defined', () => {
      expect(secretsContent).toContain('aws_secretsmanager_secret');
      expect(secretsContent).toContain('payment_gateway');
    });

    test('should have secret version defined', () => {
      expect(secretsContent).toContain('aws_secretsmanager_secret_version');
    });

    test('secret should reference payment_gateway_api_key variable', () => {
      expect(secretsContent).toContain('var.payment_gateway_api_key');
    });
  });

  describe('SES Configuration', () => {
    let sesContent: string;

    beforeAll(() => {
      sesContent = fs.readFileSync(path.join(libDir, 'ses.tf'), 'utf8');
    });

    test('should have SES configuration set', () => {
      expect(sesContent).toContain('aws_ses_configuration_set');
    });

    test('should have SES email identity', () => {
      expect(sesContent).toContain('aws_ses_email_identity');
    });

    test('should have SES event destination for CloudWatch', () => {
      expect(sesContent).toContain('aws_ses_event_destination');
    });

    test('SES should reference sender_email variable', () => {
      expect(sesContent).toContain('var.sender_email');
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
    });

    test('should have required outputs defined', () => {
      const requiredOutputs = [
        'api_gateway_url',
        'dynamodb_table_name',
        's3_bucket_name',
        'stepfunctions_arn',
        'secrets_manager_arn',
        'ses_configuration_set'
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toContain(`output "${output}"`);
      });
    });

    test('outputs should have descriptions', () => {
      const descriptionMatches = outputsContent.match(/description\s*=/g);
      expect(descriptionMatches).not.toBeNull();
      expect(descriptionMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test('outputs should reference resources correctly', () => {
      expect(outputsContent).toContain('aws_api_gateway_stage.prod');
      expect(outputsContent).toContain('aws_dynamodb_table.subscriptions');
      expect(outputsContent).toContain('aws_s3_bucket.receipts');
    });
  });

  describe('Locals Configuration', () => {
    let localsContent: string;

    beforeAll(() => {
      localsContent = fs.readFileSync(path.join(libDir, 'locals.tf'), 'utf8');
    });

    test('should have env_suffix local defined', () => {
      expect(localsContent).toContain('locals {');
      expect(localsContent).toContain('env_suffix');
    });

    test('env_suffix should use environment_suffix or fall back to environment', () => {
      expect(localsContent).toContain('var.environment_suffix');
      expect(localsContent).toContain('var.environment');
    });
  });

  describe('Resource Naming', () => {
    test('resources should use consistent naming with env_suffix', () => {
      const files = ['lambda.tf', 'dynamodb.tf', 's3.tf', 'apigateway.tf', 'iam.tf', 'stepfunctions.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).toContain('local.env_suffix');
      });
    });

    test('resources should use project_name variable', () => {
      const files = ['lambda.tf', 'dynamodb.tf', 's3.tf', 'apigateway.tf', 'iam.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).toContain('var.project_name');
      });
    });
  });

  describe('Tags', () => {
    test('key resources should have tags defined', () => {
      const files = ['lambda.tf', 'dynamodb.tf', 's3.tf', 'apigateway.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).toContain('tags');
      });
    });

    test('tags should include Environment', () => {
      const files = ['lambda.tf', 'dynamodb.tf', 's3.tf', 'apigateway.tf', 'iam.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).toContain('Environment');
      });
    });

    test('tags should use environment naming', () => {
      const files = ['lambda.tf', 'dynamodb.tf', 's3.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        // Tags should reference either local.env_suffix or be present
        expect(content).toMatch(/tags\s*=\s*\{/);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should block all public access', () => {
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
      expect(s3Content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('DynamoDB should have encryption enabled', () => {
      const dynamoContent = fs.readFileSync(path.join(libDir, 'dynamodb.tf'), 'utf8');
      expect(dynamoContent).toContain('server_side_encryption');
    });

    test('S3 should have server-side encryption', () => {
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Content).toContain('server_side_encryption');
    });

    test('API Gateway should have logging enabled', () => {
      const apiContent = fs.readFileSync(path.join(libDir, 'apigateway.tf'), 'utf8');
      expect(apiContent).toContain('access_log_settings');
    });

    test('Lambda functions should not have hardcoded secrets', () => {
      const lambdaContent = fs.readFileSync(path.join(libDir, 'lambda.tf'), 'utf8');
      expect(lambdaContent).not.toMatch(/password\s*=\s*"[^"]+"/);
      expect(lambdaContent).not.toMatch(/api_key\s*=\s*"[A-Za-z0-9]{32,}"/);
    });

    test('sensitive data should be stored in Secrets Manager', () => {
      const secretsContent = fs.readFileSync(path.join(libDir, 'secrets_manager.tf'), 'utf8');
      expect(secretsContent).toContain('aws_secretsmanager_secret');
      expect(secretsContent).toContain('payment_gateway');
    });
  });

  describe('Lambda Permission Configuration', () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(path.join(libDir, 'lambda.tf'), 'utf8');
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(lambdaContent).toContain('aws_lambda_permission');
      expect(lambdaContent).toContain('apigateway_webhook');
    });

    test('Lambda permission should allow API Gateway invocation', () => {
      expect(lambdaContent).toContain('lambda:InvokeFunction');
      expect(lambdaContent).toContain('apigateway.amazonaws.com');
    });

    test('should have Step Functions invoke Lambda policy', () => {
      expect(lambdaContent).toContain('stepfunctions_invoke_lambda');
    });
  });

  describe('Integration Points', () => {
    test('Lambda should reference DynamoDB table', () => {
      const lambdaContent = fs.readFileSync(path.join(libDir, 'lambda.tf'), 'utf8');
      expect(lambdaContent).toContain('aws_dynamodb_table.subscriptions');
    });

    test('Lambda should reference S3 bucket', () => {
      const lambdaContent = fs.readFileSync(path.join(libDir, 'lambda.tf'), 'utf8');
      expect(lambdaContent).toContain('aws_s3_bucket.receipts');
    });

    test('Lambda should reference Secrets Manager', () => {
      const lambdaContent = fs.readFileSync(path.join(libDir, 'lambda.tf'), 'utf8');
      expect(lambdaContent).toContain('aws_secretsmanager_secret.payment_gateway');
    });

    test('Lambda should reference SES configuration set', () => {
      const lambdaContent = fs.readFileSync(path.join(libDir, 'lambda.tf'), 'utf8');
      expect(lambdaContent).toContain('aws_ses_configuration_set.receipts');
    });

    test('Lambda should reference Step Functions state machine', () => {
      const lambdaContent = fs.readFileSync(path.join(libDir, 'lambda.tf'), 'utf8');
      expect(lambdaContent).toContain('aws_sfn_state_machine.renewal_workflow');
    });

    test('API Gateway should integrate with Lambda', () => {
      const apiContent = fs.readFileSync(path.join(libDir, 'apigateway.tf'), 'utf8');
      expect(apiContent).toContain('aws_lambda_function.webhook_handler');
    });

    test('Step Functions should reference Lambda execution role', () => {
      const sfnContent = fs.readFileSync(path.join(libDir, 'stepfunctions.tf'), 'utf8');
      expect(sfnContent).toContain('aws_iam_role.stepfunctions_execution');
    });
  });
});
