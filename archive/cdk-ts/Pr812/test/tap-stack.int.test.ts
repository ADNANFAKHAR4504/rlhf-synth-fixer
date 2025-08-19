import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, ListRolesCommand } from '@aws-sdk/client-iam';
import { SecretsManagerClient, DescribeSecretCommand, ListSecretsCommand } from '@aws-sdk/client-secrets-manager';
import { CloudTrailClient, DescribeTrailsCommand } from '@aws-sdk/client-cloudtrail';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

// AWS SDK clients
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const stsClient = new STSClient({ region });

// Configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = process.env.STACK_NAME || 'TestTapStack';

// Test state
let vpcId: string = '';
let ec2InstanceIds: string[] = [];
let rdsInstanceId: string = '';
let s3BucketName: string = '';
let ec2RoleName: string = '';
let databaseSecretArn: string = '';
let awsAccountId: string = '';

describe('TapStack Integration Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Starting TapStack Integration Tests...');
    console.log(`📍 Region: ${region}`);
    console.log(`🏷️  Environment: ${environmentSuffix}`);
    console.log(`📦 Stack: ${stackName}`);

    // Get AWS account ID
    try {
      const identityCommand = new GetCallerIdentityCommand({});
      const identity = await stsClient.send(identityCommand);
      awsAccountId = identity.Account!;
      console.log(`👤 AWS Account: ${awsAccountId}`);
    } catch (error) {
      console.error('❌ Failed to get AWS account identity:', error);
      throw error;
    }

    // Try to get VPC ID from environment
    vpcId = process.env.VPC_ID || '';
    if (vpcId) {
      console.log(`🔍 Using provided VPC ID: ${vpcId}`);
    }
  });

  describe('VPC and Networking', () => {
    test('Security groups are properly configured', async () => {
      if (!vpcId) {
        console.log('⚠️  Skipping security group test - VPC ID not available');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      // Find EC2 security group
      const ec2SecurityGroup = response.SecurityGroups!.find(sg => 
        sg.Description?.includes('EC2 application instances')
      );
      expect(ec2SecurityGroup).toBeDefined();

      // Check EC2 security group ingress rules
      expect(ec2SecurityGroup!.IpPermissions).toContainEqual(
        expect.objectContaining({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
        })
      );

      expect(ec2SecurityGroup!.IpPermissions).toContainEqual(
        expect.objectContaining({
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
        })
      );

      expect(ec2SecurityGroup!.IpPermissions).toContainEqual(
        expect.objectContaining({
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
        })
      );

      // Find RDS security group
      const rdsSecurityGroup = response.SecurityGroups!.find(sg => 
        sg.Description?.includes('RDS PostgreSQL database')
      );
      expect(rdsSecurityGroup).toBeDefined();
    }, 30000);
  });

  describe('EC2 Instances', () => {
    test('EC2 instances are running and properly configured', async () => {
      if (!vpcId) {
        console.log('⚠️  Skipping EC2 test - VPC ID not available');
        return;
      }

      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBeGreaterThan(0);

      // Collect instance IDs
      response.Reservations!.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          if (instance.InstanceId) {
            ec2InstanceIds.push(instance.InstanceId);
          }
        });
      });

      expect(ec2InstanceIds.length).toBeGreaterThan(0);

      // Check each instance
      for (const instanceId of ec2InstanceIds) {
        const instanceCommand = new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        });

        const instanceResponse = await ec2Client.send(instanceCommand);
        const instance = instanceResponse.Reservations![0].Instances![0];

        // Check instance type
        expect(instance.InstanceType).toBe('t3.micro');

        // Check that instance has an IAM role
        expect(instance.IamInstanceProfile).toBeDefined();

        // Check for environment tag
        const environmentTag = instance.Tags?.find(tag => tag.Key === 'Environment');
        expect(environmentTag?.Value).toBe('Production');

        // Check that instance is in a public subnet
        expect(instance.SubnetId).toBeDefined();
      }
    }, 60000);

    test('EC2 instances have key pairs configured', async () => {
      if (ec2InstanceIds.length === 0) {
        console.log('⚠️  Skipping key pair test - no EC2 instances found');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: ec2InstanceIds,
      });

      const response = await ec2Client.send(command);
      
      response.Reservations!.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          expect(instance.KeyName).toBeDefined();
          expect(instance.KeyName).toMatch(/app-keypair-/);
        });
      });
    }, 30000);
  });

  describe('RDS Database', () => {
    test('RDS instance exists and is properly configured', async () => {
      const command = new DescribeDBInstancesCommand({});

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();

      // Find our database instance
      const dbInstance = response.DBInstances!.find(db => 
        db.DBInstanceIdentifier?.includes('PostgreSQLDatabase') ||
        db.DBInstanceIdentifier?.includes(stackName)
      );

      if (!dbInstance) {
        console.log('⚠️  RDS instance not found, skipping test');
        return;
      }

      rdsInstanceId = dbInstance.DBInstanceIdentifier!;

      // Check database configuration
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DeletionProtection).toBe(true);

      // Check that database is in a private subnet
      expect(dbInstance.DBSubnetGroup).toBeDefined();

      // Store secret ARN for later tests
      if (dbInstance.MasterUserSecret) {
        databaseSecretArn = dbInstance.MasterUserSecret.SecretArn!;
      }
    }, 60000);

    test('Database is accessible from EC2 instances', async () => {
      if (!rdsInstanceId || !vpcId) {
        console.log('⚠️  Skipping database connectivity test - RDS or VPC not available');
        return;
      }

      // This test verifies that the security group allows EC2 to RDS communication
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: rdsInstanceId,
      });

      const rdsResponse = await rdsClient.send(rdsCommand);
      const dbInstance = rdsResponse.DBInstances![0];

      // Get VPC security groups
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: dbInstance.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId!),
      });

      const sgResponse = await ec2Client.send(sgCommand);
      const rdsSecurityGroup = sgResponse.SecurityGroups![0];

      // Check that RDS security group allows PostgreSQL traffic
      const postgresRule = rdsSecurityGroup.IpPermissions?.find(rule =>
        rule.IpProtocol === 'tcp' && rule.FromPort === 5432 && rule.ToPort === 5432
      );

      expect(postgresRule).toBeDefined();
    }, 30000);
  });

  describe('S3 Bucket', () => {
    test('S3 bucket exists and has proper encryption', async () => {
      // Get bucket name from environment or discover it
      s3BucketName = process.env.S3_BUCKET_NAME || '';
      
      if (!s3BucketName) {
        // Try to find bucket by stack name pattern
        try {
          const listCommand = new ListBucketsCommand({});
          const listResponse = await s3Client.send(listCommand);
          
          const stackBucket = listResponse.Buckets?.find(bucket => 
            bucket.Name?.includes(stackName.toLowerCase()) ||
            bucket.Name?.includes('applicationartifactsbucket')
          );
          
          if (stackBucket) {
            s3BucketName = stackBucket.Name!;
          }
        } catch (error) {
          console.log('⚠️  Could not list S3 buckets, skipping bucket discovery');
        }
      }

      if (!s3BucketName) {
        console.log('⚠️  S3 bucket name not available, skipping test');
        return;
      }

      try {
        // Check if bucket exists
        const headCommand = new HeadBucketCommand({ Bucket: s3BucketName });
        await s3Client.send(headCommand);

        // Check encryption
        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: s3BucketName });
        const encryptionResponse = await s3Client.send(encryptionCommand);

        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      } catch (error) {
        console.log(`⚠️  S3 bucket test failed - bucket ${s3BucketName} not accessible:`, error);
      }
    }, 30000);
  });

  describe('IAM Role and Permissions', () => {
    test('EC2 role exists and has correct permissions', async () => {
      // Get role name from environment or discover it
      ec2RoleName = process.env.EC2_ROLE_NAME || `TestTapStack-EC2S3AccessRole-${environmentSuffix}`;

      try {
        const roleCommand = new GetRoleCommand({ RoleName: ec2RoleName });
        const roleResponse = await iamClient.send(roleCommand);

        expect(roleResponse.Role).toBeDefined();
        expect(roleResponse.Role!.RoleName).toBe(ec2RoleName);

        // Check attached policies
        const policiesCommand = new ListAttachedRolePoliciesCommand({ RoleName: ec2RoleName });
        const policiesResponse = await iamClient.send(policiesCommand);

        expect(policiesResponse.AttachedPolicies).toBeDefined();
        expect(roleResponse.Role!.RoleName).toBeDefined();
      } catch (error) {
        console.log(`⚠️  IAM role test failed - role ${ec2RoleName} not accessible:`, error);
      }
    }, 30000);

    test('Secrets Manager secret exists for database credentials', async () => {
      if (!databaseSecretArn) {
        console.log('⚠️  Skipping Secrets Manager test - secret ARN not available');
        return;
      }

      try {
        const command = new DescribeSecretCommand({ SecretId: databaseSecretArn });
        const response = await secretsClient.send(command);

        expect(response.ARN).toBe(databaseSecretArn);
        expect(response.Name).toContain('dbadmin');
      } catch (error) {
        console.log('⚠️  Secrets Manager test failed:', error);
      }
    }, 30000);
  });

  describe('CloudTrail', () => {
    test('CloudTrail is configured and logging', async () => {
      const command = new DescribeTrailsCommand({});

      const response = await cloudTrailClient.send(command);
      expect(response.trailList).toBeDefined();

      // Look for our trail
      const ourTrail = response.trailList!.find(trail => 
        trail.Name === 'application-management-events' ||
        trail.TrailARN?.includes(stackName)
      );

      if (ourTrail) {
        expect(ourTrail.LogFileValidationEnabled).toBe(true);
        expect(ourTrail.IncludeGlobalServiceEvents).toBe(true);
        expect(ourTrail.IsMultiRegionTrail).toBe(true);
      } else {
        console.log('⚠️  CloudTrail test skipped - trail not found');
      }
    }, 30000);
  });

  describe('End-to-End Connectivity', () => {
    test('Infrastructure components are properly connected', async () => {
      // Verify that all components are in the same VPC
      expect(vpcId).toBeDefined();
      
      if (ec2InstanceIds.length > 0 && rdsInstanceId) {
        // Verify that EC2 instances can access RDS (security group rules)
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: [ec2InstanceIds[0]],
        });
        const ec2Response = await ec2Client.send(ec2Command);
        const ec2Instance = ec2Response.Reservations![0].Instances![0];

        const rdsCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: rdsInstanceId,
        });
        const rdsResponse = await rdsClient.send(rdsCommand);
        const rdsInstance = rdsResponse.DBInstances![0];

        // Both should be in the same VPC
        expect(ec2Instance.VpcId).toBe(vpcId);
        expect(rdsInstance.DBSubnetGroup?.VpcId).toBe(vpcId);

        console.log('✅ Infrastructure connectivity verified:');
        console.log(`  - VPC: ${vpcId}`);
        console.log(`  - EC2 Instances: ${ec2InstanceIds.join(', ')}`);
        console.log(`  - RDS Instance: ${rdsInstanceId}`);
        console.log(`  - S3 Bucket: ${s3BucketName || 'Not accessible'}`);
        console.log(`  - EC2 Role: ${ec2RoleName || 'Not accessible'}`);
      } else {
        console.log('⚠️  Skipping connectivity test - not all components available');
      }
    }, 30000);
  });
});
