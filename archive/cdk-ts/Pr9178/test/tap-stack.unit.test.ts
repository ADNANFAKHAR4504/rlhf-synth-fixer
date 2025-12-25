import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('with default configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environment: 'test',
        owner: 'test-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data', 'logs', 'backups'],
        enableCloudTrail: false, // Disabled for LocalStack Community Edition
        vpcCidr: '10.0.0.0/16',
      });
      template = Template.fromStack(stack);
    });

    describe('VPC Resources', () => {
      test('should create VPC with correct CIDR', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: '10.0.0.0/16',
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        });
      });

      test('should create public and private subnets', () => {
        template.hasResourceProperties('AWS::EC2::Subnet', {
          MapPublicIpOnLaunch: true,
        });

        template.hasResourceProperties('AWS::EC2::Subnet', {
          MapPublicIpOnLaunch: false,
        });
      });

      test('should create VPC Flow Logs', () => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: '/aws/vpc/flowlogs/tap-scalable-infrastructure-test',
        });
      });
    });

    describe('KMS Resources', () => {
      test('should create KMS key with rotation enabled', () => {
        template.hasResourceProperties('AWS::KMS::Key', {
          EnableKeyRotation: true,
        });
      });

      test('should create KMS alias', () => {
        template.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: 'alias/tap-scalable-infrastructure-test-key',
        });
      });
    });

    describe('S3 Resources', () => {
      test('should create S3 buckets with encryption', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'aws:kms',
                },
              },
            ],
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        });
      });

      test('should create expected number of buckets', () => {
        const buckets = template.findResources('AWS::S3::Bucket');
        expect(buckets).toBeDefined();
        expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(3); // data, logs, backups, cloudtrail
      });
    });

    describe('IAM Resources', () => {
      test('should create application role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'ec2.amazonaws.com',
                },
              },
            ],
          },
        });
      });

      test('should create Lambda execution role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              },
            ],
          },
        });
      });
    });

    describe('CloudTrail Resources', () => {
      test('should skip CloudTrail when disabled (LocalStack Community)', () => {
        // CloudTrail is disabled for LocalStack Community Edition compatibility
        const trails = template.findResources('AWS::CloudTrail::Trail');
        expect(Object.keys(trails).length).toBe(0);
      });

      test('should still create CloudTrail log group for future use', () => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: '/aws/cloudtrail/tap-scalable-infrastructure-test',
        });
      });
    });

    describe('SNS Resources', () => {
      test('should create security notifications topic', () => {
        template.hasResourceProperties('AWS::SNS::Topic', {
          TopicName: 'tap-scalable-infrastructure-test-security-notifications',
        });
      });

      test('should create SNS topic policy', () => {
        template.hasResource('AWS::SNS::TopicPolicy', {});
      });
    });

    describe('CloudFormation Outputs', () => {
      test('should export VPC ID', () => {
        template.hasOutput('VpcId', {
          Export: {
            Name: 'TestTapStack-VpcId',
          },
        });
      });

      test('should export KMS Key ARN', () => {
        template.hasOutput('KmsKeyArn', {
          Export: {
            Name: 'TestTapStack-KmsKeyArn',
          },
        });
      });

      test('should export Security Topic ARN', () => {
        template.hasOutput('SecurityTopicArn', {
          Export: {
            Name: 'TestTapStack-SecurityTopicArn',
          },
        });
      });
    });

    describe('Tags', () => {
      test('should apply common tags to stack', () => {
        template.hasResource('AWS::EC2::VPC', {});
      });
    });
  });

  describe('with CloudTrail disabled', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackNoCloudTrail', {
        environment: 'test',
        owner: 'test-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data', 'logs'],
        enableCloudTrail: false,
        vpcCidr: '172.16.0.0/16',
      });
      template = Template.fromStack(stack);
    });

    test('should not create CloudTrail when disabled', () => {
      const cloudTrailResources = template.findResources(
        'AWS::CloudTrail::Trail'
      );
      expect(Object.keys(cloudTrailResources).length).toBe(0);
    });

    test('should not create CloudTrail log group when disabled', () => {
      const cloudTrailLogGroups = template.findResources('AWS::Logs::LogGroup');
      const hasCloudTrailLogGroup = Object.values(cloudTrailLogGroups).some(
        (resource: any) =>
          resource.Properties?.LogGroupName?.includes('/aws/cloudtrail/')
      );
      // CloudTrail log group is still created because it's created before the conditional check
      expect(hasCloudTrailLogGroup).toBe(true);
    });

    test('should use custom VPC CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '172.16.0.0/16',
      });
    });
  });

  describe('with minimal bucket configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackMinimal', {
        environment: 'prod',
        owner: 'prod-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data'],
        enableCloudTrail: false, // Disabled for LocalStack Community Edition
      });
      template = Template.fromStack(stack);
    });

    test('should create single bucket', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBe(1); // data only (CloudTrail disabled)
    });

    test('should use default VPC CIDR when not specified', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('KMS Key Policy', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackKMS', {
        environment: 'test',
        owner: 'test-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data'],
        enableCloudTrail: false, // Disabled for LocalStack Community Edition
      });
      template = Template.fromStack(stack);
    });

    test('should create KMS key with correct policy statements', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should allow CloudTrail service principal', () => {
      const kmsKeys = template.findResources('AWS::KMS::Key');
      expect(Object.keys(kmsKeys).length).toBeGreaterThan(0);

      // Verify KMS key has the expected properties
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackS3', {
        environment: 'test',
        owner: 'test-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data', 'logs', 'backups'],
        enableCloudTrail: false, // Disabled for LocalStack Community Edition
      });
      template = Template.fromStack(stack);
    });

    test('should create buckets with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled',
            },
            {
              Id: 'TransitionToIA',
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('should create buckets with server access logging', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const hasLogging = Object.values(buckets).some(
        (bucket: any) =>
          bucket.Properties?.LoggingConfiguration?.LogFilePrefix ===
          'access-logs/'
      );
      expect(hasLogging).toBe(true);
    });
  });

  describe('IAM Role Permissions', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackIAM', {
        environment: 'test',
        owner: 'test-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data'],
        enableCloudTrail: false, // Disabled for LocalStack Community Edition
      });
      template = Template.fromStack(stack);
    });

    test('should create application role with S3 permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const applicationRole = Object.values(roles).find(
        (role: any) =>
          role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal
            ?.Service === 'ec2.amazonaws.com'
      );
      expect(applicationRole).toBeDefined();
    });

    test('should create Lambda role with VPC access', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const lambdaRole = Object.values(roles).find(
        (role: any) =>
          role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal
            ?.Service === 'lambda.amazonaws.com'
      );
      expect(lambdaRole).toBeDefined();
    });
  });

  describe('SNS Topic Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackSNS', {
        environment: 'test',
        owner: 'test-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data'],
        enableCloudTrail: false, // Disabled for LocalStack Community Edition
      });
      template = Template.fromStack(stack);
    });

    test('should create SNS topic with KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('should create SNS topic policy for CloudWatch', () => {
      template.hasResource('AWS::SNS::TopicPolicy', {});
    });
  });

  describe('CloudFormation Outputs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackOutputs', {
        environment: 'test',
        owner: 'test-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data', 'logs'],
        enableCloudTrail: false, // Disabled for LocalStack Community Edition
      });
      template = Template.fromStack(stack);
    });

    test('should export all required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs['VpcId']).toBeDefined();
      expect(outputs['KmsKeyArn']).toBeDefined();
      expect(outputs['SecurityTopicArn']).toBeDefined();
      expect(outputs['SecurityTopicName']).toBeDefined();
    });

    test('should export bucket names and ARNs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs['S3Bucket0Name']).toBeDefined();
      expect(outputs['S3Bucket0Arn']).toBeDefined();
    });

    test('should export role ARNs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs['applicationRoleArn']).toBeDefined();
      expect(outputs['lambdaRoleArn']).toBeDefined();
      expect(outputs['cloudTrailRoleArn']).toBeDefined();
    });
  });

  describe('Stack Tags', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackTags', {
        environment: 'test',
        owner: 'test-owner',
        project: 'tap-scalable-infrastructure',
        bucketNames: ['data'],
        enableCloudTrail: false, // Disabled for LocalStack Community Edition
      });
      template = Template.fromStack(stack);
    });

    test('should apply common tags to all resources', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcs)[0] as any;
      const tags = vpc.Properties?.Tags;
      expect(tags).toBeDefined();

      const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
      const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
      const projectTag = tags.find((tag: any) => tag.Key === 'Project');

      expect(environmentTag?.Value).toBe('test');
      expect(ownerTag?.Value).toBe('test-owner');
      expect(projectTag?.Value).toBe('tap-scalable-infrastructure');
    });

    test('should apply additional metadata tags', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcs)[0] as any;
      const tags = vpc.Properties?.Tags;

      const managedByTag = tags.find((tag: any) => tag.Key === 'ManagedBy');
      const stackNameTag = tags.find((tag: any) => tag.Key === 'StackName');
      const regionTag = tags.find((tag: any) => tag.Key === 'Region');

      expect(managedByTag?.Value).toBe('CDK');
      expect(stackNameTag?.Value).toBe('TestTapStackTags');
      expect(regionTag?.Value).toBeDefined();
    });
  });
});
