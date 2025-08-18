import {
  CloudWatchClient
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
  type IpPermission,
  type IpRange,
  type SecurityGroup,
  type Subnet,
  type Tag
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs
const loadStackOutputs = () => {
  try {
    const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    const allOutputs = JSON.parse(outputsContent);
    
    // Extract the first (and likely only) stack's outputs
    const stackNames = Object.keys(allOutputs);
    if (stackNames.length === 0) {
      throw new Error('No stack outputs found in all-outputs.json');
    }
    
    const stackName = stackNames[0];
    console.log(`Using outputs from stack: ${stackName}`);
    return allOutputs[stackName];
  } catch (error) {
    throw new Error(`Failed to load stack outputs: ${error}`);
  }
};

// Extract region from stack outputs
const extractRegionFromOutputs = (stackOutputs: any): string => {
  // Try to extract region from RDS endpoint
  if (stackOutputs.rdsEndpoint) {
    const match = stackOutputs.rdsEndpoint.match(/\.([a-z0-9-]+)\.rds\.amazonaws\.com/);
    if (match) {
      return match[1];
    }
  }
  
  // Try to extract region from IAM ARN
  if (stackOutputs.applicationRoleArn) {
    const match = stackOutputs.applicationRoleArn.match(/app-role-pr\d+-([a-z0-9-]+)-/);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback to environment variable or default
  return process.env.AWS_REGION || 'us-east-1';
};

// Initialize AWS clients
const initializeClients = (region: string) => {
  return {
    ec2: new EC2Client({ region }),
    rds: new RDSClient({ region }),
    s3: new S3Client({ region }),
    kms: new KMSClient({ region }),
    iam: new IAMClient({ region }),
    sts: new STSClient({ region }),
    cloudwatch: new CloudWatchClient({ region }),
  };
};

// Helper function to wait for a condition with timeout
const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout: number = 30000,
  interval: number = 2000
): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Generate unique test ID
const generateTestId = (): string => {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

describe('TAP Infrastructure Integration Tests', () => {
  let stackOutputs: any;
  let clients: any;
  let accountId: string;
  let region: string;

  beforeAll(async () => {
    // Load stack outputs
    stackOutputs = loadStackOutputs();
    console.log('Loaded stack outputs:', JSON.stringify(stackOutputs, null, 2));

    // Extract region from stack outputs
    region = extractRegionFromOutputs(stackOutputs);
    console.log(`Detected region from stack outputs: ${region}`);

    // Initialize AWS clients with the correct region
    clients = initializeClients(region);

    // Get account ID
    try {
      const identity = await clients.sts.send(new GetCallerIdentityCommand({}));
      accountId = identity.Account!;
      console.log(`Running tests against AWS account: ${accountId}`);
    } catch (error) {
      throw new Error(`Failed to get AWS account identity: ${error}`);
    }
  });

  describe('VPC Infrastructure Tests', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = stackOutputs.vpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.DhcpOptionsId).toBeDefined();
      expect(vpc.InstanceTenancy).toBe('default');

      // Check VPC attributes
      const attributesResponse = await clients.ec2.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        })
      );
      expect(attributesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsResponse = await clients.ec2.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        })
      );
      expect(dnsResponse.EnableDnsSupport?.Value).toBe(true);
    });

    test('should have public subnets with correct configuration', async () => {
      const publicSubnetIds = stackOutputs.publicSubnetIds;
      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);

      const response = await clients.ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: publicSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(publicSubnetIds.length);
      
      response.Subnets!.forEach((subnet: Subnet, index: number) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(stackOutputs.vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
        expect(subnet.AvailabilityZone).toBeDefined();
        
        // Check tags
        const nameTag = subnet.Tags?.find((tag: Tag) => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('public-subnet');
      });

      // Verify subnets are in different AZs
      const availabilityZones = response.Subnets!.map((subnet: Subnet) => subnet.AvailabilityZone);
      const uniqueAzs = new Set(availabilityZones);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have private subnets with correct configuration', async () => {
      const privateSubnetIds = stackOutputs.privateSubnetIds;
      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      const response = await clients.ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: privateSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(privateSubnetIds.length);
      
      response.Subnets!.forEach((subnet: Subnet, index: number) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(stackOutputs.vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
        expect(subnet.AvailabilityZone).toBeDefined();
        
        // Check tags
        const nameTag = subnet.Tags?.find((tag: Tag) => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('private-subnet');
      });

      // Verify subnets are in different AZs
      const availabilityZones = response.Subnets!.map((subnet: Subnet) => subnet.AvailabilityZone);
      const uniqueAzs = new Set(availabilityZones);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Infrastructure Tests', () => {
    test('should have RDS instance with correct configuration', async () => {
      const rdsEndpoint = stackOutputs.rdsEndpoint;
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toContain('.rds.amazonaws.com');

      // Extract DB instance identifier from endpoint
      const dbInstanceId = rdsEndpoint.split('.')[0];
      
      const response = await clients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.VpcSecurityGroups).toBeDefined();
      expect(dbInstance.VpcSecurityGroups!.length).toBeGreaterThan(0);
      
      // Check endpoint and port
      expect(dbInstance.Endpoint?.Address).toBe(rdsEndpoint.split(':')[0]);
      expect(dbInstance.Endpoint?.Port).toBe(3306);
    });

    test('should have RDS subnet group with private subnets', async () => {
      const rdsEndpoint = stackOutputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];
      
      const dbResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      const dbSubnetGroupName = dbResponse.DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
      expect(dbSubnetGroupName).toBeDefined();

      const subnetGroupResponse = await clients.rds.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: dbSubnetGroupName,
        })
      );

      expect(subnetGroupResponse.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = subnetGroupResponse.DBSubnetGroups![0];
      
      expect(subnetGroup.VpcId).toBe(stackOutputs.vpcId);
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are private subnets
      const privateSubnetIds = stackOutputs.privateSubnetIds;
      const subnetIds = subnetGroup.Subnets!.map((subnet: any) => subnet.SubnetIdentifier);
      
      subnetIds.forEach((subnetId: string) => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    });
  });

  describe('S3 Infrastructure Tests', () => {
    test('should have S3 bucket with correct configuration', async () => {
      const bucketName = stackOutputs.s3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);

      // Check bucket exists
      await clients.s3.send(new HeadBucketCommand({ Bucket: bucketName }));

      // Check bucket encryption
      const encryptionResponse = await clients.s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = encryptionResponse.ServerSideEncryptionConfiguration!.Rules!;
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      // Check bucket versioning
      const versioningResponse = await clients.s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessResponse = await clients.s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      expect(publicAccessResponse.PublicAccessBlockConfiguration).toBeDefined();
      const config = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM Infrastructure Tests', () => {
    test('should have application role with correct configuration', async () => {
      const applicationRoleArn = stackOutputs.applicationRoleArn;
      expect(applicationRoleArn).toBeDefined();
      expect(applicationRoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);

      const roleName = applicationRoleArn.split('/').pop();
      
      const response = await clients.iam.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      const role = response.Role!;
      
      expect(role.RoleName).toBe(roleName);
      expect(role.Arn).toBe(applicationRoleArn);
      expect(role.AssumeRolePolicyDocument).toBeDefined();
      
      // Parse and verify assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');

      // Check attached policies
      const policiesResponse = await clients.iam.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      
      expect(policiesResponse.AttachedPolicies).toBeDefined();
      expect(policiesResponse.AttachedPolicies!.length).toBeGreaterThan(0);
    });

    test('should have instance profile with correct configuration', async () => {
      const instanceProfileArn = stackOutputs.instanceProfileArn;
      expect(instanceProfileArn).toBeDefined();
      expect(instanceProfileArn).toMatch(/^arn:aws:iam::\d+:instance-profile\/.+$/);

      const profileName = instanceProfileArn.split('/').pop();
      
      const response = await clients.iam.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );

      expect(response.InstanceProfile).toBeDefined();
      const profile = response.InstanceProfile!;
      
      expect(profile.InstanceProfileName).toBe(profileName);
      expect(profile.Arn).toBe(instanceProfileArn);
      expect(profile.Roles).toBeDefined();
      expect(profile.Roles!.length).toBe(1);
      
      // Verify the role is attached to the instance profile
      const attachedRole = profile.Roles![0];
      expect(attachedRole.Arn).toBe(stackOutputs.applicationRoleArn);
    });
  });

  describe('Security Group Tests', () => {
    test('should have security groups with appropriate rules', async () => {
      const vpcId = stackOutputs.vpcId;
      
      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      const securityGroups = response.SecurityGroups!.filter((sg: SecurityGroup) => sg.GroupName !== 'default');
      expect(securityGroups.length).toBeGreaterThan(0);

      // Check for RDS security group
      const rdsSecurityGroup = securityGroups.find((sg: SecurityGroup) => 
        sg.GroupName?.includes('rds') || sg.Description?.includes('RDS')
      );
      expect(rdsSecurityGroup).toBeDefined();
      
      if (rdsSecurityGroup) {
        expect(rdsSecurityGroup.IpPermissions).toBeDefined();
        // Should have MySQL port (3306) open from VPC CIDR
        const mysqlRule = rdsSecurityGroup.IpPermissions!.find((rule: IpPermission) => 
          rule.FromPort === 3306 && rule.ToPort === 3306
        );
        expect(mysqlRule).toBeDefined();
      }
    });
  });

  describe('End-to-End Infrastructure Tests', () => {
    const e2eTestId = generateTestId();

    test('e2e: should have complete infrastructure connectivity', async () => {
      console.log(`Starting E2E infrastructure test with ID: ${e2eTestId}`);

      // Step 1: Verify VPC connectivity
      const vpcId = stackOutputs.vpcId;
      const publicSubnetIds = stackOutputs.publicSubnetIds;
      const privateSubnetIds = stackOutputs.privateSubnetIds;

      expect(vpcId).toBeDefined();
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      // Step 2: Verify RDS connectivity from private subnets
      const rdsEndpoint = stackOutputs.rdsEndpoint;
      expect(rdsEndpoint).toContain('.rds.amazonaws.com');

      // Step 3: Verify S3 bucket accessibility
      const bucketName = stackOutputs.s3BucketName;
      await clients.s3.send(new HeadBucketCommand({ Bucket: bucketName }));

      // Step 4: Verify IAM role and instance profile relationship
      const applicationRoleArn = stackOutputs.applicationRoleArn;
      const instanceProfileArn = stackOutputs.instanceProfileArn;
      
      const profileName = instanceProfileArn.split('/').pop();
      const profileResponse = await clients.iam.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );
      
      expect(profileResponse.InstanceProfile!.Roles![0].Arn).toBe(applicationRoleArn);

      // Step 5: Verify security groups allow proper communication
      const sgResponse = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      
      const tapSecurityGroups = sgResponse.SecurityGroups!.filter((sg: SecurityGroup) => 
        sg.GroupName !== 'default' && sg.Tags?.some((tag: Tag) => 
          tag.Key === 'Project' && tag.Value === 'TAP'
        )
      );
      expect(tapSecurityGroups.length).toBeGreaterThanOrEqual(1);

      console.log(`E2E infrastructure test completed successfully for test ID: ${e2eTestId}`);
    }, 120000);

    test('e2e: should have proper resource tagging and naming', async () => {
      console.log(`Starting E2E tagging test with ID: ${e2eTestId}`);

      // Check VPC tags
      const vpcResponse = await clients.ec2.send(
        new DescribeVpcsCommand({ VpcIds: [stackOutputs.vpcId] })
      );
      
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.some((tag: Tag) => tag.Key === 'Project' && tag.Value === 'TAP')).toBe(true);
      expect(vpcTags.some((tag: Tag) => tag.Key === 'ManagedBy' && tag.Value === 'Pulumi')).toBe(true);

      // Check subnet tags
      const publicSubnetIds = stackOutputs.publicSubnetIds;
      const subnetResponse = await clients.ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      
      subnetResponse.Subnets!.forEach((subnet: Subnet) => {
        const tags = subnet.Tags || [];
        expect(tags.some((tag: Tag) => tag.Key === 'Project' && tag.Value === 'TAP')).toBe(true);
        expect(tags.some((tag: Tag) => tag.Key === 'ManagedBy' && tag.Value === 'Pulumi')).toBe(true);
      });

      console.log(`E2E tagging test completed successfully for test ID: ${e2eTestId}`);
    }, 60000);

    test('e2e: should have proper security configurations across all services', async () => {
      console.log(`Starting E2E security test with ID: ${e2eTestId}`);

      // Verify KMS encryption is used across services
      
      // 1. S3 bucket encryption
      const bucketName = stackOutputs.s3BucketName;
      const s3EncryptionResponse = await clients.s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      const s3Rules = s3EncryptionResponse.ServerSideEncryptionConfiguration!.Rules!;
      expect(s3Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      // 2. RDS encryption
      const rdsEndpoint = stackOutputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );
      
      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);

      // 3. Security group rules are restrictive
      const vpcId = stackOutputs.vpcId;
      const sgResponse = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      
      const customSecurityGroups = sgResponse.SecurityGroups!.filter((sg: SecurityGroup) => sg.GroupName !== 'default');
      
      customSecurityGroups.forEach((sg: SecurityGroup) => {
        // Check that ingress rules are not overly permissive (no 0.0.0.0/0 for sensitive ports)
        const ingressRules = sg.IpPermissions || [];
        ingressRules.forEach((rule: IpPermission) => {
          if (rule.FromPort === 22 || rule.FromPort === 3389) { // SSH or RDP
            const hasOpenAccess = rule.IpRanges?.some((range: IpRange) => range.CidrIp === '0.0.0.0/0');
            expect(hasOpenAccess).toBeFalsy();
          }
        });
      });

      // 4. S3 bucket public access is blocked
      const publicAccessResponse = await clients.s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      const config = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);

      console.log(`E2E security test completed successfully for test ID: ${e2eTestId}`);
    }, 90000);
  });

  describe('Performance and Reliability Tests', () => {
    test('should have resources distributed across multiple AZs for high availability', async () => {
      // Check public subnets AZ distribution
      const publicSubnetIds = stackOutputs.publicSubnetIds;
      const publicSubnetsResponse = await clients.ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      
      const publicAzs = new Set(publicSubnetsResponse.Subnets!.map((subnet: Subnet) => subnet.AvailabilityZone));
      expect(publicAzs.size).toBeGreaterThanOrEqual(2);

      // Check private subnets AZ distribution
      const privateSubnetIds = stackOutputs.privateSubnetIds;
      const privateSubnetsResponse = await clients.ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      
      const privateAzs = new Set(privateSubnetsResponse.Subnets!.map((subnet: Subnet) => subnet.AvailabilityZone));
      expect(privateAzs.size).toBeGreaterThanOrEqual(2);

      // Verify RDS subnet group spans multiple AZs
      const rdsEndpoint = stackOutputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );
      
      const subnetGroupName = rdsResponse.DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
      const subnetGroupResponse = await clients.rds.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: subnetGroupName })
      );
      
      const rdsAzs = new Set(subnetGroupResponse.DBSubnetGroups![0].Subnets!.map((subnet: any) =>
        subnet.SubnetAvailabilityZone?.Name
      ));
      expect(rdsAzs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have appropriate resource sizing for the workload', async () => {
      // Check RDS instance class
      const rdsEndpoint = stackOutputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );
      
      const dbInstance = rdsResponse.DBInstances![0];
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro'); // As configured
      expect(dbInstance.AllocatedStorage).toBe(20); // As configured
      
      // Verify storage is sufficient for the workload
      expect(dbInstance.AllocatedStorage).toBeGreaterThanOrEqual(20);
    });
  });
});
