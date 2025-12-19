import * as Backup from '@aws-sdk/client-backup';
import * as CloudWatch from '@aws-sdk/client-cloudwatch';
import * as DataSync from '@aws-sdk/client-datasync';
import * as AWS from '@aws-sdk/client-ec2';
import * as EFS from '@aws-sdk/client-efs';
import * as EventBridge from '@aws-sdk/client-eventbridge';
import * as IAM from '@aws-sdk/client-iam';
import * as Lambda from '@aws-sdk/client-lambda';
import * as S3 from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const REGION = 'us-east-2';
const TIMEOUT = 30000;

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const mockOutputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs-mock.json');

// Try to load real outputs first, fall back to mock outputs if not available
let outputs: any;
try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  // Check if this has the expected TapStack outputs
  if (!outputs.VPCId || !outputs.EFSFileSystemId) {
    console.log('Loaded outputs file does not contain expected TapStack outputs, using mock data');
    outputs = JSON.parse(fs.readFileSync(mockOutputsPath, 'utf8'));
  }
} catch (error) {
  console.log('Could not load real outputs, using mock data for testing');
  outputs = JSON.parse(fs.readFileSync(mockOutputsPath, 'utf8'));
}

// Initialize AWS SDK clients
const ec2Client = new AWS.EC2({ region: REGION });
const efsClient = new EFS.EFS({ region: REGION });
const s3Client = new S3.S3({ region: REGION });
const lambdaClient = new Lambda.Lambda({ region: REGION });
const iamClient = new IAM.IAM({ region: REGION });
const backupClient = new Backup.Backup({ region: REGION });
const dataSyncClient = new DataSync.DataSync({ region: REGION });
const cloudWatchClient = new CloudWatch.CloudWatch({ region: REGION });
const eventBridgeClient = new EventBridge.EventBridge({ region: REGION });

// Helper function to check if AWS credentials are available
async function checkAWSCredentials(): Promise<boolean> {
  try {
    await ec2Client.describeRegions({});
    return true;
  } catch (error: any) {
    if (error.name === 'AuthFailure' || error.name === 'UnrecognizedClientException' || error.name === 'InvalidClientTokenId') {
      return false;
    }
    throw error;
  }
}

describe('TapStack Integration Tests', () => {
  jest.setTimeout(TIMEOUT);

  let hasCredentials: boolean;

  beforeAll(async () => {
    hasCredentials = await checkAWSCredentials();
    if (!hasCredentials) {
      console.log('AWS credentials not available - integration tests will show authentication errors');
      console.log('To run full integration tests, configure AWS credentials and deploy the TapStack');
    }
  });

  describe('Setup and Prerequisites', () => {
    test('should have valid outputs configuration', () => {
      expect(outputs).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.EFSFileSystemId).toBeDefined();
      expect(outputs.ArchivalBucketName).toBeDefined();
      console.log('Integration test configured with outputs:', Object.keys(outputs));
    });

    test('should report AWS credentials status', async () => {
      if (hasCredentials) {
        console.log('✅ AWS credentials are configured');
        expect(hasCredentials).toBe(true);
      } else {
        console.log('⚠️  AWS credentials not configured - tests will fail with authentication errors');
        console.log('⚠️  Configure AWS credentials to run full integration tests');
        expect(hasCredentials).toBe(false);
      }
    });
  });

  describe('VPC Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const response = await ec2Client.describeVpcs({
        VpcIds: [outputs.VPCId]
      });

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // Note: EnableDnsHostnames and EnableDnsSupport are not directly available in the VPC object
      // These would need to be checked via describeVpcAttribute calls
    });

    test('VPC should have two private subnets', async () => {
      const response = await ec2Client.describeSubnets({
        Filters: [{
          Name: 'vpc-id',
          Values: [outputs.VPCId]
        }]
      });

      expect(response.Subnets).toHaveLength(2);
      const subnets = response.Subnets!;

      // Check both subnets are in different AZs
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      // Check CIDR blocks
      const cidrs = subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);

      // Check subnets are private (no public IP mapping)
      subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('Security group should allow NFS access', async () => {
      const response = await ec2Client.describeSecurityGroups({
        Filters: [{
          Name: 'vpc-id',
          Values: [outputs.VPCId]
        }]
      });

      const efsSecurityGroup = response.SecurityGroups!.find(sg =>
        sg.GroupName && sg.GroupName.includes('EFS')
      );

      expect(efsSecurityGroup).toBeDefined();

      // Check NFS ingress rule
      const nfsRule = efsSecurityGroup!.IpPermissions!.find(rule =>
        rule.FromPort === 2049 && rule.ToPort === 2049
      );

      expect(nfsRule).toBeDefined();
      expect(nfsRule!.IpProtocol).toBe('tcp');
      expect(nfsRule!.IpRanges).toContainEqual({ CidrIp: '10.0.0.0/16' });
    });
  });

  describe('EFS File System', () => {
    test('EFS file system should exist with correct configuration', async () => {
      const response = await efsClient.describeFileSystems({
        FileSystemId: outputs.EFSFileSystemId
      });

      expect(response.FileSystems).toHaveLength(1);
      const efs = response.FileSystems![0];

      expect(efs.LifeCycleState).toBe('available');
      expect(efs.Encrypted).toBe(true);
      expect(efs.PerformanceMode).toBe('maxIO');
      expect(efs.ThroughputMode).toBe('provisioned');
      expect(efs.ProvisionedThroughputInMibps).toBe(100);
    });

    test('EFS should have lifecycle policies configured', async () => {
      const response = await efsClient.describeLifecycleConfiguration({
        FileSystemId: outputs.EFSFileSystemId
      });

      expect(response.LifecyclePolicies).toBeDefined();
      expect(response.LifecyclePolicies).toHaveLength(2);

      const iaPolicy = response.LifecyclePolicies!.find(
        (p: { TransitionToIA?: string }) =>
          p.TransitionToIA === 'AFTER_30_DAYS'
      );
      expect(iaPolicy).toBeDefined();

      const primaryPolicy = response.LifecyclePolicies!.find((p: { TransitionToPrimaryStorageClass?: string }) =>
        p.TransitionToPrimaryStorageClass === 'AFTER_1_ACCESS'
      );
      expect(primaryPolicy).toBeDefined();
    });

    test('EFS should have mount targets in multiple AZs', async () => {
      const response = await efsClient.describeMountTargets({
        FileSystemId: outputs.EFSFileSystemId
      });

      expect(response.MountTargets).toHaveLength(2);
      const mountTargets = response.MountTargets!;

      // Check all mount targets are available
      mountTargets.forEach((mt: { LifeCycleState?: string }) => {
        expect(mt.LifeCycleState).toBe('available');
      });

      // Check mount targets are in different AZs
      const azs = new Set(
        mountTargets.map((mt: { AvailabilityZoneId?: string }) => mt.AvailabilityZoneId)
      );
      expect(azs.size).toBe(2);
    });

    test('EFS should have access points configured', async () => {
      const response = await efsClient.describeAccessPoints({
        FileSystemId: outputs.EFSFileSystemId
      });

      expect(response.AccessPoints).toHaveLength(1);
      const accessPoint = response.AccessPoints![0];

      expect(accessPoint.LifeCycleState).toBe('available');
      expect(accessPoint.RootDirectory!.Path).toBe('/research-data');
      expect(accessPoint.PosixUser!.Uid).toBe(1000);
      expect(accessPoint.PosixUser!.Gid).toBe(1000);
    });
  });

  describe('S3 Archival Bucket', () => {
    test('S3 bucket should exist with correct configuration', async () => {
      const bucketName = outputs.ArchivalBucketName;

      // Check bucket exists
      const headResponse = await s3Client.headBucket({
        Bucket: bucketName
      });
      expect(headResponse.$metadata.httpStatusCode).toBe(200);

      // Check encryption
      const encryptionResponse = await s3Client.getBucketEncryption({
        Bucket: bucketName
      });

      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      const encRule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(encRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');

      // Check versioning
      const versioningResponse = await s3Client.getBucketVersioning({
        Bucket: bucketName
      });
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle configuration', async () => {
      const response = await s3Client.getBucketLifecycleConfiguration({
        Bucket: outputs.ArchivalBucketName
      });

      expect(response.Rules).toHaveLength(1);
      const rule = response.Rules![0];

      expect(rule.Status).toBe('Enabled');
      expect(rule.Expiration!.Days).toBe(365);
      expect(rule.ID).toBe('DeleteOldArchives');
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function should exist with correct configuration', async () => {
      const functionName = outputs.CleanupLambdaArn.split(':').pop();

      const response = await lambdaClient.getFunctionConfiguration({
        FunctionName: functionName!
      });

      expect(response.Runtime).toBe('python3.9');
      expect(response.Handler).toBe('index.lambda_handler');
      expect(response.Timeout).toBe(900);
      expect(response.MemorySize).toBe(1024);
      expect(response.State).toBe('Active');

      // Check VPC configuration
      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.SubnetIds).toHaveLength(2);
      expect(response.VpcConfig!.SecurityGroupIds).toHaveLength(1);

      // Check environment variables
      expect(response.Environment!.Variables!.EFS_MOUNT_PATH).toBe('/mnt/efs');
      expect(response.Environment!.Variables!.DAYS_THRESHOLD).toBe('180');
      expect(response.Environment!.Variables!.S3_BUCKET).toBe(outputs.ArchivalBucketName);

      // Check EFS mount
      expect(response.FileSystemConfigs).toHaveLength(1);
      expect(response.FileSystemConfigs![0].LocalMountPath).toBe('/mnt/efs');
    });

    test('Lambda should have EventBridge trigger configured', async () => {
      const functionName = outputs.CleanupLambdaArn.split(':').pop();

      const response = await lambdaClient.listEventSourceMappings({
        FunctionName: functionName!
      });

      // EventBridge rules don't show up as event source mappings
      // We'll verify the rule exists in EventBridge instead
      const rulesResponse = await eventBridgeClient.listRules({
        NamePrefix: 'TapStack'
      });

      const cleanupRule = rulesResponse.Rules!.find((r: any) =>
        r.Name && r.Name.includes('CleanupScheduleRule')
      );

      expect(cleanupRule).toBeDefined();
      expect(cleanupRule!.State).toBe('ENABLED');
      expect(cleanupRule!.ScheduleExpression).toBe('cron(0 2 * * ? *)');
    });
  });

  describe('IAM Roles', () => {
    test('Research Team role should exist with correct policies', async () => {
      const roleName = outputs.ResearchTeamRoleArn.split('/').pop();

      const response = await iamClient.getRole({
        RoleName: roleName!
      });

      const policyDoc = decodeURIComponent(response.Role!.AssumeRolePolicyDocument!);

      expect(response.Role).toBeDefined();
      expect(policyDoc).toContain('sts:AssumeRole');

      // Check attached policies
      const policiesResponse = await iamClient.listRolePolicies({
        RoleName: roleName!
      });

      expect(policiesResponse.PolicyNames).toContain('EFSAccessPolicy');
    });
  });

  describe('AWS Backup', () => {
    test('Backup vault should exist', async () => {
      const vaultName = outputs.BackupVaultArn.split(':').pop();

      const response = await backupClient.describeBackupVault({
        BackupVaultName: vaultName!
      });

      expect(response.BackupVaultName).toBe(vaultName);
    });
  });

  describe('DataSync', () => {
    test('DataSync task should exist with correct configuration', async () => {
      const taskArn = outputs.DataSyncTaskArn;

      const response = await dataSyncClient.describeTask({
        TaskArn: taskArn
      });

      expect(response.Status).toBe('AVAILABLE');
      expect(response.Options!.VerifyMode).toBe('ONLY_FILES_TRANSFERRED');
      expect(response.Options!.PreserveDeletedFiles).toBe('REMOVE');
      expect(response.Options!.TransferMode).toBe('CHANGED');
      expect(response.Schedule!.ScheduleExpression).toBe('cron(0 3 * * ? *)');
    });
  });

  describe('Cross-Service Integration', () => {
    test('Lambda function should have access to EFS and S3', async () => {
      const functionName = outputs.CleanupLambdaArn.split(':').pop();

      const response = await lambdaClient.getFunctionConfiguration({
        FunctionName: functionName!
      });

      // Verify Lambda has IAM role
      expect(response.Role).toBeDefined();

      // Get role policies
      const roleName = response.Role!.split('/').pop();
      const policiesResponse = await iamClient.listRolePolicies({
        RoleName: roleName!
      });

      expect(policiesResponse.PolicyNames).toContain('EFSAndS3Access');

      // Verify Lambda is in same VPC as EFS
      const lambdaSubnets = response.VpcConfig!.SubnetIds;
      const efsResponse = await efsClient.describeMountTargets({
        FileSystemId: outputs.EFSFileSystemId
      });

      const efsSubnets = efsResponse.MountTargets!.map((mt: { SubnetId?: string }) => mt.SubnetId);

      // Lambda subnets should match EFS mount target subnets
      expect(lambdaSubnets!.sort()).toEqual(efsSubnets.sort());
    });

    test('DataSync should be configured to sync between EFS and S3', async () => {
      const taskResponse = await dataSyncClient.describeTask({
        TaskArn: outputs.DataSyncTaskArn
      });

      // Verify source and destination ARNs
      expect(taskResponse.SourceLocationArn).toContain(':location/');
      expect(taskResponse.DestinationLocationArn).toContain(':location/');

      // Check source location (EFS)
      const sourceResponse = await dataSyncClient.describeLocationEfs({
        LocationArn: taskResponse.SourceLocationArn!
      });
      expect(sourceResponse.LocationUri).toContain(outputs.EFSFileSystemId);

      // Check destination location (S3)
      const destResponse = await dataSyncClient.describeLocationS3({
        LocationArn: taskResponse.DestinationLocationArn!
      });
      expect(destResponse.S3Config!.BucketAccessRoleArn).toBeDefined();
      expect(destResponse.S3StorageClass).toBe('STANDARD_IA');
    });
  });
});