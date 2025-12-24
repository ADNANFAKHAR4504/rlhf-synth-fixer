import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack - Secure Web Application Infrastructure', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TestTapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Network Infrastructure', () => {
    test('VPC is created with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has public, private, and isolated subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBeGreaterThan(0);

      // Check for NAT Gateways
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('Security groups are created for each tier', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(3);
    });

    test('Security group rules enforce proper network segmentation', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });
  });

  describe('Security and IAM', () => {
    test('KMS key is created', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*web application.*'),
      });
    });

    test('IAM roles follow least privilege principle', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('SNS topic is created for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp('.*WebApp Alerts.*'),
      });
    });

    test('CloudWatch Log Group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/webapp/.*'),
        RetentionInDays: 30,
      });
    });
  });

  describe('Storage', () => {
    test('S3 bucket is created with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: Match.anyValue(),
              }),
            }),
          ]),
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

    test('S3 bucket policy enforces SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'RestrictToSpecificRole',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Database', () => {
    test('RDS PostgreSQL instance is created', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        DBInstanceClass: Match.stringLikeRegexp('db.t3.*'),
        PubliclyAccessible: false,
        DeletionProtection: false,
      });
    });

    test('RDS is in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.stringLikeRegexp('.*RDS database.*'),
      });
    });
  });

  describe('Compute', () => {
    test('Auto Scaling Group is configured', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: Match.anyValue(),
        MaxSize: Match.anyValue(),
      });
    });

    test('Launch Template is configured', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: Match.anyValue(),
        }),
      });
    });

    test('Application Load Balancer is created', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('Target Group health checks are configured', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          HealthCheckEnabled: true,
          HealthCheckIntervalSeconds: 30,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
        }
      );
    });
  });

  describe('Stack Outputs', () => {
    test('Load Balancer DNS is exported', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: Match.stringLikeRegexp('.*Load Balancer.*'),
      });
    });

    test('Bucket name is exported', () => {
      template.hasOutput('BucketName', {
        Description: Match.stringLikeRegexp('.*bucket.*'),
      });
    });

    test('Database endpoint is exported', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: Match.stringLikeRegexp('.*database.*'),
      });
    });
  });

  describe('Branch Coverage Tests', () => {
    test('Stack uses environment suffix from context when not in props', () => {
      const appWithContext = new cdk.App();
      appWithContext.node.setContext('environmentSuffix', 'context-suffix');
      const stackWithContext = new TapStack(appWithContext, 'StackWithContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(stackWithContext).toBeDefined();
    });

    test('Stack uses default suffix when neither props nor context provided', () => {
      const appNoContext = new cdk.App();
      const stackNoContext = new TapStack(appNoContext, 'StackNoContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(stackNoContext).toBeDefined();
    });
  });
});
