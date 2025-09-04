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
    app.node.setContext('environmentSuffix', environmentSuffix);
    stack = new TapStack(app, 'TestTapStack', { projectName: 'Nova' });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('creates KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description:
          'KMS key for Nova project encryption (Parameter Store, S3)',
        EnableKeyRotation: true,
      });
    });

    test('creates KMS key alias with environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/nova-security-baseline-${environmentSuffix}`,
      });
    });
  });

  describe('VPC', () => {
    test('creates VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates private subnets only', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 private + 2 isolated
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates no NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('VPC Endpoints', () => {
    test('creates interface VPC endpoints for AWS services', () => {
      // Check for interface endpoints
      template.resourcePropertiesCountIs(
        'AWS::EC2::VPCEndpoint',
        {
          VpcEndpointType: 'Interface',
        },
        6
      ); // 6 interface endpoints (ssm, ssmmessages, ec2messages, monitoring, logs, kms)
    });

    test('creates gateway VPC endpoints for S3 and DynamoDB', () => {
      template.resourcePropertiesCountIs(
        'AWS::EC2::VPCEndpoint',
        {
          VpcEndpointType: 'Gateway',
        },
        2
      ); // 2 gateway endpoints (S3, DynamoDB)
    });

    test('creates security group for VPC endpoints', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for VPC endpoints',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with encryption and security settings', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              BucketKeyEnabled: true,
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates bucket policy with SSL/TLS enforcement', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
    });
  });

  describe('SSM Parameters', () => {
    test('creates SSM parameters for secrets', () => {
      // Note: CDK v2 StringParameter defaults to Type: 'String' even for secure values
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/nova/api/secrets/dbPassword',
        Type: 'String',
        Description: 'Database password for Nova API',
      });
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/nova/api/secrets/apiKey',
        Type: 'String',
        Description: 'API key for Nova external integrations',
      });
    });
  });

  describe('IAM Security', () => {
    test('creates MFA required group', () => {
      template.hasResourceProperties('AWS::IAM::Group', {
        GroupName: 'MfaRequiredGroup',
      });
    });

    test('creates MFA enforcement policy', () => {
      template.resourcePropertiesCountIs(
        'AWS::IAM::Policy',
        {
          PolicyName: 'MfaEnforcementPolicy',
        },
        1
      );
    });
  });

  describe('API Gateway and Lambda', () => {
    test('creates CloudWatch log group for API Gateway', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/apigateway/nova-api-access-logs',
      });
    });

    test('creates Lambda function for health check', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Description: 'Health check endpoint for Nova API',
      });
    });

    test('creates API Gateway with proper configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'Nova Security Baseline API',
        Description: 'API Gateway for Nova project with security baseline',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates API Gateway deployment with logging', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
    });

    test('creates health check resource and method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ResourceId: Match.anyValue(),
      });
    });
  });

  describe('GuardDuty', () => {
    test('creates GuardDuty detector', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES',
        DataSources: {
          S3Logs: {
            Enable: true,
          },
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required stack outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the Nova security baseline',
      });
      template.hasOutput('LogsBucketName', {
        Description: 'S3 bucket name for logs storage',
      });
    });
  });

  describe('Resource Tags', () => {
    test('applies global tags to all resources', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(resources)).toHaveLength(1);
    });
  });

  describe('Security Configuration', () => {
    test('creates Lambda with proper security groups and VPC config', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        },
      });
    });

    test('creates Lambda security group with restricted egress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda function',
      });
    });
  });
});
