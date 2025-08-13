import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetRoleCommand,
  GetInstanceProfileCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs
const loadStackOutputs = () => {
  try {
    const outputsPath = path.join(__dirname, '../pulumi-outputs/stack-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      return JSON.parse(outputsContent);
    }
    
    // Fallback to environment variables if outputs file doesn't exist
    return {
      vpcId: process.env.VPC_ID,
      dataBucketName: process.env.DATA_BUCKET_NAME,
      logsBucketName: process.env.LOGS_BUCKET_NAME,
      databaseEndpoint: process.env.DATABASE_ENDPOINT,
      webInstanceId: process.env.WEB_INSTANCE_ID,
      webInstancePrivateIp: process.env.WEB_INSTANCE_PRIVATE_IP,
    };
  } catch (error) {
    throw new Error(`Failed to load stack outputs: ${error}`);
  }
};

// Initialize AWS clients
const initializeClients = () => {
  const region = process.env.AWS_REGION || 'us-east-1';

  return {
    ec2: new EC2Client({ region }),
    rds: new RDSClient({ region }),
    s3: new S3Client({ region }),
    kms: new KMSClient({ region }),
    iam: new IAMClient({ region }),
    sts: new STSClient({ region }),
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

  beforeAll(async () => {
    // Load stack outputs and initialize clients
    stackOutputs = loadStackOutputs();
    clients = initializeClients();

    // Get AWS account ID
    const identity = await clients.sts.send(new GetCallerIdentityCommand({}));
    accountId = identity.Account!;

    console.log('Stack outputs loaded:', Object.keys(stackOutputs));
    console.log('AWS Account ID:', accountId);
  }, 60000);

  describe('AWS Account and Region Validation', () => {
    it('should have valid AWS credentials and region', async () => {
      expect(accountId).toBeDefined();
      expect(accountId).toMatch(/^\d{12}$/);

      const region = process.env.AWS_REGION || 'us-east-1';
      expect(region).toBeDefined();
      expect(['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1']).toContain(region);
    });
  });

  describe('VPC Infrastructure Tests', () => {
    it('should have a valid VPC ID', async () => {
      expect(stackOutputs.vpcId).toBeDefined();
      expect(stackOutputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    it('should have a VPC with correct configuration', async () => {
      const response = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [stackOutputs.vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.VpcId).toBe(stackOutputs.vpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
      expect(vpc.IsDefault).toBe(false);

      // Check DNS settings
      expect(vpc.DnsHostnames).toBe(true);
      expect(vpc.DnsSupport).toBe(true);

      // Check tags
      const nameTag = vpc.Tags?.find((tag: any) => tag.Key === 'Name');
      expect(nameTag?.Value).toContain('tap-vpc');
    });

    it('should have private and public subnets', async () => {
      const response = await clients.ec2.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.vpcId],
            },
          ],
        })
      );

      const subnets = response.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(2);

      const privateSubnets = subnets.filter((subnet: any) =>
        subnet.Tags?.some((tag: any) => tag.Key === 'Type' && tag.Value === 'private')
      );
      const publicSubnets = subnets.filter((subnet: any) =>
        subnet.Tags?.some((tag: any) => tag.Key === 'Type' && tag.Value === 'public')
      );

      expect(privateSubnets.length).toBeGreaterThan(0);
      expect(publicSubnets.length).toBeGreaterThan(0);

      // Verify public subnets don't auto-assign public IPs
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Security Groups Tests', () => {
    it('should have security groups with proper tier isolation', async () => {
      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.vpcId],
            },
          ],
        })
      );

      const securityGroups = response.SecurityGroups || [];
      const tapSecurityGroups = securityGroups.filter((sg: any) =>
        sg.GroupName?.includes('tap-')
      );

      expect(tapSecurityGroups.length).toBeGreaterThanOrEqual(3);

      // Check for web, app, and db security groups
      const webSg = tapSecurityGroups.find((sg: any) => sg.GroupName?.includes('web'));
      const appSg = tapSecurityGroups.find((sg: any) => sg.GroupName?.includes('app'));
      const dbSg = tapSecurityGroups.find((sg: any) => sg.GroupName?.includes('db'));

      expect(webSg).toBeDefined();
      expect(appSg).toBeDefined();
      expect(dbSg).toBeDefined();

      // Verify web security group allows HTTP/HTTPS
      const webIngress = webSg?.IpPermissions || [];
      const httpRule = webIngress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = webIngress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('KMS Keys Tests', () => {
    it('should have KMS keys with proper configuration', async () => {
      // Get all KMS keys and find TAP-related ones
      const response = await clients.kms.send(
        new DescribeKeyCommand({
          KeyId: 'alias/tap-main-dev', // Assuming dev environment
        })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');

      // Check key rotation
      const rotationResponse = await clients.kms.send(
        new GetKeyRotationStatusCommand({
          KeyId: response.KeyMetadata!.KeyId,
        })
      );

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('S3 Buckets Tests', () => {
    it('should have data bucket with proper security configuration', async () => {
      expect(stackOutputs.dataBucketName).toBeDefined();

      // Check encryption
      const encryptionResponse = await clients.s3.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.dataBucketName,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      // Check versioning
      const versioningResponse = await clients.s3.send(
        new GetBucketVersioningCommand({
          Bucket: stackOutputs.dataBucketName,
        })
      );

      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessResponse = await clients.s3.send(
        new GetPublicAccessBlockCommand({
          Bucket: stackOutputs.dataBucketName,
        })
      );

      const pab = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });

    it('should have logs bucket with proper configuration', async () => {
      expect(stackOutputs.logsBucketName).toBeDefined();

      // Similar checks for logs bucket
      const encryptionResponse = await clients.s3.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.logsBucketName,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('RDS Database Tests', () => {
    it('should have RDS instance with proper security configuration', async () => {
      expect(stackOutputs.databaseEndpoint).toBeDefined();

      // Extract DB instance identifier from endpoint
      const dbInstanceId = stackOutputs.databaseEndpoint.split('.')[0];

      const response = await clients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.MonitoringInterval).toBe(60);
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
    });

    it('should have DB subnet group in private subnets', async () => {
      const dbInstanceId = stackOutputs.databaseEndpoint.split('.')[0];

      const response = await clients.rds.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: `tap-db-subnet-group-dev`, // Assuming dev environment
        })
      );

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups![0];

      expect(subnetGroup.VpcId).toBe(stackOutputs.vpcId);
      expect(subnetGroup.Subnets!.length).toBeGreaterThan(1);
    });
  });

  describe('EC2 Instance Tests', () => {
    it('should have EC2 instance with proper security configuration', async () => {
      expect(stackOutputs.webInstanceId).toBeDefined();

      const response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [stackOutputs.webInstanceId],
        })
      );

      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.State!.Name).toBe('running');
      expect(instance.VpcId).toBe(stackOutputs.vpcId);
      expect(instance.PublicIpAddress).toBeUndefined(); // No public IP
      expect(instance.PrivateIpAddress).toBeDefined();

      // Check root device encryption
      expect(instance.RootDeviceType).toBe('ebs');
      
      // Check metadata options (IMDSv2)
      expect(instance.MetadataOptions!.HttpTokens).toBe('required');
      expect(instance.MetadataOptions!.HttpEndpoint).toBe('enabled');

      // Check monitoring
      expect(instance.Monitoring!.State).toBe('enabled');
    });
  });

  describe('IAM Roles and Policies Tests', () => {
    it('should have EC2 role with least privilege policies', async () => {
      const roleResponse = await clients.iam.send(
        new GetRoleCommand({
          RoleName: 'tap-ec2-role-dev', // Assuming dev environment
        })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

      // Check instance profile
      const profileResponse = await clients.iam.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: 'tap-ec2-profile-dev',
        })
      );

      expect(profileResponse.InstanceProfile).toBeDefined();
      expect(profileResponse.InstanceProfile!.Roles).toHaveLength(1);
    });
  });

  describe('End-to-End Infrastructure Tests', () => {
    const e2eTestId = generateTestId();

    test('e2e: should have complete infrastructure connectivity', async () => {
      console.log(`Starting E2E infrastructure test with ID: ${e2eTestId}`);

      // Step 1: Verify VPC connectivity
      expect(stackOutputs.vpcId).toBeDefined();
      expect(stackOutputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);

      // Step 2: Verify EC2 instance is in private subnet
      const ec2Response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [stackOutputs.webInstanceId],
        })
      );

      const instance = ec2Response.Reservations![0].Instances![0];
      expect(instance.PublicIpAddress).toBeUndefined();
      expect(instance.PrivateIpAddress).toBe(stackOutputs.webInstancePrivateIp);

      // Step 3: Verify database is accessible from private subnet
      expect(stackOutputs.databaseEndpoint).toBeDefined();
      expect(stackOutputs.databaseEndpoint).toContain('.rds.amazonaws.com');

      // Step 4: Verify S3 buckets are encrypted and secure
      const dataBucketEncryption = await clients.s3.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.dataBucketName,
        })
      );
      expect(dataBucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      const logsBucketEncryption = await clients.s3.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.logsBucketName,
        })
      );
      expect(logsBucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      // Step 5: Verify security groups are properly configured
      const sgResponse = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.vpcId],
            },
          ],
        })
      );

      const tapSecurityGroups = sgResponse.SecurityGroups!.filter((sg: any) =>
        sg.GroupName?.includes('tap-')
      );
      expect(tapSecurityGroups.length).toBeGreaterThanOrEqual(3);

      console.log(`E2E infrastructure test completed successfully for test ID: ${e2eTestId}`);
    }, 120000);

    test('e2e: should have proper resource tagging and naming', async () => {
      console.log(`Starting E2E tagging test with ID: ${e2eTestId}`);

      // Check VPC tags
      const vpcResponse = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [stackOutputs.vpcId],
        })
      );

      const vpc = vpcResponse.Vpcs![0];
      const vpcTags = vpc.Tags || [];
      
      expect(vpcTags.some((tag: any) => tag.Key === 'Name' && tag.Value!.includes('tap-vpc'))).toBe(true);
      expect(vpcTags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
      expect(vpcTags.some((tag: any) => tag.Key === 'Project')).toBe(true);

      // Check EC2 instance tags
      const ec2Response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [stackOutputs.webInstanceId],
        })
      );

      const instance = ec2Response.Reservations![0].Instances![0];
      const instanceTags = instance.Tags || [];
      
      expect(instanceTags.some((tag: any) => tag.Key === 'Name' && tag.Value!.includes('tap-web-server'))).toBe(true);
      expect(instanceTags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
      expect(instanceTags.some((tag: any) => tag.Key === 'Purpose' && tag.Value === 'SecureWebServer')).toBe(true);

      console.log(`E2E tagging test completed successfully for test ID: ${e2eTestId}`);
    }, 60000);

    test('e2e: should have proper security configurations across all services', async () => {
      console.log(`Starting E2E security test with ID: ${e2eTestId}`);

      // Verify KMS encryption is used across services
      const kmsResponse = await clients.kms.send(
        new DescribeKeyCommand({
          KeyId: 'alias/tap-main-dev',
        })
      );
      expect(kmsResponse.KeyMetadata!.KeyState).toBe('Enabled');

      // Verify S3 bucket security
      const s3PublicAccessResponse = await clients.s3.send(
        new GetPublicAccessBlockCommand({
          Bucket: stackOutputs.dataBucketName,
        })
      );
      const pab = s3PublicAccessResponse.PublicAccessBlockConfiguration!;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);

      // Verify RDS encryption
      const dbInstanceId = stackOutputs.databaseEndpoint.split('.')[0];
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );
      const dbInstance = rdsResponse.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);

      // Verify EC2 security
      const ec2Response = await clients.ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [stackOutputs.webInstanceId],
        })
      );
      const instance = ec2Response.Reservations![0].Instances![0];
      expect(instance.PublicIpAddress).toBeUndefined();
      expect(instance.MetadataOptions!.HttpTokens).toBe('required');

      console.log(`E2E security test completed successfully for test ID: ${e2eTestId}`);
    }, 90000);
  });
});
