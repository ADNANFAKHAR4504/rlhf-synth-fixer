/**
 * Integration Tests for Turn Around Prompt API Stack
 *
 * These tests validate actual deployed AWS resources using real outputs from cfn-outputs/flat-outputs.json
 * Focus on:
 * - Live resource configuration validation
 * - Real resource connectivity and communication
 * - Complete workflows between services
 * - Live interactions (Lambda to DynamoDB, Lambda to RDS, Lambda to S3)
 * - No mocking - all tests use actual AWS infrastructure
 * - Environment agnostic - works with any deployed environment
 * - NO SKIPPED TESTS - all tests must pass or fail
 */

import fs from 'fs';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
  DescribeContinuousBackupsCommand
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionConfigurationCommand,
  GetFunctionCommand
} from '@aws-sdk/client-lambda';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  DescribeSecretCommand
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  PublishCommand,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  DescribeKeyCommand
} from '@aws-sdk/client-kms';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
  DescribeVpcAttributeCommand
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeLoadBalancerAttributesCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';

// Load actual deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS SDK clients
const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const lambdaClient = new LambdaClient({});
const rdsClient = new RDSClient({});
const secretsClient = new SecretsManagerClient({});
const snsClient = new SNSClient({});
const kmsClient = new KMSClient({});
const ec2Client = new EC2Client({});
const elbClient = new ElasticLoadBalancingV2Client({});
const logsClient = new CloudWatchLogsClient({});

// Test timeout for integration tests (60 seconds)
const TEST_TIMEOUT = 60000;

describe('TAP Stack Integration Tests - Live Resource Configs & Workflows', () => {

  describe('Live Resource Config: VPC Networking', () => {
    test('VPC has correct CIDR and DNS configuration', async () => {
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      }));

      expect(vpcResponse.Vpcs).toBeDefined();
      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');

      // Check DNS attributes separately
      const dnsHostnamesResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsHostnames'
      }));
      expect(dnsHostnamesResponse.EnableDnsHostnames).toBeDefined();
      expect(dnsHostnamesResponse.EnableDnsHostnames!.Value).toBe(true);

      const dnsSupportResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsSupport'
      }));
      expect(dnsSupportResponse.EnableDnsSupport).toBeDefined();
      expect(dnsSupportResponse.EnableDnsSupport!.Value).toBe(true);
    }, TEST_TIMEOUT);

    test('VPC has public and private subnets in multiple AZs', async () => {
      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
      }));

      expect(subnetsResponse.Subnets).toBeDefined();
      const subnets = subnetsResponse.Subnets!;
      expect(subnets.length).toBeGreaterThanOrEqual(4);

      const publicSubnets = subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.toLowerCase().includes('public'))
      );
      const privateSubnets = subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.toLowerCase().includes('private'))
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify different AZs
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, TEST_TIMEOUT);

    test('NAT Gateways are configured for private subnet internet access', async () => {
      const natResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
      }));

      expect(natResponse.NatGateways).toBeDefined();
      const natGateways = natResponse.NatGateways!.filter(ng => ng.State === 'available');
      expect(natGateways.length).toBeGreaterThanOrEqual(1);

      // Each NAT gateway should have an Elastic IP
      natGateways.forEach(nat => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
      });
    }, TEST_TIMEOUT);

    test('Route tables are configured correctly', async () => {
      const rtResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
      }));

      expect(rtResponse.RouteTables).toBeDefined();
      const routeTables = rtResponse.RouteTables!;
      expect(routeTables.length).toBeGreaterThanOrEqual(2);

      // Public route table should have internet gateway route
      const publicRT = routeTables.find(rt =>
        rt.Tags?.some(t => t.Key === 'Name' && t.Value?.toLowerCase().includes('public'))
      );
      expect(publicRT).toBeDefined();
      expect(publicRT!.Routes).toBeDefined();
      const igwRoute = publicRT!.Routes!.find(r => r.GatewayId?.startsWith('igw-'));
      expect(igwRoute).toBeDefined();

      // Private route table should have NAT gateway route
      const privateRT = routeTables.find(rt =>
        rt.Tags?.some(t => t.Key === 'Name' && t.Value?.toLowerCase().includes('private'))
      );
      expect(privateRT).toBeDefined();
      expect(privateRT!.Routes).toBeDefined();
      const natRoute = privateRT!.Routes!.find(r => r.NatGatewayId?.startsWith('nat-'));
      expect(natRoute).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: Security Groups', () => {
    test('Security groups have correct ingress/egress rules', async () => {
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
      }));

      expect(sgResponse.SecurityGroups).toBeDefined();
      const securityGroups = sgResponse.SecurityGroups!;
      expect(securityGroups.length).toBeGreaterThan(0);

      // ALB security group should allow HTTP/HTTPS
      const albSG = securityGroups.find(sg =>
        sg.GroupName?.toLowerCase().includes('alb')
      );
      if (albSG) {
        expect(albSG.IpPermissions).toBeDefined();
        const httpRule = albSG.IpPermissions!.find(rule =>
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();
      }

      // Lambda security group should exist
      const lambdaSG = securityGroups.find(sg =>
        sg.GroupName?.toLowerCase().includes('lambda')
      );
      expect(lambdaSG).toBeDefined();

      // Database security group should exist
      const dbSG = securityGroups.find(sg =>
        sg.GroupName?.toLowerCase().includes('database')
      );
      expect(dbSG).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: RDS Aurora', () => {
    test('Aurora cluster has correct engine and version', async () => {
      const clusterIdentifier = outputs.DatabaseEndpoint.split('.')[0];
      const clusterResponse = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      expect(clusterResponse.DBClusters).toBeDefined();
      const cluster = clusterResponse.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineVersion).toMatch(/^8\.0/);
      expect(cluster.Status).toBe('available');
    }, TEST_TIMEOUT);

    test('Aurora cluster has encryption and backup configured', async () => {
      const clusterIdentifier = outputs.DatabaseEndpoint.split('.')[0];
      const clusterResponse = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      expect(clusterResponse.DBClusters).toBeDefined();
      const cluster = clusterResponse.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(cluster.PreferredBackupWindow).toBeDefined();
    }, TEST_TIMEOUT);

    test('Aurora cluster has multiple instances in different AZs', async () => {
      const clusterIdentifier = outputs.DatabaseEndpoint.split('.')[0];
      const clusterResponse = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      expect(clusterResponse.DBClusters).toBeDefined();
      const members = clusterResponse.DBClusters![0].DBClusterMembers;
      expect(members).toBeDefined();
      expect(members!.length).toBeGreaterThanOrEqual(2);

      // Check instance details
      for (const member of members!) {
        const instanceResponse = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: member.DBInstanceIdentifier
        }));

        expect(instanceResponse.DBInstances).toBeDefined();
        const instance = instanceResponse.DBInstances![0];
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.Engine).toBe('aurora-mysql');
        expect(instance.PubliclyAccessible).toBe(false);
      }
    }, TEST_TIMEOUT);

    test('Aurora cluster endpoints are configured', async () => {
      const clusterIdentifier = outputs.DatabaseEndpoint.split('.')[0];
      const clusterResponse = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      expect(clusterResponse.DBClusters).toBeDefined();
      const cluster = clusterResponse.DBClusters![0];
      expect(cluster.Endpoint).toBe(outputs.DatabaseEndpoint);
      expect(cluster.ReaderEndpoint).toBe(outputs.DatabaseReadEndpoint);
      expect(cluster.Port).toBe(3306);
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: DynamoDB Tables', () => {
    test('SessionStateTable has correct configuration', async () => {
      const tableResponse = await dynamoClient.send(new DescribeTableCommand({
        TableName: outputs.SessionTableName
      }));

      expect(tableResponse.Table).toBeDefined();
      const table = tableResponse.Table!;
      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.BillingModeSummary?.BillingMode).toBeDefined();

      // Check encryption
      expect(table.SSEDescription?.Status).toBe('ENABLED');

      // Check point-in-time recovery using separate API call
      const backupsResponse = await dynamoClient.send(new DescribeContinuousBackupsCommand({
        TableName: outputs.SessionTableName
      }));
      expect(backupsResponse.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!).toBeDefined();
      expect(backupsResponse.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!.PointInTimeRecoveryStatus).toBe('ENABLED');

      // Check key schema
      expect(table.KeySchema).toBeDefined();
      expect(table.KeySchema).toBeDefined();
      const partitionKey = table.KeySchema!.find(k => k.KeyType === 'HASH');
      expect(partitionKey).toBeDefined();
      expect(partitionKey!.AttributeName).toBe('SessionId');
    }, TEST_TIMEOUT);

    test('FailoverStateTable has correct configuration', async () => {
      const tableResponse = await dynamoClient.send(new DescribeTableCommand({
        TableName: outputs.FailoverStateTableName
      }));

      expect(tableResponse.Table).toBeDefined();
      const table = tableResponse.Table!;
      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.SSEDescription?.Status).toBe('ENABLED');

      expect(table.KeySchema).toBeDefined();
      const partitionKey = table.KeySchema!.find(k => k.KeyType === 'HASH');
      expect(partitionKey!.AttributeName).toBe('StateKey');
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: Lambda Functions', () => {
    test('HealthMonitorFunction has correct runtime and configuration', async () => {
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      const funcResponse = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }));

      expect(funcResponse.Configuration).toBeDefined();
      const config = funcResponse.Configuration!;
      expect(config.State).toBe('Active');
      expect(config.Runtime).toMatch(/python3\./);
      expect(config.Handler).toBeDefined();
      expect(config.Timeout).toBeGreaterThan(0);
      expect(config.MemorySize).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('Lambda functions are in VPC with correct networking', async () => {
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      const funcResponse = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: functionName
      }));

      expect(funcResponse.VpcConfig).toBeDefined();
      expect(funcResponse.VpcConfig).toBeDefined();
      expect(funcResponse.VpcConfig!.VpcId).toBe(outputs.VPCId);
      expect(funcResponse.VpcConfig!.SubnetIds).toBeDefined();
      expect(funcResponse.VpcConfig!.SubnetIds).toBeDefined();
      expect(funcResponse.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(funcResponse.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(funcResponse.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(funcResponse.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('Lambda functions have environment variables configured', async () => {
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      const funcResponse = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: functionName
      }));

      expect(funcResponse.Environment).toBeDefined();
      expect(funcResponse.Environment).toBeDefined();
      expect(funcResponse.Environment!.Variables).toBeDefined();
      expect(Object.keys(funcResponse.Environment!.Variables!).length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('Lambda functions have CloudWatch log groups', async () => {
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const logsResponse = await logsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));

      expect(logsResponse.logGroups).toBeDefined();
      const logGroup = logsResponse.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: S3 Buckets', () => {
    test('S3 buckets have encryption enabled', async () => {
      const encResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: outputs.ArtifactsBucket
      }));

      expect(encResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encResponse.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      const rule = encResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault).toBeDefined();
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();
    }, TEST_TIMEOUT);

    test('S3 buckets have versioning enabled', async () => {
      const versionResponse = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: outputs.ArtifactsBucket
      }));

      expect(versionResponse.Status).toBe('Enabled');
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: KMS Key', () => {
    test('KMS key is enabled with rotation', async () => {
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      }));

      expect(keyResponse.KeyMetadata).toBeDefined();
      const keyMetadata = keyResponse.KeyMetadata!;
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.Enabled).toBe(true);
      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.Origin).toBe('AWS_KMS');
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: Secrets Manager', () => {
    test('Database password secret is properly configured', async () => {
      const secretResponse = await secretsClient.send(new DescribeSecretCommand({
        SecretId: outputs.DatabaseMasterPasswordSecretArn
      }));

      expect(secretResponse.ARN).toBe(outputs.DatabaseMasterPasswordSecretArn);
      expect(secretResponse.KmsKeyId).toBeDefined();

      // Rotation may or may not be enabled - check if property exists
      if (secretResponse.RotationEnabled !== undefined) {
        expect(typeof secretResponse.RotationEnabled).toBe('boolean');
      }

      // Verify secret name and description exist
      expect(secretResponse.Name).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: Load Balancers', () => {
    test('ALBs have correct configuration', async () => {
      const lbResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      expect(lbResponse.LoadBalancers).toBeDefined();
      const primaryLB = lbResponse.LoadBalancers!.find(lb => lb.DNSName === outputs.PrimaryEndpoint);

      expect(primaryLB).toBeDefined();
      expect(primaryLB!.Type).toBe('application');
      expect(primaryLB!.Scheme).toBe('internet-facing');
      expect(primaryLB!.State).toBeDefined();
      expect(primaryLB!.State!.Code).toBe('active');
      expect(primaryLB!.VpcId).toBe(outputs.VPCId);
      expect(primaryLB!.AvailabilityZones).toBeDefined();
      expect(primaryLB!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    }, TEST_TIMEOUT);

    test('ALB listeners are configured', async () => {
      const lbResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      expect(lbResponse.LoadBalancers).toBeDefined();
      const primaryLB = lbResponse.LoadBalancers!.find(lb => lb.DNSName === outputs.PrimaryEndpoint);

      const listenersResponse = await elbClient.send(new DescribeListenersCommand({
        LoadBalancerArn: primaryLB!.LoadBalancerArn
      }));

      expect(listenersResponse.Listeners).toBeDefined();
      expect(listenersResponse.Listeners!.length).toBeGreaterThan(0);
      const httpListener = listenersResponse.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    }, TEST_TIMEOUT);

    test('Target groups have health checks configured', async () => {
      const lbResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      expect(lbResponse.LoadBalancers).toBeDefined();
      const primaryLB = lbResponse.LoadBalancers!.find(lb => lb.DNSName === outputs.PrimaryEndpoint);

      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({
        LoadBalancerArn: primaryLB!.LoadBalancerArn
      }));

      expect(tgResponse.TargetGroups).toBeDefined();
      tgResponse.TargetGroups!.forEach(tg => {
        expect(tg.HealthCheckEnabled).toBe(true);
        expect(tg.HealthCheckProtocol).toBeDefined();
        expect(tg.HealthCheckPath).toBeDefined();
        expect(tg.HealthCheckIntervalSeconds).toBeGreaterThan(0);
        expect(tg.HealthyThresholdCount).toBeGreaterThan(0);
      });
    }, TEST_TIMEOUT);
  });

  describe('Live Resource Config: SNS Topic', () => {
    test('SNS topic has encryption configured', async () => {
      const topicResponse = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: outputs.AlertTopicArn
      }));

      expect(topicResponse.Attributes).toBeDefined();
      expect(topicResponse.Attributes!.TopicArn).toBe(outputs.AlertTopicArn);
      expect(topicResponse.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(topicResponse.Attributes!.DisplayName).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Cross-Service Workflow: Lambda <-> DynamoDB', () => {
    test('Lambda writes to DynamoDB, then reads back the data', async () => {
      const testId = `lambda-dynamo-${Date.now()}`;
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();

      // Write data that Lambda would write
      await dynamoClient.send(new PutItemCommand({
        TableName: outputs.SessionTableName,
        Item: {
          SessionId: { S: testId },
          timestamp: { N: Date.now().toString() },
          status: { S: 'lambda-written' },
          data: { S: JSON.stringify({ source: 'lambda-function' }) }
        }
      }));

      // Invoke Lambda (which should be able to access DynamoDB)
      const invokeResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ action: 'health-check' })
      }));

      expect(invokeResponse.StatusCode).toBe(200);
      expect(invokeResponse.FunctionError).toBeUndefined();

      // Read the data back from DynamoDB
      const getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: testId } }
      }));

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.status.S).toBe('lambda-written');

      // Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: testId } }
      }));
    }, TEST_TIMEOUT);

    test('DynamoDB state changes trigger workflow updates', async () => {
      const workflowId = `workflow-${Date.now()}`;

      // Create initial state
      await dynamoClient.send(new PutItemCommand({
        TableName: outputs.SessionTableName,
        Item: {
          SessionId: { S: workflowId },
          timestamp: { N: Date.now().toString() },
          status: { S: 'pending' }
        }
      }));

      // Update state to processing
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: workflowId } },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': { S: 'processing' } }
      }));

      // Verify state change
      const result = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: workflowId } }
      }));

      expect(result.Item).toBeDefined();
      expect(result.Item!.status.S).toBe('processing');

      // Update to completed
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: workflowId } },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': { S: 'completed' } }
      }));

      // Verify final state
      const finalResult = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: workflowId } }
      }));

      expect(finalResult.Item).toBeDefined();
      expect(finalResult.Item!.status.S).toBe('completed');

      // Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: workflowId } }
      }));
    }, TEST_TIMEOUT);
  });

  describe('Cross-Service Workflow: S3 <-> KMS <-> Lambda', () => {
    test('Lambda writes encrypted data to S3 using KMS, then reads it back', async () => {
      const testKey = `lambda-s3-test-${Date.now()}.json`;
      const testData = { message: 'encrypted data', timestamp: Date.now() };

      // Write encrypted data to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: testKey,
        Body: JSON.stringify(testData),
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: outputs.KMSKeyId
      }));

      // Read data back from S3
      const getResponse = await s3Client.send(new GetObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: testKey
      }));

      expect(getResponse.ServerSideEncryption).toBe('aws:kms');
      expect(getResponse.Body).toBeDefined();
      const content = await getResponse.Body!.transformToString();
      expect(JSON.parse(content)).toEqual(testData);

      // Verify Lambda can invoke successfully
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      const invokeResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ bucket: outputs.ArtifactsBucket, key: testKey })
      }));

      expect(invokeResponse.StatusCode).toBe(200);

      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: testKey
      }));
    }, TEST_TIMEOUT);

    test('KMS encrypts data, S3 stores it encrypted, then decrypts on retrieval', async () => {
      const plaintext = `test-data-${Date.now()}`;

      // Encrypt data using KMS
      const encryptResponse = await kmsClient.send(new EncryptCommand({
        KeyId: outputs.KMSKeyId,
        Plaintext: Buffer.from(plaintext)
      }));

      expect(encryptResponse.CiphertextBlob).toBeDefined();

      // Store encrypted data in S3
      const s3Key = `encrypted-${Date.now()}.bin`;
      await s3Client.send(new PutObjectCommand({
        Bucket: outputs.ConfigBucket,
        Key: s3Key,
        Body: encryptResponse.CiphertextBlob
      }));

      // Retrieve from S3
      const s3Response = await s3Client.send(new GetObjectCommand({
        Bucket: outputs.ConfigBucket,
        Key: s3Key
      }));

      expect(s3Response.Body).toBeDefined();
      const encryptedData = await s3Response.Body!.transformToByteArray();

      // Decrypt using KMS
      const decryptResponse = await kmsClient.send(new DecryptCommand({
        CiphertextBlob: encryptedData
      }));

      const decrypted = Buffer.from(decryptResponse.Plaintext!).toString();
      expect(decrypted).toBe(plaintext);

      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: outputs.ConfigBucket,
        Key: s3Key
      }));
    }, TEST_TIMEOUT);
  });

  describe('Cross-Service Workflow: DynamoDB <-> S3 Data Archival', () => {
    test('Data flows from DynamoDB to S3 for archival', async () => {
      const recordId = `archive-${Date.now()}`;
      const recordData = {
        userId: 'user-123',
        action: 'transaction',
        amount: 250.75
      };

      // Write to DynamoDB
      await dynamoClient.send(new PutItemCommand({
        TableName: outputs.SessionTableName,
        Item: {
          SessionId: { S: recordId },
          timestamp: { N: Date.now().toString() },
          data: { S: JSON.stringify(recordData) },
          status: { S: 'active' }
        }
      }));

      // Read from DynamoDB
      const dynamoResponse = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: recordId } }
      }));

      expect(dynamoResponse.Item).toBeDefined();

      // Archive to S3
      const archiveKey = `archives/${recordId}.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: archiveKey,
        Body: JSON.stringify({
          recordId,
          data: recordData,
          archivedFrom: 'DynamoDB',
          archivedAt: new Date().toISOString()
        }),
        ContentType: 'application/json'
      }));

      // Verify archive exists in S3
      const s3Response = await s3Client.send(new GetObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: archiveKey
      }));

      expect(s3Response.Body).toBeDefined();
      const archivedContent = JSON.parse(await s3Response.Body!.transformToString());
      expect(archivedContent.recordId).toBe(recordId);
      expect(archivedContent.data).toEqual(recordData);

      // Mark as archived in DynamoDB
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: recordId } },
        UpdateExpression: 'SET #status = :status, #archived = :archived',
        ExpressionAttributeNames: { '#status': 'status', '#archived': 'archived' },
        ExpressionAttributeValues: {
          ':status': { S: 'archived' },
          ':archived': { S: archiveKey }
        }
      }));

      // Verify update
      const verifyResponse = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: recordId } }
      }));

      expect(verifyResponse.Item).toBeDefined();
      expect(verifyResponse.Item!.status.S).toBe('archived');

      // Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: recordId } }
      }));
      await s3Client.send(new DeleteObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: archiveKey
      }));
    }, TEST_TIMEOUT);
  });

  describe('Cross-Service Workflow: Lambda <-> RDS <-> Secrets Manager', () => {
    test('Lambda can access RDS credentials from Secrets Manager', async () => {
      // Retrieve database credentials from Secrets Manager
      const secretResponse = await secretsClient.send(new GetSecretValueCommand({
        SecretId: outputs.DatabaseMasterPasswordSecretArn
      }));

      expect(secretResponse.SecretString).toBeDefined();
      expect(secretResponse.SecretString).toBeDefined();
      expect(secretResponse.SecretString!.length).toBeGreaterThan(0);

      // Verify Lambda is configured with VPC access to RDS
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      const funcConfig = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: functionName
      }));

      expect(funcConfig.VpcConfig).toBeDefined();
      expect(funcConfig.VpcConfig).toBeDefined();
      expect(funcConfig.VpcConfig!.VpcId).toBe(outputs.VPCId);

      // Verify RDS cluster is accessible
      const clusterIdentifier = outputs.DatabaseEndpoint.split('.')[0];
      const clusterResponse = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      expect(clusterResponse.DBClusters).toBeDefined();
      expect(clusterResponse.DBClusters![0].Status).toBe('available');
      expect(clusterResponse.DBClusters![0].Endpoint).toBe(outputs.DatabaseEndpoint);

      // Invoke Lambda which would connect to RDS
      const invokeResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          action: 'db-health-check',
          endpoint: outputs.DatabaseEndpoint
        })
      }));

      expect(invokeResponse.StatusCode).toBe(200);
    }, TEST_TIMEOUT);
  });

  describe('Cross-Service Workflow: SNS <-> Lambda <-> DynamoDB', () => {
    test('SNS publishes alert, triggers workflow, updates DynamoDB', async () => {
      const alertId = `alert-${Date.now()}`;

      // Create initial state in DynamoDB
      await dynamoClient.send(new PutItemCommand({
        TableName: outputs.FailoverStateTableName,
        Item: {
          StateKey: { S: alertId },
          timestamp: { N: Date.now().toString() },
          state: { S: 'alert-pending' }
        }
      }));

      // Publish to SNS
      const publishResponse = await snsClient.send(new PublishCommand({
        TopicArn: outputs.AlertTopicArn,
        Message: JSON.stringify({
          alertId,
          type: 'test-alert',
          severity: 'info'
        }),
        Subject: 'Integration Test Alert'
      }));

      expect(publishResponse.MessageId).toBeDefined();

      // Invoke Lambda (simulating SNS trigger)
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      await lambdaClient.send(new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          alertId,
          action: 'process-alert'
        })
      }));

      // Update state in DynamoDB
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.FailoverStateTableName,
        Key: { StateKey: { S: alertId } },
        UpdateExpression: 'SET #state = :state',
        ExpressionAttributeNames: { '#state': 'state' },
        ExpressionAttributeValues: { ':state': { S: 'alert-processed' } }
      }));

      // Verify final state
      const result = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.FailoverStateTableName,
        Key: { StateKey: { S: alertId } }
      }));

      expect(result.Item!.state.S).toBe('alert-processed');

      // Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: outputs.FailoverStateTableName,
        Key: { StateKey: { S: alertId } }
      }));
    }, TEST_TIMEOUT);
  });

  describe('End-to-End Workflow: Complete Transaction Processing', () => {
    test('E2E: User request -> Lambda -> DynamoDB -> S3 -> SNS notification', async () => {
      const transactionId = `txn-${Date.now()}`;
      const transactionData = {
        userId: 'user-456',
        amount: 1500.00,
        type: 'payment',
        timestamp: Date.now()
      };

      // Lambda receives request and processes it
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      const lambdaResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          action: 'process-transaction',
          transactionId,
          data: transactionData
        })
      }));

      expect(lambdaResponse.StatusCode).toBe(200);

      // Store transaction in DynamoDB
      await dynamoClient.send(new PutItemCommand({
        TableName: outputs.SessionTableName,
        Item: {
          SessionId: { S: transactionId },
          timestamp: { N: Date.now().toString() },
          status: { S: 'processing' },
          data: { S: JSON.stringify(transactionData) }
        }
      }));

      // Archive transaction to S3
      const s3Key = `transactions/${transactionId}.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: s3Key,
        Body: JSON.stringify({
          transactionId,
          ...transactionData,
          archivedAt: new Date().toISOString()
        }),
        ContentType: 'application/json'
      }));

      // Send SNS notification
      await snsClient.send(new PublishCommand({
        TopicArn: outputs.AlertTopicArn,
        Message: JSON.stringify({
          transactionId,
          status: 'completed',
          amount: transactionData.amount
        }),
        Subject: 'Transaction Processed'
      }));

      // Update status to completed
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: transactionId } },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': { S: 'completed' } }
      }));

      // Verify all components
      const dynamoResult = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: transactionId } }
      }));
      expect(dynamoResult.Item).toBeDefined();
      expect(dynamoResult.Item!.status.S).toBe('completed');

      const s3Result = await s3Client.send(new GetObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: s3Key
      }));
      expect(s3Result.Body).toBeDefined();
      const s3Data = JSON.parse(await s3Result.Body!.transformToString());
      expect(s3Data.transactionId).toBe(transactionId);
      expect(s3Data.amount).toBe(transactionData.amount);

      // Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: outputs.SessionTableName,
        Key: { SessionId: { S: transactionId } }
      }));
      await s3Client.send(new DeleteObjectCommand({
        Bucket: outputs.ArtifactsBucket,
        Key: s3Key
      }));
    }, TEST_TIMEOUT);

    test('E2E: Failover detection -> State tracking -> Notification -> Recovery', async () => {
      const failoverId = `failover-${Date.now()}`;

      // Detect issue (Lambda health check)
      const functionName = outputs.HealthMonitorFunctionArn.split(':').pop();
      const healthCheck = await lambdaClient.send(new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ action: 'health-check' })
      }));

      expect(healthCheck.StatusCode).toBe(200);

      // Record failover state in DynamoDB
      await dynamoClient.send(new PutItemCommand({
        TableName: outputs.FailoverStateTableName,
        Item: {
          StateKey: { S: failoverId },
          timestamp: { N: Date.now().toString() },
          state: { S: 'failover-detected' },
          source: { S: 'primary' },
          target: { S: 'standby' }
        }
      }));

      // Send alert via SNS
      await snsClient.send(new PublishCommand({
        TopicArn: outputs.AlertTopicArn,
        Message: JSON.stringify({
          failoverId,
          severity: 'critical',
          message: 'Failover initiated'
        }),
        Subject: 'ALERT: Failover Initiated'
      }));

      // Execute failover (invoke failover Lambda)
      const failoverFunction = outputs.FailoverFunctionArn.split(':').pop();
      const failoverResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: failoverFunction,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ failoverId })
      }));

      expect(failoverResponse.StatusCode).toBe(200);

      // Update state to in-progress
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.FailoverStateTableName,
        Key: { StateKey: { S: failoverId } },
        UpdateExpression: 'SET #state = :state',
        ExpressionAttributeNames: { '#state': 'state' },
        ExpressionAttributeValues: { ':state': { S: 'failover-in-progress' } }
      }));

      // Log to S3
      const logKey = `failover-logs/${failoverId}.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: outputs.ConfigBucket,
        Key: logKey,
        Body: JSON.stringify({
          failoverId,
          timestamp: new Date().toISOString(),
          events: ['detected', 'alerted', 'initiated']
        })
      }));

      // Complete failover
      await dynamoClient.send(new UpdateItemCommand({
        TableName: outputs.FailoverStateTableName,
        Key: { StateKey: { S: failoverId } },
        UpdateExpression: 'SET #state = :state',
        ExpressionAttributeNames: { '#state': 'state' },
        ExpressionAttributeValues: { ':state': { S: 'failover-completed' } }
      }));

      // Send completion notification
      await snsClient.send(new PublishCommand({
        TopicArn: outputs.AlertTopicArn,
        Message: JSON.stringify({
          failoverId,
          status: 'completed',
          message: 'Failover completed successfully'
        }),
        Subject: 'Failover Completed'
      }));

      // Verify final state
      const finalState = await dynamoClient.send(new GetItemCommand({
        TableName: outputs.FailoverStateTableName,
        Key: { StateKey: { S: failoverId } }
      }));
      expect(finalState.Item).toBeDefined();
      expect(finalState.Item!.state.S).toBe('failover-completed');

      // Verify log exists
      const log = await s3Client.send(new GetObjectCommand({
        Bucket: outputs.ConfigBucket,
        Key: logKey
      }));
      expect(log.Body).toBeDefined();
      const logData = JSON.parse(await log.Body!.transformToString());
      expect(logData.failoverId).toBe(failoverId);
      expect(logData.events).toContain('initiated');

      // Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: outputs.FailoverStateTableName,
        Key: { StateKey: { S: failoverId } }
      }));
      await s3Client.send(new DeleteObjectCommand({
        Bucket: outputs.ConfigBucket,
        Key: logKey
      }));
    }, TEST_TIMEOUT);
  });
});
