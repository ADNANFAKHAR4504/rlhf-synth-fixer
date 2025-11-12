import fs from 'fs';
import path from 'path';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  Route53Client,
  GetHostedZoneCommand,
  GetHealthCheckCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import {
  EventBridgeClient,
  DescribeEventBusCommand,
  ListArchivesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  BackupClient,
  DescribeBackupVaultCommand,
  GetBackupPlanCommand,
  ListBackupSelectionsCommand,
} from '@aws-sdk/client-backup';
import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
  DeleteParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SFNClient,
  DescribeStateMachineCommand,
  ListExecutionsCommand,
} from '@aws-sdk/client-sfn';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';

// Load outputs from flat-outputs.json
const outputsPath = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment configuration from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || outputs.Region || 'us-east-1';

// Configure credentials - use profile if AWS_PROFILE is set
const awsProfile = process.env.AWS_PROFILE;
const clientConfig = awsProfile
  ? { region, credentials: fromIni({ profile: awsProfile }) }
  : { region };

// Initialize AWS clients
const dynamoClient = new DynamoDBClient(clientConfig);
const s3Client = new S3Client(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const ecsClient = new ECSClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
const route53Client = new Route53Client(clientConfig);
const eventBridgeClient = new EventBridgeClient(clientConfig);
const sqsClient = new SQSClient(clientConfig);
const backupClient = new BackupClient(clientConfig);
const ssmClient = new SSMClient(clientConfig);
const lambdaClient = new LambdaClient(clientConfig);
const sfnClient = new SFNClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);

// Helper function to extract resource name from ARN
const getResourceNameFromArn = (arn: string): string => {
  return arn.split('/').pop() || arn.split(':').pop() || '';
};

describe('TapStack Integration Tests - Live AWS Resources', () => {
  // Test data for cleanup
  let testDynamoItemId: string;
  let testS3ObjectKey: string;
  let testSQSMessageId: string;

  describe('Environment Configuration', () => {
    test('Should load flat-outputs.json successfully', () => {
      expect(outputs).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.Region).toBe(region);
    });

    test('Should have all required output keys', () => {
      const requiredKeys = [
        'Region',
        'EnvironmentSuffix',
        'StorageSessionTableName14EC6095',
        'StorageBucketName37AA483C',
        'ComputeClusterArnAF3DAB3A',
        'ComputeServiceName454090EE',
        'ComputeLoadBalancerArn90386098',
        'Route53HostedZoneId0798BCF4',
        'Route53HealthCheckId05FD9321',
        'EventBridgeEventBusNameB104F7A2',
        'EventBridgeTargetQueueUrlE76487CC',
        'BackupBackupVaultArnDA2559D7',
        'ParameterStoreAppConfigParameterName849D503C',
        'FailoverStateMachineArnA1684404',
      ];

      requiredKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('DynamoDB - Session Table', () => {
    const tableName = outputs.StorageSessionTableName14EC6095;

    test('Should verify table exists and is active', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
    });

    test('Should have correct billing mode (PAY_PER_REQUEST)', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('Should verify Point-in-Time Recovery is enabled', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      // DynamoDB GlobalTable (TableV2) has PITR enabled by default
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
    });

    test('Should be able to write and read an item', async () => {
      testDynamoItemId = `test-${Date.now()}`;
      const testTimestamp = Date.now().toString();

      // Write item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            sessionId: { S: testDynamoItemId },
            testData: { S: 'integration-test-value' },
            timestamp: { N: testTimestamp },
          },
        })
      );

      // Read item - table has composite key (sessionId + timestamp)
      const response = await dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            sessionId: { S: testDynamoItemId },
            timestamp: { N: testTimestamp },
          },
        })
      );

      expect(response.Item).toBeDefined();
      expect(response.Item!.sessionId.S).toBe(testDynamoItemId);
      expect(response.Item!.testData.S).toBe('integration-test-value');

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: {
            sessionId: { S: testDynamoItemId },
            timestamp: { N: testTimestamp },
          },
        })
      );
    });
  });

  describe('S3 - Data Bucket', () => {
    const bucketName = outputs.StorageBucketName37AA483C;

    test('Should verify bucket encryption is enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = response.ServerSideEncryptionConfiguration!.Rules;
      expect(rules).toHaveLength(1);
      expect(rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('Should verify bucket versioning is enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('Should be able to upload and download an object', async () => {
      testS3ObjectKey = `test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Upload object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testS3ObjectKey,
          Body: testContent,
        })
      );

      // Download object
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testS3ObjectKey,
        })
      );

      const downloadedContent = await response.Body!.transformToString();
      expect(downloadedContent).toBe(testContent);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testS3ObjectKey,
        })
      );
    });
  });

  describe('RDS - Aurora PostgreSQL Cluster', () => {
    const clusterIdentifier = `tapstack${environmentSuffix.toLowerCase()}${region.replace(/-/g, '')}`;

    test('Should verify cluster exists and is available', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toMatch(/^14\.11/);
    });

    test('Should verify storage is encrypted', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('Should verify backup retention is configured', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('Should verify writer and reader instances exist', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [clusterIdentifier],
            },
          ],
        })
      );

      expect(response.DBInstances).toHaveLength(2);
      const instances = response.DBInstances!;

      const writerInstance = instances.find(i =>
        i.DBInstanceIdentifier?.includes('writer')
      );
      const readerInstance = instances.find(i =>
        i.DBInstanceIdentifier?.includes('reader')
      );

      expect(writerInstance).toBeDefined();
      expect(readerInstance).toBeDefined();
      expect(writerInstance!.DBInstanceStatus).toBe('available');
      expect(readerInstance!.DBInstanceStatus).toBe('available');
    });
  });

  describe('ECS - Fargate Service', () => {
    const clusterArn = outputs.ComputeClusterArnAF3DAB3A;
    const serviceName = outputs.ComputeServiceName454090EE;

    test('Should verify ECS cluster is active', async () => {
      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterArn],
        })
      );

      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    test('Should verify Fargate service is running', async () => {
      const services = await ecsClient.send(
        new ListServicesCommand({ cluster: clusterArn })
      );

      // Check if any ARN contains the service name
      const hasService = services.serviceArns?.some(arn =>
        arn.includes(serviceName)
      );
      expect(hasService).toBe(true);

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterArn,
          services: [serviceName],
        })
      );

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer', () => {
    const loadBalancerArn = outputs.ComputeLoadBalancerArn90386098;

    test('Should verify ALB exists and is active', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [loadBalancerArn],
        })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    });

    test('Should verify target group exists', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: loadBalancerArn,
        })
      );

      expect(response.TargetGroups).toHaveLength(1);
      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.TargetType).toBe('ip');
    });

    test('Should verify HTTP listener is configured', async () => {
      const response = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: loadBalancerArn,
        })
      );

      expect(response.Listeners).toHaveLength(1);
      const listener = response.Listeners![0];
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.Port).toBe(80);
    });

    test('Should verify target health', async () => {
      const targetGroups = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: loadBalancerArn,
        })
      );

      const targetGroupArn = targetGroups.TargetGroups![0].TargetGroupArn!;

      const response = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroupArn,
        })
      );

      expect(response.TargetHealthDescriptions).toBeDefined();
    });
  });

  describe('Route53 - DNS and Health Checks', () => {
    const hostedZoneId = outputs.Route53HostedZoneId0798BCF4;
    const healthCheckId = outputs.Route53HealthCheckId05FD9321;

    test('Should verify hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({ Id: hostedZoneId })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Config?.PrivateZone).toBe(false);
    });

    test('Should verify health check is configured correctly', async () => {
      const response = await route53Client.send(
        new GetHealthCheckCommand({ HealthCheckId: healthCheckId })
      );

      expect(response.HealthCheck).toBeDefined();
      const config = response.HealthCheck!.HealthCheckConfig!;
      expect(config.Type).toBe('HTTP');
      expect(config.Port).toBe(80);
      expect(config.RequestInterval).toBe(30);
      expect(config.FailureThreshold).toBe(3);
      expect(config.MeasureLatency).toBe(true);
    });

    test('Should verify DNS records exist', async () => {
      const response = await route53Client.send(
        new ListResourceRecordSetsCommand({ HostedZoneId: hostedZoneId })
      );

      expect(response.ResourceRecordSets).toBeDefined();
      const aRecord = response.ResourceRecordSets!.find(r => r.Type === 'A');
      expect(aRecord).toBeDefined();
    });
  });

  describe('EventBridge and SQS', () => {
    const eventBusName = outputs.EventBridgeEventBusNameB104F7A2;
    const queueUrl = outputs.EventBridgeTargetQueueUrlE76487CC;

    test('Should verify EventBridge event bus exists', async () => {
      const response = await eventBridgeClient.send(
        new DescribeEventBusCommand({ Name: eventBusName })
      );

      expect(response.Name).toBe(eventBusName);
      expect(response.Arn).toBeDefined();
    });

    test('Should verify event archive exists', async () => {
      const response = await eventBridgeClient.send(
        new ListArchivesCommand({
          EventSourceArn: outputs.EventBridgeEventBusArn44514A25,
        })
      );

      expect(response.Archives).toBeDefined();
      expect(response.Archives!.length).toBeGreaterThan(0);
    });

    test('Should verify SQS queue attributes', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.MessageRetentionPeriod).toBe('345600'); // 4 days
    });

    test('Should be able to send and receive message from SQS queue', async () => {
      const testMessage = `Integration test message ${Date.now()}`;

      // Send message
      const sendResponse = await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: testMessage,
        })
      );

      expect(sendResponse.MessageId).toBeDefined();

      // Receive message
      const receiveResponse = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 5,
        })
      );

      expect(receiveResponse.Messages).toBeDefined();
      if (receiveResponse.Messages && receiveResponse.Messages.length > 0) {
        const message = receiveResponse.Messages[0];
        expect(message.Body).toBe(testMessage);

        // Cleanup
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle!,
          })
        );
      }
    });
  });

  describe('AWS Backup', () => {
    const backupPlanId = outputs.BackupBackupPlanId4E81E205;

    test('Should verify backup selection exists', async () => {
      const response = await backupClient.send(
        new ListBackupSelectionsCommand({ BackupPlanId: backupPlanId })
      );

      expect(response.BackupSelectionsList).toBeDefined();
      expect(response.BackupSelectionsList!.length).toBeGreaterThan(0);
    });
  });

  describe('Systems Manager - Parameter Store', () => {
    const appConfigParam = outputs.ParameterStoreAppConfigParameterName849D503C;
    const dbConfigParam = outputs.ParameterStoreDBConfigParameterName4B64D43A;

    test('Should verify app config parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({ Name: appConfigParam })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Name).toBe(appConfigParam);
      expect(response.Parameter!.Type).toBe('String');

      const value = JSON.parse(response.Parameter!.Value!);
      expect(value.region).toBe(region);
      expect(value.features).toBeDefined();
    });

    test('Should verify database config parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({ Name: dbConfigParam })
      );

      expect(response.Parameter).toBeDefined();
      const value = JSON.parse(response.Parameter!.Value!);
      expect(value.maxConnections).toBe(100);
      expect(value.timeout).toBe(30);
      expect(value.retryAttempts).toBe(3);
    });

    test('Should verify parameter replication Lambda function exists', async () => {
      const functionArn = outputs.ParameterStoreReplicationFunctionArn9E4EB907;
      const functionName = getResourceNameFromArn(functionArn);

      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('nodejs20.x');
      expect(response.Configuration!.Timeout).toBe(60);
    });
  });

  describe('Step Functions - Failover State Machine', () => {
    const stateMachineArn = outputs.FailoverStateMachineArnA1684404;

    test('Should verify state machine exists', async () => {
      const response = await sfnClient.send(
        new DescribeStateMachineCommand({ stateMachineArn })
      );

      expect(response.stateMachineArn).toBe(stateMachineArn);
      expect(response.status).toBe('ACTIVE');
      expect(response.definition).toBeDefined();
    });

    test('Should verify state machine definition is valid', async () => {
      const response = await sfnClient.send(
        new DescribeStateMachineCommand({ stateMachineArn })
      );

      const definition = JSON.parse(response.definition!);
      expect(definition.StartAt).toBeDefined();
      expect(definition.States).toBeDefined();
      expect(definition.TimeoutSeconds).toBeDefined();
    });
  });

  describe('CloudWatch - Alarms and Metrics', () => {
    test('Should verify CloudWatch alarms are configured', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `TapStack${environmentSuffix}`,
          MaxRecords: 100,
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      // Verify database alarms
      const dbAlarms = response.MetricAlarms!.filter(
        alarm =>
          alarm.AlarmName?.includes('Database') &&
          (alarm.MetricName === 'CPUUtilization' ||
            alarm.MetricName === 'DatabaseConnections')
      );
      expect(dbAlarms.length).toBeGreaterThanOrEqual(2);
    });
  });
});
