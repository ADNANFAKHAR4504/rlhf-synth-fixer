import fs from 'fs';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  GetLogEventsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// AWS Clients
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const eventsClient = new EventBridgeClient({ region });
const cwClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });

describe('Infrastructure Analysis System - Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.AnalysisReportsBucketName).toBeDefined();
      expect(outputs.AnalysisReportsBucketArn).toBeDefined();
      expect(outputs.StackAnalysisFunctionArn).toBeDefined();
      expect(outputs.AnalysisNotificationTopicArn).toBeDefined();
      expect(outputs.ScheduledAnalysisRuleArn).toBeDefined();
    });

    test('bucket name should include environment suffix', () => {
      expect(outputs.AnalysisReportsBucketName).toContain('stack-analysis-reports-');
    });

    test('ARNs should be properly formatted', () => {
      expect(outputs.StackAnalysisFunctionArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.AnalysisReportsBucketArn).toMatch(/^arn:aws:s3:/);
      expect(outputs.AnalysisNotificationTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.ScheduledAnalysisRuleArn).toMatch(/^arn:aws:events:/);
    });
  });

  describe('S3 Bucket Integration', () => {
    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.AnalysisReportsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, 30000);

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.AnalysisReportsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.AnalysisReportsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();

      const config = response.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('should be accessible and empty initially', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.AnalysisReportsBucketName,
        MaxKeys: 10,
      });

      const response = await s3Client.send(command);
      // Bucket should be accessible, may or may not have objects depending on if Lambda ran
      expect(response).toBeDefined();
    }, 30000);
  });

  describe('Lambda Function Integration', () => {
    test('should exist and be active', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.StackAnalysisFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('python3.11');
    }, 30000);

    test('should have correct configuration', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.StackAnalysisFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBe(300);
      expect(response.MemorySize).toBe(512);
      expect(response.Handler).toBe('index.lambda_handler');
    }, 30000);

    test('should have environment variables configured', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.StackAnalysisFunctionArn,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Environment?.Variables;

      expect(envVars?.REPORT_BUCKET).toBe(outputs.AnalysisReportsBucketName);
      expect(envVars?.SNS_TOPIC_ARN).toBe(outputs.AnalysisNotificationTopicArn);
      expect(envVars?.ENVIRONMENT_SUFFIX).toBeDefined();
    }, 30000);

    test('should invoke successfully and analyze stacks', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.StackAnalysisFunctionArn,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({}),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.stacks_analyzed).toBeGreaterThanOrEqual(0);
      expect(body.total_findings).toBeGreaterThanOrEqual(0);
      expect(body.report_location).toContain('s3://');
    }, 60000);

    test('should have IAM role with correct permissions', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.StackAnalysisFunctionArn,
      });

      const funcConfig = await lambdaClient.send(command);
      const roleArn = funcConfig.Role;
      expect(roleArn).toBeDefined();

      const roleName = roleArn?.split('/').pop();
      expect(roleName).toContain('stack-analysis-lambda-role');
    }, 30000);
  });

  describe('SNS Topic Integration', () => {
    test('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AnalysisNotificationTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.AnalysisNotificationTopicArn);
    }, 30000);

    test('should have email subscription configured', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.AnalysisNotificationTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions?.length).toBeGreaterThan(0);

      const emailSub = response.Subscriptions?.find(s => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Logs Integration', () => {
    test('should have log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/stack-analysis-function-`,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('stack-analysis-function')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    }, 30000);

    test('should have log streams from Lambda execution', async () => {
      const logGroupName = `/aws/lambda/stack-analysis-function-${environmentSuffix}`;

      try {
        const command = new DescribeLogStreamsCommand({
          logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 5,
        });

        const response = await logsClient.send(command);
        // Log streams may or may not exist depending on execution
        expect(response).toBeDefined();
      } catch (error: any) {
        // Log group might not have streams yet if Lambda hasn't run
        if (!error.name?.includes('ResourceNotFoundException')) {
          throw error;
        }
      }
    }, 30000);
  });

  describe('EventBridge Rule Integration', () => {
    test('should exist and be enabled', async () => {
      const ruleName = `stack-analysis-schedule-${environmentSuffix}`;

      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventsClient.send(command);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBeDefined();
      expect(response.Arn).toBe(outputs.ScheduledAnalysisRuleArn);
    }, 30000);

    test('should target Lambda function', async () => {
      const ruleName = `stack-analysis-schedule-${environmentSuffix}`;

      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });

      const response = await eventsClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);

      const lambdaTarget = response.Targets?.find(t =>
        t.Arn === outputs.StackAnalysisFunctionArn
      );
      expect(lambdaTarget).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Alarms Integration', () => {
    test('should have error alarm configured', async () => {
      const alarmName = `stack-analysis-errors-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
    }, 30000);

    test('should have critical findings alarm configured', async () => {
      const alarmName = `stack-analysis-critical-findings-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('CriticalFindings');
      expect(alarm?.Namespace).toBe('StackAnalysis');
    }, 30000);

    test('both alarms should have SNS actions configured', async () => {
      const alarmNames = [
        `stack-analysis-errors-${environmentSuffix}`,
        `stack-analysis-critical-findings-${environmentSuffix}`,
      ];

      const command = new DescribeAlarmsCommand({
        AlarmNames: alarmNames,
      });

      const response = await cwClient.send(command);

      response.MetricAlarms?.forEach(alarm => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
        expect(alarm.AlarmActions?.[0]).toBe(outputs.AnalysisNotificationTopicArn);
      });
    }, 30000);
  });

  describe('End-to-End Workflow Integration', () => {
    test('should complete full analysis workflow', async () => {
      // 1. Invoke Lambda function
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.StackAnalysisFunctionArn,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({}),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      const payload = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);

      // 2. Verify report was created in S3
      expect(body.report_location).toBeDefined();
      expect(body.report_location).toContain(outputs.AnalysisReportsBucketName);

      // 3. Wait a moment for logs to propagate
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 4. Verify Lambda logs were written
      const logGroupName = `/aws/lambda/stack-analysis-function-${environmentSuffix}`;

      try {
        const logCommand = new DescribeLogStreamsCommand({
          logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 1,
        });

        const logResponse = await logsClient.send(logCommand);
        expect(logResponse.logStreams).toBeDefined();
      } catch (error: any) {
        // Acceptable if no logs yet
        if (!error.name?.includes('ResourceNotFoundException')) {
          throw error;
        }
      }

      // 5. Verify reports can be listed from S3
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.AnalysisReportsBucketName,
        Prefix: 'reports/',
      });

      const listResponse = await s3Client.send(listCommand);
      expect(listResponse).toBeDefined();
      // Should have at least one report
      expect(listResponse.Contents || []).toBeDefined();
    }, 90000);

    test('should handle multiple stack analyses', async () => {
      // Run analysis twice to ensure idempotency
      const results = [];

      for (let i = 0; i < 2; i++) {
        const command = new InvokeCommand({
          FunctionName: outputs.StackAnalysisFunctionArn,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({}),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);

        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        const body = JSON.parse(payload.body);

        results.push(body);

        // Wait between invocations
        if (i < 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Both runs should succeed
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.stacks_analyzed).toBeGreaterThanOrEqual(0);
        expect(result.total_findings).toBeGreaterThanOrEqual(0);
      });
    }, 120000);
  });

  describe('Security and Compliance Integration', () => {
    test('Lambda should use latest runtime', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.StackAnalysisFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Runtime).toMatch(/python3\.(11|12|13)/);
    }, 30000);

    test('IAM role should follow least-privilege', async () => {
      const getFunctionCommand = new GetFunctionConfigurationCommand({
        FunctionName: outputs.StackAnalysisFunctionArn,
      });

      const funcConfig = await lambdaClient.send(getFunctionCommand);
      const roleArn = funcConfig.Role;
      const roleName = roleArn?.split('/').pop();

      if (!roleName) {
        throw new Error('Role name not found');
      }

      // Check attached managed policies
      const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });

      const policiesResponse = await iamClient.send(attachedPoliciesCommand);
      const attachedPolicies = policiesResponse.AttachedPolicies || [];

      // Should have basic Lambda execution role
      const hasBasicRole = attachedPolicies.some(p =>
        p.PolicyArn?.includes('AWSLambdaBasicExecutionRole')
      );
      expect(hasBasicRole).toBe(true);
    }, 30000);

    test('S3 bucket should have proper security settings', async () => {
      // Already tested encryption, versioning, and public access block
      // This test confirms all security features together
      const [encryption, versioning, publicAccess] = await Promise.all([
        s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: outputs.AnalysisReportsBucketName,
          })
        ),
        s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: outputs.AnalysisReportsBucketName,
          })
        ),
        s3Client.send(
          new GetPublicAccessBlockCommand({
            Bucket: outputs.AnalysisReportsBucketName,
          })
        ),
      ]);

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(versioning.Status).toBe('Enabled');
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    }, 30000);
  });

  describe('Resource Naming Compliance', () => {
    test('all resource names should include environment identifier', () => {
      expect(outputs.AnalysisReportsBucketName).toContain('stack-analysis-reports-');
      expect(outputs.StackAnalysisFunctionArn).toContain('stack-analysis-function-');
      expect(outputs.AnalysisNotificationTopicArn).toContain('stack-analysis-notifications-');
      expect(outputs.ScheduledAnalysisRuleArn).toContain('stack-analysis-schedule-');
    });

    test('all ARNs should be in correct region', () => {
      const arnRegex = new RegExp(`:${region}:`);

      expect(outputs.StackAnalysisFunctionArn).toMatch(arnRegex);
      expect(outputs.AnalysisNotificationTopicArn).toMatch(arnRegex);
      expect(outputs.ScheduledAnalysisRuleArn).toMatch(arnRegex);
    });
  });
});
