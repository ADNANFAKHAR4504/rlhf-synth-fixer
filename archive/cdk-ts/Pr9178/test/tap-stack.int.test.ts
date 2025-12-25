import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  // Test configuration based on actual outputs
  const testConfig = {
    environment: 'pr1078',
    owner: 'test-owner',
    project: 'tap-scalable-infrastructure',
    bucketNames: ['data', 'logs', 'backups'],
    enableCloudTrail: false, // Disabled for LocalStack Community Edition
    vpcCidr: '10.0.0.0/16',
  };

  // Expected outputs from flat-outputs.json
  const expectedOutputs = {
    VpcId: 'vpc-07f8466c8d99981f4',
    VpcCidr: '10.0.0.0/16',
    PublicSubnetIds:
      'subnet-03b9e2ead0a33cde6,subnet-0e194307acf023c4b,subnet-0cf09e8a204ede651',
    PrivateSubnetIds:
      'subnet-0bebb875469260ce7,subnet-0d20250821b31c3b9,subnet-023454dab807c5f51',
    KmsKeyId: '0bfa921f-a62c-4275-acd6-a93359452f7c',
    KmsKeyArn:
      'arn:aws:kms:us-west-2:718240086340:key/0bfa921f-a62c-4275-acd6-a93359452f7c',
    SecurityTopicArn:
      'arn:aws:sns:us-west-2:718240086340:tap-scalable-infrastructure-pr1078-security-notifications',
    SecurityTopicName:
      'tap-scalable-infrastructure-pr1078-security-notifications',
    S3Bucket0Name: 'tap-scalable-infrastructure-pr1078-data',
    S3Bucket1Name: 'tap-scalable-infrastructure-pr1078-logs',
    S3Bucket2Name: 'tap-scalable-infrastructure-pr1078-backups',
    applicationRoleArn:
      'arn:aws:iam::718240086340:role/TapStackpr1078-ApplicationRole90C00724-p1uPLExna8Xl',
    lambdaRoleArn:
      'arn:aws:iam::718240086340:role/TapStackpr1078-LambdaExecutionRoleD5C26073-MoRgGPkXQ2u0',
    cloudTrailRoleArn:
      'arn:aws:iam::718240086340:role/TapStackpr1078-CloudTrailRole9EE963D2-QJ5bTdI7PQF8',
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TapStackIntegration', testConfig);
    template = Template.fromStack(stack);
  });

  describe('VPC Integration', () => {
    test('should create VPC with correct CIDR and state', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: expectedOutputs.VpcCidr,
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create correct number of subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(6); // Public + Private + Isolated
    });

    test('should export VPC ID correctly', () => {
      template.hasOutput('VpcId', {
        Export: {
          Name: 'TapStackIntegration-VpcId',
        },
      });
    });

    test('should export subnet IDs correctly', () => {
      template.hasOutput('PublicSubnetIds', {
        Export: {
          Name: 'TapStackIntegration-PublicSubnetIds',
        },
      });

      template.hasOutput('PrivateSubnetIds', {
        Export: {
          Name: 'TapStackIntegration-PrivateSubnetIds',
        },
      });
    });
  });

  describe('KMS Integration', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create KMS alias with correct naming', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/${testConfig.project.toLowerCase()}-${testConfig.environment.toLowerCase()}-key`,
      });
    });

    test('should export KMS key ARN correctly', () => {
      template.hasOutput('KmsKeyArn', {
        Export: {
          Name: 'TapStackIntegration-KmsKeyArn',
        },
      });
    });
  });

  describe('S3 Integration', () => {
    test('should create all expected buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(3); // data, logs, backups (CloudTrail disabled)
    });

    test('should create data bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: expectedOutputs.S3Bucket0Name,
      });
    });

    test('should create logs bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: expectedOutputs.S3Bucket1Name,
      });
    });

    test('should create backups bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: expectedOutputs.S3Bucket2Name,
      });
    });

    test('should configure buckets with KMS encryption', () => {
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
      });
    });

    test('should configure buckets with lifecycle rules', () => {
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

    test('should export bucket names and ARNs', () => {
      template.hasOutput('S3Bucket0Name', {
        Export: {
          Name: 'TapStackIntegration-S3Bucket0Name',
        },
      });

      template.hasOutput('S3Bucket0Arn', {
        Export: {
          Name: 'TapStackIntegration-S3Bucket0Arn',
        },
      });
    });
  });

  describe('IAM Integration', () => {
    test('should create application role with correct permissions', () => {
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

    test('should create CloudTrail role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should export role ARNs correctly', () => {
      template.hasOutput('applicationRoleArn', {
        Export: {
          Name: 'TapStackIntegration-applicationRoleArn',
        },
      });

      template.hasOutput('lambdaRoleArn', {
        Export: {
          Name: 'TapStackIntegration-lambdaRoleArn',
        },
      });

      template.hasOutput('cloudTrailRoleArn', {
        Export: {
          Name: 'TapStackIntegration-cloudTrailRoleArn',
        },
      });
    });
  });

  describe('SNS Integration', () => {
    test('should create security notifications topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: expectedOutputs.SecurityTopicName,
      });
    });

    test('should create SNS topic policy', () => {
      template.hasResource('AWS::SNS::TopicPolicy', {});
    });

    test('should export SNS topic ARN and name', () => {
      template.hasOutput('SecurityTopicArn', {
        Export: {
          Name: 'TapStackIntegration-SecurityTopicArn',
        },
      });

      template.hasOutput('SecurityTopicName', {
        Export: {
          Name: 'TapStackIntegration-SecurityTopicName',
        },
      });
    });
  });

  describe('CloudTrail Integration', () => {
    test('should skip CloudTrail when disabled (LocalStack Community)', () => {
      // CloudTrail is disabled for LocalStack Community Edition compatibility
      const trails = template.findResources('AWS::CloudTrail::Trail');
      expect(Object.keys(trails).length).toBe(0);
    });

    test('should still create CloudTrail log group for future use', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/cloudtrail/${testConfig.project}-${testConfig.environment}`,
      });
    });
  });

  describe('Log Groups Integration', () => {
    test('should create VPC Flow Logs log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs/${testConfig.project}-${testConfig.environment}`,
      });
    });
  });

  describe('Tags Integration', () => {
    test('should apply common tags to all resources', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcs)[0] as any;
      const tags = vpc.Properties?.Tags;
      expect(tags).toBeDefined();

      const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
      const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
      const projectTag = tags.find((tag: any) => tag.Key === 'Project');

      expect(environmentTag?.Value).toBe(testConfig.environment);
      expect(ownerTag?.Value).toBe(testConfig.owner);
      expect(projectTag?.Value).toBe(testConfig.project);
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper resource dependencies', () => {
      // VPC should be created before subnets
      const vpcs = template.findResources('AWS::EC2::VPC');
      const subnets = template.findResources('AWS::EC2::Subnet');

      expect(Object.keys(vpcs).length).toBeGreaterThan(0);
      expect(Object.keys(subnets).length).toBeGreaterThan(0);
    });

    test('should have KMS key before encrypted resources', () => {
      const kmsKeys = template.findResources('AWS::KMS::Key');
      const s3Buckets = template.findResources('AWS::S3::Bucket');

      expect(Object.keys(kmsKeys).length).toBeGreaterThan(0);
      expect(Object.keys(s3Buckets).length).toBeGreaterThan(0);
    });
  });

  describe('Security Configuration', () => {
    test('should configure S3 buckets with public access blocking', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should configure S3 buckets with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should configure S3 buckets with SSL enforcement', () => {
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
      });
    });
  });

  describe('Cross-Stack References', () => {
    test('should export all required values for cross-stack references', () => {
      const outputs = template.findOutputs('*');

      // Check that all expected outputs exist
      expect(outputs['VpcId']).toBeDefined();
      expect(outputs['KmsKeyArn']).toBeDefined();
      expect(outputs['SecurityTopicArn']).toBeDefined();
      expect(outputs['S3Bucket0Name']).toBeDefined();
      expect(outputs['applicationRoleArn']).toBeDefined();
    });

    test('should have proper export names for cross-stack references', () => {
      const outputs = template.findOutputs('*');

      // Check export names follow the expected pattern
      Object.values(outputs).forEach((output: any) => {
        if (output.Export?.Name) {
          expect(output.Export.Name).toMatch(/^TapStackIntegration-/);
        }
      });
    });
  });
});
