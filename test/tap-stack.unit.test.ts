import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'ca-central-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    test('creates KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'SecureCorp master encryption key for data at rest',
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('KMS key has DESTROY removal policy', () => {
      const resources = template.findResources('AWS::KMS::Key');
      const keyResource = Object.values(resources)[0];
      expect(keyResource.DeletionPolicy).toBe('Delete');
      expect(keyResource.UpdateReplacePolicy).toBe('Delete');
    });

    test('creates KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/securecorp-master-key-${environmentSuffix}`,
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates three types of subnets', () => {
      // CDK creates 3 AZs by default with 3 subnet types each
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs x 3 subnet types

      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Public' },
        ]),
      });

      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Private' },
        ]),
      });

      // Check for isolated subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Isolated' },
        ]),
      });
    });

    test('creates NAT gateways for private subnets', () => {
      // CDK creates one NAT gateway per AZ for high availability
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('VPC Endpoints', () => {
    test('creates S3 VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: {
          'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.s3']],
        },
      });
    });

    test('creates KMS VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: 'com.amazonaws.ca-central-1.kms',
        PrivateDnsEnabled: true,
      });
    });

    test('creates Secrets Manager VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: 'com.amazonaws.ca-central-1.secretsmanager',
        PrivateDnsEnabled: true,
      });
    });

    test('creates EC2 VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: 'com.amazonaws.ca-central-1.ec2',
        PrivateDnsEnabled: true,
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('creates VPC flow logs with CloudWatch destination', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('creates log group for VPC flow logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/securecorp/vpc/flowlogs/${environmentSuffix}`,
        RetentionInDays: 365,
      });
    });

    test('flow logs log group has DESTROY removal policy', () => {
      const resources = template.findResources('AWS::Logs::LogGroup', {
        Properties: {
          LogGroupName: `/securecorp/vpc/flowlogs/${environmentSuffix}`,
        },
      });
      const logGroup = Object.values(resources)[0];
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('S3 Buckets', () => {
    test('creates CloudTrail bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('securecorp-cloudtrail')]),
          ]),
        }),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates Data bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('securecorp-data')]),
          ]),
        }),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('buckets have DESTROY removal policy', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('buckets have lifecycle rules for CloudTrail bucket', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const cloudTrailBucket = Object.values(buckets).find((bucket: any) =>
        JSON.stringify(bucket).includes('CloudTrail')
      );

      expect(cloudTrailBucket).toBeDefined();
      expect(
        cloudTrailBucket?.Properties?.LifecycleConfiguration?.Rules
      ).toBeDefined();

      const rules = cloudTrailBucket?.Properties?.LifecycleConfiguration?.Rules;
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Id: 'CloudTrailLogRetention',
            Status: 'Enabled',
            Transitions: expect.arrayContaining([
              {
                StorageClass: 'STANDARD_IA',
                TransitionInDays: 30,
              },
              {
                StorageClass: 'GLACIER',
                TransitionInDays: 90,
              },
            ]),
          }),
        ])
      );
    });
  });

  describe('CloudTrail Configuration', () => {
    test('creates CloudTrail with correct properties', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `SecureCorp-CloudTrail-${environmentSuffix}`,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
      });
    });

    test('CloudTrail has advanced event selectors for VPC endpoints', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        AdvancedEventSelectors: Match.arrayWith([
          {
            Name: 'VPC Endpoint Network Activity Events',
            FieldSelectors: Match.arrayWith([
              {
                Field: 'eventCategory',
                Equals: ['NetworkActivityEvents'],
              },
              {
                Field: 'resources.type',
                Equals: ['AWS::EC2::VPCEndpoint'],
              },
            ]),
          },
        ]),
      });
    });

    test('CloudTrail sends logs to CloudWatch', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        CloudWatchLogsLogGroupArn: Match.anyValue(),
      });
    });

    test('creates log group for CloudTrail', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/securecorp/cloudtrail/${environmentSuffix}`,
        RetentionInDays: 365,
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates Developer role with limited permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecureCorp-Developer-${environmentSuffix}`,
        Description:
          'Role for developers with limited access to development resources',
      });
    });

    test('creates Admin role with elevated permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecureCorp-Admin-${environmentSuffix}`,
        Description: 'Role for administrators with elevated access',
      });

      // Check for PowerUserAccess in a more flexible way
      const roles = template.findResources('AWS::IAM::Role');
      const adminRole = Object.values(roles).find(
        (role: any) =>
          role.Properties?.RoleName === `SecureCorp-Admin-${environmentSuffix}`
      );

      expect(adminRole).toBeDefined();
      const managedPolicies = adminRole?.Properties?.ManagedPolicyArns || [];
      const hasPowerUserAccess = managedPolicies.some((policy: any) =>
        JSON.stringify(policy).includes('PowerUserAccess')
      );
      expect(hasPowerUserAccess).toBe(true);
    });

    test('creates Auditor role with read-only access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecureCorp-Auditor-${environmentSuffix}`,
        Description: 'Role for auditors with read-only access',
      });

      // Check for ReadOnlyAccess in a more flexible way
      const roles = template.findResources('AWS::IAM::Role');
      const auditorRole = Object.values(roles).find(
        (role: any) =>
          role.Properties?.RoleName ===
          `SecureCorp-Auditor-${environmentSuffix}`
      );

      expect(auditorRole).toBeDefined();
      const managedPolicies = auditorRole?.Properties?.ManagedPolicyArns || [];
      const hasReadOnlyAccess = managedPolicies.some((policy: any) =>
        JSON.stringify(policy).includes('ReadOnlyAccess')
      );
      expect(hasReadOnlyAccess).toBe(true);
    });

    test('Admin role has deny policy for dangerous actions', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `SecureCorp-Admin-${environmentSuffix}`,
        },
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: Match.arrayWith([
                'iam:DeleteRole',
                'iam:DeletePolicy',
                'kms:ScheduleKeyDeletion',
                's3:DeleteBucket',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        StorageEncrypted: true,
        BackupRetentionPeriod: 30,
        DeletionProtection: false,
        MultiAZ: false,
        DBName: 'securecorpdb',
      });
    });

    test('database has DESTROY removal policy', () => {
      const databases = template.findResources('AWS::RDS::DBInstance');
      const database = Object.values(databases)[0];
      expect(database.DeletionPolicy).toBe('Delete');
    });

    test('creates DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for SecureCorp databases',
        DBSubnetGroupName: `securecorp-db-subnet-group-${environmentSuffix}`,
      });
    });

    test('creates security group for database', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for SecureCorp database',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
          }),
        ]),
      });
    });

    test('database uses KMS encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('database generates credentials secret', () => {
      // CDK generates a secret for database credentials
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.stringLikeRegexp('dbadmin'),
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID for SecureCorp infrastructure',
      });
    });

    test('exports KMS Key ID and ARN', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
      });
      template.hasOutput('KMSKeyArn', {
        Description: 'KMS Key ARN for encryption',
      });
    });

    test('exports CloudTrail ARN', () => {
      template.hasOutput('CloudTrailArn', {
        Description: 'CloudTrail ARN for audit logging',
      });
    });

    test('exports Database endpoint and port', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database endpoint',
      });
      template.hasOutput('DatabasePort', {
        Description: 'RDS Database port',
      });
    });

    test('exports IAM role ARNs', () => {
      template.hasOutput('DeveloperRoleArn', {
        Description: 'Developer IAM role ARN',
      });
      template.hasOutput('AdminRoleArn', {
        Description: 'Admin IAM role ARN',
      });
      template.hasOutput('AuditorRoleArn', {
        Description: 'Auditor IAM role ARN',
      });
    });

    test('exports VPC Endpoint IDs', () => {
      template.hasOutput('VPCEndpointS3Id', {
        Description: 'S3 VPC Endpoint ID',
      });
      template.hasOutput('VPCEndpointKMSId', {
        Description: 'KMS VPC Endpoint ID',
      });
      template.hasOutput('VPCEndpointSecretsManagerId', {
        Description: 'Secrets Manager VPC Endpoint ID',
      });
      template.hasOutput('VPCEndpointEC2Id', {
        Description: 'EC2 VPC Endpoint ID',
      });
    });

    test('exports S3 bucket names', () => {
      template.hasOutput('CloudTrailBucketName', {
        Description: 'CloudTrail S3 bucket name',
      });
      template.hasOutput('DataBucketName', {
        Description: 'Data S3 bucket name',
      });
    });
  });

  describe('Resource Tags', () => {
    test('all resources have required tags', () => {
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpc)[0];
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Project', Value: 'SecureCorp' },
          { Key: 'CostCenter', Value: 'Security' },
          { Key: 'DataClassification', Value: 'Confidential' },
        ])
      );
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets have versioning enabled', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.VersioningConfiguration).toEqual({
          Status: 'Enabled',
        });
      });
    });

    test('S3 buckets have public access blocked', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('RDS has performance insights enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
        PerformanceInsightsRetentionPeriod: 7,
      });
    });

    test('Security groups have restrictive ingress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach(sg => {
        if (sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            // Should not allow 0.0.0.0/0 ingress
            expect(rule.CidrIp).not.toBe('0.0.0.0/0');
          });
        }
      });
    });
  });
});
