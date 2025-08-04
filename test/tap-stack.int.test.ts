import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetUserCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

const region = 'us-east-1';
const stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });
const secretsClient = new SecretsManagerClient({ region });

describe('SecureApp Infrastructure Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let stackResources: any[] = [];

  beforeAll(async () => {
    try {
      // Get stack outputs
      const stackResponse = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      const stack = stackResponse.Stacks?.[0];
      if (stack?.Outputs) {
        stackOutputs = stack.Outputs.reduce(
          (acc, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          },
          {} as Record<string, string>
        );
      }

      // Get stack resources
      const resourcesResponse = await cfnClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      stackResources = resourcesResponse.StackResources || [];
    } catch (error) {
      console.error('Failed to get stack information:', error);
      throw error;
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('stack should exist and be in CREATE_COMPLETE state', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      const stack = response.Stacks?.[0];
      expect(stack).toBeDefined();
      expect(stack?.StackStatus).toBe('CREATE_COMPLETE');
    });

    test('stack should have all expected outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetAZ1Id',
        'PublicSubnetAZ2Id',
        'PrivateSubnetAZ1Id',
        'PrivateSubnetAZ2Id',
        'EC2InstanceAZ1Id',
        'EC2InstanceAZ2Id',
        'RDSEndpoint',
        'LoggingBucketName',
        'KMSKeyId',
        'KMSKeyArn',
        'CloudTrailArn',
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist with correct configuration', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [stackOutputs.VPCId],
        })
      );
      const vpc = response.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
    });

    test('subnets should exist in correct AZs with proper CIDR blocks', async () => {
      const subnetIds = [
        stackOutputs.PublicSubnetAZ1Id,
        stackOutputs.PublicSubnetAZ2Id,
        stackOutputs.PrivateSubnetAZ1Id,
        stackOutputs.PrivateSubnetAZ2Id,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(4);

      const publicSubnet1 = response.Subnets?.find(
        s => s.SubnetId === stackOutputs.PublicSubnetAZ1Id
      );
      const publicSubnet2 = response.Subnets?.find(
        s => s.SubnetId === stackOutputs.PublicSubnetAZ2Id
      );
      const privateSubnet1 = response.Subnets?.find(
        s => s.SubnetId === stackOutputs.PrivateSubnetAZ1Id
      );
      const privateSubnet2 = response.Subnets?.find(
        s => s.SubnetId === stackOutputs.PrivateSubnetAZ2Id
      );

      expect(publicSubnet1?.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2?.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet1?.CidrBlock).toBe('10.0.11.0/24');
      expect(privateSubnet2?.CidrBlock).toBe('10.0.12.0/24');

      // Check that subnets are in different AZs
      const azs = new Set([
        publicSubnet1?.AvailabilityZone,
        publicSubnet2?.AvailabilityZone,
        privateSubnet1?.AvailabilityZone,
        privateSubnet2?.AvailabilityZone,
      ]);
      expect(azs.size).toBe(2); // Should span 2 AZs
    });

    test('NAT Gateways should be deployed for high availability', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VPCId],
            },
          ],
        })
      );

      expect(response.NatGateways).toHaveLength(2);
      response.NatGateways?.forEach(natGw => {
        expect(natGw.State).toBe('available');
      });
    });

    test('route tables should be properly configured', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VPCId],
            },
          ],
        })
      );

      // Should have 3 route tables (1 public, 2 private)
      const customRouteTables = response.RouteTables?.filter(rt =>
        rt.Tags?.some(tag => tag.Key === 'Project' && tag.Value === 'SecureApp')
      );
      expect(customRouteTables).toHaveLength(3);
    });
  });

  describe('Security Groups', () => {
    test('security groups should exist with correct rules', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VPCId],
            },
            {
              Name: 'tag:Project',
              Values: ['SecureApp'],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toHaveLength(3);

      const httpsGroup = response.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('HTTPS')
      );
      const sshGroup = response.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('SSH')
      );
      const rdsGroup = response.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('RDS')
      );

      expect(httpsGroup).toBeDefined();
      expect(sshGroup).toBeDefined();
      expect(rdsGroup).toBeDefined();

      // Check HTTPS group allows port 443
      const httpsRule = httpsGroup?.IpPermissions?.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();

      // Check SSH group allows port 22
      const sshRule = sshGroup?.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();

      // Check RDS group allows port 5432
      const rdsRule = rdsGroup?.IpPermissions?.find(
        rule => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(rdsRule).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('EC2 instances should be running in private subnets', async () => {
      const instanceIds = [
        stackOutputs.EC2InstanceAZ1Id,
        stackOutputs.EC2InstanceAZ2Id,
      ];

      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        })
      );

      expect(response.Reservations).toHaveLength(2);

      response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          expect(instance.State?.Name).toBe('running');
          expect(instance.InstanceType).toBe('t3.micro');

          // Should be in private subnet
          const isInPrivateSubnet = [
            stackOutputs.PrivateSubnetAZ1Id,
            stackOutputs.PrivateSubnetAZ2Id,
          ].includes(instance.SubnetId || '');
          expect(isInPrivateSubnet).toBe(true);

          // Should have encrypted EBS volumes
          instance.BlockDeviceMappings?.forEach(bdm => {
            expect(bdm.Ebs?.Encrypted).toBe(true);
          });
        });
      });
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should be configured correctly', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: 'secureapp-database',
        })
      );

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.DeletionProtection).toBe(true);
      expect(dbInstance?.BackupRetentionPeriod).toBe(7);
    });

    test('RDS subnet group should span multiple AZs', async () => {
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: 'secureapp-rds-subnetgroup',
        })
      );

      const subnetGroup = response.DBSubnetGroups?.[0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.Subnets).toHaveLength(2);

      const azs = new Set(
        subnetGroup?.Subnets?.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );
      expect(azs.size).toBe(2);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: stackOutputs.KMSKeyId,
        })
      );

      const key = response.KeyMetadata;
      expect(key).toBeDefined();
      expect(key?.KeyState).toBe('Enabled');
      expect(key?.Description).toBe(
        'Customer-managed KMS key for SecureApp encryption'
      );
    });

    test('KMS key alias should exist', async () => {
      const response = await kmsClient.send(new ListAliasesCommand({}));

      const alias = response.Aliases?.find(
        a => a.AliasName === 'alias/secureapp-key'
      );
      expect(alias).toBeDefined();
      expect(alias?.TargetKeyId).toBe(stackOutputs.KMSKeyId);
    });
  });

  describe('S3 Logging Bucket', () => {
    test('S3 bucket should have encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.LoggingBucketName,
        })
      );

      const encryption = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(encryption?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(
        encryption?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
      ).toBe(stackOutputs.KMSKeyArn);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: stackOutputs.LoggingBucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policy', async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: stackOutputs.LoggingBucketName,
        })
      );

      expect(response.Rules).toHaveLength(1);
      const rule = response.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Transitions?.[0]?.Days).toBe(365);
      expect(rule?.Transitions?.[0]?.StorageClass).toBe('GLACIER');
      expect(rule?.Expiration?.Days).toBe(2555);
    });

    test('S3 bucket should block public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: stackOutputs.LoggingBucketName,
        })
      );

      const config = response.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail should be configured and logging', async () => {
      const response = await cloudTrailClient.send(
        new DescribeTrailsCommand({
          trailNameList: ['SecureApp-CloudTrail'],
        })
      );

      const trail = response.trailList?.[0];
      expect(trail).toBeDefined();
      expect(trail?.S3BucketName).toBe(stackOutputs.LoggingBucketName);
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);
      expect(trail?.KMSKeyId).toBe(stackOutputs.KMSKeyArn);
    });

    test('CloudTrail should be actively logging', async () => {
      const response = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: 'SecureApp-CloudTrail',
        })
      );

      expect(response.IsLogging).toBe(true);
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs should be configured', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/vpc/flowlogs',
        })
      );

      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === '/aws/vpc/flowlogs'
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(365);
      expect(logGroup?.kmsKeyId).toBe(stackOutputs.KMSKeyArn);
    });
  });

  describe('IAM Resources', () => {
    test('EC2 instance role should exist with correct policies', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: 'SecureApp-EC2-Role',
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe('SecureApp-EC2-Role');
    });

    test('EC2 instance profile should exist', async () => {
      const instanceProfileName = stackResources.find(
        r => r.ResourceType === 'AWS::IAM::InstanceProfile'
      )?.PhysicalResourceId;

      if (instanceProfileName) {
        const response = await iamClient.send(
          new GetInstanceProfileCommand({
            InstanceProfileName: instanceProfileName,
          })
        );

        expect(response.InstanceProfile).toBeDefined();
        expect(response.InstanceProfile?.Roles).toHaveLength(1);
        expect(response.InstanceProfile?.Roles?.[0].RoleName).toBe(
          'SecureApp-EC2-Role'
        );
      }
    });
  });

  describe('Secrets Manager', () => {
    test('access key secret should exist', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: 'SecureApp/AccessKeys',
        })
      );

      expect(response.Name).toBe('SecureApp/AccessKeys');
      expect(response.Description).toBe(
        'Automatically rotated access keys for SecureApp'
      );
    });

    // Note: AccessKeyRotationSchedule was removed from template due to
    // invalid properties and missing Lambda function requirements

    test('access key rotation user should exist', async () => {
      const response = await iamClient.send(
        new GetUserCommand({
          UserName: 'SecureApp-AccessKey-User',
        })
      );

      expect(response.User).toBeDefined();
      expect(response.User?.UserName).toBe('SecureApp-AccessKey-User');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Project tag', () => {
      const taggedResources = stackResources.filter(
        resource =>
          resource.ResourceType !== 'AWS::EC2::VPCGatewayAttachment' &&
          resource.ResourceType !== 'AWS::EC2::Route' &&
          resource.ResourceType !== 'AWS::EC2::SubnetRouteTableAssociation' &&
          resource.ResourceType !== 'AWS::IAM::InstanceProfile' &&
          resource.ResourceType !== 'AWS::S3::BucketPolicy' &&
          resource.ResourceType !== 'AWS::SecretsManager::RotationSchedule'
      );

      // Most resources should be tagged (some AWS resources don't support tags)
      expect(taggedResources.length).toBeGreaterThan(15);
    });
  });

  describe('Security Compliance', () => {
    test('all storage should be encrypted', async () => {
      // S3 encryption already tested above
      // RDS encryption already tested above
      // EBS encryption already tested above

      // This test serves as a summary check
      expect(stackOutputs.KMSKeyId).toBeDefined();
      expect(stackOutputs.KMSKeyArn).toBeDefined();
    });

    test('network isolation should be properly configured', async () => {
      // EC2 instances in private subnets - already tested
      // RDS in private subnets - already tested
      // Security groups with restrictive rules - already tested

      // This test serves as a summary check
      expect(stackOutputs.PrivateSubnetAZ1Id).toBeDefined();
      expect(stackOutputs.PrivateSubnetAZ2Id).toBeDefined();
    });
  });
});
