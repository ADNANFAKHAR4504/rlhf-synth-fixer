import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Use environment variables like the actual implementation
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Create stack - no VPC lookup mocking needed since we now create VPC
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
    });

    template = Template.fromStack(stack);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('KMS Key Configuration', () => {
    test('should create a KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting EBS volumes and RDS database',
        EnableKeyRotation: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue(),
              },
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('should create a KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-${environmentSuffix}-key`,
        TargetKeyId: Match.anyValue(),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
        ],
      });
    });

    test('should create EC2 security group with ALB access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });

      // Check for security group ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 80,
        IpProtocol: 'tcp',
        ToPort: 80,
        SourceSecurityGroupId: Match.anyValue(),
      });
    });
  });

  describe('IAM Role for EC2', () => {
    test('should create EC2 role with proper managed policies', () => {
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
        ManagedPolicyArns: Match.arrayWith([
          // Check for SSM managed instance core policy
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '', // The delimiter (empty string)
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore'),
              ]),
            ]),
          }),
          // Check for CloudWatch agent policy
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '', // The delimiter (empty string)
              Match.arrayWith([
                Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should create instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `tap-${environmentSuffix}-instance-profile`,
        Roles: Match.anyValue(),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          LoadBalancerAttributes: Match.arrayWith([
            {
              Key: 'deletion_protection.enabled',
              Value: 'false',
            },
          ]),
          Name: `tap-${environmentSuffix}-alb`,
          Scheme: 'internet-facing',
          SecurityGroups: [Match.anyValue()],
          Type: 'application',
        }
      );
    });

    test('should create target group with health check configuration', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: `tap-${environmentSuffix}-tg`,
          Port: 80,
          Protocol: 'HTTP',
          TargetType: 'instance',
          HealthCheckEnabled: true,
          HealthCheckIntervalSeconds: 30,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          Matcher: {
            HttpCode: '200',
          },
          UnhealthyThresholdCount: 3,
        }
      );
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        DefaultActions: [
          {
            TargetGroupArn: Match.anyValue(),
            Type: 'forward',
          },
        ],
        LoadBalancerArn: Match.anyValue(),
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  // Note: CloudWatch Alarms removed for LocalStack compatibility

  describe('CloudFormation Outputs', () => {
    test('should create VpcId output', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `tap-${environmentSuffix}-vpc-id`,
        },
      });
    });

    test('should create LoadBalancerDNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
        Export: {
          Name: `tap-${environmentSuffix}-alb-dns`,
        },
      });
    });

    test('should create KMSKeyId output', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
        Export: {
          Name: `tap-${environmentSuffix}-kms-key-id`,
        },
      });
    });

    test('should create EC2RoleArn output', () => {
      template.hasOutput('EC2RoleArn', {
        Description: 'EC2 Instance Role ARN',
        Export: {
          Name: `tap-${environmentSuffix}-ec2-role-arn`,
        },
      });
    });

    test('should create TargetGroupArn output', () => {
      template.hasOutput('TargetGroupArn', {
        Description: 'Target Group ARN',
        Export: {
          Name: `tap-${environmentSuffix}-tg-arn`,
        },
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create a VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('should create VPC with proper naming', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`tap-${environmentSuffix}-vpc`),
          }),
        ]),
      });
    });

    test('should create subnets in multiple availability zones', () => {
      // Should have 4 subnets (2 public + 2 private isolated across 2 AZs)
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('should NOT create NAT Gateway (LocalStack compatibility)', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('should create Internet Gateway for public subnets', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Resource Counting', () => {
    test('should create expected number of security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    });

    test('should NOT create CloudWatch alarms (LocalStack compatibility)', () => {
      // CloudWatch alarms removed for LocalStack compatibility
      template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
    });

    test('should create one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('should create one Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });
  });

  describe('Naming Convention', () => {
    test('should follow project-stage-resource naming convention', () => {
      // Test that resource names follow the expected pattern
      const resources = template.toJSON().Resources;

      // Check KMS Key alias follows naming convention
      const kmsAliases = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::KMS::Alias'
      );
      expect(kmsAliases).toHaveLength(1);
      expect((kmsAliases[0] as any).Properties.AliasName).toBe(
        `alias/tap-${environmentSuffix}-key`
      );

      // Check ALB name follows naming convention
      const loadBalancers = Object.values(resources).filter(
        (resource: any) =>
          resource.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(loadBalancers).toHaveLength(1);
      expect((loadBalancers[0] as any).Properties.Name).toBe(
        `tap-${environmentSuffix}-alb`
      );
    });
  });

  describe('Stack Tags', () => {
    test('should apply proper tags to stack resources', () => {
      // Check that resources have proper tags by examining individual resources
      const resources = template.findResources('AWS::KMS::Key');
      const kmsKeyResource = Object.values(resources)[0] as any;

      expect(kmsKeyResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Project', Value: 'tap' }),
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
        ])
      );
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use provided environment suffix', () => {
      const customApp = new cdk.App();

      const customStack = new TapStack(customApp, 'TestStackCustom', {
        environmentSuffix: 'custom',
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
          region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
        },
      });

      const customTemplate = Template.fromStack(customStack);

      // Should use custom environment suffix in resource names
      customTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-custom-key',
      });
    });

    test('should use context environment suffix when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });

      const contextStack = new TapStack(contextApp, 'TestStackContext', {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
          region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);

      // Should use context environment suffix
      contextTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-context-env-key',
      });
    });
  });

  describe('Subnet Selection Logic', () => {
    test('should create VPC with both public and private isolated subnets', () => {
      // Verify VPC is created with proper subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          }),
        ]),
      });
    });
  });
});
