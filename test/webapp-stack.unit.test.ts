import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { WebAppStack } from '../lib/webapp-stack';

describe('WebAppStack', () => {
  let app: cdk.App;
  let stack: WebAppStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates two public subnets', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // Check for public subnets (only public subnets for LocalStack)
      template.resourceCountIs('AWS::EC2::Subnet', 2); // 2 public subnets

      // Verify public subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('does not create private subnets for LocalStack', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // LocalStack Community doesn't support NAT Gateway, so no private subnets
      // All subnets are public
      template.resourceCountIs('AWS::EC2::Subnet', 2); // Only public subnets
    });

    test('creates Internet Gateway', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('does not create NAT Gateways for LocalStack', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // NAT Gateway not supported in LocalStack Community
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
      template.resourceCountIs('AWS::EC2::EIP', 0);
    });

    test('creates VPC Flow Logs', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with correct rules', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // Check for HTTP ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('creates web server security group', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // Web server security group should exist
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers',
      });
    });

    test('creates database security group', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // Database security group should exist
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('allows web server to database communication on port 3306', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // Check for security group ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates Auto Scaling Group with correct configuration', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
      });
    });

    test('creates Launch Template', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.medium',
        }),
      });
    });

    test('configures EC2 instances with user data', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          UserData: Match.anyValue(),
        }),
      });
    });
  });

  describe('Load Balancer', () => {
    test('creates Application Load Balancer', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('creates Target Group', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckEnabled: true,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
        }
      );
    });

    test('creates ALB Listener on port 80', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Database', () => {
    test('creates RDS MySQL instance', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        StorageEncrypted: true,
        BackupRetentionPeriod: 0, // Disabled for LocalStack
        DeletionProtection: false,
        MultiAZ: false,
      });
    });

    test('creates database subnet group', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('creates Secrets Manager secret for database credentials', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS MySQL database credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\',
        }),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates S3 bucket for application assets', () => {
      stack = new WebAppStack(app, 'TestStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith(['webapp-assets-test-']),
          ]),
        }),
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

    test('enforces SSL for S3 bucket', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
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
  });

  describe('Monitoring', () => {
    test('creates CloudWatch alarms for Auto Scaling', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'GroupTotalInstances',
        Namespace: 'AWS/AutoScaling',
        Threshold: 4,
        EvaluationPeriods: 2,
      });
    });

    test('creates CloudWatch alarm for database connections', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        EvaluationPeriods: 2,
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates IAM role for EC2 instances', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

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
      });
    });

    test('attaches CloudWatch and SSM policies to EC2 role', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

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
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy'),
              ]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore'),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Tags', () => {
    test('applies tags to all resources', () => {
      const envSuffix = 'production';
      stack = new WebAppStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
      });
      template = Template.fromStack(stack);

      // Check VPC has tags - CDK adds tags in a specific order
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: envSuffix }),
          Match.objectLike({ Key: 'Project', Value: 'WebApplication' }),
        ]),
      });
    });
  });

  describe('Outputs', () => {
    test('exports Load Balancer DNS', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
      });
    });

    test('exports Database Endpoint', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('exports VPC ID', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasOutput('VPCId', {
        Description: 'ID of the VPC',
      });
    });

    test('exports S3 Bucket Name', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasOutput('S3BucketName', {
        Description: 'Name of the S3 bucket for application assets',
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('uses provided environment suffix', () => {
      const suffix = 'staging';
      stack = new WebAppStack(app, 'TestStack', { environmentSuffix: suffix });
      template = Template.fromStack(stack);

      // Check S3 bucket name includes suffix
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([`webapp-assets-${suffix}-`]),
          ]),
        }),
      });
    });

    test('defaults to dev when no suffix provided', () => {
      stack = new WebAppStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // Check S3 bucket name includes default 'dev'
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith(['webapp-assets-dev-']),
          ]),
        }),
      });
    });
  });
});
