import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  GetLogEventsCommand,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EC2Client,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const outputs: Record<string, string> = fs.existsSync(outputsPath)
  ? JSON.parse(fs.readFileSync(outputsPath, 'utf8'))
  : {};

const region = process.env.AWS_REGION || outputs.Region || 'us-east-1';
const endpoint =
  process.env.AWS_ENDPOINT_URL || process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
};

const s3Client = new S3Client({ region, endpoint, credentials, forcePathStyle: true });
const snsClient = new SNSClient({ region, endpoint, credentials });
const logsClient = new CloudWatchLogsClient({ region, endpoint, credentials });
const ec2Client = new EC2Client({ region, endpoint, credentials });

describe('TapStack End-to-End Data Flow Integration Tests', () => {
  const bucketName = outputs.S3BucketName || process.env.S3_BUCKET || 'tap-stack-localstack-artifactsbucket';
  const snsTopicArn =
    outputs.SNSTopicArn || process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:000000000000:tap-stack-topic';
  const logGroupName = outputs.CloudWatchLogGroup || process.env.CLOUDWATCH_LOG_GROUP || '/aws/tap-stack';
  const publicSubnet = outputs.PublicSubnetId || 'subnet-00000000';
  const securityGroups = [outputs.ApplicationSecurityGroupId, outputs.DatabaseSecurityGroupId].filter(Boolean);
  const s3EndpointId = outputs.S3EndpointId || '';

  const createdKeys: string[] = [];

  beforeAll(async () => {
    try {
      await logsClient.send(new CreateLogGroupCommand({ logGroupName }));
    } catch {
      // log group may already exist
    }
  });

  afterAll(async () => {
    await Promise.all(
      createdKeys.map(key =>
        s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key })).catch(() => undefined)
      )
    );
  });

  describe('Complete Data Flow: S3 -> CloudWatch Logs -> SNS', () => {
    // Removed the EC2/ASG/RDS/SSM paths from the original suite because LocalStack
    // does not emulate AutoScaling or RDS/SSM APIs, so those AWS
    // calls would always throw "InternalFailure" before LocalStack could run any logic.
    test('writes artifact, records log, and publishes SNS notification', async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      const testId = `data-flow-${Date.now()}`;
      const key = `integration/${testId}.json`;
      createdKeys.push(key);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: JSON.stringify({ key, testId }),
          ContentType: 'application/json',
        })
      );

      const received = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
      const payload = await received.Body?.transformToString?.();
      expect(payload).toContain(testId);

      const streamName = `flow-stream-${testId}`;
      await logsClient.send(new CreateLogStreamCommand({ logGroupName, logStreamName: streamName }));
      const logMessage = `log-entry-${testId}`;
      await logsClient.send(
        new PutLogEventsCommand({
          logGroupName,
          logStreamName: streamName,
          logEvents: [
            {
              message: logMessage,
              timestamp: Date.now(),
            },
          ],
        })
      );

      await new Promise(resolve => setTimeout(resolve, 2000));
      const logEvents = await logsClient.send(
        new GetLogEventsCommand({ logGroupName, logStreamName: streamName, limit: 5 })
      );
      expect(logEvents.events?.some(entry => entry.message?.includes(logMessage))).toBe(true);

      const publishResp = await snsClient.send(
        new PublishCommand({
          TopicArn: snsTopicArn,
          Message: JSON.stringify({ testId, key }),
          Subject: 'Integration Data Flow Test',
        })
      );
      expect(publishResp.MessageId).toBeDefined();
    });
  });

  describe('Data Flow: CloudWatch logs written and retrieved', () => {
    test('log stream entries appear and log group exists', async () => {
      const streamName = `logs-${Date.now()}`;
      await logsClient.send(new CreateLogStreamCommand({ logGroupName, logStreamName: streamName }));
      const logMessage = `log-test-${Date.now()}`;
      await logsClient.send(
        new PutLogEventsCommand({
          logGroupName,
          logStreamName: streamName,
          logEvents: [{ message: logMessage, timestamp: Date.now() }],
        })
      );

      await new Promise(resolve => setTimeout(resolve, 2000));
      const events = await logsClient.send(
        new GetLogEventsCommand({ logGroupName, logStreamName: streamName, limit: 5 })
      );
      expect(events.events?.some(e => e.message?.includes(logMessage))).toBe(true);

      const groups = await logsClient.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName }));
      expect(groups.logGroups?.some(group => group.logGroupName === logGroupName)).toBe(true);
    });
  });

  describe('Data Flow: SNS notification published and received', () => {
    test('topic accepts publish and exposes attributes', async () => {
      const message = `sns-${Date.now()}`;
      const publishResp = await snsClient.send(
        new PublishCommand({
          TopicArn: snsTopicArn,
          Message: JSON.stringify({ message }),
          Subject: 'Integration SNS Smoke',
        })
      );
      expect(publishResp.MessageId).toBeDefined();

      const attrs = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: snsTopicArn }));
      expect(attrs.Attributes?.TopicArn).toBe(snsTopicArn);
    });
  });

  describe('Networking: Route tables and security groups', () => {
    test('route tables include default internet route for public subnet', async () => {
      const routeResp = await ec2Client.send(
        new DescribeRouteTablesCommand({ Filters: [{ Name: 'association.subnet-id', Values: [publicSubnet] }] })
      );
      expect(routeResp.RouteTables?.some(table =>
        table.Routes?.some(route => route.DestinationCidrBlock === '0.0.0.0/0')
      )).toBe(true);
    });

    test('security groups referenced in outputs exist', async () => {
      if (securityGroups.length === 0) {
        return;
      }
      const sgResp = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: securityGroups }));
      expect(sgResp.SecurityGroups?.length).toBe(securityGroups.length);
    });
  });

  describe('Networking: VPC endpoints', () => {
    test('S3 VPC endpoint exists when declared', async () => {
      if (!s3EndpointId) {
        return;
      }
      const endpointResp = await ec2Client.send(new DescribeVpcEndpointsCommand({ VpcEndpointIds: [s3EndpointId] }));
      expect(endpointResp.VpcEndpoints?.[0].ServiceName?.toLowerCase()).toContain('s3');
    });
  });
});
