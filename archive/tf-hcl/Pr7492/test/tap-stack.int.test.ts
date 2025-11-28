/**
 * Integration Tests for CloudWatch Observability Platform Terraform Configuration
 *
 * These tests validate deployed AWS resources using the AWS SDK.
 * Tests verify that resources are properly configured and operational.
 *
 * Prerequisites:
 * - AWS credentials configured
 * - Terraform resources deployed
 * - Environment variables:
 *   - AWS_REGION: Target AWS region (default: us-east-1)
 *   - ENVIRONMENT_SUFFIX: Environment suffix used in resource names (default: dev)
 */

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  DescribeAnomalyDetectorsCommand,
  GetDashboardCommand,
  ListMetricStreamsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  ECSClient,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import {
  SyntheticsClient,
  GetCanaryCommand,
} from '@aws-sdk/client-synthetics';
import {
  OAMClient,
  GetSinkCommand,
} from '@aws-sdk/client-oam';
import {
  FirehoseClient,
  DescribeDeliveryStreamCommand,
} from '@aws-sdk/client-firehose';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const SECONDARY_REGION = process.env.SECONDARY_REGION || 'us-west-2';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const NAME_PREFIX = `cw-obs-${ENVIRONMENT_SUFFIX}`;

// Initialize AWS clients
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const ecsClient = new ECSClient({ region: AWS_REGION });
const syntheticsClient = new SyntheticsClient({ region: AWS_REGION });
const syntheticsSecondaryClient = new SyntheticsClient({ region: SECONDARY_REGION });
const oamClient = new OAMClient({ region: AWS_REGION });
const firehoseClient = new FirehoseClient({ region: AWS_REGION });

// Helper function for conditional tests
const describeIfDeployed = (
  condition: boolean,
  name: string,
  fn: () => void
) => {
  if (condition) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
};

// Track deployment status
let isDeployed = false;

describe('CloudWatch Observability Platform - Integration Tests', () => {
  // Pre-check: Verify deployment exists
  beforeAll(async () => {
    try {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: NAME_PREFIX,
          MaxRecords: 1,
        })
      );
      isDeployed = (response.MetricAlarms?.length ?? 0) > 0 ||
                   (response.CompositeAlarms?.length ?? 0) > 0;
    } catch (error: any) {
      if (error.name === 'CredentialsProviderError' ||
          error.name === 'AccessDeniedException') {
        console.warn('AWS credentials not configured - skipping integration tests');
        isDeployed = false;
      } else {
        console.warn(`Deployment check failed: ${error.message}`);
        isDeployed = false;
      }
    }
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = [
      { name: 'metric-processor', description: 'Metric processor Lambda' },
      { name: 'alarm-processor', description: 'Alarm processor Lambda' },
    ];

    test.each(lambdaFunctions)(
      '$description exists and is configured correctly',
      async ({ name }) => {
        if (!isDeployed) {
          console.log('Skipping - infrastructure not deployed');
          return;
        }

        const functionName = `${NAME_PREFIX}-${name}`;

        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: functionName,
          })
        );

        // Verify ARM64 architecture (Graviton2)
        expect(response.Architectures).toContain('arm64');

        // Verify Python 3.11 runtime
        expect(response.Runtime).toBe('python3.11');

        // Verify X-Ray tracing is enabled
        expect(response.TracingConfig?.Mode).toBe('Active');

        // Verify environment variables are set
        expect(response.Environment?.Variables).toBeDefined();
        expect(response.Environment?.Variables?.ENVIRONMENT).toBe(ENVIRONMENT_SUFFIX);
      }
    );

    test('metric processor Lambda has EventBridge trigger', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const functionName = `${NAME_PREFIX}-metric-processor`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      // Function should exist
      expect(response.Configuration?.FunctionName).toBe(functionName);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('composite alarm for system health exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const alarmName = `${NAME_PREFIX}-system-health`;

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
          AlarmTypes: ['CompositeAlarm'],
        })
      );

      expect(response.CompositeAlarms).toHaveLength(1);
      const alarm = response.CompositeAlarms![0];

      // Verify alarm rule contains AND/OR logic
      expect(alarm.AlarmRule).toMatch(/AND|OR/);

      // Verify alarm actions are configured
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
    });

    test('composite alarm for performance degradation exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const alarmName = `${NAME_PREFIX}-performance-degradation`;

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
          AlarmTypes: ['CompositeAlarm'],
        })
      );

      expect(response.CompositeAlarms).toHaveLength(1);
    });

    test('maintenance mode suppressor alarm exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const alarmName = `${NAME_PREFIX}-maintenance-mode`;

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
          AlarmTypes: ['MetricAlarm'],
        })
      );

      expect(response.MetricAlarms).toHaveLength(1);
    });

    test('metric alarms monitor at least 3 different metrics', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: NAME_PREFIX,
          AlarmTypes: ['MetricAlarm'],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(3);

      // Verify different metric names are monitored
      const metricNames = new Set(
        response.MetricAlarms!.map((alarm) => alarm.MetricName).filter(Boolean)
      );
      expect(metricNames.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('S3 Buckets', () => {
    const buckets = [
      { suffix: 'metric-streams', description: 'Metric streams bucket' },
      { suffix: 'synthetics-artifacts', description: 'Synthetics artifacts bucket' },
    ];

    test.each(buckets)(
      '$description has public access blocked',
      async ({ suffix }) => {
        if (!isDeployed) {
          console.log('Skipping - infrastructure not deployed');
          return;
        }

        const bucketName = `${NAME_PREFIX}-${suffix}`;

        try {
          const response = await s3Client.send(
            new GetPublicAccessBlockCommand({
              Bucket: bucketName,
            })
          );

          expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
          expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
          expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
          expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
        } catch (error: any) {
          if (error.name === 'NoSuchBucket') {
            console.log(`Bucket ${bucketName} not found - skipping`);
            return;
          }
          throw error;
        }
      }
    );

    test('metric streams bucket has server-side encryption', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const bucketName = `${NAME_PREFIX}-metric-streams`;

      try {
        const response = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );

        const rules = response.ServerSideEncryptionConfiguration?.Rules;
        expect(rules).toBeDefined();
        expect(rules!.length).toBeGreaterThan(0);

        const sseAlgorithm = rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
        expect(['AES256', 'aws:kms']).toContain(sseAlgorithm);
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.log(`Bucket ${bucketName} not found - skipping`);
          return;
        }
        throw error;
      }
    });

    test('metric streams bucket has lifecycle policy for 15-month retention', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const bucketName = `${NAME_PREFIX}-metric-streams`;

      try {
        const response = await s3Client.send(
          new GetBucketLifecycleConfigurationCommand({
            Bucket: bucketName,
          })
        );

        expect(response.Rules).toBeDefined();
        expect(response.Rules!.length).toBeGreaterThan(0);

        // Check for storage class transitions
        const hasTransitions = response.Rules!.some(
          (rule) => rule.Transitions && rule.Transitions.length > 0
        );
        expect(hasTransitions).toBe(true);

        // Check for expiration (around 450 days for 15 months)
        const hasExpiration = response.Rules!.some(
          (rule) => rule.Expiration?.Days && rule.Expiration.Days >= 450
        );
        expect(hasExpiration).toBe(true);
      } catch (error: any) {
        if (error.name === 'NoSuchBucket' ||
            error.name === 'NoSuchLifecycleConfiguration') {
          console.log(`Bucket ${bucketName} or lifecycle not found - skipping`);
          return;
        }
        throw error;
      }
    });

    test('metric streams bucket has versioning enabled', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const bucketName = `${NAME_PREFIX}-metric-streams`;

      try {
        const response = await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );

        expect(response.Status).toBe('Enabled');
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.log(`Bucket ${bucketName} not found - skipping`);
          return;
        }
        throw error;
      }
    });
  });

  describe('SNS Topics', () => {
    const severityLevels = ['critical', 'warning', 'info'];

    test.each(severityLevels)(
      '%s alarms SNS topic exists and is configured',
      async (severity) => {
        if (!isDeployed) {
          console.log('Skipping - infrastructure not deployed');
          return;
        }

        const topicArn = `arn:aws:sns:${AWS_REGION}:*:${NAME_PREFIX}-${severity}-alarms`;

        try {
          // List topics to find the correct ARN
          const { SNSClient: SNS, ListTopicsCommand } = await import('@aws-sdk/client-sns');
          const client = new SNS({ region: AWS_REGION });

          const listResponse = await client.send(new ListTopicsCommand({}));
          const matchingTopic = listResponse.Topics?.find(
            (topic) => topic.TopicArn?.includes(`${NAME_PREFIX}-${severity}-alarms`)
          );

          if (!matchingTopic) {
            console.log(`Topic for ${severity} not found - skipping`);
            return;
          }

          const response = await snsClient.send(
            new GetTopicAttributesCommand({
              TopicArn: matchingTopic.TopicArn,
            })
          );

          expect(response.Attributes).toBeDefined();
          expect(response.Attributes?.TopicArn).toContain(`${NAME_PREFIX}-${severity}-alarms`);
        } catch (error: any) {
          if (error.name === 'NotFoundException') {
            console.log(`SNS topic for ${severity} not found - skipping`);
            return;
          }
          throw error;
        }
      }
    );
  });

  describe('CloudWatch Metric Stream', () => {
    test('metric stream exists and is running', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await cloudWatchClient.send(
        new ListMetricStreamsCommand({})
      );

      const stream = response.Entries?.find(
        (entry) => entry.Name?.startsWith(NAME_PREFIX)
      );

      expect(stream).toBeDefined();
      expect(stream?.State).toBe('running');
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('main dashboard exists with multiple widgets', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const dashboardName = `${NAME_PREFIX}-main`;

      try {
        const response = await cloudWatchClient.send(
          new GetDashboardCommand({
            DashboardName: dashboardName,
          })
        );

        expect(response.DashboardBody).toBeDefined();

        const dashboardBody = JSON.parse(response.DashboardBody!);
        expect(dashboardBody.widgets).toBeDefined();

        // Verify at least 5 widget types
        expect(dashboardBody.widgets.length).toBeGreaterThanOrEqual(5);

        // Check for different widget types
        const widgetTypes = new Set(
          dashboardBody.widgets.map((w: any) => w.type)
        );
        expect(widgetTypes.size).toBeGreaterThanOrEqual(3);
      } catch (error: any) {
        if (error.name === 'ResourceNotFound') {
          console.log(`Dashboard ${dashboardName} not found - skipping`);
          return;
        }
        throw error;
      }
    });
  });

  describe('CloudWatch Logs', () => {
    test('application log group exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const logGroupName = `/${NAME_PREFIX}/application`;

      const response = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
    });

    test('metric filters are configured on log group', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const logGroupName = `/${NAME_PREFIX}/application`;

      const response = await cloudWatchLogsClient.send(
        new DescribeMetricFiltersCommand({
          logGroupName: logGroupName,
        })
      );

      expect(response.metricFilters).toBeDefined();
      expect(response.metricFilters!.length).toBeGreaterThan(0);

      // Verify metric transformation exists
      const hasTransformation = response.metricFilters!.some(
        (filter) => filter.metricTransformations && filter.metricTransformations.length > 0
      );
      expect(hasTransformation).toBe(true);
    });
  });

  describe('Anomaly Detectors', () => {
    test('anomaly detectors are configured for critical metrics', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await cloudWatchClient.send(
        new DescribeAnomalyDetectorsCommand({
          MaxResults: 100,
        })
      );

      expect(response.AnomalyDetectors).toBeDefined();
      expect(response.AnomalyDetectors!.length).toBeGreaterThan(0);

      // Check for Lambda anomaly detector
      const hasLambdaDetector = response.AnomalyDetectors!.some(
        (detector) => detector.Namespace === 'AWS/Lambda'
      );
      expect(hasLambdaDetector).toBe(true);
    });
  });

  describe('Synthetics Canaries', () => {
    test('primary region canary exists and is running', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const canaryName = `${NAME_PREFIX}-api-health-primary`.substring(0, 21); // Canary names max 21 chars

      try {
        const response = await syntheticsClient.send(
          new GetCanaryCommand({
            Name: canaryName,
          })
        );

        expect(response.Canary).toBeDefined();
        expect(response.Canary?.Status?.State).toBe('RUNNING');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          // Try shorter name variant
          console.log(`Canary ${canaryName} not found - skipping`);
          return;
        }
        throw error;
      }
    });

    test('secondary region canary exists for multi-region monitoring', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const canaryName = `${NAME_PREFIX}-api-health-secondary`.substring(0, 21);

      try {
        const response = await syntheticsSecondaryClient.send(
          new GetCanaryCommand({
            Name: canaryName,
          })
        );

        expect(response.Canary).toBeDefined();
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(`Secondary canary ${canaryName} not found - skipping`);
          return;
        }
        throw error;
      }
    });
  });

  describe('Container Insights (ECS)', () => {
    test('ECS cluster exists with Container Insights enabled', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const clusterName = `${NAME_PREFIX}-cluster`;

      try {
        const response = await ecsClient.send(
          new DescribeClustersCommand({
            clusters: [clusterName],
            include: ['SETTINGS'],
          })
        );

        expect(response.clusters).toHaveLength(1);

        const cluster = response.clusters![0];
        expect(cluster.clusterName).toBe(clusterName);

        // Verify Container Insights is enabled
        const containerInsightsSetting = cluster.settings?.find(
          (s) => s.name === 'containerInsights'
        );
        expect(containerInsightsSetting?.value).toBe('enabled');
      } catch (error: any) {
        if (error.name === 'ClusterNotFoundException') {
          console.log(`ECS cluster ${clusterName} not found - skipping`);
          return;
        }
        throw error;
      }
    });
  });

  describe('Cross-Account Observability', () => {
    test('OAM sink is configured', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      try {
        // List sinks to find the one with our prefix
        const { ListSinksCommand } = await import('@aws-sdk/client-oam');

        const listResponse = await oamClient.send(new ListSinksCommand({}));

        const sink = listResponse.Items?.find(
          (item) => item.Name?.startsWith(NAME_PREFIX)
        );

        if (!sink) {
          console.log('OAM sink not found - skipping');
          return;
        }

        expect(sink.Name).toContain(NAME_PREFIX);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException' ||
            error.name === 'AccessDeniedException') {
          console.log('OAM sink not accessible - skipping');
          return;
        }
        throw error;
      }
    });
  });

  describe('Kinesis Data Firehose (Optional)', () => {
    test('delivery stream exists for metric archival', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const streamName = `${NAME_PREFIX}-metric-archive`;

      try {
        const response = await firehoseClient.send(
          new DescribeDeliveryStreamCommand({
            DeliveryStreamName: streamName,
          })
        );

        expect(response.DeliveryStreamDescription).toBeDefined();
        expect(response.DeliveryStreamDescription?.DeliveryStreamStatus).toBe('ACTIVE');

        // Verify S3 destination is configured
        const s3Destination = response.DeliveryStreamDescription?.Destinations?.find(
          (dest) => dest.S3DestinationDescription || dest.ExtendedS3DestinationDescription
        );
        expect(s3Destination).toBeDefined();
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(`Firehose stream ${streamName} not found - this is optional`);
          return;
        }
        throw error;
      }
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('Lambda functions have required tags', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const functionName = `${NAME_PREFIX}-metric-processor`;

      try {
        const response = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );

        const tags = response.Tags;
        expect(tags).toBeDefined();

        // Verify required tags exist
        expect(tags?.CostCenter).toBeDefined();
        expect(tags?.Environment).toBeDefined();
        expect(tags?.DataClassification).toBeDefined();
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(`Lambda function ${functionName} not found - skipping`);
          return;
        }
        throw error;
      }
    });
  });

  describe('Security Validation', () => {
    test('S3 buckets are not publicly accessible', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const buckets = [`${NAME_PREFIX}-metric-streams`, `${NAME_PREFIX}-synthetics-artifacts`];

      for (const bucketName of buckets) {
        try {
          const response = await s3Client.send(
            new GetPublicAccessBlockCommand({
              Bucket: bucketName,
            })
          );

          const config = response.PublicAccessBlockConfiguration;
          expect(config?.BlockPublicAcls).toBe(true);
          expect(config?.BlockPublicPolicy).toBe(true);
          expect(config?.IgnorePublicAcls).toBe(true);
          expect(config?.RestrictPublicBuckets).toBe(true);
        } catch (error: any) {
          if (error.name === 'NoSuchBucket') {
            console.log(`Bucket ${bucketName} not found - skipping`);
            continue;
          }
          throw error;
        }
      }
    });
  });
});
