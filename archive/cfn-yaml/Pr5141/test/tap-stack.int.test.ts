import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { KinesisClient, PutRecordCommand, DescribeStreamCommand } from '@aws-sdk/client-kinesis';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
} from '@aws-sdk/client-elasticache';
import { ECSClient, DescribeClustersCommand } from '@aws-sdk/client-ecs';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'eu-west-2';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synth5883207982v2';

// Read outputs from flat-outputs.json
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.error('Failed to read outputs file:', error);
}

describe('IoT Sensor Platform - Integration Tests', () => {
  const stackName = `TapStack${ENVIRONMENT_SUFFIX}`;

  // AWS Clients
  const cfnClient = new CloudFormationClient({ region: AWS_REGION });
  const kinesisClient = new KinesisClient({ region: AWS_REGION });
  const rdsClient = new RDSClient({ region: AWS_REGION });
  const elasticacheClient = new ElastiCacheClient({ region: AWS_REGION });
  const ecsClient = new ECSClient({ region: AWS_REGION });
  const apiGatewayClient = new APIGatewayClient({ region: AWS_REGION });
  const kmsClient = new KMSClient({ region: AWS_REGION });
  const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
  const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
  const ec2Client = new EC2Client({ region: AWS_REGION });

  describe('CloudFormation Stack', () => {
    test('stack should exist and be in CREATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBe(1);
      expect(response.Stacks?.[0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('stack should have all expected outputs', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const stack = response.Stacks?.[0];
      expect(stack?.Outputs).toBeDefined();
      expect(stack?.Outputs?.length).toBeGreaterThan(15);

      const outputKeys = stack?.Outputs?.map(o => o.OutputKey) || [];
      expect(outputKeys).toContain('VPCId');
      expect(outputKeys).toContain('RDSEndpoint');
      expect(outputKeys).toContain('RedisEndpoint');
      expect(outputKeys).toContain('KinesisStreamName');
      expect(outputKeys).toContain('APIGatewayURL');
      expect(outputKeys).toContain('ECSClusterName');
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].State).toBe('available');
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('subnets should exist in multiple availability zones', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(4);

      // Check multiple AZs
      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('Secrets Manager', () => {
    test('database secret should exist and be encrypted with KMS', async () => {
      const secretArn = outputs.DBSecretArn;
      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsClient.send(command);

      expect(response.Name).toBeDefined();
      expect(response.KmsKeyId).toBeDefined();
      expect(response.Name).toContain(ENVIRONMENT_SUFFIX);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should be available and multi-AZ', async () => {
      const dbIdentifier = `iot-platform-db-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);

      const db = response.DBInstances?.[0];
      expect(db?.DBInstanceStatus).toBe('available');
      expect(db?.MultiAZ).toBe(true);
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.PubliclyAccessible).toBe(false);
      expect(db?.Engine).toBe('postgres');
    }, 30000);

    test('RDS endpoint should match stack output', async () => {
      const expectedEndpoint = outputs.RDSEndpoint;
      expect(expectedEndpoint).toBeDefined();

      const dbIdentifier = `iot-platform-db-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances?.[0];
      expect(db?.Endpoint?.Address).toBe(expectedEndpoint);
      expect(db?.Endpoint?.Port).toBe(parseInt(outputs.RDSPort));
    });
  });

  describe('ElastiCache Redis', () => {
    test('Redis cluster should be available with multi-AZ', async () => {
      const replicationGroupId = `iot-redis-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });
      const response = await elasticacheClient.send(command);

      expect(response.ReplicationGroups).toBeDefined();
      expect(response.ReplicationGroups?.length).toBe(1);

      const redis = response.ReplicationGroups?.[0];
      expect(redis?.Status).toBe('available');
      expect(redis?.MultiAZ).toBe('enabled');
      expect(redis?.AtRestEncryptionEnabled).toBe(true);
      expect(redis?.TransitEncryptionEnabled).toBe(true);
      expect(redis?.AutomaticFailover).toBe('enabled');
    }, 30000);

    test('Redis endpoint should match stack output', async () => {
      const expectedEndpoint = outputs.RedisEndpoint;
      expect(expectedEndpoint).toBeDefined();

      const replicationGroupId = `iot-redis-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });
      const response = await elasticacheClient.send(command);

      const redis = response.ReplicationGroups?.[0];
      const primaryEndpoint = redis?.NodeGroups?.[0]?.PrimaryEndpoint?.Address;
      expect(primaryEndpoint).toBe(expectedEndpoint);
    });
  });

  describe('Kinesis Data Stream', () => {
    test('Kinesis stream should be active with encryption', async () => {
      const streamName = outputs.KinesisStreamName;
      expect(streamName).toBeDefined();

      const command = new DescribeStreamCommand({ StreamName: streamName });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription?.StreamStatus).toBe('ACTIVE');
      expect(response.StreamDescription?.EncryptionType).toBe('KMS');
      expect(response.StreamDescription?.KeyId).toBeDefined();
      expect(response.StreamDescription?.RetentionPeriodHours).toBe(168);
    });

    test('should be able to put records to Kinesis stream', async () => {
      const streamName = outputs.KinesisStreamName;
      const testData = JSON.stringify({
        sensorId: 'test-sensor-001',
        temperature: 25.5,
        timestamp: new Date().toISOString(),
      });

      const command = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(testData),
        PartitionKey: 'test-sensor-001',
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
      expect(response.ShardId).toBeDefined();
    }, 30000);
  });

  describe('ECS Cluster', () => {
    test('ECS cluster should be active', async () => {
      const clusterName = outputs.ECSClusterName;
      expect(clusterName).toBeDefined();

      const command = new DescribeClustersCommand({
        clusters: [clusterName],
        include: ['SETTINGS'],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);

      const cluster = response.clusters?.[0];
      expect(cluster?.status).toBe('ACTIVE');
      expect(cluster?.clusterName).toBe(clusterName);

      // Check Container Insights
      const settings = cluster?.settings;
      const containerInsights = settings?.find(s => s.name === 'containerInsights');
      expect(containerInsights?.value).toBe('enabled');
    });
  });

  describe('API Gateway', () => {
    test('API Gateway should be deployed and accessible', async () => {
      const apiId = outputs.APIGatewayId;
      expect(apiId).toBeDefined();

      const command = new GetRestApiCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(apiId);
      expect(response.name).toContain('iot-platform-api');
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API Gateway prod stage should be deployed', async () => {
      const apiId = outputs.APIGatewayId;

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod',
      });
      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe('prod');
      expect(response.tracingEnabled).toBe(true);
      expect(response.deploymentId).toBeDefined();
    });

    test('API Gateway URL should be accessible', async () => {
      const apiUrl = outputs.APIGatewayURL;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('https://');
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain(AWS_REGION);
      expect(apiUrl).toContain('/prod');
    });
  });

  describe('CloudWatch Logs', () => {
    test('ECS log group should exist', async () => {
      const logGroupName = outputs.ECSLogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.kmsKeyId).toBeDefined();
    });

    test('Audit log group should exist with 90-day retention', async () => {
      const logGroupName = outputs.AuditLogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toBeDefined();
    });
  });

  describe('End-to-End Data Flow', () => {
    test('complete data pipeline should be operational', async () => {
      // 1. Verify Kinesis can receive data
      const streamName = outputs.KinesisStreamName;
      const sensorData = {
        sensorId: `test-${Date.now()}`,
        temperature: 22.5,
        humidity: 65,
        pressure: 1013,
        timestamp: new Date().toISOString(),
      };

      const putCommand = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(JSON.stringify(sensorData)),
        PartitionKey: sensorData.sensorId,
      });

      const putResponse = await kinesisClient.send(putCommand);
      expect(putResponse.SequenceNumber).toBeDefined();

      // 2. Verify stream is healthy
      const describeCommand = new DescribeStreamCommand({ StreamName: streamName });
      const describeResponse = await kinesisClient.send(describeCommand);
      expect(describeResponse.StreamDescription?.StreamStatus).toBe('ACTIVE');

      // 3. Verify ECS cluster is ready to process
      const ecsCommand = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
      });
      const ecsResponse = await ecsClient.send(ecsCommand);
      expect(ecsResponse.clusters?.[0].status).toBe('ACTIVE');

      // 4. Verify database is ready for storage
      const dbIdentifier = `iot-platform-db-${ENVIRONMENT_SUFFIX}`;
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances?.[0].DBInstanceStatus).toBe('available');

      // 5. Verify cache is ready
      const redisCommand = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `iot-redis-${ENVIRONMENT_SUFFIX}`,
      });
      const redisResponse = await elasticacheClient.send(redisCommand);
      expect(redisResponse.ReplicationGroups?.[0].Status).toBe('available');
    }, 30000);
  });

  describe('Security Validation', () => {
    test('all resources should use proper encryption', async () => {
      // KMS Key
      const kmsCommand = new DescribeKeyCommand({ KeyId: outputs.KMSKeyId });
      const kmsResponse = await kmsClient.send(kmsCommand);
      expect(kmsResponse.KeyMetadata?.Enabled).toBe(true);

      // RDS
      const dbIdentifier = `iot-platform-db-${ENVIRONMENT_SUFFIX}`;
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances?.[0].StorageEncrypted).toBe(true);

      // Redis
      const redisCommand = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `iot-redis-${ENVIRONMENT_SUFFIX}`,
      });
      const redisResponse = await elasticacheClient.send(redisCommand);
      expect(redisResponse.ReplicationGroups?.[0].AtRestEncryptionEnabled).toBe(true);
      expect(redisResponse.ReplicationGroups?.[0].TransitEncryptionEnabled).toBe(true);

      // Kinesis
      const kinesisCommand = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName,
      });
      const kinesisResponse = await kinesisClient.send(kinesisCommand);
      expect(kinesisResponse.StreamDescription?.EncryptionType).toBe('KMS');
    });

    test('database should not be publicly accessible', async () => {
      const dbIdentifier = `iot-platform-db-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances?.[0].PubliclyAccessible).toBe(false);
    });
  });

  describe('High Availability', () => {
    test('RDS should have multi-AZ enabled', async () => {
      const dbIdentifier = `iot-platform-db-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances?.[0].MultiAZ).toBe(true);
    });

    test('Redis should have automatic failover enabled', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `iot-redis-${ENVIRONMENT_SUFFIX}`,
      });
      const response = await elasticacheClient.send(command);

      expect(response.ReplicationGroups?.[0].AutomaticFailover).toBe('enabled');
      expect(response.ReplicationGroups?.[0].MultiAZ).toBe('enabled');
    });

    test('subnets should span multiple availability zones', async () => {
      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });
  });
});
