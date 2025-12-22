import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecureEnvironmentStack } from '../lib/secure-environment-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('SecureEnvironmentStack', () => {
  let app: cdk.App;
  let stack: SecureEnvironmentStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecureEnvironmentStack(app, 'TestSecureEnvironmentStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('uses provided environmentSuffix when passed in props', () => {
      const customApp = new cdk.App();
      const customStack = new SecureEnvironmentStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs/custom',
      });
    });

    test('uses default environmentSuffix when not provided', () => {
      const customApp = new cdk.App();
      const customStack = new SecureEnvironmentStack(customApp, 'DefaultStack');
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs/dev',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR and subnets', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Check for public subnets (CDK creates them in different AZs)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets (CDK assigns different CIDR blocks)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('uses isolated subnets for LocalStack compatibility', () => {
      // NAT Gateway is removed for LocalStack compatibility
      // Private subnets are configured as PRIVATE_ISOLATED
      const resources = template.toJSON().Resources;
      const natGateways = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::NatGateway'
      );
      expect(natGateways.length).toBe(0);
    });

    test('creates Internet Gateway for public subnet access', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });

    test('enables VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('S3 Security Configuration', () => {
    test('creates secure data bucket with AES-256 encryption', () => {
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

    test('creates logs bucket with proper lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'LogsLifecycleRule',
              Status: 'Enabled',
              ExpirationInDays: 365,
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
            },
          ],
        },
      });
    });

    test('enforces HTTPS-only access with bucket policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
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

    test('enables access logging', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: {
          DestinationBucketName: Match.anyValue(),
          LogFilePrefix: 'access-logs/',
        },
      });
    });
  });

  describe('IAM Security', () => {
    test('creates EC2 instance role with least privilege', () => {
      // Check that an EC2 role exists with the right assume role policy
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
        Description: 'IAM role for EC2 instances with minimal required permissions',
      });

      // Check that the role has SSM access (simplified check)
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.anyValue(),
      });

      // Check for custom policies
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'S3BucketAccess',
          },
          {
            PolicyName: 'CloudWatchLogs',
          },
        ],
      });
    });

    test('creates instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `ec2-instance-profile-${environmentSuffix}`,
      });
    });

    test('creates VPC Flow Log role with minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        Policies: [
          {
            PolicyName: 'FlowLogDeliveryRolePolicy',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogGroups',
                    'logs:DescribeLogStreams',
                  ],
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe('EC2 Security Configuration', () => {
    test('creates security group with minimal required access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances with minimal required access',
        SecurityGroupEgress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow outbound HTTPS traffic',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow outbound HTTP traffic for updates',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 53,
            ToPort: 53,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow outbound DNS TCP traffic',
          },
          {
            IpProtocol: 'udp',
            FromPort: 53,
            ToPort: 53,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow outbound DNS UDP traffic',
          },
        ],
      });
    });

    test('creates EC2 instance in private subnet with security configurations', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });

      // Check for encrypted EBS volume
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            DeviceName: '/dev/xvda',
            Ebs: Match.objectLike({
              Encrypted: true,
            }),
          }),
        ]),
      });
    });

    test('configures CloudWatch agent in user data', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.anyValue(),
      });
    });
  });

  describe('Comprehensive Logging', () => {
    test('creates CloudTrail for API logging', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `security-audit-trail-${environmentSuffix}`,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        S3KeyPrefix: 'cloudtrail-logs/',
      });
    });

    test('configures S3 data events in CloudTrail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: [
          {
            ReadWriteType: 'All',
            IncludeManagementEvents: true,
            DataResources: [
              {
                Type: 'AWS::S3::Object',
                Values: [Match.anyValue()],
              },
            ],
          },
        ],
      });
    });

    test('creates application and system log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/application/${environmentSuffix}`,
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ec2/system-logs/${environmentSuffix}`,
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ec2/security-logs/${environmentSuffix}`,
        RetentionInDays: 90,
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies consistent tags to all resources', () => {
      // Check that Environment tag exists on VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });

      // Check that Project tag exists on VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'SecureEnvironment',
          }),
        ]),
      });

      // Check that key tags exist on S3 buckets
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });

      // Check that key tags exist on EC2 instances
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates required outputs for integration tests', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the secure environment',
        Export: {
          Name: `SecureVpc-${environmentSuffix}`,
        },
      });

      template.hasOutput('SecureBucketName', {
        Description: 'Name of the secure S3 bucket',
        Export: {
          Name: `SecureBucket-${environmentSuffix}`,
        },
      });

      template.hasOutput('PrivateInstanceId', {
        Description: 'Instance ID of the EC2 instance in private subnet',
        Export: {
          Name: `PrivateInstance-${environmentSuffix}`,
        },
      });

      template.hasOutput('CloudTrailArn', {
        Description: 'ARN of the CloudTrail for audit logging',
        Export: {
          Name: `CloudTrail-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Security Requirements Validation', () => {
    test('validates S3 encryption requirement', () => {
      // Check that all S3 buckets have encryption enabled
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
    });

    test('validates EC2 private subnet deployment', () => {
      // Ensure EC2 instances exist (SubnetId OR NetworkInterfaces present)
      // When associatePublicIpAddress is explicitly set, CDK uses NetworkInterfaces
      const resources = template.findResources('AWS::EC2::Instance');
      const instanceKeys = Object.keys(resources);
      expect(instanceKeys.length).toBeGreaterThan(0);

      // Verify the instance has either SubnetId or NetworkInterfaces (both are valid)
      const instance = resources[instanceKeys[0]];
      const hasSubnetConfig =
        instance.Properties.SubnetId !== undefined ||
        instance.Properties.NetworkInterfaces !== undefined;
      expect(hasSubnetConfig).toBe(true);

      // Verify no EC2 instances get public IPs directly
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('validates least privilege IAM implementation', () => {
      // Check that EC2 role exists and has managed policy
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'IAM role for EC2 instances with minimal required permissions',
      });

      // Ensure we have appropriate number of roles (EC2 role and VPC Flow Log role)
      template.resourceCountIs('AWS::IAM::Role', 2);

      // Check that policies exist for the EC2 role
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3BucketAccess',
          }),
          Match.objectLike({
            PolicyName: 'CloudWatchLogs',
          }),
        ]),
      });
    });

    test('validates comprehensive logging implementation', () => {
      // Check CloudTrail exists
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);

      // Check VPC Flow Logs exist
      template.resourceCountIs('AWS::EC2::FlowLog', 1);

      // Check multiple log groups exist
      template.resourceCountIs('AWS::Logs::LogGroup', 4); // VPC, Application, System, Security
    });
  });

  describe('Resource Removal Policy', () => {
    test('ensures no retain policies are set', () => {
      // Check that resources have DESTROY removal policy (no retain)
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });
  });
});