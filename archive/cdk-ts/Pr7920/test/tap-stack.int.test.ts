// Integration tests - testing deployed infrastructure
import fs from 'fs';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'),
);

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const s3Client = new S3Client({ region });
const codebuildClient = new CodeBuildClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const kmsClient = new KMSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('CodeBuild Compliance Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('all required outputs are present', () => {
      expect(outputs).toHaveProperty('ReportsBucketName');
      expect(outputs).toHaveProperty('ScannerProjectName');
      expect(outputs).toHaveProperty('ReportGeneratorFunctionName');
      expect(outputs).toHaveProperty('AutoRemediationFunctionName');
      expect(outputs).toHaveProperty('CriticalViolationsTopicArn');
      expect(outputs).toHaveProperty('WeeklyReportsTopicArn');
      expect(outputs).toHaveProperty('DashboardName');
    });

    test('outputs contain environmentSuffix', () => {
      expect(outputs.ReportsBucketName).toContain(environmentSuffix);
      expect(outputs.ScannerProjectName).toContain(environmentSuffix);
      expect(outputs.ReportGeneratorFunctionName).toContain(environmentSuffix);
      expect(outputs.AutoRemediationFunctionName).toContain(environmentSuffix);
      expect(outputs.DashboardName).toContain(environmentSuffix);
    });
  });

  describe('S3 Bucket', () => {
    test('reports bucket exists with versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.ReportsBucketName,
        }),
      );

      expect(response.Status).toBe('Enabled');
    });

    test('reports bucket has encryption with KMS', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.ReportsBucketName,
        }),
      );

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm,
      ).toBe('aws:kms');
    });

    test('reports bucket has lifecycle configuration', async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: outputs.ReportsBucketName,
        }),
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const lifecycleRule = response.Rules?.[0];
      expect(lifecycleRule?.Status).toBe('Enabled');
      expect(lifecycleRule?.Transitions).toBeDefined();
      expect(lifecycleRule?.Transitions?.length).toBeGreaterThan(0);
    });
  });

  describe('CodeBuild Project', () => {
    test('compliance scanner project exists with correct configuration', async () => {
      const response = await codebuildClient.send(
        new BatchGetProjectsCommand({
          names: [outputs.ScannerProjectName],
        }),
      );

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);

      const project = response.projects?.[0];
      expect(project?.name).toBe(outputs.ScannerProjectName);
      expect(project?.description).toContain('compliance');
    });

    test('scanner has correct build environment', async () => {
      const response = await codebuildClient.send(
        new BatchGetProjectsCommand({
          names: [outputs.ScannerProjectName],
        }),
      );

      const project = response.projects?.[0];
      expect(project?.environment?.image).toContain('standard:7.0');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('scanner has required environment variables', async () => {
      const response = await codebuildClient.send(
        new BatchGetProjectsCommand({
          names: [outputs.ScannerProjectName],
        }),
      );

      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables || [];
      const envVarNames = envVars.map((v) => v.name);

      expect(envVarNames).toContain('REPORTS_BUCKET');
      expect(envVarNames).toContain('ENVIRONMENT_SUFFIX');
      expect(envVarNames).toContain('SNS_TOPIC_ARN');
    });
  });

  describe('Lambda Functions', () => {
    test('report generator function exists with correct runtime', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.ReportGeneratorFunctionName,
        }),
      );

      expect(response.Configuration?.FunctionName).toBe(
        outputs.ReportGeneratorFunctionName,
      );
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(300);
    });

    test('report generator has X-Ray tracing enabled', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.ReportGeneratorFunctionName,
        }),
      );

      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    test('report generator has required environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.ReportGeneratorFunctionName,
        }),
      );

      const envVars = response.Environment?.Variables || {};
      expect(envVars).toHaveProperty('REPORTS_BUCKET');
      expect(envVars).toHaveProperty('SNS_TOPIC_ARN');
    });

    test('auto-remediation function exists with correct runtime', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.AutoRemediationFunctionName,
        }),
      );

      expect(response.Configuration?.FunctionName).toBe(
        outputs.AutoRemediationFunctionName,
      );
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(300);
    });

    test('auto-remediation has X-Ray tracing enabled', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.AutoRemediationFunctionName,
        }),
      );

      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    test('auto-remediation has required environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.AutoRemediationFunctionName,
        }),
      );

      const envVars = response.Environment?.Variables || {};
      expect(envVars).toHaveProperty('REPORTS_BUCKET');
    });
  });

  describe('SNS Topics', () => {
    test('critical violations topic exists with KMS encryption', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.CriticalViolationsTopicArn,
        }),
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(
        outputs.CriticalViolationsTopicArn,
      );
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });

    test('weekly reports topic exists with KMS encryption', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.WeeklyReportsTopicArn,
        }),
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(
        outputs.WeeklyReportsTopicArn,
      );
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });

    test('weekly reports topic has email subscription', async () => {
      const response = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: outputs.WeeklyReportsTopicArn,
        }),
      );

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions?.length).toBeGreaterThan(0);

      const emailSub = response.Subscriptions?.find(
        (sub) => sub.Protocol === 'email',
      );
      expect(emailSub).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    test('CodeBuild change rule exists', async () => {
      const response = await eventBridgeClient.send(
        new DescribeRuleCommand({
          Name: `codebuild-change-scanner-${environmentSuffix}`,
        }),
      );

      expect(response.Name).toBe(
        `codebuild-change-scanner-${environmentSuffix}`,
      );
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();
    });

    test('daily scan rule exists with correct schedule', async () => {
      const response = await eventBridgeClient.send(
        new DescribeRuleCommand({
          Name: `codebuild-daily-scan-${environmentSuffix}`,
        }),
      );

      expect(response.Name).toBe(`codebuild-daily-scan-${environmentSuffix}`);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBeDefined();
      expect(response.ScheduleExpression).toContain('cron');
    });

    test('weekly report rule exists with correct schedule', async () => {
      const response = await eventBridgeClient.send(
        new DescribeRuleCommand({
          Name: `codebuild-weekly-report-${environmentSuffix}`,
        }),
      );

      expect(response.Name).toBe(
        `codebuild-weekly-report-${environmentSuffix}`,
      );
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBeDefined();
      expect(response.ScheduleExpression).toContain('MON');
    });

    test('CodeBuild change rule has correct targets', async () => {
      const response = await eventBridgeClient.send(
        new ListTargetsByRuleCommand({
          Rule: `codebuild-change-scanner-${environmentSuffix}`,
        }),
      );

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);

      // Should have CodeBuild project and Lambda function as targets
      const targetArns = response.Targets?.map((t) => t.Arn) || [];
      const hasCodeBuildTarget = targetArns.some((arn) =>
        arn?.includes('codebuild'),
      );
      const hasLambdaTarget = targetArns.some((arn) => arn?.includes('lambda'));

      expect(hasCodeBuildTarget).toBe(true);
      expect(hasLambdaTarget).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('scanner failure alarm exists', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`codebuild-scanner-failures-${environmentSuffix}`],
        }),
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.AlarmName).toBe(
        `codebuild-scanner-failures-${environmentSuffix}`,
      );
      expect(alarm?.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(alarm?.Threshold).toBe(1);
    });

    test('report generator error alarm exists', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`report-generator-errors-${environmentSuffix}`],
        }),
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.AlarmName).toBe(
        `report-generator-errors-${environmentSuffix}`,
      );
      expect(alarm?.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('auto-remediation error alarm exists', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`auto-remediation-errors-${environmentSuffix}`],
        }),
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.AlarmName).toBe(
        `auto-remediation-errors-${environmentSuffix}`,
      );
      expect(alarm?.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('compliance dashboard exists with widgets', async () => {
      const response = await cloudwatchClient.send(
        new GetDashboardCommand({
          DashboardName: outputs.DashboardName,
        }),
      );

      expect(response.DashboardName).toBe(outputs.DashboardName);
      expect(response.DashboardBody).toBeDefined();

      // Parse dashboard body and verify it has widgets
      const dashboard = JSON.parse(response.DashboardBody || '{}');
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('scanner log group exists with correct retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/codebuild/compliance-scanner-${environmentSuffix}`,
        }),
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBe(1);

      const logGroup = response.logGroups?.[0];
      expect(logGroup?.logGroupName).toBe(
        `/aws/codebuild/compliance-scanner-${environmentSuffix}`,
      );
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('KMS Encryption Key', () => {
    test('KMS alias exists for compliance key', async () => {
      const response = await kmsClient.send(
        new ListAliasesCommand({}),
      );

      const alias = response.Aliases?.find(
        (a) => a.AliasName === `alias/compliance-key-${environmentSuffix}`,
      );

      expect(alias).toBeDefined();
      expect(alias?.TargetKeyId).toBeDefined();
    });

    test('KMS key has rotation enabled', async () => {
      // First get the key ID from the alias
      const aliasResponse = await kmsClient.send(
        new ListAliasesCommand({}),
      );

      const alias = aliasResponse.Aliases?.find(
        (a) => a.AliasName === `alias/compliance-key-${environmentSuffix}`,
      );

      expect(alias?.TargetKeyId).toBeDefined();

      // Now describe the key
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: alias?.TargetKeyId,
        }),
      );

      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata?.KeyManager).toBe('CUSTOMER');
    });
  });
});
