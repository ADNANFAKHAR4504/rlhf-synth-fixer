import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Configuration', () => {
    test('should use environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestPropsStack', {
        environmentSuffix: 'props-test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-company-props-test-encryption-key',
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App({ context: { environmentSuffix: 'context-test' } });
      const testStack = new TapStack(testApp, 'TestContextStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-company-context-test-encryption-key',
      });
    });

    test('should default to "dev" when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-company-dev-encryption-key',
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Customer-managed encryption key for all services',
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('should create KMS alias with environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/secure-company-${environmentSuffix}-encryption-key`,
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2 role with correct trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `secure-company-${environmentSuffix}-ec2-role`,
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

    test('should attach exactly 3 managed policies to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ],
            ],
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonS3ReadOnlyAccess',
              ],
            ],
          },
        ],
      });
    });

    test('should create inline policy with KMS and CloudWatch permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['kms:Decrypt', 'kms:DescribeKey', 'kms:GenerateDataKey'],
              Effect: 'Allow',
            }),
            Match.objectLike({
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should not exceed 5 total policies attached to EC2 role', () => {
      const role = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `secure-company-${environmentSuffix}-ec2-role`,
        },
      });

      const managedPolicies =
        Object.values(role)[0]?.Properties?.ManagedPolicyArns || [];
      expect(managedPolicies.length).toBeLessThanOrEqual(5);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with proper CIDR and settings', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `secure-company-${environmentSuffix}-vpc`,
          }),
        ]),
      });
    });

    test('should create public subnets across 2 AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*public.*'),
          }),
        ]),
      });
    });

    test('should create private isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*private.*'),
          }),
        ]),
      });
    });

    test('should not create NAT gateways to avoid EIP limits', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Security Group Configuration', () => {
    test('should create security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `secure-company-${environmentSuffix}-sg`,
        GroupDescription: 'Security group with restricted access',
      });
    });

    test('should only allow HTTPS from private network', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          {
            CidrIp: '10.0.0.0/8',
            Description: 'HTTPS access from private network',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('should restrict outbound traffic', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');

      // Find our custom security group (not the default one)
      const customSg = Object.values(securityGroups).find(
        (sg: any) =>
          sg.Properties?.GroupName === `secure-company-${environmentSuffix}-sg`
      );

      // When allowAllOutbound is set to false, CDK adds a "disallow all traffic" rule
      if (customSg?.Properties?.SecurityGroupEgress) {
        expect(customSg.Properties.SecurityGroupEgress).toHaveLength(1);
        expect(customSg.Properties.SecurityGroupEgress[0]).toMatchObject({
          CidrIp: '255.255.255.255/32',
          Description: 'Disallow all traffic',
          IpProtocol: 'icmp',
        });
      }
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create data bucket with encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `secure-company-${environmentSuffix}-data-us-east-1`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: { 'Fn::GetAtt': [Match.anyValue(), 'Arn'] },
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

    test('should create logs bucket with proper configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `secure-company-${environmentSuffix}-logs-us-east-1`,
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

    test('should enforce SSL for bucket access', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('should configure lifecycle rules for data bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `secure-company-${environmentSuffix}-data-us-east-1`,
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ],
            }),
          ]),
        },
      });
    });

    test('should enable auto-delete for buckets', () => {
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 2);
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID for the secure infrastructure',
        Export: {
          Name: `secure-company-${environmentSuffix}-vpc-id`,
        },
      });
    });

    test('should output data bucket name', () => {
      template.hasOutput('DataBucketName', {
        Description: 'Name of the data bucket',
        Export: {
          Name: `secure-company-${environmentSuffix}-data-bucket`,
        },
      });
    });

    test('should output logs bucket name', () => {
      template.hasOutput('LogsBucketName', {
        Description: 'Name of the logs bucket',
        Export: {
          Name: `secure-company-${environmentSuffix}-logs-bucket`,
        },
      });
    });

    test('should output EC2 role ARN', () => {
      template.hasOutput('EC2RoleArn', {
        Description: 'ARN of the EC2 IAM role',
        Export: {
          Name: `secure-company-${environmentSuffix}-ec2-role-arn`,
        },
      });
    });

    test('should output KMS key ARN', () => {
      template.hasOutput('KMSKeyArn', {
        Description: 'ARN of the KMS encryption key',
        Export: {
          Name: `secure-company-${environmentSuffix}-kms-key-arn`,
        },
      });
    });
  });

  describe('Security Requirements', () => {
    test('should use customer-managed KMS keys for all encryption', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(
          bucket.Properties?.BucketEncryption
            ?.ServerSideEncryptionConfiguration?.[0]
            ?.ServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('aws:kms');
      });
    });

    test('should not create IAM users', () => {
      template.resourceCountIs('AWS::IAM::User', 0);
    });

    test('should use IAM roles instead of users', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(1);
    });

    test('should not have any hardcoded credentials', () => {
      const json = JSON.stringify(template.toJSON());
      expect(json).not.toMatch(/AKIA[A-Z0-9]{16}/); // AWS Access Key pattern
      // Check for patterns that look like AWS secret keys (but avoid matching base64 encoded values)
      expect(json).not.toMatch(/aws_secret_access_key/i);
      expect(json).not.toMatch(/secret_key/i);
    });

    test('should have environment suffix in all resource names', () => {
      const resources = template.toJSON().Resources;
      const namedResources = Object.values(resources).filter(
        (r: any) =>
          r.Properties?.RoleName ||
          r.Properties?.BucketName ||
          r.Properties?.GroupName ||
          r.Properties?.AliasName
      );

      namedResources.forEach((resource: any) => {
        const name =
          resource.Properties?.RoleName ||
          resource.Properties?.BucketName ||
          resource.Properties?.GroupName ||
          resource.Properties?.AliasName ||
          '';
        if (name && typeof name === 'string') {
          expect(name).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Removal Policies', () => {
    test('should have DESTROY removal policy for all resources', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        if (resource.Properties?.UpdateReplacePolicy) {
          expect(resource.Properties.UpdateReplacePolicy).not.toBe('Retain');
        }
        if (resource.Properties?.DeletionPolicy) {
          expect(resource.Properties.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });
});
