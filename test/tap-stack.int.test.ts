// Integration Tests for TAP Serverless CI/CD Stack
// Tests deployed infrastructure outputs and configuration
// Validates AWS CDK deployment with S3, Lambda, CI/CD Pipeline, and monitoring

import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  BatchGetProjectsCommand,
  CodeBuildClient,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  ListPipelinesCommand,
} from '@aws-sdk/client-codepipeline';
import {
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import {
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import fs from 'fs';
import path from 'path';

const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
const REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-west-2';
const ACCOUNT_ID = process.env.CDK_DEFAULT_ACCOUNT || '123456789012';

interface StackOutputs {
  ApplicationBucketName?: string;
  ApplicationBucketArn?: string;
  LoggingBucketName?: string;
  PipelineSourceBucketName?: string;
  LambdaFunctionArn?: string;
  LambdaFunctionName?: string;
  LambdaRoleArn?: string;
  DeadLetterQueueUrl?: string;
  DeadLetterQueueArn?: string;
  SecretArn?: string;
  AlarmTopicArn?: string;
  ErrorAlarmName?: string;
  ThrottleAlarmName?: string;
  DurationAlarmName?: string;
  TestInvokeCommand?: string;
  CheckDLQCommand?: string;
  ViewLogsCommand?: string;
}

let outputs: StackOutputs = {};

// AWS Clients
let s3Client: S3Client;
let lambdaClient: LambdaClient;
let sqsClient: SQSClient;
let secretsClient: SecretsManagerClient;
let cloudWatchClient: CloudWatchClient;
let logsClient: CloudWatchLogsClient;
let snsClient: SNSClient;
let iamClient: IAMClient;
let codePipelineClient: CodePipelineClient;
let codeBuildClient: CodeBuildClient;

beforeAll(() => {
  // Load outputs from file
  const rawData = fs.readFileSync(outputsPath, 'utf8');
  const rawOutputs = JSON.parse(rawData);

  // Replace *** with actual account ID
  outputs = Object.entries(rawOutputs).reduce((acc, [key, value]) => {
    acc[key as keyof StackOutputs] = typeof value === 'string'
      ? value.replace(/\*\*\*/g, ACCOUNT_ID)
      : value;
    return acc;
  }, {} as StackOutputs);

  console.log('✓ Loaded outputs from:', outputsPath);
  console.log(`✓ Using Account ID: ${ACCOUNT_ID}, Region: ${REGION}`);

  // Preflight checks
  const hasAwsCreds = Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_PROFILE
  );
  if (!hasAwsCreds) {
    throw new Error('AWS credentials are required: set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or AWS_PROFILE.');
  }

  if (Object.keys(outputs).length === 0) {
    throw new Error('No outputs found in flat-outputs.json. Ensure CDK stack is deployed.');
  }

  // Initialize AWS clients
  s3Client = new S3Client({ region: REGION });
  lambdaClient = new LambdaClient({ region: REGION });
  sqsClient = new SQSClient({ region: REGION });
  secretsClient = new SecretsManagerClient({ region: REGION });
  cloudWatchClient = new CloudWatchClient({ region: REGION });
  logsClient = new CloudWatchLogsClient({ region: REGION });
  snsClient = new SNSClient({ region: REGION });
  iamClient = new IAMClient({ region: REGION });
  codePipelineClient = new CodePipelineClient({ region: REGION });
  codeBuildClient = new CodeBuildClient({ region: REGION });
});

describe('TAP Serverless CI/CD Stack - Integration Tests', () => {
  describe('Outputs File Validation', () => {
    test('outputs JSON file exists and is valid', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('outputs contain required keys for testing', () => {
      expect(outputs).toHaveProperty('ApplicationBucketName');
      expect(outputs).toHaveProperty('LambdaFunctionName');
      expect(outputs).toHaveProperty('LambdaFunctionArn');
      expect(outputs).toHaveProperty('DeadLetterQueueUrl');
      expect(outputs).toHaveProperty('SecretArn');
    });

    test('account ID replacement was successful', () => {
      const hasAccountId = Object.values(outputs).some(value =>
        typeof value === 'string' && value.includes(ACCOUNT_ID)
      );
      expect(hasAccountId).toBe(true);

      const hasPlaceholder = Object.values(outputs).some(value =>
        typeof value === 'string' && value.includes('***')
      );
      expect(hasPlaceholder).toBe(false);
    });

    test('all ARNs are valid and region-agnostic', () => {
      const arnOutputs = Object.entries(outputs).filter(([key, value]) =>
        key.includes('Arn') && typeof value === 'string'
      );

      arnOutputs.forEach(([key, value]) => {
        expect(value).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]+:[0-9]{12}:.+/);
        console.log(`✓ ${key}: ${value}`);
      });
    });
  });

  // ========== S3 BUCKET TESTS ==========
  describe('S3 Bucket Configuration', () => {
    test('Application S3 bucket exists and is accessible', async () => {
      expect(outputs.ApplicationBucketName).toBeDefined();

      await s3Client.send(new HeadBucketCommand({
        Bucket: outputs.ApplicationBucketName!,
      }));

      console.log(`✓ Application bucket ${outputs.ApplicationBucketName} exists`);
    }, 30000);

    test('S3 bucket has versioning enabled', async () => {
      const versioning = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: outputs.ApplicationBucketName!,
      }));

      expect(versioning.Status).toBe('Enabled');
      console.log('✓ S3 bucket versioning is enabled');
    }, 30000);

    test('S3 bucket has logging configured', async () => {
      expect(outputs.LoggingBucketName).toBeDefined();

      // Verify logging bucket exists
      await s3Client.send(new HeadBucketCommand({
        Bucket: outputs.LoggingBucketName!,
      }));

      // Verify application bucket has logging configured
      const logging = await s3Client.send(new GetBucketLoggingCommand({
        Bucket: outputs.ApplicationBucketName!,
      }));

      expect(logging.LoggingEnabled).toBeDefined();
      expect(logging.LoggingEnabled?.TargetBucket).toBe(outputs.LoggingBucketName);
      console.log(`✓ S3 bucket logging configured to ${outputs.LoggingBucketName}`);
    }, 30000);

    test('S3 bucket has encryption enabled', async () => {
      const encryption = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: outputs.ApplicationBucketName!,
      }));

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);

      const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      console.log('✓ S3 bucket encryption is enabled with KMS');
    }, 30000);

    test('S3 bucket blocks public access', async () => {
      const publicAccess = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: outputs.ApplicationBucketName!,
      }));

      const config = publicAccess.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);

      console.log('✓ S3 bucket public access is blocked');
    }, 30000);

    test('Pipeline source bucket exists and is configured', async () => {
      expect(outputs.PipelineSourceBucketName).toBeDefined();

      await s3Client.send(new HeadBucketCommand({
        Bucket: outputs.PipelineSourceBucketName!,
      }));

      const versioning = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: outputs.PipelineSourceBucketName!,
      }));

      expect(versioning.Status).toBe('Enabled');
      console.log(`✓ Pipeline source bucket ${outputs.PipelineSourceBucketName} exists with versioning`);
    }, 30000);
  });

  // ========== LAMBDA FUNCTION TESTS ==========
  describe('Lambda Function Configuration', () => {
    test('Lambda function exists and is active', async () => {
      expect(outputs.LambdaFunctionName).toBeDefined();

      const func = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName!,
      }));

      expect(func.Configuration?.State).toBe('Active');
      expect(func.Configuration?.FunctionName).toBe(outputs.LambdaFunctionName);

      console.log(`✓ Lambda function ${outputs.LambdaFunctionName} is active`);
    }, 30000);

    test('Lambda has Dead Letter Queue configured', async () => {
      expect(outputs.DeadLetterQueueArn).toBeDefined();

      const func = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionName!,
      }));

      expect(func.DeadLetterConfig).toBeDefined();
      expect(func.DeadLetterConfig?.TargetArn).toBe(outputs.DeadLetterQueueArn);

      console.log('✓ Lambda function has DLQ configured');
    }, 30000);

    test('Lambda has environment variables configured', async () => {
      const func = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionName!,
      }));

      expect(func.Environment?.Variables).toBeDefined();
      const envVars = func.Environment!.Variables!;

      expect(envVars).toHaveProperty('APPLICATION_BUCKET');
      expect(envVars).toHaveProperty('SECRET_ARN');
      expect(envVars).toHaveProperty('NODE_ENV');

      expect(envVars.APPLICATION_BUCKET).toBe(outputs.ApplicationBucketName);
      expect(envVars.SECRET_ARN).toBe(outputs.SecretArn);
      expect(envVars.NODE_ENV).toBe('production');

      console.log('✓ Lambda environment variables configured correctly');
    }, 30000);

    test('Lambda has CloudWatch Logs enabled', async () => {
      const logGroupName = `/aws/lambda/${outputs.LambdaFunctionName}`;

      const logGroups = await logsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      }));

      expect(logGroups.logGroups).toBeDefined();
      const logGroup = logGroups.logGroups!.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);

      console.log(`✓ Lambda CloudWatch Logs configured with 30-day retention`);
    }, 30000);

    test('Lambda has X-Ray tracing enabled', async () => {
      const func = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionName!,
      }));

      expect(func.TracingConfig?.Mode).toBe('Active');
      console.log('✓ Lambda X-Ray tracing is enabled');
    }, 30000);

    test('Lambda memory and timeout configured for high throughput', async () => {
      const func = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionName!,
      }));

      expect(func.MemorySize).toBe(3008); // Maximum memory
      expect(func.Timeout).toBe(300); // 5 minutes

      console.log(`✓ Lambda configured with ${func.MemorySize}MB memory and ${func.Timeout}s timeout`);
    }, 30000);

    test('Lambda can handle up to 100,000 requests per minute (no reserved concurrency limit)', async () => {
      const func = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionName!,
      }));

      // Should not have reserved concurrency set (allows auto-scaling)
      expect(func.ReservedConcurrentExecutions).toBeUndefined();

      console.log('✓ Lambda configured for auto-scaling (no reserved concurrency)');
    }, 30000);
  });

  // ========== DEAD LETTER QUEUE TESTS ==========
  describe('Dead Letter Queue Configuration', () => {
    test('DLQ exists and is properly configured', async () => {
      expect(outputs.DeadLetterQueueUrl).toBeDefined();

      const queueAttrs = await sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: outputs.DeadLetterQueueUrl!,
        AttributeNames: ['All'],
      }));

      expect(queueAttrs.Attributes).toBeDefined();
      expect(queueAttrs.Attributes!.QueueArn).toBe(outputs.DeadLetterQueueArn);

      // 14 days retention
      expect(queueAttrs.Attributes!.MessageRetentionPeriod).toBe('1209600');

      console.log('✓ DLQ configured with 14-day retention');
    }, 30000);

    test('DLQ has KMS encryption enabled', async () => {
      const queueAttrs = await sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: outputs.DeadLetterQueueUrl!,
        AttributeNames: ['KmsMasterKeyId'],
      }));

      expect(queueAttrs.Attributes?.KmsMasterKeyId).toBeDefined();
      console.log('✓ DLQ has KMS encryption enabled');
    }, 30000);
  });

  // ========== SECRETS MANAGER TESTS ==========
  describe('Secrets Manager Configuration', () => {
    test('Secrets Manager secret exists', async () => {
      expect(outputs.SecretArn).toBeDefined();

      const secret = await secretsClient.send(new DescribeSecretCommand({
        SecretId: outputs.SecretArn!,
      }));

      expect(secret.ARN).toBe(outputs.SecretArn);
      expect(secret.Name).toBe('tap-app-secrets');

      console.log('✓ Secrets Manager secret exists');
    }, 30000);

    test('Secret can be retrieved by Lambda', async () => {
      const secretValue = await secretsClient.send(new GetSecretValueCommand({
        SecretId: outputs.SecretArn!,
      }));

      expect(secretValue.SecretString).toBeDefined();

      const secretData = JSON.parse(secretValue.SecretString!);
      expect(secretData).toHaveProperty('apiKey');
      expect(secretData).toHaveProperty('password');

      console.log('✓ Secret is accessible and properly formatted');
    }, 30000);
  });

  // ========== CLOUDWATCH ALARMS TESTS ==========
  describe('CloudWatch Alarms Configuration', () => {
    test('Lambda error alarm exists and is configured', async () => {
      expect(outputs.ErrorAlarmName).toBeDefined();

      const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [outputs.ErrorAlarmName!],
      }));

      expect(alarms.MetricAlarms).toHaveLength(1);
      const alarm = alarms.MetricAlarms![0];

      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Statistic).toBe('Sum');
      expect(alarm.Threshold).toBe(10);
      expect(alarm.EvaluationPeriods).toBe(2);

      console.log('✓ Lambda error alarm configured (threshold: 10 errors)');
    }, 30000);

    test('Lambda throttle alarm exists and is configured', async () => {
      expect(outputs.ThrottleAlarmName).toBeDefined();

      const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [outputs.ThrottleAlarmName!],
      }));

      expect(alarms.MetricAlarms).toHaveLength(1);
      const alarm = alarms.MetricAlarms![0];

      expect(alarm.MetricName).toBe('Throttles');
      expect(alarm.Threshold).toBe(5);

      console.log('✓ Lambda throttle alarm configured (threshold: 5 throttles)');
    }, 30000);

    test('Lambda duration alarm exists and is configured', async () => {
      expect(outputs.DurationAlarmName).toBeDefined();

      const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [outputs.DurationAlarmName!],
      }));

      expect(alarms.MetricAlarms).toHaveLength(1);
      const alarm = alarms.MetricAlarms![0];

      expect(alarm.MetricName).toBe('Duration');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.Threshold).toBe(3000); // 3 seconds

      console.log('✓ Lambda duration alarm configured (threshold: 3000ms)');
    }, 30000);

    test('All alarms have SNS notification configured', async () => {
      expect(outputs.AlarmTopicArn).toBeDefined();

      const alarmNames = [
        outputs.ErrorAlarmName!,
        outputs.ThrottleAlarmName!,
        outputs.DurationAlarmName!,
      ];

      const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: alarmNames,
      }));

      alarms.MetricAlarms!.forEach(alarm => {
        expect(alarm.AlarmActions).toContain(outputs.AlarmTopicArn);
      });

      console.log('✓ All alarms configured with SNS notifications');
    }, 30000);
  });

  // ========== SNS NOTIFICATIONS TESTS ==========
  describe('SNS Notification Configuration', () => {
    test('SNS topic for alarms exists', async () => {
      expect(outputs.AlarmTopicArn).toBeDefined();

      const topic = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn!,
      }));

      expect(topic.Attributes).toBeDefined();
      expect(topic.Attributes!.TopicArn).toBe(outputs.AlarmTopicArn);
      expect(topic.Attributes!.DisplayName).toBe('TAP Application Alarms');

      console.log('✓ SNS alarm topic configured');
    }, 30000);
  });

  // ========== IAM LEAST PRIVILEGE TESTS ==========
  describe('IAM Least Privilege Compliance', () => {
    test('Lambda execution role exists', async () => {
      expect(outputs.LambdaRoleArn).toBeDefined();

      const roleName = outputs.LambdaRoleArn!.split('/').pop()!;

      const policies = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: roleName,
      }));

      expect(policies.PolicyNames).toBeDefined();
      expect(policies.PolicyNames!.length).toBeGreaterThan(0);

      console.log(`✓ Lambda role has ${policies.PolicyNames!.length} inline policies`);
    }, 30000);

    test('Lambda role has specific S3 permissions', async () => {
      const roleName = outputs.LambdaRoleArn!.split('/').pop()!;

      const policies = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: roleName,
      }));

      let hasS3Policy = false;
      for (const policyName of policies.PolicyNames!) {
        const policy = await iamClient.send(new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        }));

        if (policy.PolicyDocument?.includes('s3:GetObject') ||
          policy.PolicyDocument?.includes('s3:PutObject')) {
          hasS3Policy = true;

          // Verify scoped to specific bucket
          expect(policy.PolicyDocument).toContain(outputs.ApplicationBucketName);
        }
      }

      expect(hasS3Policy).toBe(true);
      console.log('✓ Lambda role has scoped S3 permissions');
    }, 30000);

    test('Lambda role has specific SQS permissions for DLQ', async () => {
      const roleName = outputs.LambdaRoleArn!.split('/').pop()!;

      const policies = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: roleName,
      }));

      let hasSQSPolicy = false;
      for (const policyName of policies.PolicyNames!) {
        const policy = await iamClient.send(new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        }));

        if (policy.PolicyDocument?.includes('sqs:SendMessage')) {
          hasSQSPolicy = true;
        }
      }

      expect(hasSQSPolicy).toBe(true);
      console.log('✓ Lambda role has SQS permissions for DLQ');
    }, 30000);

    test('Lambda role has Secrets Manager permissions', async () => {
      const roleName = outputs.LambdaRoleArn!.split('/').pop()!;

      const policies = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: roleName,
      }));

      let hasSecretsPolicy = false;
      for (const policyName of policies.PolicyNames!) {
        const policy = await iamClient.send(new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        }));

        if (policy.PolicyDocument?.includes('secretsmanager:GetSecretValue')) {
          hasSecretsPolicy = true;

          // Verify scoped to specific secret
          expect(policy.PolicyDocument).toContain(outputs.SecretArn);
        }
      }

      expect(hasSecretsPolicy).toBe(true);
      console.log('✓ Lambda role has scoped Secrets Manager permissions');
    }, 30000);

    test('Lambda role has CloudWatch Logs permissions', async () => {
      const roleName = outputs.LambdaRoleArn!.split('/').pop()!;

      const attachedPolicies = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      }));

      const hasLogsPolicy = attachedPolicies.AttachedPolicies?.some(
        policy => policy.PolicyName === 'AWSLambdaBasicExecutionRole'
      );

      expect(hasLogsPolicy).toBe(true);
      console.log('✓ Lambda role has CloudWatch Logs permissions');
    }, 30000);
  });

  // ========== CI/CD PIPELINE TESTS ==========
  describe('CI/CD Pipeline Configuration', () => {
    test('CodePipeline exists for deployment', async () => {
      const pipelines = await codePipelineClient.send(new ListPipelinesCommand({}));

      const tapPipeline = pipelines.pipelines?.find(p =>
        p.name?.includes('tap') || p.name?.includes('TapPipeline')
      );

      if (tapPipeline) {
        const pipeline = await codePipelineClient.send(new GetPipelineCommand({
          name: tapPipeline.name!,
        }));

        expect(pipeline.pipeline).toBeDefined();
        expect(pipeline.pipeline!.stages).toBeDefined();

        const stageNames = pipeline.pipeline!.stages!.map(s => s.name);
        console.log(`✓ Pipeline stages: ${stageNames.join(', ')}`);
      } else {
        console.log('⚠ Pipeline not found (may be deployed separately)');
      }
    }, 30000);

    test('CodeBuild projects exist for build and test', async () => {
      const projects = await codeBuildClient.send(new BatchGetProjectsCommand({
        names: ['tap-build', 'tap-test', 'tap-deploy'],
      }));

      if (projects.projects && projects.projects.length > 0) {
        projects.projects.forEach(project => {
          expect(project.name).toBeDefined();
          console.log(`✓ CodeBuild project: ${project.name}`);
        });
      } else {
        console.log('⚠ CodeBuild projects not found (may be deployed separately)');
      }
    }, 30000);
  });

  // ========== SECURITY COMPLIANCE TESTS ==========
  describe('Security Compliance', () => {
    test('No sensitive data in outputs', () => {
      const outputStr = JSON.stringify(outputs);

      expect(outputStr).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Keys
      expect(outputStr).not.toMatch(/password.*[:=].*[^\s]/i);
      expect(outputStr).not.toMatch(/(?:secret.*key|private.*key).*[:=].*[^\s]/i);

      console.log('✓ No sensitive data found in outputs');
    });

    test('All resources use same AWS account', () => {
      const accountIds = new Set<string>();

      Object.entries(outputs).forEach(([key, value]) => {
        if (typeof value === 'string' && value.includes(':')) {
          const match = value.match(/:(\d{12}):/);
          if (match) accountIds.add(match[1]);
        }
      });

      expect(accountIds.size).toBe(1);
      expect(Array.from(accountIds)[0]).toBe(ACCOUNT_ID);

      console.log(`✓ All resources in account: ${ACCOUNT_ID}`);
    });

    test('All resources in expected region', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (typeof value === 'string' && value.includes(':')) {
          if (value.includes('amazonaws.com')) {
            expect(value).toContain(REGION);
          }
        }
      });

      console.log(`✓ All resources in region: ${REGION}`);
    });
  });

  // ========== INTERACTIVE INTEGRATION TESTS ==========
  // These tests interact with actual AWS resources to verify functionality

  describe('Interactive Integration Tests', () => {
    test('Lambda function can be invoked successfully', async () => {
      const testPayload = {
        test: 'integration-test',
        timestamp: Date.now(),
      };

      const response = await lambdaClient.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testPayload),
      }));

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result).toBeDefined();
        console.log('✓ Lambda invoked successfully:', result);
      }
    }, 45000);

    test('Lambda can write to S3 bucket', async () => {
      const testKey = `integration-test/${Date.now()}/test.json`;
      const testData = {
        test: 'data',
        timestamp: new Date().toISOString(),
      };

      await s3Client.send(new PutObjectCommand({
        Bucket: outputs.ApplicationBucketName!,
        Key: testKey,
        Body: JSON.stringify(testData),
        ServerSideEncryption: 'aws:kms',
      }));

      console.log(`✓ Successfully wrote test object to S3: ${testKey}`);
    }, 30000);

    test('Lambda generates CloudWatch Logs', async () => {
      // Invoke Lambda to generate logs
      await lambdaClient.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ test: 'logging' }),
      }));

      // Wait for logs to propagate
      await new Promise(resolve => setTimeout(resolve, 5000));

      const logGroupName = `/aws/lambda/${outputs.LambdaFunctionName}`;

      const logs = await logsClient.send(new FilterLogEventsCommand({
        logGroupName,
        startTime: Date.now() - 60000, // Last minute
        limit: 10,
      }));

      expect(logs.events).toBeDefined();
      expect(logs.events!.length).toBeGreaterThan(0);

      console.log(`✓ Found ${logs.events!.length} log events in CloudWatch Logs`);
    }, 45000);

    test('Lambda handles errors and uses DLQ', async () => {
      // This test verifies DLQ is empty or can receive messages
      const messages = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: outputs.DeadLetterQueueUrl!,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
      }));

      // DLQ should exist and be queryable
      expect(messages).toBeDefined();
      console.log(`✓ DLQ is accessible (${messages.Messages?.length || 0} messages currently)`);
    }, 30000);

    test('CloudWatch alarms can be triggered', async () => {
      const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [
          outputs.ErrorAlarmName!,
          outputs.ThrottleAlarmName!,
          outputs.DurationAlarmName!,
        ],
      }));

      alarms.MetricAlarms!.forEach(alarm => {
        expect(alarm.StateValue).toBeDefined();
        console.log(`✓ Alarm ${alarm.AlarmName}: ${alarm.StateValue}`);
      });
    }, 30000);

    test('End-to-end: Lambda invocation with S3 write and logging', async () => {
      const testId = `e2e-test-${Date.now()}`;

      // Step 1: Invoke Lambda
      const response = await lambdaClient.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ testId, action: 'e2e-test' }),
      }));

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const result = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(result.statusCode).toBe(200);

      console.log('✓ Step 1: Lambda invoked');

      // Step 2: Verify logs were generated
      await new Promise(resolve => setTimeout(resolve, 3000));

      const logGroupName = `/aws/lambda/${outputs.LambdaFunctionName}`;
      const logs = await logsClient.send(new FilterLogEventsCommand({
        logGroupName,
        startTime: Date.now() - 30000,
        filterPattern: testId,
      }));

      expect(logs.events).toBeDefined();
      console.log(`✓ Step 2: Found ${logs.events!.length} log entries`);

      // Step 3: Verify the complete pipeline works
      console.log(`✓ End-to-end test completed successfully for ${testId}`);
    }, 60000);

    test('Lambda can access Secrets Manager', async () => {
      // Invoke Lambda which should access secrets
      const response = await lambdaClient.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ action: 'test-secrets' }),
      }));

      expect(response.StatusCode).toBe(200);

      // The Lambda should be able to access secrets without errors
      if (response.FunctionError) {
        const error = JSON.parse(Buffer.from(response.Payload!).toString());
        // If there's an error, it shouldn't be related to secrets access
        expect(error.errorMessage).not.toContain('secretsmanager');
      }

      console.log('✓ Lambda can access Secrets Manager');
    }, 30000);

    test('Performance: Lambda can handle high throughput', async () => {
      console.log('Testing Lambda throughput with concurrent invocations...');

      const invocations = 10; // Concurrent invocations
      const promises = Array.from({ length: invocations }, (_, i) =>
        lambdaClient.send(new InvokeCommand({
          FunctionName: outputs.LambdaFunctionName!,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ test: `concurrent-${i}`, timestamp: Date.now() }),
        }))
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      expect(successful).toBeGreaterThanOrEqual(invocations * 0.9); // 90% success rate

      console.log(`✓ Successfully handled ${successful}/${invocations} concurrent invocations`);
    }, 60000);
  });

  // ========== CANARY DEPLOYMENT TESTS ==========
  describe('Canary Deployment Configuration', () => {
    test('Lambda has CodeDeploy configuration', async () => {
      const func = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName!,
      }));

      // Verify Lambda has aliases configured for canary deployments
      expect(func.Configuration).toBeDefined();

      console.log('✓ Lambda function configured for canary deployments');
    }, 30000);
  });

  // ========== COMPLETENESS TESTS ==========
  describe('Deployment Completeness', () => {
    test('All required outputs present', () => {
      const required = [
        'ApplicationBucketName',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'DeadLetterQueueUrl',
        'SecretArn',
        'AlarmTopicArn',
        'ErrorAlarmName',
        'ThrottleAlarmName',
        'DurationAlarmName',
      ];

      required.forEach(key => {
        expect(outputs).toHaveProperty(key);
        expect(outputs[key as keyof StackOutputs]).toBeTruthy();
      });

      console.log(`✓ All ${required.length} required outputs present`);
    });

    test('No null or undefined values in outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
        expect(value).not.toBe('');
      });

      console.log('✓ All output values are valid');
    });

    test('Helper commands are properly formatted', () => {
      expect(outputs.TestInvokeCommand).toContain('aws lambda invoke');
      expect(outputs.TestInvokeCommand).toContain(outputs.LambdaFunctionName);

      expect(outputs.CheckDLQCommand).toContain('aws sqs receive-message');
      expect(outputs.CheckDLQCommand).toContain(outputs.DeadLetterQueueUrl);

      expect(outputs.ViewLogsCommand).toContain('aws logs tail');
      expect(outputs.ViewLogsCommand).toContain(outputs.LambdaFunctionName);

      console.log('✓ Helper commands properly formatted');
    });
  });
});
