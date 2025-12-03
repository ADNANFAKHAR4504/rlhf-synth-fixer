import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';

describe('Trading Analytics Platform Integration Tests', () => {
  const region = 'us-east-1';
  let outputs: any;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Run deployment first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('VPC and Networking', () => {
    const ec2Client = new EC2Client({ region });

    test('VPC exists and is available', async () => {
      const vpcId = outputs['vpc-id'];
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has at least 3 public and 3 private subnets', async () => {
      const vpcId = outputs['vpc-id'];

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      const publicSubnets = response.Subnets!.filter((subnet: any) =>
        subnet.Tags?.some((tag: any) => tag.Key === 'Name' && tag.Value?.includes('public'))
      );
      const privateSubnets = response.Subnets!.filter((subnet: any) =>
        subnet.Tags?.some((tag: any) => tag.Key === 'Name' && tag.Value?.includes('private'))
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('Security groups exist for Lambda and database', async () => {
      const vpcId = outputs['vpc-id'];

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Environment',
            Values: ['dev'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const sgNames = response.SecurityGroups!.map(
        (sg: any) => sg.Tags?.find((tag: any) => tag.Key === 'Name')?.Value || ''
      );

      const hasLambdaSG = sgNames.some((name: string) => name.includes('lambda'));
      const hasDatabaseSG = sgNames.some((name: string) => name.includes('database'));

      expect(hasLambdaSG).toBe(true);
      expect(hasDatabaseSG).toBe(true);
    });
  });

  describe('Aurora Database', () => {
    const rdsClient = new RDSClient({ region });

    test('Aurora cluster exists and is available', async () => {
      const dbEndpoint = outputs['database-endpoint'];
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toContain('trading-aurora-dev');

      const clusterIdentifier = dbEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineMode).toBe('provisioned');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(1);
    });

    test('Aurora cluster has serverless v2 scaling configuration', async () => {
      const dbEndpoint = outputs['database-endpoint'];
      const clusterIdentifier = dbEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration!.MinCapacity).toBe(0.5);
      expect(cluster.ServerlessV2ScalingConfiguration!.MaxCapacity).toBe(2);
    });
  });

  describe('DynamoDB Tables', () => {
    const dynamoClient = new DynamoDBClient({ region });

    test('Sessions table exists with correct configuration', async () => {
      const tableName = outputs['sessions-table'];
      expect(tableName).toBeDefined();
      expect(tableName).toContain('trading-sessions-dev');

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table!;

      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.SSEDescription?.Status).toBe('ENABLED');

      // Note: TTL configuration may take time to propagate in AWS
      // We verify it exists in the IaC code via unit tests
    });

    test('API keys table exists with correct configuration', async () => {
      const tableName = outputs['api-keys-table'];
      expect(tableName).toBeDefined();
      expect(tableName).toContain('trading-api-keys-dev');

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table!;

      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.SSEDescription?.Status).toBe('ENABLED');
    });
  });

  describe('S3 Buckets', () => {
    const s3Client = new S3Client({ region });

    test('Raw data bucket exists and is accessible', async () => {
      const bucketName = outputs['raw-data-bucket'];
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('trading-raw-data-dev');

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Processed data bucket has encryption enabled', async () => {
      const bucketName = outputs['processed-data-bucket'];
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
    });

    test('Archive bucket has versioning enabled', async () => {
      const bucketName = outputs['archive-bucket'];
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('API Gateway', () => {
    const apiClient = new APIGatewayClient({ region });

    test('REST API exists and is reachable', async () => {
      const apiUrl = outputs['api-gateway-url'];
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain('amazonaws.com');

      const apiId = apiUrl.split('//')[1].split('.')[0];

      const command = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiClient.send(command);
      expect(response.name).toContain('trading-api-dev');
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API stage is configured with X-Ray tracing', async () => {
      const apiUrl = outputs['api-gateway-url'];
      const apiId = apiUrl.split('//')[1].split('.')[0];
      const stageName = 'dev';

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: stageName,
      });

      const response = await apiClient.send(command);
      expect(response.tracingEnabled).toBe(true);
      expect(response.stageName).toBe(stageName);
    });
  });

  describe('Resource Tagging', () => {
    test('All outputs contain environment suffix', () => {
      const environmentSuffix = 'dev';

      Object.entries(outputs).forEach(([key, value]: [string, any]) => {
        if (typeof value === 'string' && !key.includes('url') && !key.includes('endpoint') && !key.includes('vpc-id')) {
          expect(value).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Deployment Outputs Completeness', () => {
    test('All required outputs are present', () => {
      const requiredOutputs = [
        'vpc-id',
        'database-endpoint',
        'api-gateway-url',
        'raw-data-bucket',
        'processed-data-bucket',
        'archive-bucket',
        'sessions-table',
        'api-keys-table',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });
});
