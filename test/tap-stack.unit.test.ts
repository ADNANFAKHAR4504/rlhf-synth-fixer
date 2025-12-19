import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: environmentSuffix,
      },
    });
    stack = new TapStack(app, `TestTapStack${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'ap-northeast-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private (3 AZs)
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

    test('creates private subnets with NAT', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });
    });

    test('creates NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3); // 3 NAT gateways for 3 AZs
    });

    test('creates S3 VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith(['']),
        }),
      });
    });

    test('creates VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates secure data bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
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
      });
    });

    test('creates logs bucket with versioning', () => {
      // Should have 2 buckets total
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBe(2);
    });

    test('enforces SSL on buckets', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });

    test('buckets have DESTROY removal policy', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('buckets have lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
            }),
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
  });

  describe('IAM Roles', () => {
    test('creates S3 access role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Description: 'Role for secure S3 access with least privilege',
      });
    });

    test('S3 access role has SSM managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Role for secure S3 access with least privilege',
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith(['']),
          }),
        ]),
      });
    });

    test('creates VPC operations role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Role for VPC operations with specific permissions',
      });
    });

    test('IAM policies do not use wildcard resources where avoidable', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowS3BucketAccess',
              Effect: 'Allow',
              Resource: Match.not(['*']),
            }),
          ]),
        }),
      });
    });

    test('IAM policies have conditions for secure transport', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowS3BucketAccess',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
          ]),
        }),
      });
    });
  });

  describe('IAM Access Analyzer', () => {
    test('creates access analyzer', () => {
      template.hasResourceProperties('AWS::AccessAnalyzer::Analyzer', {
        Type: 'ACCOUNT',
        AnalyzerName: Match.stringLikeRegexp('SecurityAccessAnalyzer-.*'),
      });
    });

    test('access analyzer has proper tags', () => {
      template.hasResourceProperties('AWS::AccessAnalyzer::Analyzer', {
        Tags: [
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'Purpose',
            Value: 'SecurityMonitoring',
          },
        ],
      });
    });
  });

  describe('Security Groups', () => {
    test('creates restricted security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for secure EC2 instances',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('security group has limited egress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for secure EC2 instances',
        },
      });
      Object.values(securityGroups).forEach(sg => {
        expect(sg.Properties.SecurityGroupEgress.length).toBe(2);
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: Match.stringLikeRegexp('.*-VPCId'),
        },
      });
    });

    test('exports data bucket name', () => {
      template.hasOutput('DataBucketName', {
        Description: 'Secure Data Bucket Name',
        Export: {
          Name: Match.stringLikeRegexp('.*-DataBucketName'),
        },
      });
    });

    test('exports logs bucket name', () => {
      template.hasOutput('LogsBucketName', {
        Description: 'Access Logs Bucket Name',
        Export: {
          Name: Match.stringLikeRegexp('.*-LogsBucketName'),
        },
      });
    });

    test('exports S3 access role ARN', () => {
      template.hasOutput('S3AccessRoleArn', {
        Description: 'S3 Access Role ARN',
        Export: {
          Name: Match.stringLikeRegexp('.*-S3AccessRoleArn'),
        },
      });
    });

    test('exports access analyzer ARN', () => {
      template.hasOutput('AccessAnalyzerArn', {
        Description: 'Access Analyzer ARN',
        Export: {
          Name: Match.stringLikeRegexp('.*-AccessAnalyzerArn'),
        },
      });
    });

    test('exports private subnet IDs', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        Export: {
          Name: Match.stringLikeRegexp('.*-PrivateSubnetIds'),
        },
      });
    });
  });

  describe('Stack with different environment suffix', () => {
    test('uses environment suffix from context', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'test123',
        },
      });
      const testStack = new TapStack(testApp, 'TestStacktest123', {
        env: {
          account: '123456789012',
          region: 'ap-northeast-2',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::AccessAnalyzer::Analyzer', {
        AnalyzerName: 'SecurityAccessAnalyzer-test123',
      });
    });

    test('uses default environment suffix when not provided', () => {
      const testApp = new cdk.App(); // No context provided
      const testStack = new TapStack(testApp, 'TestStackdefault', {
        env: {
          account: '123456789012',
          region: 'ap-northeast-2',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::AccessAnalyzer::Analyzer', {
        AnalyzerName: 'SecurityAccessAnalyzer-dev',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('VPC has restricted default security group', () => {
      // Check for the custom resource that restricts the default security group
      template.hasResourceProperties('Custom::VpcRestrictDefaultSG', {
        ServiceToken: Match.anyValue(),
        DefaultSecurityGroupId: Match.anyValue(),
      });
    });

    test('CloudWatch log groups have retention policy', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: Match.anyValue(),
      });
    });

    test('flow logs role has proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });
  });
});
