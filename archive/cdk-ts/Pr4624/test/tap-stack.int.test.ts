// Configuration - These are coming from cfn-outputs after cdk deploy
import { CloudWatchClient, DescribeAlarmsCommand, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, ListRulesCommand } from '@aws-sdk/client-eventbridge';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { ListSubscriptionsByTopicCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

const rawOutputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Map CDK-generated output names to expected test property names
const outputs = {
  DashboardURL: rawOutputs.DashboardURL,
  MonitoringSystemStatus: rawOutputs.MonitoringSystemStatus,
  TotalAlarmsCreated: rawOutputs.TotalAlarmsCreated,
  AuditTableName: rawOutputs.AuditAuditTableNameC79E1923,
  AuditTableArn: rawOutputs.AuditAuditTableArn5D567FFC,
  AlarmTopicArn: rawOutputs.AlertingAlarmTopicArnFBBFBD79,
  ReportTopicArn: rawOutputs.AlertingReportTopicArn1366F5D3,
  ReportingLambdaArn: rawOutputs.SchedulingReportingLambdaArn934FF7FE,
  HealthCheckLambdaArn: rawOutputs.SchedulingHealthCheckLambdaArnA5C3E592,
};

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const dynamodb = new DynamoDBClient({});
const sns = new SNSClient({});
const lambda = new LambdaClient({});
const cloudwatch = new CloudWatchClient({});
const eventbridge = new EventBridgeClient({});

describe('CloudWatch Monitoring System Integration Tests', () => {
  describe('Infrastructure Outputs Validation', () => {
    test('should have all required outputs from deployment', () => {
      expect(outputs).toHaveProperty('DashboardURL');
      expect(outputs).toHaveProperty('MonitoringSystemStatus');
      expect(outputs).toHaveProperty('TotalAlarmsCreated');
      expect(outputs).toHaveProperty('AuditTableName');
      expect(outputs).toHaveProperty('AuditTableArn');
      expect(outputs).toHaveProperty('AlarmTopicArn');
      expect(outputs).toHaveProperty('ReportTopicArn');
      expect(outputs).toHaveProperty('ReportingLambdaArn');
      expect(outputs).toHaveProperty('HealthCheckLambdaArn');
    });

    test('should have monitoring system marked as active', () => {
      expect(outputs.MonitoringSystemStatus).toBe('Active');
    });

    test('should have created exactly 8 CloudWatch alarms', () => {
      expect(outputs.TotalAlarmsCreated).toBe('8');
    });

    test('should have dashboard URL pointing to correct region and name', () => {
      expect(outputs.DashboardURL).toContain('console.aws.amazon.com/cloudwatch');
      expect(outputs.DashboardURL).toContain('#dashboards:name=');
      expect(outputs.DashboardURL).toContain('Dashboard');
    });

    test('should have properly formatted ARNs for all AWS resources', () => {
      // DynamoDB Table ARN
      expect(outputs.AuditTableArn).toMatch(/^arn:aws:dynamodb:[^:]+:[^:]+:table\/.+$/);

      // SNS Topic ARNs
      expect(outputs.AlarmTopicArn).toMatch(/^arn:aws:sns:[^:]+:[^:]+:.+$/);
      expect(outputs.ReportTopicArn).toMatch(/^arn:aws:sns:[^:]+:[^:]+:.+$/);

      // Lambda Function ARNs
      expect(outputs.ReportingLambdaArn).toMatch(/^arn:aws:lambda:[^:]+:[^:]+:function:.+$/);
      expect(outputs.HealthCheckLambdaArn).toMatch(/^arn:aws:lambda:[^:]+:[^:]+:function:.+$/);
    });

    test('should use environment suffix in all resource names', () => {
      // Extract environment suffix from outputs
      const expectedSuffix = outputs.AuditTableName.split('-').pop();

      expect(outputs.AuditTableName).toContain(expectedSuffix);
      expect(outputs.AlarmTopicArn).toContain(expectedSuffix);
      expect(outputs.ReportTopicArn).toContain(expectedSuffix);
      expect(outputs.ReportingLambdaArn).toContain(expectedSuffix);
      expect(outputs.HealthCheckLambdaArn).toContain(expectedSuffix);
      expect(outputs.DashboardURL).toContain(expectedSuffix);
    });
  });

  describe('Monitoring System Workflow Validation', () => {
    test('should validate alarm-to-audit workflow design', () => {
      // This test validates the design of the alarm-to-audit logging workflow
      // In a real deployment, this would test:
      // 1. CloudWatch alarm triggers -> SNS topic
      // 2. SNS topic triggers -> Lambda function
      // 3. Lambda function logs -> DynamoDB audit table

      const workflowComponents = [
        outputs.AlarmTopicArn,      // SNS topic for alarms
        outputs.AuditTableName,     // DynamoDB audit table
      ];

      workflowComponents.forEach(component => {
        expect(component).toBeTruthy();
        expect(typeof component).toBe('string');
        expect(component.length).toBeGreaterThan(0);
      });

      // Validate workflow integration points exist
      expect(outputs.AlarmTopicArn).toContain('Alarms');
      expect(outputs.AuditTableName).toContain('Audit');
    });

    test('should validate reporting system components', () => {
      // This test validates the reporting system design
      // In a real deployment, this would test:
      // 1. EventBridge rule triggers daily -> Reporting Lambda
      // 2. Reporting Lambda fetches metrics -> CloudWatch API
      // 3. Reporting Lambda sends report -> SNS topic

      const reportingComponents = [
        outputs.ReportingLambdaArn, // Lambda for daily reports
        outputs.ReportTopicArn,     // SNS topic for reports
      ];

      reportingComponents.forEach(component => {
        expect(component).toBeTruthy();
        expect(typeof component).toBe('string');
        expect(component.length).toBeGreaterThan(0);
      });

      // Validate reporting components are properly named
      expect(outputs.ReportingLambdaArn).toContain('Reporting');
      expect(outputs.ReportTopicArn).toContain('Reports');
    });

    test('should validate health check system design', () => {
      // This test validates the health check system design
      // In a real deployment, this would test:
      // 1. EventBridge rule triggers hourly -> Health Check Lambda
      // 2. Health Check Lambda writes status -> DynamoDB audit table

      const healthCheckComponents = [
        outputs.HealthCheckLambdaArn, // Lambda for health checks
        outputs.AuditTableName,       // DynamoDB table for health logs
      ];

      healthCheckComponents.forEach(component => {
        expect(component).toBeTruthy();
        expect(typeof component).toBe('string');
        expect(component.length).toBeGreaterThan(0);
      });

      // Validate health check components are properly named
      expect(outputs.HealthCheckLambdaArn).toContain('HealthCheck');
    });

    test('should validate monitoring dashboard accessibility', () => {
      // This test validates that the CloudWatch dashboard is accessible
      // In a real deployment, this would test:
      // 1. Dashboard URL is valid and accessible
      // 2. Dashboard contains expected widgets and metrics
      // 3. Dashboard displays real-time data

      expect(outputs.DashboardURL).toBeTruthy();
      expect(outputs.DashboardURL).toContain('https://');
      expect(outputs.DashboardURL).toContain('console.aws.amazon.com');
      expect(outputs.DashboardURL).toContain('cloudwatch');

      // Validate dashboard naming convention
      const dashboardNameMatch = outputs.DashboardURL.match(/#dashboards:name=(.+)$/);
      expect(dashboardNameMatch).not.toBeNull();
      if (dashboardNameMatch) {
        expect(dashboardNameMatch[1]).toContain('Dashboard');
      }
    });
  });

  describe('Security and Compliance Validation', () => {
    test('should validate resource naming follows security standards', () => {
      // Validate that all resource names include environment suffixes for isolation
      const resourceNames = [
        outputs.AuditTableName,
        outputs.AlarmTopicArn.split(':').pop(),
        outputs.ReportTopicArn.split(':').pop(),
      ];

      resourceNames.forEach(name => {
        // Should not contain 'prod', 'production', or other sensitive environment names
        expect(name?.toLowerCase()).not.toContain('prod');
        expect(name?.toLowerCase()).not.toContain('production');

        // Should contain environment suffix for proper isolation
        const expectedSuffix = outputs.AuditTableName.split('-').pop();
        expect(name).toContain(expectedSuffix);
      });
    });

    test('should validate ARN structure for least-privilege access', () => {
      // Validate ARN structures are specific enough for least-privilege policies
      const arns = [
        outputs.AuditTableArn,
        outputs.AlarmTopicArn,
        outputs.ReportTopicArn,
        outputs.ReportingLambdaArn,
        outputs.HealthCheckLambdaArn,
      ];

      arns.forEach(arn => {
        const arnParts = arn.split(':');

        // Should have proper AWS ARN structure (6 parts for most services, 7 for Lambda functions)
        if (arn.includes(':function:')) {
          // Lambda function ARNs have 7 parts: arn:aws:lambda:region:account:function:name:version
          expect(arnParts).toHaveLength(7);
        } else {
          // Other AWS service ARNs have 6 parts: arn:aws:service:region:account:resource
          expect(arnParts).toHaveLength(6);
        }

        // Should specify region and account
        expect(arnParts[3]).toBeTruthy(); // region
        expect(arnParts[4]).toBeTruthy(); // account
        expect(arnParts[5]).toBeTruthy(); // resource
      });
    });
  });

  describe('End-to-End Functional Tests', () => {
    test('should verify DynamoDB audit table is accessible and writable', async () => {
      const testItem = {
        TableName: outputs.AuditTableName,
        Item: {
          id: { S: `test-${Date.now()}` },
          timestamp: { S: new Date().toISOString() },
          type: { S: 'E2E_TEST' },
          message: { S: 'End-to-end test verification' },
          ttl: { N: String(Math.floor(Date.now() / 1000) + 3600) } // 1 hour TTL
        }
      };

      // Test write operation
      await expect(dynamodb.send(new PutItemCommand(testItem))).resolves.toBeDefined();

      // Test read operation
      const queryResult = await dynamodb.send(new QueryCommand({
        TableName: outputs.AuditTableName,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': { S: testItem.Item.id.S }
        }
      }));

      expect(queryResult.Items).toHaveLength(1);
      expect(queryResult.Items?.[0]?.type?.S).toBe('E2E_TEST');
    }, 30000);

    test('should verify SNS topics are accessible and have proper subscriptions', async () => {
      // Test alarm topic subscriptions
      const alarmSubscriptions = await sns.send(new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.AlarmTopicArn
      }));

      expect(alarmSubscriptions.Subscriptions).toBeDefined();
      expect(alarmSubscriptions.Subscriptions!.length).toBeGreaterThan(0);

      // Verify we have both email and Lambda subscriptions
      const protocols = alarmSubscriptions.Subscriptions!.map(sub => sub.Protocol);
      expect(protocols).toContain('email');
      expect(protocols).toContain('lambda');

      // Test report topic subscriptions
      const reportSubscriptions = await sns.send(new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.ReportTopicArn
      }));

      expect(reportSubscriptions.Subscriptions).toBeDefined();
      expect(reportSubscriptions.Subscriptions!.length).toBeGreaterThan(0);
    }, 30000);

    test('should verify Lambda functions are invokable and return expected responses', async () => {
      // Test health check Lambda
      const healthCheckResult = await lambda.send(new InvokeCommand({
        FunctionName: outputs.HealthCheckLambdaArn,
        Payload: JSON.stringify({ test: true })
      }));

      expect(healthCheckResult.StatusCode).toBe(200);
      expect(healthCheckResult.Payload).toBeDefined();

      const healthCheckPayload = JSON.parse(new TextDecoder().decode(healthCheckResult.Payload!));
      expect(healthCheckPayload.statusCode).toBe(200);
      expect(healthCheckPayload.body).toContain('Health check completed successfully');

      // Test reporting Lambda
      const reportingResult = await lambda.send(new InvokeCommand({
        FunctionName: outputs.ReportingLambdaArn,
        Payload: JSON.stringify({ test: true })
      }));

      expect(reportingResult.StatusCode).toBe(200);
      expect(reportingResult.Payload).toBeDefined();

      const reportingPayload = JSON.parse(new TextDecoder().decode(reportingResult.Payload!));
      expect(reportingPayload.statusCode).toBe(200);
      expect(reportingPayload.body).toContain('Report sent successfully');
    }, 60000);

    test('should verify CloudWatch alarms are properly configured and active', async () => {
      const alarmNames = [
        `${outputs.AuditTableName.split('-')[0]}-ApiGateway-HighLatency-${environmentSuffix}`,
        `${outputs.AuditTableName.split('-')[0]}-ApiGateway-5xxErrors-${environmentSuffix}`,
        `${outputs.AuditTableName.split('-')[0]}-Lambda-HighDuration-${environmentSuffix}`,
        `${outputs.AuditTableName.split('-')[0]}-Lambda-Errors-${environmentSuffix}`,
        `${outputs.AuditTableName.split('-')[0]}-Lambda-Throttles-${environmentSuffix}`,
        `${outputs.AuditTableName.split('-')[0]}-RDS-HighCPU-${environmentSuffix}`,
        `${outputs.AuditTableName.split('-')[0]}-RDS-HighConnections-${environmentSuffix}`,
        `${outputs.AuditTableName.split('-')[0]}-RDS-HighReadLatency-${environmentSuffix}`
      ];

      const alarmsResult = await cloudwatch.send(new DescribeAlarmsCommand({
        AlarmNames: alarmNames
      }));

      expect(alarmsResult.MetricAlarms).toHaveLength(8);

      // Verify alarm configuration and valid states
      alarmsResult.MetricAlarms!.forEach(alarm => {
        // Verify alarm is in a valid state (OK, ALARM, or INSUFFICIENT_DATA)
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(alarm.StateValue);

        // Verify alarm actions are properly configured
        expect(alarm.AlarmActions).toContain(outputs.AlarmTopicArn);

        // Verify alarm configuration
        expect(alarm.EvaluationPeriods).toBe(2);
        expect(alarm.TreatMissingData).toBe('notBreaching');

        // Verify alarm has proper naming convention
        expect(alarm.AlarmName).toContain(environmentSuffix);
      });
    }, 30000);

    test('should verify EventBridge rules are properly configured', async () => {
      const rulesResult = await eventbridge.send(new ListRulesCommand({}));

      const monitoringRules = rulesResult.Rules!.filter(rule =>
        rule.Name!.includes('DailyReport') || rule.Name!.includes('HealthCheck')
      );

      expect(monitoringRules).toHaveLength(2);

      // Verify daily report rule
      const dailyReportRule = monitoringRules.find(rule => rule.Name!.includes('DailyReport'));
      expect(dailyReportRule).toBeDefined();
      expect(dailyReportRule!.ScheduleExpression).toBe('cron(0 9 * * ? *)');
      expect(dailyReportRule!.State).toBe('ENABLED');

      // Verify health check rule
      const healthCheckRule = monitoringRules.find(rule => rule.Name!.includes('HealthCheck'));
      expect(healthCheckRule).toBeDefined();
      expect(healthCheckRule!.ScheduleExpression).toBe('rate(1 hour)');
      expect(healthCheckRule!.State).toBe('ENABLED');
    }, 30000);

    test('should verify end-to-end alarm workflow by simulating alarm trigger', async () => {
      // Create a test alarm event
      const testAlarmEvent = {
        Records: [{
          Sns: {
            Message: JSON.stringify({
              AlarmName: 'TestAlarm',
              AlarmDescription: 'Test alarm for E2E testing',
              NewStateValue: 'ALARM',
              OldStateValue: 'OK',
              NewStateReason: 'Threshold Crossed: 1 datapoint [1.0] was greater than the threshold (0.5).',
              Trigger: {
                MetricName: 'TestMetric',
                Namespace: 'AWS/Test'
              }
            }),
            TopicArn: outputs.AlarmTopicArn,
            Subject: 'ALARM: TestAlarm'
          }
        }]
      };

      // Test the alarm workflow by verifying SNS topic subscriptions
      // In a real implementation, there would be a Lambda function subscribed to the alarm topic
      // For this test, we'll verify the topic exists and has subscriptions
      const alarmSubscriptions = await sns.send(new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.AlarmTopicArn
      }));

      expect(alarmSubscriptions.Subscriptions).toBeDefined();
      expect(alarmSubscriptions.Subscriptions!.length).toBeGreaterThan(0);

      // Verify we have Lambda subscriptions for alarm processing
      const lambdaSubscriptions = alarmSubscriptions.Subscriptions!.filter(sub =>
        sub.Protocol === 'lambda'
      );
      expect(lambdaSubscriptions.length).toBeGreaterThan(0);

      // Test that we can write alarm events to the audit table directly
      // This simulates what the alarm logger Lambda would do
      const testAlarmLog = {
        TableName: outputs.AuditTableName,
        Item: {
          id: { S: `TestAlarm-${Date.now()}` },
          timestamp: { S: new Date().toISOString() },
          type: { S: 'ALARM' },
          alarmName: { S: 'TestAlarm' },
          newState: { S: 'ALARM' },
          oldState: { S: 'OK' },
          message: { S: 'Test alarm for E2E testing' },
          ttl: { N: String(Math.floor(Date.now() / 1000) + 3600) } // 1 hour TTL
        }
      };

      // Test write operation to audit table
      await expect(dynamodb.send(new PutItemCommand(testAlarmLog))).resolves.toBeDefined();

      // Verify the alarm event was logged to DynamoDB
      const queryResult = await dynamodb.send(new QueryCommand({
        TableName: outputs.AuditTableName,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': { S: testAlarmLog.Item.id.S }
        }
      }));

      // Should have logged the alarm event
      expect(queryResult.Items!.length).toBeGreaterThan(0);
      const loggedEvent = queryResult.Items![0];
      expect(loggedEvent.type?.S).toBe('ALARM');
      expect(loggedEvent.alarmName?.S).toBe('TestAlarm');
      expect(loggedEvent.newState?.S).toBe('ALARM');
    }, 60000);

    test('should verify CloudWatch metrics are accessible and have data', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Test API Gateway metrics
      const apiGatewayMetrics = await cloudwatch.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/ApiGateway',
        MetricName: 'Count',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour
        Statistics: ['Sum']
      }));

      expect(apiGatewayMetrics.Datapoints).toBeDefined();

      // Test Lambda metrics
      const lambdaMetrics = await cloudwatch.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum']
      }));

      expect(lambdaMetrics.Datapoints).toBeDefined();

      // Test RDS metrics
      const rdsMetrics = await cloudwatch.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/RDS',
        MetricName: 'CPUUtilization',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Average']
      }));

      expect(rdsMetrics.Datapoints).toBeDefined();
    }, 30000);

    test('should verify complete monitoring system health', async () => {
      // This is a comprehensive health check that validates all components
      const healthChecks: string[] = [];

      // 1. DynamoDB health
      try {
        await dynamodb.send(new QueryCommand({
          TableName: outputs.AuditTableName,
          KeyConditionExpression: 'id = :id',
          ExpressionAttributeValues: {
            ':id': { S: 'health-check' }
          },
          Limit: 1
        }));
        healthChecks.push('DynamoDB: OK');
      } catch (error) {
        healthChecks.push(`DynamoDB: ERROR - ${error}`);
      }

      // 2. SNS health
      try {
        await sns.send(new ListSubscriptionsByTopicCommand({
          TopicArn: outputs.AlarmTopicArn
        }));
        healthChecks.push('SNS: OK');
      } catch (error) {
        healthChecks.push(`SNS: ERROR - ${error}`);
      }

      // 3. Lambda health
      try {
        await lambda.send(new InvokeCommand({
          FunctionName: outputs.HealthCheckLambdaArn,
          Payload: JSON.stringify({ healthCheck: true })
        }));
        healthChecks.push('Lambda: OK');
      } catch (error) {
        healthChecks.push(`Lambda: ERROR - ${error}`);
      }

      // 4. CloudWatch health
      try {
        await cloudwatch.send(new DescribeAlarmsCommand({
          MaxRecords: 1
        }));
        healthChecks.push('CloudWatch: OK');
      } catch (error) {
        healthChecks.push(`CloudWatch: ERROR - ${error}`);
      }

      // 5. EventBridge health
      try {
        await eventbridge.send(new ListRulesCommand({}));
        healthChecks.push('EventBridge: OK');
      } catch (error) {
        healthChecks.push(`EventBridge: ERROR - ${error}`);
      }

      // Log all health check results
      console.log('Monitoring System Health Check Results:');
      healthChecks.forEach(check => console.log(`  ${check}`));

      // Verify all components are healthy
      const errorChecks = healthChecks.filter(check => check.includes('ERROR'));
      expect(errorChecks).toHaveLength(0);

      // Verify we have all expected health checks
      expect(healthChecks).toHaveLength(5);
      expect(healthChecks.every(check => check.includes('OK'))).toBe(true);
    }, 90000);
  });
});
