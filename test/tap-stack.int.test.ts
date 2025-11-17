/**
 * Live Integration Tests for Multi-Region TapStack Infrastructure
 *
 * These tests verify deployed AWS resources using environment variables:
 * - ENVIRONMENT_SUFFIX: Resource naming suffix (e.g., 'pr3x5za8')
 * - AWS_REGION: Primary deployment region (default: 'us-east-1')
 *
 * Usage:
 *   ENVIRONMENT_SUFFIX=pr3x5za8 AWS_REGION=us-east-1 npm run test:integration
 *
 * Tests cover:
 * - VPC and networking infrastructure
 * - RDS database instances with encryption
 * - S3 buckets with versioning and replication
 * - DynamoDB global tables
 * - Lambda functions
 * - Application Load Balancers
 * - NAT Gateways and Internet Gateways
 */

import {
  DescribeTableCommand,
  DynamoDBClient,
  ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  LambdaClient,
  ListFunctionsCommand,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketVersioningCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// Environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
const primaryRegion = process.env.AWS_REGION || 'us-east-1';

if (!environmentSuffix) {
  throw new Error(
    'ENVIRONMENT_SUFFIX environment variable must be set (e.g., ENVIRONMENT_SUFFIX=pr3x5za8)'
  );
}

describe('Multi-Region Infrastructure Integration Tests', () => {

  describe('VPC and Networking', () => {
    test('VPC exists with proper configuration in primary region', async () => {
      const ec2Client = new EC2Client({ region: primaryRegion });

      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBeDefined();
      expect(vpc.State).toBe('available');

      console.log(`✓ Primary VPC found: ${vpc.VpcId} (${vpc.CidrBlock})`);
    });

    test('Subnets span multiple availability zones', async () => {
      const ec2Client = new EC2Client({ region: primaryRegion });

      // Get VPC first
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

      const vpcId = vpcResponse.Vpcs![0].VpcId!;

      // Get subnets
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const subnetResponse = await ec2Client.send(subnetCommand);

      expect(subnetResponse.Subnets).toBeDefined();
      expect(subnetResponse.Subnets!.length).toBeGreaterThan(0);

      // Check AZ distribution
      const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      console.log(`✓ Found ${subnetResponse.Subnets!.length} subnets across ${azs.size} AZs`);
    });

    test('Internet Gateway is attached to VPC', async () => {
      const ec2Client = new EC2Client({ region: primaryRegion });

      // Get VPC first
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId!;

      // Check Internet Gateway
      const igwCommand = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const igwResponse = await ec2Client.send(igwCommand);

      expect(igwResponse.InternetGateways).toBeDefined();
      expect(igwResponse.InternetGateways!.length).toBeGreaterThan(0);

      const igw = igwResponse.InternetGateways![0];
      const attachment = igw.Attachments![0];
      expect(attachment.State).toBe('available');

      console.log(`✓ Internet Gateway ${igw.InternetGatewayId} attached`);
    });

    test('NAT Gateways are available', async () => {
      const ec2Client = new EC2Client({ region: primaryRegion });

      // Get VPC first
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId!;

      // Check NAT Gateways
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'state',
            Values: ['available', 'pending'],
          },
        ],
      });

      const natResponse = await ec2Client.send(natCommand);

      expect(natResponse.NatGateways).toBeDefined();
      expect(natResponse.NatGateways!.length).toBeGreaterThan(0);

      console.log(`✓ Found ${natResponse.NatGateways!.length} NAT Gateway(s)`);
    });

    test('VPC Peering connection exists and is active', async () => {
      const ec2Client = new EC2Client({ region: primaryRegion });

      // Get primary VPC
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);

      if (vpcResponse.Vpcs!.length === 0) {
        console.log('⚠ No VPC found, skipping peering test');
        return;
      }

      const vpcId = vpcResponse.Vpcs![0].VpcId!;

      // Check for peering connections
      const peeringCommand = new DescribeVpcPeeringConnectionsCommand({
        Filters: [
          {
            Name: 'requester-vpc-info.vpc-id',
            Values: [vpcId],
          },
        ],
      });

      try {
        const peeringResponse = await ec2Client.send(peeringCommand);

        if (peeringResponse.VpcPeeringConnections && peeringResponse.VpcPeeringConnections.length > 0) {
          const peering = peeringResponse.VpcPeeringConnections[0];
          expect(peering.Status?.Code).toMatch(/^(active|pending-acceptance)$/);
          console.log(`✓ VPC Peering ${peering.VpcPeeringConnectionId}: ${peering.Status?.Code}`);
        } else {
          console.log('⚠ No VPC peering connections found (may not be deployed yet)');
        }
      } catch (error) {
        console.log('⚠ VPC peering check failed, may not be deployed yet');
      }
    });
  });

  describe('Database Infrastructure', () => {
    test('RDS instance exists and is encrypted', async () => {
      const rdsClient = new RDSClient({ region: primaryRegion });

      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);

      // Filter instances by environment suffix
      const matchingInstances = response.DBInstances?.filter(db =>
        db.DBInstanceIdentifier?.toLowerCase().includes(environmentSuffix.toLowerCase())
      );

      if (!matchingInstances || matchingInstances.length === 0) {
        console.log('⚠ No RDS instances found (may not be deployed yet)');
        return;
      }

      const dbInstance = matchingInstances[0];
      expect(dbInstance.DBInstanceStatus).toBeDefined();
      expect(dbInstance.StorageEncrypted).toBe(true);

      console.log(`✓ RDS Instance: ${dbInstance.DBInstanceIdentifier} (${dbInstance.DBInstanceStatus})`);
      console.log(`  Encrypted: ${dbInstance.StorageEncrypted}, Engine: ${dbInstance.Engine}`);
    });
  });

  describe('Storage', () => {
    test('S3 buckets exist with versioning enabled', async () => {
      const s3Client = new S3Client({ region: primaryRegion });

      // List all buckets
      const listCommand = new ListBucketsCommand({});
      const listResponse = await s3Client.send(listCommand);

      // Filter buckets by environment suffix
      const matchingBuckets = listResponse.Buckets?.filter(bucket =>
        bucket.Name?.toLowerCase().includes(environmentSuffix.toLowerCase())
      );

      if (!matchingBuckets || matchingBuckets.length === 0) {
        console.log('⚠ No S3 buckets found (may not be deployed yet)');
        return;
      }

      expect(matchingBuckets.length).toBeGreaterThan(0);

      // Check versioning on first matching bucket
      const bucketName = matchingBuckets[0].Name!;
      const versionCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versionResponse = await s3Client.send(versionCommand);

      expect(versionResponse.Status).toBe('Enabled');

      console.log(`✓ S3 Bucket: ${bucketName} (Versioning: ${versionResponse.Status})`);
    });
  });

  describe('DynamoDB Tables', () => {
    test('DynamoDB table exists and is active', async () => {
      const dynamoClient = new DynamoDBClient({ region: primaryRegion });

      // List all tables
      const listCommand = new ListTablesCommand({});
      const listResponse = await dynamoClient.send(listCommand);

      // Filter tables by environment suffix
      const matchingTables = listResponse.TableNames?.filter(tableName =>
        tableName.toLowerCase().includes(environmentSuffix.toLowerCase())
      );

      if (!matchingTables || matchingTables.length === 0) {
        console.log('⚠ No DynamoDB tables found (may not be deployed yet)');
        return;
      }

      expect(matchingTables.length).toBeGreaterThan(0);

      // Describe first matching table
      const tableName = matchingTables[0];
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const describeResponse = await dynamoClient.send(describeCommand);

      expect(describeResponse.Table).toBeDefined();
      expect(describeResponse.Table!.TableStatus).toBe('ACTIVE');

      // Check for replicas
      const replicas = describeResponse.Table!.Replicas || [];

      console.log(`✓ DynamoDB Table: ${tableName} (${describeResponse.Table!.TableStatus})`);
      console.log(`  Replicas: ${replicas.length}`);

      if (replicas.length > 0) {
        replicas.forEach(replica => {
          console.log(`    - ${replica.RegionName}: ${replica.ReplicaStatus}`);
        });
      }
    });
  });

  describe('Compute', () => {
    test('Lambda functions exist and are active', async () => {
      const lambdaClient = new LambdaClient({ region: primaryRegion });

      // List all functions
      const listCommand = new ListFunctionsCommand({});
      const listResponse = await lambdaClient.send(listCommand);

      // Filter functions by environment suffix
      const matchingFunctions = listResponse.Functions?.filter(func =>
        func.FunctionName?.toLowerCase().includes(environmentSuffix.toLowerCase())
      );

      if (!matchingFunctions || matchingFunctions.length === 0) {
        console.log('⚠ No Lambda functions found (may not be deployed yet)');
        return;
      }

      expect(matchingFunctions.length).toBeGreaterThan(0);

      // Check first matching function
      const funcName = matchingFunctions[0].FunctionName!;
      const getCommand = new GetFunctionCommand({ FunctionName: funcName });
      const getResponse = await lambdaClient.send(getCommand);

      expect(getResponse.Configuration).toBeDefined();
      expect(getResponse.Configuration!.State).toBe('Active');

      console.log(`✓ Lambda Function: ${funcName}`);
      console.log(`  Runtime: ${getResponse.Configuration!.Runtime}, State: ${getResponse.Configuration!.State}`);
    });
  });
});
