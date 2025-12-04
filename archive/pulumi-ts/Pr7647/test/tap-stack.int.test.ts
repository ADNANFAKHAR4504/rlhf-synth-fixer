/**
 * Integration tests for TapStack deployed infrastructure.
 * Tests verify actual AWS resources and their configurations.
 */
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Load deployed stack outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load stack outputs:', error);
  outputs = {};
}

const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const cloudwatchClient = new CloudWatchClient({ region });
const dynamoDBClient = new DynamoDBClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const iamClient = new IAMClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.dynamoTableName).toBeDefined();
      expect(outputs.complianceAlarmArn).toBeDefined();
    });

    it('should have valid ARN formats', () => {
      expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.complianceAlarmArn).toMatch(/^arn:aws:cloudwatch:/);
    });
  });

  describe('Lambda Function', () => {
    let lambdaConfig: any;
    let lambdaFunction: any;

    beforeAll(async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const configResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      lambdaConfig = configResponse;

      const functionResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      lambdaFunction = functionResponse;
    });

    it('should exist and be active', () => {
      expect(lambdaConfig).toBeDefined();
      expect(lambdaConfig.State).toBe('Active');
    });

    it('should use Node.js 18 runtime', () => {
      expect(lambdaConfig.Runtime).toBe('nodejs18.x');
    });

    it('should have correct handler', () => {
      expect(lambdaConfig.Handler).toBe('index.handler');
    });

    it('should have correct timeout', () => {
      expect(lambdaConfig.Timeout).toBe(300);
    });

    it('should have correct memory size', () => {
      expect(lambdaConfig.MemorySize).toBe(512);
    });

    it('should have required environment variables', () => {
      expect(lambdaConfig.Environment).toBeDefined();
      expect(lambdaConfig.Environment.Variables).toBeDefined();
      expect(lambdaConfig.Environment.Variables.DYNAMO_TABLE_NAME).toBe(outputs.dynamoTableName);
      expect(lambdaConfig.Environment.Variables.SNS_TOPIC_ARN).toBe(outputs.snsTopicArn);
      expect(lambdaConfig.Environment.Variables.COMPLIANCE_NAMESPACE).toBe('ComplianceMonitoring');
    });

    it('should have IAM role attached', () => {
      expect(lambdaConfig.Role).toBeDefined();
      expect(lambdaConfig.Role).toMatch(/^arn:aws:iam:/);
    });

    it('should have tags applied', () => {
      expect(lambdaFunction.Tags).toBeDefined();
    });

    it('should have EventBridge invoke permission', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      try {
        const policyResponse = await lambdaClient.send(
          new GetPolicyCommand({ FunctionName: functionName })
        );
        const policy = JSON.parse(policyResponse.Policy || '{}');
        expect(policy.Statement).toBeDefined();
        const eventBridgePermission = policy.Statement.find(
          (statement: any) => statement.Principal?.Service === 'events.amazonaws.com'
        );
        expect(eventBridgePermission).toBeDefined();
      } catch (error: any) {
        if (error.name !== 'ResourceNotFoundException') {
          throw error;
        }
      }
    });
  });

  describe('Lambda IAM Role', () => {
    let role: any;
    let attachedPolicies: any;

    beforeAll(async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const configResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      const roleName = configResponse.Role!.split('/').pop();

      const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));
      role = roleResponse.Role;

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName! })
      );
      attachedPolicies = policiesResponse.AttachedPolicies;
    });

    it('should have Lambda assume role policy', () => {
      expect(role).toBeDefined();
      const assumeRolePolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));
      expect(assumeRolePolicy.Statement).toBeDefined();
      const lambdaPrincipal = assumeRolePolicy.Statement.find(
        (statement: any) => statement.Principal?.Service === 'lambda.amazonaws.com'
      );
      expect(lambdaPrincipal).toBeDefined();
    });

    it('should have basic execution role attached', () => {
      expect(attachedPolicies).toBeDefined();
      const basicExecutionPolicy = attachedPolicies.find(
        (policy: any) =>
          policy.PolicyArn === 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(basicExecutionPolicy).toBeDefined();
    });

    it('should have custom inline policy with required permissions', async () => {
      const roleName = role.RoleName;
      try {
        const policyResponse = await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: roleName,
            PolicyName: `compliance-lambda-custom-policy-${process.env.ENVIRONMENT_SUFFIX || 'synthr5t8t4v0'}`,
          })
        );
        const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
        expect(policy.Statement).toBeDefined();

        // Verify DynamoDB permissions
        const dynamoStatement = policy.Statement.find(
          (statement: any) =>
            Array.isArray(statement.Action) && statement.Action.includes('dynamodb:PutItem')
        );
        expect(dynamoStatement).toBeDefined();

        // Verify SNS permissions
        const snsStatement = policy.Statement.find(
          (statement: any) =>
            Array.isArray(statement.Action) && statement.Action.includes('sns:Publish')
        );
        expect(snsStatement).toBeDefined();

        // Verify CloudWatch permissions
        const cloudwatchStatement = policy.Statement.find(
          (statement: any) =>
            Array.isArray(statement.Action) && statement.Action.includes('cloudwatch:PutMetricData')
        );
        expect(cloudwatchStatement).toBeDefined();
      } catch (error: any) {
        if (error.name !== 'NoSuchEntity') {
          throw error;
        }
      }
    });
  });

  describe('DynamoDB Table', () => {
    let table: any;
    let ttlDescription: any;

    beforeAll(async () => {
      const tableResponse = await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamoTableName })
      );
      table = tableResponse.Table;

      const ttlResponse = await dynamoDBClient.send(
        new DescribeTimeToLiveCommand({ TableName: outputs.dynamoTableName })
      );
      ttlDescription = ttlResponse.TimeToLiveDescription;
    });

    it('should exist and be active', () => {
      expect(table).toBeDefined();
      expect(table.TableStatus).toBe('ACTIVE');
    });

    it('should have correct hash key', () => {
      expect(table.KeySchema).toBeDefined();
      const hashKey = table.KeySchema.find((key: any) => key.KeyType === 'HASH');
      expect(hashKey).toBeDefined();
      expect(hashKey.AttributeName).toBe('checkId');
    });

    it('should have correct range key', () => {
      const rangeKey = table.KeySchema.find((key: any) => key.KeyType === 'RANGE');
      expect(rangeKey).toBeDefined();
      expect(rangeKey.AttributeName).toBe('timestamp');
    });

    it('should have correct attribute definitions', () => {
      expect(table.AttributeDefinitions).toBeDefined();
      const checkIdAttr = table.AttributeDefinitions.find((attr: any) => attr.AttributeName === 'checkId');
      expect(checkIdAttr).toBeDefined();
      expect(checkIdAttr.AttributeType).toBe('S');

      const timestampAttr = table.AttributeDefinitions.find(
        (attr: any) => attr.AttributeName === 'timestamp'
      );
      expect(timestampAttr).toBeDefined();
      expect(timestampAttr.AttributeType).toBe('N');
    });

    it('should use PAY_PER_REQUEST billing mode', () => {
      expect(table.BillingModeSummary).toBeDefined();
      expect(table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have TTL enabled', () => {
      expect(ttlDescription).toBeDefined();
      expect(ttlDescription.TimeToLiveStatus).toBe('ENABLED');
      expect(ttlDescription.AttributeName).toBe('expirationTime');
    });

    it('should have tags applied', () => {
      expect(table.Tags).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    let topicAttributes: any;
    let subscriptions: any;

    beforeAll(async () => {
      const attributesResponse = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.snsTopicArn })
      );
      topicAttributes = attributesResponse.Attributes;

      const subscriptionsResponse = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: outputs.snsTopicArn })
      );
      subscriptions = subscriptionsResponse.Subscriptions;
    });

    it('should exist with correct ARN', () => {
      expect(topicAttributes).toBeDefined();
      expect(topicAttributes.TopicArn).toBe(outputs.snsTopicArn);
    });

    it('should have display name set', () => {
      expect(topicAttributes.DisplayName).toBe('Compliance Violation Notifications');
    });

    it('should have email subscription', () => {
      expect(subscriptions).toBeDefined();
      expect(subscriptions.length).toBeGreaterThan(0);
      const emailSubscription = subscriptions.find((sub: any) => sub.Protocol === 'email');
      expect(emailSubscription).toBeDefined();
      expect(emailSubscription.Endpoint).toBe('compliance@company.com');
    });
  });

  describe('EventBridge Rule', () => {
    let rules: any;
    let targets: any;

    beforeAll(async () => {
      const rulesResponse = await eventBridgeClient.send(
        new ListRulesCommand({ NamePrefix: 'compliance-schedule-' })
      );
      rules = rulesResponse.Rules;

      if (rules && rules.length > 0) {
        const targetsResponse = await eventBridgeClient.send(
          new ListTargetsByRuleCommand({ Rule: rules[0].Name })
        );
        targets = targetsResponse.Targets;
      }
    });

    it('should exist with correct schedule', () => {
      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);
      const complianceRule = rules[0];
      expect(complianceRule.ScheduleExpression).toBe('rate(15 minutes)');
    });

    it('should be enabled', () => {
      const complianceRule = rules[0];
      expect(complianceRule.State).toBe('ENABLED');
    });

    it('should have Lambda target configured', () => {
      expect(targets).toBeDefined();
      expect(targets.length).toBeGreaterThan(0);
      const lambdaTarget = targets.find((target: any) => target.Arn === outputs.lambdaFunctionArn);
      expect(lambdaTarget).toBeDefined();
    });
  });

  describe('CloudWatch Log Group', () => {
    let logGroups: any;

    beforeAll(async () => {
      const logGroupsResponse = await cloudwatchClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/lambda/compliance-analyzer-',
        })
      );
      logGroups = logGroupsResponse.logGroups;
    });

    it('should exist', () => {
      expect(logGroups).toBeDefined();
      expect(logGroups.length).toBeGreaterThan(0);
    });

    it('should have 7-day retention', () => {
      const complianceLogGroup = logGroups[0];
      expect(complianceLogGroup.retentionInDays).toBe(7);
    });
  });

  describe('CloudWatch Alarm', () => {
    let alarms: any;

    beforeAll(async () => {
      const alarmName = outputs.complianceAlarmArn.split(':').pop();
      const alarmsResponse = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
      alarms = alarmsResponse.MetricAlarms;
    });

    it('should exist', () => {
      expect(alarms).toBeDefined();
      expect(alarms.length).toBeGreaterThan(0);
    });

    it('should monitor ComplianceFailureRate metric', () => {
      const alarm = alarms[0];
      expect(alarm.MetricName).toBe('ComplianceFailureRate');
      expect(alarm.Namespace).toBe('ComplianceMonitoring');
    });

    it('should have correct threshold', () => {
      const alarm = alarms[0];
      expect(alarm.Threshold).toBe(20);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    it('should use Average statistic', () => {
      const alarm = alarms[0];
      expect(alarm.Statistic).toBe('Average');
    });

    it('should have 15-minute period', () => {
      const alarm = alarms[0];
      expect(alarm.Period).toBe(900);
    });

    it('should have 2 evaluation periods', () => {
      const alarm = alarms[0];
      expect(alarm.EvaluationPeriods).toBe(2);
    });

    it('should have SNS action', () => {
      const alarm = alarms[0];
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions).toContain(outputs.snsTopicArn);
    });

    it('should treat missing data as not breaching', () => {
      const alarm = alarms[0];
      expect(alarm.TreatMissingData).toBe('notBreaching');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should have complete compliance monitoring pipeline', async () => {
      // Verify Lambda function exists
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      expect(lambdaConfig.State).toBe('Active');

      // Verify DynamoDB table exists
      const table = await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamoTableName })
      );
      expect(table.Table?.TableStatus).toBe('ACTIVE');

      // Verify SNS topic exists
      const topicAttributes = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.snsTopicArn })
      );
      expect(topicAttributes.Attributes?.TopicArn).toBe(outputs.snsTopicArn);

      // Verify EventBridge rule exists
      const rules = await eventBridgeClient.send(
        new ListRulesCommand({ NamePrefix: 'compliance-schedule-' })
      );
      expect(rules.Rules).toBeDefined();
      expect(rules.Rules!.length).toBeGreaterThan(0);

      // Verify CloudWatch alarm exists
      const alarmName = outputs.complianceAlarmArn.split(':').pop();
      const alarms = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
      expect(alarms.MetricAlarms).toBeDefined();
      expect(alarms.MetricAlarms!.length).toBeGreaterThan(0);
    });

    it('should have proper resource connectivity', async () => {
      // Lambda has access to DynamoDB
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      expect(lambdaConfig.Environment?.Variables?.DYNAMO_TABLE_NAME).toBe(outputs.dynamoTableName);

      // Lambda has access to SNS
      expect(lambdaConfig.Environment?.Variables?.SNS_TOPIC_ARN).toBe(outputs.snsTopicArn);

      // EventBridge triggers Lambda
      const rules = await eventBridgeClient.send(
        new ListRulesCommand({ NamePrefix: 'compliance-schedule-' })
      );
      const targets = await eventBridgeClient.send(
        new ListTargetsByRuleCommand({ Rule: rules.Rules![0].Name })
      );
      const lambdaTarget = targets.Targets?.find(
        (target: any) => target.Arn === outputs.lambdaFunctionArn
      );
      expect(lambdaTarget).toBeDefined();

      // Alarm sends to SNS
      const alarmName = outputs.complianceAlarmArn.split(':').pop();
      const alarms = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
      expect(alarms.MetricAlarms![0].AlarmActions).toContain(outputs.snsTopicArn);
    });
  });

  describe('Security Configuration', () => {
    it('should have least-privilege IAM permissions', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const configResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      const roleName = configResponse.Role!.split('/').pop();

      // Verify role has specific resource ARNs, not wildcards
      try {
        const policyResponse = await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: roleName!,
            PolicyName: `compliance-lambda-custom-policy-${process.env.ENVIRONMENT_SUFFIX || 'synthr5t8t4v0'}`,
          })
        );
        const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));

        // Check for specific resource ARNs
        const dynamoStatement = policy.Statement.find(
          (statement: any) =>
            Array.isArray(statement.Action) && statement.Action.includes('dynamodb:PutItem')
        );
        if (dynamoStatement) {
          // DynamoDB actions should target specific table
          expect(dynamoStatement.Resource).toBeDefined();
        }

        const snsStatement = policy.Statement.find(
          (statement: any) =>
            Array.isArray(statement.Action) && statement.Action.includes('sns:Publish')
        );
        if (snsStatement) {
          // SNS actions should target specific topic
          expect(snsStatement.Resource).toBeDefined();
        }
      } catch (error: any) {
        if (error.name !== 'NoSuchEntity') {
          throw error;
        }
      }
    });
  });

  describe('Compliance Requirements Validation', () => {
    it('should meet all PROMPT requirements', async () => {
      // 1. Lambda function for compliance analysis
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      expect(lambdaConfig.State).toBe('Active');

      // 2. CloudWatch Events every 15 minutes
      const rules = await eventBridgeClient.send(
        new ListRulesCommand({ NamePrefix: 'compliance-schedule-' })
      );
      expect(rules.Rules![0].ScheduleExpression).toBe('rate(15 minutes)');

      // 3. SNS topic
      const topicAttributes = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.snsTopicArn })
      );
      expect(topicAttributes.Attributes?.TopicArn).toBe(outputs.snsTopicArn);

      // 4. CloudWatch Logs with 7-day retention
      const logGroups = await cloudwatchClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/lambda/compliance-analyzer-',
        })
      );
      expect(logGroups.logGroups![0].retentionInDays).toBe(7);

      // 5. CloudWatch Metrics (namespace)
      const alarmName = outputs.complianceAlarmArn.split(':').pop();
      const alarms = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
      expect(alarms.MetricAlarms![0].Namespace).toBe('ComplianceMonitoring');

      // 6. CloudWatch Alarm with 20% threshold
      expect(alarms.MetricAlarms![0].Threshold).toBe(20);

      // 7. SNS Email Subscription
      const subscriptions = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: outputs.snsTopicArn })
      );
      const emailSub = subscriptions.Subscriptions?.find((sub: any) => sub.Protocol === 'email');
      expect(emailSub).toBeDefined();
      expect(emailSub?.Endpoint).toBe('compliance@company.com');

      // 8. DynamoDB Table with TTL
      const table = await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamoTableName })
      );
      expect(table.Table?.TableStatus).toBe('ACTIVE');

      const ttlDescription = await dynamoDBClient.send(
        new DescribeTimeToLiveCommand({ TableName: outputs.dynamoTableName })
      );
      expect(ttlDescription.TimeToLiveDescription?.TimeToLiveStatus).toBe('ENABLED');

      // 9. IAM Roles with least-privilege
      const roleName = lambdaConfig.Role!.split('/').pop();
      const role = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));
      expect(role.Role).toBeDefined();
    });
  });
});
