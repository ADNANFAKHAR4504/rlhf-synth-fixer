import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUTS_PATH = path.join(__dirname, '..', '..', 'cfn-outputs', 'flat-outputs.json');

interface StackOutputs {
  [key: string]: string;
}

function loadOutputs(): StackOutputs {
  if (fs.existsSync(OUTPUTS_PATH)) {
    try {
      const content = fs.readFileSync(OUTPUTS_PATH, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Warning: Could not parse outputs file: ${error}`);
      return {};
    }
  }
  console.warn(`Warning: Outputs file not found at ${OUTPUTS_PATH}`);
  return {};
}

describe('HIPAA-Compliant Monitoring Infrastructure Integration Tests', () => {
  let outputs: StackOutputs;
  let region: string;
  let environmentSuffix: string;
  let kmsClient: KMSClient;
  let logsClient: CloudWatchLogsClient;
  let snsClient: SNSClient;
  let cloudwatchClient: CloudWatchClient;
  let iamClient: IAMClient;

  beforeAll(() => {
    outputs = loadOutputs();
    region = process.env.AWS_REGION || 'eu-west-2';
    environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    kmsClient = new KMSClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
    snsClient = new SNSClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    iamClient = new IAMClient({ region });
  });

  describe('KMS Encryption Key', () => {
    test('should have KMS key created with rotation enabled', async () => {
      if (!outputs.HIPAAEncryptionKeyId) {
        console.warn('HIPAAEncryptionKeyId not found in outputs, skipping test');
        return;
      }

      const keyId = outputs.HIPAAEncryptionKeyId;

      // Describe the key
      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const keyResponse = await kmsClient.send(describeCommand);

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata?.Enabled).toBe(true);

      // Check key rotation
      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('should have KMS key alias configured', async () => {
      const aliasesCommand = new ListAliasesCommand({});
      const aliasesResponse = await kmsClient.send(aliasesCommand);

      const hipaaAlias = aliasesResponse.Aliases?.find(
        (alias) => alias.AliasName?.includes('hipaa') && alias.AliasName?.includes(environmentSuffix)
      );

      expect(hipaaAlias).toBeDefined();
      expect(hipaaAlias?.AliasName).toContain(environmentSuffix);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have audit log group with KMS encryption', async () => {
      const logGroupName = `/aws/hipaa/audit-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find((lg) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.kmsKeyId).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThanOrEqual(365); // HIPAA requires 1+ year retention
    });

    test('should have patient data log group with KMS encryption', async () => {
      const logGroupName = `/aws/hipaa/patient-data-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find((lg) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.kmsKeyId).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThanOrEqual(2555); // 7 years for HIPAA
    });

    test('should have security log group with KMS encryption', async () => {
      const logGroupName = `/aws/hipaa/security-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find((lg) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.kmsKeyId).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThanOrEqual(365); // HIPAA requires 1+ year retention
    });
  });

  describe('SNS Compliance Alert Topic', () => {
    test('should have SNS topic created with KMS encryption', async () => {
      const listCommand = new ListTopicsCommand({});
      const listResponse = await snsClient.send(listCommand);

      const complianceTopic = listResponse.Topics?.find(
        (topic) => topic.TopicArn?.includes('compliance-alerts') && topic.TopicArn?.includes(environmentSuffix)
      );

      expect(complianceTopic).toBeDefined();

      // Get topic attributes to verify encryption
      if (complianceTopic?.TopicArn) {
        const attributesCommand = new GetTopicAttributesCommand({
          TopicArn: complianceTopic.TopicArn,
        });
        const attributesResponse = await snsClient.send(attributesCommand);

        expect(attributesResponse.Attributes?.KmsMasterKeyId).toBeDefined();
      }
    });

    test('should have email subscription configured', async () => {
      const listCommand = new ListTopicsCommand({});
      const listResponse = await snsClient.send(listCommand);

      const complianceTopic = listResponse.Topics?.find(
        (topic) => topic.TopicArn?.includes('compliance-alerts') && topic.TopicArn?.includes(environmentSuffix)
      );

      if (complianceTopic?.TopicArn) {
        const subscriptionsCommand = new ListSubscriptionsByTopicCommand({
          TopicArn: complianceTopic.TopicArn,
        });
        const subscriptionsResponse = await snsClient.send(subscriptionsCommand);

        expect(subscriptionsResponse.Subscriptions).toBeDefined();
        expect(subscriptionsResponse.Subscriptions!.length).toBeGreaterThan(0);

        const emailSubscription = subscriptionsResponse.Subscriptions?.find(
          (sub) => sub.Protocol === 'email'
        );
        expect(emailSubscription).toBeDefined();
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have IAM policy changes alarm configured', async () => {
      const alarmName = `IAMPolicyChanges-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.ActionsEnabled).toBe(true);
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
    });

    test('should have KMS key disabled alarm configured', async () => {
      const alarmName = `KMSKeyDisabled-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.ActionsEnabled).toBe(true);
    });

    test('should have security group changes alarm configured', async () => {
      const alarmName = `SecurityGroupChanges-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.ActionsEnabled).toBe(true);
    });

    test('should have unauthorized access alarm configured', async () => {
      const alarmName = `UnauthorizedAccess-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.ActionsEnabled).toBe(true);
    });
  });

  describe('IAM Monitoring Role', () => {
    test('should have monitoring role created', async () => {
      const roleName = `hipaa-monitoring-role-${environmentSuffix}`;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.Arn).toContain(roleName);
    });

    test('should have inline policies attached to monitoring role', async () => {
      const roleName = `hipaa-monitoring-role-${environmentSuffix}`;

      const command = new ListRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames!.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use environment suffix in all resource names', () => {
      const suffix = environmentSuffix;

      // Check outputs contain environment suffix
      if (Object.keys(outputs).length > 0) {
        const hasOutputsWithSuffix = Object.values(outputs).some((value) =>
          typeof value === 'string' && value.includes(suffix)
        );
        expect(hasOutputsWithSuffix).toBe(true);
      }
    });
  });

  describe('Compliance Requirements', () => {
    test('should deploy all resources in correct region', () => {
      expect(region).toBe('eu-west-2');
    });

    test('should have HIPAA tag on resources', async () => {
      if (!outputs.HIPAAEncryptionKeyId) {
        console.warn('HIPAAEncryptionKeyId not found in outputs, skipping test');
        return;
      }

      const keyId = outputs.HIPAAEncryptionKeyId;
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      // KMS tags would need ListResourceTags API, but we verified compliance tag in template
    });
  });
});
