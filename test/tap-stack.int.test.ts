import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcPeeringConnectionsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper to load outputs
function loadOutputs(): Record<string, string> {
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Outputs file not found at ${outputsPath}. Run deployment first.`
    );
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

describe('Multi-Region Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  describe('VPC Infrastructure', () => {
    test('Primary VPC exists with correct CIDR', async () => {
      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const vpcId = outputs.PrimaryVpcId || outputs['PrimaryRegion-dev.PrimaryVpcId'];

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('Secondary VPC exists with correct CIDR', async () => {
      const ec2Client = new EC2Client({ region: 'us-east-2' });
      const vpcId = outputs.SecondaryVpcId || outputs['SecondaryRegion-dev.SecondaryVpcId'];

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
    });

    test('VPC Peering connection is active', async () => {
      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const peeringConnectionId =
        outputs.PeeringConnectionId || outputs['VpcPeering-dev.PeeringConnectionId'];

      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [peeringConnectionId],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcPeeringConnections).toBeDefined();
      expect(response.VpcPeeringConnections!.length).toBe(1);
      expect(response.VpcPeeringConnections![0].Status?.Code).toBe('active');
    });
  });

  describe('RDS Databases', () => {
    test('Primary RDS instance is available and encrypted', async () => {
      const rdsClient = new RDSClient({ region: 'us-east-1' });
      const dbEndpoint =
        outputs.PrimaryDatabaseEndpoint ||
        outputs['PrimaryRegion-dev.PrimaryDatabaseEndpoint'];
      const dbIdentifier = dbEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
    });

    test('Secondary RDS instance is available and encrypted', async () => {
      const rdsClient = new RDSClient({ region: 'us-east-2' });
      const dbEndpoint =
        outputs.SecondaryDatabaseEndpoint ||
        outputs['SecondaryRegion-dev.SecondaryDatabaseEndpoint'];
      const dbIdentifier = dbEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.StorageEncrypted).toBe(true);
    });
  });

  describe('S3 Buckets and Replication', () => {
    test('Primary S3 bucket has versioning enabled', async () => {
      const s3Client = new S3Client({ region: 'us-east-1' });
      const bucketName =
        outputs.PrimaryBucketName || outputs['PrimaryRegion-dev.PrimaryBucketName'];

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('Secondary S3 bucket has versioning enabled', async () => {
      const s3Client = new S3Client({ region: 'us-east-2' });
      const bucketName =
        outputs.SecondaryBucketName || outputs['SecondaryRegion-dev.SecondaryBucketName'];

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('Primary S3 bucket has replication configured', async () => {
      const s3Client = new S3Client({ region: 'us-east-1' });
      const bucketName =
        outputs.PrimaryBucketName || outputs['PrimaryRegion-dev.PrimaryBucketName'];

      const command = new GetBucketReplicationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Global Tables', () => {
    test('DynamoDB table is replicated across regions', async () => {
      const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
      const tableName =
        outputs.DynamoDBTableName || outputs['PrimaryRegion-dev.DynamoDBTableName'];

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.Replicas).toBeDefined();
      expect(response.Table!.Replicas!.length).toBeGreaterThanOrEqual(2);

      const regions = response.Table!.Replicas!.map((r) => r.RegionName);
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('us-east-2');
    });

    test('DynamoDB table has streaming enabled', async () => {
      const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
      const tableName =
        outputs.DynamoDBTableName || outputs['PrimaryRegion-dev.DynamoDBTableName'];

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table!.StreamSpecification).toBeDefined();
      expect(response.Table!.StreamSpecification!.StreamEnabled).toBe(true);
      expect(response.Table!.StreamSpecification!.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });
  });

  describe('Lambda Functions', () => {
    test('Primary Lambda function exists and uses correct runtime', async () => {
      const lambdaClient = new LambdaClient({ region: 'us-east-1' });
      const functionName = `payment-processor-${environmentSuffix}`;

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
      expect(response.Configuration!.Timeout).toBe(30);
      expect(response.Configuration!.MemorySize).toBe(512);
    });

    test('Secondary Lambda function exists', async () => {
      const lambdaClient = new LambdaClient({ region: 'us-east-2' });
      const functionName = `payment-processor-${environmentSuffix}`;

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
    });

    test('Primary Lambda function can be invoked successfully', async () => {
      const lambdaClient = new LambdaClient({ region: 'us-east-1' });
      const functionName = `payment-processor-${environmentSuffix}`;

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(
          JSON.stringify({ test: 'payment-event', amount: 100 })
        ),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        expect(JSON.parse(payload.body).message).toBe(
          'Payment processed successfully'
        );
      }
    });
  });

  describe('Application Load Balancers', () => {
    test('Primary ALB is active and internet-facing', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
      const albDns =
        outputs.PrimaryALBDnsName || outputs['PrimaryRegion-dev.PrimaryALBDnsName'];

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find((lb) => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.Type).toBe('application');
    });

    test('Secondary ALB is active', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-2' });
      const albDns =
        outputs.SecondaryALBDnsName || outputs['SecondaryRegion-dev.SecondaryALBDnsName'];

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find((lb) => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
    });
  });

  describe('Cross-Region Connectivity', () => {
    test('Resources have consistent naming with environmentSuffix', () => {
      const keys = Object.keys(outputs);

      // Check that resource names include environment suffix concept
      const buckets = keys.filter((k) => k.includes('Bucket'));
      expect(buckets.length).toBeGreaterThan(0);

      buckets.forEach((bucket) => {
        const bucketName = outputs[bucket];
        // Bucket names should follow naming pattern
        expect(bucketName).toContain('fintech');
      });
    });

    test('Both regions have required outputs', () => {
      // Check primary region outputs
      expect(
        outputs.PrimaryVpcId || outputs['PrimaryRegion-dev.PrimaryVpcId']
      ).toBeDefined();
      expect(
        outputs.PrimaryBucketName || outputs['PrimaryRegion-dev.PrimaryBucketName']
      ).toBeDefined();
      expect(
        outputs.PrimaryDatabaseEndpoint ||
          outputs['PrimaryRegion-dev.PrimaryDatabaseEndpoint']
      ).toBeDefined();

      // Check secondary region outputs
      expect(
        outputs.SecondaryVpcId || outputs['SecondaryRegion-dev.SecondaryVpcId']
      ).toBeDefined();
      expect(
        outputs.SecondaryBucketName || outputs['SecondaryRegion-dev.SecondaryBucketName']
      ).toBeDefined();
      expect(
        outputs.SecondaryDatabaseEndpoint ||
          outputs['SecondaryRegion-dev.SecondaryDatabaseEndpoint']
      ).toBeDefined();
    });
  });
});
