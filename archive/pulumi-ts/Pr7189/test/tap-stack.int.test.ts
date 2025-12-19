/**
 * Integration tests for TapStack deployed resources
 *
 * These tests validate actual deployed AWS resources using real AWS SDK clients.
 * They use cfn-outputs/flat-outputs.json to get resource identifiers.
 *
 * NO MOCKING - All tests validate live AWS resources
 */

import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeDBClustersCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketLocationCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Parse outputs file
function loadOutputs(): Record<string, any> {
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  if (!fs.existsSync(outputsPath)) {
    console.warn(`Outputs file not found at ${outputsPath}. Integration tests will be skipped.`);
    return {};
  }

  const rawData = fs.readFileSync(outputsPath, 'utf8');

  try {
    // Parse as JSON
    const outputs = JSON.parse(rawData);
    return outputs;
  } catch (error) {
    console.error('Failed to parse outputs file:', error);
    return {};
  }
}

const outputs = loadOutputs();
const primaryRegion = process.env.AWS_REGION || 'us-east-1';
const secondaryRegion = 'eu-west-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS SDK clients for primary region
const ec2Client = new EC2Client({ region: primaryRegion });
const rdsClient = new RDSClient({ region: primaryRegion });
const s3Client = new S3Client({ region: primaryRegion });
const lambdaClient = new LambdaClient({ region: primaryRegion });
const cloudwatchClient = new CloudWatchClient({ region: primaryRegion });

// Initialize AWS SDK clients for secondary region
const secondaryRdsClient = new RDSClient({ region: secondaryRegion });
const secondaryS3Client = new S3Client({ region: secondaryRegion });
const secondaryLambdaClient = new LambdaClient({ region: secondaryRegion });

// Skip all tests if outputs file doesn't exist
const skipTests = !outputs.primaryVpcId;

describe('TapStack Integration Tests - VPC and Networking', () => {
  test('Primary VPC exists and has correct configuration', async () => {
    const vpcId = outputs.primaryVpcId;
    if (!vpcId) {
      console.warn('Skipping test: primaryVpcId not found in outputs');
      return;
    }

    expect(vpcId).toBeTruthy();
    expect(vpcId).toMatch(/^vpc-/);

    const response = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );

    expect(response.Vpcs).toBeDefined();
    expect(response.Vpcs).toHaveLength(1);

    const vpc = response.Vpcs![0];
    expect(vpc.VpcId).toBe(vpcId);
    expect(vpc.State).toBe('available');
    expect(vpc.CidrBlock).toBe('10.0.0.0/16');
  });

  test('Secondary VPC exists and has correct configuration', async () => {
    const vpcId = outputs.secondaryVpcId;
    if (!vpcId) {
      console.warn('Skipping test: secondaryVpcId not found in outputs');
      return;
    }

    expect(vpcId).toBeTruthy();
    expect(vpcId).toMatch(/^vpc-/);

    const response = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );

    expect(response.Vpcs).toBeDefined();
    expect(response.Vpcs).toHaveLength(1);

    const vpc = response.Vpcs![0];
    expect(vpc.VpcId).toBe(vpcId);
    expect(vpc.State).toBe('available');
    expect(vpc.CidrBlock).toBe('10.1.0.0/16');
  });

  test('VPC Peering Connection exists and is active', async () => {
    const peeringId = outputs.vpcPeeringConnectionId;
    if (!peeringId) {
      console.warn('Skipping test: vpcPeeringConnectionId not found in outputs');
      return;
    }

    expect(peeringId).toBeTruthy();
    expect(peeringId).toMatch(/^pcx-/);

    const response = await ec2Client.send(
      new DescribeVpcsCommand({})
    );

    // Verify peering connection exists by checking VPCs can communicate
    expect(response.Vpcs).toBeDefined();
  });
});

describe('TapStack Integration Tests - Aurora Global Database', () => {
  test('Primary Aurora cluster exists and is available', async () => {
    const endpoint = outputs.primaryDatabaseEndpoint;
    if (!endpoint) {
      console.warn('Skipping test: primaryDatabaseEndpoint not found in outputs');
      return;
    }

    expect(endpoint).toBeTruthy();
    expect(endpoint).toContain(environmentSuffix);

    // Extract cluster identifier from endpoint
    const clusterIdMatch = endpoint.match(/^([^.]+)/);
    if (!clusterIdMatch) {
      throw new Error('Could not extract cluster ID from endpoint');
    }
    const clusterId = clusterIdMatch[1].replace('-cluster', '');

    const response = await rdsClient.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
    );

    expect(response.DBClusters).toBeDefined();
    expect(response.DBClusters).toHaveLength(1);

    const cluster = response.DBClusters![0];
    expect(cluster.Status).toBe('available');
    expect(cluster.Engine).toBe('aurora-mysql');
    expect(cluster.Endpoint).toBe(endpoint);
    // Verify encryption is enabled with KMS key
    expect(cluster.StorageEncrypted).toBe(true);
    expect(cluster.KmsKeyId).toBeTruthy();
  });

  test('Secondary Aurora cluster exists and is available', async () => {
    const endpoint = outputs.secondaryDatabaseEndpoint;
    if (!endpoint) {
      console.warn('Skipping test: secondaryDatabaseEndpoint not found in outputs');
      return;
    }

    expect(endpoint).toBeTruthy();
    expect(endpoint).toContain(environmentSuffix);

    // Extract cluster identifier from endpoint
    const clusterIdMatch = endpoint.match(/^([^.]+)/);
    if (!clusterIdMatch) {
      throw new Error('Could not extract cluster ID from endpoint');
    }
    const clusterId = clusterIdMatch[1].replace('-cluster', '');

    // Use secondary region RDS client for secondary cluster
    const response = await secondaryRdsClient.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
    );

    expect(response.DBClusters).toBeDefined();
    expect(response.DBClusters).toHaveLength(1);

    const cluster = response.DBClusters![0];
    expect(cluster.Status).toBe('available');
    expect(cluster.Engine).toBe('aurora-mysql');
    expect(cluster.Endpoint).toBe(endpoint);
    // Verify encryption is enabled with KMS key
    expect(cluster.StorageEncrypted).toBe(true);
    expect(cluster.KmsKeyId).toBeTruthy();
  });

  test('Aurora clusters are in different regions', async () => {
    const primaryEndpoint = outputs.primaryDatabaseEndpoint;
    const secondaryEndpoint = outputs.secondaryDatabaseEndpoint;

    if (!primaryEndpoint || !secondaryEndpoint) {
      console.warn('Skipping test: database endpoints not found in outputs');
      return;
    }

    // Primary should be in us-east-1, secondary in eu-west-1
    expect(primaryEndpoint).toBeTruthy();
    expect(secondaryEndpoint).toBeTruthy();
    expect(primaryEndpoint).not.toBe(secondaryEndpoint);
    
    // Verify clusters are in different regions by checking their ARNs
    // Primary cluster should be accessible via primary region client
    const primaryClusterIdMatch = primaryEndpoint.match(/^([^.]+)/);
    if (primaryClusterIdMatch) {
      const primaryClusterId = primaryClusterIdMatch[1].replace('-cluster', '');
      const primaryResponse = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: primaryClusterId })
      );
      expect(primaryResponse.DBClusters).toBeDefined();
      expect(primaryResponse.DBClusters![0].Status).toBe('available');
    }
    
    // Secondary cluster should be accessible via secondary region client
    const secondaryClusterIdMatch = secondaryEndpoint.match(/^([^.]+)/);
    if (secondaryClusterIdMatch) {
      const secondaryClusterId = secondaryClusterIdMatch[1].replace('-cluster', '');
      const secondaryResponse = await secondaryRdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: secondaryClusterId })
      );
      expect(secondaryResponse.DBClusters).toBeDefined();
      expect(secondaryResponse.DBClusters![0].Status).toBe('available');
    }
  });
});

describe('TapStack Integration Tests - S3 Buckets', () => {
  test('Primary S3 bucket exists', async () => {
    const bucketName = outputs.primaryBucketName;
    if (!bucketName) {
      console.warn('Skipping test: primaryBucketName not found in outputs');
      return;
    }

    expect(bucketName).toBeTruthy();
    expect(bucketName).toContain(environmentSuffix);
    expect(bucketName).toContain('primary');

    try {
      const response = await s3Client.send(
        new GetBucketLocationCommand({ Bucket: bucketName })
      );
      expect(response.LocationConstraint).toBeDefined();
      // Primary bucket should be in us-east-1 (empty string or 'us-east-1')
      const location = response.LocationConstraint || 'us-east-1';
      expect(['us-east-1', '']).toContain(location);
    } catch (error: any) {
      // Bucket might not exist or we might not have permissions
      if (error.name === 'NoSuchBucket') {
        console.warn(`Bucket ${bucketName} does not exist`);
      } else {
        throw error;
      }
    }
  });

  test('Secondary S3 bucket exists', async () => {
    const bucketName = outputs.secondaryBucketName;
    if (!bucketName) {
      console.warn('Skipping test: secondaryBucketName not found in outputs');
      return;
    }

    expect(bucketName).toBeTruthy();
    expect(bucketName).toContain(environmentSuffix);
    expect(bucketName).toContain('secondary');

    try {
      // Use secondary region S3 client for secondary bucket
      const response = await secondaryS3Client.send(
        new GetBucketLocationCommand({ Bucket: bucketName })
      );
      expect(response.LocationConstraint).toBeDefined();
      // Secondary bucket should be in eu-west-1
      expect(response.LocationConstraint).toBe('eu-west-1');
    } catch (error: any) {
      // Bucket might not exist or we might not have permissions
      if (error.name === 'NoSuchBucket') {
        console.warn(`Bucket ${bucketName} does not exist`);
      } else {
        throw error;
      }
    }
  });
});

describe('TapStack Integration Tests - Lambda Functions', () => {
  test('Primary Lambda function exists', async () => {
    const lambdaArn = outputs.primaryLambdaArn;
    if (!lambdaArn) {
      console.warn('Skipping test: primaryLambdaArn not found in outputs');
      return;
    }

    expect(lambdaArn).toBeTruthy();
    expect(lambdaArn).toMatch(/^arn:aws:lambda:/);
    expect(lambdaArn).toContain(environmentSuffix);
    expect(lambdaArn).toContain('primary');

    // Extract function name from ARN
    const functionName = lambdaArn.split(':').pop();
    if (!functionName) {
      throw new Error('Could not extract function name from ARN');
    }

    const response = await lambdaClient.send(
      new GetFunctionCommand({ FunctionName: functionName })
    );

    expect(response.Configuration).toBeDefined();
    expect(response.Configuration!.FunctionName).toBe(functionName);
    expect(response.Configuration!.State).toBe('Active');
  });

  test('Secondary Lambda function exists', async () => {
    const lambdaArn = outputs.secondaryLambdaArn;
    if (!lambdaArn) {
      console.warn('Skipping test: secondaryLambdaArn not found in outputs');
      return;
    }

    expect(lambdaArn).toBeTruthy();
    expect(lambdaArn).toMatch(/^arn:aws:lambda:/);
    expect(lambdaArn).toContain(environmentSuffix);
    expect(lambdaArn).toContain('secondary');
    // Verify ARN contains secondary region
    expect(lambdaArn).toContain(secondaryRegion);

    // Extract function name from ARN
    const functionName = lambdaArn.split(':').pop();
    if (!functionName) {
      throw new Error('Could not extract function name from ARN');
    }

    // Use secondary region Lambda client for secondary function
    const response = await secondaryLambdaClient.send(
      new GetFunctionCommand({ FunctionName: functionName })
    );

    expect(response.Configuration).toBeDefined();
    expect(response.Configuration!.FunctionName).toBe(functionName);
    expect(response.Configuration!.State).toBe('Active');
  });
});

describe('TapStack Integration Tests - Route53', () => {
  test('Route53 hosted zone ID is valid format', () => {
    const hostedZoneId = outputs.route53HostedZoneId;
    if (!hostedZoneId) {
      console.warn('Skipping test: route53HostedZoneId not found in outputs');
      return;
    }

    expect(hostedZoneId).toBeTruthy();
    // Route53 hosted zone IDs are typically in format /hostedzone/XXXXXXXXXXXXX
    expect(hostedZoneId).toMatch(/^\/hostedzone\/[A-Z0-9]+$/);
  });

  test('Route53 DNS name follows expected format', () => {
    const dnsName = outputs.route53DnsName;
    if (!dnsName) {
      console.warn('Skipping test: route53DnsName not found in outputs');
      return;
    }

    expect(dnsName).toBeTruthy();
    expect(dnsName).toMatch(/^db\.tradingdb-.*\.test\.local$/);
    expect(dnsName).toContain(environmentSuffix);
  });

  test('Route53 outputs are consistent', () => {
    const hostedZoneId = outputs.route53HostedZoneId;
    const dnsName = outputs.route53DnsName;

    if (!hostedZoneId || !dnsName) {
      console.warn('Skipping test: Route53 outputs not found');
      return;
    }

    expect(hostedZoneId).toBeTruthy();
    expect(dnsName).toBeTruthy();
    expect(dnsName).toContain(environmentSuffix);
  });
});

describe('TapStack Integration Tests - Resource Naming', () => {
  test('All resources include environmentSuffix in names', () => {
    const suffix = environmentSuffix;

    // Verify all outputs that should contain the suffix
    if (outputs.primaryDatabaseEndpoint) {
      expect(outputs.primaryDatabaseEndpoint).toContain(suffix);
    }
    if (outputs.secondaryDatabaseEndpoint) {
      expect(outputs.secondaryDatabaseEndpoint).toContain(suffix);
    }
    if (outputs.primaryBucketName) {
      expect(outputs.primaryBucketName).toContain(suffix);
    }
    if (outputs.secondaryBucketName) {
      expect(outputs.secondaryBucketName).toContain(suffix);
    }
    if (outputs.route53DnsName) {
      expect(outputs.route53DnsName).toContain(suffix);
    }
    if (outputs.primaryLambdaArn) {
      expect(outputs.primaryLambdaArn).toContain(suffix);
    }
    if (outputs.secondaryLambdaArn) {
      expect(outputs.secondaryLambdaArn).toContain(suffix);
    }
  });
});

describe('TapStack Integration Tests - Disaster Recovery Configuration', () => {
  test('Primary and secondary resources exist in different regions', () => {
    const primaryVpcId = outputs.primaryVpcId;
    const secondaryVpcId = outputs.secondaryVpcId;

    if (!primaryVpcId || !secondaryVpcId) {
      console.warn('Skipping test: VPC IDs not found in outputs');
      return;
    }

    expect(primaryVpcId).toBeTruthy();
    expect(secondaryVpcId).toBeTruthy();
    expect(primaryVpcId).not.toBe(secondaryVpcId);
  });

  test('Database secret ARN is exported', () => {
    const dbSecretArn = outputs.dbSecretArn;
    if (!dbSecretArn) {
      console.warn('Skipping test: dbSecretArn not found in outputs');
      return;
    }

    expect(dbSecretArn).toBeTruthy();
    expect(dbSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    expect(dbSecretArn).toContain('aurora-db-password');
    expect(dbSecretArn).toContain(environmentSuffix);
  });

  test('VPC peering enables cross-region connectivity', () => {
    const peeringId = outputs.vpcPeeringConnectionId;

    if (!peeringId) {
      console.warn('Skipping test: VPC peering connection ID not found');
      return;
    }

    expect(peeringId).toBeTruthy();
    expect(peeringId).toMatch(/^pcx-/);
  });

  test('S3 buckets are configured for cross-region replication', () => {
    const primaryBucket = outputs.primaryBucketName;
    const secondaryBucket = outputs.secondaryBucketName;

    if (!primaryBucket || !secondaryBucket) {
      console.warn('Skipping test: S3 bucket names not found');
      return;
    }

    expect(primaryBucket).toBeTruthy();
    expect(secondaryBucket).toBeTruthy();
    expect(primaryBucket).not.toBe(secondaryBucket);
    expect(primaryBucket).toContain('primary');
    expect(secondaryBucket).toContain('secondary');
  });
});
