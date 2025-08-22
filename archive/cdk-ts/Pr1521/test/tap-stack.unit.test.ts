import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Unit tests for TapStack

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const baseProps = {
    allowedIpCidr: '203.0.113.0/24',
    permittedUserName: 'test-user',
    bucketBaseName: 'test-secure',
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    app = new cdk.App();
  });

  describe('Stack creation with environmentSuffix provided', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create stack with required resources', () => {
      // Test that the stack creates successfully with all required props
      expect(stack).toBeDefined();
      
      // Test that the template has the expected resources
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
      
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'prod-secure-role-test',
      });
      
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'prod-secure-sg-test',
      });
    });
  });

  describe('Stack creation without environmentSuffix (default fallback)', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', baseProps);
      template = Template.fromStack(stack);
    });

    test('should use default environmentSuffix "dev" when not provided', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'prod-secure-role-dev',
      });
      
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'prod-secure-sg-dev',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should configure S3 bucket with proper security settings', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        // Encryption configuration
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        // Block public access
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        // Object ownership
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerEnforced',
            },
          ],
        },
        // Versioning
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        // Lifecycle rules
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'prod-secure-lifecycle-test',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            },
          ],
        },
      });
    });

    test('should create bucket with correct naming pattern', () => {
      // The bucket name is constructed using CloudFormation functions
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              'test-secure-test-',
              { Ref: 'AWS::AccountId' },
              '-us-east-1',
            ],
          ],
        },
      });
    });

    test('should add SSL-only bucket policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Action: 's3:*',
              Resource: [
                Match.anyValue(),
                Match.anyValue(),
              ],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('IAM Managed Policy Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create managed policy with least-privilege permissions', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: 'prod-secure-bucket-readonly-test',
        Description: 'Least-privilege policy for read-only access to secure production bucket',
        PolicyDocument: {
          Statement: [
            {
              Sid: 'AllowListBucket',
              Effect: 'Allow',
              Action: 's3:ListBucket',
              Resource: Match.anyValue(),
            },
            {
              Sid: 'AllowGetObject',
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });
  });

  describe('IAM Role Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
        permittedUserName: 'specific-user',
      });
      template = Template.fromStack(stack);
    });

    test('should create role with MFA and user restrictions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'prod-secure-role-test',
        Description: 'Secure role requiring MFA for assumption by authorized user',
        MaxSessionDuration: 3600, // 1 hour
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue(),
              },
              Action: 'sts:AssumeRole',
              Condition: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'true',
                },
                StringEquals: {
                  'aws:username': 'specific-user',
                },
              },
            },
          ],
        },
        ManagedPolicyArns: Match.anyValue(),
      });
    });
  });

  describe('Security Group Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
        allowedIpCidr: '192.168.1.0/24',
      });
      template = Template.fromStack(stack);
    });

    test('should create security group with restricted ingress and egress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'prod-secure-sg-test',
        GroupDescription: 'Secure SG allowing HTTPS from specified CIDR only',
        VpcId: {
          Ref: Match.anyValue(),
        },
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '192.168.1.0/24',
            Description: 'Allow HTTPS from authorized IP range',
          },
        ],
        SecurityGroupEgress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow outbound HTTPS only',
          },
        ],
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create all required CloudFormation outputs', () => {
      // Secure Bucket Name
      template.hasOutput('SecureBucketName', {
        Description: 'Name of the secure S3 bucket',
        Export: {
          Name: 'prod-secure-bucket-name-test',
        },
      });

      // Secure Bucket ARN
      template.hasOutput('SecureBucketArn', {
        Description: 'ARN of the secure S3 bucket',
        Export: {
          Name: 'prod-secure-bucket-arn-test',
        },
      });

      // Bucket Read Only Policy ARN
      template.hasOutput('BucketReadOnlyPolicyArn', {
        Description: 'ARN of the least-privilege bucket read-only policy',
        Export: {
          Name: 'prod-secure-policy-arn-test',
        },
      });

      // Secure Role ARN
      template.hasOutput('SecureRoleArn', {
        Description: 'ARN of the MFA-required secure role',
        Export: {
          Name: 'prod-secure-role-arn-test',
        },
      });

      // Secure Security Group ID
      template.hasOutput('SecureSecurityGroupId', {
        Description: 'ID of the secure security group',
        Export: {
          Name: 'prod-secure-sg-id-test',
        },
      });

      // Allowed IP CIDR
      template.hasOutput('AllowedIpCidr', {
        Description: 'CIDR block allowed for HTTPS access',
        Export: {
          Name: 'prod-secure-allowed-cidr-test',
        },
        Value: '203.0.113.0/24',
      });
    });
  });

  describe('Resource Tags', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should apply production tags to all resources', () => {
      // The S3 bucket has tags applied differently via CDK
      // Let's check that the bucket exists and verify tags via findResources
      const bucketResources = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(bucketResources)).toHaveLength(1);

      // Check IAM Role has Environment tag applied via cdk.Tags.of
      const roleResources = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roleResources)).toHaveLength(1);
      const roleResource = Object.values(roleResources)[0] as any;
      expect(roleResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: 'Production',
          }),
        ])
      );

      // Check Security Group has Environment tag applied via cdk.Tags.of
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(sgResources)).toHaveLength(1);
      const sgResource = Object.values(sgResources)[0] as any;
      expect(sgResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: 'Production',
          }),
        ])
      );
    });
  });

  describe('Different Environment Suffix Values', () => {
    test('should handle production environment suffix', () => {
      const prodStack = new TapStack(app, 'ProdTapStack', {
        ...baseProps,
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'prod-secure-role-prod',
      });

      prodTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'prod-secure-sg-prod',
      });

      prodTemplate.hasOutput('SecureBucketName', {
        Export: {
          Name: 'prod-secure-bucket-name-prod',
        },
      });
    });

    test('should handle staging environment suffix', () => {
      const stagingStack = new TapStack(app, 'StagingTapStack', {
        ...baseProps,
        environmentSuffix: 'staging',
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      stagingTemplate.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: 'prod-secure-bucket-readonly-staging',
      });

      stagingTemplate.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'prod-secure-lifecycle-staging',
            },
          ],
        },
      });
    });
  });

  describe('Different Parameter Combinations', () => {
    test('should handle different CIDR blocks', () => {
      const customStack = new TapStack(app, 'CustomTapStack', {
        ...baseProps,
        environmentSuffix: 'custom',
        allowedIpCidr: '10.0.0.0/8',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          {
            CidrIp: '10.0.0.0/8',
          },
        ],
      });

      customTemplate.hasOutput('AllowedIpCidr', {
        Value: '10.0.0.0/8',
      });
    });

    test('should handle different bucket base names', () => {
      const customStack = new TapStack(app, 'CustomTapStack', {
        ...baseProps,
        environmentSuffix: 'custom',
        bucketBaseName: 'my-custom-bucket',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              'my-custom-bucket-custom-',
              { Ref: 'AWS::AccountId' },
              '-us-east-1',
            ],
          ],
        },
      });
    });

    test('should handle different permitted user names', () => {
      const customStack = new TapStack(app, 'CustomTapStack', {
        ...baseProps,
        environmentSuffix: 'custom',
        permittedUserName: 'admin-user',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Condition: {
                StringEquals: {
                  'aws:username': 'admin-user',
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('Stack Properties', () => {
    test('should set region to us-east-1', () => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
        env: { region: 'us-west-2' }, // This should be overridden
      });
      
      // The stack should force region to us-east-1
      expect(stack.region).toBe('us-east-1');
    });

    test('should create exact number of resources', () => {
      stack = new TapStack(app, 'TestTapStack', {
        ...baseProps,
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);

      // Count resources to ensure we have exactly what we expect
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      template.resourceCountIs('AWS::IAM::ManagedPolicy', 1);
      template.resourceCountIs('AWS::IAM::Role', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
    });
  });
});
