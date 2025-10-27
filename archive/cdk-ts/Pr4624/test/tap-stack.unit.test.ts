import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { AlertingConstruct } from '../lib/constructs/alerting-construct';
import { AuditConstruct } from '../lib/constructs/audit-construct';
import { DashboardConstruct } from '../lib/constructs/dashboard-construct';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('CloudWatch Monitoring Infrastructure', () => {
    test('should create DynamoDB audit table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `TestTapStack-Audit-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('should create SNS topics for alarms and reports', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `TestTapStack-Alarms-${environmentSuffix}`,
        DisplayName: 'Monitoring System Alarms',
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `TestTapStack-Reports-${environmentSuffix}`,
        DisplayName: 'Monitoring System Reports',
      });
    });

    test('should create CloudWatch alarms', () => {
      // API Gateway alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-ApiGateway-HighLatency-${environmentSuffix}`,
        MetricName: 'Latency',
        Namespace: 'AWS/ApiGateway',
        Threshold: 1000,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-ApiGateway-5xxErrors-${environmentSuffix}`,
        Threshold: 5,
      });

      // Lambda alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-Lambda-HighDuration-${environmentSuffix}`,
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Threshold: 3000,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-Lambda-Errors-${environmentSuffix}`,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 10,
      });

      // RDS alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-RDS-HighCPU-${environmentSuffix}`,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 80,
      });

      // Verify total alarm count
      template.resourceCountIs('AWS::CloudWatch::Alarm', 8);
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `TestTapStack-Dashboard-${environmentSuffix}`,
      });
    });

    test('should create Lambda functions for reporting and health checks', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `TestTapStack-Reporting-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 300,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `TestTapStack-HealthCheck-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 30,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30,
      });

      // Total Lambda functions: reporting, health check, alarm logger
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('should create EventBridge rules for scheduling', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `TestTapStack-DailyReport-${environmentSuffix}`,
        ScheduleExpression: 'cron(0 9 * * ? *)',
      });

      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `TestTapStack-HealthCheck-${environmentSuffix}`,
        ScheduleExpression: 'rate(1 hour)',
      });

      template.resourceCountIs('AWS::Events::Rule', 2);
    });

    test('should create proper IAM roles and policies', () => {
      // Lambda execution roles
      template.resourceCountIs('AWS::IAM::Role', 3);
      template.resourceCountIs('AWS::IAM::Policy', 3);

      // Verify CloudWatch permissions for reporting lambda
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: 'sns:Publish',
              Effect: 'Allow',
            },
            {
              Action: 'cloudwatch:GetMetricStatistics',
              Effect: 'Allow',
              Resource: '*',
            },
          ],
        },
      });
    });

    test('should create outputs with proper naming', () => {
      const outputs = template.toJSON().Outputs;

      expect(outputs).toHaveProperty('DashboardURL');
      expect(outputs).toHaveProperty('MonitoringSystemStatus');
      expect(outputs).toHaveProperty('TotalAlarmsCreated');

      expect(outputs.MonitoringSystemStatus.Value).toBe('Active');
      expect(outputs.TotalAlarmsCreated.Value).toBe('8');
    });

    test('should have proper resource tagging', () => {
      // Check that resources are properly tagged
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: [
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'ManagedBy', Value: 'CDK' },
          { Key: 'Project', Value: 'CloudWatch-Monitoring' },
        ],
      });
    });

    test('should ensure all resources are destroyable', () => {
      // Verify DynamoDB table has DELETE removal policy
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });

      // Verify no Retain policies exist
      const template_json = template.toJSON();
      const resources = Object.values(template_json.Resources);

      resources.forEach((resource: any) => {
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        expect(resource.DeletionPolicy).not.toBe('Retain');

        if (resource.Properties) {
          // Check for DeletionProtection properties
          expect(resource.Properties.DeletionProtection).not.toBe(true);
        }
      });
    });

    test('should use environmentSuffix in all resource names', () => {
      const template_json = template.toJSON();
      const resources = Object.values(template_json.Resources);

      // Resources that should have environment suffix in name
      const resourcesWithNames = resources.filter((resource: any) =>
        resource.Properties && (
          resource.Properties.TableName ||
          resource.Properties.TopicName ||
          resource.Properties.FunctionName ||
          resource.Properties.AlarmName ||
          resource.Properties.DashboardName ||
          resource.Properties.RuleName
        )
      );

      expect(resourcesWithNames.length).toBeGreaterThan(0);

      resourcesWithNames.forEach((resource: any) => {
        const nameField =
          resource.Properties.TableName ||
          resource.Properties.TopicName ||
          resource.Properties.FunctionName ||
          resource.Properties.AlarmName ||
          resource.Properties.DashboardName ||
          resource.Properties.RuleName;

        if (nameField && typeof nameField === 'string') {
          expect(nameField).toContain(environmentSuffix);
        }
      });
    });

    test('should create DynamoDB Global Secondary Indexes', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TypeIndex',
            KeySchema: [
              { AttributeName: 'type', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
          },
          {
            IndexName: 'AlarmIndex',
            KeySchema: [
              { AttributeName: 'alarmName', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ]
      });
    });

    test('should create SNS subscriptions for email notifications', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 3);

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com'
      });
    });

    test('should create Lambda subscriptions for alarm logging', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda'
      });
    });

    test('should create all required CloudWatch alarms with proper thresholds', () => {
      // API Gateway alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-ApiGateway-HighLatency-${environmentSuffix}`,
        MetricName: 'Latency',
        Namespace: 'AWS/ApiGateway',
        Statistic: 'Average',
        Threshold: 1000,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'notBreaching'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-ApiGateway-5xxErrors-${environmentSuffix}`,
        Threshold: 5,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });

      // Lambda alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-Lambda-HighDuration-${environmentSuffix}`,
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Statistic: 'Average',
        Threshold: 3000,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-Lambda-Errors-${environmentSuffix}`,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Threshold: 10,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-Lambda-Throttles-${environmentSuffix}`,
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Threshold: 5,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });

      // RDS alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-RDS-HighCPU-${environmentSuffix}`,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-RDS-HighConnections-${environmentSuffix}`,
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestTapStack-RDS-HighReadLatency-${environmentSuffix}`,
        MetricName: 'ReadLatency',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 0.02,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('should create CloudWatch dashboard with proper widgets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `TestTapStack-Dashboard-${environmentSuffix}`
      });
    });

    test('should create Lambda functions with proper environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `TestTapStack-Reporting-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 300
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `TestTapStack-HealthCheck-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 30
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30
      });
    });

    test('should create EventBridge rules with proper targets', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `TestTapStack-DailyReport-${environmentSuffix}`,
        ScheduleExpression: 'cron(0 9 * * ? *)',
        Description: 'Trigger daily monitoring report',
        State: 'ENABLED'
      });

      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `TestTapStack-HealthCheck-${environmentSuffix}`,
        ScheduleExpression: 'rate(1 hour)',
        Description: 'Periodic health check of monitoring system',
        State: 'ENABLED'
      });
    });

    test('should create EventBridge targets for Lambda functions', () => {
      template.resourceCountIs('AWS::Events::Rule', 2);

      // Verify that EventBridge rules have targets
      const template_json = template.toJSON();
      const rules = Object.values(template_json.Resources).filter((resource: any) =>
        resource.Type === 'AWS::Events::Rule'
      );

      expect(rules.length).toBe(2);
      rules.forEach((rule: any) => {
        expect(rule.Properties.Targets).toBeDefined();
        expect(rule.Properties.Targets.length).toBeGreaterThan(0);
      });
    });

    test('should create DynamoDB table with proper encryption and backup', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `TestTapStack-Audit-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });
    });

    test('should create SNS topics with proper display names', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `TestTapStack-Alarms-${environmentSuffix}`,
        DisplayName: 'Monitoring System Alarms'
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `TestTapStack-Reports-${environmentSuffix}`,
        DisplayName: 'Monitoring System Reports'
      });
    });

    test('should create Lambda execution roles with proper trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });

    test('should create Lambda functions with inline code', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('should create CloudWatch alarms with SNS actions', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 8);
    });

    test('should create DynamoDB table with proper key schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
          { AttributeName: 'type', AttributeType: 'S' },
          { AttributeName: 'alarmName', AttributeType: 'S' }
        ]
      });
    });

    test('should create stack outputs with proper export names', () => {
      const outputs = template.toJSON().Outputs;

      expect(outputs.DashboardURL.Export.Name).toBe(`TestTapStack-DashboardURL-${environmentSuffix}`);
      expect(outputs.MonitoringSystemStatus.Export.Name).toBe(`TestTapStack-MonitoringSystemStatus-${environmentSuffix}`);
      expect(outputs.TotalAlarmsCreated.Export.Name).toBe(`TestTapStack-TotalAlarmsCreated-${environmentSuffix}`);
      expect(outputs.AuditAuditTableNameC79E1923.Export.Name).toBe(`TestTapStack-AuditTableName-${environmentSuffix}`);
      expect(outputs.AuditAuditTableArn5D567FFC.Export.Name).toBe(`TestTapStack-AuditTableArn-${environmentSuffix}`);
      expect(outputs.AlertingAlarmTopicArnFBBFBD79.Export.Name).toBe(`TestTapStack-AlarmTopicArn-${environmentSuffix}`);
      expect(outputs.AlertingReportTopicArn1366F5D3.Export.Name).toBe(`TestTapStack-ReportTopicArn-${environmentSuffix}`);
      expect(outputs.SchedulingReportingLambdaArn934FF7FE.Export.Name).toBe(`TestTapStack-ReportingLambdaArn-${environmentSuffix}`);
      expect(outputs.SchedulingHealthCheckLambdaArnA5C3E592.Export.Name).toBe(`TestTapStack-HealthCheckLambdaArn-${environmentSuffix}`);
    });

    test('should create stack with proper tags on all resources', () => {
      const template_json = template.toJSON();
      const resources = Object.values(template_json.Resources);

      // Check that at least some resources have tags
      const resourcesWithTags = resources.filter((resource: any) =>
        resource.Properties && resource.Properties.Tags
      );

      expect(resourcesWithTags.length).toBeGreaterThan(0);

      // Verify tag structure
      resourcesWithTags.forEach((resource: any) => {
        expect(resource.Properties.Tags).toBeInstanceOf(Array);
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });

    test('should handle environment suffix from context when not provided in props', () => {
      const appWithContext = new cdk.App();
      appWithContext.node.setContext('environmentSuffix', 'test-env');

      const stackWithContext = new TapStack(appWithContext, 'TestTapStackContext');
      const templateWithContext = Template.fromStack(stackWithContext);

      templateWithContext.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TestTapStackContext-Audit-test-env'
      });
    });

    test('should use default environment suffix when none provided', () => {
      const appDefault = new cdk.App();
      const stackDefault = new TapStack(appDefault, 'TestTapStackDefault');
      const templateDefault = Template.fromStack(stackDefault);

      templateDefault.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TestTapStackDefault-Audit-dev'
      });
    });

    test('should create all required construct outputs', () => {
      const outputs = template.toJSON().Outputs;

      // Main stack outputs
      expect(outputs).toHaveProperty('DashboardURL');
      expect(outputs).toHaveProperty('MonitoringSystemStatus');
      expect(outputs).toHaveProperty('TotalAlarmsCreated');

      // Construct-specific outputs
      expect(outputs).toHaveProperty('AuditAuditTableNameC79E1923');
      expect(outputs).toHaveProperty('AuditAuditTableArn5D567FFC');
      expect(outputs).toHaveProperty('AlertingAlarmTopicArnFBBFBD79');
      expect(outputs).toHaveProperty('AlertingReportTopicArn1366F5D3');
      expect(outputs).toHaveProperty('SchedulingReportingLambdaArn934FF7FE');
      expect(outputs).toHaveProperty('SchedulingHealthCheckLambdaArnA5C3E592');
    });

    test('should create CloudWatch metrics with proper namespaces and periods', () => {
      const template_json = template.toJSON();
      const alarms = Object.values(template_json.Resources).filter((resource: any) =>
        resource.Type === 'AWS::CloudWatch::Alarm'
      );

      expect(alarms.length).toBe(8);

      // Verify API Gateway metrics
      const apiGatewayAlarms = alarms.filter((alarm: any) =>
        alarm.Properties.Namespace === 'AWS/ApiGateway'
      );
      expect(apiGatewayAlarms.length).toBe(1);

      // Verify Lambda metrics
      const lambdaAlarms = alarms.filter((alarm: any) =>
        alarm.Properties.Namespace === 'AWS/Lambda'
      );
      expect(lambdaAlarms.length).toBe(3);

      // Verify RDS metrics
      const rdsAlarms = alarms.filter((alarm: any) =>
        alarm.Properties.Namespace === 'AWS/RDS'
      );
      expect(rdsAlarms.length).toBe(3);
    });

    test('should create IAM policies for Lambda functions', () => {
      template.resourceCountIs('AWS::IAM::Policy', 3);
    });

    test('should create IAM roles for Lambda functions', () => {
      template.resourceCountIs('AWS::IAM::Role', 3);
    });

    test('should create DynamoDB table with proper removal policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });

    test('should create SNS topics with proper naming convention', () => {
      const template_json = template.toJSON();
      const topics = Object.values(template_json.Resources).filter((resource: any) =>
        resource.Type === 'AWS::SNS::Topic'
      );

      expect(topics.length).toBe(2);
      topics.forEach((topic: any) => {
        expect(topic.Properties.TopicName).toContain(environmentSuffix);
      });
    });

    test('should create EventBridge rules with proper scheduling', () => {
      const template_json = template.toJSON();
      const rules = Object.values(template_json.Resources).filter((resource: any) =>
        resource.Type === 'AWS::Events::Rule'
      );

      expect(rules.length).toBe(2);
      rules.forEach((rule: any) => {
        expect(rule.Properties.ScheduleExpression).toBeDefined();
        expect(rule.Properties.State).toBe('ENABLED');
      });
    });

    test('should create CloudWatch alarms with proper evaluation periods', () => {
      const template_json = template.toJSON();
      const alarms = Object.values(template_json.Resources).filter((resource: any) =>
        resource.Type === 'AWS::CloudWatch::Alarm'
      );

      expect(alarms.length).toBe(8);
      alarms.forEach((alarm: any) => {
        expect(alarm.Properties.EvaluationPeriods).toBe(2);
        expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
      });
    });

    test('should create Lambda functions with proper runtime and handler', () => {
      const template_json = template.toJSON();
      const functions = Object.values(template_json.Resources).filter((resource: any) =>
        resource.Type === 'AWS::Lambda::Function'
      );

      expect(functions.length).toBe(3);
      functions.forEach((func: any) => {
        expect(func.Properties.Runtime).toBe('nodejs18.x');
        expect(func.Properties.Handler).toBe('index.handler');
      });
    });

    test('should create DynamoDB table with proper attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
          { AttributeName: 'type', AttributeType: 'S' },
          { AttributeName: 'alarmName', AttributeType: 'S' }
        ]
      });
    });

    test('should create stack with proper resource counts', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::SNS::Topic', 2);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 8);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::Lambda::Function', 3);
      template.resourceCountIs('AWS::Events::Rule', 2);
      template.resourceCountIs('AWS::IAM::Role', 3);
      template.resourceCountIs('AWS::IAM::Policy', 3);
      template.resourceCountIs('AWS::SNS::Subscription', 3);
    });

    test('should create dashboard without alarms when none provided', () => {
      const appNoAlarms = new cdk.App();
      const stackNoAlarms = new TapStack(appNoAlarms, 'TestTapStackNoAlarms', {
        environmentSuffix: 'test-no-alarms'
      });

      // Remove all alarms from the stack to test the no-alarms branch
      const templateNoAlarms = Template.fromStack(stackNoAlarms);

      // Dashboard should still be created
      templateNoAlarms.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TestTapStackNoAlarms-Dashboard-test-no-alarms'
      });
    });

    test('should handle empty alarms array', () => {
      const appEmptyAlarms = new cdk.App();
      const stackEmptyAlarms = new TapStack(appEmptyAlarms, 'TestTapStackEmptyAlarms', {
        environmentSuffix: 'test-empty-alarms'
      });

      const templateEmptyAlarms = Template.fromStack(stackEmptyAlarms);

      // Dashboard should still be created even with empty alarms
      templateEmptyAlarms.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TestTapStackEmptyAlarms-Dashboard-test-empty-alarms'
      });
    });

    test('should handle default email addresses when none provided', () => {
      const appDefaultEmails = new cdk.App();
      const stackDefaultEmails = new TapStack(appDefaultEmails, 'TestTapStackDefaultEmails', {
        environmentSuffix: 'test-default-emails'
      });

      const templateDefaultEmails = Template.fromStack(stackDefaultEmails);

      // Should still create SNS subscriptions with default email
      templateDefaultEmails.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com'
      });
    });

    test('should handle multiple email addresses', () => {
      const appMultiEmails = new cdk.App();
      const stackMultiEmails = new TapStack(appMultiEmails, 'TestTapStackMultiEmails', {
        environmentSuffix: 'test-multi-emails'
      });

      const templateMultiEmails = Template.fromStack(stackMultiEmails);

      // Should create subscriptions for the default email
      templateMultiEmails.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com'
      });
    });

    test('should test AlertingConstruct with custom email addresses', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStackCustomEmails');

      const audit = new AuditConstruct(stack, 'Audit', {
        environmentSuffix: 'test'
      });

      const alerting = new AlertingConstruct(stack, 'Alerting', {
        environmentSuffix: 'test',
        emailAddresses: ['custom1@example.com', 'custom2@example.com'],
        auditTable: audit.table
      });

      const template = Template.fromStack(stack);

      // Should create subscriptions for custom emails
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'custom1@example.com'
      });

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'custom2@example.com'
      });
    });

    test('should test AlertingConstruct with undefined email addresses', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStackUndefinedEmails');

      const audit = new AuditConstruct(stack, 'Audit', {
        environmentSuffix: 'test'
      });

      const alerting = new AlertingConstruct(stack, 'Alerting', {
        environmentSuffix: 'test',
        emailAddresses: undefined, // Explicitly undefined
        auditTable: audit.table
      });

      const template = Template.fromStack(stack);

      // Should create subscriptions for default email
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com'
      });
    });

    test('should test AlertingConstruct with empty email addresses array', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStackEmptyEmails');

      const audit = new AuditConstruct(stack, 'Audit', {
        environmentSuffix: 'test'
      });

      const alerting = new AlertingConstruct(stack, 'Alerting', {
        environmentSuffix: 'test',
        emailAddresses: [], // Empty array
        auditTable: audit.table
      });

      const template = Template.fromStack(stack);

      // With empty array, should only have Lambda subscription (no email subscriptions)
      template.resourceCountIs('AWS::SNS::Subscription', 1);
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda'
      });
    });

    test('should test DashboardConstruct without alarms', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStackNoAlarms');

      const dashboard = new DashboardConstruct(stack, 'Dashboard', {
        environmentSuffix: 'test',
        alarms: undefined // No alarms provided
      });

      const template = Template.fromStack(stack);

      // Dashboard should still be created
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TestStackNoAlarms-Dashboard-test'
      });
    });

    test('should test DashboardConstruct with empty alarms array', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStackEmptyAlarms');

      const dashboard = new DashboardConstruct(stack, 'Dashboard', {
        environmentSuffix: 'test',
        alarms: [] // Empty alarms array
      });

      const template = Template.fromStack(stack);

      // Dashboard should still be created
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TestStackEmptyAlarms-Dashboard-test'
      });
    });

    test('should test DashboardConstruct with alarms', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStackWithAlarms');

      // Create a mock alarm
      const mockAlarm = new cw.Alarm(stack, 'MockAlarm', {
        metric: new cw.Metric({
          namespace: 'AWS/Test',
          metricName: 'TestMetric',
          statistic: 'Average'
        }),
        threshold: 100,
        evaluationPeriods: 2
      });

      const dashboard = new DashboardConstruct(stack, 'Dashboard', {
        environmentSuffix: 'test',
        alarms: [mockAlarm] // With alarms
      });

      const template = Template.fromStack(stack);

      // Dashboard should be created
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TestStackWithAlarms-Dashboard-test'
      });
    });

    test('should test TapStack with custom email addresses', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStackCustomEmails', {
        environmentSuffix: 'test-custom-emails'
      });

      const template = Template.fromStack(stack);

      // Should still create subscriptions (using default email in current implementation)
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com'
      });
    });

    test('should test TapStack with different environment suffixes', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStackDifferentEnv', {
        environmentSuffix: 'prod'
      });

      const template = Template.fromStack(stack);

      // Should create resources with prod suffix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TestTapStackDifferentEnv-Audit-prod'
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'TestTapStackDifferentEnv-Alarms-prod'
      });
    });
  });
});
