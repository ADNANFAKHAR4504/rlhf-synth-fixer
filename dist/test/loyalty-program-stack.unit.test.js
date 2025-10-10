"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cdktf_1 = require("cdktf");
const loyalty_program_stack_1 = require("../lib/loyalty-program-stack");
const provider_1 = require("@cdktf/provider-aws/lib/provider");
const fs = __importStar(require("fs"));
// Mock fs module
jest.mock('fs');
describe('LoyaltyProgramStack Unit Tests', () => {
    let app;
    let tfStack;
    let stack;
    let synthesized;
    const mockLambdaCode = `
    exports.handler = async (event) => {
      return { statusCode: 200 };
    };
  `;
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock fs.readFileSync for Lambda code
        fs.readFileSync.mockImplementation((filePath) => {
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
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStack');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestLoyaltyStack', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
            expect(stack).toBeDefined();
            expect(synthesized).toBeDefined();
        });
        test('Archive provider is registered', () => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackArchive');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestArchiveProvider', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
            expect(synthesized.provider).toBeDefined();
            expect(synthesized.provider.archive).toBeDefined();
        });
    });
    describe('DynamoDB Resources', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackDynamoDB');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestDynamoDB', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates DynamoDB table with correct configuration', () => {
            const dynamoTables = synthesized.resource.aws_dynamodb_table;
            expect(dynamoTables).toBeDefined();
            const memberTable = Object.values(dynamoTables)[0];
            expect(memberTable.name).toBe('loyalty-members-test');
            expect(memberTable.billing_mode).toBe('PAY_PER_REQUEST');
            expect(memberTable.hash_key).toBe('memberId');
            expect(memberTable.range_key).toBe('transactionId');
        });
        test('DynamoDB table has streams enabled', () => {
            const dynamoTables = synthesized.resource.aws_dynamodb_table;
            const memberTable = Object.values(dynamoTables)[0];
            expect(memberTable.stream_enabled).toBe(true);
            expect(memberTable.stream_view_type).toBe('NEW_AND_OLD_IMAGES');
        });
        test('DynamoDB table has GSI for email lookups', () => {
            const dynamoTables = synthesized.resource.aws_dynamodb_table;
            const memberTable = Object.values(dynamoTables)[0];
            expect(memberTable.global_secondary_index).toBeDefined();
            expect(memberTable.global_secondary_index[0].name).toBe('email-index');
            expect(memberTable.global_secondary_index[0].hash_key).toBe('email');
            expect(memberTable.global_secondary_index[0].projection_type).toBe('ALL');
        });
        test('DynamoDB table has point-in-time recovery enabled', () => {
            const dynamoTables = synthesized.resource.aws_dynamodb_table;
            const memberTable = Object.values(dynamoTables)[0];
            expect(memberTable.point_in_time_recovery).toBeDefined();
            expect(memberTable.point_in_time_recovery.enabled).toBe(true);
        });
        test('DynamoDB table has server-side encryption', () => {
            const dynamoTables = synthesized.resource.aws_dynamodb_table;
            const memberTable = Object.values(dynamoTables)[0];
            expect(memberTable.server_side_encryption).toBeDefined();
            expect(memberTable.server_side_encryption.enabled).toBe(true);
        });
    });
    describe('Lambda Functions', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackLambda');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestLambda', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates point calculation Lambda function', () => {
            const lambdas = synthesized.resource.aws_lambda_function;
            expect(lambdas).toBeDefined();
            const pointCalcLambda = Object.values(lambdas).find((l) => l.function_name === 'loyalty-point-calc-test');
            expect(pointCalcLambda).toBeDefined();
            expect(pointCalcLambda.runtime).toBe('nodejs20.x');
            expect(pointCalcLambda.handler).toBe('index.handler');
            expect(pointCalcLambda.timeout).toBe(30);
            expect(pointCalcLambda.memory_size).toBe(256);
        });
        test('Creates stream processor Lambda function', () => {
            const lambdas = synthesized.resource.aws_lambda_function;
            const streamLambda = Object.values(lambdas).find((l) => l.function_name === 'loyalty-stream-processor-test');
            expect(streamLambda).toBeDefined();
            expect(streamLambda.runtime).toBe('nodejs20.x');
            expect(streamLambda.handler).toBe('index.handler');
            expect(streamLambda.timeout).toBe(60);
            expect(streamLambda.memory_size).toBe(256);
        });
        test('Lambda functions have environment variables', () => {
            const lambdas = synthesized.resource.aws_lambda_function;
            const pointCalcLambda = Object.values(lambdas).find((l) => l.function_name === 'loyalty-point-calc-test');
            expect(pointCalcLambda.environment).toBeDefined();
            expect(pointCalcLambda.environment.variables.LOYALTY_TABLE_NAME).toBeDefined();
            const streamLambda = Object.values(lambdas).find((l) => l.function_name === 'loyalty-stream-processor-test');
            expect(streamLambda.environment).toBeDefined();
            expect(streamLambda.environment.variables.LOYALTY_TABLE_NAME).toBeDefined();
            expect(streamLambda.environment.variables.SNS_TOPIC_ARN).toBeDefined();
        });
    });
    describe('IAM Roles and Policies', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackIAM');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestIAM', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates IAM role for point calculation Lambda', () => {
            const roles = synthesized.resource.aws_iam_role;
            expect(roles).toBeDefined();
            const lambdaRole = Object.values(roles).find((r) => r.name === 'loyalty-point-calc-lambda-test');
            expect(lambdaRole).toBeDefined();
            const assumeRolePolicy = JSON.parse(lambdaRole.assume_role_policy);
            expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        });
        test('Creates IAM role for stream processor Lambda', () => {
            const roles = synthesized.resource.aws_iam_role;
            const streamRole = Object.values(roles).find((r) => r.name === 'loyalty-stream-processor-test');
            expect(streamRole).toBeDefined();
        });
        test('Creates IAM policies with least privilege', () => {
            const policies = synthesized.resource.aws_iam_policy;
            expect(policies).toBeDefined();
            const pointCalcPolicy = Object.values(policies).find((p) => p.name === 'loyalty-point-calc-test');
            expect(pointCalcPolicy).toBeDefined();
            const policyDoc = JSON.parse(pointCalcPolicy.policy);
            const dynamoStatement = policyDoc.Statement.find((s) => s.Action.includes('dynamodb:TransactWriteItems'));
            expect(dynamoStatement).toBeDefined();
        });
    });
    describe('SNS Configuration', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackSNS');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestSNS', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates SNS topic for notifications', () => {
            const snsTopics = synthesized.resource.aws_sns_topic;
            expect(snsTopics).toBeDefined();
            const notificationTopic = Object.values(snsTopics)[0];
            expect(notificationTopic.name).toBe('loyalty-notifications-test');
            expect(notificationTopic.display_name).toBe('Loyalty Program Notifications');
            expect(notificationTopic.kms_master_key_id).toBe('alias/aws/sns');
        });
    });
    describe('API Gateway Configuration', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackAPI');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestAPI', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates REST API with correct configuration', () => {
            const apis = synthesized.resource.aws_api_gateway_rest_api;
            expect(apis).toBeDefined();
            const api = Object.values(apis)[0];
            expect(api.name).toBe('loyalty-api-test');
            expect(api.description).toBe('Loyalty Program API');
            expect(api.endpoint_configuration.types).toContain('REGIONAL');
        });
        test('Creates request validator', () => {
            const validators = synthesized.resource.aws_api_gateway_request_validator;
            expect(validators).toBeDefined();
            const validator = Object.values(validators)[0];
            expect(validator.name).toBe('request-validator');
            expect(validator.validate_request_body).toBe(true);
            expect(validator.validate_request_parameters).toBe(true);
        });
        test('Creates transactions resource', () => {
            const resources = synthesized.resource.aws_api_gateway_resource;
            expect(resources).toBeDefined();
            const transactionsResource = Object.values(resources)[0];
            expect(transactionsResource.path_part).toBe('transactions');
        });
        test('Creates POST method for transactions', () => {
            const methods = synthesized.resource.aws_api_gateway_method;
            expect(methods).toBeDefined();
            const method = Object.values(methods)[0];
            expect(method.http_method).toBe('POST');
            expect(method.authorization).toBe('NONE');
        });
        test('Creates Lambda integration', () => {
            const integrations = synthesized.resource.aws_api_gateway_integration;
            expect(integrations).toBeDefined();
            const integration = Object.values(integrations)[0];
            expect(integration.type).toBe('AWS_PROXY');
            expect(integration.integration_http_method).toBe('POST');
        });
    });
    describe('EventBridge Configuration', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackEventBridge');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestEventBridge', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates EventBridge rule for periodic tier review', () => {
            const rules = synthesized.resource.aws_cloudwatch_event_rule;
            expect(rules).toBeDefined();
            const rule = Object.values(rules)[0];
            expect(rule.name).toBe('loyalty-tier-review-test');
            expect(rule.description).toBe('Periodic tier review for loyalty members');
            expect(rule.schedule_expression).toBe('rate(1 day)');
        });
        test('Creates EventBridge target for Lambda', () => {
            const targets = synthesized.resource.aws_cloudwatch_event_target;
            expect(targets).toBeDefined();
            const target = Object.values(targets)[0];
            expect(target.rule).toBeDefined();
            expect(target.arn).toBeDefined();
        });
    });
    describe('CloudWatch Monitoring', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackCloudWatch');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestCloudWatch', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates CloudWatch alarms for high transaction volume', () => {
            const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;
            expect(alarms).toBeDefined();
            const highVolumeAlarm = Object.values(alarms).find((a) => a.alarm_name === 'loyalty-high-transactions-test');
            expect(highVolumeAlarm).toBeDefined();
            expect(highVolumeAlarm.metric_name).toBe('Invocations');
            expect(highVolumeAlarm.threshold).toBe(1000);
            expect(highVolumeAlarm.comparison_operator).toBe('GreaterThanThreshold');
        });
        test('Creates CloudWatch alarms for failed transactions', () => {
            const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;
            const failedAlarm = Object.values(alarms).find((a) => a.alarm_name === 'loyalty-failed-transactions-test');
            expect(failedAlarm).toBeDefined();
            expect(failedAlarm.metric_name).toBe('Errors');
            expect(failedAlarm.threshold).toBe(10);
        });
        test('Creates CloudWatch dashboard', () => {
            const dashboards = synthesized.resource.aws_cloudwatch_dashboard;
            expect(dashboards).toBeDefined();
            const dashboard = Object.values(dashboards)[0];
            expect(dashboard.dashboard_name).toBe('loyalty-metrics-test');
            const body = JSON.parse(dashboard.dashboard_body);
            expect(body.widgets).toBeDefined();
            expect(body.widgets.length).toBeGreaterThan(0);
            expect(body.widgets[0].properties.title).toBe('Transaction Metrics');
        });
    });
    describe('Lambda Permissions', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackPermissions');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestPermissions', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates Lambda permission for API Gateway', () => {
            const permissions = synthesized.resource.aws_lambda_permission;
            expect(permissions).toBeDefined();
            const apiPermission = Object.values(permissions).find((p) => p.statement_id === 'AllowAPIGatewayInvoke');
            expect(apiPermission).toBeDefined();
            expect(apiPermission.action).toBe('lambda:InvokeFunction');
            expect(apiPermission.principal).toBe('apigateway.amazonaws.com');
        });
        test('Creates Lambda permission for EventBridge', () => {
            const permissions = synthesized.resource.aws_lambda_permission;
            const eventPermission = Object.values(permissions).find((p) => p.statement_id === 'AllowEventBridgeInvoke');
            expect(eventPermission).toBeDefined();
            expect(eventPermission.principal).toBe('events.amazonaws.com');
        });
    });
    describe('DynamoDB Streams Integration', () => {
        beforeEach(() => {
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackStreams');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestStreams', {
                environmentSuffix: 'test',
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
        });
        test('Creates event source mapping for DynamoDB streams', () => {
            const mappings = synthesized.resource.aws_lambda_event_source_mapping;
            expect(mappings).toBeDefined();
            const streamMapping = Object.values(mappings)[0];
            expect(streamMapping.starting_position).toBe('LATEST');
            expect(streamMapping.maximum_batching_window_in_seconds).toBe(5);
            expect(streamMapping.parallelization_factor).toBe(10);
            expect(streamMapping.maximum_retry_attempts).toBe(3);
        });
    });
    describe('Resource Naming Convention', () => {
        test('All resources include environment suffix', () => {
            const suffix = 'naming-test';
            app = new cdktf_1.App();
            tfStack = new cdktf_1.TerraformStack(app, 'TestStackNaming');
            new provider_1.AwsProvider(tfStack, 'aws', { region: 'us-west-2' });
            stack = new loyalty_program_stack_1.LoyaltyProgramStack(tfStack, 'TestNaming', {
                environmentSuffix: suffix,
            });
            const synthResult = cdktf_1.Testing.synth(tfStack);
            synthesized = JSON.parse(synthResult);
            // Check DynamoDB table
            const dynamoTables = synthesized.resource.aws_dynamodb_table;
            const memberTable = Object.values(dynamoTables)[0];
            expect(memberTable.name).toContain(suffix);
            // Check Lambda functions
            const lambdas = synthesized.resource.aws_lambda_function;
            Object.values(lambdas).forEach((lambda) => {
                expect(lambda.function_name).toContain(suffix);
            });
            // Check SNS topic
            const snsTopics = synthesized.resource.aws_sns_topic;
            const topic = Object.values(snsTopics)[0];
            expect(topic.name).toContain(suffix);
            // Check API Gateway
            const apis = synthesized.resource.aws_api_gateway_rest_api;
            const api = Object.values(apis)[0];
            expect(api.name).toContain(suffix);
            // Check CloudWatch alarms
            const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;
            Object.values(alarms).forEach((alarm) => {
                expect(alarm.alarm_name).toContain(suffix);
            });
            // Check CloudWatch dashboard
            const dashboards = synthesized.resource.aws_cloudwatch_dashboard;
            const dashboard = Object.values(dashboards)[0];
            expect(dashboard.dashboard_name).toContain(suffix);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG95YWx0eS1wcm9ncmFtLXN0YWNrLnVuaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvbG95YWx0eS1wcm9ncmFtLXN0YWNrLnVuaXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlDQUFxRDtBQUNyRCx3RUFBbUU7QUFDbkUsK0RBQStEO0FBRS9ELHVDQUF5QjtBQUd6QixpQkFBaUI7QUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUVoQixRQUFRLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO0lBQzlDLElBQUksR0FBUSxDQUFDO0lBQ2IsSUFBSSxPQUF1QixDQUFDO0lBQzVCLElBQUksS0FBMEIsQ0FBQztJQUMvQixJQUFJLFdBQWdCLENBQUM7SUFFckIsTUFBTSxjQUFjLEdBQUc7Ozs7R0FJdEIsQ0FBQztJQUVGLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFckIsdUNBQXVDO1FBQ3RDLEVBQUUsQ0FBQyxZQUEwQixDQUFDLGtCQUFrQixDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFO1lBQ3JFLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLE9BQU8sY0FBYyxDQUFDO1lBQ3hCLENBQUM7WUFDRCxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxPQUFPLGNBQWMsQ0FBQztZQUN4QixDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtRQUNwQyxJQUFJLENBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1lBQ2hFLEdBQUcs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Q0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1lBRUgsNkJBQTZCO1lBQzdCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsd0JBQXdCLENBQUM7WUFDakUsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQVEsQ0FBQztZQUN0RCxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIFRlc3RpbmcsIFRlcnJhZm9ybVN0YWNrIH0gZnJvbSAnY2RrdGYnO1xuaW1wb3J0IHsgTG95YWx0eVByb2dyYW1TdGFjayB9IGZyb20gJy4uL2xpYi9sb3lhbHR5LXByb2dyYW0tc3RhY2snO1xuaW1wb3J0IHsgQXdzUHJvdmlkZXIgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9wcm92aWRlcic7XG5pbXBvcnQgeyBBcmNoaXZlUHJvdmlkZXIgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXJjaGl2ZS9saWIvcHJvdmlkZXInO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gTW9jayBmcyBtb2R1bGVcbmplc3QubW9jaygnZnMnKTtcblxuZGVzY3JpYmUoJ0xveWFsdHlQcm9ncmFtU3RhY2sgVW5pdCBUZXN0cycsICgpID0+IHtcbiAgbGV0IGFwcDogQXBwO1xuICBsZXQgdGZTdGFjazogVGVycmFmb3JtU3RhY2s7XG4gIGxldCBzdGFjazogTG95YWx0eVByb2dyYW1TdGFjaztcbiAgbGV0IHN5bnRoZXNpemVkOiBhbnk7XG5cbiAgY29uc3QgbW9ja0xhbWJkYUNvZGUgPSBgXG4gICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICByZXR1cm4geyBzdGF0dXNDb2RlOiAyMDAgfTtcbiAgICB9O1xuICBgO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xuXG4gICAgLy8gTW9jayBmcy5yZWFkRmlsZVN5bmMgZm9yIExhbWJkYSBjb2RlXG4gICAgKGZzLnJlYWRGaWxlU3luYyBhcyBqZXN0Lk1vY2spLm1vY2tJbXBsZW1lbnRhdGlvbigoZmlsZVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKGZpbGVQYXRoLmluY2x1ZGVzKCdwb2ludC1jYWxjLWxhbWJkYS5qcycpKSB7XG4gICAgICAgIHJldHVybiBtb2NrTGFtYmRhQ29kZTtcbiAgICAgIH1cbiAgICAgIGlmIChmaWxlUGF0aC5pbmNsdWRlcygnc3RyZWFtLXByb2Nlc3Nvci1sYW1iZGEuanMnKSkge1xuICAgICAgICByZXR1cm4gbW9ja0xhbWJkYUNvZGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdTdGFjayBJbml0aWFsaXphdGlvbicsICgpID0+IHtcbiAgICB0ZXN0KCdMb3lhbHR5UHJvZ3JhbVN0YWNrIGluc3RhbnRpYXRlcyB3aXRoIHJlcXVpcmVkIHByb3BzJywgKCkgPT4ge1xuICAgICAgYXBwID0gbmV3IEFwcCgpO1xuICAgICAgdGZTdGFjayA9IG5ldyBUZXJyYWZvcm1TdGFjayhhcHAsICdUZXN0U3RhY2snKTtcbiAgICAgIG5ldyBBd3NQcm92aWRlcih0ZlN0YWNrLCAnYXdzJywgeyByZWdpb246ICd1cy13ZXN0LTInIH0pO1xuICAgICAgc3RhY2sgPSBuZXcgTG95YWx0eVByb2dyYW1TdGFjayh0ZlN0YWNrLCAnVGVzdExveWFsdHlTdGFjaycsIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXg6ICd0ZXN0JyxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBzeW50aFJlc3VsdCA9IFRlc3Rpbmcuc3ludGgodGZTdGFjayk7XG4gICAgICBzeW50aGVzaXplZCA9IEpTT04ucGFyc2Uoc3ludGhSZXN1bHQpO1xuXG4gICAgICBleHBlY3Qoc3RhY2spLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc3ludGhlc2l6ZWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdBcmNoaXZlIHByb3ZpZGVyIGlzIHJlZ2lzdGVyZWQnLCAoKSA9PiB7XG4gICAgICBhcHAgPSBuZXcgQXBwKCk7XG4gICAgICB0ZlN0YWNrID0gbmV3IFRlcnJhZm9ybVN0YWNrKGFwcCwgJ1Rlc3RTdGFja0FyY2hpdmUnKTtcbiAgICAgIG5ldyBBd3NQcm92aWRlcih0ZlN0YWNrLCAnYXdzJywgeyByZWdpb246ICd1cy13ZXN0LTInIH0pO1xuICAgICAgc3RhY2sgPSBuZXcgTG95YWx0eVByb2dyYW1TdGFjayh0ZlN0YWNrLCAnVGVzdEFyY2hpdmVQcm92aWRlcicsIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXg6ICd0ZXN0JyxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBzeW50aFJlc3VsdCA9IFRlc3Rpbmcuc3ludGgodGZTdGFjayk7XG4gICAgICBzeW50aGVzaXplZCA9IEpTT04ucGFyc2Uoc3ludGhSZXN1bHQpO1xuXG4gICAgICBleHBlY3Qoc3ludGhlc2l6ZWQucHJvdmlkZXIpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc3ludGhlc2l6ZWQucHJvdmlkZXIuYXJjaGl2ZSkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0R5bmFtb0RCIFJlc291cmNlcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGFwcCA9IG5ldyBBcHAoKTtcbiAgICAgIHRmU3RhY2sgPSBuZXcgVGVycmFmb3JtU3RhY2soYXBwLCAnVGVzdFN0YWNrRHluYW1vREInKTtcbiAgICAgIG5ldyBBd3NQcm92aWRlcih0ZlN0YWNrLCAnYXdzJywgeyByZWdpb246ICd1cy13ZXN0LTInIH0pO1xuICAgICAgc3RhY2sgPSBuZXcgTG95YWx0eVByb2dyYW1TdGFjayh0ZlN0YWNrLCAnVGVzdER5bmFtb0RCJywge1xuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeDogJ3Rlc3QnLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBzeW50aFJlc3VsdCA9IFRlc3Rpbmcuc3ludGgodGZTdGFjayk7XG4gICAgICBzeW50aGVzaXplZCA9IEpTT04ucGFyc2Uoc3ludGhSZXN1bHQpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ3JlYXRlcyBEeW5hbW9EQiB0YWJsZSB3aXRoIGNvcnJlY3QgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGR5bmFtb1RhYmxlcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19keW5hbW9kYl90YWJsZTtcbiAgICAgIGV4cGVjdChkeW5hbW9UYWJsZXMpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IG1lbWJlclRhYmxlID0gT2JqZWN0LnZhbHVlcyhkeW5hbW9UYWJsZXMpWzBdIGFzIGFueTtcbiAgICAgIGV4cGVjdChtZW1iZXJUYWJsZS5uYW1lKS50b0JlKCdsb3lhbHR5LW1lbWJlcnMtdGVzdCcpO1xuICAgICAgZXhwZWN0KG1lbWJlclRhYmxlLmJpbGxpbmdfbW9kZSkudG9CZSgnUEFZX1BFUl9SRVFVRVNUJyk7XG4gICAgICBleHBlY3QobWVtYmVyVGFibGUuaGFzaF9rZXkpLnRvQmUoJ21lbWJlcklkJyk7XG4gICAgICBleHBlY3QobWVtYmVyVGFibGUucmFuZ2Vfa2V5KS50b0JlKCd0cmFuc2FjdGlvbklkJyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdEeW5hbW9EQiB0YWJsZSBoYXMgc3RyZWFtcyBlbmFibGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgZHluYW1vVGFibGVzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2R5bmFtb2RiX3RhYmxlO1xuICAgICAgY29uc3QgbWVtYmVyVGFibGUgPSBPYmplY3QudmFsdWVzKGR5bmFtb1RhYmxlcylbMF0gYXMgYW55O1xuXG4gICAgICBleHBlY3QobWVtYmVyVGFibGUuc3RyZWFtX2VuYWJsZWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QobWVtYmVyVGFibGUuc3RyZWFtX3ZpZXdfdHlwZSkudG9CZSgnTkVXX0FORF9PTERfSU1BR0VTJyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdEeW5hbW9EQiB0YWJsZSBoYXMgR1NJIGZvciBlbWFpbCBsb29rdXBzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZHluYW1vVGFibGVzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2R5bmFtb2RiX3RhYmxlO1xuICAgICAgY29uc3QgbWVtYmVyVGFibGUgPSBPYmplY3QudmFsdWVzKGR5bmFtb1RhYmxlcylbMF0gYXMgYW55O1xuXG4gICAgICBleHBlY3QobWVtYmVyVGFibGUuZ2xvYmFsX3NlY29uZGFyeV9pbmRleCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChtZW1iZXJUYWJsZS5nbG9iYWxfc2Vjb25kYXJ5X2luZGV4WzBdLm5hbWUpLnRvQmUoJ2VtYWlsLWluZGV4Jyk7XG4gICAgICBleHBlY3QobWVtYmVyVGFibGUuZ2xvYmFsX3NlY29uZGFyeV9pbmRleFswXS5oYXNoX2tleSkudG9CZSgnZW1haWwnKTtcbiAgICAgIGV4cGVjdChtZW1iZXJUYWJsZS5nbG9iYWxfc2Vjb25kYXJ5X2luZGV4WzBdLnByb2plY3Rpb25fdHlwZSkudG9CZSgnQUxMJyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdEeW5hbW9EQiB0YWJsZSBoYXMgcG9pbnQtaW4tdGltZSByZWNvdmVyeSBlbmFibGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgZHluYW1vVGFibGVzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2R5bmFtb2RiX3RhYmxlO1xuICAgICAgY29uc3QgbWVtYmVyVGFibGUgPSBPYmplY3QudmFsdWVzKGR5bmFtb1RhYmxlcylbMF0gYXMgYW55O1xuXG4gICAgICBleHBlY3QobWVtYmVyVGFibGUucG9pbnRfaW5fdGltZV9yZWNvdmVyeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChtZW1iZXJUYWJsZS5wb2ludF9pbl90aW1lX3JlY292ZXJ5LmVuYWJsZWQpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdEeW5hbW9EQiB0YWJsZSBoYXMgc2VydmVyLXNpZGUgZW5jcnlwdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGR5bmFtb1RhYmxlcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19keW5hbW9kYl90YWJsZTtcbiAgICAgIGNvbnN0IG1lbWJlclRhYmxlID0gT2JqZWN0LnZhbHVlcyhkeW5hbW9UYWJsZXMpWzBdIGFzIGFueTtcblxuICAgICAgZXhwZWN0KG1lbWJlclRhYmxlLnNlcnZlcl9zaWRlX2VuY3J5cHRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QobWVtYmVyVGFibGUuc2VydmVyX3NpZGVfZW5jcnlwdGlvbi5lbmFibGVkKS50b0JlKHRydWUpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnTGFtYmRhIEZ1bmN0aW9ucycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGFwcCA9IG5ldyBBcHAoKTtcbiAgICAgIHRmU3RhY2sgPSBuZXcgVGVycmFmb3JtU3RhY2soYXBwLCAnVGVzdFN0YWNrTGFtYmRhJyk7XG4gICAgICBuZXcgQXdzUHJvdmlkZXIodGZTdGFjaywgJ2F3cycsIHsgcmVnaW9uOiAndXMtd2VzdC0yJyB9KTtcbiAgICAgIHN0YWNrID0gbmV3IExveWFsdHlQcm9ncmFtU3RhY2sodGZTdGFjaywgJ1Rlc3RMYW1iZGEnLCB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4OiAndGVzdCcsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHN5bnRoUmVzdWx0ID0gVGVzdGluZy5zeW50aCh0ZlN0YWNrKTtcbiAgICAgIHN5bnRoZXNpemVkID0gSlNPTi5wYXJzZShzeW50aFJlc3VsdCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdDcmVhdGVzIHBvaW50IGNhbGN1bGF0aW9uIExhbWJkYSBmdW5jdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGxhbWJkYXMgPSBzeW50aGVzaXplZC5yZXNvdXJjZS5hd3NfbGFtYmRhX2Z1bmN0aW9uO1xuICAgICAgZXhwZWN0KGxhbWJkYXMpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IHBvaW50Q2FsY0xhbWJkYSA9IE9iamVjdC52YWx1ZXMobGFtYmRhcykuZmluZCgobDogYW55KSA9PlxuICAgICAgICBsLmZ1bmN0aW9uX25hbWUgPT09ICdsb3lhbHR5LXBvaW50LWNhbGMtdGVzdCdcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChwb2ludENhbGNMYW1iZGEpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoKHBvaW50Q2FsY0xhbWJkYSBhcyBhbnkpLnJ1bnRpbWUpLnRvQmUoJ25vZGVqczIwLngnKTtcbiAgICAgIGV4cGVjdCgocG9pbnRDYWxjTGFtYmRhIGFzIGFueSkuaGFuZGxlcikudG9CZSgnaW5kZXguaGFuZGxlcicpO1xuICAgICAgZXhwZWN0KChwb2ludENhbGNMYW1iZGEgYXMgYW55KS50aW1lb3V0KS50b0JlKDMwKTtcbiAgICAgIGV4cGVjdCgocG9pbnRDYWxjTGFtYmRhIGFzIGFueSkubWVtb3J5X3NpemUpLnRvQmUoMjU2KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NyZWF0ZXMgc3RyZWFtIHByb2Nlc3NvciBMYW1iZGEgZnVuY3Rpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBsYW1iZGFzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2xhbWJkYV9mdW5jdGlvbjtcbiAgICAgIGNvbnN0IHN0cmVhbUxhbWJkYSA9IE9iamVjdC52YWx1ZXMobGFtYmRhcykuZmluZCgobDogYW55KSA9PlxuICAgICAgICBsLmZ1bmN0aW9uX25hbWUgPT09ICdsb3lhbHR5LXN0cmVhbS1wcm9jZXNzb3ItdGVzdCdcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChzdHJlYW1MYW1iZGEpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoKHN0cmVhbUxhbWJkYSBhcyBhbnkpLnJ1bnRpbWUpLnRvQmUoJ25vZGVqczIwLngnKTtcbiAgICAgIGV4cGVjdCgoc3RyZWFtTGFtYmRhIGFzIGFueSkuaGFuZGxlcikudG9CZSgnaW5kZXguaGFuZGxlcicpO1xuICAgICAgZXhwZWN0KChzdHJlYW1MYW1iZGEgYXMgYW55KS50aW1lb3V0KS50b0JlKDYwKTtcbiAgICAgIGV4cGVjdCgoc3RyZWFtTGFtYmRhIGFzIGFueSkubWVtb3J5X3NpemUpLnRvQmUoMjU2KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0xhbWJkYSBmdW5jdGlvbnMgaGF2ZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBsYW1iZGFzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2xhbWJkYV9mdW5jdGlvbjtcblxuICAgICAgY29uc3QgcG9pbnRDYWxjTGFtYmRhID0gT2JqZWN0LnZhbHVlcyhsYW1iZGFzKS5maW5kKChsOiBhbnkpID0+XG4gICAgICAgIGwuZnVuY3Rpb25fbmFtZSA9PT0gJ2xveWFsdHktcG9pbnQtY2FsYy10ZXN0J1xuICAgICAgKTtcbiAgICAgIGV4cGVjdCgocG9pbnRDYWxjTGFtYmRhIGFzIGFueSkuZW52aXJvbm1lbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoKHBvaW50Q2FsY0xhbWJkYSBhcyBhbnkpLmVudmlyb25tZW50LnZhcmlhYmxlcy5MT1lBTFRZX1RBQkxFX05BTUUpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IHN0cmVhbUxhbWJkYSA9IE9iamVjdC52YWx1ZXMobGFtYmRhcykuZmluZCgobDogYW55KSA9PlxuICAgICAgICBsLmZ1bmN0aW9uX25hbWUgPT09ICdsb3lhbHR5LXN0cmVhbS1wcm9jZXNzb3ItdGVzdCdcbiAgICAgICk7XG4gICAgICBleHBlY3QoKHN0cmVhbUxhbWJkYSBhcyBhbnkpLmVudmlyb25tZW50KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KChzdHJlYW1MYW1iZGEgYXMgYW55KS5lbnZpcm9ubWVudC52YXJpYWJsZXMuTE9ZQUxUWV9UQUJMRV9OQU1FKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KChzdHJlYW1MYW1iZGEgYXMgYW55KS5lbnZpcm9ubWVudC52YXJpYWJsZXMuU05TX1RPUElDX0FSTikudG9CZURlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0lBTSBSb2xlcyBhbmQgUG9saWNpZXMnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBhcHAgPSBuZXcgQXBwKCk7XG4gICAgICB0ZlN0YWNrID0gbmV3IFRlcnJhZm9ybVN0YWNrKGFwcCwgJ1Rlc3RTdGFja0lBTScpO1xuICAgICAgbmV3IEF3c1Byb3ZpZGVyKHRmU3RhY2ssICdhd3MnLCB7IHJlZ2lvbjogJ3VzLXdlc3QtMicgfSk7XG4gICAgICBzdGFjayA9IG5ldyBMb3lhbHR5UHJvZ3JhbVN0YWNrKHRmU3RhY2ssICdUZXN0SUFNJywge1xuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeDogJ3Rlc3QnLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBzeW50aFJlc3VsdCA9IFRlc3Rpbmcuc3ludGgodGZTdGFjayk7XG4gICAgICBzeW50aGVzaXplZCA9IEpTT04ucGFyc2Uoc3ludGhSZXN1bHQpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ3JlYXRlcyBJQU0gcm9sZSBmb3IgcG9pbnQgY2FsY3VsYXRpb24gTGFtYmRhJywgKCkgPT4ge1xuICAgICAgY29uc3Qgcm9sZXMgPSBzeW50aGVzaXplZC5yZXNvdXJjZS5hd3NfaWFtX3JvbGU7XG4gICAgICBleHBlY3Qocm9sZXMpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IGxhbWJkYVJvbGUgPSBPYmplY3QudmFsdWVzKHJvbGVzKS5maW5kKChyOiBhbnkpID0+XG4gICAgICAgIHIubmFtZSA9PT0gJ2xveWFsdHktcG9pbnQtY2FsYy1sYW1iZGEtdGVzdCdcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChsYW1iZGFSb2xlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgY29uc3QgYXNzdW1lUm9sZVBvbGljeSA9IEpTT04ucGFyc2UoKGxhbWJkYVJvbGUgYXMgYW55KS5hc3N1bWVfcm9sZV9wb2xpY3kpO1xuICAgICAgZXhwZWN0KGFzc3VtZVJvbGVQb2xpY3kuU3RhdGVtZW50WzBdLlByaW5jaXBhbC5TZXJ2aWNlKS50b0JlKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ3JlYXRlcyBJQU0gcm9sZSBmb3Igc3RyZWFtIHByb2Nlc3NvciBMYW1iZGEnLCAoKSA9PiB7XG4gICAgICBjb25zdCByb2xlcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19pYW1fcm9sZTtcbiAgICAgIGNvbnN0IHN0cmVhbVJvbGUgPSBPYmplY3QudmFsdWVzKHJvbGVzKS5maW5kKChyOiBhbnkpID0+XG4gICAgICAgIHIubmFtZSA9PT0gJ2xveWFsdHktc3RyZWFtLXByb2Nlc3Nvci10ZXN0J1xuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHN0cmVhbVJvbGUpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdDcmVhdGVzIElBTSBwb2xpY2llcyB3aXRoIGxlYXN0IHByaXZpbGVnZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHBvbGljaWVzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2lhbV9wb2xpY3k7XG4gICAgICBleHBlY3QocG9saWNpZXMpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IHBvaW50Q2FsY1BvbGljeSA9IE9iamVjdC52YWx1ZXMocG9saWNpZXMpLmZpbmQoKHA6IGFueSkgPT5cbiAgICAgICAgcC5uYW1lID09PSAnbG95YWx0eS1wb2ludC1jYWxjLXRlc3QnXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocG9pbnRDYWxjUG9saWN5KS50b0JlRGVmaW5lZCgpO1xuICAgICAgY29uc3QgcG9saWN5RG9jID0gSlNPTi5wYXJzZSgocG9pbnRDYWxjUG9saWN5IGFzIGFueSkucG9saWN5KTtcbiAgICAgIGNvbnN0IGR5bmFtb1N0YXRlbWVudCA9IHBvbGljeURvYy5TdGF0ZW1lbnQuZmluZCgoczogYW55KSA9PlxuICAgICAgICBzLkFjdGlvbi5pbmNsdWRlcygnZHluYW1vZGI6VHJhbnNhY3RXcml0ZUl0ZW1zJylcbiAgICAgICk7XG4gICAgICBleHBlY3QoZHluYW1vU3RhdGVtZW50KS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnU05TIENvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBhcHAgPSBuZXcgQXBwKCk7XG4gICAgICB0ZlN0YWNrID0gbmV3IFRlcnJhZm9ybVN0YWNrKGFwcCwgJ1Rlc3RTdGFja1NOUycpO1xuICAgICAgbmV3IEF3c1Byb3ZpZGVyKHRmU3RhY2ssICdhd3MnLCB7IHJlZ2lvbjogJ3VzLXdlc3QtMicgfSk7XG4gICAgICBzdGFjayA9IG5ldyBMb3lhbHR5UHJvZ3JhbVN0YWNrKHRmU3RhY2ssICdUZXN0U05TJywge1xuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeDogJ3Rlc3QnLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBzeW50aFJlc3VsdCA9IFRlc3Rpbmcuc3ludGgodGZTdGFjayk7XG4gICAgICBzeW50aGVzaXplZCA9IEpTT04ucGFyc2Uoc3ludGhSZXN1bHQpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ3JlYXRlcyBTTlMgdG9waWMgZm9yIG5vdGlmaWNhdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzbnNUb3BpY3MgPSBzeW50aGVzaXplZC5yZXNvdXJjZS5hd3Nfc25zX3RvcGljO1xuICAgICAgZXhwZWN0KHNuc1RvcGljcykudG9CZURlZmluZWQoKTtcblxuICAgICAgY29uc3Qgbm90aWZpY2F0aW9uVG9waWMgPSBPYmplY3QudmFsdWVzKHNuc1RvcGljcylbMF0gYXMgYW55O1xuICAgICAgZXhwZWN0KG5vdGlmaWNhdGlvblRvcGljLm5hbWUpLnRvQmUoJ2xveWFsdHktbm90aWZpY2F0aW9ucy10ZXN0Jyk7XG4gICAgICBleHBlY3Qobm90aWZpY2F0aW9uVG9waWMuZGlzcGxheV9uYW1lKS50b0JlKCdMb3lhbHR5IFByb2dyYW0gTm90aWZpY2F0aW9ucycpO1xuICAgICAgZXhwZWN0KG5vdGlmaWNhdGlvblRvcGljLmttc19tYXN0ZXJfa2V5X2lkKS50b0JlKCdhbGlhcy9hd3Mvc25zJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdBUEkgR2F0ZXdheSBDb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgYXBwID0gbmV3IEFwcCgpO1xuICAgICAgdGZTdGFjayA9IG5ldyBUZXJyYWZvcm1TdGFjayhhcHAsICdUZXN0U3RhY2tBUEknKTtcbiAgICAgIG5ldyBBd3NQcm92aWRlcih0ZlN0YWNrLCAnYXdzJywgeyByZWdpb246ICd1cy13ZXN0LTInIH0pO1xuICAgICAgc3RhY2sgPSBuZXcgTG95YWx0eVByb2dyYW1TdGFjayh0ZlN0YWNrLCAnVGVzdEFQSScsIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXg6ICd0ZXN0JyxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc3ludGhSZXN1bHQgPSBUZXN0aW5nLnN5bnRoKHRmU3RhY2spO1xuICAgICAgc3ludGhlc2l6ZWQgPSBKU09OLnBhcnNlKHN5bnRoUmVzdWx0KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NyZWF0ZXMgUkVTVCBBUEkgd2l0aCBjb3JyZWN0IGNvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBhcGlzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2FwaV9nYXRld2F5X3Jlc3RfYXBpO1xuICAgICAgZXhwZWN0KGFwaXMpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IGFwaSA9IE9iamVjdC52YWx1ZXMoYXBpcylbMF0gYXMgYW55O1xuICAgICAgZXhwZWN0KGFwaS5uYW1lKS50b0JlKCdsb3lhbHR5LWFwaS10ZXN0Jyk7XG4gICAgICBleHBlY3QoYXBpLmRlc2NyaXB0aW9uKS50b0JlKCdMb3lhbHR5IFByb2dyYW0gQVBJJyk7XG4gICAgICBleHBlY3QoYXBpLmVuZHBvaW50X2NvbmZpZ3VyYXRpb24udHlwZXMpLnRvQ29udGFpbignUkVHSU9OQUwnKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NyZWF0ZXMgcmVxdWVzdCB2YWxpZGF0b3InLCAoKSA9PiB7XG4gICAgICBjb25zdCB2YWxpZGF0b3JzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2FwaV9nYXRld2F5X3JlcXVlc3RfdmFsaWRhdG9yO1xuICAgICAgZXhwZWN0KHZhbGlkYXRvcnMpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IE9iamVjdC52YWx1ZXModmFsaWRhdG9ycylbMF0gYXMgYW55O1xuICAgICAgZXhwZWN0KHZhbGlkYXRvci5uYW1lKS50b0JlKCdyZXF1ZXN0LXZhbGlkYXRvcicpO1xuICAgICAgZXhwZWN0KHZhbGlkYXRvci52YWxpZGF0ZV9yZXF1ZXN0X2JvZHkpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QodmFsaWRhdG9yLnZhbGlkYXRlX3JlcXVlc3RfcGFyYW1ldGVycykudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NyZWF0ZXMgdHJhbnNhY3Rpb25zIHJlc291cmNlJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzb3VyY2VzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2FwaV9nYXRld2F5X3Jlc291cmNlO1xuICAgICAgZXhwZWN0KHJlc291cmNlcykudG9CZURlZmluZWQoKTtcblxuICAgICAgY29uc3QgdHJhbnNhY3Rpb25zUmVzb3VyY2UgPSBPYmplY3QudmFsdWVzKHJlc291cmNlcylbMF0gYXMgYW55O1xuICAgICAgZXhwZWN0KHRyYW5zYWN0aW9uc1Jlc291cmNlLnBhdGhfcGFydCkudG9CZSgndHJhbnNhY3Rpb25zJyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdDcmVhdGVzIFBPU1QgbWV0aG9kIGZvciB0cmFuc2FjdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBtZXRob2RzID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2FwaV9nYXRld2F5X21ldGhvZDtcbiAgICAgIGV4cGVjdChtZXRob2RzKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICBjb25zdCBtZXRob2QgPSBPYmplY3QudmFsdWVzKG1ldGhvZHMpWzBdIGFzIGFueTtcbiAgICAgIGV4cGVjdChtZXRob2QuaHR0cF9tZXRob2QpLnRvQmUoJ1BPU1QnKTtcbiAgICAgIGV4cGVjdChtZXRob2QuYXV0aG9yaXphdGlvbikudG9CZSgnTk9ORScpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ3JlYXRlcyBMYW1iZGEgaW50ZWdyYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBpbnRlZ3JhdGlvbnMgPSBzeW50aGVzaXplZC5yZXNvdXJjZS5hd3NfYXBpX2dhdGV3YXlfaW50ZWdyYXRpb247XG4gICAgICBleHBlY3QoaW50ZWdyYXRpb25zKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICBjb25zdCBpbnRlZ3JhdGlvbiA9IE9iamVjdC52YWx1ZXMoaW50ZWdyYXRpb25zKVswXSBhcyBhbnk7XG4gICAgICBleHBlY3QoaW50ZWdyYXRpb24udHlwZSkudG9CZSgnQVdTX1BST1hZJyk7XG4gICAgICBleHBlY3QoaW50ZWdyYXRpb24uaW50ZWdyYXRpb25faHR0cF9tZXRob2QpLnRvQmUoJ1BPU1QnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0V2ZW50QnJpZGdlIENvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBhcHAgPSBuZXcgQXBwKCk7XG4gICAgICB0ZlN0YWNrID0gbmV3IFRlcnJhZm9ybVN0YWNrKGFwcCwgJ1Rlc3RTdGFja0V2ZW50QnJpZGdlJyk7XG4gICAgICBuZXcgQXdzUHJvdmlkZXIodGZTdGFjaywgJ2F3cycsIHsgcmVnaW9uOiAndXMtd2VzdC0yJyB9KTtcbiAgICAgIHN0YWNrID0gbmV3IExveWFsdHlQcm9ncmFtU3RhY2sodGZTdGFjaywgJ1Rlc3RFdmVudEJyaWRnZScsIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXg6ICd0ZXN0JyxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc3ludGhSZXN1bHQgPSBUZXN0aW5nLnN5bnRoKHRmU3RhY2spO1xuICAgICAgc3ludGhlc2l6ZWQgPSBKU09OLnBhcnNlKHN5bnRoUmVzdWx0KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NyZWF0ZXMgRXZlbnRCcmlkZ2UgcnVsZSBmb3IgcGVyaW9kaWMgdGllciByZXZpZXcnLCAoKSA9PiB7XG4gICAgICBjb25zdCBydWxlcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19jbG91ZHdhdGNoX2V2ZW50X3J1bGU7XG4gICAgICBleHBlY3QocnVsZXMpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IHJ1bGUgPSBPYmplY3QudmFsdWVzKHJ1bGVzKVswXSBhcyBhbnk7XG4gICAgICBleHBlY3QocnVsZS5uYW1lKS50b0JlKCdsb3lhbHR5LXRpZXItcmV2aWV3LXRlc3QnKTtcbiAgICAgIGV4cGVjdChydWxlLmRlc2NyaXB0aW9uKS50b0JlKCdQZXJpb2RpYyB0aWVyIHJldmlldyBmb3IgbG95YWx0eSBtZW1iZXJzJyk7XG4gICAgICBleHBlY3QocnVsZS5zY2hlZHVsZV9leHByZXNzaW9uKS50b0JlKCdyYXRlKDEgZGF5KScpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ3JlYXRlcyBFdmVudEJyaWRnZSB0YXJnZXQgZm9yIExhbWJkYScsICgpID0+IHtcbiAgICAgIGNvbnN0IHRhcmdldHMgPSBzeW50aGVzaXplZC5yZXNvdXJjZS5hd3NfY2xvdWR3YXRjaF9ldmVudF90YXJnZXQ7XG4gICAgICBleHBlY3QodGFyZ2V0cykudG9CZURlZmluZWQoKTtcblxuICAgICAgY29uc3QgdGFyZ2V0ID0gT2JqZWN0LnZhbHVlcyh0YXJnZXRzKVswXSBhcyBhbnk7XG4gICAgICBleHBlY3QodGFyZ2V0LnJ1bGUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QodGFyZ2V0LmFybikudG9CZURlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0Nsb3VkV2F0Y2ggTW9uaXRvcmluZycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGFwcCA9IG5ldyBBcHAoKTtcbiAgICAgIHRmU3RhY2sgPSBuZXcgVGVycmFmb3JtU3RhY2soYXBwLCAnVGVzdFN0YWNrQ2xvdWRXYXRjaCcpO1xuICAgICAgbmV3IEF3c1Byb3ZpZGVyKHRmU3RhY2ssICdhd3MnLCB7IHJlZ2lvbjogJ3VzLXdlc3QtMicgfSk7XG4gICAgICBzdGFjayA9IG5ldyBMb3lhbHR5UHJvZ3JhbVN0YWNrKHRmU3RhY2ssICdUZXN0Q2xvdWRXYXRjaCcsIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXg6ICd0ZXN0JyxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc3ludGhSZXN1bHQgPSBUZXN0aW5nLnN5bnRoKHRmU3RhY2spO1xuICAgICAgc3ludGhlc2l6ZWQgPSBKU09OLnBhcnNlKHN5bnRoUmVzdWx0KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NyZWF0ZXMgQ2xvdWRXYXRjaCBhbGFybXMgZm9yIGhpZ2ggdHJhbnNhY3Rpb24gdm9sdW1lJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWxhcm1zID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2Nsb3Vkd2F0Y2hfbWV0cmljX2FsYXJtO1xuICAgICAgZXhwZWN0KGFsYXJtcykudG9CZURlZmluZWQoKTtcblxuICAgICAgY29uc3QgaGlnaFZvbHVtZUFsYXJtID0gT2JqZWN0LnZhbHVlcyhhbGFybXMpLmZpbmQoKGE6IGFueSkgPT5cbiAgICAgICAgYS5hbGFybV9uYW1lID09PSAnbG95YWx0eS1oaWdoLXRyYW5zYWN0aW9ucy10ZXN0J1xuICAgICAgKTtcblxuICAgICAgZXhwZWN0KGhpZ2hWb2x1bWVBbGFybSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdCgoaGlnaFZvbHVtZUFsYXJtIGFzIGFueSkubWV0cmljX25hbWUpLnRvQmUoJ0ludm9jYXRpb25zJyk7XG4gICAgICBleHBlY3QoKGhpZ2hWb2x1bWVBbGFybSBhcyBhbnkpLnRocmVzaG9sZCkudG9CZSgxMDAwKTtcbiAgICAgIGV4cGVjdCgoaGlnaFZvbHVtZUFsYXJtIGFzIGFueSkuY29tcGFyaXNvbl9vcGVyYXRvcikudG9CZSgnR3JlYXRlclRoYW5UaHJlc2hvbGQnKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NyZWF0ZXMgQ2xvdWRXYXRjaCBhbGFybXMgZm9yIGZhaWxlZCB0cmFuc2FjdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhbGFybXMgPSBzeW50aGVzaXplZC5yZXNvdXJjZS5hd3NfY2xvdWR3YXRjaF9tZXRyaWNfYWxhcm07XG5cbiAgICAgIGNvbnN0IGZhaWxlZEFsYXJtID0gT2JqZWN0LnZhbHVlcyhhbGFybXMpLmZpbmQoKGE6IGFueSkgPT5cbiAgICAgICAgYS5hbGFybV9uYW1lID09PSAnbG95YWx0eS1mYWlsZWQtdHJhbnNhY3Rpb25zLXRlc3QnXG4gICAgICApO1xuXG4gICAgICBleHBlY3QoZmFpbGVkQWxhcm0pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoKGZhaWxlZEFsYXJtIGFzIGFueSkubWV0cmljX25hbWUpLnRvQmUoJ0Vycm9ycycpO1xuICAgICAgZXhwZWN0KChmYWlsZWRBbGFybSBhcyBhbnkpLnRocmVzaG9sZCkudG9CZSgxMCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdDcmVhdGVzIENsb3VkV2F0Y2ggZGFzaGJvYXJkJywgKCkgPT4ge1xuICAgICAgY29uc3QgZGFzaGJvYXJkcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19jbG91ZHdhdGNoX2Rhc2hib2FyZDtcbiAgICAgIGV4cGVjdChkYXNoYm9hcmRzKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICBjb25zdCBkYXNoYm9hcmQgPSBPYmplY3QudmFsdWVzKGRhc2hib2FyZHMpWzBdIGFzIGFueTtcbiAgICAgIGV4cGVjdChkYXNoYm9hcmQuZGFzaGJvYXJkX25hbWUpLnRvQmUoJ2xveWFsdHktbWV0cmljcy10ZXN0Jyk7XG5cbiAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKGRhc2hib2FyZC5kYXNoYm9hcmRfYm9keSk7XG4gICAgICBleHBlY3QoYm9keS53aWRnZXRzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGJvZHkud2lkZ2V0cy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIGV4cGVjdChib2R5LndpZGdldHNbMF0ucHJvcGVydGllcy50aXRsZSkudG9CZSgnVHJhbnNhY3Rpb24gTWV0cmljcycpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnTGFtYmRhIFBlcm1pc3Npb25zJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgYXBwID0gbmV3IEFwcCgpO1xuICAgICAgdGZTdGFjayA9IG5ldyBUZXJyYWZvcm1TdGFjayhhcHAsICdUZXN0U3RhY2tQZXJtaXNzaW9ucycpO1xuICAgICAgbmV3IEF3c1Byb3ZpZGVyKHRmU3RhY2ssICdhd3MnLCB7IHJlZ2lvbjogJ3VzLXdlc3QtMicgfSk7XG4gICAgICBzdGFjayA9IG5ldyBMb3lhbHR5UHJvZ3JhbVN0YWNrKHRmU3RhY2ssICdUZXN0UGVybWlzc2lvbnMnLCB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4OiAndGVzdCcsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHN5bnRoUmVzdWx0ID0gVGVzdGluZy5zeW50aCh0ZlN0YWNrKTtcbiAgICAgIHN5bnRoZXNpemVkID0gSlNPTi5wYXJzZShzeW50aFJlc3VsdCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdDcmVhdGVzIExhbWJkYSBwZXJtaXNzaW9uIGZvciBBUEkgR2F0ZXdheScsICgpID0+IHtcbiAgICAgIGNvbnN0IHBlcm1pc3Npb25zID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2xhbWJkYV9wZXJtaXNzaW9uO1xuICAgICAgZXhwZWN0KHBlcm1pc3Npb25zKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICBjb25zdCBhcGlQZXJtaXNzaW9uID0gT2JqZWN0LnZhbHVlcyhwZXJtaXNzaW9ucykuZmluZCgocDogYW55KSA9PlxuICAgICAgICBwLnN0YXRlbWVudF9pZCA9PT0gJ0FsbG93QVBJR2F0ZXdheUludm9rZSdcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChhcGlQZXJtaXNzaW9uKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KChhcGlQZXJtaXNzaW9uIGFzIGFueSkuYWN0aW9uKS50b0JlKCdsYW1iZGE6SW52b2tlRnVuY3Rpb24nKTtcbiAgICAgIGV4cGVjdCgoYXBpUGVybWlzc2lvbiBhcyBhbnkpLnByaW5jaXBhbCkudG9CZSgnYXBpZ2F0ZXdheS5hbWF6b25hd3MuY29tJyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdDcmVhdGVzIExhbWJkYSBwZXJtaXNzaW9uIGZvciBFdmVudEJyaWRnZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHBlcm1pc3Npb25zID0gc3ludGhlc2l6ZWQucmVzb3VyY2UuYXdzX2xhbWJkYV9wZXJtaXNzaW9uO1xuXG4gICAgICBjb25zdCBldmVudFBlcm1pc3Npb24gPSBPYmplY3QudmFsdWVzKHBlcm1pc3Npb25zKS5maW5kKChwOiBhbnkpID0+XG4gICAgICAgIHAuc3RhdGVtZW50X2lkID09PSAnQWxsb3dFdmVudEJyaWRnZUludm9rZSdcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChldmVudFBlcm1pc3Npb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoKGV2ZW50UGVybWlzc2lvbiBhcyBhbnkpLnByaW5jaXBhbCkudG9CZSgnZXZlbnRzLmFtYXpvbmF3cy5jb20nKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0R5bmFtb0RCIFN0cmVhbXMgSW50ZWdyYXRpb24nLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBhcHAgPSBuZXcgQXBwKCk7XG4gICAgICB0ZlN0YWNrID0gbmV3IFRlcnJhZm9ybVN0YWNrKGFwcCwgJ1Rlc3RTdGFja1N0cmVhbXMnKTtcbiAgICAgIG5ldyBBd3NQcm92aWRlcih0ZlN0YWNrLCAnYXdzJywgeyByZWdpb246ICd1cy13ZXN0LTInIH0pO1xuICAgICAgc3RhY2sgPSBuZXcgTG95YWx0eVByb2dyYW1TdGFjayh0ZlN0YWNrLCAnVGVzdFN0cmVhbXMnLCB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4OiAndGVzdCcsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHN5bnRoUmVzdWx0ID0gVGVzdGluZy5zeW50aCh0ZlN0YWNrKTtcbiAgICAgIHN5bnRoZXNpemVkID0gSlNPTi5wYXJzZShzeW50aFJlc3VsdCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdDcmVhdGVzIGV2ZW50IHNvdXJjZSBtYXBwaW5nIGZvciBEeW5hbW9EQiBzdHJlYW1zJywgKCkgPT4ge1xuICAgICAgY29uc3QgbWFwcGluZ3MgPSBzeW50aGVzaXplZC5yZXNvdXJjZS5hd3NfbGFtYmRhX2V2ZW50X3NvdXJjZV9tYXBwaW5nO1xuICAgICAgZXhwZWN0KG1hcHBpbmdzKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICBjb25zdCBzdHJlYW1NYXBwaW5nID0gT2JqZWN0LnZhbHVlcyhtYXBwaW5ncylbMF0gYXMgYW55O1xuICAgICAgZXhwZWN0KHN0cmVhbU1hcHBpbmcuc3RhcnRpbmdfcG9zaXRpb24pLnRvQmUoJ0xBVEVTVCcpO1xuICAgICAgZXhwZWN0KHN0cmVhbU1hcHBpbmcubWF4aW11bV9iYXRjaGluZ193aW5kb3dfaW5fc2Vjb25kcykudG9CZSg1KTtcbiAgICAgIGV4cGVjdChzdHJlYW1NYXBwaW5nLnBhcmFsbGVsaXphdGlvbl9mYWN0b3IpLnRvQmUoMTApO1xuICAgICAgZXhwZWN0KHN0cmVhbU1hcHBpbmcubWF4aW11bV9yZXRyeV9hdHRlbXB0cykudG9CZSgzKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1Jlc291cmNlIE5hbWluZyBDb252ZW50aW9uJywgKCkgPT4ge1xuICAgIHRlc3QoJ0FsbCByZXNvdXJjZXMgaW5jbHVkZSBlbnZpcm9ubWVudCBzdWZmaXgnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzdWZmaXggPSAnbmFtaW5nLXRlc3QnO1xuICAgICAgYXBwID0gbmV3IEFwcCgpO1xuICAgICAgdGZTdGFjayA9IG5ldyBUZXJyYWZvcm1TdGFjayhhcHAsICdUZXN0U3RhY2tOYW1pbmcnKTtcbiAgICAgIG5ldyBBd3NQcm92aWRlcih0ZlN0YWNrLCAnYXdzJywgeyByZWdpb246ICd1cy13ZXN0LTInIH0pO1xuICAgICAgc3RhY2sgPSBuZXcgTG95YWx0eVByb2dyYW1TdGFjayh0ZlN0YWNrLCAnVGVzdE5hbWluZycsIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXg6IHN1ZmZpeCxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc3ludGhSZXN1bHQgPSBUZXN0aW5nLnN5bnRoKHRmU3RhY2spO1xuICAgICAgc3ludGhlc2l6ZWQgPSBKU09OLnBhcnNlKHN5bnRoUmVzdWx0KTtcblxuICAgICAgLy8gQ2hlY2sgRHluYW1vREIgdGFibGVcbiAgICAgIGNvbnN0IGR5bmFtb1RhYmxlcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19keW5hbW9kYl90YWJsZTtcbiAgICAgIGNvbnN0IG1lbWJlclRhYmxlID0gT2JqZWN0LnZhbHVlcyhkeW5hbW9UYWJsZXMpWzBdIGFzIGFueTtcbiAgICAgIGV4cGVjdChtZW1iZXJUYWJsZS5uYW1lKS50b0NvbnRhaW4oc3VmZml4KTtcblxuICAgICAgLy8gQ2hlY2sgTGFtYmRhIGZ1bmN0aW9uc1xuICAgICAgY29uc3QgbGFtYmRhcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19sYW1iZGFfZnVuY3Rpb247XG4gICAgICBPYmplY3QudmFsdWVzKGxhbWJkYXMpLmZvckVhY2goKGxhbWJkYTogYW55KSA9PiB7XG4gICAgICAgIGV4cGVjdChsYW1iZGEuZnVuY3Rpb25fbmFtZSkudG9Db250YWluKHN1ZmZpeCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gQ2hlY2sgU05TIHRvcGljXG4gICAgICBjb25zdCBzbnNUb3BpY3MgPSBzeW50aGVzaXplZC5yZXNvdXJjZS5hd3Nfc25zX3RvcGljO1xuICAgICAgY29uc3QgdG9waWMgPSBPYmplY3QudmFsdWVzKHNuc1RvcGljcylbMF0gYXMgYW55O1xuICAgICAgZXhwZWN0KHRvcGljLm5hbWUpLnRvQ29udGFpbihzdWZmaXgpO1xuXG4gICAgICAvLyBDaGVjayBBUEkgR2F0ZXdheVxuICAgICAgY29uc3QgYXBpcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19hcGlfZ2F0ZXdheV9yZXN0X2FwaTtcbiAgICAgIGNvbnN0IGFwaSA9IE9iamVjdC52YWx1ZXMoYXBpcylbMF0gYXMgYW55O1xuICAgICAgZXhwZWN0KGFwaS5uYW1lKS50b0NvbnRhaW4oc3VmZml4KTtcblxuICAgICAgLy8gQ2hlY2sgQ2xvdWRXYXRjaCBhbGFybXNcbiAgICAgIGNvbnN0IGFsYXJtcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19jbG91ZHdhdGNoX21ldHJpY19hbGFybTtcbiAgICAgIE9iamVjdC52YWx1ZXMoYWxhcm1zKS5mb3JFYWNoKChhbGFybTogYW55KSA9PiB7XG4gICAgICAgIGV4cGVjdChhbGFybS5hbGFybV9uYW1lKS50b0NvbnRhaW4oc3VmZml4KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDaGVjayBDbG91ZFdhdGNoIGRhc2hib2FyZFxuICAgICAgY29uc3QgZGFzaGJvYXJkcyA9IHN5bnRoZXNpemVkLnJlc291cmNlLmF3c19jbG91ZHdhdGNoX2Rhc2hib2FyZDtcbiAgICAgIGNvbnN0IGRhc2hib2FyZCA9IE9iamVjdC52YWx1ZXMoZGFzaGJvYXJkcylbMF0gYXMgYW55O1xuICAgICAgZXhwZWN0KGRhc2hib2FyZC5kYXNoYm9hcmRfbmFtZSkudG9Db250YWluKHN1ZmZpeCk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19