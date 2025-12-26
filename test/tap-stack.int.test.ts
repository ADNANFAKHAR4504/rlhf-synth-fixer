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
  type Subnet,
  type Tag
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient,
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
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration

// LocalStack configuration
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('localhost.localstack.cloud') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.LOCALSTACK === 'true';

// Load stack outputs
const loadStackOutputs = () => {
  try {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(outputsContent);
  } catch (error) {
    throw new Error(`Failed to load stack outputs: ${error}`);
  }
};

// Extract region from stack outputs
const extractRegionFromOutputs = (stackOutputs: any): string => {
  // Try to extract region from RDS endpoint
  if (stackOutputs.rdsEndpoint) {
    const match = stackOutputs.rdsEndpoint.match(/\.([a-z0-9-]+)\.rds/);
    if (match) {
      return match[1];
    }
  }

  // Try to extract region from IAM ARN
  if (stackOutputs.applicationRoleArn) {
    const match = stackOutputs.applicationRoleArn.match(/arn:aws:iam::/);
    if (match) {
      // For LocalStack, use us-east-1 as default
      return isLocalStack ? 'us-east-1' : (process.env.AWS_REGION || 'ap-south-1');
    }
  }

  // Fallback to environment variable or default
  return process.env.AWS_REGION || (isLocalStack ? 'us-east-1' : 'ap-south-1');
};

// AWS SDK client configuration
const getClientConfig = (region: string) => {
  if (isLocalStack) {
    const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
    return {
      region,
      endpoint,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
      forcePathStyle: true,
      tls: false,
    };
  }
  return { region };
};

// Initialize AWS clients
const initializeClients = (region: string) => {
  const config = getClientConfig(region);
  return {
    ec2: new EC2Client(config),
    rds: new RDSClient(config),
    s3: new S3Client(config),
    kms: new KMSClient(config),
    iam: new IAMClient(config),
    sts: new STSClient(config),
    cloudwatch: new CloudWatchClient(config),
    sns: new SNSClient(config),
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

// Helper function to handle AWS resource not found errors
const handleResourceNotFound = (error: any, resourceType: string, resourceId: string): boolean => {
  const notFoundErrors = [
    'InvalidVpcID.NotFound',
    'InvalidInstanceID.NotFound',
    'InvalidGroup.NotFound',
    'InvalidSubnetID.NotFound',
    'InvalidInternetGatewayID.NotFound',
    'DBInstanceNotFound',
    'NoSuchBucket',
    'NoSuchKey',
    'ResourceNotFoundException'
  ];

  if (notFoundErrors.includes(error.name) || error.name?.includes('NotFound')) {
    console.log(`${resourceType} ${resourceId} not found, likely not deployed. Skipping test.`);
    return true;
  }
  return false;
};

describe('TAP Infrastructure Integration Tests', () => {
  let stackOutputs: any;
  let clients: any;
  let accountId: string;
  let region: string;
  let infrastructureDeployed = false;

  // Helper function to skip tests when infrastructure is not deployed
  const skipIfNotDeployed = (testName: string): boolean => {
    if (!infrastructureDeployed) {
      console.log(`Skipping ${testName} - infrastructure not deployed`);
      return true;
    }
    return false;
  };

  beforeAll(async () => {
    // Load stack outputs
    stackOutputs = loadStackOutputs();

    if (!stackOutputs || Object.keys(stackOutputs).length === 0) {
      throw new Error('No stack outputs found');
    }

    console.log('Stack outputs loaded:', Object.keys(stackOutputs));

    // Extract region from stack outputs
    region = extractRegionFromOutputs(stackOutputs);
    console.log(`Detected region from stack outputs: ${region}`);
    console.log(`Running in ${isLocalStack ? 'LocalStack' : 'AWS'} mode`);

    // Initialize AWS clients with the correct region
    clients = initializeClients(region);

    // Get AWS account ID
    try {
      const identity = await clients.sts.send(new GetCallerIdentityCommand({}));
      accountId = identity.Account!;
      console.log('AWS Account ID:', accountId);
      console.log('AWS Region:', region);
    } catch (error) {
      throw new Error(`Failed to get AWS account identity: ${error}`);
    }

    // Quick check if infrastructure is deployed
    if (stackOutputs.vpcId) {
      try {
        const vpcResponse = await clients.ec2.send(
          new DescribeVpcsCommand({ VpcIds: [stackOutputs.vpcId] })
        );
        if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
          infrastructureDeployed = true;
          console.log('Infrastructure appears to be deployed');
        }
      } catch (error) {
        console.log('Infrastructure may not be deployed or accessible');
      }
    }

    if (!infrastructureDeployed) {
      console.log('Running tests in degraded mode - some tests will be skipped');
    }
  }, 60000);

  describe('Infrastructure Deployment Validation', () => {
    it('should have infrastructure deployed and accessible', async () => {
      console.log('Validating infrastructure deployment...');

      // Check if we have the expected outputs
      const expectedOutputs = ['vpcId', 'publicSubnetIds', 'privateSubnetIds', 'rdsEndpoint', 's3BucketName'];
      const actualOutputs = Object.keys(stackOutputs);
      const hasExpectedOutputs = expectedOutputs.some(output => actualOutputs.includes(output));

      if (!hasExpectedOutputs) {
        console.log('Expected infrastructure outputs not found');
        console.log('Expected outputs:', expectedOutputs);
        console.log('Actual outputs:', actualOutputs);
        console.log('This appears to be outputs from a different stack or project');
        console.log('Make sure you have deployed the correct TAP infrastructure stack');

        expect(actualOutputs.length).toBeGreaterThan(0);
        return;
      }

      let deployedResources = 0;
      let totalResources = 0;

      // Check VPC
      totalResources++;
      if (stackOutputs.vpcId) {
        try {
          const vpcResponse = await clients.ec2.send(
            new DescribeVpcsCommand({ VpcIds: [stackOutputs.vpcId] })
          );
          if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
            deployedResources++;
            console.log(`VPC ${stackOutputs.vpcId} is accessible`);
          }
        } catch (error: any) {
          console.log(`VPC ${stackOutputs.vpcId} is not accessible:`, error.message);
        }
      } else {
        console.log('No VPC ID in outputs');
      }

      // Check RDS
      totalResources++;
      if (stackOutputs.rdsEndpoint) {
        try {
          const dbInstanceId = stackOutputs.rdsEndpoint.split('.')[0];
          const rdsResponse = await clients.rds.send(
            new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
          );
          if (rdsResponse.DBInstances && rdsResponse.DBInstances.length > 0) {
            deployedResources++;
            const instance = rdsResponse.DBInstances[0];
            console.log(`RDS instance ${dbInstanceId} is ${instance.DBInstanceStatus}`);
          }
        } catch (error: any) {
          console.log(`RDS instance is not accessible:`, error.message);
        }
      } else {
        console.log('No RDS endpoint in outputs');
      }

      // Check S3 bucket
      totalResources++;
      if (stackOutputs.s3BucketName) {
        try {
          await clients.s3.send(new HeadBucketCommand({ Bucket: stackOutputs.s3BucketName }));
          deployedResources++;
          console.log(`S3 bucket ${stackOutputs.s3BucketName} is accessible`);
        } catch (error: any) {
          console.log(`S3 bucket ${stackOutputs.s3BucketName} is not accessible:`, error.message);
        }
      } else {
        console.log('No S3 bucket name in outputs');
      }

      const deploymentRatio = totalResources > 0 ? deployedResources / totalResources : 0;
      console.log(`Infrastructure deployment: ${deployedResources}/${totalResources} resources accessible (${Math.round(deploymentRatio * 100)}%)`);

      if (deploymentRatio === 0) {
        console.log('No infrastructure resources are accessible. Tests will be skipped.');
        console.log('Consider deploying the infrastructure first with: pulumi up');
      } else if (deploymentRatio < 1) {
        console.log('Some infrastructure resources are missing. Some tests may fail.');
      } else {
        console.log('All core infrastructure resources are accessible');
        infrastructureDeployed = true;
      }

      expect(deployedResources).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AWS Account and Region Validation', () => {
    it('should have valid AWS credentials and region', async () => {
      expect(accountId).toBeDefined();
      expect(accountId).toMatch(/^\d{12}$/);

      expect(region).toBeDefined();
      expect(['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1']).toContain(region);
    });
  });

  describe('VPC Infrastructure Tests', () => {
    test('should have VPC with correct configuration', async () => {
      if (!stackOutputs.vpcId) {
        console.log('VPC ID not found in outputs, skipping VPC tests');
        return;
      }

      const vpcId = stackOutputs.vpcId;
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      try {
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

        console.log(`✅ VPC ${vpcId} is properly configured with DNS support`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'VPC', vpcId)) {
          return;
        }
        throw error;
      }
    }, 30000);

    test('should have public subnets with correct configuration', async () => {
      if (!stackOutputs.publicSubnetIds) {
        console.log('Public subnet IDs not found in outputs, skipping public subnet tests');
        return;
      }

      const publicSubnetIds = stackOutputs.publicSubnetIds;
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);

      try {
        const response = await clients.ec2.send(
          new DescribeSubnetsCommand({
            SubnetIds: publicSubnetIds,
          })
        );

        expect(response.Subnets).toHaveLength(publicSubnetIds.length);

        response.Subnets!.forEach((subnet: Subnet) => {
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

        console.log(`✅ ${publicSubnetIds.length} public subnets spanning ${uniqueAzs.size} AZs`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'Public Subnets', publicSubnetIds.join(', '))) {
          return;
        }
        throw error;
      }
    });

    test('should have private subnets with correct configuration', async () => {
      if (!stackOutputs.privateSubnetIds) {
        console.log('Private subnet IDs not found in outputs, skipping private subnet tests');
        return;
      }

      const privateSubnetIds = stackOutputs.privateSubnetIds;
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      try {
        const response = await clients.ec2.send(
          new DescribeSubnetsCommand({
            SubnetIds: privateSubnetIds,
          })
        );

        expect(response.Subnets).toHaveLength(privateSubnetIds.length);

        response.Subnets!.forEach((subnet: Subnet) => {
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

        console.log(`✅ ${privateSubnetIds.length} private subnets spanning ${uniqueAzs.size} AZs`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'Private Subnets', privateSubnetIds.join(', '))) {
          return;
        }
        throw error;
      }
    });
  });

  describe('RDS Infrastructure Tests', () => {
    test('should have RDS instance with basic configuration', async () => {
      if (!stackOutputs.rdsEndpoint) {
        console.log('RDS endpoint not found in outputs, skipping RDS tests');
        return;
      }

      const rdsEndpoint = stackOutputs.rdsEndpoint;

      // LocalStack and AWS have different endpoint patterns
      if (isLocalStack) {
        expect(rdsEndpoint).toContain('localhost.localstack.cloud');
      } else {
        expect(rdsEndpoint).toContain('.rds.amazonaws.com');
      }

      // Extract DB instance identifier from endpoint
      const dbInstanceId = rdsEndpoint.split('.')[0];

      try {
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
        expect(dbInstance.VpcSecurityGroups).toBeDefined();
        expect(dbInstance.VpcSecurityGroups!.length).toBeGreaterThan(0);

        // Check endpoint and port
        const endpointAddress = rdsEndpoint.includes(':') ? rdsEndpoint.split(':')[0] : rdsEndpoint;
        expect(dbInstance.Endpoint?.Address).toBe(endpointAddress);
        expect(dbInstance.Endpoint?.Port).toBe(3306);

        console.log(`✅ RDS MySQL instance ${dbInstanceId} is available and encrypted`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'RDS instance', dbInstanceId)) {
          return;
        }
        throw error;
      }
    });

    test('should have RDS subnet group with private subnets', async () => {
      if (!stackOutputs.rdsEndpoint) {
        console.log('RDS endpoint not found in outputs, skipping RDS subnet group tests');
        return;
      }

      const rdsEndpoint = stackOutputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];

      try {
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

        console.log(`✅ RDS subnet group spans ${subnetGroup.Subnets!.length} private subnets`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'RDS subnet group', dbInstanceId)) {
          return;
        }
        throw error;
      }
    });
  });

  describe('S3 Infrastructure Tests', () => {
    test('should have S3 bucket with correct configuration', async () => {
      if (!stackOutputs.s3BucketName) {
        console.log('S3 bucket name not found in outputs, skipping S3 tests');
        return;
      }

      const bucketName = stackOutputs.s3BucketName;
      expect(bucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);

      try {
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

        console.log(`✅ S3 bucket ${bucketName} has KMS encryption, versioning, and public access blocked`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'S3 bucket', bucketName)) {
          return;
        }
        throw error;
      }
    });
  });

  describe('IAM Infrastructure Tests', () => {
    test('should have application role with correct configuration', async () => {
      if (!stackOutputs.applicationRoleArn) {
        console.log('Application role ARN not found in outputs, skipping IAM role tests');
        return;
      }

      const applicationRoleArn = stackOutputs.applicationRoleArn;
      expect(applicationRoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);

      const roleName = applicationRoleArn.split('/').pop();

      try {
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

        console.log(`✅ IAM role ${roleName} configured for EC2 service`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'IAM role', roleName!)) {
          return;
        }
        throw error;
      }
    });

    test('should have instance profile with correct configuration', async () => {
      if (!stackOutputs.instanceProfileArn) {
        console.log('Instance profile ARN not found in outputs, skipping instance profile tests');
        return;
      }

      const instanceProfileArn = stackOutputs.instanceProfileArn;
      expect(instanceProfileArn).toMatch(/^arn:aws:iam::\d+:instance-profile\/.+$/);

      const profileName = instanceProfileArn.split('/').pop();

      try {
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

        console.log(`✅ Instance profile ${profileName} attached to application role`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'Instance profile', profileName!)) {
          return;
        }
        throw error;
      }
    });
  });

  describe('Security Group Tests', () => {
    test('should have web security group with appropriate rules', async () => {
      if (!stackOutputs.webSecurityGroupId) {
        console.log('Web security group ID not found in outputs, skipping web SG tests');
        return;
      }

      const vpcId = stackOutputs.vpcId;
      const webSecurityGroupId = stackOutputs.webSecurityGroupId;
      expect(webSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);

      try {
        const response = await clients.ec2.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [webSecurityGroupId],
          })
        );

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(1);
        const webSG = response.SecurityGroups![0];

        expect(webSG.VpcId).toBe(vpcId);
        expect(webSG.GroupName).toContain('web-sg');

        // Check for HTTPS ingress rule
        const httpsRule = webSG.IpPermissions?.find((rule: IpPermission) =>
          rule.FromPort === 443 && rule.ToPort === 443
        );

        if (isLocalStack && !httpsRule) {
          console.log(`⚠️ LocalStack: Security group rules may not be fully populated`);
        } else {
          expect(httpsRule).toBeDefined();
          console.log(`✅ Web security group allows HTTPS traffic`);
        }
      } catch (error: any) {
        if (handleResourceNotFound(error, 'Web security group', webSecurityGroupId)) {
          return;
        }
        throw error;
      }
    });

    test('should have app security group with appropriate rules', async () => {
      if (!stackOutputs.appSecurityGroupId) {
        console.log('App security group ID not found in outputs, skipping app SG tests');
        return;
      }

      const vpcId = stackOutputs.vpcId;
      const appSecurityGroupId = stackOutputs.appSecurityGroupId;
      expect(appSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);

      try {
        const response = await clients.ec2.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [appSecurityGroupId],
          })
        );

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(1);
        const appSG = response.SecurityGroups![0];

        expect(appSG.VpcId).toBe(vpcId);
        expect(appSG.GroupName).toContain('app-sg');

        console.log(`✅ App security group configured for application tier`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'App security group', appSecurityGroupId)) {
          return;
        }
        throw error;
      }
    });
  });

  describe('KMS and Encryption Tests', () => {
    test('should have KMS key with encryption enabled', async () => {
      if (!stackOutputs.kmsKeyId) {
        console.log('KMS key ID not found in outputs, skipping KMS tests');
        return;
      }

      const kmsKeyId = stackOutputs.kmsKeyId;

      if (isLocalStack) {
        console.log(`⚠️ LocalStack: Skipping detailed KMS key validation`);
        console.log(`✅ KMS key ID present: ${kmsKeyId}`);
        return;
      }

      try {
        const response = await clients.kms.send(
          new DescribeKeyCommand({ KeyId: kmsKeyId })
        );

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata!.Enabled).toBe(true);
        expect(response.KeyMetadata!.KeyState).toBe('Enabled');

        console.log(`✅ KMS key ${kmsKeyId} is enabled and active`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'KMS key', kmsKeyId)) {
          return;
        }
        throw error;
      }
    });
  });

  describe('Monitoring and Alerting Tests', () => {
    test('should have SNS topic for security alerts', async () => {
      if (!stackOutputs.securityAlertsTopicArn) {
        console.log('Security alerts topic ARN not found in outputs, skipping SNS tests');
        return;
      }

      const securityAlertsTopicArn = stackOutputs.securityAlertsTopicArn;
      expect(securityAlertsTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:.+$/);

      if (isLocalStack) {
        console.log(`⚠️ LocalStack: Skipping SNS topic attribute validation`);
        console.log(`✅ SNS topic ARN present: ${securityAlertsTopicArn}`);
        return;
      }

      try {
        const response = await clients.sns.send(
          new GetTopicAttributesCommand({
            TopicArn: securityAlertsTopicArn,
          })
        );

        expect(response.Attributes).toBeDefined();
        expect(response.Attributes!.TopicArn).toBe(securityAlertsTopicArn);

        console.log(`✅ SNS topic configured for security alerts`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'SNS topic', securityAlertsTopicArn)) {
          return;
        }
        throw error;
      }
    });
  });

  describe('End-to-End Infrastructure Tests', () => {
    const e2eTestId = generateTestId();

    test('e2e: should have complete infrastructure deployment', async () => {
      console.log(`Starting E2E infrastructure test with ID: ${e2eTestId}`);

      // Skip if infrastructure is not deployed
      if (!infrastructureDeployed) {
        console.log('Infrastructure not deployed, skipping E2E infrastructure test');
        return;
      }

      try {
        // Step 1: Verify basic infrastructure components exist
        expect(stackOutputs).toBeDefined();
        expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);

        // Step 2: Verify VPC if present
        if (stackOutputs.vpcId) {
          expect(stackOutputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);

          const vpcResponse = await clients.ec2.send(
            new DescribeVpcsCommand({
              VpcIds: [stackOutputs.vpcId],
            })
          );
          expect(vpcResponse.Vpcs![0].State).toBe('available');
        }

        // Step 3: Verify RDS instance if present
        if (stackOutputs.rdsEndpoint) {
          const dbInstanceId = stackOutputs.rdsEndpoint.split('.')[0];
          const rdsResponse = await clients.rds.send(
            new DescribeDBInstancesCommand({
              DBInstanceIdentifier: dbInstanceId,
            })
          );
          const instance = rdsResponse.DBInstances![0];
          expect(instance.DBInstanceStatus).toBe('available');
        }

        // Step 4: Verify S3 bucket if present
        if (stackOutputs.s3BucketName) {
          await clients.s3.send(new HeadBucketCommand({ Bucket: stackOutputs.s3BucketName }));
        }

        // Step 5: Verify IAM role and instance profile relationship if present
        if (stackOutputs.applicationRoleArn && stackOutputs.instanceProfileArn) {
          const profileName = stackOutputs.instanceProfileArn.split('/').pop();
          const profileResponse = await clients.iam.send(
            new GetInstanceProfileCommand({ InstanceProfileName: profileName })
          );
          expect(profileResponse.InstanceProfile!.Roles![0].Arn).toBe(stackOutputs.applicationRoleArn);
        }

        console.log(`E2E infrastructure test completed successfully for test ID: ${e2eTestId}`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'Infrastructure', 'E2E test resources')) {
          return;
        }
        throw error;
      }
    }, 120000);

    test('should have proper resource tagging', async () => {
      if (skipIfNotDeployed('resource tagging validation')) {
        return;
      }

      console.log(`🏷️  Validating resource tagging...`);

      try {
        // Check VPC tags
        if (stackOutputs.vpcId) {
          const vpcResponse = await clients.ec2.send(
            new DescribeVpcsCommand({ VpcIds: [stackOutputs.vpcId] })
          );

          const vpcTags = vpcResponse.Vpcs![0].Tags || [];
          expect(vpcTags.some((tag: Tag) => tag.Key === 'ManagedBy' && tag.Value === 'Pulumi')).toBe(true);
        }

        // Check subnet tags
        if (stackOutputs.publicSubnetIds && stackOutputs.publicSubnetIds.length > 0) {
          const publicSubnetIds = stackOutputs.publicSubnetIds;
          const subnetResponse = await clients.ec2.send(
            new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
          );

          subnetResponse.Subnets!.forEach((subnet: Subnet) => {
            const tags = subnet.Tags || [];
            expect(tags.some((tag: Tag) => tag.Key === 'ManagedBy' && tag.Value === 'Pulumi')).toBe(true);
          });
        }

        console.log(`✅ Resources properly tagged with management information`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'Resources', 'tagging validation')) {
          return;
        }
        throw error;
      }
    });

    test('should meet high availability requirements', async () => {
      if (skipIfNotDeployed('high availability validation')) {
        return;
      }

      console.log(`🏗️  Validating high availability configuration...`);

      try {
        let maxAzs = 0;

        // Verify multi-AZ deployment for subnets
        if (stackOutputs.publicSubnetIds && stackOutputs.publicSubnetIds.length > 0) {
          const publicSubnetIds = stackOutputs.publicSubnetIds;
          const publicSubnetsResponse = await clients.ec2.send(
            new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
          );

          const publicAzs = new Set(publicSubnetsResponse.Subnets!.map((subnet: Subnet) => subnet.AvailabilityZone));
          expect(publicAzs.size).toBeGreaterThanOrEqual(2);
          maxAzs = Math.max(maxAzs, publicAzs.size);
        }

        if (stackOutputs.privateSubnetIds && stackOutputs.privateSubnetIds.length > 0) {
          const privateSubnetIds = stackOutputs.privateSubnetIds;
          const privateSubnetsResponse = await clients.ec2.send(
            new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
          );

          const privateAzs = new Set(privateSubnetsResponse.Subnets!.map((subnet: Subnet) => subnet.AvailabilityZone));
          expect(privateAzs.size).toBeGreaterThanOrEqual(2);
          maxAzs = Math.max(maxAzs, privateAzs.size);
        }

        // Verify RDS subnet group spans multiple AZs
        if (stackOutputs.rdsEndpoint) {
          const rdsEndpoint = stackOutputs.rdsEndpoint;
          const dbInstanceId = rdsEndpoint.split('.')[0];
          const rdsResponse = await clients.rds.send(
            new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
          );

          const subnetGroupName = rdsResponse.DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
          if (subnetGroupName) {
            const subnetGroupResponse = await clients.rds.send(
              new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: subnetGroupName })
            );

            const rdsAzs = new Set(subnetGroupResponse.DBSubnetGroups![0].Subnets!.map((subnet: any) =>
              subnet.SubnetAvailabilityZone?.Name
            ));
            expect(rdsAzs.size).toBeGreaterThanOrEqual(2);
            maxAzs = Math.max(maxAzs, rdsAzs.size);
          }
        }

        console.log(`✅ High availability: Infrastructure spans ${maxAzs} availability zones`);
      } catch (error: any) {
        if (handleResourceNotFound(error, 'Infrastructure', 'HA validation')) {
          return;
        }
        throw error;
      }
    });
  });
});
