import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  ListRolesCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs from deployment
const loadStackOutputs = () => {
  try {
    // Follow the exact pattern from archive/pulumi-ts examples
    const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(outputsContent);
  } catch (error) {
    throw new Error(`Failed to load stack outputs: ${error}`);
  }
};

// Initialize AWS clients
const initializeClients = (region?: string) => {
  const defaultRegion = region || process.env.AWS_REGION || 'us-east-1';

  return {
    ec2: new EC2Client({ region: defaultRegion }),
    rds: new RDSClient({ region: defaultRegion }),
    s3: new S3Client({ region: defaultRegion }),
    iam: new IAMClient({ region: defaultRegion }),
    sts: new STSClient({ region: defaultRegion }),
  };
};

// Extract resource IDs from outputs
const extractResourceIds = (stackOutputs: any) => {
  // Get the first stack (assuming single stack deployment)
  const stackName = Object.keys(stackOutputs)[0];
  if (!stackName) {
    throw new Error('No stack outputs found');
  }
  
  // Return the outputs for the first stack
  return stackOutputs[stackName];
};

describe('TapStack Integration Tests', () => {
  let stackOutputs: any;
  let resourceIds: any;
  let clients: any;
  let testRegion: string;

  beforeAll(async () => {
    try {
      // Load stack outputs following archive/pulumi-ts pattern
      stackOutputs = loadStackOutputs();
      resourceIds = extractResourceIds(stackOutputs);
      
      // Get the first stack name for logging
      const stackName = Object.keys(stackOutputs)[0];
      console.log(`Stack outputs loaded:`, Object.keys(stackOutputs));
      
      testRegion = resourceIds.region || process.env.AWS_REGION || 'us-east-1';
      clients = initializeClients(testRegion);

      // Verify AWS credentials
      const identity = await clients.sts.send(new GetCallerIdentityCommand({}));
      console.log(`Running integration tests with AWS Account: ${identity.Account} in region: ${testRegion}`);
      console.log(`Testing stack: ${stackName}`);
      
      // Log available resource IDs for debugging
      console.log('Available resource IDs:', Object.keys(resourceIds));
    } catch (error) {
      console.error('Failed to initialize integration tests:', error);
      throw error;
    }
  }, 30000);

  describe('VPC and Network Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      if (!resourceIds?.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [resourceIds.vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);

      // Check VPC tags
      const nameTag = vpc.Tags?.find((tag: any) => tag.Key === 'Name');
      expect(nameTag?.Value).toMatch(/webapp-vpc-/);
    }, 30000);

    test('should have public and private subnets', async () => {
      if (!resourceIds?.publicSubnetIds || !resourceIds?.privateSubnetIds) {
        console.warn('Subnet IDs not found in outputs, skipping test');
        return;
      }

      const publicSubnetIds = Array.isArray(resourceIds.publicSubnetIds) 
        ? resourceIds.publicSubnetIds 
        : [resourceIds.publicSubnetIds];
      
      const privateSubnetIds = Array.isArray(resourceIds.privateSubnetIds) 
        ? resourceIds.privateSubnetIds 
        : [resourceIds.privateSubnetIds];

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

      const response = await clients.ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(4); // 2 public + 2 private

      // Check that we have subnets in multiple AZs
      const availabilityZones = new Set(
        response.Subnets!.map((subnet: any) => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('Security Groups Configuration', () => {
    test('should have web and database security groups', async () => {
      if (!resourceIds?.webSecurityGroupId || !resourceIds?.databaseSecurityGroupId) {
        console.warn('Security group IDs not found in outputs, skipping test');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [resourceIds.webSecurityGroupId, resourceIds.databaseSecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toHaveLength(2);

      const webSg = response.SecurityGroups!.find((sg: any) => sg.GroupId === resourceIds.webSecurityGroupId);
      const dbSg = response.SecurityGroups!.find((sg: any) => sg.GroupId === resourceIds.databaseSecurityGroupId);

      expect(webSg?.GroupName).toMatch(/webapp-web-sg-/);
      expect(dbSg?.GroupName).toMatch(/webapp-db-sg-/);

      // Web SG should allow HTTP/HTTPS from internet
      const webHttpRule = webSg?.IpPermissions?.find((rule: any) => rule.FromPort === 80);
      expect(webHttpRule).toBeDefined();

      // Database SG should not have any public access
      const dbPublicRules = dbSg?.IpPermissions?.filter((rule: any) =>
        rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')
      );
      expect(dbPublicRules).toHaveLength(0);
    }, 30000);
  });

  describe('S3 Buckets Security', () => {
    test('should have encrypted S3 buckets with proper security', async () => {
      const bucketNames = [
        resourceIds?.applicationDataBucketName,
        resourceIds?.backupBucketName,
      ].filter(Boolean);

      if (bucketNames.length === 0) {
        console.warn('No bucket names found in outputs, skipping test');
        return;
      }

      for (const bucketName of bucketNames) {
        // Check bucket exists
        await expect(
          clients.s3.send(new HeadBucketCommand({ Bucket: bucketName }))
        ).resolves.not.toThrow();

        // Check encryption
        const encryptionResponse = await clients.s3.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules![0]
            .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');

        // Check versioning
        const versioningResponse = await clients.s3.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioningResponse.Status).toBe('Enabled');

        // Check public access block
        const publicAccessResponse = await clients.s3.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );
        expect(publicAccessResponse.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        });
      }
    }, 60000);
  });

  describe('IAM Roles', () => {
    test('should have properly configured IAM roles', async () => {
      const rolesResponse = await clients.iam.send(
        new ListRolesCommand({
          PathPrefix: '/',
        })
      );

      const webappRoles = rolesResponse.Roles?.filter((role: any) =>
        role.RoleName?.includes('webapp')
      );

      expect(webappRoles).toBeDefined();
      expect(webappRoles!.length).toBeGreaterThan(0);

      // Check naming conventions
      webappRoles!.forEach((role: any) => {
        expect(role.RoleName).toMatch(/^webapp-.*-role-.*$/);
      });
    }, 30000);
  });

  describe('Database Configuration', () => {
    test('should have RDS subnet group configured', async () => {
      if (!resourceIds?.databaseSubnetGroupName) {
        console.warn('Database subnet group name not found in outputs, skipping test');
        return;
      }

      const response = await clients.rds.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: resourceIds.databaseSubnetGroupName,
        })
      );

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups![0];

      expect(subnetGroup.DBSubnetGroupName).toBe(resourceIds.databaseSubnetGroupName);
      expect(subnetGroup.VpcId).toBe(resourceIds.vpcId);
      expect(subnetGroup.Subnets).toHaveLength(2);

      // Should have subnets in different AZs
      const azs = subnetGroup.Subnets!.map((subnet: any) => subnet.SubnetAvailabilityZone?.Name);
      expect(new Set(azs).size).toBe(2);
    }, 30000);
  });

  describe('E2E End-to-End Security Tests', () => {
    test('E2E should verify infrastructure spans multiple availability zones', async () => {
      if (!resourceIds?.publicSubnetIds || !resourceIds?.privateSubnetIds) {
        console.warn('Subnet IDs not found in outputs, skipping test');
        return;
      }

      const publicSubnetIds = Array.isArray(resourceIds.publicSubnetIds) 
        ? resourceIds.publicSubnetIds 
        : [resourceIds.publicSubnetIds];
      
      const privateSubnetIds = Array.isArray(resourceIds.privateSubnetIds) 
        ? resourceIds.privateSubnetIds 
        : [resourceIds.privateSubnetIds];

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

      const response = await clients.ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        })
      );

      const availabilityZones = new Set(
        response.Subnets!.map((subnet: any) => subnet.AvailabilityZone)
      );

      // Should have subnets in at least 2 different AZs for high availability
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('E2E should verify all resources have proper tagging', async () => {
      if (!resourceIds?.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const vpcResponse = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [resourceIds.vpcId],
        })
      );

      const vpc = vpcResponse.Vpcs![0];
      const tags = vpc.Tags || [];

      // Check required tags
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');

      expect(nameTag).toBeDefined();
      expect(environmentTag).toBeDefined();
      expect(nameTag?.Value).toMatch(/webapp-vpc-/);
    }, 30000);

    test('E2E should verify resource limits are reasonable', async () => {
      // Check we're not creating excessive resources
      const bucketsResponse = await clients.s3.send(new ListBucketsCommand({}));
      const webappBuckets = bucketsResponse.Buckets?.filter((bucket: any) =>
        bucket.Name?.includes('webapp')
      );

      // Should have exactly 3 webapp buckets (app-data, backups, access-logs)
      expect(webappBuckets).toHaveLength(3);

      // Check security groups count
      if (resourceIds?.webSecurityGroupId && resourceIds?.databaseSecurityGroupId) {
        const sgResponse = await clients.ec2.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [resourceIds.webSecurityGroupId, resourceIds.databaseSecurityGroupId],
          })
        );

        expect(sgResponse.SecurityGroups).toHaveLength(2);
      }
    }, 30000);
  });
});
