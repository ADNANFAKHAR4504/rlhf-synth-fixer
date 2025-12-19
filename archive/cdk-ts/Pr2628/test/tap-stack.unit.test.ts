import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates stack successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('applies correct tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'Purpose',
            Value: 'security-infrastructure',
          },
        ])
      });
    });
  });

  describe('KMS Keys', () => {
    test('creates S3 KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: `KMS key for S3 bucket encryption in ${environmentSuffix} environment`,
      });

      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue(),
              },
              Action: 'kms:*',
              Resource: '*',
            },
          ]),
        },
      });
    });

    test('creates EBS KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 2);
    });

    test('creates KMS aliases', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-s3-key-${environmentSuffix}`,
      });
      
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-ebs-key-${environmentSuffix}`,
      });
    });
  });

  describe('SSM Parameters', () => {
    test('stores KMS key ARNs in Parameter Store', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/tap/${environmentSuffix}/kms/s3-key-arn`,
        Type: 'String',
        Description: 'S3 KMS Key ARN for encryption',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/tap/${environmentSuffix}/kms/ebs-key-arn`,
        Type: 'String',
        Description: 'EBS KMS Key ARN for encryption',
      });
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates correct number of subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 subnet types
    });

    test('creates private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
      });
    });

    test('creates internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with restrictive rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers with restricted access',
        SecurityGroupEgress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow outbound HTTPS',
          },
        ],
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '10.0.0.0/8',
            Description: 'Allow HTTPS from trusted range 1',
          },
        ],
      });
    });

    test('creates database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database servers',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        SourceSecurityGroupId: Match.anyValue(),
        Description: 'Allow PostgreSQL from web tier',
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates EC2 instance role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: [
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
        ],
      });
    });

    test('creates admin role with MFA requirements', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue(),
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        Policies: [
          {
            PolicyName: 'AdminPolicy',
            PolicyDocument: {
              Statement: Match.arrayWith([
                {
                  Effect: 'Allow',
                  Action: '*',
                  Resource: '*',
                  Condition: {
                    Bool: {
                      'aws:MultiFactorAuthPresent': 'true',
                    },
                    NumericLessThan: {
                      'aws:MultiFactorAuthAge': '3600',
                    },
                  },
                },
              ]),
            },
          },
        ],
      });
    });

    test('EC2 role has KMS access policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'KMSAccessPolicy',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: Match.anyValue(),
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates secure S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              },
              BucketKeyEnabled: true,
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'delete-incomplete-multipart-uploads',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 1,
              },
            },
            {
              Id: 'transition-to-ia',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });

    test('creates S3 bucket policy to enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Action: 's3:*',
              Resource: Match.anyValue(),
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

  describe('CloudWatch Alarms', () => {
    test('creates security monitoring alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-unauthorized-access-${environmentSuffix}`,
        AlarmDescription: 'Alarm for unauthorized access attempts',
        MetricName: 'StatusCheckFailed',
        Namespace: 'AWS/EC2',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('Outputs', () => {
    test('creates all required outputs', () => {
      const outputs = template.findOutputs('*');
      
      expect(outputs).toHaveProperty(`VpcId${environmentSuffix}`);
      expect(outputs).toHaveProperty(`S3BucketName${environmentSuffix}`);
      expect(outputs).toHaveProperty(`S3KmsKeyId${environmentSuffix}`);
      expect(outputs).toHaveProperty(`Ec2RoleArn${environmentSuffix}`);
      expect(outputs).toHaveProperty(`WebSecurityGroupId${environmentSuffix}`);
      expect(outputs).toHaveProperty(`AdminRoleArn${environmentSuffix}`);
    });

    test('outputs have correct export names', () => {
      template.hasOutput(`VpcId${environmentSuffix}`, {
        Export: {
          Name: `tap-vpc-id-${environmentSuffix}`,
        },
      });

      template.hasOutput(`S3BucketName${environmentSuffix}`, {
        Export: {
          Name: `tap-s3-bucket-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Environment Configuration', () => {
    test('uses environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'prod',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-s3-key-prod',
      });
    });

    test('uses environment suffix from context', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-s3-key-staging',
      });
    });

    test('defaults to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-s3-key-dev',
      });
    });

    test('uses custom IP ranges from context', () => {
      const ipApp = new cdk.App({
        context: {
          allowedIpRanges: ['192.168.1.0/24', '172.16.0.0/16'],
        },
      });
      const ipStack = new TapStack(ipApp, 'IpStack', { environmentSuffix });
      const ipTemplate = Template.fromStack(ipStack);

      ipTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '192.168.1.0/24',
            Description: 'Allow HTTPS from trusted range 1',
          }),
          Match.objectLike({
            CidrIp: '172.16.0.0/16',
            Description: 'Allow HTTPS from trusted range 2',
          }),
        ]),
      });
    });

    test('uses default IP ranges when none provided in context', () => {
      const defaultIpApp = new cdk.App();
      const defaultIpStack = new TapStack(defaultIpApp, 'DefaultIpStack', { environmentSuffix });
      const defaultIpTemplate = Template.fromStack(defaultIpStack);

      defaultIpTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '10.0.0.0/8',
            Description: 'Allow HTTPS from trusted range 1',
          },
        ],
      });
    });
  });

  describe('Resource Counts', () => {
    test('creates expected number of resources', () => {
      template.resourceCountIs('AWS::KMS::Key', 2);
      template.resourceCountIs('AWS::KMS::Alias', 2);
      template.resourceCountIs('AWS::SSM::Parameter', 2);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.resourceCountIs('AWS::IAM::Role', 2);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
    });
  });
});
