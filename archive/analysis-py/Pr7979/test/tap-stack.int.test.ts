/**
 * Integration tests for Pulumi CloudWatch monitoring infrastructure
 * Validates deployed AWS resources
 */

import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

describe('CloudWatch Monitoring Infrastructure - Integration Tests', () => {
  let outputs: Record<string, any>;
  let cloudwatch: AWS.CloudWatch;
  let cloudwatchlogs: AWS.CloudWatchLogs;
  let sns: AWS.SNS;
  let lambda: AWS.Lambda;
  let s3: AWS.S3;
  let synthetics: AWS.Synthetics;
  let firehose: AWS.Firehose;

  beforeAll(() => {
    // Load stack outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. Please deploy the infrastructure first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS SDK clients
    const region = process.env.AWS_REGION || 'us-east-1';
    cloudwatch = new AWS.CloudWatch({ region });
    cloudwatchlogs = new AWS.CloudWatchLogs({ region });
    sns = new AWS.SNS({ region });
    lambda = new AWS.Lambda({ region });
    s3 = new AWS.S3({ region });
    synthetics = new AWS.Synthetics({ region });
    firehose = new AWS.Firehose({ region });
  });

  describe('Stack Outputs', () => {
    test('exports required outputs', () => {
      expect(outputs).toHaveProperty('metricsBucketName');
      expect(outputs).toHaveProperty('canaryBucketName');
      expect(outputs).toHaveProperty('paymentLogGroupName');
      expect(outputs).toHaveProperty('apiLogGroupName');
      expect(outputs).toHaveProperty('metricProcessorFunctionName');
      expect(outputs).toHaveProperty('apiCanaryName');
      expect(outputs).toHaveProperty('dashboardName');
      expect(outputs).toHaveProperty('criticalTopicArn');
      expect(outputs).toHaveProperty('warningTopicArn');
      expect(outputs).toHaveProperty('emergencyTopicArn');
      expect(outputs).toHaveProperty('metricStreamName');
    });

    test('output values are not empty', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('S3 Buckets', () => {
    test('metrics bucket exists', async () => {
      const bucketName = outputs.metricsBucketName;
      expect(bucketName).toBeTruthy();

      const response = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(response.$response.httpResponse.statusCode).toBe(200);
    });

    test('canary bucket exists', async () => {
      const bucketName = outputs.canaryBucketName;
      expect(bucketName).toBeTruthy();

      const response = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(response.$response.httpResponse.statusCode).toBe(200);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('payment log group exists with correct retention', async () => {
      const logGroupName = outputs.paymentLogGroupName;
      expect(logGroupName).toBeTruthy();

      const response = await cloudwatchlogs
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
      expect(response.logGroups![0].retentionInDays).toBe(30);
    });

    test('API log group exists with correct retention', async () => {
      const logGroupName = outputs.apiLogGroupName;
      expect(logGroupName).toBeTruthy();

      const response = await cloudwatchlogs
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
      expect(response.logGroups![0].retentionInDays).toBe(30);
    });
  });

  describe('SNS Topics', () => {
    test('critical alerts topic exists', async () => {
      const topicArn = outputs.criticalTopicArn;
      expect(topicArn).toBeTruthy();

      const response = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      expect(response.Attributes).toBeTruthy();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('warning alerts topic exists', async () => {
      const topicArn = outputs.warningTopicArn;
      expect(topicArn).toBeTruthy();

      const response = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      expect(response.Attributes).toBeTruthy();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('emergency alerts topic exists', async () => {
      const topicArn = outputs.emergencyTopicArn;
      expect(topicArn).toBeTruthy();

      const response = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      expect(response.Attributes).toBeTruthy();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('topics have email subscriptions', async () => {
      const topicArns = [
        outputs.criticalTopicArn,
        outputs.warningTopicArn,
        outputs.emergencyTopicArn,
      ];

      for (const topicArn of topicArns) {
        const response = await sns.listSubscriptionsByTopic({ TopicArn: topicArn }).promise();

        expect(response.Subscriptions).toBeTruthy();
        expect(response.Subscriptions!.length).toBeGreaterThan(0);

        const emailSubscription = response.Subscriptions!.find(sub => sub.Protocol === 'email');
        expect(emailSubscription).toBeTruthy();
      }
    });
  });

  describe('Lambda Function', () => {
    test('metric processor function exists', async () => {
      const functionName = outputs.metricProcessorFunctionName;
      expect(functionName).toBeTruthy();

      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      expect(response.Configuration).toBeTruthy();
      expect(response.Configuration!.FunctionName).toBe(functionName);
    });

    test('metric processor uses Node.js 18 runtime', async () => {
      const functionName = outputs.metricProcessorFunctionName;

      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
    });

    test('metric processor has correct environment variables', async () => {
      const functionName = outputs.metricProcessorFunctionName;

      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      expect(response.Configuration!.Environment).toBeTruthy();
      expect(response.Configuration!.Environment!.Variables).toBeTruthy();

      const env = response.Configuration!.Environment!.Variables!;
      expect(env).toHaveProperty('ENVIRONMENT_SUFFIX');
      expect(env).toHaveProperty('PAYMENT_LOG_GROUP');
      expect(env).toHaveProperty('API_LOG_GROUP');
    });

    test('metric processor has correct timeout and memory', async () => {
      const functionName = outputs.metricProcessorFunctionName;

      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      expect(response.Configuration!.Timeout).toBe(60);
      expect(response.Configuration!.MemorySize).toBe(256);
    });
  });

  describe('CloudWatch Synthetics Canary', () => {
    test('API canary exists', async () => {
      const canaryName = outputs.apiCanaryName;
      expect(canaryName).toBeTruthy();

      const response = await synthetics.getCanary({ Name: canaryName }).promise();
      expect(response.Canary).toBeTruthy();
      expect(response.Canary!.Name).toBe(canaryName);
    });

    test('canary has correct schedule', async () => {
      const canaryName = outputs.apiCanaryName;

      const response = await synthetics.getCanary({ Name: canaryName }).promise();
      expect(response.Canary!.Schedule).toBeTruthy();
      expect(response.Canary!.Schedule!.Expression).toBe('rate(2 minutes)');
    });

    test('canary uses correct runtime', async () => {
      const canaryName = outputs.apiCanaryName;

      const response = await synthetics.getCanary({ Name: canaryName }).promise();
      expect(response.Canary!.RuntimeVersion).toContain('syn-nodejs-puppeteer');
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('monitoring dashboard exists', async () => {
      const dashboardName = outputs.dashboardName;
      expect(dashboardName).toBeTruthy();

      const response = await cloudwatch
        .getDashboard({ DashboardName: dashboardName })
        .promise();
      expect(response.DashboardArn).toBeTruthy();
      expect(response.DashboardName).toBe(dashboardName);
    });

    test('dashboard has widgets', async () => {
      const dashboardName = outputs.dashboardName;

      const response = await cloudwatch
        .getDashboard({ DashboardName: dashboardName })
        .promise();
      expect(response.DashboardBody).toBeTruthy();

      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeTruthy();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('CPU alarm exists', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-r0x1n7p4';
      const alarmName = `high-cpu-usage-${environmentSuffix}`;

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeTruthy();
      expect(response.MetricAlarms!.length).toBe(1);
      expect(response.MetricAlarms![0].AlarmName).toBe(alarmName);
    });

    test('memory alarm exists', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-r0x1n7p4';
      const alarmName = `high-memory-usage-${environmentSuffix}`;

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeTruthy();
      expect(response.MetricAlarms!.length).toBe(1);
      expect(response.MetricAlarms![0].AlarmName).toBe(alarmName);
    });

    test('payment failure alarm exists', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-r0x1n7p4';
      const alarmName = `high-payment-failure-rate-${environmentSuffix}`;

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeTruthy();
      expect(response.MetricAlarms!.length).toBe(1);
      expect(response.MetricAlarms![0].AlarmName).toBe(alarmName);
    });

    test('alarms are configured with SNS actions', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-r0x1n7p4';
      const alarmName = `high-cpu-usage-${environmentSuffix}`;

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms![0].AlarmActions).toBeTruthy();
      expect(response.MetricAlarms![0].AlarmActions!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Metric Stream', () => {
    test('metric stream exists', async () => {
      const streamName = outputs.metricStreamName;
      expect(streamName).toBeTruthy();

      const response = await cloudwatch
        .listMetricStreams()
        .promise();

      const stream = response.Entries?.find(s => s.Name === streamName);
      expect(stream).toBeTruthy();
    });
  });

  describe('Kinesis Firehose', () => {
    test('metric firehose delivery stream exists', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-r0x1n7p4';
      const streamName = `metric-stream-${environmentSuffix}`;

      const response = await firehose
        .describeDeliveryStream({ DeliveryStreamName: streamName })
        .promise();

      expect(response.DeliveryStreamDescription).toBeTruthy();
      expect(response.DeliveryStreamDescription.DeliveryStreamName).toBe(streamName);
    });

    test('firehose delivers to S3', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-r0x1n7p4';
      const streamName = `metric-stream-${environmentSuffix}`;

      const response = await firehose
        .describeDeliveryStream({ DeliveryStreamName: streamName })
        .promise();

      expect(response.DeliveryStreamDescription.Destinations).toBeTruthy();
      expect(response.DeliveryStreamDescription.Destinations!.length).toBeGreaterThan(0);

      const destination = response.DeliveryStreamDescription.Destinations![0];
      expect(destination.ExtendedS3DestinationDescription).toBeTruthy();
    });
  });
});
