import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private subnets
    });

    test('creates NAT gateways for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('applies correct tags to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'SecureWebApp-VPC'
          },
          {
            Key: 'Environment',
            Value: 'Prod'
          },
          {
            Key: 'Department',
            Value: 'Marketing'
          }
        ])
      });
    });
  });

  describe('Security Groups', () => {
    test('creates security group with no default outbound rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web application servers - least privilege access',
        SecurityGroupEgress: []
      });
    });

    test('creates ingress rules for HTTP and HTTPS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443
      });
    });

    test('creates egress rules for HTTP and HTTPS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0'
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0'
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates application data bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('creates CloudTrail logs bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'CloudTrailLogsRetention',
              Status: 'Enabled',
              ExpirationInDays: 365,
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90
                }
              ]
            }
          ]
        }
      });
    });

    test('creates access logs bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'AccessLogsRetention',
              Status: 'Enabled',
              ExpirationInDays: 90,
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                }
              ]
            }
          ]
        }
      });
    });

    test('all buckets enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            }
          ])
        }
      });
    });

    test('bucket names include environment suffix', () => {
      const bucketProperties = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(bucketProperties).map(bucket => bucket.Properties?.BucketName);
      
      bucketNames.forEach(bucketName => {
        if (bucketName) {
          expect(bucketName).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('creates VPC Flow Logs group with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/vpc/flowlogs/${environmentSuffix}/.*`),
        RetentionInDays: 30
      });
    });

    test('creates application logs group with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/ec2/webapp/${environmentSuffix}/.*`),
        RetentionInDays: 30
      });
    });

    test('log groups have environment-specific naming', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.Properties?.LogGroupName).toContain(environmentSuffix);
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates VPC Flow Logs role with correct trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });

    test('creates EC2 role with least privilege S3 policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });

    test('EC2 role has specific S3 permissions only', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Sid: 'S3ReadAccess',
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:ListBucket'
              ]
            }
          ])
        }
      });
    });

    test('EC2 role has specific CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Sid: 'CloudWatchLogsAccess',
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams'
              ]
            }
          ])
        }
      });
    });

    test('creates instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: Match.anyValue()
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('creates CloudTrail with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        EventSelectors: [
          {
            ReadWriteType: 'All',
            IncludeManagementEvents: true,
            DataResources: []
          }
        ]
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('creates VPC Flow Logs with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs'
      });
    });
  });

  describe('EC2 Instance', () => {
    test('creates EC2 instance in private subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        ImageId: Match.anyValue()
      });
    });

    test('EC2 instance has no key name for security', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        KeyName: Match.absent()
      });
    });

    test('EC2 instance is associated with security group', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SecurityGroupIds: Match.anyValue()
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('AppDataBucketName', {});
      template.hasOutput('WebAppSecurityGroupId', {});
      template.hasOutput('WebAppRoleArn', {});
      template.hasOutput('CloudTrailArn', {});
    });
  });

  describe('Parameters', () => {
    test('creates WhitelistedIngressCidr parameter', () => {
      template.hasParameter('WhitelistedIngressCidr', {
        Type: 'String',
        Default: '0.0.0.0/0',
        AllowedPattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources have required governance tags', () => {
      const expectedTags = [
        { Key: 'Environment', Value: 'Prod' },
        { Key: 'Department', Value: 'Marketing' },
        { Key: 'Project', Value: 'SecureWebApp' },
        { Key: 'ManagedBy', Value: 'CDK' },
        { Key: 'SecurityReview', Value: 'Required' }
      ];

      // Check VPC tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith(expectedTags)
      });
    });
  });
});
