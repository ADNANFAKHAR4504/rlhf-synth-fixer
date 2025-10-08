import { App, Testing, TerraformStack } from 'cdktf';
import { LoyaltyProgramStack } from '../lib/loyalty-program-stack';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');

describe('LoyaltyProgramStack Unit Tests', () => {
  let app: App;
  let tfStack: TerraformStack;
  let stack: LoyaltyProgramStack;
  let synthesized: any;

  const mockLambdaCode = `
    exports.handler = async (event) => {
      return { statusCode: 200 };
    };
  `;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs.readFileSync for Lambda code
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('point-calc-lambda.js')) {
        return mockLambdaCode;
      }
      if (filePath.includes('stream-processor-lambda.js')) {
        return mockLambdaCode;
      }
      return '';
    });
  });

  describe('Stack Initialization', () => {
    test('LoyaltyProgramStack instantiates with required props', () => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStack');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestLoyaltyStack', {
        environmentSuffix: 'test',
      });

      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('Archive provider is registered', () => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackArchive');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestArchiveProvider', {
        environmentSuffix: 'test',
      });

      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);

      expect(synthesized.provider).toBeDefined();
      expect(synthesized.provider.archive).toBeDefined();
    });
  });

  describe('DynamoDB Resources', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackDynamoDB');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestDynamoDB', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates DynamoDB table with correct configuration', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;
      expect(dynamoTables).toBeDefined();

      const memberTable = Object.values(dynamoTables)[0] as any;
      expect(memberTable.name).toBe('loyalty-members-test');
      expect(memberTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(memberTable.hash_key).toBe('memberId');
      expect(memberTable.range_key).toBe('transactionId');
    });

    test('DynamoDB table has streams enabled', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;
      const memberTable = Object.values(dynamoTables)[0] as any;

      expect(memberTable.stream_enabled).toBe(true);
      expect(memberTable.stream_view_type).toBe('NEW_AND_OLD_IMAGES');
    });

    test('DynamoDB table has GSI for email lookups', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;
      const memberTable = Object.values(dynamoTables)[0] as any;

      expect(memberTable.global_secondary_index).toBeDefined();
      expect(memberTable.global_secondary_index[0].name).toBe('email-index');
      expect(memberTable.global_secondary_index[0].hash_key).toBe('email');
      expect(memberTable.global_secondary_index[0].projection_type).toBe('ALL');
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;
      const memberTable = Object.values(dynamoTables)[0] as any;

      expect(memberTable.point_in_time_recovery).toBeDefined();
      expect(memberTable.point_in_time_recovery.enabled).toBe(true);
    });

    test('DynamoDB table has server-side encryption', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;
      const memberTable = Object.values(dynamoTables)[0] as any;

      expect(memberTable.server_side_encryption).toBeDefined();
      expect(memberTable.server_side_encryption.enabled).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackLambda');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestLambda', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates point calculation Lambda function', () => {
      const lambdas = synthesized.resource.aws_lambda_function;
      expect(lambdas).toBeDefined();

      const pointCalcLambda = Object.values(lambdas).find((l: any) =>
        l.function_name === 'loyalty-point-calc-test'
      );

      expect(pointCalcLambda).toBeDefined();
      expect((pointCalcLambda as any).runtime).toBe('nodejs20.x');
      expect((pointCalcLambda as any).handler).toBe('index.handler');
      expect((pointCalcLambda as any).timeout).toBe(30);
      expect((pointCalcLambda as any).memory_size).toBe(256);
    });

    test('Creates stream processor Lambda function', () => {
      const lambdas = synthesized.resource.aws_lambda_function;
      const streamLambda = Object.values(lambdas).find((l: any) =>
        l.function_name === 'loyalty-stream-processor-test'
      );

      expect(streamLambda).toBeDefined();
      expect((streamLambda as any).runtime).toBe('nodejs20.x');
      expect((streamLambda as any).handler).toBe('index.handler');
      expect((streamLambda as any).timeout).toBe(60);
      expect((streamLambda as any).memory_size).toBe(256);
    });

    test('Lambda functions have environment variables', () => {
      const lambdas = synthesized.resource.aws_lambda_function;

      const pointCalcLambda = Object.values(lambdas).find((l: any) =>
        l.function_name === 'loyalty-point-calc-test'
      );
      expect((pointCalcLambda as any).environment).toBeDefined();
      expect((pointCalcLambda as any).environment.variables.LOYALTY_TABLE_NAME).toBeDefined();

      const streamLambda = Object.values(lambdas).find((l: any) =>
        l.function_name === 'loyalty-stream-processor-test'
      );
      expect((streamLambda as any).environment).toBeDefined();
      expect((streamLambda as any).environment.variables.LOYALTY_TABLE_NAME).toBeDefined();
      expect((streamLambda as any).environment.variables.SNS_TOPIC_ARN).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackIAM');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestIAM', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates IAM role for point calculation Lambda', () => {
      const roles = synthesized.resource.aws_iam_role;
      expect(roles).toBeDefined();

      const lambdaRole = Object.values(roles).find((r: any) =>
        r.name === 'loyalty-point-calc-lambda-test'
      );

      expect(lambdaRole).toBeDefined();
      const assumeRolePolicy = JSON.parse((lambdaRole as any).assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('Creates IAM role for stream processor Lambda', () => {
      const roles = synthesized.resource.aws_iam_role;
      const streamRole = Object.values(roles).find((r: any) =>
        r.name === 'loyalty-stream-processor-test'
      );

      expect(streamRole).toBeDefined();
    });

    test('Creates IAM policies with least privilege', () => {
      const policies = synthesized.resource.aws_iam_policy;
      expect(policies).toBeDefined();

      const pointCalcPolicy = Object.values(policies).find((p: any) =>
        p.name === 'loyalty-point-calc-test'
      );

      expect(pointCalcPolicy).toBeDefined();
      const policyDoc = JSON.parse((pointCalcPolicy as any).policy);
      const dynamoStatement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('dynamodb:TransactWriteItems')
      );
      expect(dynamoStatement).toBeDefined();
    });
  });

  describe('SNS Configuration', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackSNS');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestSNS', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates SNS topic for notifications', () => {
      const snsTopics = synthesized.resource.aws_sns_topic;
      expect(snsTopics).toBeDefined();

      const notificationTopic = Object.values(snsTopics)[0] as any;
      expect(notificationTopic.name).toBe('loyalty-notifications-test');
      expect(notificationTopic.display_name).toBe('Loyalty Program Notifications');
      expect(notificationTopic.kms_master_key_id).toBe('alias/aws/sns');
    });
  });

  describe('API Gateway Configuration', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackAPI');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestAPI', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates REST API with correct configuration', () => {
      const apis = synthesized.resource.aws_api_gateway_rest_api;
      expect(apis).toBeDefined();

      const api = Object.values(apis)[0] as any;
      expect(api.name).toBe('loyalty-api-test');
      expect(api.description).toBe('Loyalty Program API');
      expect(api.endpoint_configuration.types).toContain('REGIONAL');
    });

    test('Creates request validator', () => {
      const validators = synthesized.resource.aws_api_gateway_request_validator;
      expect(validators).toBeDefined();

      const validator = Object.values(validators)[0] as any;
      expect(validator.name).toBe('request-validator');
      expect(validator.validate_request_body).toBe(true);
      expect(validator.validate_request_parameters).toBe(true);
    });

    test('Creates transactions resource', () => {
      const resources = synthesized.resource.aws_api_gateway_resource;
      expect(resources).toBeDefined();

      const transactionsResource = Object.values(resources)[0] as any;
      expect(transactionsResource.path_part).toBe('transactions');
    });

    test('Creates POST method for transactions', () => {
      const methods = synthesized.resource.aws_api_gateway_method;
      expect(methods).toBeDefined();

      const method = Object.values(methods)[0] as any;
      expect(method.http_method).toBe('POST');
      expect(method.authorization).toBe('NONE');
    });

    test('Creates Lambda integration', () => {
      const integrations = synthesized.resource.aws_api_gateway_integration;
      expect(integrations).toBeDefined();

      const integration = Object.values(integrations)[0] as any;
      expect(integration.type).toBe('AWS_PROXY');
      expect(integration.integration_http_method).toBe('POST');
    });
  });

  describe('EventBridge Configuration', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackEventBridge');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestEventBridge', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates EventBridge rule for periodic tier review', () => {
      const rules = synthesized.resource.aws_cloudwatch_event_rule;
      expect(rules).toBeDefined();

      const rule = Object.values(rules)[0] as any;
      expect(rule.name).toBe('loyalty-tier-review-test');
      expect(rule.description).toBe('Periodic tier review for loyalty members');
      expect(rule.schedule_expression).toBe('rate(1 day)');
    });

    test('Creates EventBridge target for Lambda', () => {
      const targets = synthesized.resource.aws_cloudwatch_event_target;
      expect(targets).toBeDefined();

      const target = Object.values(targets)[0] as any;
      expect(target.rule).toBeDefined();
      expect(target.arn).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackCloudWatch');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestCloudWatch', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates CloudWatch alarms for high transaction volume', () => {
      const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;
      expect(alarms).toBeDefined();

      const highVolumeAlarm = Object.values(alarms).find((a: any) =>
        a.alarm_name === 'loyalty-high-transactions-test'
      );

      expect(highVolumeAlarm).toBeDefined();
      expect((highVolumeAlarm as any).metric_name).toBe('Invocations');
      expect((highVolumeAlarm as any).threshold).toBe(1000);
      expect((highVolumeAlarm as any).comparison_operator).toBe('GreaterThanThreshold');
    });

    test('Creates CloudWatch alarms for failed transactions', () => {
      const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;

      const failedAlarm = Object.values(alarms).find((a: any) =>
        a.alarm_name === 'loyalty-failed-transactions-test'
      );

      expect(failedAlarm).toBeDefined();
      expect((failedAlarm as any).metric_name).toBe('Errors');
      expect((failedAlarm as any).threshold).toBe(10);
    });

    test('Creates CloudWatch dashboard', () => {
      const dashboards = synthesized.resource.aws_cloudwatch_dashboard;
      expect(dashboards).toBeDefined();

      const dashboard = Object.values(dashboards)[0] as any;
      expect(dashboard.dashboard_name).toBe('loyalty-metrics-test');

      const body = JSON.parse(dashboard.dashboard_body);
      expect(body.widgets).toBeDefined();
      expect(body.widgets.length).toBeGreaterThan(0);
      expect(body.widgets[0].properties.title).toBe('Transaction Metrics');
    });
  });

  describe('Lambda Permissions', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackPermissions');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestPermissions', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates Lambda permission for API Gateway', () => {
      const permissions = synthesized.resource.aws_lambda_permission;
      expect(permissions).toBeDefined();

      const apiPermission = Object.values(permissions).find((p: any) =>
        p.statement_id === 'AllowAPIGatewayInvoke'
      );

      expect(apiPermission).toBeDefined();
      expect((apiPermission as any).action).toBe('lambda:InvokeFunction');
      expect((apiPermission as any).principal).toBe('apigateway.amazonaws.com');
    });

    test('Creates Lambda permission for EventBridge', () => {
      const permissions = synthesized.resource.aws_lambda_permission;

      const eventPermission = Object.values(permissions).find((p: any) =>
        p.statement_id === 'AllowEventBridgeInvoke'
      );

      expect(eventPermission).toBeDefined();
      expect((eventPermission as any).principal).toBe('events.amazonaws.com');
    });
  });

  describe('DynamoDB Streams Integration', () => {
    beforeEach(() => {
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackStreams');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestStreams', {
        environmentSuffix: 'test',
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);
    });

    test('Creates event source mapping for DynamoDB streams', () => {
      const mappings = synthesized.resource.aws_lambda_event_source_mapping;
      expect(mappings).toBeDefined();

      const streamMapping = Object.values(mappings)[0] as any;
      expect(streamMapping.starting_position).toBe('LATEST');
      expect(streamMapping.maximum_batching_window_in_seconds).toBe(5);
      expect(streamMapping.parallelization_factor).toBe(10);
      expect(streamMapping.maximum_retry_attempts).toBe(3);
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources include environment suffix', () => {
      const suffix = 'naming-test';
      app = new App();
      tfStack = new TerraformStack(app, 'TestStackNaming');
      new AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
      stack = new LoyaltyProgramStack(tfStack, 'TestNaming', {
        environmentSuffix: suffix,
      });
      const synthResult = Testing.synth(tfStack);
      synthesized = JSON.parse(synthResult);

      // Check DynamoDB table
      const dynamoTables = synthesized.resource.aws_dynamodb_table;
      const memberTable = Object.values(dynamoTables)[0] as any;
      expect(memberTable.name).toContain(suffix);

      // Check Lambda functions
      const lambdas = synthesized.resource.aws_lambda_function;
      Object.values(lambdas).forEach((lambda: any) => {
        expect(lambda.function_name).toContain(suffix);
      });

      // Check SNS topic
      const snsTopics = synthesized.resource.aws_sns_topic;
      const topic = Object.values(snsTopics)[0] as any;
      expect(topic.name).toContain(suffix);

      // Check API Gateway
      const apis = synthesized.resource.aws_api_gateway_rest_api;
      const api = Object.values(apis)[0] as any;
      expect(api.name).toContain(suffix);

      // Check CloudWatch alarms
      const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.alarm_name).toContain(suffix);
      });

      // Check CloudWatch dashboard
      const dashboards = synthesized.resource.aws_cloudwatch_dashboard;
      const dashboard = Object.values(dashboards)[0] as any;
      expect(dashboard.dashboard_name).toContain(suffix);
    });
  });
});