/**
 * Unit tests for Financial Market Data Processing Infrastructure
 * Platform: Terraform
 * Language: HCL
 *
 * These tests validate the Terraform configuration without deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Terraform Market Data Stack Unit Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

  describe('Terraform Configuration Validation', () => {
    test('terraform files exist', () => {
      expect(fs.existsSync(path.join(libDir, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libDir, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libDir, 'outputs.tf'))).toBe(true);
    });

    test('terraform validate passes', () => {
      try {
        execSync(`cd ${libDir} && terraform init -backend=false`, { stdio: 'pipe' });
        const result = execSync(`cd ${libDir} && terraform validate`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toContain('Success');
      } catch (error: any) {
        throw new Error(`Terraform validation failed: ${error.message}`);
      }
    });

    test('terraform fmt check passes', () => {
      const result = execSync(`cd ${libDir} && terraform fmt -check -recursive`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      // If result is empty, all files are properly formatted
      expect(result).toBe('');
    });
  });

  describe('Resource Naming Convention', () => {
    let mainTfContent: string;
    let variablesTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      variablesTfContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    });

    test('environment_suffix variable is defined', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
    });

    test('all DynamoDB tables include environment_suffix in name', () => {
      const dynamoTablePattern = /resource\s+"aws_dynamodb_table"\s+"(\w+)"\s+{[\s\S]*?name\s+=\s+"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(dynamoTablePattern)];

      expect(matches.length).toBeGreaterThan(0);

      matches.forEach(match => {
        const tableName = match[2];
        expect(tableName).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('Lambda function includes environment_suffix in name', () => {
      const lambdaPattern = /resource\s+"aws_lambda_function"\s+"(\w+)"\s+{[\s\S]*?function_name\s+=\s+"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(lambdaPattern)];

      expect(matches.length).toBeGreaterThanOrEqual(1);

      matches.forEach(match => {
        const functionName = match[2];
        expect(functionName).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('EventBridge event bus includes environment_suffix in name', () => {
      const eventBusPattern = /resource\s+"aws_cloudwatch_event_bus"\s+"(\w+)"\s+{[\s\S]*?name\s+=\s+"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(eventBusPattern)];

      expect(matches.length).toBeGreaterThanOrEqual(1);

      matches.forEach(match => {
        const busName = match[2];
        expect(busName).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('SQS queue includes environment_suffix in name', () => {
      const sqsPattern = /resource\s+"aws_sqs_queue"\s+"(\w+)"\s+{[\s\S]*?name\s+=\s+"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(sqsPattern)];

      expect(matches.length).toBeGreaterThanOrEqual(1);

      matches.forEach(match => {
        const queueName = match[2];
        expect(queueName).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('IAM role includes environment_suffix in name', () => {
      const iamRolePattern = /resource\s+"aws_iam_role"\s+"(\w+)"\s+{[\s\S]*?name\s+=\s+"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(iamRolePattern)];

      expect(matches.length).toBeGreaterThanOrEqual(1);

      matches.forEach(match => {
        const roleName = match[2];
        expect(roleName).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('CloudWatch log group includes environment_suffix in name', () => {
      const logGroupPattern = /resource\s+"aws_cloudwatch_log_group"\s+"(\w+)"\s+{[\s\S]*?name\s+=\s+"([^"]+)"/g;
      const matches = [...mainTfContent.matchAll(logGroupPattern)];

      expect(matches.length).toBeGreaterThanOrEqual(1);

      matches.forEach(match => {
        const logGroupName = match[2];
        expect(logGroupName).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });
  });

  describe('DynamoDB Tables Configuration', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('market data table has correct hash and range keys', () => {
      // Extract the full market_data table resource block
      const startIndex = mainTfContent.indexOf('resource "aws_dynamodb_table" "market_data"');
      expect(startIndex).toBeGreaterThan(-1);

      let braceCount = 0;
      let inResource = false;
      let endIndex = startIndex;

      for (let i = startIndex; i < mainTfContent.length; i++) {
        if (mainTfContent[i] === '{') {
          braceCount++;
          inResource = true;
        } else if (mainTfContent[i] === '}') {
          braceCount--;
          if (inResource && braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }

      const tableConfig = mainTfContent.substring(startIndex, endIndex);
      expect(tableConfig).toContain('hash_key');
      expect(tableConfig).toContain('range_key');
      expect(tableConfig).toContain('event_id');
      expect(tableConfig).toContain('timestamp');
    });

    test('market data table has global secondary indexes', () => {
      // Extract the full market_data table resource block
      const startIndex = mainTfContent.indexOf('resource "aws_dynamodb_table" "market_data"');
      let braceCount = 0;
      let inResource = false;
      let endIndex = startIndex;

      for (let i = startIndex; i < mainTfContent.length; i++) {
        if (mainTfContent[i] === '{') {
          braceCount++;
          inResource = true;
        } else if (mainTfContent[i] === '}') {
          braceCount--;
          if (inResource && braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }

      const tableConfig = mainTfContent.substring(startIndex, endIndex);
      expect(tableConfig).toContain('global_secondary_index');
      expect(tableConfig).toContain('ExchangeIndex');
      expect(tableConfig).toContain('SymbolIndex');
    });

    test('market data table has point-in-time recovery enabled', () => {
      const pitrPattern = /point_in_time_recovery\s+{[\s\S]*?enabled\s+=\s+true/;
      const matches = mainTfContent.match(pitrPattern);
      expect(matches).toBeTruthy();
    });

    test('market data table has server-side encryption enabled', () => {
      const encryptionPattern = /server_side_encryption\s+{[\s\S]*?enabled\s+=\s+true/;
      const matches = mainTfContent.match(encryptionPattern);
      expect(matches).toBeTruthy();
    });

    test('market data table has TTL configured', () => {
      expect(mainTfContent).toContain('ttl {');
      expect(mainTfContent).toContain('expiration_time');
    });

    test('audit trail table exists with correct configuration', () => {
      // Extract the full audit_trail table resource block
      const startIndex = mainTfContent.indexOf('resource "aws_dynamodb_table" "audit_trail"');
      expect(startIndex).toBeGreaterThan(-1);

      let braceCount = 0;
      let inResource = false;
      let endIndex = startIndex;

      for (let i = startIndex; i < mainTfContent.length; i++) {
        if (mainTfContent[i] === '{') {
          braceCount++;
          inResource = true;
        } else if (mainTfContent[i] === '}') {
          braceCount--;
          if (inResource && braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }

      const tableConfig = mainTfContent.substring(startIndex, endIndex);
      expect(tableConfig).toContain('hash_key');
      expect(tableConfig).toContain('range_key');
      expect(tableConfig).toContain('audit_id');
      expect(tableConfig).toContain('timestamp');
    });

    test('billing mode is PAY_PER_REQUEST', () => {
      const billingPattern = /billing_mode\s*=\s*var\.dynamodb_billing_mode/g;
      const matches = [...mainTfContent.matchAll(billingPattern)];
      expect(matches.length).toBeGreaterThanOrEqual(2); // Both tables

      // Verify the variable default value is PAY_PER_REQUEST
      const variablesTfContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(variablesTfContent).toContain('default     = "PAY_PER_REQUEST"');
    });
  });

  describe('Lambda Function Configuration', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('Lambda function resource exists', () => {
      expect(mainTfContent).toContain('resource "aws_lambda_function" "market_processor"');
    });

    test('Lambda function uses correct runtime', () => {
      const lambdaMatch = mainTfContent.match(
        /resource\s+"aws_lambda_function"\s+"market_processor"\s+{[\s\S]*?runtime\s+=\s+var\.lambda_runtime/
      );
      expect(lambdaMatch).toBeTruthy();
    });

    test('Lambda function has correct handler', () => {
      expect(mainTfContent).toContain('handler          = "handler.lambda_handler"');
    });

    test('Lambda function has environment variables', () => {
      // Extract the full Lambda function resource block
      const startIndex = mainTfContent.indexOf('resource "aws_lambda_function" "market_processor"');
      let braceCount = 0;
      let inResource = false;
      let endIndex = startIndex;

      for (let i = startIndex; i < mainTfContent.length; i++) {
        if (mainTfContent[i] === '{') {
          braceCount++;
          inResource = true;
        } else if (mainTfContent[i] === '}') {
          braceCount--;
          if (inResource && braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }

      const lambdaConfig = mainTfContent.substring(startIndex, endIndex);
      expect(lambdaConfig).toContain('environment');
      expect(lambdaConfig).toContain('variables');
      expect(lambdaConfig).toContain('MARKET_DATA_TABLE');
      expect(lambdaConfig).toContain('AUDIT_TRAIL_TABLE');
    });

    test('Lambda function has dead letter config', () => {
      expect(mainTfContent).toContain('dead_letter_config {');
      expect(mainTfContent).toContain('target_arn');
    });

    test('Lambda function has timeout and memory configured', () => {
      const lambdaMatch = mainTfContent.match(
        /resource\s+"aws_lambda_function"\s+"market_processor"\s+{[\s\S]*?timeout\s+=\s+var\.lambda_timeout/
      );
      expect(lambdaMatch).toBeTruthy();

      const memoryMatch = mainTfContent.match(
        /resource\s+"aws_lambda_function"\s+"market_processor"\s+{[\s\S]*?memory_size\s+=\s+var\.lambda_memory/
      );
      expect(memoryMatch).toBeTruthy();
    });

    test('Lambda handler file exists', () => {
      const handlerPath = path.join(libDir, 'lambda', 'handler.py');
      expect(fs.existsSync(handlerPath)).toBe(true);
    });
  });

  describe('EventBridge Configuration', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('EventBridge event bus exists', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_event_bus" "market_data"');
    });

    test('trade events rule exists with correct pattern', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_event_rule" "trade_events"');

      const tradeRuleMatch = mainTfContent.match(
        /resource\s+"aws_cloudwatch_event_rule"\s+"trade_events"\s+{[\s\S]*?event_pattern\s+=\s+jsonencode\(\{[\s\S]*?\}\)/
      );
      expect(tradeRuleMatch).toBeTruthy();
      expect(tradeRuleMatch[0]).toContain('Trade Execution');
      expect(tradeRuleMatch[0]).toContain('market.data');
    });

    test('quote events rule exists with correct pattern', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_event_rule" "quote_events"');

      const quoteRuleMatch = mainTfContent.match(
        /resource\s+"aws_cloudwatch_event_rule"\s+"quote_events"\s+{[\s\S]*?event_pattern\s+=\s+jsonencode\(\{[\s\S]*?\}\)/
      );
      expect(quoteRuleMatch).toBeTruthy();
      expect(quoteRuleMatch[0]).toContain('Market Quote');
      expect(quoteRuleMatch[0]).toContain('market.data');
    });

    test('event targets are configured with retry policy', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_event_target" "trade_lambda"');
      expect(mainTfContent).toContain('resource "aws_cloudwatch_event_target" "quote_lambda"');

      const retryPolicyMatches = [...mainTfContent.matchAll(/retry_policy\s+{/g)];
      expect(retryPolicyMatches.length).toBeGreaterThanOrEqual(2);
    });

    test('event targets have dead letter config', () => {
      const deadLetterMatches = [...mainTfContent.matchAll(/dead_letter_config\s+{[\s\S]*?arn\s+=/g)];
      expect(deadLetterMatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('IAM Configuration', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('Lambda IAM role exists', () => {
      expect(mainTfContent).toContain('resource "aws_iam_role" "lambda_execution"');
    });

    test('Lambda IAM role has correct assume role policy', () => {
      const roleMatch = mainTfContent.match(
        /resource\s+"aws_iam_role"\s+"lambda_execution"\s+{[\s\S]*?assume_role_policy\s+=\s+jsonencode\(\{[\s\S]*?\}\)/
      );
      expect(roleMatch).toBeTruthy();
      expect(roleMatch[0]).toContain('lambda.amazonaws.com');
      expect(roleMatch[0]).toContain('sts:AssumeRole');
    });

    test('IAM policy for DynamoDB access exists', () => {
      expect(mainTfContent).toContain('resource "aws_iam_role_policy" "lambda_dynamodb"');

      const dynamoPolicyMatch = mainTfContent.match(
        /resource\s+"aws_iam_role_policy"\s+"lambda_dynamodb"\s+{[\s\S]*?policy\s+=\s+jsonencode\(\{[\s\S]*?\}\)/
      );
      expect(dynamoPolicyMatch).toBeTruthy();
      expect(dynamoPolicyMatch[0]).toContain('dynamodb:PutItem');
      expect(dynamoPolicyMatch[0]).toContain('dynamodb:GetItem');
      expect(dynamoPolicyMatch[0]).toContain('dynamodb:Query');
    });

    test('IAM policy for CloudWatch Logs exists', () => {
      expect(mainTfContent).toContain('resource "aws_iam_role_policy" "lambda_logging"');

      const logsPolicyMatch = mainTfContent.match(
        /resource\s+"aws_iam_role_policy"\s+"lambda_logging"\s+{[\s\S]*?policy\s+=\s+jsonencode\(\{[\s\S]*?\}\)/
      );
      expect(logsPolicyMatch).toBeTruthy();
      expect(logsPolicyMatch[0]).toContain('logs:CreateLogGroup');
      expect(logsPolicyMatch[0]).toContain('logs:CreateLogStream');
      expect(logsPolicyMatch[0]).toContain('logs:PutLogEvents');
    });

    test('IAM policy for SQS DLQ exists', () => {
      expect(mainTfContent).toContain('resource "aws_iam_role_policy" "lambda_dlq"');

      const dlqPolicyMatch = mainTfContent.match(
        /resource\s+"aws_iam_role_policy"\s+"lambda_dlq"\s+{[\s\S]*?policy\s+=\s+jsonencode\(\{[\s\S]*?\}\)/
      );
      expect(dlqPolicyMatch).toBeTruthy();
      expect(dlqPolicyMatch[0]).toContain('sqs:SendMessage');
    });
  });

  describe('CloudWatch Configuration', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('CloudWatch log group exists', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_log_group" "market_processor"');
    });

    test('CloudWatch log group has correct retention', () => {
      const logGroupMatch = mainTfContent.match(
        /resource\s+"aws_cloudwatch_log_group"\s+"market_processor"\s+{[\s\S]*?retention_in_days\s+=\s+var\.log_retention_days/
      );
      expect(logGroupMatch).toBeTruthy();
    });

    test('CloudWatch alarm for Lambda errors exists', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_metric_alarm" "lambda_errors"');

      const errorAlarmMatch = mainTfContent.match(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s+{[\s\S]*?metric_name\s+=\s+"Errors"/
      );
      expect(errorAlarmMatch).toBeTruthy();
    });

    test('CloudWatch alarm for Lambda duration exists', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_metric_alarm" "lambda_duration"');

      const durationAlarmMatch = mainTfContent.match(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_duration"\s+{[\s\S]*?metric_name\s+=\s+"Duration"/
      );
      expect(durationAlarmMatch).toBeTruthy();
    });
  });

  describe('SQS Dead Letter Queue', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('SQS DLQ exists', () => {
      expect(mainTfContent).toContain('resource "aws_sqs_queue" "dlq"');
    });

    test('SQS DLQ has correct message retention', () => {
      const dlqMatch = mainTfContent.match(
        /resource\s+"aws_sqs_queue"\s+"dlq"\s+{[\s\S]*?message_retention_seconds\s+=\s+1209600/
      );
      expect(dlqMatch).toBeTruthy();
    });
  });

  describe('No Forbidden Lifecycle Policies', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('no resources have prevent_destroy lifecycle', () => {
      expect(mainTfContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test('no resources have RETAIN deletion policy', () => {
      expect(mainTfContent).not.toMatch(/deletion_policy\s*=\s*["']RETAIN["']/i);
    });
  });

  describe('Lambda Permissions', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('Lambda has permissions for EventBridge trade events', () => {
      expect(mainTfContent).toContain('resource "aws_lambda_permission" "eventbridge_trade"');

      const permMatch = mainTfContent.match(
        /resource\s+"aws_lambda_permission"\s+"eventbridge_trade"\s+{[\s\S]*?principal\s+=\s+"events\.amazonaws\.com"/
      );
      expect(permMatch).toBeTruthy();
    });

    test('Lambda has permissions for EventBridge quote events', () => {
      expect(mainTfContent).toContain('resource "aws_lambda_permission" "eventbridge_quote"');

      const permMatch = mainTfContent.match(
        /resource\s+"aws_lambda_permission"\s+"eventbridge_quote"\s+{[\s\S]*?principal\s+=\s+"events\.amazonaws\.com"/
      );
      expect(permMatch).toBeTruthy();
    });
  });

  describe('Outputs Configuration', () => {
    let outputsTfContent: string;

    beforeAll(() => {
      outputsTfContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
    });

    test('event bus outputs are defined', () => {
      expect(outputsTfContent).toContain('output "event_bus_name"');
      expect(outputsTfContent).toContain('output "event_bus_arn"');
    });

    test('Lambda function outputs are defined', () => {
      expect(outputsTfContent).toContain('output "lambda_function_name"');
      expect(outputsTfContent).toContain('output "lambda_function_arn"');
    });

    test('DynamoDB table outputs are defined', () => {
      expect(outputsTfContent).toContain('output "market_data_table_name"');
      expect(outputsTfContent).toContain('output "market_data_table_arn"');
      expect(outputsTfContent).toContain('output "audit_trail_table_name"');
      expect(outputsTfContent).toContain('output "audit_trail_table_arn"');
    });

    test('DLQ outputs are defined', () => {
      expect(outputsTfContent).toContain('output "dlq_url"');
      expect(outputsTfContent).toContain('output "dlq_arn"');
    });

    test('log group output is defined', () => {
      expect(outputsTfContent).toContain('output "log_group_name"');
    });

    test('EventBridge rule outputs are defined', () => {
      expect(outputsTfContent).toContain('output "trade_events_rule_arn"');
      expect(outputsTfContent).toContain('output "quote_events_rule_arn"');
    });
  });

  describe('No Hardcoded Values', () => {
    let mainTfContent: string;
    let variablesTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      variablesTfContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    });

    test('no hardcoded environment values in resource names', () => {
      expect(mainTfContent).not.toMatch(/name\s+=\s+"[^"]*-(prod|dev|stage|staging)-/);
    });

    test('variables file does not have hardcoded environment in defaults', () => {
      // Check for hardcoded environment values in default tags
      const tagsDefault = variablesTfContent.match(/variable\s+"tags"\s+{[\s\S]*?default\s+=\s+{[\s\S]*?}/);
      if (tagsDefault) {
        expect(tagsDefault[0]).not.toMatch(/Environment\s*=\s*"(prod|production|dev|development|stage|staging)"/);
      }
    });
  });
});
