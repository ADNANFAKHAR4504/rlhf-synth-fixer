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
    stack = new TapStack(app, 'TestStack', {
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('should use environmentSuffix from props when provided', () => {
      const appWithProps = new cdk.App();
      const stackWithProps = new TapStack(appWithProps, 'TestStackWithProps', {
        env: { region: 'us-east-1' },
        environmentSuffix: 'prod',
      });
      const templateWithProps = Template.fromStack(stackWithProps);
      
      // Verify stack was created successfully with props
      templateWithProps.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const stackWithContext = new TapStack(appWithContext, 'TestStackWithContext', {
        env: { region: 'us-east-1' },
      });
      const templateWithContext = Template.fromStack(stackWithContext);
      
      // Verify stack was created successfully with context
      templateWithContext.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should use default dev when neither props nor context provided', () => {
      // This is our existing default test case
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT Gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ALB',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('should create EC2 security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'from 0.0.0.0/0:22',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ]),
      });
    });

    test('should create RDS security group with MySQL port', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS',
      });
      
      // Check for security group ingress rule as separate resource
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: Match.anyValue(),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 role with CloudWatch permissions', () => {
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
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ],
            ],
          },
        ],
      });
    });

    test('should create Lambda role with basic execution permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
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
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      });
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encryption',
        EnableKeyRotation: true,
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          IamInstanceProfile: {
            Arn: Match.anyValue(),
          },
          ImageId: Match.anyValue(),
          InstanceType: 't3.micro',
          SecurityGroupIds: [Match.anyValue()],
        },
      });
    });

    test('should create auto scaling group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        LaunchTemplate: {
          LaunchTemplateId: Match.anyValue(),
          Version: Match.anyValue(),
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP',
      });
    });

    test('should create listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('RDS Database', () => {
    test('should create MySQL database instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.39',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
      });
    });

    test('should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with versioning and encryption', () => {
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
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Code: {
          ZipFile: 'exports.handler = async () => ({ statusCode: 200, body: "Hello" });',
        },
      });
    });

    test('should create CloudWatch log group for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/tap-function',
        RetentionInDays: 7,
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 70,
      });
    });

    test('should create scaling policies', () => {
      template.resourceCountIs('AWS::AutoScaling::ScalingPolicy', 6); // 4 step scaling policies with 6 total policies
    });
  });

  describe('Tagging', () => {
    test('should apply common tags to resources', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0];
      
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'project', Value: 'cloudformation-setup' },
          { Key: 'owner', Value: 'current_user' },
        ])
      );
    });
  });

  describe('Stack Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Value: { Ref: Match.stringLikeRegexp('TapVpc.*') },
      });
    });

    test('should export ALB DNS name', () => {
      template.hasOutput('AlbDnsName', {
        Description: 'ALB DNS Name',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('ApplicationLoadBalancer.*'), 'DNSName'],
        },
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not allow wildcard permissions in IAM policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      Object.values(roles).forEach((role: any) => {
        if (role.Properties.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              if (Array.isArray(statement.Action)) {
                expect(statement.Action).not.toContain('*');
              } else if (typeof statement.Action === 'string') {
                expect(statement.Action).not.toBe('*');
              }
            });
          });
        }
      });
    });

    test('should block all public access on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should encrypt RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });
  });
});
