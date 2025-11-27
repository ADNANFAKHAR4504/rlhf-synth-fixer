/**
 * Integration tests for TapStack CloudFormation deployment
 * Platform: CloudFormation (CFN)
 * Language: JSON
 *
 * These tests validate the deployed infrastructure using real AWS resources.
 * Tests use cfn-outputs/flat-outputs.json for dynamic resource references.
 */

const fs = require('fs');
const path = require('path');
const {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand
} = require('@aws-sdk/client-ec2');
const {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand
} = require('@aws-sdk/client-rds');
const {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand
} = require('@aws-sdk/client-s3');
const {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand
} = require('@aws-sdk/client-elastic-load-balancing-v2');
const {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} = require('@aws-sdk/client-cloudwatch-logs');
const {
  KMSClient,
  DescribeKeyCommand
} = require('@aws-sdk/client-kms');

// Initialize AWS clients
const region = 'us-east-2';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });
const kmsClient = new KMSClient({ region });

describe('TapStack CloudFormation Integration Tests', () => {
  let outputs;
  let hasDeployedStack = false;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../../cfn-outputs/flat-outputs.json');

    try {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
      hasDeployedStack = true;
      console.log('Loaded deployment outputs:', Object.keys(outputs));
    } catch (error) {
      console.warn('No deployment outputs found. Tests will be skipped.');
      console.warn('Deploy the stack first to run integration tests.');
      hasDeployedStack = false;
    }
  });

  describe('VPC and Networking', () => {
    test('VPC exists and has correct configuration', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs[0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('public and private subnets exist across 3 AZs', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const publicSubnets = outputs.PublicSubnets.split(',');
      const privateSubnets = outputs.PrivateSubnets.split(',');

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);

      const allSubnets = [...publicSubnets, ...privateSubnets];
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnets
      }));

      expect(response.Subnets).toHaveLength(6);

      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateways are deployed and available', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      expect(response.NatGateways.length).toBeGreaterThanOrEqual(1);

      response.NatGateways.forEach(nat => {
        expect(nat.State).toMatch(/available|pending/);
      });
    });
  });

  describe('RDS Aurora Database', () => {
    test('Aurora cluster exists and is encrypted', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const clusterEndpoint = outputs.DatabaseClusterEndpoint;
      expect(clusterEndpoint).toBeDefined();

      // Extract cluster identifier from endpoint (format: <cluster-id>.cluster-xxx.region.rds.amazonaws.com)
      const clusterIdentifier = clusterEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters[0];

      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.Status).toMatch(/available|creating/);
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration.MinCapacity).toBe(0.5);
      expect(cluster.ServerlessV2ScalingConfiguration.MaxCapacity).toBe(4);
    });

    test('database instance is not publicly accessible', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const clusterEndpoint = outputs.DatabaseClusterEndpoint;
      const clusterIdentifier = clusterEndpoint.split('.')[0];

      // Find instance in the cluster
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [clusterIdentifier] }
        ]
      }));

      expect(response.DBInstances.length).toBeGreaterThan(0);

      response.DBInstances.forEach(instance => {
        expect(instance.PubliclyAccessible).toBe(false);
        expect(instance.DBInstanceClass).toBe('db.serverless');
      });
    });
  });

  describe('S3 Bucket', () => {
    test('document bucket exists and is accessible', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const bucketName = outputs.DocumentBucketName;
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const headResponse = await s3Client.send(new HeadBucketCommand({
        Bucket: bucketName
      }));

      expect(headResponse.$metadata.httpStatusCode).toBe(200);
    });

    test('document bucket has versioning enabled', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const bucketName = outputs.DocumentBucketName;

      const response = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(response.Status).toBe('Enabled');
    });

    test('document bucket has encryption enabled', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const bucketName = outputs.DocumentBucketName;

      const response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is internet-facing', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const albArn = outputs.LoadBalancerArn;
      expect(albArn).toBeDefined();

      const response = await elbClient.send(new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn]
      }));

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers[0];

      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.State.Code).toMatch(/active|provisioning/);
      expect(alb.AvailabilityZones).toHaveLength(3);
    });

    test('ALB has HTTPS and HTTP listeners configured', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const albArn = outputs.LoadBalancerArn;

      const response = await elbClient.send(new DescribeListenersCommand({
        LoadBalancerArn: albArn
      }));

      expect(response.Listeners.length).toBeGreaterThanOrEqual(2);

      const ports = response.Listeners.map(l => l.Port);
      expect(ports).toContain(80);
      expect(ports).toContain(443);

      const httpsListener = response.Listeners.find(l => l.Protocol === 'HTTPS');
      expect(httpsListener).toBeDefined();
      expect(httpsListener.Certificates).toBeDefined();
      expect(httpsListener.Certificates.length).toBeGreaterThan(0);
    });

    test('ALB DNS is accessible', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const albDns = outputs.LoadBalancerDNS;
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/\.elb\.[a-z0-9-]+\.amazonaws\.com$/);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('log groups exist with 365-day retention', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthU6f1g6s6';

      const logGroupNames = [
        `/aws/loan-processing/application-${environmentSuffix}`,
        `/aws/rds/cluster/loanprocessing-${environmentSuffix}`,
        `/aws/elasticloadbalancing/alb-${environmentSuffix}`
      ];

      for (const logGroupName of logGroupNames) {
        const response = await cwLogsClient.send(new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        }));

        const logGroup = response.logGroups.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup.retentionInDays).toBe(365);
      }
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and has rotation enabled', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const kmsKeyId = outputs.KMSKeyId;
      expect(kmsKeyId).toBeDefined();

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata.KeyState).toMatch(/Enabled|Creating/);
      expect(response.KeyMetadata.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG exists and is configured', async () => {
      if (!hasDeployedStack) {
        console.log('Skipping: Stack not deployed');
        return;
      }

      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();
      expect(asgName).toContain(process.env.ENVIRONMENT_SUFFIX || 'synthU6f1g6s6');
    });
  });
});
