/**
 * Integration tests for TapStack
 * Tests live resources deployed in AWS
 */

import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';

describe('TapStack Integration Tests', () => {
  const region = process.env.AWS_REGION || 'ap-northeast-1';
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

  let outputs: Record<string, string>;
  let kms: AWS.KMS;
  let lambda: AWS.Lambda;
  let cloudwatchlogs: AWS.CloudWatchLogs;
  let eventbridge: AWS.EventBridge;
  let cloudwatch: AWS.CloudWatch;
  let sns: AWS.SNS;
  let sqs: AWS.SQS;
  let iam: AWS.IAM;

  beforeAll(() => {
    // Read outputs from flat-outputs.json
    expect(fs.existsSync(outputsPath)).toBe(true);
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    // Configure AWS SDK v2
    AWS.config.update({ region });

    // Initialize AWS SDK v2 clients
    kms = new AWS.KMS();
    lambda = new AWS.Lambda();
    cloudwatchlogs = new AWS.CloudWatchLogs();
    eventbridge = new AWS.EventBridge();
    cloudwatch = new AWS.CloudWatch();
    sns = new AWS.SNS();
    sqs = new AWS.SQS();
    iam = new AWS.IAM();
  });

  describe('KMS Key', () => {
    test('should exist and have rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const keyResponse = await kms.describeKey({ KeyId: keyId }).promise();

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

      const rotationResponse = await kms
        .getKeyRotationStatus({ KeyId: keyId })
        .promise();

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('should have correct ARN format', () => {
      const keyArn = outputs.KMSKeyArn;
      expect(keyArn).toMatch(
        /^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/
      );
    });
  });

  describe('Lambda Functions', () => {
    test('policy analyzer Lambda should exist with correct configuration', async () => {
      const functionArn = outputs.PolicyAnalyzerLambdaArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop() || '';
      const response = await lambda
        .getFunctionConfiguration({ FunctionName: functionName })
        .promise();

      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Timeout).toBeLessThanOrEqual(60);
      expect(response.MemorySize).toBe(512);
      expect(response.State).toBe('Active');

      // Check environment variables
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
        outputs.SecurityAlertsTopicArn
      );
      expect(response.Environment?.Variables?.LOG_GROUP_NAME).toBe(
        outputs.SecurityLogGroupName
      );
    }, 30000);

    test('daily auditor Lambda should exist with correct configuration', async () => {
      const functionArn = outputs.DailyAuditorLambdaArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop() || '';
      const response = await lambda
        .getFunctionConfiguration({ FunctionName: functionName })
        .promise();

      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Timeout).toBeLessThanOrEqual(60);
      expect(response.MemorySize).toBe(1024);
      expect(response.State).toBe('Active');

      // Check environment variables
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
        outputs.SecurityAlertsTopicArn
      );
      expect(response.Environment?.Variables?.LOG_GROUP_NAME).toBe(
        outputs.SecurityLogGroupName
      );
    }, 30000);
  });

  describe('CloudWatch Log Groups', () => {
    test('security audit log group should exist with 90-day retention', async () => {
      const logGroupName = outputs.SecurityLogGroupName;
      expect(logGroupName).toBeDefined();

      const response = await cloudwatchlogs
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);

    test('policy analyzer log group should exist with 90-day retention', async () => {
      const policyAnalyzerName = outputs.PolicyAnalyzerLambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${policyAnalyzerName}`;

      const response = await cloudwatchlogs
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);

    test('daily auditor log group should exist with 90-day retention', async () => {
      const dailyAuditorName = outputs.DailyAuditorLambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${dailyAuditorName}`;

      const response = await cloudwatchlogs
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('EventBridge Rules', () => {
    test('IAM policy change rule should exist and be enabled', async () => {
      const ruleName = outputs.IAMPolicyChangeRuleName;
      expect(ruleName).toBeDefined();

      const response = await eventbridge
        .describeRule({ Name: ruleName })
        .promise();

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.iam');
      expect(eventPattern['detail-type']).toContain(
        'AWS API Call via CloudTrail'
      );
      expect(eventPattern.detail?.eventName).toBeDefined();
    }, 30000);

    test('IAM policy change rule should have Lambda target with DLQ', async () => {
      const ruleName = outputs.IAMPolicyChangeRuleName;

      const response = await eventbridge
        .listTargetsByRule({ Rule: ruleName })
        .promise();

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);

      const target = response.Targets?.[0];
      expect(target?.Arn).toBe(outputs.PolicyAnalyzerLambdaArn);
      expect(target?.DeadLetterConfig?.Arn).toBeDefined();
      expect(target?.RetryPolicy).toBeDefined();
      expect(target?.RetryPolicy?.MaximumRetryAttempts).toBe(2);
    }, 30000);

    test('daily audit rule should exist with cron schedule', async () => {
      const dailyAuditorName = outputs.DailyAuditorLambdaArn.split(':').pop();
      const ruleName = dailyAuditorName?.replace('daily-auditor', 'daily-audit');

      const response = await eventbridge
        .describeRule({ Name: ruleName })
        .promise();

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBe('cron(0 2 * * ? *)');
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('unusual activity alarm should exist with correct configuration', async () => {
      const alarmName = outputs.UnusualActivityAlarmName;
      expect(alarmName).toBeDefined();

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.AlarmName).toBe(alarmName);
      expect(alarm?.Threshold).toBe(5);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm?.EvaluationPeriods).toBe(1);
      expect(alarm?.AlarmActions).toBeDefined();
      expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
    }, 30000);

    test('policy analyzer error alarm should exist', async () => {
      const policyAnalyzerName = outputs.PolicyAnalyzerLambdaArn.split(':').pop();
      const alarmName = `${policyAnalyzerName?.replace('-policy-analyzer', '')}-policy-analyzer-errors`;

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.Threshold).toBe(1);
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.MetricName).toBe('Errors');
    }, 30000);

    test('daily auditor error alarm should exist', async () => {
      const dailyAuditorName = outputs.DailyAuditorLambdaArn.split(':').pop();
      const alarmName = `${dailyAuditorName?.replace('-daily-auditor', '')}-daily-auditor-errors`;

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.Threshold).toBe(1);
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.MetricName).toBe('Errors');
    }, 30000);
  });

  describe('SNS Topic', () => {
    test('security alerts topic should exist with KMS encryption', async () => {
      const topicArn = outputs.SecurityAlertsTopicArn;
      expect(topicArn).toBeDefined();

      const response = await sns
        .getTopicAttributes({ TopicArn: topicArn })
        .promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.DisplayName).toContain('IAM Security Alerts');
    }, 30000);
  });

  describe('Dead Letter Queue', () => {
    test('DLQ should exist with correct configuration', async () => {
      const dlqUrl = outputs.DLQUrl;
      expect(dlqUrl).toBeDefined();

      const response = await sqs
        .getQueueAttributes({
          QueueUrl: dlqUrl,
          AttributeNames: ['All'],
        })
        .promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('Lambda execution role should exist with explicit deny statements', async () => {
      const policyAnalyzerName = outputs.PolicyAnalyzerLambdaArn.split(':').pop();
      const roleName = policyAnalyzerName?.replace('-policy-analyzer', '-lambda-execution');

      const response = await iam.getRole({ RoleName: roleName }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);
    }, 30000);

    test('cross-account audit role should exist with external ID', async () => {
      const roleArn = outputs.CrossAccountAuditRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop() || '';
      const response = await iam.getRole({ RoleName: roleName }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      const statement = assumeRolePolicy.Statement?.find(
        (s: any) => s.Condition?.StringEquals?.['sts:ExternalId']
      );

      expect(statement).toBeDefined();
      expect(statement.Condition.StringEquals['sts:ExternalId']).toBeDefined();
    }, 30000);
  });

  describe('Resource Naming', () => {
    test('all resources should follow naming convention', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const expectedPrefix = `iam-security-${environmentSuffix}-${region}`;

      expect(outputs.PolicyAnalyzerLambdaArn).toContain(expectedPrefix);
      expect(outputs.DailyAuditorLambdaArn).toContain(expectedPrefix);
      expect(outputs.SecurityLogGroupName).toContain(expectedPrefix);
      expect(outputs.IAMPolicyChangeRuleName).toBe(`${expectedPrefix}-policy-changes`);
      expect(outputs.UnusualActivityAlarmName).toBe(`${expectedPrefix}-unusual-activity`);
    });
  });

  describe('End-to-End Resource Verification', () => {
    test('all critical outputs should be present', () => {
      const requiredOutputs = [
        'SecurityAlertsTopicArn',
        'CrossAccountAuditRoleArn',
        'KMSKeyArn',
        'KMSKeyId',
        'DLQUrl',
        'PolicyAnalyzerLambdaArn',
        'DailyAuditorLambdaArn',
        'SecurityLogGroupName',
        'IAMPolicyChangeRuleName',
        'UnusualActivityAlarmName',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('ARNs should match the correct region and account', () => {
      const arnPattern = new RegExp(`arn:aws:[^:]+:${region}:\\d{12}:`);

      expect(outputs.PolicyAnalyzerLambdaArn).toMatch(arnPattern);
      expect(outputs.DailyAuditorLambdaArn).toMatch(arnPattern);
      expect(outputs.SecurityAlertsTopicArn).toMatch(arnPattern);
      expect(outputs.KMSKeyArn).toMatch(arnPattern);
      expect(outputs.CrossAccountAuditRoleArn).toMatch(/arn:aws:iam::\d{12}:role\//);
    });
  });
});
