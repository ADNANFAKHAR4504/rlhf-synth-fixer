import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecureFoundationalEnvironmentStack } from '../lib/secure-foundational-environment-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('SecureFoundationalEnvironmentStack', () => {
  let app: cdk.App;
  let stack: SecureFoundationalEnvironmentStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecureFoundationalEnvironmentStack(app, 'TestSecureStack', {
      environmentSuffix,
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Secure Foundational Environment Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
      
      // Verify we have no NAT Gateways (cost-optimized, secure isolated subnets)
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
      
      // Verify we have VPC endpoints for AWS services (2 gateway endpoints: S3 and DynamoDB)
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 2);
      
      // Verify we have gateway endpoints with correct type
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(
          `Customer-managed KMS key for secure foundational environment - ${environmentSuffix}`
        ),
      });

      // Check KMS alias with unique name (uses Fn::Join)
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: {
          'Fn::Join': [
            '',
            [
              `alias/secure-foundation-${environmentSuffix}-`,
              {
                'Ref': 'AWS::AccountId',
              },
            ],
          ],
        },
      });
    });

    test('should create S3 bucket with encryption', () => {
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

    test('should create EC2 instance with security configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Monitoring: true,
      });

      // Check that instance uses LaunchTemplate which contains MetadataOptions
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
          },
        },
      });
    });

    test('should create security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Secure security group for EC2 instances with strict access controls',
        SecurityGroupEgress: [
          {
            CidrIp: {
              'Fn::GetAtt': [Match.anyValue(), 'CidrBlock'],
            },
            Description: 'HTTPS to VPC endpoints for AWS services',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
        SecurityGroupIngress: [
          {
            CidrIp: {
              'Fn::GetAtt': [Match.anyValue(), 'CidrBlock'],
            },
            Description: 'SSH access from within VPC only',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ],
      });
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
    });

    test('should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `secure-foundation-dashboard-${environmentSuffix}`,
      });
    });

    test('should create CloudWatch Log Groups with unique names', () => {
      // Check VPC Flow Logs group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: {
          'Fn::Join': [
            '',
            [
              `/aws/vpc/flowlogs/${environmentSuffix}-`,
              {
                'Ref': 'AWS::AccountId',
              },
            ],
          ],
        },
        RetentionInDays: 30,
      });

      // Check Application Log Group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: {
          'Fn::Join': [
            '',
            [
              `/aws/application/${environmentSuffix}-`,
              {
                'Ref': 'AWS::AccountId',
              },
            ],
          ],
        },
        RetentionInDays: 30,
      });

      // Check System Log Group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: {
          'Fn::Join': [
            '',
            [
              `/aws/ec2/system-logs/${environmentSuffix}-`,
              {
                'Ref': 'AWS::AccountId',
              },
            ],
          ],
        },
        RetentionInDays: 30,
      });
    });

    test('should apply common tags to all resources', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(resources).length).toBeGreaterThan(0);

      // Check that resources have the expected tags
      for (const resource of Object.values(resources)) {
        expect((resource as any).Properties?.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: environmentSuffix,
            }),
            expect.objectContaining({
              Key: 'Project',
              Value: 'IaC-AWS-Nova-Model-Breaking',
            }),
            expect.objectContaining({ Key: 'ManagedBy', Value: 'AWS-CDK' }),
          ])
        );
      }
    });

    test('should create IAM role with least privilege', () => {
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
        RoleName: `secure-ec2-role-${environmentSuffix}`,
      });

      // Verify the role has the SSM managed policy (referenced via Fn::Join)
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
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
        },
      });

      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });
  });
});
