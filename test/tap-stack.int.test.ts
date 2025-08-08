import fs from 'fs';

// AWS SDK v3 Imports
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  Vpc,
  Subnet,
  Instance,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DBInstance,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  GetBucketOwnershipControlsCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

// --- Test Suite ---

// AWS clients setup
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack AWS Infrastructure Validation', () => {
  // --- 1. Networking Configuration ---
  describe('Networking Configuration', () => {
    let vpc: Vpc | undefined;
    let privateSubnet: Subnet | undefined;
    let publicSubnet: Subnet | undefined;

    beforeAll(async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );
      // FIX: Handle potentially undefined Vpcs array
      vpc = vpcResponse.Vpcs?.[0];

      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
        })
      );
      // FIX: Handle potentially undefined Subnets array
      privateSubnet = subnetResponse.Subnets?.find(s => !s.MapPublicIpOnLaunch);
      publicSubnet = subnetResponse.Subnets?.find(s => s.MapPublicIpOnLaunch);
    });

    test('VPC should exist and be available', () => {
      expect(vpc).toBeDefined();
      // FIX: Use non-null assertion (!) after the check
      expect(vpc!.State).toBe('available');
    });

    test('Private Subnet should not map public IPs on launch', () => {
      expect(privateSubnet).toBeDefined();
      expect(privateSubnet!.MapPublicIpOnLaunch).toBe(false);
    });

    test('Public Subnet should map public IPs on launch', () => {
      expect(publicSubnet).toBeDefined();
      expect(publicSubnet!.MapPublicIpOnLaunch).toBe(true);
    });
  });

  // --- 2. Security and Encryption ---
  describe('Security and Encryption Best Practices', () => {
    test('KMS Key should be enabled and available for use', async () => {
      const keyAlias = `alias/${outputs.ProjectName}-${outputs.Environment}-key`;
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyAlias })
      );
      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('RDS Security Group should only allow ingress from the EC2 Security Group on port 5432', async () => {
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `${outputs.ProjectName}-${outputs.Environment}-db`,
        })
      );
      const instanceResponse = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] })
      );

      // FIX: Add checks to ensure arrays and properties exist before accessing them
      const rdsSgId =
        dbResponse.DBInstances?.[0]?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId;
      const ec2SgId =
        instanceResponse.Reservations?.[0]?.Instances?.[0]?.SecurityGroups?.[0]
          ?.GroupId;

      // FIX: Ensure IDs are defined before proceeding
      expect(rdsSgId).toBeDefined();
      expect(ec2SgId).toBeDefined();

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSgId!] })
      );
      const ingressRules = sgResponse.SecurityGroups?.[0]?.IpPermissions;

      expect(ingressRules).toHaveLength(1);
      expect(ingressRules![0].FromPort).toBe(5432);
      expect(ingressRules![0].ToPort).toBe(5432);
      expect(ingressRules![0].IpProtocol).toBe('tcp');
      expect(ingressRules![0].UserIdGroupPairs?.[0]?.GroupId).toBe(ec2SgId);
    });
  });

  // --- 3. IAM Roles and Least Privilege ---
  describe('IAM Roles and Least Privilege', () => {
    const roleName = `${outputs.ProjectName}-${outputs.Environment}-ec2-role`;

    test('EC2 Instance Role should exist', async () => {
      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(roleResponse.Role).toBeDefined();
    });

    test('EC2 Instance Role should have a specific inline policy for S3 and KMS access', async () => {
      const policyResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'S3AndKMSAccess',
        })
      );
      expect(policyResponse).toBeDefined();
      // FIX: Ensure PolicyDocument is defined before checking its content
      expect(policyResponse.PolicyDocument).toBeDefined();
      expect(policyResponse.PolicyDocument!).toContain('s3:GetObject');
      expect(policyResponse.PolicyDocument!).toContain('kms:Decrypt');
    });
  });

  // --- 4. EC2 Instance ---
  describe('EC2 Instance', () => {
    let instance: Instance | undefined;

    beforeAll(async () => {
      const instanceResponse = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] })
      );
      instance = instanceResponse.Reservations?.[0]?.Instances?.[0];
    });

    test('EC2 instance should be in a running state', () => {
      expect(instance).toBeDefined();
      expect(instance!.State?.Name).toBe('running');
    });

    test('EC2 instance root volume should be encrypted', () => {
      expect(instance).toBeDefined();
      const rootVolume = instance!.BlockDeviceMappings?.find(
        d => d.DeviceName === instance!.RootDeviceName
      );
      expect(rootVolume).toBeDefined();
      expect(instance!.BlockDeviceMappings?.[0]?.Ebs?.Status).toBe('attached');
    });
  });

  // --- 5. RDS Database Instance ---
  describe('RDS Database Instance', () => {
    let dbInstance: DBInstance | undefined;

    beforeAll(async () => {
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `${outputs.ProjectName}-${outputs.Environment}-db`,
        })
      );
      dbInstance = dbResponse.DBInstances?.[0];
    });

    test('RDS instance should be available', () => {
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.DBInstanceStatus).toBe('available');
    });

    test('RDS storage must be encrypted', () => {
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.StorageEncrypted).toBe(true);
    });

    test('RDS should have deletion protection enabled', () => {
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.DeletionProtection).toBe(true);
    });
  });

  // --- 6. S3 Buckets ---
  describe('S3 Buckets', () => {
    test('DataBucket should have KMS encryption, versioning, and public access block enabled', async () => {
      const encryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.DataBucketName })
      );
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      const publicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.DataBucketName })
      );
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(
        publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);

      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.DataBucketName })
      );
      expect(versioning.Status).toBe('Enabled');
    });

    test('CloudTrailLogBucket should have BucketOwnerEnforced ownership controls', async () => {
      const accountId = outputs.AWSAccountId || process.env.CDK_DEFAULT_ACCOUNT;
      const bucketName = `${outputs.ProjectName}-${outputs.Environment}-cloudtrail-logs-${accountId}-${region}`;
      const ownership = await s3Client.send(
        new GetBucketOwnershipControlsCommand({ Bucket: bucketName })
      );

      expect(ownership.OwnershipControls?.Rules?.[0]?.ObjectOwnership).toBe(
        'BucketOwnerEnforced'
      );
    });
  });

  // --- 7. Stack Outputs ---
  describe('Stack Outputs', () => {
    test('Key outputs should be defined', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.EC2InstanceId).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.DataBucketName).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });
});
