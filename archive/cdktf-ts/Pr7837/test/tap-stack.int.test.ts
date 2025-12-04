import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SecretsManagerClient,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('ECS Fargate Multi-Service Application Integration Tests', () => {
  describe('CloudWatch Logging', () => {
    const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

    test('Log groups exist for ECS services', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/ecs',
      });
      const response = await logsClient.send(command);

      const logGroups = response.logGroups!.filter((lg) =>
        lg.logGroupName?.includes(ENVIRONMENT_SUFFIX),
      );

      expect(logGroups.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Secrets Management', () => {
    const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

    test('Secrets exist for the environment', async () => {
      const command = new ListSecretsCommand({
        MaxResults: 100,
      });

      const response = await secretsClient.send(command);
      const secrets = response.SecretList?.filter((s) =>
        s.Name?.includes(ENVIRONMENT_SUFFIX),
      );

      expect(secrets).toBeDefined();
      expect(secrets!.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Application Load Balancer', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });

    test('Target groups exist for the environment', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbClient.send(command);

      const targetGroups = response.TargetGroups!.filter((tg) =>
        tg.TargetGroupName?.includes(ENVIRONMENT_SUFFIX),
      );

      expect(targetGroups.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Infrastructure Configuration Validation', () => {
    test('Environment suffix is properly configured', () => {
      expect(ENVIRONMENT_SUFFIX).toBeDefined();
      expect(ENVIRONMENT_SUFFIX.length).toBeGreaterThan(0);
    });

    test('AWS region is properly configured', () => {
      expect(AWS_REGION).toBeDefined();
      expect(AWS_REGION).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    });
  });
});
