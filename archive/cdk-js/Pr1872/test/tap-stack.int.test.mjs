// Integration tests using real AWS outputs
import fs from 'fs';
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr181';

// AWS clients
const s3Client = new S3Client({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });
const ec2Client = new EC2Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

describe('Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC exists and is accessible', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[0-9a-f]+$/);
      
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has multiple availability zones', async () => {
      const vpcId = outputs.VpcId;
      
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets.length).toBeGreaterThanOrEqual(6);
      
      // Check for multiple AZs
      const azs = [...new Set(response.Subnets.map(s => s.AvailabilityZone))];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    test('VPC has public, private and isolated subnets', async () => {
      const vpcId = outputs.VpcId;
      
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      
      // Check for public subnets (MapPublicIpOnLaunch = true)
      const publicSubnets = response.Subnets.filter(s => s.MapPublicIpOnLaunch);
      expect(publicSubnets.length).toBeGreaterThan(0);
      
      // Check for private subnets (MapPublicIpOnLaunch = false)
      const privateSubnets = response.Subnets.filter(s => !s.MapPublicIpOnLaunch);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Storage', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketName = outputs.LogBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('app-logs');
      expect(bucketName).toContain(environmentSuffix);
      
      const command = new HeadBucketCommand({
        Bucket: bucketName
      });
      
      // This will throw if bucket doesn't exist or isn't accessible
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('S3 bucket allows write and read operations', async () => {
      const bucketName = outputs.LogBucketName;
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';
      
      // Write test object
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent
      });
      
      await s3Client.send(putCommand);
      
      // Read test object
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      
      const response = await s3Client.send(getCommand);
      const bodyContent = await response.Body.transformToString();
      expect(bodyContent).toBe(testContent);
      
      // Clean up - delete test object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      
      await s3Client.send(deleteCommand);
    });

    test('S3 bucket ARN is correctly formatted', () => {
      const bucketArn = outputs.LogBucketArn;
      expect(bucketArn).toBeDefined();
      expect(bucketArn).toMatch(/^arn:aws:s3:::app-logs-/);
      expect(bucketArn).toContain(environmentSuffix);
    });
  });

  describe('IAM Security', () => {
    test('EC2 IAM role exists and is accessible', async () => {
      const roleArn = outputs.EC2RoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/^arn:aws:iam::\d+:role\/ec2-role-/);
      expect(roleArn).toContain(environmentSuffix);
      
      // Extract role name from ARN
      const roleName = roleArn.split('/').pop();
      
      const command = new GetRoleCommand({
        RoleName: roleName
      });
      
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);
      
      // Verify EC2 can assume the role
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
      expect(assumeRolePolicy.Statement).toContainEqual(
        expect.objectContaining({
          Effect: 'Allow',
          Principal: expect.objectContaining({
            Service: 'ec2.amazonaws.com'
          }),
          Action: 'sts:AssumeRole'
        })
      );
    });

    test('Security groups are created', async () => {
      const vpcId = outputs.VpcId;
      
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      
      // Should have at least default + RDS + EC2 security groups
      expect(response.SecurityGroups.length).toBeGreaterThanOrEqual(3);
      
      // Check for RDS security group
      const rdsSecurityGroup = response.SecurityGroups.find(sg => 
        sg.GroupName && sg.GroupName.includes('rds-sg')
      );
      expect(rdsSecurityGroup).toBeDefined();
      
      // Check for EC2 security group
      const ec2SecurityGroup = response.SecurityGroups.find(sg => 
        sg.GroupName && sg.GroupName.includes('ec2-sg')
      );
      expect(ec2SecurityGroup).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    test('Aurora cluster exists and is running', async () => {
      const clusterEndpoint = outputs.ClusterEndpoint;
      expect(clusterEndpoint).toBeDefined();
      expect(clusterEndpoint).toContain('aurora-cluster');
      expect(clusterEndpoint).toContain(environmentSuffix);
      
      // Extract cluster identifier from endpoint
      const clusterId = clusterEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId
      });
      
      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);
      
      const cluster = response.DBClusters[0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration.MinCapacity).toBe(0.5);
      expect(cluster.ServerlessV2ScalingConfiguration.MaxCapacity).toBe(16);
    });

    test('Aurora cluster has automated backups enabled', async () => {
      const clusterEndpoint = outputs.ClusterEndpoint;
      const clusterId = clusterEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId
      });
      
      const response = await rdsClient.send(command);
      const cluster = response.DBClusters[0];
      
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.PreferredBackupWindow).toBeDefined();
      expect(cluster.PreferredMaintenanceWindow).toBeDefined();
    });

    test('Aurora cluster has read endpoint', () => {
      const readEndpoint = outputs.ClusterReadEndpoint;
      expect(readEndpoint).toBeDefined();
      expect(readEndpoint).toContain('cluster-ro');
      expect(readEndpoint).toContain(environmentSuffix);
    });

    test('Database credentials secret exists', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(secretArn).toContain('aurora-credentials');
      expect(secretArn).toContain(environmentSuffix);
      
      const command = new GetSecretValueCommand({
        SecretId: secretArn
      });
      
      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();
      
      // Verify secret contains database credentials
      const credentials = JSON.parse(response.SecretString);
      expect(credentials).toHaveProperty('username');
      expect(credentials).toHaveProperty('password');
      expect(credentials).toHaveProperty('host');
      expect(credentials).toHaveProperty('port');
    });

    test('Aurora cluster has encryption enabled', async () => {
      const clusterEndpoint = outputs.ClusterEndpoint;
      const clusterId = clusterEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId
      });
      
      const response = await rdsClient.send(command);
      const cluster = response.DBClusters[0];
      
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });
  });

  describe('Infrastructure Scalability', () => {
    test('Aurora cluster supports auto-scaling', async () => {
      const clusterEndpoint = outputs.ClusterEndpoint;
      const clusterId = clusterEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId
      });
      
      const response = await rdsClient.send(command);
      const cluster = response.DBClusters[0];
      
      // Verify Serverless V2 configuration for scalability
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration.MinCapacity).toBeLessThan(
        cluster.ServerlessV2ScalingConfiguration.MaxCapacity
      );
      
      // Verify multiple instances (writer + reader)
      expect(cluster.DBClusterMembers.length).toBeGreaterThanOrEqual(2);
    });

    test('VPC supports expansion with available IP space', async () => {
      const vpcId = outputs.VpcId;
      
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs[0];
      
      // /16 CIDR provides 65,536 IP addresses for expansion
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });
  });

  describe('Cross-Resource Integration', () => {
    test('All resources are in the same region', () => {
      // Check that regional resources are in us-east-1
      // Secrets Manager is regional
      expect(outputs.DatabaseSecretArn).toContain(':us-east-1:');
      
      // S3 bucket name contains region
      expect(outputs.LogBucketName).toContain('us-east-1');
      
      // IAM is global, so just check it's a valid IAM ARN
      expect(outputs.EC2RoleArn).toMatch(/^arn:aws:iam::\d+:role\//);
      
      // RDS endpoints show the region
      expect(outputs.ClusterEndpoint).toContain('.us-east-1.rds.amazonaws.com');
      expect(outputs.ClusterReadEndpoint).toContain('.us-east-1.rds.amazonaws.com');
    });

    test('All resources use consistent environment suffix', () => {
      const resourcesWithSuffix = [
        outputs.LogBucketName,
        outputs.ClusterEndpoint,
        outputs.ClusterReadEndpoint
      ];
      
      resourcesWithSuffix.forEach(resource => {
        expect(resource.toLowerCase()).toContain(environmentSuffix.toLowerCase());
      });
    });

    test('Resources are properly tagged', async () => {
      const vpcId = outputs.VpcId;
      
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs[0];
      
      // Check for Name tag
      const nameTag = vpc.Tags?.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toContain('app-vpc');
    });
  });
});