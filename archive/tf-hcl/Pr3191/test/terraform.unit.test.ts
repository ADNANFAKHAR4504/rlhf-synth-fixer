// test/terraform.unit.test.ts
// Comprehensive unit tests for tap_stack.tf
// No Terraform init/plan/apply commands are executed

import fs from 'fs';
import path from 'path';

const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');
const VARIABLES_PATH = path.resolve(__dirname, '../lib/variables.tf');

let stackContent: string;
let providerContent: string;
let variablesContent: string;

describe('Terraform Infrastructure - Comprehensive Unit Tests', () => {
  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf8');
    providerContent = fs.readFileSync(PROVIDER_PATH, 'utf8');
    variablesContent = fs.readFileSync(VARIABLES_PATH, 'utf8');
  });

  describe('File Structure and Organization', () => {
    test('tap_stack.tf file exists', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test('provider.tf file exists', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('variables.tf file exists', () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test('tap_stack.tf does NOT contain provider blocks', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('tap_stack.tf does NOT contain terraform block', () => {
      expect(stackContent).not.toMatch(/\bterraform\s*{/);
    });

    test('provider.tf contains AWS provider configuration', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('provider.tf contains S3 backend configuration', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });
  });

  describe('Variables Configuration', () => {
    test('variables.tf contains aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('variables.tf contains common_tags variable', () => {
      expect(variablesContent).toMatch(/variable\s+"common_tags"\s*{/);
    });

    test('tap_stack.tf does NOT declare variables', () => {
      expect(stackContent).not.toMatch(/^variable\s+/m);
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('DynamoDB table resource is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"users"\s*{/);
    });

    test('DynamoDB table uses PAY_PER_REQUEST billing mode', () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('DynamoDB table has user_id as hash_key', () => {
      expect(stackContent).toMatch(/hash_key\s*=\s*"user_id"/);
    });

    test('DynamoDB table has server-side encryption enabled', () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Lambda function resource is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"user_crud"\s*{/);
    });

    test('Lambda function uses python3.9 runtime', () => {
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
    });

    test('Lambda function has environment variables', () => {
      expect(stackContent).toMatch(/environment\s*{[\s\S]*?DYNAMODB_TABLE/);
    });

    test('Lambda function has proper depends_on', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*?aws_cloudwatch_log_group\.lambda_logs/);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Lambda IAM role is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"\s*{/);
    });

    test('Lambda DynamoDB policy is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_dynamodb_policy"\s*{/);
    });

    test('Lambda SSM policy is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_ssm_policy"\s*{/);
    });

    test('Policy attachments exist', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic_execution"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_dynamodb"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_ssm"/);
    });
  });

  describe('API Gateway Configuration', () => {
    test('REST API Gateway is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"user_api"\s*{/);
    });

    test('API Gateway has /users resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"users"\s*{/);
    });

    test('API Gateway has /users/{id} resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"user_id"\s*{/);
    });

    test('API Gateway has all CRUD methods', () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"post_users"/);
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"get_user"/);
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"put_user"/);
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"delete_user"/);
    });

    test('API Gateway integrations use AWS_PROXY', () => {
      const integrations = stackContent.match(/type\s*=\s*"AWS_PROXY"/g);
      expect(integrations).toBeTruthy();
      expect(integrations!.length).toBeGreaterThanOrEqual(4);
    });

    test('Lambda permission allows API Gateway invocation', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway"/);
    });

    test('API Gateway deployment is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"api_deployment"/);
    });

    test('API Gateway stage is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"api_stage"/);
    });
  });

  describe('CloudWatch Logging and Monitoring', () => {
    test('CloudWatch log group for API Gateway exists', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs"/);
    });

    test('CloudWatch log group for Lambda exists', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/);
    });

    test('CloudWatch alarm for API 5XX errors exists', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_5xx_errors"/);
    });

    test('CloudWatch alarm for Lambda errors exists', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
    });
  });

  describe('SSM Parameter Store', () => {
    test('SSM parameter is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"app_name"/);
    });
  });

  describe('Outputs', () => {
    test('API invoke URL output is defined', () => {
      expect(stackContent).toMatch(/output\s+"api_invoke_url"\s*{/);
    });

    test('API execution ARN output is defined', () => {
      expect(stackContent).toMatch(/output\s+"api_execution_arn"\s*{/);
    });

    test('DynamoDB table name output is defined', () => {
      expect(stackContent).toMatch(/output\s+"dynamodb_table_name"\s*{/);
    });

    test('Lambda function name output is defined', () => {
      expect(stackContent).toMatch(/output\s+"lambda_function_name"\s*{/);
    });
  });

  describe('Security Best Practices', () => {
    test('No hardcoded credentials in stack', () => {
      expect(stackContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    test('Lambda log group is created before Lambda function', () => {
      const logPos = stackContent.indexOf('resource "aws_cloudwatch_log_group" "lambda_logs"');
      const funcPos = stackContent.indexOf('resource "aws_lambda_function" "user_crud"');
      expect(logPos).toBeLessThan(funcPos);
    });
  });

  describe('Code Quality', () => {
    test('Balanced braces', () => {
      const open = (stackContent.match(/{/g) || []).length;
      const close = (stackContent.match(/}/g) || []).length;
      expect(open).toBe(close);
    });

    test('Resources use common_tags', () => {
      const tags = stackContent.match(/tags\s*=\s*var\.common_tags/g);
      expect(tags).toBeTruthy();
      expect(tags!.length).toBeGreaterThanOrEqual(10);
    });
  });
});
