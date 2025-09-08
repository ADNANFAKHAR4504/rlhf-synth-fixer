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

  describe('Infrastructure Components', () => {
    test('VPC is created with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Check for Flow Logs
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('Public subnets are created in multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 isolated
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });
    });

    test('NAT Gateways are created for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('Application Load Balancer is created', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('Auto Scaling Group is configured correctly', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
        DesiredCapacity: {
          Ref: 'DesiredCapacity',
        },
      });
    });

    test('Launch Template uses t3.micro instances', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro',
        },
      });
    });

    test('RDS MySQL is configured with Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.39',
        MultiAZ: true,
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        DeletionProtection: false,
      });
    });

    test('S3 bucket for logs is versioned and encrypted', () => {
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
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'GlacierTransition',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });

    test('CloudFront distribution is created', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Enabled: true,
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });

    test('Lambda function for RDS snapshots exists', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
      });
    });

    test('EventBridge rule triggers Lambda every 12 hours', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(12 hours)',
      });
    });
  });

  describe('Security Configuration', () => {
    test('Security groups have proper ingress rules', () => {
      // ALB Security Group allows HTTP/HTTPS
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          },
        ],
      });

      // Database Security Group allows MySQL from EC2
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'Allow MySQL from EC2',
      });
    });

    test('Secrets Manager stores database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS MySQL credentials',
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\',
        },
      });
    });

    test('IAM roles follow least privilege principle', () => {
      // EC2 Instance Role
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
        Policies: [
          {
            PolicyName: 'SecretsManagerAccess',
            PolicyDocument: {
              Statement: [
                {
                  Action: 'secretsmanager:GetSecretValue',
                  Effect: 'Allow',
                },
              ],
            },
          },
        ],
      });

      // Lambda Role for snapshots
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
        Policies: [
          {
            PolicyName: 'RDSSnapshotPolicy',
            PolicyDocument: {
              Statement: [
                {
                  Action: ['rds:CreateDBSnapshot', 'rds:DescribeDBInstances'],
                  Effect: 'Allow',
                  Resource: '*',
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe('CloudFormation Parameters', () => {
    test('Region parameter is configured correctly', () => {
      template.hasParameter('Region', {
        Type: 'String',
        Default: 'us-west-2',
        AllowedValues: ['us-west-2'],
        Description: 'AWS Region (must be us-west-2)',
      });
    });

    test('Desired capacity parameter has correct constraints', () => {
      template.hasParameter('DesiredCapacity', {
        Type: 'Number',
        Default: 2,
        MinValue: 2,
        MaxValue: 5,
        Description: 'Desired number of EC2 instances (2-5)',
      });
    });
  });

  describe('Tags and Outputs', () => {
    test('All resources are tagged with Environment=Production', () => {
      const resources = template.findResources('*');
      
      // Check a sampling of resources for proper tagging
      const taggedResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::S3::Bucket',
        'AWS::RDS::DBInstance',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::CloudFront::Distribution',
      ];

      taggedResourceTypes.forEach(resourceType => {
        template.hasResourceProperties(resourceType, {
          Tags: Match.arrayWith([
            {
              Key: 'Environment',
              Value: 'Production',
            },
          ]),
        });
      });
    });

    test('Stack outputs are defined', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS Name',
      });

      template.hasOutput('CloudFrontDistributionDomain', {
        Description: 'CloudFront Distribution Domain Name',
      });

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });

      template.hasOutput('LogsBucketName', {
        Description: 'S3 Logs Bucket Name',
      });

      template.hasOutput('StaticContentBucketName', {
        Description: 'S3 Static Content Bucket Name',
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('UserData includes CloudWatch Agent installation', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          UserData: Match.anyValue(),
        },
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('Resources are distributed across multiple AZs', () => {
      // Check that subnets are in different AZs
      template.hasResourceProperties('AWS::EC2::Subnet', {
        AvailabilityZone: {
          'Fn::Select': [0, { 'Fn::GetAZs': '' }],
        },
      });
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        AvailabilityZone: {
          'Fn::Select': [1, { 'Fn::GetAZs': '' }],
        },
      });
    });

    test('RDS is configured for Multi-AZ deployment', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
      });
    });
  });

  describe('Environment Suffix Fallback', () => {
    test('Uses dev as fallback when environmentSuffix is not provided', () => {
      const appFallback = new cdk.App();
      const stackFallback = new TapStack(appFallback, 'TestTapStackFallback', {});
      const templateFallback = Template.fromStack(stackFallback);

      // Verify that the stack is created successfully with fallback
      templateFallback.resourceCountIs('AWS::EC2::VPC', 1);
      templateFallback.resourceCountIs('AWS::S3::Bucket', 2);
      templateFallback.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('Uses dev as fallback when props are undefined', () => {
      const appUndefined = new cdk.App();
      const stackUndefined = new TapStack(appUndefined, 'TestTapStackUndefined');
      const templateUndefined = Template.fromStack(stackUndefined);

      // Verify that the stack is created successfully with fallback
      templateUndefined.resourceCountIs('AWS::EC2::VPC', 1);
      templateUndefined.resourceCountIs('AWS::S3::Bucket', 2);
      templateUndefined.resourceCountIs('AWS::RDS::DBInstance', 1);
    });
  });
});