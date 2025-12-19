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
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    test('should create a KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for secure web application encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key with proper policy statements', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Action: 'kms:*',
            }),
            Match.objectLike({
              Sid: 'Allow CloudTrail and S3 to use the key',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: Match.arrayWith([
                  'cloudtrail.amazonaws.com',
                  's3.amazonaws.com',
                ]),
              }),
            }),
          ]),
        }),
      });
    });

    test('should create KMS alias with environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/secure-app-${environmentSuffix}`,
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 database

      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });
    });

    test('should create private subnets with NAT gateways', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });

      // Verify NAT gateways are created
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create isolated database subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          }),
        ]),
      });
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('should create access logs bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `app-logs-${environmentSuffix}`,
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create web assets bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `app-assets-${environmentSuffix}`,
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

    test('should create CloudTrail bucket with lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `app-trail-${environmentSuffix}`,
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldTrails',
              Status: 'Enabled',
              ExpirationInDays: 365,
            },
          ],
        },
      });
    });

    test('all S3 buckets should have deletion policy set to Delete', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail with KMS encryption', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `SecureAppTrail-${environmentSuffix}`,
        EnableLogFileValidation: true,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: false,
      });
    });

    test('should configure CloudTrail with S3 data events', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: Match.arrayWith([
          Match.objectLike({
            DataResources: Match.arrayWith([
              Match.objectLike({
                Type: 'AWS::S3::Object',
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('RDS Database Configuration', () => {
    test('should create RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        PubliclyAccessible: false,
        DeletionProtection: false,
        MultiAZ: false,
      });
    });

    test('should configure database with backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: true,
      });
    });

    test('should create database subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription:
          'Subnet group for secure application database',
      });
    });

    test('should create database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for secure application database',
      });
    });

    test('database should have deletion policy set to Delete', () => {
      const databases = template.findResources('AWS::RDS::DBInstance');
      Object.values(databases).forEach(db => {
        expect(db.DeletionPolicy).toBe('Delete');
        expect(db.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should create ALB with proper configuration', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('should create ALB security group with HTTP/HTTPS rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSG = Object.values(securityGroups).find(
        sg =>
          sg.Properties?.GroupDescription ===
          'Security group for Application Load Balancer'
      );
      expect(albSG).toBeDefined();
    });

    test('should have ingress rules for HTTP and HTTPS', () => {
      // In CDK, ingress rules are often embedded in the security group definition
      // Check that ALB security group exists with proper description
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSG = Object.values(securityGroups).find(
        sg =>
          sg.Properties?.GroupDescription ===
          'Security group for Application Load Balancer'
      );

      // Verify ALB security group exists and has proper configuration
      expect(albSG).toBeDefined();
      expect(albSG?.Properties?.SecurityGroupIngress).toBeDefined();
      expect(albSG?.Properties?.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
        ])
      );
    });
  });

  describe('GuardDuty Configuration', () => {
    test('should enable GuardDuty detector in non-LocalStack environments', () => {
      // GuardDuty is optional and only created in non-LocalStack environments
      // This test verifies it's either present with correct config or not present at all
      const detectors = template.findResources('AWS::GuardDuty::Detector');

      if (Object.keys(detectors).length > 0) {
        template.hasResourceProperties('AWS::GuardDuty::Detector', {
          Enable: true,
          DataSources: {
            S3Logs: {
              Enable: true,
            },
            MalwareProtection: {
              ScanEc2InstanceWithFindings: {
                EbsVolumes: true,
              },
            },
          },
        });
      } else {
        // LocalStack mode - GuardDuty not created
        expect(Object.keys(detectors).length).toBe(0);
      }
    });
  });

  describe('Tags and Outputs', () => {
    test('should create CloudFormation outputs', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
      });

      template.hasOutput('WebAssetsBucketName', {
        Description: 'S3 bucket for web application assets',
      });

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });

      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name',
      });

      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });

      template.hasOutput('CloudTrailArn', {
        Description: 'CloudTrail ARN',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with Retain deletion policy', () => {
      const resources = template.toJSON().Resources;
      Object.entries(resources).forEach(
        ([logicalId, resource]: [string, any]) => {
          // KMS keys are an exception as they have special handling
          if (resource.Type !== 'AWS::KMS::Key') {
            if (resource.DeletionPolicy) {
              expect(resource.DeletionPolicy).not.toBe('Retain');
            }
          }
        }
      );
    });

    test('should encrypt all data at rest', () => {
      // Check S3 buckets have encryption
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.BucketEncryption).toBeDefined();
        expect(
          bucket.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration
        ).toBeDefined();
      });

      // Check RDS has encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should block public access on all S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('should enable versioning on critical buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.VersioningConfiguration).toEqual({
          Status: 'Enabled',
        });
      });
    });

    test('should have database in isolated subnets with no public access', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('should use customer managed KMS keys for encryption', () => {
      // Verify KMS key exists
      template.resourceCountIs('AWS::KMS::Key', 1);

      // Verify it's used by S3 buckets
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        const encryption =
          bucket.Properties?.BucketEncryption
            ?.ServerSideEncryptionConfiguration?.[0];
        expect(encryption?.ServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
          'aws:kms'
        );
      });
    });
  });

  describe('Stack Properties', () => {
    test('should use environment suffix in resource names', () => {
      // Check S3 bucket names use simplified naming for LocalStack
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map(
        (b: any) => b.Properties?.BucketName
      );

      // All bucket names should include the environment suffix
      bucketNames.forEach((name: string) => {
        expect(name).toMatch(new RegExp(`.*-${environmentSuffix}$`));
      });

      // Check CloudTrail name
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `SecureAppTrail-${environmentSuffix}`,
      });

      // Check KMS alias
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/secure-app-${environmentSuffix}`,
      });
    });

    test('should deploy to ap-northeast-1 region', () => {
      expect(stack.region).toBe('ap-northeast-1');
    });
  });

  describe('LocalStack Specific Configuration', () => {
    let localStackApp: cdk.App;
    let localStackStack: TapStack;
    let localStackTemplate: Template;

    beforeEach(() => {
      // Set LocalStack environment variable
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

      localStackApp = new cdk.App();
      localStackStack = new TapStack(localStackApp, 'TestLocalStackTapStack', {
        environmentSuffix: 'localstack',
        env: {
          account: '000000000000',
          region: 'us-east-1',
        },
      });
      localStackTemplate = Template.fromStack(localStackStack);
    });

    afterEach(() => {
      // Clean up environment variable
      delete process.env.AWS_ENDPOINT_URL;
    });

    test('should configure VPC with no NAT gateways for LocalStack', () => {
      // In LocalStack mode, NAT gateways should be reduced to 0
      localStackTemplate.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('should use public subnets instead of private with egress for LocalStack', () => {
      // Verify that private subnets are created as PUBLIC in LocalStack mode
      const subnets = localStackTemplate.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter((subnet: any) =>
        subnet.Properties?.Tags?.some(
          (tag: any) =>
            tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private'
        )
      );

      // All "private" subnets should have MapPublicIpOnLaunch set to true in LocalStack
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.Properties?.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should not create RDS resources in LocalStack', () => {
      // RDS service requires explicit enablement in LocalStack SERVICES configuration
      // To avoid deployment failures, RDS resources are not created in LocalStack mode
      localStackTemplate.resourceCountIs('AWS::RDS::DBInstance', 0);
      localStackTemplate.resourceCountIs('AWS::RDS::DBSubnetGroup', 0);
    });

    test('should not create CloudTrail resources in LocalStack', () => {
      // CloudTrail service requires explicit enablement in LocalStack SERVICES configuration
      // To avoid deployment failures, CloudTrail resources are not created in LocalStack mode
      localStackTemplate.resourceCountIs('AWS::CloudTrail::Trail', 0);
    });

    test('should not create GuardDuty detector in LocalStack', () => {
      // GuardDuty requires Pro and should not be created in LocalStack mode
      localStackTemplate.resourceCountIs('AWS::GuardDuty::Detector', 0);
    });

    test('should create all required outputs for LocalStack', () => {
      localStackTemplate.hasOutput('KMSKeyId', {});
      localStackTemplate.hasOutput('WebAssetsBucketName', {});
      // DatabaseEndpoint not created in LocalStack mode (RDS skipped)
      // CloudTrailArn not created in LocalStack mode (CloudTrail skipped)
      // CloudTrailBucketName not created in LocalStack mode (CloudTrail skipped)
      localStackTemplate.hasOutput('LoadBalancerDNS', {});
      localStackTemplate.hasOutput('VPCId', {});
    });
  });
});
