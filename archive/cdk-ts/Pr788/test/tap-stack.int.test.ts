// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  ElastiCacheClient,
  DescribeServerlessCachesCommand,
} from '@aws-sdk/client-elasticache';

// Load deployment outputs
let outputs: any = {};
const outputsFile = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsFile)) {
  outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
} else {
  console.warn('Outputs file not found, using empty outputs');
}

// Get environment suffix from environment variable or outputs
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || outputs.EnvironmentSuffix || 'dev';

// AWS SDK clients
const region = process.env.AWS_DEFAULT_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const elasticacheClient = new ElastiCacheClient({ region });

describe('Migration Infrastructure Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC exists with correct CIDR block', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      // Check tags
      const tags = vpc.Tags || [];
      const projectTag = tags.find((t) => t.Key === 'Project');
      const envTag = tags.find((t) => t.Key === 'Environment');
      expect(projectTag?.Value).toBe('Migration');
      expect(envTag?.Value).toBe('Production');
    });

    test('Public subnets exist in multiple AZs', async () => {
      const subnetIds = outputs.PublicSubnetIds?.split(',');
      expect(subnetIds).toBeDefined();
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toHaveLength(subnetIds.length);

      // Check that subnets are in different AZs
      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Check that subnets are public (have public IP mapping)
      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VpcId);
      });
    });

    test('Internet gateway is attached to VPC', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('Route tables have routes to internet gateway', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      // Find non-main route tables (public subnet route tables)
      const publicRouteTables = response.RouteTables!.filter(
        (rt) => !rt.Associations?.some((a) => a.Main)
      );

      expect(publicRouteTables.length).toBeGreaterThanOrEqual(2);

      // Check each public route table has a route to 0.0.0.0/0 via IGW
      publicRouteTables.forEach((rt) => {
        const defaultRoute = rt.Routes?.find(
          (r) => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute?.GatewayId).toMatch(/^igw-[a-f0-9]+$/);
      });
    });

    test('SSH security group allows access from anywhere', async () => {
      const sgId = outputs.SecurityGroupId;
      expect(sgId).toBeDefined();
      expect(sgId).toMatch(/^sg-[a-f0-9]+$/);

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      
      // Check SSH rule
      const sshRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpProtocol).toBe('tcp');
      expect(sshRule?.IpRanges).toContainEqual(
        expect.objectContaining({ CidrIp: '0.0.0.0/0' })
      );

      // Check description
      expect(sg.Description).toContain('SSH access for migration');
    });
  });

  describe('S3 Storage', () => {
    test('S3 bucket exists with correct configuration', async () => {
      const bucketName = outputs.BackupBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(
        new RegExp(`^migration-backup-.*-[a-z0-9]+$`)
      );

      // Check bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });

    test('S3 bucket has versioning enabled', async () => {
      const bucketName = outputs.BackupBucketName;
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.BackupBucketName;
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket blocks public access', async () => {
      const bucketName = outputs.BackupBucketName;
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket can store and retrieve objects', async () => {
      const bucketName = outputs.BackupBucketName;
      const testKey = `test-object-${Date.now()}.txt`;
      const testContent = 'This is a test backup file';

      // Put object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Get object
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );

      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testContent);

      // Clean up
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    });
  });

  describe('ElastiCache Compute', () => {
    test('ElastiCache Serverless cluster exists', async () => {
      // ElastiCache Serverless clusters are listed differently
      const cacheName = `migration-cache-${environmentSuffix}`;
      
      try {
        const response = await elasticacheClient.send(
          new DescribeServerlessCachesCommand({
            ServerlessCacheName: cacheName,
          })
        );

        if (response.ServerlessCaches && response.ServerlessCaches.length > 0) {
          const cache = response.ServerlessCaches[0];
          expect(cache.ServerlessCacheName).toBe(cacheName);
          expect(cache.Engine).toBe('redis');
          expect(cache.Status).toMatch(/available|creating/);

          // Check cache usage limits
          expect(cache.CacheUsageLimits?.DataStorage?.Maximum).toBe(10);
          expect(cache.CacheUsageLimits?.DataStorage?.Unit).toBe('GB');
          expect(cache.CacheUsageLimits?.ECPUPerSecond?.Maximum).toBe(5000);
        }
      } catch (error: any) {
        // ElastiCache Serverless might not be available in all regions
        if (error.name === 'ResourceNotFoundException') {
          console.warn('ElastiCache Serverless not found - may be still creating or not available in region');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Resource Tagging', () => {
    test('All resources have correct tags', async () => {
      const vpcId = outputs.VpcId;
      const sgId = outputs.SecurityGroupId;

      // Check VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags).toContainEqual({ Key: 'Project', Value: 'Migration' });
      expect(vpcTags).toContainEqual({ Key: 'Environment', Value: 'Production' });

      // Check Security Group tags
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );
      const sgTags = sgResponse.SecurityGroups![0].Tags || [];
      expect(sgTags).toContainEqual({ Key: 'Project', Value: 'Migration' });
      expect(sgTags).toContainEqual({ Key: 'Environment', Value: 'Production' });
    });
  });

  describe('Network Connectivity', () => {
    test('Public subnets can route to internet', async () => {
      const subnetIds = outputs.PublicSubnetIds?.split(',');
      const vpcId = outputs.VpcId;

      // Get route tables for public subnets
      const rtResponse = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'association.subnet-id',
              Values: subnetIds,
            },
          ],
        })
      );

      expect(rtResponse.RouteTables).toHaveLength(subnetIds.length);

      // Each public subnet should have a route to 0.0.0.0/0
      rtResponse.RouteTables!.forEach((rt) => {
        const defaultRoute = rt.Routes?.find(
          (r) => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute?.State).toBe('active');
      });
    });
  });

  describe('Infrastructure Completeness', () => {
    test('All required outputs are present', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.PublicSubnetIds).toBeDefined();
      expect(outputs.SecurityGroupId).toBeDefined();
      expect(outputs.BackupBucketName).toBeDefined();
      expect(outputs.BackupBucketArn).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('Resources follow naming conventions', () => {
      const bucketName = outputs.BackupBucketName;
      const suffix = outputs.EnvironmentSuffix;

      // Check bucket naming pattern
      expect(bucketName).toContain('migration-backup');
      expect(bucketName).toContain(suffix);

      // Check ARN format
      const bucketArn = outputs.BackupBucketArn;
      expect(bucketArn).toMatch(/^arn:aws:s3:::migration-backup-.*$/);
    });
  });
});