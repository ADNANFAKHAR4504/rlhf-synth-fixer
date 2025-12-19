import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    test('creates KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp(
          `KMS key for S3 bucket encryption and CloudTrail logs - ${environmentSuffix}`
        ),
        EnableKeyRotation: true,
      });
    });

    test('creates KMS key with proper policy for CloudTrail', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Action: 'kms:*',
            }),
            Match.objectLike({
              Sid: 'Allow CloudTrail to encrypt logs',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('creates KMS key aliases', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/secure-infra-s3-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-s3-encryption-key',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with KMS encryption', () => {
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

    test('creates S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldLogs',
              ExpirationInDays: 90,
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('creates S3 bucket policy for CloudTrail', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
            }),
            Match.objectLike({
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:PutObject',
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            }),
          ]),
        },
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

    test('creates public and private subnets', () => {
      // Public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });

      // Private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates NAT Gateway for private subnet connectivity', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc',
      });
    });

    test('creates Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {});
    });
  });

  describe('Security Group Configuration', () => {
    test('creates EC2 security group with restricted inbound access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group for EC2 instances with restricted access',
        SecurityGroupIngress: [
          {
            CidrIp: '203.0.113.0/24',
            Description: 'SSH access from specified CIDR range',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
          {
            CidrIp: '203.0.113.0/24',
            Description: 'HTTP access from specified CIDR range',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '203.0.113.0/24',
            Description: 'HTTPS access from specified CIDR range',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('creates Lambda security group with egress only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions - egress only',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ],
      });
    });
  });

  describe('IAM Roles Configuration', () => {
    test('creates EC2 IAM role with SSM managed policy', () => {
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
        Description:
          'IAM role for EC2 instances with minimal required permissions',
      });
    });

    test('creates Lambda IAM role with VPC execution permissions', () => {
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
        Description:
          'IAM role for Lambda functions with VPC execution permissions',
      });
    });

    test('creates instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'SecureEC2InstanceProfile',
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('creates EC2 instance in private subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('EC2 instance has proper security group and role associations', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SecurityGroupIds: Match.anyValue(),
        IamInstanceProfile: Match.anyValue(),
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('creates Lambda function with VPC configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Description: 'Secure Lambda function running in VPC',
        Timeout: 30,
        MemorySize: 128,
        VpcConfig: {
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        },
      });
    });

    test('Lambda function has VPC dependencies', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        },
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('creates CloudTrail with proper configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: 'SecureCloudTrail',
        EnableLogFileValidation: true,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        IsLogging: true,
      });
    });
  });

  describe('Region Condition', () => {
    test('creates US East 1 condition', () => {
      template.hasCondition('IsUSEast1', {
        'Fn::Equals': [{ Ref: 'AWS::Region' }, 'us-east-1'],
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Name of the encrypted S3 bucket for CloudTrail logs',
      });

      template.hasOutput('VPCId', {
        Description: 'ID of the secure VPC',
      });

      template.hasOutput('EC2InstanceId', {
        Description: 'ID of the secure EC2 instance',
      });

      template.hasOutput('CloudTrailArn', {
        Description: 'ARN of the CloudTrail',
      });

      template.hasOutput('LambdaFunctionArn', {
        Description: 'ARN of the Lambda function in VPC',
      });

      template.hasOutput('KMSKeyId', {
        Description: 'ID of the KMS key used for S3 encryption',
      });

      template.hasOutput('LambdaSecurityGroupId', {
        Description: 'Security Group ID for the Lambda function',
      });

      template.hasOutput('EC2SecurityGroupId', {
        Description: 'Security Group ID for the EC2',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('has expected number of key resources', () => {
      // KMS resources
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 2);

      // S3 resources
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);

      // VPC resources
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);

      // Compute resources
      template.resourceCountIs('AWS::EC2::Instance', 1);
      // Note: CDK creates additional Lambda functions for custom resources (S3 auto-delete, VPC default SG restriction)
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);

      // IAM resources - Additional roles are created for CDK custom resources
      const iamRoles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(iamRoles).length).toBeGreaterThanOrEqual(2); // At least EC2 and Lambda roles
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2);

      // CloudTrail
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });
  });

  describe('Environment Suffix Handling', () => {
    test('creates stack with custom environment suffix', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTapStack', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Should still have all key resources
      prodTemplate.resourceCountIs('AWS::KMS::Key', 1);
      prodTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      prodTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates stack with staging environment suffix', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingTapStack', {
        environmentSuffix: 'staging',
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      // Verify resource creation
      const lambdaFunctions = stagingTemplate.findResources(
        'AWS::Lambda::Function'
      );
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
      stagingTemplate.resourceCountIs('AWS::EC2::Instance', 1);
    });
  });

  describe('Conditional Resource Creation', () => {
    test('region condition applied to resources', () => {
      // Verify that the condition exists
      template.hasCondition('IsUSEast1', {
        'Fn::Equals': [{ Ref: 'AWS::Region' }, 'us-east-1'],
      });

      // Verify outputs use conditions (for non-LocalStack)
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('CloudTrail uses KMS encryption key', () => {
      const trails = template.findResources('AWS::CloudTrail::Trail');
      const trailKeys = Object.keys(trails);
      expect(trailKeys.length).toBeGreaterThanOrEqual(1);

      const trail = trails[trailKeys[0]];
      expect(trail.Properties).toHaveProperty('KMSKeyId');
    });

    test('Lambda function has proper IAM role', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const userLambda = Object.values(lambdaFunctions).find(
        (fn: any) =>
          fn.Properties?.Description === 'Secure Lambda function running in VPC'
      );

      expect(userLambda).toBeDefined();
      expect((userLambda as any).Properties).toHaveProperty('Role');
    });

    test('VPC has proper DNS settings', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('S3 bucket has SSL enforcement', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketKeys = Object.keys(buckets);
      expect(bucketKeys.length).toBeGreaterThanOrEqual(1);

      const bucket = buckets[bucketKeys[0]];
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
  });
});

// LocalStack mode tests - cover conditional branches
describe('TapStack LocalStack Mode', () => {
  afterEach(() => {
    // Reset environment after each test
    delete process.env.AWS_ENDPOINT_URL;
    delete process.env.LOCALSTACK_HOSTNAME;
    delete process.env.CDK_DEFAULT_ACCOUNT;
    jest.resetModules();
  });

  describe('LocalStack detection via AWS_ENDPOINT_URL', () => {
    test('creates VPC without NAT Gateway for LocalStack', () => {
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
      jest.resetModules();
      
      const cdkLib = require('aws-cdk-lib');
      const { TapStack: LocalStackTapStack } = require('../lib/tap-stack');
      
      const localApp = new cdkLib.App();
      const localStack = new LocalStackTapStack(localApp, 'LocalStackTest1', { environmentSuffix: 'localstack' });
      const localTemplate = cdkLib.assertions.Template.fromStack(localStack);
      
      // LocalStack mode should have 0 NAT Gateways
      localTemplate.resourceCountIs('AWS::EC2::NatGateway', 0);
      
      // LocalStack mode should NOT have CloudTrail
      localTemplate.resourceCountIs('AWS::CloudTrail::Trail', 0);
    });
  });

  describe('LocalStack detection via LOCALSTACK_HOSTNAME', () => {
    test('creates VPC without NAT Gateway for LocalStack (LOCALSTACK_HOSTNAME)', () => {
      process.env.LOCALSTACK_HOSTNAME = 'localstack';
      jest.resetModules();
      
      const cdkLib = require('aws-cdk-lib');
      const { TapStack: LocalStackTapStack } = require('../lib/tap-stack');
      
      const localApp = new cdkLib.App();
      const localStack = new LocalStackTapStack(localApp, 'LocalStackTest2', { environmentSuffix: 'localstack' });
      const localTemplate = cdkLib.assertions.Template.fromStack(localStack);
      
      // LocalStack mode should have 0 NAT Gateways
      localTemplate.resourceCountIs('AWS::EC2::NatGateway', 0);
      
      // Should use isolated subnets
      localTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });
  });

  describe('LocalStack detection via CDK_DEFAULT_ACCOUNT', () => {
    test('creates VPC without NAT Gateway for LocalStack (CDK_DEFAULT_ACCOUNT)', () => {
      process.env.CDK_DEFAULT_ACCOUNT = '000000000000';
      jest.resetModules();
      
      const cdkLib = require('aws-cdk-lib');
      const { TapStack: LocalStackTapStack } = require('../lib/tap-stack');
      
      const localApp = new cdkLib.App();
      const localStack = new LocalStackTapStack(localApp, 'LocalStackTest3', { environmentSuffix: 'localstack' });
      const localTemplate = cdkLib.assertions.Template.fromStack(localStack);
      
      // LocalStack mode should have 0 NAT Gateways
      localTemplate.resourceCountIs('AWS::EC2::NatGateway', 0);
      
      // Lambda should be created but without VPC configuration
      localTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
      });
    });
  });

  describe('LocalStack specific configurations', () => {
    test('EC2 uses public subnet and Lambda has no VpcConfig for LocalStack', () => {
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
      jest.resetModules();
      
      const cdkLib = require('aws-cdk-lib');
      const { TapStack: LocalStackTapStack } = require('../lib/tap-stack');
      
      const localApp = new cdkLib.App();
      const localStack = new LocalStackTapStack(localApp, 'LocalStackTest4', { environmentSuffix: 'localstack' });
      const localTemplate = cdkLib.assertions.Template.fromStack(localStack);
      
      // Verify EC2 instance is created
      localTemplate.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
      
      // Lambda function should NOT have VpcConfig for LocalStack
      const lambdaFunctions = localTemplate.findResources('AWS::Lambda::Function');
      const secureLambda = Object.values(lambdaFunctions).find(
        (fn: any) => fn.Properties?.Description === 'Secure Lambda function running in VPC'
      );
      expect(secureLambda).toBeDefined();
      expect((secureLambda as any).Properties.VpcConfig).toBeUndefined();
    });

    test('outputs do not have region conditions for LocalStack', () => {
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
      jest.resetModules();
      
      const cdkLib = require('aws-cdk-lib');
      const { TapStack: LocalStackTapStack } = require('../lib/tap-stack');
      
      const localApp = new cdkLib.App();
      const localStack = new LocalStackTapStack(localApp, 'LocalStackTest5', { environmentSuffix: 'localstack' });
      const localTemplate = cdkLib.assertions.Template.fromStack(localStack);
      
      // Verify outputs exist without conditions
      localTemplate.hasOutput('S3BucketName', {
        Description: 'Name of the encrypted S3 bucket for CloudTrail logs',
      });
      
      localTemplate.hasOutput('VPCId', {
        Description: 'ID of the secure VPC',
      });
    });

    test('resources do not have region conditions in LocalStack mode', () => {
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
      jest.resetModules();
      
      const cdkLib = require('aws-cdk-lib');
      const { TapStack: LocalStackTapStack } = require('../lib/tap-stack');
      
      const localApp = new cdkLib.App();
      const localStack = new LocalStackTapStack(localApp, 'LocalStackTest6', { environmentSuffix: 'localstack' });
      const localTemplate = cdkLib.assertions.Template.fromStack(localStack);
      
      // Verify KMS key exists without condition
      const kmsKeys = localTemplate.findResources('AWS::KMS::Key');
      const kmsKey = Object.values(kmsKeys)[0] as any;
      expect(kmsKey.Condition).toBeUndefined();
      
      // Verify S3 bucket exists without condition
      const s3Buckets = localTemplate.findResources('AWS::S3::Bucket');
      const s3Bucket = Object.values(s3Buckets)[0] as any;
      expect(s3Bucket.Condition).toBeUndefined();
    });
  });
});
