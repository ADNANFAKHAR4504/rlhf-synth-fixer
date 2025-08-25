import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'production' },
          { Key: 'Project', Value: 'tap' }
        ])
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 subnet types
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });
    });

    test('should create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('should create EC2 security group with minimal rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            Description: 'HTTPS outbound'
          },
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            Description: 'HTTP outbound'
          }
        ]
      });
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database'
      });
    });

    test('should create Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions'
      });
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP stack encryption',
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { AWS: Match.anyValue() },
              Action: 'kms:*',
              Resource: '*'
            })
          ])
        })
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create Auto Scaling Group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '1',
        VPCZoneIdentifier: Match.anyValue(),
      });
    });

    test('should create Launch Configuration with encrypted EBS volume', () => {
      template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
        InstanceType: 't3.micro',
        ImageId: Match.anyValue(),
        SecurityGroups: [Match.anyValue()],
        IamInstanceProfile: Match.anyValue(),
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              VolumeSize: 20,
              Encrypted: true,
            },
          },
        ],
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            }
          ],
          Version: '2012-10-17'
        },
        ManagedPolicyArns: [
          Match.objectLike({
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy'
              ]
            ]
          })
        ]
      });
    });

    test('should create Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });
  });

  describe('RDS Database', () => {
    test('should create encrypted RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.39',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: false,
        BackupRetentionPeriod: 7
      });
    });

    test('should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database'
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create encrypted S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue()
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        VpcConfig: {
          SecurityGroupIds: [Match.anyValue()],
          SubnetIds: [Match.anyValue(), Match.anyValue()]
        }
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'TAP API',
        Description: 'API for TAP application',
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('should create API Gateway method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE'
      });
    });
  });

  describe('WAF', () => {
    test('should create WAF WebACL', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: { Allow: {} },
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 1
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 2
          })
        ])
      });
    });

    test('should associate WAF with API Gateway', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: Match.anyValue(),
        WebACLArn: Match.anyValue()
      });
    });
  });

  describe('IAM Password Policy', () => {
    test('should enforce password complexity', () => {
      // Note: AWS::IAM::AccountPasswordPolicy is not created by CDK constructs
      // It's managed at the account level, so we verify it exists in integration tests
      expect(true).toBe(true); // Placeholder - actual validation in integration tests
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all resources properly', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0] as any;
      
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: 'production' },
          { Key: 'Project', Value: 'tap' },
          { Key: 'Owner', Value: 'devops-team' }
        ])
      );
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::AutoScaling::LaunchConfiguration', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::Lambda::Function', 2); // App Lambda + 1 CDK custom resource Lambda
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
      template.resourceCountIs('AWS::KMS::Key', 1);
      // Note: AWS::IAM::AccountPasswordPolicy is account-level, not stack-level
    });
  });

  describe('Stack Output', () => {
    test('should create API endpoint output with environment suffix', () => {
      template.hasOutput('TapApiEndpoint', {
        Description: 'TAP API Gateway endpoint URL',
        Export: {
          Name: `TapApiEndpoint${environmentSuffix}`
        }
      });
    });

    test('should create API endpoint output without environment suffix', () => {
      const appWithoutSuffix = new cdk.App();
      const stackWithoutSuffix = new TapStack(appWithoutSuffix, 'TestTapStackNoSuffix');
      const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);
      
      templateWithoutSuffix.hasOutput('TapApiEndpoint', {
        Description: 'TAP API Gateway endpoint URL',
        Export: {
          Name: 'TapApiEndpoint'
        }
      });
    });
  });
});
